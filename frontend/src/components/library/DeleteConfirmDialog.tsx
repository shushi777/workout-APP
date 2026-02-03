import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';
import type { Exercise } from '@/lib/api';

interface DeleteConfirmDialogProps {
  exercise: Exercise | null;
  open: boolean;
  onClose: () => void;
  onConfirm: (exerciseId: number) => Promise<void>;
}

export function DeleteConfirmDialog({
  exercise,
  open,
  onClose,
  onConfirm,
}: DeleteConfirmDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    if (!exercise) return;

    setIsDeleting(true);
    setError(null);

    try {
      await onConfirm(exercise.id);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete exercise');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancel = () => {
    if (!isDeleting) {
      setError(null);
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleCancel()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            Delete Exercise
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            This action cannot be undone. The video file and all associated data will be permanently deleted.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Error message */}
          {error && (
            <div className="bg-red-900/20 border border-red-500 rounded-lg p-3 text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Exercise info */}
          {exercise && (
            <div className="bg-gray-800 rounded-lg p-4">
              <p className="text-white font-medium mb-1">{exercise.exercise_name}</p>
              <div className="flex flex-wrap gap-2 mt-2">
                {exercise.muscle_groups?.map((muscle) => (
                  <span
                    key={muscle}
                    className="text-xs bg-blue-600/20 text-blue-400 px-2 py-1 rounded-full"
                  >
                    {muscle}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 justify-end pt-4">
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={isDeleting}
              style={{ minWidth: '44px', minHeight: '44px' }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={isDeleting}
              style={{ minWidth: '44px', minHeight: '44px' }}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isDeleting ? 'Deleting...' : 'Delete Exercise'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
