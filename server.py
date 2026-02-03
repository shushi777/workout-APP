from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from scenedetect import open_video, SceneManager, split_video_ffmpeg
from scenedetect.detectors import ContentDetector
import os
import csv
import shutil
from datetime import datetime
from werkzeug.utils import secure_filename
import psycopg2
from psycopg2.extras import RealDictCursor

# Phase 4 imports
from config import Config, get_config
from storage import create_storage, VideoStorage
from video_processing import (
    split_video_by_timeline,
    get_video_info,
    check_ffmpeg_installed,
    VideoProcessingError
)

app = Flask(__name__)
CORS(app)

# Load configuration
env = os.getenv('FLASK_ENV', 'development')
app_config = get_config(env)

# Validate configuration
try:
    app_config.validate()
except ValueError as e:
    print(f"Configuration Error: {e}")
    print("Please check your .env file and configuration settings")

# Apply Flask configuration
app.config['SECRET_KEY'] = app_config.SECRET_KEY
app.config['MAX_CONTENT_LENGTH'] = app_config.MAX_CONTENT_LENGTH
app.config['UPLOAD_FOLDER'] = app_config.UPLOAD_FOLDER
app.config['OUTPUT_FOLDER'] = app_config.OUTPUT_FOLDER

# Legacy configuration for backward compatibility
UPLOAD_FOLDER = app_config.UPLOAD_FOLDER
OUTPUT_FOLDER = app_config.OUTPUT_FOLDER
ALLOWED_EXTENSIONS = app_config.ALLOWED_EXTENSIONS
DB_CONFIG = app_config.DB_CONFIG

# Initialize storage backend
storage = create_storage(app_config.get_storage_config())
print(f"[Storage] Using {app_config.STORAGE_BACKEND} storage backend")

# Create folders if they don't exist
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(OUTPUT_FOLDER, exist_ok=True)

# Check FFmpeg availability
if not check_ffmpeg_installed():
    print("WARNING: FFmpeg is not installed or not accessible!")
    print("Video cutting functionality will not work without FFmpeg")
else:
    print("[FFmpeg] FFmpeg is available and ready")


def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


def get_db_connection():
    """Create and return a database connection"""
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        return conn
    except Exception as e:
        print(f"Database connection error: {e}")
        return None


def get_or_create_muscle_group(conn, name):
    """Get muscle group ID or create if doesn't exist"""
    cursor = conn.cursor()

    # Try to get existing
    cursor.execute("SELECT id FROM muscle_groups WHERE name = %s", (name.strip(),))
    result = cursor.fetchone()

    if result:
        return result[0]

    # Create new
    cursor.execute("INSERT INTO muscle_groups (name) VALUES (%s) RETURNING id", (name.strip(),))
    muscle_id = cursor.fetchone()[0]
    conn.commit()
    return muscle_id


def get_or_create_equipment(conn, name):
    """Get equipment ID or create if doesn't exist"""
    cursor = conn.cursor()

    # Try to get existing
    cursor.execute("SELECT id FROM equipment WHERE name = %s", (name.strip(),))
    result = cursor.fetchone()

    if result:
        return result[0]

    # Create new
    cursor.execute("INSERT INTO equipment (name) VALUES (%s) RETURNING id", (name.strip(),))
    equipment_id = cursor.fetchone()[0]
    conn.commit()
    return equipment_id


def detect_scenes(video_path, threshold=27.0, min_scene_len=15):
    """
    Detect scenes in a video using PySceneDetect

    Args:
        video_path: Path to the video file
        threshold: Threshold for scene detection (lower = more sensitive)
        min_scene_len: Minimum scene length in frames

    Returns:
        List of scenes (tuples of start and end timecodes)
    """
    video = open_video(video_path)
    scene_manager = SceneManager()

    # Add ContentDetector with threshold
    scene_manager.add_detector(
        ContentDetector(threshold=threshold, min_scene_len=min_scene_len)
    )

    # Detect scenes
    scene_manager.detect_scenes(video)

    # Get scene list
    scene_list = scene_manager.get_scene_list()

    return scene_list


def create_csv_report(scene_list, csv_path, video_path, tags=None):
    """Create a CSV report of detected scenes with optional tags"""
    with open(csv_path, 'w', newline='', encoding='utf-8') as csvfile:
        fieldnames = ['Scene Number', 'Start Time', 'End Time', 'Duration (seconds)',
                     'Start Frame', 'End Frame', 'Exercise Name', 'Muscle Groups', 'Required Equipment']
        writer = csv.DictWriter(csvfile, fieldnames=fieldnames)

        writer.writeheader()

        for i, scene in enumerate(scene_list, start=1):
            start_time = scene[0].get_seconds()
            end_time = scene[1].get_seconds()
            duration = end_time - start_time

            # Find tags for this scene
            exercise = ''
            muscle = ''
            equipment = ''
            if tags:
                for tag in tags:
                    if tag.get('scene') == i:
                        exercise = tag.get('exercise', '')
                        muscle = tag.get('muscle', '')
                        equipment = tag.get('equipment', '')
                        break

            writer.writerow({
                'Scene Number': i,
                'Start Time': scene[0].get_timecode(),
                'End Time': scene[1].get_timecode(),
                'Duration (seconds)': f'{duration:.2f}',
                'Start Frame': scene[0].get_frames(),
                'End Frame': scene[1].get_frames(),
                'Exercise Name': exercise,
                'Muscle Groups': muscle,
                'Required Equipment': equipment
            })


# React frontend static files directory
REACT_BUILD_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'static', 'react')


@app.route('/')
def index():
    return send_from_directory(REACT_BUILD_DIR, 'index.html')


@app.route('/manifest.webmanifest')
def manifest():
    return send_from_directory(REACT_BUILD_DIR, 'manifest.webmanifest')


@app.route('/sw.js')
def service_worker():
    return send_from_directory(REACT_BUILD_DIR, 'sw.js')


@app.route('/assets/<path:filename>')
def serve_assets(filename):
    return send_from_directory(os.path.join(REACT_BUILD_DIR, 'assets'), filename)


@app.route('/icons/<path:filename>')
def serve_icons(filename):
    return send_from_directory(os.path.join(REACT_BUILD_DIR, 'icons'), filename)


@app.route('/share-receiver', methods=['POST'])
def share_receiver():
    """Handle videos shared from other apps via Web Share Target API"""
    print(f"DEBUG: Share receiver - Content-Type: {request.content_type}")
    print(f"DEBUG: Share receiver files: {request.files}")

    # Check if video file is present
    if 'video' not in request.files:
        print("ERROR: No video file in share")
        # Redirect to home page with error message
        return '''
            <html dir="rtl">
            <head>
                <meta http-equiv="refresh" content="3;url=/" />
                <meta charset="UTF-8">
                <style>body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }</style>
            </head>
            <body>
                <h2>לא התקבל קובץ וידאו</h2>
                <p>מפנה לדף הבית...</p>
            </body>
            </html>
        ''', 400

    file = request.files['video']

    if file.filename == '':
        print("ERROR: Empty filename in share")
        return '''
            <html dir="rtl">
            <head>
                <meta http-equiv="refresh" content="3;url=/" />
                <meta charset="UTF-8">
                <style>body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }</style>
            </head>
            <body>
                <h2>קובץ וידאו לא תקין</h2>
                <p>מפנה לדף הבית...</p>
            </body>
            </html>
        ''', 400

    if file and allowed_file(file.filename):
        # Save the shared video temporarily
        filename = secure_filename(file.filename)
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        base_name = os.path.splitext(filename)[0]
        ext = os.path.splitext(filename)[1]
        unique_filename = f"shared_{timestamp}_{filename}"
        video_path = os.path.join(app.config['UPLOAD_FOLDER'], unique_filename)

        try:
            file.save(video_path)
            print(f"SUCCESS: Shared video saved as {unique_filename}")

            # Process the video with scene detection (using default settings)
            threshold = 27.0  # Default threshold
            min_scene_length = 0.6  # Default minimum scene length

            try:
                # Detect scenes
                video = open_video(video_path)
                fps = video.frame_rate
                min_scene_len_frames = int(min_scene_length * fps)
                scene_list = detect_scenes(video_path, threshold=threshold, min_scene_len=min_scene_len_frames)

                # Get video duration
                video_duration = 0
                if scene_list:
                    video_duration = scene_list[-1][1].get_seconds()
                else:
                    from video_processing import get_video_info
                    video_info = get_video_info(video_path)
                    video_duration = video_info['duration']

                # Close the video file
                del video

                # Create output directory
                output_dir = os.path.join(app.config['OUTPUT_FOLDER'], f"{base_name}_{timestamp}")
                os.makedirs(output_dir, exist_ok=True)

                # Move video to output directory
                stored_video_path = os.path.join(output_dir, unique_filename)
                shutil.move(video_path, stored_video_path)

                # Extract cut points
                suggested_cuts = []
                if scene_list:
                    for i, scene in enumerate(scene_list):
                        if i < len(scene_list) - 1:
                            end_time = scene[1].get_seconds()
                            suggested_cuts.append(end_time)

                print(f"[Share Receiver] Processed shared video: {len(scene_list)} scenes, {len(suggested_cuts)} cuts")

                # Redirect to timeline editor with suggested cuts
                cuts_param = ','.join(map(str, suggested_cuts)) if suggested_cuts else ''
                video_url = f"/download/{os.path.basename(output_dir)}/{unique_filename}"
                redirect_url = f"/editor?video={video_url}&cuts={cuts_param}"

                return f'''
                    <html dir="rtl">
                    <head>
                        <meta http-equiv="refresh" content="1;url={redirect_url}" />
                        <meta charset="UTF-8">
                        <style>
                            body {{
                                font-family: Arial, sans-serif;
                                text-align: center;
                                padding: 50px;
                                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                                color: white;
                            }}
                            .spinner {{
                                border: 4px solid rgba(255,255,255,0.3);
                                border-radius: 50%;
                                border-top: 4px solid white;
                                width: 40px;
                                height: 40px;
                                animation: spin 1s linear infinite;
                                margin: 20px auto;
                            }}
                            @keyframes spin {{
                                0% {{ transform: rotate(0deg); }}
                                100% {{ transform: rotate(360deg); }}
                            }}
                        </style>
                    </head>
                    <body>
                        <h2>✅ הוידאו התקבל בהצלחה!</h2>
                        <div class="spinner"></div>
                        <p>מעבד ומזהה סצינות...</p>
                        <p>מיד תועבר לעורך הטיימליין</p>
                    </body>
                    </html>
                '''

            except Exception as processing_error:
                print(f"ERROR: Failed to process shared video: {processing_error}")
                # If processing fails, still allow user to use the video manually
                # Move to output folder without processing
                output_dir = os.path.join(app.config['OUTPUT_FOLDER'], f"{base_name}_{timestamp}")
                os.makedirs(output_dir, exist_ok=True)
                stored_video_path = os.path.join(output_dir, unique_filename)
                if os.path.exists(video_path):
                    shutil.move(video_path, stored_video_path)

                video_url = f"/download/{os.path.basename(output_dir)}/{unique_filename}"
                redirect_url = f"/editor?video={video_url}&cuts="

                return f'''
                    <html dir="rtl">
                    <head>
                        <meta http-equiv="refresh" content="2;url={redirect_url}" />
                        <meta charset="UTF-8">
                        <style>body {{ font-family: Arial, sans-serif; text-align: center; padding: 50px; }}</style>
                    </head>
                    <body>
                        <h2>⚠️ לא הצלחתי לזהות סצינות אוטומטית</h2>
                        <p>הוידאו נשמר בהצלחה</p>
                        <p>מפנה לעורך - תוכל להוסיף נקודות חיתוך ידנית</p>
                    </body>
                    </html>
                '''

        except Exception as e:
            print(f"ERROR: Failed to save shared video: {e}")
            return '''
                <html dir="rtl">
                <head>
                    <meta http-equiv="refresh" content="3;url=/" />
                    <meta charset="UTF-8">
                    <style>body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }</style>
                </head>
                <body>
                    <h2>❌ שגיאה בשמירת הוידאו</h2>
                    <p>מפנה לדף הבית...</p>
                </body>
                </html>
            ''', 500
    else:
        print(f"ERROR: Invalid file type: {file.filename}")
        return '''
            <html dir="rtl">
            <head>
                <meta http-equiv="refresh" content="3;url=/" />
                <meta charset="UTF-8">
                <style>body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }</style>
            </head>
            <body>
                <h2>❌ פורמט וידאו לא נתמך</h2>
                <p>אנא שתף קובץ וידאו (MP4, AVI, MOV, MKV, FLV, WMV)</p>
                <p>מפנה לדף הבית...</p>
            </body>
            </html>
        ''', 400


@app.route('/process', methods=['POST'])
def process_video():
    """Process uploaded video and detect scenes"""

    print(f"DEBUG: Request received - Content-Type: {request.content_type}")
    print(f"DEBUG: Request files: {request.files}")
    print(f"DEBUG: Request form: {request.form}")

    # Check if file is present
    if 'video' not in request.files:
        error_msg = 'No video file provided'
        print(f"ERROR: {error_msg}")
        return jsonify({'error': error_msg}), 400

    file = request.files['video']

    if file.filename == '':
        error_msg = 'No file selected'
        print(f"ERROR: {error_msg}")
        return jsonify({'error': error_msg}), 400

    if not allowed_file(file.filename):
        error_msg = f'Invalid file type for {file.filename}. Supported formats: MP4, AVI, MOV, MKV, FLV, WMV'
        print(f"ERROR: {error_msg}")
        return jsonify({'error': error_msg}), 400

    # Get parameters
    try:
        threshold = float(request.form.get('threshold', 27.0))
        min_scene_length = float(request.form.get('min_scene_length', 0.6))
        print(f"DEBUG: Parameters - threshold={threshold}, min_scene_length={min_scene_length}")
    except ValueError as e:
        error_msg = f'Invalid threshold or min_scene_length value: {str(e)}'
        print(f"ERROR: {error_msg}")
        return jsonify({'error': error_msg}), 400

    # Save uploaded file
    filename = secure_filename(file.filename)
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    base_name = os.path.splitext(filename)[0]
    ext = os.path.splitext(filename)[1]

    unique_filename = f"{base_name}_{timestamp}{ext}"
    video_path = os.path.join(app.config['UPLOAD_FOLDER'], unique_filename)
    file.save(video_path)

    try:
        # Detect scenes
        # Convert min_scene_length from seconds to frames (assuming 30fps, will be auto-detected)
        video = open_video(video_path)
        fps = video.frame_rate

        min_scene_len_frames = int(min_scene_length * fps)

        scene_list = detect_scenes(video_path, threshold=threshold, min_scene_len=min_scene_len_frames)

        # Close the video file to release the file handle
        del video

        # Get video duration from scene list if available, otherwise get it from video metadata
        video_duration = 0
        if scene_list:
            video_duration = scene_list[-1][1].get_seconds()
        else:
            # Get video duration from video metadata
            from video_processing import get_video_info
            video_info = get_video_info(video_path)
            video_duration = video_info['duration']

        # Create output directory for this video to store temporarily
        output_dir = os.path.join(app.config['OUTPUT_FOLDER'], f"{base_name}_{timestamp}")
        os.makedirs(output_dir, exist_ok=True)

        # Move the uploaded video to output directory (don't delete yet)
        stored_video_path = os.path.join(output_dir, unique_filename)

        # Use shutil.move instead of os.rename for cross-device compatibility
        shutil.move(video_path, stored_video_path)

        # Extract cut point times from scene_list
        # Scene list contains (start_timecode, end_timecode) tuples
        # We want the END times as cut points (transitions between scenes)
        suggested_cuts = []
        if scene_list:
            for i, scene in enumerate(scene_list):
                if i < len(scene_list) - 1:  # Don't include the last scene's end time
                    end_time = scene[1].get_seconds()
                    suggested_cuts.append(end_time)

        print(f"DEBUG: Scene detection result - {len(scene_list)} scenes detected, suggested cuts: {suggested_cuts}")

        # Return data for timeline editor (even if no scenes detected)
        cuts_param = ','.join(map(str, suggested_cuts)) if suggested_cuts else ''
        return jsonify({
            'success': True,
            'scene_count': len(scene_list),
            'video_url': f"/download/{os.path.basename(output_dir)}/{unique_filename}",
            'suggested_cuts': suggested_cuts,
            'video_duration': video_duration,
            'redirect_url': f"/editor?video=/download/{os.path.basename(output_dir)}/{unique_filename}&cuts={cuts_param}"
        })

    except Exception as e:
        print(f"ERROR: Processing failed: {e}")
        return jsonify({'error': f'Processing failed: {str(e)}'}), 500


@app.route('/download/<folder>/<filename>')
def download_file(folder, filename):
    """Serve generated files for download or streaming"""
    directory = os.path.join(app.config['OUTPUT_FOLDER'], folder)
    # If it's a video file, serve for streaming (not download)
    if filename.lower().endswith(('.mp4', '.avi', '.mov', '.mkv', '.flv', '.wmv')):
        return send_from_directory(directory, filename, as_attachment=False)
    return send_from_directory(directory, filename, as_attachment=True)


@app.route('/reprocess', methods=['GET'])
def reprocess_video():
    """
    Reprocess an existing video with new detection settings
    Query Parameters:
        - path: Path to the video file (relative to server)
        - threshold: Detection threshold (1-100)
        - min_scene_length: Minimum scene length in seconds
    """
    try:
        video_path_param = request.args.get('path')
        threshold = float(request.args.get('threshold', 27.0))
        min_scene_length = float(request.args.get('min_scene_length', 0.6))

        if not video_path_param:
            return jsonify({'error': 'Video path is required'}), 400

        # Security check - ensure path is within output folder
        video_path = os.path.normpath(video_path_param)
        if not video_path.startswith('output'):
            return jsonify({'error': 'Invalid video path'}), 400

        # Check if file exists
        if not os.path.exists(video_path):
            return jsonify({'error': f'Video file not found: {video_path}'}), 404

        print(f"[Reprocess] Video: {video_path}, Threshold: {threshold}, Min scene: {min_scene_length}")

        # Open video and get FPS
        video = open_video(video_path)
        fps = video.frame_rate
        min_scene_len_frames = int(min_scene_length * fps)

        # Detect scenes
        scene_list = detect_scenes(video_path, threshold=threshold, min_scene_len=min_scene_len_frames)

        # Close video
        del video

        if not scene_list:
            return jsonify({
                'success': True,
                'scene_count': 0,
                'suggested_cuts': [],
                'message': 'No scenes detected with these settings'
            })

        # Extract cut points
        suggested_cuts = []
        for i, scene in enumerate(scene_list):
            if i < len(scene_list) - 1:
                end_time = scene[1].get_seconds()
                suggested_cuts.append(end_time)

        print(f"[Reprocess] Found {len(scene_list)} scenes, {len(suggested_cuts)} cut points")

        return jsonify({
            'success': True,
            'scene_count': len(scene_list),
            'suggested_cuts': suggested_cuts
        })

    except Exception as e:
        print(f"ERROR: Reprocessing failed: {e}")
        return jsonify({'error': f'Reprocessing failed: {str(e)}'}), 500


@app.route('/get-tags', methods=['GET'])
def get_tags():
    """Get all unique muscle groups and equipment for autocomplete"""
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Database connection failed'}), 500

        cursor = conn.cursor(cursor_factory=RealDictCursor)

        # Get all muscle groups
        cursor.execute("SELECT name FROM muscle_groups ORDER BY name")
        muscle_groups = [row['name'] for row in cursor.fetchall()]

        # Get all equipment
        cursor.execute("SELECT name FROM equipment ORDER BY name")
        equipment = [row['name'] for row in cursor.fetchall()]

        cursor.close()
        conn.close()

        return jsonify({
            'muscle_groups': muscle_groups,
            'equipment': equipment
        })

    except Exception as e:
        return jsonify({'error': f'Failed to get tags: {str(e)}'}), 500


@app.route('/save-tags', methods=['POST'])
def save_tags():
    """Save exercises to PostgreSQL database (only kept scenes)"""
    try:
        data = request.get_json()
        output_folder = data.get('output_folder')
        tags = data.get('tags', [])

        if not output_folder or not os.path.exists(output_folder):
            return jsonify({'error': 'Invalid output folder'}), 400

        # Connect to database
        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Database connection failed'}), 500

        cursor = conn.cursor()
        saved_count = 0

        # Read the CSV to get scene duration information
        csv_files = [f for f in os.listdir(output_folder) if f.endswith('_scenes.csv')]
        scene_durations = {}

        if csv_files:
            csv_path = os.path.join(output_folder, csv_files[0])
            with open(csv_path, 'r', newline='', encoding='utf-8') as csvfile:
                reader = csv.DictReader(csvfile)
                for row in reader:
                    scene_num = int(row['Scene Number'])
                    scene_durations[scene_num] = float(row['Duration (seconds)'])

        # Process each kept scene
        for tag in tags:
            if not tag.get('keep', True):
                continue

            scene_num = tag.get('scene')
            exercise_name = tag.get('exercise', '').strip()
            muscle_groups_str = tag.get('muscle', '').strip()
            equipment_str = tag.get('equipment', '').strip()

            # Find the video file path for this scene
            video_file_path = None
            for filename in os.listdir(output_folder):
                if filename.endswith(('.mp4', '.avi', '.mov', '.mkv', '.flv', '.wmv')):
                    if f"-Scene-{scene_num:03d}" in filename:
                        video_file_path = os.path.join(output_folder, filename)
                        break

            if not video_file_path:
                continue

            # Get duration for this scene
            duration = scene_durations.get(scene_num, 0.0)

            # Insert exercise
            cursor.execute(
                """INSERT INTO exercises (video_file_path, exercise_name, duration)
                   VALUES (%s, %s, %s) RETURNING id""",
                (video_file_path, exercise_name if exercise_name else None, duration)
            )
            exercise_id = cursor.fetchone()[0]

            # Process muscle groups (comma-separated)
            if muscle_groups_str:
                muscle_list = [m.strip() for m in muscle_groups_str.split(',') if m.strip()]
                for muscle_name in muscle_list:
                    muscle_id = get_or_create_muscle_group(conn, muscle_name)
                    cursor.execute(
                        "INSERT INTO exercise_muscle_groups (exercise_id, muscle_group_id) VALUES (%s, %s)",
                        (exercise_id, muscle_id)
                    )

            # Process equipment (comma-separated)
            if equipment_str:
                equipment_list = [e.strip() for e in equipment_str.split(',') if e.strip()]
                for equipment_name in equipment_list:
                    equipment_id = get_or_create_equipment(conn, equipment_name)
                    cursor.execute(
                        "INSERT INTO exercise_equipment (exercise_id, equipment_id) VALUES (%s, %s)",
                        (exercise_id, equipment_id)
                    )

            saved_count += 1

        # Commit all changes
        conn.commit()
        cursor.close()
        conn.close()

        return jsonify({
            'success': True,
            'saved_count': saved_count,
            'message': f'Saved {saved_count} exercises to database'
        })

    except Exception as e:
        if conn:
            conn.rollback()
        return jsonify({'error': f'Failed to save to database: {str(e)}'}), 500


@app.route('/api/timeline/save', methods=['POST'])
def save_timeline():
    """
    Save timeline with cut points and exercise segments
    Phase 4: Now includes FFmpeg video cutting and storage upload
    """
    try:
        data = request.get_json()
        video_url = data.get('videoUrl')
        cut_points = data.get('cutPoints', [])
        segments = data.get('segments', [])

        if not video_url or not segments:
            return jsonify({'error': 'Invalid timeline data'}), 400

        print(f"[Timeline Save] Processing {len(segments)} segments")

        # Extract the original video path from the URL
        # video_url format: /download/folder_name/filename.ext
        parts = video_url.split('/')
        if len(parts) < 4:
            return jsonify({'error': 'Invalid video URL format'}), 400

        folder_name = parts[2]
        filename = parts[3]
        original_video_path = os.path.join(app.config['OUTPUT_FOLDER'], folder_name, filename)

        # Verify original video exists
        if not os.path.exists(original_video_path):
            return jsonify({'error': f'Original video not found: {original_video_path}'}), 404

        print(f"[Timeline Save] Original video: {original_video_path}")

        # Create output folder for segments
        segments_output_folder = os.path.join(app.config['OUTPUT_FOLDER'], folder_name, 'segments')
        os.makedirs(segments_output_folder, exist_ok=True)

        # Phase 4: Cut video into segments using FFmpeg
        print("[Timeline Save] Starting video cutting with FFmpeg...")
        try:
            cut_results = split_video_by_timeline(
                video_path=original_video_path,
                segments=segments,
                output_folder=segments_output_folder,
                base_name=os.path.splitext(filename)[0],
                codec=app_config.VIDEO_CODEC,
                preset=app_config.VIDEO_PRESET,
                crf=app_config.VIDEO_CRF
            )
            print(f"[Timeline Save] Video cutting completed: {len(cut_results)} segments processed")
        except VideoProcessingError as e:
            print(f"[Timeline Save] Video cutting failed: {e}")
            return jsonify({'error': f'Video processing failed: {str(e)}'}), 500

        # Connect to database
        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Database connection failed'}), 500

        cursor = conn.cursor()
        saved_count = 0

        # Save each segment to database
        upload_errors = []
        for result in cut_results:
            try:
                # Phase 6: Upload segment video and thumbnail to storage with error handling
                segment_filename = os.path.basename(result['video_path'])
                thumbnail_filename = os.path.basename(result['thumbnail_path'])

                # Upload video file with retry logic
                try:
                    video_storage_path = storage.save(
                        file_data=result['video_path'],
                        filename=segment_filename,
                        folder=f"{folder_name}/segments"
                    )
                    video_url = storage.get_url(video_storage_path)
                    print(f"[Timeline Save] Uploaded video segment {result['segment_index']}: {video_url}")
                except Exception as upload_error:
                    error_msg = f"Failed to upload video segment {result['segment_index']}: {str(upload_error)}"
                    print(f"[Timeline Save] ERROR: {error_msg}")
                    upload_errors.append(error_msg)
                    continue  # Skip this segment if video upload fails

                # Upload thumbnail file with retry logic
                try:
                    thumbnail_storage_path = storage.save(
                        file_data=result['thumbnail_path'],
                        filename=thumbnail_filename,
                        folder=f"{folder_name}/thumbnails"
                    )
                    thumbnail_url = storage.get_url(thumbnail_storage_path)
                    print(f"[Timeline Save] Uploaded thumbnail {result['segment_index']}: {thumbnail_url}")
                except Exception as upload_error:
                    error_msg = f"Failed to upload thumbnail {result['segment_index']}: {str(upload_error)}"
                    print(f"[Timeline Save] WARNING: {error_msg}")
                    upload_errors.append(error_msg)
                    # Continue anyway - thumbnail is not critical, use placeholder or skip
                    thumbnail_url = None  # Will store NULL in database

                # Insert exercise with Phase 4 fields
                cursor.execute(
                    """INSERT INTO exercises
                       (video_file_path, exercise_name, duration, start_time, end_time,
                        remove_audio, thumbnail_url)
                       VALUES (%s, %s, %s, %s, %s, %s, %s)
                       RETURNING id""",
                    (
                        video_url,  # Now stores storage URL instead of local path
                        result['exercise_name'],
                        result['duration'],
                        result['start_time'],  # NEW: Phase 4
                        result['end_time'],    # NEW: Phase 4
                        result['remove_audio'], # NEW: Phase 4
                        thumbnail_url          # NEW: Phase 4
                    )
                )
                exercise_id = cursor.fetchone()[0]

                # Process muscle groups
                for muscle_name in result['muscle_groups']:
                    if muscle_name.strip():
                        muscle_id = get_or_create_muscle_group(conn, muscle_name.strip())
                        cursor.execute(
                            "INSERT INTO exercise_muscle_groups (exercise_id, muscle_group_id) VALUES (%s, %s)",
                            (exercise_id, muscle_id)
                        )

                # Process equipment
                for equipment_name in result['equipment']:
                    if equipment_name.strip():
                        equipment_id = get_or_create_equipment(conn, equipment_name.strip())
                        cursor.execute(
                            "INSERT INTO exercise_equipment (exercise_id, equipment_id) VALUES (%s, %s)",
                            (exercise_id, equipment_id)
                        )

                saved_count += 1
                print(f"[Timeline Save] Saved exercise {saved_count}: {result['exercise_name']}")

            except Exception as e:
                print(f"[Timeline Save] Failed to save segment {result['segment_index']}: {e}")
                # Continue with other segments
                continue

        # Commit all changes
        conn.commit()
        cursor.close()
        conn.close()

        print(f"[Timeline Save] Successfully saved {saved_count} exercises to database")

        # Phase 6: Cleanup - Delete original video and local segments (if using cloud storage)
        cleanup_success = True
        try:
            # Delete original full video (we only need the segments now)
            if os.path.exists(original_video_path):
                os.remove(original_video_path)
                print(f"[Cleanup] Deleted original video: {original_video_path}")

            # If using cloud storage (R2 or S3), delete local segment files
            if app_config.STORAGE_BACKEND in ['r2', 's3']:
                # Delete segment video files
                for result in cut_results:
                    if os.path.exists(result['video_path']):
                        os.remove(result['video_path'])
                        print(f"[Cleanup] Deleted local segment: {result['video_path']}")

                    if os.path.exists(result['thumbnail_path']):
                        os.remove(result['thumbnail_path'])
                        print(f"[Cleanup] Deleted local thumbnail: {result['thumbnail_path']}")

                # Delete empty segment folders
                segments_folder = os.path.join(app.config['OUTPUT_FOLDER'], folder_name, 'segments')
                thumbnails_folder = os.path.join(app.config['OUTPUT_FOLDER'], folder_name, 'thumbnails')

                if os.path.exists(segments_folder) and not os.listdir(segments_folder):
                    os.rmdir(segments_folder)
                    print(f"[Cleanup] Deleted empty folder: {segments_folder}")

                if os.path.exists(thumbnails_folder) and not os.listdir(thumbnails_folder):
                    os.rmdir(thumbnails_folder)
                    print(f"[Cleanup] Deleted empty folder: {thumbnails_folder}")

                # Delete video folder if empty
                video_folder = os.path.join(app.config['OUTPUT_FOLDER'], folder_name)
                if os.path.exists(video_folder) and not os.listdir(video_folder):
                    os.rmdir(video_folder)
                    print(f"[Cleanup] Deleted empty folder: {video_folder}")

        except Exception as cleanup_error:
            print(f"[Cleanup] Warning: Cleanup failed: {cleanup_error}")
            cleanup_success = False
            # Don't fail the request if cleanup fails - exercises are already saved

        # Return result with upload errors if any
        response = {
            'success': True,
            'saved_count': saved_count,
            'message': f'Saved {saved_count} exercises to database',
            'segments_processed': len(cut_results),
            'cleanup_success': cleanup_success
        }

        if upload_errors:
            response['upload_errors'] = upload_errors
            response['warning'] = f"{len(upload_errors)} upload errors occurred (see upload_errors)"

        return jsonify(response)

    except Exception as e:
        print(f"ERROR: Failed to save timeline: {e}")
        if 'conn' in locals() and conn:
            conn.rollback()
        return jsonify({'error': f'Failed to save timeline: {str(e)}'}), 500


@app.route('/api/exercises', methods=['GET'])
def get_exercises():
    """
    Get exercises with filtering and pagination
    Phase 4: Filtering endpoint for exercise library

    Query Parameters:
        - page: Page number (default: 1)
        - per_page: Items per page (default: 20, max: 100)
        - search: Search in exercise name
        - muscle_groups: Filter by muscle groups (comma-separated)
        - equipment: Filter by equipment (comma-separated)
        - sort_by: Sort field (created_at, duration, exercise_name)
        - sort_order: Sort order (asc, desc)
    """
    try:
        # Get query parameters
        page = max(1, int(request.args.get('page', 1)))
        per_page = min(100, max(1, int(request.args.get('per_page', 20))))
        search = request.args.get('search', '').strip()
        muscle_groups_param = request.args.get('muscle_groups', '').strip()
        equipment_param = request.args.get('equipment', '').strip()
        sort_by = request.args.get('sort_by', 'created_at')
        sort_order = request.args.get('sort_order', 'desc').upper()

        # Validate sort parameters
        allowed_sort_fields = ['created_at', 'duration', 'exercise_name']
        if sort_by not in allowed_sort_fields:
            sort_by = 'created_at'
        if sort_order not in ['ASC', 'DESC']:
            sort_order = 'DESC'

        # Parse filter lists
        muscle_groups_filter = [mg.strip() for mg in muscle_groups_param.split(',') if mg.strip()]
        equipment_filter = [eq.strip() for eq in equipment_param.split(',') if eq.strip()]

        # Connect to database
        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Database connection failed'}), 500

        cursor = conn.cursor(cursor_factory=RealDictCursor)

        # Build query
        query = """
            SELECT DISTINCT
                e.id,
                e.video_file_path,
                e.exercise_name,
                e.duration,
                e.start_time,
                e.end_time,
                e.remove_audio,
                e.thumbnail_url,
                e.created_at,
                ARRAY_AGG(DISTINCT mg.name) FILTER (WHERE mg.name IS NOT NULL) as muscle_groups,
                ARRAY_AGG(DISTINCT eq.name) FILTER (WHERE eq.name IS NOT NULL) as equipment
            FROM exercises e
            LEFT JOIN exercise_muscle_groups emg ON e.id = emg.exercise_id
            LEFT JOIN muscle_groups mg ON emg.muscle_group_id = mg.id
            LEFT JOIN exercise_equipment ee ON e.id = ee.exercise_id
            LEFT JOIN equipment eq ON ee.equipment_id = eq.id
            WHERE 1=1
        """
        params = []

        # Add search filter
        if search:
            query += " AND LOWER(e.exercise_name) LIKE LOWER(%s)"
            params.append(f'%{search}%')

        # Add muscle groups filter
        if muscle_groups_filter:
            placeholders = ','.join(['%s'] * len(muscle_groups_filter))
            query += f"""
                AND e.id IN (
                    SELECT emg2.exercise_id
                    FROM exercise_muscle_groups emg2
                    JOIN muscle_groups mg2 ON emg2.muscle_group_id = mg2.id
                    WHERE mg2.name IN ({placeholders})
                )
            """
            params.extend(muscle_groups_filter)

        # Add equipment filter
        if equipment_filter:
            placeholders = ','.join(['%s'] * len(equipment_filter))
            query += f"""
                AND e.id IN (
                    SELECT ee2.exercise_id
                    FROM exercise_equipment ee2
                    JOIN equipment eq2 ON ee2.equipment_id = eq2.id
                    WHERE eq2.name IN ({placeholders})
                )
            """
            params.extend(equipment_filter)

        # Add GROUP BY
        query += """
            GROUP BY e.id, e.video_file_path, e.exercise_name, e.duration,
                     e.start_time, e.end_time, e.remove_audio, e.thumbnail_url, e.created_at
        """

        # Add sorting
        query += f" ORDER BY e.{sort_by} {sort_order}"

        # Get total count (before pagination)
        count_query = f"SELECT COUNT(*) as total FROM ({query}) as subquery"
        cursor.execute(count_query, params)
        total_count = cursor.fetchone()['total']

        # Add pagination
        offset = (page - 1) * per_page
        query += " LIMIT %s OFFSET %s"
        params.extend([per_page, offset])

        # Execute query
        cursor.execute(query, params)
        exercises = cursor.fetchall()

        # Calculate pagination info
        total_pages = (total_count + per_page - 1) // per_page

        # Get all unique muscle groups and equipment for filters
        cursor.execute("SELECT DISTINCT name FROM muscle_groups ORDER BY name")
        all_muscle_groups = [row['name'] for row in cursor.fetchall()]

        cursor.execute("SELECT DISTINCT name FROM equipment ORDER BY name")
        all_equipment = [row['name'] for row in cursor.fetchall()]

        # Convert exercises to include video_url field for frontend
        exercises_with_urls = []
        for exercise in exercises:
            exercise_dict = dict(exercise)
            # Ensure video_url is set (use video_file_path as video_url)
            exercise_dict['video_url'] = exercise_dict.get('video_file_path', '')
            exercises_with_urls.append(exercise_dict)

        cursor.close()
        conn.close()

        return jsonify({
            'success': True,
            'exercises': exercises_with_urls,
            'muscle_groups': all_muscle_groups,
            'equipment': all_equipment,
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total_count': total_count,
                'total_pages': total_pages,
                'has_next': page < total_pages,
                'has_prev': page > 1
            }
        })

    except Exception as e:
        print(f"ERROR: Failed to get exercises: {e}")
        return jsonify({'error': f'Failed to get exercises: {str(e)}'}), 500


@app.route('/api/exercises/<int:exercise_id>', methods=['GET'])
def get_exercise(exercise_id):
    """
    Get a single exercise by ID
    Phase 5: Individual exercise retrieval
    """
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Database connection failed'}), 500

        cursor = conn.cursor(cursor_factory=RealDictCursor)

        query = """
            SELECT
                e.id,
                e.video_file_path,
                e.exercise_name,
                e.duration,
                e.start_time,
                e.end_time,
                e.remove_audio,
                e.thumbnail_url,
                e.created_at,
                ARRAY_AGG(DISTINCT mg.name) FILTER (WHERE mg.name IS NOT NULL) as muscle_groups,
                ARRAY_AGG(DISTINCT eq.name) FILTER (WHERE eq.name IS NOT NULL) as equipment
            FROM exercises e
            LEFT JOIN exercise_muscle_groups emg ON e.id = emg.exercise_id
            LEFT JOIN muscle_groups mg ON emg.muscle_group_id = mg.id
            LEFT JOIN exercise_equipment ee ON e.id = ee.exercise_id
            LEFT JOIN equipment eq ON ee.equipment_id = eq.id
            WHERE e.id = %s
            GROUP BY e.id
        """

        cursor.execute(query, (exercise_id,))
        exercise = cursor.fetchone()

        cursor.close()
        conn.close()

        if not exercise:
            return jsonify({'error': 'Exercise not found'}), 404

        exercise_dict = dict(exercise)
        exercise_dict['video_url'] = exercise_dict.get('video_file_path', '')

        return jsonify({
            'success': True,
            'exercise': exercise_dict
        })

    except Exception as e:
        print(f"ERROR: Failed to get exercise: {e}")
        return jsonify({'error': f'Failed to get exercise: {str(e)}'}), 500


@app.route('/api/exercises/<int:exercise_id>', methods=['PUT'])
def update_exercise(exercise_id):
    """
    Update an exercise
    Phase 5: Exercise editing endpoint
    """
    try:
        data = request.get_json()
        exercise_name = data.get('exercise_name', '').strip()
        muscle_groups = data.get('muscle_groups', [])
        equipment = data.get('equipment', [])

        if not exercise_name:
            return jsonify({'error': 'Exercise name is required'}), 400

        if not muscle_groups:
            return jsonify({'error': 'At least one muscle group is required'}), 400

        if not equipment:
            return jsonify({'error': 'At least one equipment is required'}), 400

        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Database connection failed'}), 500

        cursor = conn.cursor()

        # Check if exercise exists
        cursor.execute("SELECT id FROM exercises WHERE id = %s", (exercise_id,))
        if not cursor.fetchone():
            cursor.close()
            conn.close()
            return jsonify({'error': 'Exercise not found'}), 404

        # Update exercise name
        cursor.execute(
            "UPDATE exercises SET exercise_name = %s WHERE id = %s",
            (exercise_name, exercise_id)
        )

        # Delete existing muscle groups and equipment
        cursor.execute("DELETE FROM exercise_muscle_groups WHERE exercise_id = %s", (exercise_id,))
        cursor.execute("DELETE FROM exercise_equipment WHERE exercise_id = %s", (exercise_id,))

        # Add new muscle groups
        for muscle in muscle_groups:
            muscle_id = get_or_create_muscle_group(conn, muscle)
            cursor.execute(
                "INSERT INTO exercise_muscle_groups (exercise_id, muscle_group_id) VALUES (%s, %s)",
                (exercise_id, muscle_id)
            )

        # Add new equipment
        for eq in equipment:
            equipment_id = get_or_create_equipment(conn, eq)
            cursor.execute(
                "INSERT INTO exercise_equipment (exercise_id, equipment_id) VALUES (%s, %s)",
                (exercise_id, equipment_id)
            )

        conn.commit()
        cursor.close()
        conn.close()

        print(f"[Exercise Update] Updated exercise ID {exercise_id}: {exercise_name}")

        return jsonify({
            'success': True,
            'message': 'Exercise updated successfully'
        })

    except Exception as e:
        print(f"ERROR: Failed to update exercise: {e}")
        return jsonify({'error': f'Failed to update exercise: {str(e)}'}), 500


@app.route('/api/exercises/<int:exercise_id>', methods=['DELETE'])
def delete_exercise(exercise_id):
    """
    Delete an exercise
    Phase 5: Exercise deletion endpoint
    """
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Database connection failed'}), 500

        cursor = conn.cursor()

        # Check if exercise exists and get video path for cleanup
        cursor.execute(
            "SELECT video_file_path, thumbnail_url FROM exercises WHERE id = %s",
            (exercise_id,)
        )
        result = cursor.fetchone()

        if not result:
            cursor.close()
            conn.close()
            return jsonify({'error': 'Exercise not found'}), 404

        video_path, thumbnail_url = result

        # Delete from junction tables first (foreign key constraints)
        cursor.execute("DELETE FROM exercise_muscle_groups WHERE exercise_id = %s", (exercise_id,))
        cursor.execute("DELETE FROM exercise_equipment WHERE exercise_id = %s", (exercise_id,))

        # Delete the exercise
        cursor.execute("DELETE FROM exercises WHERE id = %s", (exercise_id,))

        conn.commit()
        cursor.close()
        conn.close()

        # Phase 6: Delete video and thumbnail files from storage backend
        deletion_errors = []
        try:
            # For cloud storage (R2/S3), extract the storage path from URL
            if app_config.STORAGE_BACKEND in ['r2', 's3']:
                # video_path is actually a URL like: https://pub-xxxxx.r2.dev/folder/segments/file.mp4
                # We need to extract the storage key: folder/segments/file.mp4
                if video_path:
                    try:
                        # Extract storage key from URL
                        video_storage_key = storage.get_key_from_url(video_path) if hasattr(storage, 'get_key_from_url') else video_path.split('/')[-3:]
                        if isinstance(video_storage_key, list):
                            video_storage_key = '/'.join(video_storage_key)

                        # Delete from cloud storage
                        if storage.delete(video_storage_key):
                            print(f"[File Cleanup] Deleted video from {app_config.STORAGE_BACKEND}: {video_storage_key}")
                        else:
                            deletion_errors.append(f"Failed to delete video: {video_storage_key}")
                    except Exception as e:
                        print(f"[File Cleanup] Warning: Failed to delete video from {app_config.STORAGE_BACKEND}: {e}")
                        deletion_errors.append(f"Video deletion error: {str(e)}")

                if thumbnail_url:
                    try:
                        # Extract storage key from URL
                        thumbnail_storage_key = storage.get_key_from_url(thumbnail_url) if hasattr(storage, 'get_key_from_url') else thumbnail_url.split('/')[-3:]
                        if isinstance(thumbnail_storage_key, list):
                            thumbnail_storage_key = '/'.join(thumbnail_storage_key)

                        # Delete from cloud storage
                        if storage.delete(thumbnail_storage_key):
                            print(f"[File Cleanup] Deleted thumbnail from {app_config.STORAGE_BACKEND}: {thumbnail_storage_key}")
                        else:
                            deletion_errors.append(f"Failed to delete thumbnail: {thumbnail_storage_key}")
                    except Exception as e:
                        print(f"[File Cleanup] Warning: Failed to delete thumbnail from {app_config.STORAGE_BACKEND}: {e}")
                        deletion_errors.append(f"Thumbnail deletion error: {str(e)}")

            # For local storage, delete files directly
            elif app_config.STORAGE_BACKEND == 'local':
                if video_path and os.path.exists(video_path):
                    os.remove(video_path)
                    print(f"[File Cleanup] Deleted local video file: {video_path}")

                if thumbnail_url and os.path.exists(thumbnail_url):
                    os.remove(thumbnail_url)
                    print(f"[File Cleanup] Deleted local thumbnail file: {thumbnail_url}")

        except Exception as cleanup_error:
            print(f"[File Cleanup] Warning: Failed to delete files: {cleanup_error}")
            deletion_errors.append(f"Cleanup error: {str(cleanup_error)}")
            # Don't fail the request if file cleanup fails

        print(f"[Exercise Delete] Deleted exercise ID {exercise_id}")

        response = {
            'success': True,
            'message': 'Exercise deleted successfully'
        }

        if deletion_errors:
            response['deletion_errors'] = deletion_errors
            response['warning'] = f"{len(deletion_errors)} file deletion errors occurred"

        return jsonify(response)

    except Exception as e:
        print(f"ERROR: Failed to delete exercise: {e}")
        return jsonify({'error': f'Failed to delete exercise: {str(e)}'}), 500


@app.route('/health')
def health():
    """Health check endpoint"""
    return jsonify({'status': 'ok'})


# Catch-all route for React client-side routing (MUST be after all API routes)
@app.route('/<path:path>')
def catch_all(path):
    # Don't catch API routes or known endpoints
    if path.startswith(('api/', 'process', 'download/', 'get-tags', 'share-receiver', 'health', 'reprocess')):
        return jsonify({'error': 'Not found'}), 404
    # Check if file exists in React build
    file_path = os.path.join(REACT_BUILD_DIR, path)
    if os.path.isfile(file_path):
        return send_from_directory(REACT_BUILD_DIR, path)
    # Default: serve React app for client-side routing
    return send_from_directory(REACT_BUILD_DIR, 'index.html')


if __name__ == '__main__':
    print("=" * 60)
    print("Video Scene Splitter Server")
    print("=" * 60)
    print("Server starting on http://localhost:5000")
    print("Open your browser and navigate to http://localhost:5000")
    print("=" * 60)
    app.run(debug=True, host='0.0.0.0', port=5000)
