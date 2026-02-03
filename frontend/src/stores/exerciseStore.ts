import { create } from 'zustand';
import { fetchExercises, updateExercise, deleteExercise } from '@/lib/api';
import type { Exercise, ExercisesFilters } from '@/lib/api';

interface ExerciseState {
  // Data
  exercises: Exercise[];
  allMuscleGroups: string[];
  allEquipment: string[];

  // Filters
  searchQuery: string;
  selectedMuscleGroups: string[];
  selectedEquipment: string[];

  // Pagination
  page: number;
  perPage: number;
  totalCount: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;

  // Status
  isLoading: boolean;
  error: string | null;

  // Actions
  setSearchQuery: (query: string) => void;
  toggleMuscleGroup: (muscleGroup: string) => void;
  toggleEquipment: (equipment: string) => void;
  clearFilters: () => void;
  fetchExercises: () => Promise<void>;
  updateExercise: (exerciseId: number, data: { exercise_name?: string; muscle_groups?: string[]; equipment?: string[]; remove_audio?: boolean }) => Promise<void>;
  deleteExercise: (exerciseId: number) => Promise<void>;
  setPage: (page: number) => void;
}

export const useExerciseStore = create<ExerciseState>()((set, get) => ({
  // Initial state
  exercises: [],
  allMuscleGroups: [],
  allEquipment: [],

  searchQuery: '',
  selectedMuscleGroups: [],
  selectedEquipment: [],

  page: 1,
  perPage: 20,
  totalCount: 0,
  totalPages: 0,
  hasNext: false,
  hasPrev: false,

  isLoading: false,
  error: null,

  // Filter actions
  setSearchQuery: (query) => {
    set({ searchQuery: query, page: 1 });
    // Auto-fetch when search changes
    get().fetchExercises();
  },

  toggleMuscleGroup: (muscleGroup) => {
    const current = get().selectedMuscleGroups;
    const updated = current.includes(muscleGroup)
      ? current.filter(mg => mg !== muscleGroup)
      : [...current, muscleGroup];
    set({ selectedMuscleGroups: updated, page: 1 });
    // Auto-fetch when filter changes
    get().fetchExercises();
  },

  toggleEquipment: (equipment) => {
    const current = get().selectedEquipment;
    const updated = current.includes(equipment)
      ? current.filter(eq => eq !== equipment)
      : [...current, equipment];
    set({ selectedEquipment: updated, page: 1 });
    // Auto-fetch when filter changes
    get().fetchExercises();
  },

  clearFilters: () => {
    set({
      searchQuery: '',
      selectedMuscleGroups: [],
      selectedEquipment: [],
      page: 1
    });
    // Auto-fetch after clearing
    get().fetchExercises();
  },

  // CRUD actions
  fetchExercises: async () => {
    const state = get();
    set({ isLoading: true, error: null });

    try {
      const filters: ExercisesFilters = {
        search: state.searchQuery || undefined,
        muscle_groups: state.selectedMuscleGroups.length > 0 ? state.selectedMuscleGroups : undefined,
        equipment: state.selectedEquipment.length > 0 ? state.selectedEquipment : undefined,
        page: state.page,
        per_page: state.perPage,
        sort_by: 'created_at',
        sort_order: 'desc'
      };

      const response = await fetchExercises(filters);

      set({
        exercises: response.exercises,
        allMuscleGroups: response.muscle_groups,
        allEquipment: response.equipment,
        totalCount: response.pagination.total_count,
        totalPages: response.pagination.total_pages,
        hasNext: response.pagination.has_next,
        hasPrev: response.pagination.has_prev,
        isLoading: false
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch exercises',
        isLoading: false
      });
    }
  },

  updateExercise: async (exerciseId, data) => {
    set({ isLoading: true, error: null });

    try {
      await updateExercise(exerciseId, data);
      // Refresh exercises after update
      await get().fetchExercises();
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to update exercise',
        isLoading: false
      });
      throw error;
    }
  },

  deleteExercise: async (exerciseId) => {
    set({ isLoading: true, error: null });

    try {
      await deleteExercise(exerciseId);
      // Refresh exercises after delete
      await get().fetchExercises();
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to delete exercise',
        isLoading: false
      });
      throw error;
    }
  },

  setPage: (page) => {
    set({ page });
    // Auto-fetch when page changes
    get().fetchExercises();
  }
}));
