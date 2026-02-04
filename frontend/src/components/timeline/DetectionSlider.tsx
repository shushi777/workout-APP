import { useId } from 'react';

interface DetectionSliderProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step: number;
  helpText?: string;
}

export function DetectionSlider({
  label,
  value,
  onChange,
  min,
  max,
  step,
  helpText,
}: DetectionSliderProps) {
  const id = useId();
  const helpId = helpText ? `${id}-help` : undefined;

  // Calculate fill percentage for visual gradient
  const percentage = ((value - min) / (max - min)) * 100;

  // Format value for display (show 1 decimal for decimals, none for integers)
  const displayValue = step < 1 ? value.toFixed(1) : value.toString();

  return (
    <div className="space-y-2">
      {/* Label and current value */}
      <div className="flex items-center justify-between">
        <label htmlFor={id} className="text-sm font-medium text-gray-200">
          {label}
        </label>
        <span className="text-sm font-mono text-blue-400">{displayValue}</span>
      </div>

      {/* Slider input */}
      <input
        type="range"
        id={id}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        min={min}
        max={max}
        step={step}
        aria-describedby={helpId}
        className="detection-slider w-full h-2 rounded-full bg-gray-700 appearance-none cursor-pointer"
        style={{
          '--value-percent': `${percentage}%`,
          background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${percentage}%, #374151 ${percentage}%, #374151 100%)`,
        } as React.CSSProperties}
      />

      {/* Min/Max markers */}
      <div className="flex justify-between text-xs text-gray-500" dir="ltr">
        <span>{min}</span>
        <span>{max}</span>
      </div>

      {/* Help text */}
      {helpText && (
        <p id={helpId} className="text-xs text-gray-400">
          {helpText}
        </p>
      )}

      {/* Slider thumb styling */}
      <style>{`
        .detection-slider::-webkit-slider-thumb {
          appearance: none;
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: #3b82f6;
          border: 2px solid white;
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
        }
        .detection-slider::-moz-range-thumb {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: #3b82f6;
          border: 2px solid white;
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
        }
        .detection-slider:focus-visible {
          outline: none;
        }
        .detection-slider:focus-visible::-webkit-slider-thumb {
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.5);
        }
        .detection-slider:focus-visible::-moz-range-thumb {
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.5);
        }
      `}</style>
    </div>
  );
}
