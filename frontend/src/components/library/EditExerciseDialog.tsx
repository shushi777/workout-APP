import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { AutocompleteChips } from '@/components/tagging/AutocompleteChips';
import { Button } from '@/components/ui/Button';
import type { Exercise } from '@/lib/api';

interface EditExerciseDialogProps {
  exercise: Exercise | null;
  open: boolean;
  onClose: () => void;
  onSave: (exerciseId: number, data: {
    exercise_name: string;
    muscle_groups: string[];
    equipment: string[];
  }) => Promise<void>;
  allMuscleGroups: string[];
  allEquipment: string[];
}

export function EditExerciseDialog({
  exercise,
  open,
  onClose,
  onSave,
  allMuscleGroups,
  allEquipment,
}: EditExerciseDialogProps) {
  const [exerciseName, setExerciseName] = useState('');
  const [muscleGroups, setMuscleGroups] = useState<string[]>([]);
  const [equipment, setEquipment] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize form with exercise data when dialog opens
  useEffect(() => {
    if (exercise) {
      setExerciseName(exercise.exercise_name);
      setMuscleGroups(exercise.muscle_groups || []);
      setEquipment(exercise.equipment || []);
      setError(null);
    }
  }, [exercise]);

  const handleSave = async () => {
    if (!exercise) return;

    // Validation
    if (!exerciseName.trim()) {
      setError('Exercise name is required');
      return;
    }

    if (muscleGroups.length === 0) {
      setError('At least one muscle group is required');
      return;
    }

    if (equipment.length === 0) {
      setError('At least one equipment is required');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      await onSave(exercise.id, {
        exercise_name: exerciseName.trim(),
        muscle_groups: muscleGroups,
        equipment: equipment,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save exercise');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (!isSaving) {
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleCancel()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Exercise</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Error message */}
          {error && (
            <div className="bg-red-900/20 border border-red-500 rounded-lg p-3 text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Exercise name */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-300">
              Exercise Name
            </label>
            <input
              type="text"
              value={exerciseName}
              onChange={(e) => setExerciseName(e.target.value)}
              placeholder="e.g., Push-ups"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white
                         placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isSaving}
            />
          </div>

          {/* Muscle groups */}
          <AutocompleteChips
            label="Muscle Groups"
            placeholder="Type to search or add new..."
            options={allMuscleGroups}
            value={muscleGroups}
            onChange={setMuscleGroups}
          />

          {/* Equipment */}
          <AutocompleteChips
            label="Equipment"
            placeholder="Type to search or add new..."
            options={allEquipment}
            value={equipment}
            onChange={setEquipment}
          />

          {/* Actions */}
          <div className="flex gap-3 justify-end pt-4">
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={isSaving}
              style={{ minWidth: '44px', minHeight: '44px' }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving}
              style={{ minWidth: '44px', minHeight: '44px' }}
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
