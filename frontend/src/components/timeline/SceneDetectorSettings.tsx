import { Settings } from 'lucide-react';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/Button';
import { useSceneDetectorStore } from '@/stores/sceneDetectorStore';
import { DetectionSlider } from './DetectionSlider';

interface SceneDetectorSettingsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onReprocess: () => void;
  isProcessing?: boolean;
}

export function SceneDetectorSettings({
  open,
  onOpenChange,
  onReprocess,
  isProcessing = false,
}: SceneDetectorSettingsProps) {
  const {
    threshold,
    minSceneLen,
    setThreshold,
    setMinSceneLen,
    resetToDefaults,
  } = useSceneDetectorStore();

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="bg-gray-800" dir="rtl">
        <DrawerHeader>
          <DrawerTitle className="text-gray-100 flex items-center gap-2">
            <Settings className="w-5 h-5" />
            הגדרות זיהוי סצנות
          </DrawerTitle>
        </DrawerHeader>

        <div className="p-4 space-y-6">
          {/* Threshold slider - Detection Sensitivity */}
          <DetectionSlider
            label="רגישות זיהוי"
            value={threshold}
            onChange={setThreshold}
            min={8}
            max={50}
            step={1}
            helpText="ערך נמוך יותר = זיהוי רגיש יותר (יותר חיתוכים)"
          />

          {/* Min scene length slider */}
          <DetectionSlider
            label="אורך סצנה מינימלי (שניות)"
            value={minSceneLen}
            onChange={setMinSceneLen}
            min={0.3}
            max={3.0}
            step={0.1}
            helpText="מונע סצנות קצרות מדי"
          />

          {/* Reset to defaults button */}
          <Button
            onClick={resetToDefaults}
            variant="ghost"
            size="sm"
            className="text-gray-400"
          >
            איפוס להגדרות ברירת מחדל
          </Button>
        </div>

        <DrawerFooter>
          <Button
            onClick={onReprocess}
            variant="primary"
            disabled={isProcessing}
            className="w-full"
          >
            {isProcessing ? 'מזהה סצנות...' : 'הרץ זיהוי מחדש'}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
