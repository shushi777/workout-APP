"""
Video Processing Functions using FFmpeg
Handles video cutting, audio removal, and thumbnail generation
"""

import subprocess
import os
from pathlib import Path
from typing import List, Dict, Optional, Tuple
from datetime import datetime
from werkzeug.utils import secure_filename


class VideoProcessingError(Exception):
    """Custom exception for video processing errors"""
    pass


def check_ffmpeg_installed() -> bool:
    """
    Check if FFmpeg is installed and accessible

    Returns:
        True if FFmpeg is available, False otherwise
    """
    try:
        subprocess.run(['ffmpeg', '-version'], capture_output=True, check=True)
        return True
    except (subprocess.CalledProcessError, FileNotFoundError):
        return False


def get_video_info(video_path: str) -> Dict:
    """
    Get video metadata using FFprobe

    Args:
        video_path: Path to video file

    Returns:
        Dictionary with video info (duration, fps, resolution, etc.)
    """
    try:
        cmd = [
            'ffprobe',
            '-v', 'error',
            '-show_entries', 'format=duration:stream=width,height,r_frame_rate,codec_name',
            '-of', 'json',
            video_path
        ]

        result = subprocess.run(cmd, capture_output=True, text=True, check=True)
        import json
        data = json.loads(result.stdout)

        # Extract video stream info
        video_stream = next((s for s in data.get('streams', []) if s.get('codec_type') == 'video'), None)

        if not video_stream:
            raise VideoProcessingError("No video stream found in file")

        # Parse frame rate (e.g., "30/1" -> 30.0)
        fps_str = video_stream.get('r_frame_rate', '30/1')
        fps_parts = fps_str.split('/')
        fps = float(fps_parts[0]) / float(fps_parts[1]) if len(fps_parts) == 2 else 30.0

        return {
            'duration': float(data['format'].get('duration', 0)),
            'width': video_stream.get('width', 0),
            'height': video_stream.get('height', 0),
            'fps': fps,
            'codec': video_stream.get('codec_name', 'unknown'),
            'resolution': f"{video_stream.get('width', 0)}x{video_stream.get('height', 0)}"
        }

    except (subprocess.CalledProcessError, json.JSONDecodeError, KeyError) as e:
        raise VideoProcessingError(f"Failed to get video info: {e}")


def format_timestamp(seconds: float) -> str:
    """
    Convert seconds to FFmpeg timestamp format (HH:MM:SS.mmm)

    Args:
        seconds: Time in seconds

    Returns:
        Formatted timestamp string
    """
    hours = int(seconds // 3600)
    minutes = int((seconds % 3600) // 60)
    secs = seconds % 60
    return f"{hours:02d}:{minutes:02d}:{secs:06.3f}"


def cut_video_segment(input_path: str, output_path: str, start_time: float, end_time: float,
                      remove_audio: bool = False, codec: str = 'libx264',
                      preset: str = 'medium', crf: int = 23) -> bool:
    """
    Cut a segment from a video using FFmpeg

    Args:
        input_path: Path to input video file
        output_path: Path to output video file
        start_time: Start time in seconds
        end_time: End time in seconds
        remove_audio: Whether to remove audio from the segment
        codec: Video codec to use (default: libx264 for H.264)
        preset: Encoding preset (ultrafast, superfast, veryfast, faster, fast, medium, slow, slower, veryslow)
        crf: Constant Rate Factor for quality (0-51, lower is better quality, 23 is default)

    Returns:
        True if successful

    Raises:
        VideoProcessingError: If cutting fails
    """
    try:
        # Calculate duration
        duration = end_time - start_time

        # Build FFmpeg command
        cmd = [
            'ffmpeg',
            '-y',  # Overwrite output file
            '-ss', format_timestamp(start_time),  # Start time
            '-i', input_path,  # Input file
            '-t', format_timestamp(duration),  # Duration
            '-c:v', codec,  # Video codec
            '-preset', preset,  # Encoding speed
            '-crf', str(crf),  # Quality
        ]

        # Handle audio
        if remove_audio:
            cmd.extend(['-an'])  # Remove audio
        else:
            cmd.extend(['-c:a', 'aac', '-b:a', '128k'])  # Copy audio with AAC codec

        # Add output file
        cmd.append(output_path)

        print(f"[FFmpeg] Cutting segment: {start_time:.2f}s - {end_time:.2f}s")
        print(f"[FFmpeg] Command: {' '.join(cmd)}")

        # Run FFmpeg
        result = subprocess.run(cmd, capture_output=True, text=True, check=True)

        # Check if output file was created
        if not os.path.exists(output_path):
            raise VideoProcessingError("Output file was not created")

        return True

    except subprocess.CalledProcessError as e:
        error_msg = f"FFmpeg error: {e.stderr}"
        print(f"[FFmpeg Error] {error_msg}")
        raise VideoProcessingError(error_msg)
    except Exception as e:
        raise VideoProcessingError(f"Failed to cut video segment: {e}")


def generate_thumbnail(video_path: str, output_path: str, timestamp: float = 0.0,
                       width: int = 320, height: int = 180) -> bool:
    """
    Generate a thumbnail image from a video at a specific timestamp

    Args:
        video_path: Path to input video file
        output_path: Path to output thumbnail image
        timestamp: Time in seconds to capture thumbnail
        width: Thumbnail width in pixels
        height: Thumbnail height in pixels

    Returns:
        True if successful

    Raises:
        VideoProcessingError: If thumbnail generation fails
    """
    try:
        cmd = [
            'ffmpeg',
            '-y',  # Overwrite output file
            '-ss', format_timestamp(timestamp),  # Seek to timestamp
            '-i', video_path,  # Input file
            '-vframes', '1',  # Extract 1 frame
            '-vf', f'scale={width}:{height}',  # Scale to size
            output_path  # Output file
        ]

        print(f"[FFmpeg] Generating thumbnail at {timestamp:.2f}s")

        # Run FFmpeg
        subprocess.run(cmd, capture_output=True, text=True, check=True)

        # Check if output file was created
        if not os.path.exists(output_path):
            raise VideoProcessingError("Thumbnail was not created")

        return True

    except subprocess.CalledProcessError as e:
        error_msg = f"FFmpeg error: {e.stderr}"
        print(f"[FFmpeg Error] {error_msg}")
        raise VideoProcessingError(error_msg)
    except Exception as e:
        raise VideoProcessingError(f"Failed to generate thumbnail: {e}")


def split_video_by_timeline(video_path: str, segments: List[Dict], output_folder: str,
                            base_name: str = None, codec: str = 'libx264',
                            preset: str = 'medium', crf: int = 23) -> List[Dict]:
    """
    Split a video into multiple segments based on timeline data

    Args:
        video_path: Path to source video file
        segments: List of segment dictionaries with 'start', 'end', 'details' keys
        output_folder: Folder to save segment files
        base_name: Base name for output files (defaults to video filename)
        codec: Video codec to use
        preset: Encoding preset
        crf: Quality setting

    Returns:
        List of dictionaries with segment info and file paths

    Example segments:
        [
            {
                'start': 0.0,
                'end': 15.5,
                'details': {
                    'name': 'Push-ups',
                    'muscleGroups': ['chest', 'triceps'],
                    'equipment': ['bodyweight'],
                    'removeAudio': False
                }
            },
            ...
        ]
    """
    # Verify FFmpeg is available
    if not check_ffmpeg_installed():
        raise VideoProcessingError("FFmpeg is not installed or not accessible")

    # Create output folder
    os.makedirs(output_folder, exist_ok=True)

    # Get base name from video if not provided
    if base_name is None:
        base_name = Path(video_path).stem

    # Process each segment
    results = []
    for idx, segment in enumerate(segments, start=1):
        start_time = segment.get('start', 0.0)
        end_time = segment.get('end', 0.0)
        details = segment.get('details', {})

        # Skip segments without details
        if not details:
            print(f"[Video Processing] Skipping segment {idx} (no details)")
            continue

        # Generate output filename
        exercise_name = details.get('name', f'segment_{idx}')
        safe_exercise_name = secure_filename(exercise_name)
        output_filename = f"{base_name}_seg{idx:03d}_{safe_exercise_name}.mp4"
        output_path = os.path.join(output_folder, output_filename)

        # Check if audio should be removed
        remove_audio = details.get('removeAudio', False)

        print(f"[Video Processing] Processing segment {idx}/{len(segments)}: {exercise_name}")
        print(f"  Time: {start_time:.2f}s - {end_time:.2f}s")
        print(f"  Remove audio: {remove_audio}")

        try:
            # Cut the segment
            cut_video_segment(
                input_path=video_path,
                output_path=output_path,
                start_time=start_time,
                end_time=end_time,
                remove_audio=remove_audio,
                codec=codec,
                preset=preset,
                crf=crf
            )

            # Generate thumbnail (at midpoint of segment)
            thumbnail_filename = f"{base_name}_seg{idx:03d}_thumb.jpg"
            thumbnail_path = os.path.join(output_folder, thumbnail_filename)
            thumbnail_timestamp = (start_time + end_time) / 2

            generate_thumbnail(
                video_path=output_path,
                output_path=thumbnail_path,
                timestamp=0.0  # Use first frame of cut segment
            )

            # Add result
            results.append({
                'segment_index': idx,
                'video_path': output_path,
                'thumbnail_path': thumbnail_path,
                'start_time': start_time,
                'end_time': end_time,
                'duration': end_time - start_time,
                'exercise_name': details.get('name'),
                'muscle_groups': details.get('muscleGroups', []),
                'equipment': details.get('equipment', []),
                'remove_audio': remove_audio,
                'file_size': os.path.getsize(output_path)
            })

            print(f"  ✓ Segment saved: {output_filename}")
            print(f"  ✓ Thumbnail saved: {thumbnail_filename}")

        except VideoProcessingError as e:
            print(f"  ✗ Failed to process segment {idx}: {e}")
            # Continue with other segments
            continue

    print(f"[Video Processing] Completed: {len(results)}/{len(segments)} segments processed successfully")
    return results
