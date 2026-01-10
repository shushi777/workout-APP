// Exercise Library JavaScript - Phase 5

// State Management
const state = {
    allExercises: [],
    filteredExercises: [],
    selectedMuscles: new Set(),
    selectedEquipment: new Set(),
    searchTerm: '',
    currentExercise: null,
    allMuscleGroups: [],
    allEquipment: [],
    intersectionObserver: null,
    playingCards: new Set()
};

// DOM Elements
let searchBox, muscleFilters, equipmentFilters, exerciseGrid;
let loadingState, emptyState;
let editModal, deleteDialog;
let muscleFilterToggle, equipmentFilterToggle;
let muscleFilterContent, equipmentFilterContent;

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    console.log('[Exercise Library] Initializing...');
    initializeDOMElements();
    setupEventListeners();
    loadExercises();
    setupIntersectionObserver();
});

// Initialize DOM element references
function initializeDOMElements() {
    searchBox = document.getElementById('searchBox');
    muscleFilters = document.getElementById('muscleFilters');
    equipmentFilters = document.getElementById('equipmentFilters');
    exerciseGrid = document.getElementById('exerciseGrid');
    loadingState = document.getElementById('loadingState');
    emptyState = document.getElementById('emptyState');
    editModal = document.getElementById('editModal');
    deleteDialog = document.getElementById('deleteDialog');
    muscleFilterToggle = document.getElementById('muscleFilterToggle');
    equipmentFilterToggle = document.getElementById('equipmentFilterToggle');
    muscleFilterContent = document.getElementById('muscleFilterContent');
    equipmentFilterContent = document.getElementById('equipmentFilterContent');
}

// Setup event listeners
function setupEventListeners() {
    // Search
    searchBox.addEventListener('input', handleSearch);

    // Filter toggles
    muscleFilterToggle.addEventListener('click', () => toggleFilterSection('muscle'));
    equipmentFilterToggle.addEventListener('click', () => toggleFilterSection('equipment'));

    // Clear filters
    document.getElementById('clearFilters').addEventListener('click', clearAllFilters);

    // Modal close buttons
    document.getElementById('closeEditModal').addEventListener('click', closeEditModal);
    document.getElementById('cancelEdit').addEventListener('click', closeEditModal);
    document.getElementById('cancelDelete').addEventListener('click', closeDeleteDialog);

    // Form submit
    document.getElementById('editExerciseForm').addEventListener('submit', handleEditSubmit);

    console.log('[Exercise Library] Event listeners setup complete');
}

// Toggle filter section (accordion)
function toggleFilterSection(type) {
    if (type === 'muscle') {
        muscleFilterContent.classList.toggle('open');
        muscleFilterToggle.classList.toggle('open');
    } else {
        equipmentFilterContent.classList.toggle('open');
        equipmentFilterToggle.classList.toggle('open');
    }
}

// Load exercises from API
async function loadExercises() {
    try {
        showLoading();

        const response = await fetch('/api/exercises?per_page=100');
        const data = await response.json();

        if (data.exercises && data.exercises.length > 0) {
            state.allExercises = data.exercises;
            state.filteredExercises = [...state.allExercises];
            state.allMuscleGroups = data.muscle_groups || [];
            state.allEquipment = data.equipment || [];

            buildFilterTags();
            displayExercises();
            hideLoading();
        } else {
            hideLoading();
            showEmptyState();
        }
    } catch (error) {
        console.error('[Exercise Library] Failed to load exercises:', error);
        hideLoading();
        showEmptyState();
    }
}

// Build filter tag chips
function buildFilterTags() {
    // Muscle groups
    muscleFilters.innerHTML = '';
    state.allMuscleGroups.forEach(muscle => {
        const tag = document.createElement('div');
        tag.className = 'filter-tag';
        tag.textContent = muscle;
        tag.onclick = () => toggleFilter('muscle', muscle, tag);
        muscleFilters.appendChild(tag);
    });

    // Equipment
    equipmentFilters.innerHTML = '';
    state.allEquipment.forEach(eq => {
        const tag = document.createElement('div');
        tag.className = 'filter-tag';
        tag.textContent = eq;
        tag.onclick = () => toggleFilter('equipment', eq, tag);
        equipmentFilters.appendChild(tag);
    });

    updateFilterCounts();
}

// Toggle individual filter
function toggleFilter(type, value, element) {
    if (type === 'muscle') {
        if (state.selectedMuscles.has(value)) {
            state.selectedMuscles.delete(value);
            element.classList.remove('active');
        } else {
            state.selectedMuscles.add(value);
            element.classList.add('active');
        }
    } else {
        if (state.selectedEquipment.has(value)) {
            state.selectedEquipment.delete(value);
            element.classList.remove('active');
        } else {
            state.selectedEquipment.add(value);
            element.classList.add('active');
        }
    }

    updateFilterCounts();
    filterExercises();
}

// Update filter counts
function updateFilterCounts() {
    const muscleCount = document.getElementById('muscleFilterCount');
    const equipmentCount = document.getElementById('equipmentFilterCount');

    if (state.selectedMuscles.size > 0) {
        muscleCount.textContent = state.selectedMuscles.size;
        muscleCount.style.display = 'inline-block';
    } else {
        muscleCount.style.display = 'none';
    }

    if (state.selectedEquipment.size > 0) {
        equipmentCount.textContent = state.selectedEquipment.size;
        equipmentCount.style.display = 'inline-block';
    } else {
        equipmentCount.style.display = 'none';
    }
}

// Clear all filters
function clearAllFilters() {
    state.selectedMuscles.clear();
    state.selectedEquipment.clear();
    state.searchTerm = '';
    searchBox.value = '';

    // Remove active class from all filter tags
    document.querySelectorAll('.filter-tag.active').forEach(tag => {
        tag.classList.remove('active');
    });

    updateFilterCounts();
    filterExercises();
}

// Handle search input
function handleSearch(e) {
    state.searchTerm = e.target.value.toLowerCase();
    filterExercises();
}

// Filter exercises based on search and selected filters
function filterExercises() {
    state.filteredExercises = state.allExercises.filter(exercise => {
        // Search term match
        const nameMatch = state.searchTerm === '' ||
            exercise.exercise_name.toLowerCase().includes(state.searchTerm);

        // Muscle groups match (if any selected)
        const muscleMatch = state.selectedMuscles.size === 0 ||
            (exercise.muscle_groups && exercise.muscle_groups.some(mg => state.selectedMuscles.has(mg)));

        // Equipment match (if any selected)
        const equipmentMatch = state.selectedEquipment.size === 0 ||
            (exercise.equipment && exercise.equipment.some(eq => state.selectedEquipment.has(eq)));

        return nameMatch && muscleMatch && equipmentMatch;
    });

    displayExercises();
}

// Display exercises in grid
function displayExercises() {
    exerciseGrid.innerHTML = '';

    if (state.filteredExercises.length === 0) {
        exerciseGrid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 60px 20px;">
                <div style="font-size: 48px; margin-bottom: 16px; opacity: 0.5;">🔍</div>
                <h3 style="color: var(--text-dark); margin-bottom: 8px;">לא נמצאו תרגילים</h3>
                <p style="color: var(--text-light);">נסה לשנות את החיפוש או הסינון</p>
            </div>
        `;
        return;
    }

    state.filteredExercises.forEach(exercise => {
        const card = createExerciseCard(exercise);
        exerciseGrid.appendChild(card);
    });
}

// Create exercise card element
function createExerciseCard(exercise) {
    const card = document.createElement('div');
    card.className = 'exercise-card';
    card.dataset.exerciseId = exercise.id;

    // Video container with scroll-to-play
    const videoHTML = exercise.video_url
        ? `
        <div class="exercise-video-container" onclick="toggleCardVideo(${exercise.id})">
            <video class="exercise-video" data-video-id="${exercise.id}" muted loop playsinline>
                <source src="${exercise.video_url}" type="video/mp4">
            </video>
            <div class="video-overlay">
                <div class="play-icon">▶️</div>
            </div>
        </div>
        `
        : `
        <div class="exercise-video-container">
            ${exercise.thumbnail_url
                ? `<img src="${exercise.thumbnail_url}" class="exercise-thumbnail" alt="${exercise.exercise_name}">`
                : `<div class="exercise-thumbnail" style="display: flex; align-items: center; justify-content: center; color: white; font-size: 64px;">🎥</div>`
            }
        </div>
        `;

    card.innerHTML = `
        ${videoHTML}
        <div class="exercise-info">
            <div class="exercise-header">
                <div class="exercise-name">${exercise.exercise_name}</div>
                <div class="exercise-actions">
                    <button class="action-btn edit" onclick="openEditModal(${exercise.id})" title="ערוך">
                        ✏️
                    </button>
                    <button class="action-btn delete" onclick="openDeleteDialog(${exercise.id})" title="מחק">
                        🗑️
                    </button>
                </div>
            </div>
            <div class="exercise-duration">
                <span>⏱️</span>
                <span>${formatDuration(exercise.duration)}</span>
            </div>
            <div class="exercise-tags">
                ${(exercise.muscle_groups || []).map(mg => `
                    <span class="tag-chip">${mg}</span>
                `).join('')}
                ${(exercise.equipment || []).map(eq => `
                    <span class="tag-chip equipment">${eq}</span>
                `).join('')}
            </div>
        </div>
    `;

    return card;
}

// Toggle video play/pause for card
window.toggleCardVideo = function(exerciseId) {
    const card = document.querySelector(`[data-exercise-id="${exerciseId}"]`);
    const video = card.querySelector('.exercise-video');

    if (!video) return;

    if (video.paused) {
        // Pause all other videos first
        state.playingCards.forEach(id => {
            if (id !== exerciseId) {
                const otherCard = document.querySelector(`[data-exercise-id="${id}"]`);
                const otherVideo = otherCard?.querySelector('.exercise-video');
                if (otherVideo && !otherVideo.paused) {
                    otherVideo.pause();
                    otherCard.classList.remove('playing');
                }
            }
        });

        video.play();
        card.classList.add('playing');
        state.playingCards.add(exerciseId);
    } else {
        video.pause();
        card.classList.remove('playing');
        state.playingCards.delete(exerciseId);
    }
};

// Setup Intersection Observer for scroll-to-play
function setupIntersectionObserver() {
    const options = {
        root: null,
        rootMargin: '0px',
        threshold: 0.5 // 50% of video must be visible
    };

    state.intersectionObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            const video = entry.target;
            const card = video.closest('.exercise-card');

            if (!entry.isIntersecting && !video.paused) {
                // Video scrolled out of view - pause it
                video.pause();
                card.classList.remove('playing');
                const exerciseId = parseInt(card.dataset.exerciseId);
                state.playingCards.delete(exerciseId);
            }
        });
    }, options);

    // Observe all videos whenever we display exercises
    observeVideos();
}

// Observe all video elements
function observeVideos() {
    // Disconnect previous observations
    if (state.intersectionObserver) {
        document.querySelectorAll('.exercise-video').forEach(video => {
            state.intersectionObserver.observe(video);
        });
    }
}

// Format duration
function formatDuration(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    if (mins > 0) {
        return `${mins}:${secs.toString().padStart(2, '0')} דקות`;
    }
    return `${secs} שניות`;
}

// Open edit modal
window.openEditModal = function(exerciseId) {
    const exercise = state.allExercises.find(ex => ex.id === exerciseId);
    if (!exercise) return;

    state.currentExercise = exercise;

    // Populate form
    document.getElementById('editExerciseName').value = exercise.exercise_name;

    // Populate muscle groups chips
    const muscleChips = document.getElementById('editMuscleChips');
    muscleChips.innerHTML = '';
    (exercise.muscle_groups || []).forEach(mg => {
        addChip(muscleChips, mg, 'muscle');
    });

    // Populate equipment chips
    const equipmentChips = document.getElementById('editEquipmentChips');
    equipmentChips.innerHTML = '';
    (exercise.equipment || []).forEach(eq => {
        addChip(equipmentChips, eq, 'equipment');
    });

    // Show modal
    editModal.classList.add('open');
};

// Close edit modal
function closeEditModal() {
    editModal.classList.remove('open');
    state.currentExercise = null;
    document.getElementById('editExerciseForm').reset();
}

// Handle edit form submit
async function handleEditSubmit(e) {
    e.preventDefault();

    if (!state.currentExercise) return;

    const exerciseName = document.getElementById('editExerciseName').value.trim();
    const muscleGroups = Array.from(document.getElementById('editMuscleChips').querySelectorAll('.chip'))
        .map(chip => chip.textContent.replace('×', '').trim());
    const equipment = Array.from(document.getElementById('editEquipmentChips').querySelectorAll('.chip'))
        .map(chip => chip.textContent.replace('×', '').trim());

    if (!exerciseName) {
        alert('אנא הזן שם תרגיל');
        return;
    }

    if (muscleGroups.length === 0) {
        alert('אנא בחר לפחות קבוצת שריר אחת');
        return;
    }

    if (equipment.length === 0) {
        alert('אנא בחר לפחות ציוד אחד');
        return;
    }

    try {
        const response = await fetch(`/api/exercises/${state.currentExercise.id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                exercise_name: exerciseName,
                muscle_groups: muscleGroups,
                equipment: equipment
            })
        });

        const data = await response.json();

        if (data.success) {
            // Update local state
            const index = state.allExercises.findIndex(ex => ex.id === state.currentExercise.id);
            if (index !== -1) {
                state.allExercises[index] = {
                    ...state.allExercises[index],
                    exercise_name: exerciseName,
                    muscle_groups: muscleGroups,
                    equipment: equipment
                };
            }

            closeEditModal();
            filterExercises();

            // Show success message
            showToast('התרגיל עודכן בהצלחה!', 'success');
        } else {
            alert('שגיאה בעדכון התרגיל: ' + (data.error || 'Unknown error'));
        }
    } catch (error) {
        console.error('Failed to update exercise:', error);
        alert('שגיאה בעדכון התרגיל');
    }
}

// Add chip to container
function addChip(container, value, type) {
    const chip = document.createElement('div');
    chip.className = 'chip';
    chip.innerHTML = `
        ${value}
        <button class="chip-remove" onclick="removeChip(this)">×</button>
    `;
    container.appendChild(chip);
}

// Remove chip
window.removeChip = function(button) {
    button.closest('.chip').remove();
};

// Setup autocomplete for inputs
document.getElementById('editMuscleInput')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        const value = e.target.value.trim();
        if (value) {
            addChip(document.getElementById('editMuscleChips'), value, 'muscle');
            e.target.value = '';
        }
    }
});

document.getElementById('editEquipmentInput')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        const value = e.target.value.trim();
        if (value) {
            addChip(document.getElementById('editEquipmentChips'), value, 'equipment');
            e.target.value = '';
        }
    }
});

// Open delete confirmation dialog
window.openDeleteDialog = function(exerciseId) {
    const exercise = state.allExercises.find(ex => ex.id === exerciseId);
    if (!exercise) return;

    state.currentExercise = exercise;
    document.getElementById('deleteExerciseName').textContent = exercise.exercise_name;
    deleteDialog.classList.add('open');
};

// Close delete dialog
function closeDeleteDialog() {
    deleteDialog.classList.remove('open');
    state.currentExercise = null;
}

// Confirm delete
window.confirmDelete = async function() {
    if (!state.currentExercise) return;

    try {
        const response = await fetch(`/api/exercises/${state.currentExercise.id}`, {
            method: 'DELETE'
        });

        const data = await response.json();

        if (data.success) {
            // Remove from local state
            state.allExercises = state.allExercises.filter(ex => ex.id !== state.currentExercise.id);

            closeDeleteDialog();
            filterExercises();

            // Show success message
            showToast('התרגיל נמחק בהצלחה!', 'success');
        } else {
            alert('שגיאה במחיקת התרגיל: ' + (data.error || 'Unknown error'));
        }
    } catch (error) {
        console.error('Failed to delete exercise:', error);
        alert('שגיאה במחיקת התרגיל');
    }
};

// Show loading state
function showLoading() {
    loadingState.style.display = 'block';
    exerciseGrid.style.display = 'none';
    emptyState.style.display = 'none';
}

// Hide loading state
function hideLoading() {
    loadingState.style.display = 'none';
    exerciseGrid.style.display = 'grid';
}

// Show empty state
function showEmptyState() {
    loadingState.style.display = 'none';
    exerciseGrid.style.display = 'none';
    emptyState.style.display = 'block';
}

// Toast notification
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? 'var(--success-color)' : 'var(--danger-color)'};
        color: white;
        padding: 16px 24px;
        border-radius: var(--border-radius-sm);
        box-shadow: var(--shadow-lg);
        z-index: 9999;
        animation: slideIn 0.3s ease-out;
    `;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Add animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

console.log('[Exercise Library] Initialized successfully');
