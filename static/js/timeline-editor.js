// ===== Timeline Editor JavaScript =====

// Global State
const state = {
    videoFile: null,
    videoUrl: null,
    videoDuration: 0,
    cutPoints: [], // Array of {time: number, type: 'auto'|'manual', id: string}
    segments: [], // Array of {start: time, end: time, details: {...}}
    selectedSegmentIndex: null,
    currentTime: 0,
    isPlaying: false,
    zoomLevel: 1,
    draggingCutPoint: null,
    segmentPlaybackListener: null, // Store the current segment playback listener
    drawerVideoPlaybackListener: null, // Store the drawer video playback listener
    existingTags: {
        muscleGroups: [],
        equipment: []
    }
};

// DOM Elements
let videoPlayer, videoSource, videoOverlay, playPauseIcon, currentTimeDisplay, durationDisplay, seekBar;
let timelineCanvas, ctx;
let segmentsList, segmentDrawer;
let saveTimelineBtn, addCutPointBtn, deleteCutPointBtn;
let detectionThreshold, minSceneLength, thresholdValue, reprocessBtn;
let exerciseForm, exerciseNameInput, muscleGroupsInput, equipmentInput;
let muscleGroupsChips, equipmentChips;
let loadingIndicator, errorMessage, errorText;
let selectedCutPoint = null; // Track selected cut point for deletion

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    console.log('[Timeline Editor] Initializing...');
    initializeDOMElements();
    loadExistingTags();
    checkForVideoData();
    setupEventListeners();
});

// Initialize DOM element references
function initializeDOMElements() {
    // Video player elements
    videoPlayer = document.getElementById('videoPlayer');
    videoSource = document.getElementById('videoSource');
    videoOverlay = document.getElementById('videoOverlay');
    playPauseIcon = document.getElementById('playPauseIcon');
    currentTimeDisplay = document.getElementById('currentTime');
    durationDisplay = document.getElementById('duration');
    seekBar = document.getElementById('seekBar');

    // Timeline elements
    timelineCanvas = document.getElementById('timelineCanvas');
    ctx = timelineCanvas.getContext('2d');

    // Segments elements
    segmentsList = document.getElementById('segmentsList');
    segmentDrawer = document.getElementById('segmentDrawer');

    // Buttons
    saveTimelineBtn = document.getElementById('saveTimelineBtn');
    addCutPointBtn = document.getElementById('addCutPointBtn');
    deleteCutPointBtn = document.getElementById('deleteCutPointBtn');

    // Detection settings
    detectionThreshold = document.getElementById('detectionThreshold');
    minSceneLength = document.getElementById('minSceneLength');
    thresholdValue = document.getElementById('thresholdValue');
    reprocessBtn = document.getElementById('reprocessBtn');

    // Form elements
    exerciseForm = document.getElementById('exerciseDetailsForm');
    exerciseNameInput = document.getElementById('exerciseName');
    muscleGroupsInput = document.getElementById('muscleGroupsInput');
    equipmentInput = document.getElementById('equipmentInput');
    muscleGroupsChips = document.getElementById('muscleGroupsChips');
    equipmentChips = document.getElementById('equipmentChips');

    // UI elements
    loadingIndicator = document.getElementById('loadingIndicator');
    errorMessage = document.getElementById('errorMessage');
    errorText = document.getElementById('errorText');

    console.log('[Timeline Editor] DOM elements initialized');
}

// Load existing tags from database
async function loadExistingTags() {
    try {
        const response = await fetch('/get-tags');
        const data = await response.json();
        state.existingTags.muscleGroups = data.muscle_groups || [];
        state.existingTags.equipment = data.equipment || [];
        console.log('[Timeline Editor] Loaded existing tags:', state.existingTags);
    } catch (error) {
        console.error('[Timeline Editor] Failed to load tags:', error);
    }
}

// Check if video data is available (from upload or shared)
function checkForVideoData() {
    const urlParams = new URLSearchParams(window.location.search);
    const videoPath = urlParams.get('video');
    const suggestedCutsParam = urlParams.get('cuts');

    if (videoPath) {
        console.log('[Timeline Editor] Loading video:', videoPath);
        console.log('[Timeline Editor] Suggested cuts param:', suggestedCutsParam);
        loadVideo(videoPath, suggestedCutsParam);
    } else {
        showError('לא נבחר וידאו לעריכה. אנא העלה וידאו תחילה.');
    }
}

// Load video and initialize timeline
async function loadVideo(videoPath, suggestedCutsParam) {
    showLoading(true);

    try {
        // Set video source
        videoSource.src = videoPath;
        videoPlayer.load();

        // Wait for video metadata to load
        await new Promise((resolve, reject) => {
            videoPlayer.onloadedmetadata = resolve;
            videoPlayer.onerror = reject;
        });

        state.videoDuration = videoPlayer.duration;
        state.videoUrl = videoPath;
        durationDisplay.textContent = formatTime(state.videoDuration);

        console.log('[Timeline Editor] Video loaded, duration:', state.videoDuration);

        // Parse suggested cut points if available
        if (suggestedCutsParam) {
            try {
                // Try to parse as JSON array first
                let suggestedCuts = [];
                if (suggestedCutsParam.startsWith('[')) {
                    suggestedCuts = JSON.parse(decodeURIComponent(suggestedCutsParam));
                } else {
                    // Parse as comma-separated values
                    suggestedCuts = suggestedCutsParam.split(',').map(s => parseFloat(s.trim())).filter(n => !isNaN(n));
                }

                state.cutPoints = suggestedCuts.map((time, index) => ({
                    time: parseFloat(time),
                    type: 'auto',
                    id: `auto_${index}`
                }));
                console.log('[Timeline Editor] Loaded suggested cuts:', state.cutPoints);
            } catch (error) {
                console.error('[Timeline Editor] Failed to parse suggested cuts:', error);
            }
        }

        // Initialize timeline
        resizeCanvas();
        updateSegments();
        drawTimeline();
        updateUI();

        showLoading(false);
    } catch (error) {
        console.error('[Timeline Editor] Failed to load video:', error);
        showError('שגיאה בטעינת הוידאו. אנא נסה שוב.');
        showLoading(false);
    }
}

// Setup all event listeners
function setupEventListeners() {
    // Video player events
    videoPlayer.addEventListener('timeupdate', onVideoTimeUpdate);
    videoPlayer.addEventListener('play', () => {
        state.isPlaying = true;
        updatePlayPauseIcon();
    });
    videoPlayer.addEventListener('pause', () => {
        state.isPlaying = false;
        updatePlayPauseIcon();
    });

    // Video click to play/pause
    videoPlayer.addEventListener('click', togglePlayPause);

    // Seek bar
    seekBar.addEventListener('input', onSeekBarChange);

    // Timeline canvas events (mouse)
    timelineCanvas.addEventListener('mousedown', onTimelineMouseDown);
    timelineCanvas.addEventListener('mousemove', onTimelineMouseMove);
    timelineCanvas.addEventListener('mouseup', onTimelineMouseUp);
    timelineCanvas.addEventListener('mouseleave', onTimelineMouseUp);

    // Timeline canvas events (touch)
    timelineCanvas.addEventListener('touchstart', onTimelineTouchStart, { passive: false });
    timelineCanvas.addEventListener('touchmove', onTimelineTouchMove, { passive: false });
    timelineCanvas.addEventListener('touchend', onTimelineTouchEnd);

    // Buttons
    addCutPointBtn.addEventListener('click', addCutPointAtCurrentTime);
    deleteCutPointBtn.addEventListener('click', deleteSelectedCutPoint);
    saveTimelineBtn.addEventListener('click', saveTimeline);

    // Detection settings
    detectionThreshold.addEventListener('input', (e) => {
        thresholdValue.textContent = e.target.value;
    });
    reprocessBtn.addEventListener('click', reprocessVideo);

    // Window resize
    window.addEventListener('resize', () => {
        resizeCanvas();
        drawTimeline();
    });

    // Drawer events
    document.getElementById('closeDrawerBtn').addEventListener('click', closeDrawer);
    exerciseForm.addEventListener('submit', saveExerciseDetails);

    // Drawer video preview - click to play/pause
    const drawerVideoPreview = document.getElementById('drawerVideoPreview');
    drawerVideoPreview.addEventListener('click', () => {
        if (drawerVideoPreview.paused) {
            // When resuming, check if we're past the segment end
            if (state.selectedSegmentIndex !== null) {
                const segment = state.segments[state.selectedSegmentIndex];
                if (drawerVideoPreview.currentTime >= segment.end || drawerVideoPreview.currentTime < segment.start) {
                    drawerVideoPreview.currentTime = segment.start;
                }
            }
            drawerVideoPreview.play().catch(err => {
                console.log('[Timeline Editor] Preview play prevented:', err);
            });
        } else {
            drawerVideoPreview.pause();
        }
    });

    // Autocomplete inputs
    setupAutocomplete(muscleGroupsInput, 'muscleGroups', muscleGroupsChips);
    setupAutocomplete(equipmentInput, 'equipment', equipmentChips);

    // Add chip buttons (for mobile users without Enter key)
    document.getElementById('addMuscleGroupBtn').addEventListener('click', () => {
        const value = muscleGroupsInput.value.trim();
        if (value) {
            addChip(muscleGroupsChips, value, 'muscleGroups');
            muscleGroupsInput.value = '';
            // Hide autocomplete dropdown
            document.getElementById('muscleGroupsAutocomplete').classList.add('hidden');
        }
    });

    document.getElementById('addEquipmentBtn').addEventListener('click', () => {
        const value = equipmentInput.value.trim();
        if (value) {
            addChip(equipmentChips, value, 'equipment');
            equipmentInput.value = '';
            // Hide autocomplete dropdown
            document.getElementById('equipmentAutocomplete').classList.add('hidden');
        }
    });

    console.log('[Timeline Editor] Event listeners setup complete');
}

// ===== Video Player Functions =====

function togglePlayPause(event) {
    // Prevent event from bubbling if needed
    if (event) {
        event.stopPropagation();
    }

    if (state.isPlaying) {
        videoPlayer.pause();
    } else {
        videoPlayer.play();
    }

    // Show icon animation
    showPlayPauseAnimation();
}

function updatePlayPauseIcon() {
    if (state.isPlaying) {
        playPauseIcon.textContent = '⏸️';
    } else {
        playPauseIcon.textContent = '▶️';
    }
}

function showPlayPauseAnimation() {
    // Show the overlay with icon
    videoOverlay.classList.add('show');

    // Hide after 800ms
    setTimeout(() => {
        videoOverlay.classList.remove('show');
    }, 800);
}

function onVideoTimeUpdate() {
    state.currentTime = videoPlayer.currentTime;
    currentTimeDisplay.textContent = formatTime(state.currentTime);
    seekBar.value = (state.currentTime / state.videoDuration) * 100;
    drawTimeline();
}

function onSeekBarChange(event) {
    const newTime = (event.target.value / 100) * state.videoDuration;
    videoPlayer.currentTime = newTime;
    state.currentTime = newTime;
}

// ===== Timeline Canvas Functions =====

function resizeCanvas() {
    const wrapper = timelineCanvas.parentElement;
    const rect = wrapper.getBoundingClientRect();

    // Set canvas size with device pixel ratio for sharp rendering
    const dpr = window.devicePixelRatio || 1;
    timelineCanvas.width = rect.width * dpr;
    timelineCanvas.height = 150 * dpr;

    // Scale context to match DPR
    ctx.scale(dpr, dpr);

    // Set display size
    timelineCanvas.style.width = rect.width + 'px';
    timelineCanvas.style.height = '150px';
}

function drawTimeline() {
    if (!ctx || state.videoDuration === 0) return;

    const width = timelineCanvas.width / (window.devicePixelRatio || 1);
    const height = timelineCanvas.height / (window.devicePixelRatio || 1);

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw background
    ctx.fillStyle = '#f8f9ff';
    ctx.fillRect(0, 0, width, height);

    // Draw time markers
    drawTimeMarkers(width, height);

    // Draw segments
    drawSegments(width, height);

    // Draw cut points
    drawCutPoints(width, height);

    // Draw playhead
    drawPlayhead(width, height);
}

function drawTimeMarkers(width, height) {
    const markerInterval = 5; // seconds
    const markerCount = Math.ceil(state.videoDuration / markerInterval);

    ctx.strokeStyle = '#e0e0e0';
    ctx.fillStyle = '#999';
    ctx.font = '11px Arial';
    ctx.textAlign = 'center';

    for (let i = 0; i <= markerCount; i++) {
        const time = i * markerInterval;
        if (time > state.videoDuration) break;

        const x = (time / state.videoDuration) * width;

        // Draw tick
        ctx.beginPath();
        ctx.moveTo(x, height - 20);
        ctx.lineTo(x, height - 10);
        ctx.stroke();

        // Draw time label
        ctx.fillText(formatTime(time), x, height - 2);
    }
}

function drawSegments(width, height) {
    const segments = getSegmentsFromCutPoints();

    segments.forEach((segment, index) => {
        const startX = (segment.start / state.videoDuration) * width;
        const endX = (segment.end / state.videoDuration) * width;
        const segmentWidth = endX - startX;

        // Determine segment color
        let fillColor = '#ffffff';
        let strokeColor = '#e0e0e0';

        if (segment.details) {
            fillColor = '#f0fff4'; // Green tint for segments with details
            strokeColor = '#48bb78';
        }

        if (state.selectedSegmentIndex === index) {
            fillColor = '#fff5e6'; // Orange tint for selected
            strokeColor = '#f59e0b';
        }

        // Draw segment rectangle
        ctx.fillStyle = fillColor;
        ctx.fillRect(startX, 30, segmentWidth, height - 60);

        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = 2;
        ctx.strokeRect(startX, 30, segmentWidth, height - 60);

        // Draw segment number
        ctx.fillStyle = '#667eea';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`#${index + 1}`, startX + segmentWidth / 2, 55);
    });
}

function drawCutPoints(width, height) {
    state.cutPoints.forEach(cutPoint => {
        const x = (cutPoint.time / state.videoDuration) * width;

        // Check if this cut point is selected
        const isSelected = selectedCutPoint && selectedCutPoint.id === cutPoint.id;

        // Color based on type and selection
        let color = cutPoint.type === 'auto' ? '#667eea' : '#48bb78';
        if (isSelected) {
            color = '#ef4444'; // Red for selected
        }

        // Draw vertical line
        ctx.strokeStyle = color;
        ctx.lineWidth = isSelected ? 4 : 3;
        ctx.beginPath();
        ctx.moveTo(x, 20);
        ctx.lineTo(x, height - 30);
        ctx.stroke();

        // Draw handle (circle at top)
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(x, 20, isSelected ? 10 : 8, 0, Math.PI * 2);
        ctx.fill();

        // Draw white border around handle
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();

        // If this is the dragging cut point, show time label
        if (state.draggingCutPoint && state.draggingCutPoint.id === cutPoint.id) {
            const timeText = formatTime(cutPoint.time);

            // Draw background for text
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.font = 'bold 12px Arial';
            const textWidth = ctx.measureText(timeText).width;
            const bgX = x - textWidth / 2 - 5;
            const bgY = 0;
            ctx.fillRect(bgX, bgY, textWidth + 10, 16);

            // Draw time text
            ctx.fillStyle = '#ffffff';
            ctx.textAlign = 'center';
            ctx.fillText(timeText, x, 12);
        }
    });
}

function drawPlayhead(width, height) {
    if (state.currentTime === 0) return;

    const x = (state.currentTime / state.videoDuration) * width;

    // Draw playhead line
    ctx.strokeStyle = '#fc8181';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw playhead triangle at top
    ctx.fillStyle = '#fc8181';
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x - 6, 10);
    ctx.lineTo(x + 6, 10);
    ctx.closePath();
    ctx.fill();
}

// ===== Timeline Interaction Functions =====

function onTimelineMouseDown(event) {
    const rect = timelineCanvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    handleTimelinePress(x, y);
}

function onTimelineMouseMove(event) {
    if (!state.draggingCutPoint) return;

    const rect = timelineCanvas.getBoundingClientRect();
    const x = event.clientX - rect.left;

    handleTimelineDrag(x);
}

function onTimelineMouseUp() {
    handleTimelineRelease();
}

function onTimelineTouchStart(event) {
    event.preventDefault();
    const touch = event.touches[0];
    const rect = timelineCanvas.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;

    handleTimelinePress(x, y);
}

function onTimelineTouchMove(event) {
    event.preventDefault();
    if (!state.draggingCutPoint) return;

    const touch = event.touches[0];
    const rect = timelineCanvas.getBoundingClientRect();
    const x = touch.clientX - rect.left;

    handleTimelineDrag(x);
}

function onTimelineTouchEnd(event) {
    event.preventDefault();
    handleTimelineRelease();
}

function handleTimelinePress(x, y) {
    const width = timelineCanvas.clientWidth;

    // Check if clicking on a cut point handle (top area)
    if (y <= 30) {
        const clickedCutPoint = findCutPointAtX(x, width);
        if (clickedCutPoint) {
            // Select the cut point
            selectedCutPoint = clickedCutPoint;
            deleteCutPointBtn.disabled = false;

            // Also prepare for dragging
            state.draggingCutPoint = clickedCutPoint;
            timelineCanvas.style.cursor = 'grabbing';

            // Redraw to show selection
            drawTimeline();
            return;
        }
    }

    // Clear cut point selection
    selectedCutPoint = null;
    deleteCutPointBtn.disabled = true;

    // Check if clicking on a segment
    const clickedSegmentIndex = findSegmentAtX(x, width);
    if (clickedSegmentIndex !== -1) {
        playSegmentInMainPlayer(clickedSegmentIndex);
    }
}

function handleTimelineDrag(x) {
    if (!state.draggingCutPoint) return;

    const width = timelineCanvas.clientWidth;
    const newTime = Math.max(0, Math.min(state.videoDuration, (x / width) * state.videoDuration));

    state.draggingCutPoint.time = newTime;
    sortCutPoints();
    updateSegments();
    drawTimeline();
}

function handleTimelineRelease() {
    if (state.draggingCutPoint) {
        state.draggingCutPoint = null;
        timelineCanvas.style.cursor = 'crosshair';
        updateUI();
    }
}

function findCutPointAtX(x, canvasWidth) {
    const tolerance = 15; // pixels

    for (let cutPoint of state.cutPoints) {
        const cutX = (cutPoint.time / state.videoDuration) * canvasWidth;
        if (Math.abs(x - cutX) <= tolerance) {
            return cutPoint;
        }
    }
    return null;
}

function findSegmentAtX(x, canvasWidth) {
    const time = (x / canvasWidth) * state.videoDuration;
    const segments = getSegmentsFromCutPoints();

    for (let i = 0; i < segments.length; i++) {
        if (time >= segments[i].start && time <= segments[i].end) {
            return i;
        }
    }
    return -1;
}

// ===== Cut Point Management =====

function addCutPointAtCurrentTime() {
    // Add cut point 0.5 seconds after current time to make it more visible
    const cutPointTime = Math.min(state.currentTime + 0.5, state.videoDuration);

    const newCutPoint = {
        time: cutPointTime,
        type: 'manual',
        id: `manual_${Date.now()}`
    };

    state.cutPoints.push(newCutPoint);
    sortCutPoints();
    updateSegments();
    drawTimeline();
    updateUI();

    console.log('[Timeline Editor] Added manual cut point at', cutPointTime);
}

function sortCutPoints() {
    state.cutPoints.sort((a, b) => a.time - b.time);
}

function removeCutPoint(cutPointId) {
    state.cutPoints = state.cutPoints.filter(cp => cp.id !== cutPointId);
    updateSegments();
    drawTimeline();
    updateUI();
}

// ===== Segment Management =====

function getSegmentsFromCutPoints() {
    if (state.cutPoints.length === 0) {
        return [{
            start: 0,
            end: state.videoDuration,
            details: state.segments[0]?.details || null
        }];
    }

    const segments = [];

    // First segment (from 0 to first cut point)
    segments.push({
        start: 0,
        end: state.cutPoints[0].time,
        details: state.segments[0]?.details || null
    });

    // Middle segments
    for (let i = 0; i < state.cutPoints.length - 1; i++) {
        segments.push({
            start: state.cutPoints[i].time,
            end: state.cutPoints[i + 1].time,
            details: state.segments[i + 1]?.details || null
        });
    }

    // Last segment (from last cut point to end)
    segments.push({
        start: state.cutPoints[state.cutPoints.length - 1].time,
        end: state.videoDuration,
        details: state.segments[state.cutPoints.length]?.details || null
    });

    return segments;
}

function updateSegments() {
    const newSegments = getSegmentsFromCutPoints();

    // Preserve existing details
    state.segments = newSegments.map((newSeg, index) => {
        const existingSeg = state.segments[index];
        return {
            ...newSeg,
            details: existingSeg?.details || null
        };
    });

    renderSegmentsList();
}

function renderSegmentsList() {
    segmentsList.innerHTML = '';

    state.segments.forEach((segment, index) => {
        const card = document.createElement('div');
        card.className = 'segment-card';
        if (segment.details) {
            card.classList.add('has-details');
        }

        const duration = segment.end - segment.start;

        card.innerHTML = `
            <div class="segment-number">סגמנט #${index + 1}</div>
            <div class="segment-time">${formatTime(segment.start)} - ${formatTime(segment.end)}</div>
            <div class="segment-duration">משך: ${formatTime(duration)}</div>
            ${segment.details ? `
                <div class="segment-details-preview">
                    <div class="segment-exercise-name">${segment.details.name}</div>
                    <div class="segment-tags">
                        ${segment.details.muscleGroups.map(mg => `<span class="segment-tag">${mg}</span>`).join('')}
                        ${segment.details.equipment.map(eq => `<span class="segment-tag">${eq}</span>`).join('')}
                    </div>
                </div>
            ` : ''}
        `;

        card.addEventListener('click', () => selectSegment(index));
        segmentsList.appendChild(card);
    });
}

function playSegmentInMainPlayer(index) {
    const segment = state.segments[index];

    // Clean up any existing segment playback listener
    if (state.segmentPlaybackListener) {
        videoPlayer.removeEventListener('timeupdate', state.segmentPlaybackListener);
        state.segmentPlaybackListener = null;
    }

    // Seek the main video player to the segment start and play it
    videoPlayer.currentTime = segment.start;
    videoPlayer.play().catch(err => {
        console.log('[Timeline Editor] Auto-play prevented:', err);
    });

    // Set up event listener to stop playback at segment end
    state.segmentPlaybackListener = () => {
        if (videoPlayer.currentTime >= segment.end) {
            videoPlayer.pause();
            // Remove the listener after stopping
            videoPlayer.removeEventListener('timeupdate', state.segmentPlaybackListener);
            state.segmentPlaybackListener = null;
        }
    };
    videoPlayer.addEventListener('timeupdate', state.segmentPlaybackListener);

    // Highlight the segment temporarily on the timeline
    state.selectedSegmentIndex = index;
    drawTimeline();

    // Clear selection after 2 seconds
    setTimeout(() => {
        if (state.selectedSegmentIndex === index) {
            state.selectedSegmentIndex = null;
            drawTimeline();
        }
    }, 2000);

    console.log('[Timeline Editor] Playing segment', index, 'from', segment.start, 'to', segment.end);
}

function selectSegment(index) {
    state.selectedSegmentIndex = index;
    const segment = state.segments[index];

    // Clean up any existing segment playback listener
    if (state.segmentPlaybackListener) {
        videoPlayer.removeEventListener('timeupdate', state.segmentPlaybackListener);
        state.segmentPlaybackListener = null;
    }

    // Clean up any existing drawer video playback listener
    if (state.drawerVideoPlaybackListener) {
        const videoPreview = document.getElementById('drawerVideoPreview');
        videoPreview.removeEventListener('timeupdate', state.drawerVideoPlaybackListener);
        state.drawerVideoPlaybackListener = null;
    }

    // Update drawer
    document.getElementById('drawerSegmentNumber').textContent = `#${index + 1}`;
    document.getElementById('drawerStartTime').textContent = formatTime(segment.start);
    document.getElementById('drawerEndTime').textContent = formatTime(segment.end);

    // Set video preview source to the full video
    const videoPreview = document.getElementById('drawerVideoPreview');

    // If the source is different, set it. Otherwise just seek
    if (!videoPreview.src.includes(state.videoUrl)) {
        videoPreview.src = state.videoUrl;
    }

    // Wait for the video to load metadata, then seek to segment start
    const setupDrawerVideo = () => {
        videoPreview.currentTime = segment.start;

        // Set up event listener to stop playback at segment end
        state.drawerVideoPlaybackListener = () => {
            if (videoPreview.currentTime >= segment.end) {
                videoPreview.pause();
                // Reset to start of segment for next play
                videoPreview.currentTime = segment.start;
            }
        };
        videoPreview.addEventListener('timeupdate', state.drawerVideoPlaybackListener);

        // Auto-play the preview video
        videoPreview.play().catch(err => {
            console.log('[Timeline Editor] Preview auto-play prevented:', err);
        });
    };

    // Check if metadata is already loaded
    if (videoPreview.readyState >= 1) {
        setupDrawerVideo();
    } else {
        videoPreview.addEventListener('loadedmetadata', setupDrawerVideo, { once: true });
    }

    // Also seek the main video player to the segment start and play it
    videoPlayer.currentTime = segment.start;
    videoPlayer.play().catch(err => {
        console.log('[Timeline Editor] Main video auto-play prevented:', err);
    });

    // Set up event listener to stop playback at segment end
    state.segmentPlaybackListener = () => {
        if (videoPlayer.currentTime >= segment.end) {
            videoPlayer.pause();
            // Remove the listener after stopping
            videoPlayer.removeEventListener('timeupdate', state.segmentPlaybackListener);
            state.segmentPlaybackListener = null;
        }
    };
    videoPlayer.addEventListener('timeupdate', state.segmentPlaybackListener);

    // Load existing details if available
    if (segment.details) {
        exerciseNameInput.value = segment.details.name;

        // Clear and populate muscle groups chips
        muscleGroupsChips.innerHTML = '';
        segment.details.muscleGroups.forEach(mg => addChip(muscleGroupsChips, mg, 'muscleGroups'));

        // Clear and populate equipment chips
        equipmentChips.innerHTML = '';
        segment.details.equipment.forEach(eq => addChip(equipmentChips, eq, 'equipment'));

        // Restore removeAudio checkbox state
        document.getElementById('removeAudioCheckbox').checked = segment.details.removeAudio || false;
    } else {
        exerciseForm.reset();
        muscleGroupsChips.innerHTML = '';
        equipmentChips.innerHTML = '';
        document.getElementById('removeAudioCheckbox').checked = false;
    }

    // Open drawer
    openDrawer();

    // Redraw timeline to show selection
    drawTimeline();

    console.log('[Timeline Editor] Selected segment', index, 'Playing from', segment.start, 'to', segment.end);
}

function openDrawer() {
    segmentDrawer.classList.add('open');
}

function closeDrawer() {
    segmentDrawer.classList.remove('open');
    state.selectedSegmentIndex = null;

    // Clean up segment playback listener
    if (state.segmentPlaybackListener) {
        videoPlayer.removeEventListener('timeupdate', state.segmentPlaybackListener);
        state.segmentPlaybackListener = null;
    }

    // Clean up drawer video playback listener
    const videoPreview = document.getElementById('drawerVideoPreview');
    if (state.drawerVideoPlaybackListener) {
        videoPreview.removeEventListener('timeupdate', state.drawerVideoPlaybackListener);
        state.drawerVideoPlaybackListener = null;
    }

    // Pause the preview video (this stops both video and audio)
    if (videoPreview) {
        videoPreview.pause();
        // Reset to beginning to ensure clean state
        videoPreview.currentTime = 0;
    }

    drawTimeline();
}

function saveExerciseDetails(event) {
    event.preventDefault();

    const exerciseName = exerciseNameInput.value.trim();
    const muscleGroups = Array.from(muscleGroupsChips.querySelectorAll('.tag-chip'))
        .map(chip => chip.textContent.replace('×', '').trim());
    let equipment = Array.from(equipmentChips.querySelectorAll('.tag-chip'))
        .map(chip => chip.textContent.replace('×', '').trim());
    const removeAudio = document.getElementById('removeAudioCheckbox').checked;

    // If no equipment specified, default to "ללא ציוד"
    if (equipment.length === 0) {
        equipment = ['ללא ציוד'];
        // Add the chip visually so the user can see it was added
        addChip(equipmentChips, 'ללא ציוד', 'equipment');
    }

    console.log('[Timeline Editor] Validating form:', {
        exerciseName,
        muscleGroupsCount: muscleGroups.length,
        muscleGroups,
        equipmentCount: equipment.length,
        equipment,
        removeAudio
    });

    if (!exerciseName) {
        alert('אנא הזן שם תרגיל');
        return;
    }

    if (muscleGroups.length === 0) {
        alert('אנא הוסף לפחות קבוצת שריר אחת');
        return;
    }

    // Save details to segment
    state.segments[state.selectedSegmentIndex].details = {
        name: exerciseName,
        muscleGroups: muscleGroups,
        equipment: equipment,
        removeAudio: removeAudio
    };

    console.log('[Timeline Editor] Saved exercise details for segment', state.selectedSegmentIndex, 'removeAudio:', removeAudio);

    // Update UI
    renderSegmentsList();
    drawTimeline();
    closeDrawer();
    updateUI();
}

// Function removed - segments are deleted by removing cut points now

// ===== Autocomplete Functions =====

function setupAutocomplete(inputElement, dataType, chipsContainer) {
    const dropdownId = inputElement.id + 'Autocomplete';
    const dropdown = document.getElementById(dropdownId);

    // Check if dropdown exists
    if (!dropdown) {
        console.warn('[Timeline Editor] Dropdown not found:', dropdownId);
        // Still set up Enter key to add chips
        inputElement.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                event.preventDefault();
                const value = inputElement.value.trim();
                if (value) {
                    addChip(chipsContainer, value, dataType);
                    inputElement.value = '';
                }
            }
        });
        return;
    }

    inputElement.addEventListener('input', (event) => {
        const query = event.target.value.toLowerCase().trim();

        if (query.length === 0) {
            dropdown.classList.add('hidden');
            return;
        }

        const suggestions = state.existingTags[dataType].filter(tag =>
            tag.toLowerCase().includes(query)
        );

        if (suggestions.length === 0) {
            dropdown.classList.add('hidden');
            return;
        }

        // Show dropdown with suggestions
        dropdown.innerHTML = suggestions.map(tag =>
            `<div class="autocomplete-item" data-value="${tag}">${tag}</div>`
        ).join('');

        dropdown.classList.remove('hidden');

        // Add click handlers
        dropdown.querySelectorAll('.autocomplete-item').forEach(item => {
            item.addEventListener('click', () => {
                addChip(chipsContainer, item.dataset.value, dataType);
                inputElement.value = '';
                dropdown.classList.add('hidden');
            });
        });
    });

    inputElement.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            const value = inputElement.value.trim();
            if (value) {
                addChip(chipsContainer, value, dataType);
                inputElement.value = '';
                dropdown.classList.add('hidden');
            }
        }
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', (event) => {
        if (!inputElement.contains(event.target) && !dropdown.contains(event.target)) {
            dropdown.classList.add('hidden');
        }
    });
}

function addChip(container, value, dataType) {
    // Check if chip already exists
    const existingChips = Array.from(container.querySelectorAll('.tag-chip'));
    if (existingChips.some(chip => chip.textContent.replace('×', '').trim() === value)) {
        return;
    }

    const chip = document.createElement('div');
    chip.className = 'tag-chip';
    chip.innerHTML = `
        ${value}
        <span class="tag-chip-remove">×</span>
    `;

    chip.querySelector('.tag-chip-remove').addEventListener('click', () => {
        chip.remove();
    });

    container.appendChild(chip);

    // Add to existing tags if new
    if (!state.existingTags[dataType].includes(value)) {
        state.existingTags[dataType].push(value);
    }
}

// ===== Cut Point Selection & Deletion =====

function deleteSelectedCutPoint() {
    if (!selectedCutPoint) {
        alert('אנא בחר נקודת חיתוך למחיקה');
        return;
    }

    if (!confirm('האם אתה בטוח שברצונך למחוק את נקודת החיתוך הזו?')) {
        return;
    }

    // Remove the cut point
    state.cutPoints = state.cutPoints.filter(cp => cp.id !== selectedCutPoint.id);
    selectedCutPoint = null;
    deleteCutPointBtn.disabled = true;

    updateSegments();
    drawTimeline();
    updateUI();

    console.log('[Timeline Editor] Deleted cut point');
}

// ===== Reprocess Video =====

async function reprocessVideo() {
    if (!state.videoUrl) {
        alert('לא נמצא וידאו לעיבוד');
        return;
    }

    if (!confirm('האם אתה בטוח? פעולה זו תמחק את כל נקודות החיתוך והסגמנטים הקיימים.')) {
        return;
    }

    showLoading(true);

    try {
        // Extract folder and filename from current video URL
        const parts = state.videoUrl.split('/');
        if (parts.length < 4) {
            throw new Error('Invalid video URL');
        }

        const folderName = parts[2];
        const filename = parts[3];

        // Get the local path to the original video
        const originalVideoPath = `output/${folderName}/${filename}`;

        // Prepare FormData
        const formData = new FormData();

        // We need to fetch the video file and re-upload it
        // For now, we'll use the existing file path
        const threshold = parseFloat(detectionThreshold.value);
        const minSceneLengthValue = parseFloat(minSceneLength.value);

        // Call backend to reprocess
        const response = await fetch(`/reprocess?path=${encodeURIComponent(originalVideoPath)}&threshold=${threshold}&min_scene_length=${minSceneLengthValue}`);

        if (!response.ok) {
            throw new Error('Failed to reprocess video');
        }

        const data = await response.json();

        // Update cut points with new detection
        if (data.suggested_cuts && Array.isArray(data.suggested_cuts)) {
            state.cutPoints = data.suggested_cuts.map((time, index) => ({
                time: parseFloat(time),
                type: 'auto',
                id: `auto_${index}`
            }));

            console.log('[Timeline Editor] Reprocessed with new cuts:', state.cutPoints);
        }

        // Clear all segments
        updateSegments();
        drawTimeline();
        updateUI();

        alert(`✅ הוידאו עובד מחדש! נמצאו ${state.cutPoints.length} נקודות חיתוך.`);

    } catch (error) {
        console.error('[Timeline Editor] Failed to reprocess video:', error);
        showError('שגיאה בעיבוד מחדש של הוידאו. אנא נסה שוב.');
    } finally {
        showLoading(false);
    }
}

// ===== Save Timeline =====

async function saveTimeline() {
    // Validate that all segments with cut points have details
    const segmentsWithDetails = state.segments.filter(seg => seg.details !== null);

    if (segmentsWithDetails.length === 0) {
        alert('אנא הוסף פרטי תרגיל לפחות לסגמנט אחד');
        return;
    }

    if (!confirm(`האם לשמור ${segmentsWithDetails.length} תרגילים למסד הנתונים?`)) {
        return;
    }

    showLoading(true);

    try {
        // Prepare data for backend (Phase 4: now includes removeAudio and full details)
        const timelineData = {
            videoUrl: state.videoUrl,
            cutPoints: state.cutPoints,
            segments: segmentsWithDetails.map((seg, index) => ({
                start: seg.start,
                end: seg.end,
                details: {
                    name: seg.details.name,
                    muscleGroups: seg.details.muscleGroups,
                    equipment: seg.details.equipment,
                    removeAudio: seg.details.removeAudio || false  // Phase 4: Send removeAudio flag
                }
            }))
        };

        // Send to backend
        const response = await fetch('/api/timeline/save', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(timelineData)
        });

        if (!response.ok) {
            throw new Error('Failed to save timeline');
        }

        const result = await response.json();
        console.log('[Timeline Editor] Timeline saved:', result);

        alert(`✅ נשמרו ${segmentsWithDetails.length} תרגילים בהצלחה!`);

        // Redirect to library
        window.location.href = '/exercise-library.html';

    } catch (error) {
        console.error('[Timeline Editor] Failed to save timeline:', error);
        showError('שגיאה בשמירת הטיימליין. אנא נסה שוב.');
    } finally {
        showLoading(false);
    }
}

// ===== UI Helper Functions =====

function updateUI() {
    // Update cut points count
    document.getElementById('cutPointsCount').textContent = `נקודות חיתוך: ${state.cutPoints.length}`;

    // Update segments count
    const segmentsWithDetails = state.segments.filter(seg => seg.details !== null).length;
    document.getElementById('segmentsCount').textContent =
        `סגמנטים: ${state.segments.length} (${segmentsWithDetails} עם פרטים)`;

    // Enable save button if there are segments with details
    saveTimelineBtn.disabled = segmentsWithDetails === 0;
}

function showLoading(show) {
    if (show) {
        loadingIndicator.classList.remove('hidden');
    } else {
        loadingIndicator.classList.add('hidden');
    }
}

function showError(message) {
    errorText.textContent = message;
    errorMessage.classList.add('show');
    setTimeout(() => {
        errorMessage.classList.remove('show');
    }, 5000);
}

function formatTime(seconds) {
    if (isNaN(seconds) || seconds === Infinity) return '00:00';

    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

console.log('[Timeline Editor] Script loaded successfully');
