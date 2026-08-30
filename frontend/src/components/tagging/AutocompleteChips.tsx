import { useState, useRef, useImperativeHandle } from 'react';
import type { Ref } from 'react';
import { X, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface AutocompleteChipsHandle {
  /**
   * Commit whatever text is still sitting in the input and return the
   * resulting list. Parents call this before saving so a value the user
   * typed but never confirmed is not silently dropped.
   */
  flush: () => string[];
}

interface AutocompleteChipsProps {
  label: string;
  placeholder: string;
  options: string[];
  value: string[];
  onChange: (value: string[]) => void;
  /** Heading shown above the row of pickable existing values */
  suggestionsLabel?: string;
  /** Shown instead of the suggestion chips when there are no options yet */
  emptySuggestionsLabel?: string;
  ref?: Ref<AutocompleteChipsHandle>;
}

export function AutocompleteChips({
  label,
  placeholder,
  options,
  value,
  onChange,
  suggestionsLabel = 'Suggestions',
  emptySuggestionsLabel,
  ref,
}: AutocompleteChipsProps) {
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const isSelected = (option: string) =>
    value.some((v) => v.toLowerCase() === option.toLowerCase());

  // Existing values the user can tap, narrowed by whatever is typed so far
  const suggestions = options.filter(
    (opt) =>
      !isSelected(opt) &&
      opt.toLowerCase().includes(inputValue.trim().toLowerCase())
  );

  /**
   * Add `raw` to the list and clear the input. Returns the resulting list so
   * callers can use it immediately instead of waiting for a re-render.
   */
  const commit = (raw: string): string[] => {
    const trimmed = raw.trim();
    setInputValue('');

    if (!trimmed || isSelected(trimmed)) return value;

    // Reuse the existing spelling when the typed text matches a known option
    const canonical =
      options.find((opt) => opt.toLowerCase() === trimmed.toLowerCase()) ??
      trimmed;

    const next = [...value, canonical];
    onChange(next);
    return next;
  };

  useImperativeHandle(ref, () => ({ flush: () => commit(inputValue) }));

  const removeChip = (chip: string) => {
    onChange(value.filter((v) => v !== chip));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      commit(inputValue);
    } else if (e.key === 'Backspace' && !inputValue && value.length > 0) {
      removeChip(value[value.length - 1]);
    }
  };

  return (
    <div className="space-y-2 min-w-0">
      <label className="block text-sm font-medium text-gray-300">{label}</label>

      {/* Selected chips */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((chip) => (
            <span
              key={chip}
              className="inline-flex items-center gap-1 bg-blue-600 text-white px-2 py-1 rounded-full text-sm max-w-full"
            >
              <span className="truncate">{chip}</span>
              <button
                type="button"
                onClick={() => removeChip(chip)}
                className="hover:bg-blue-700 rounded-full p-0.5 shrink-0"
                aria-label={`Remove ${chip}`}
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Free text input + explicit add button (mobile keyboards do not always
          deliver a usable Enter key press) */}
      <div className="flex gap-2 min-w-0" data-vaul-no-drag>
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          // Commit on blur so text typed but never confirmed is not lost
          onBlur={() => commit(inputValue)}
          placeholder={placeholder}
          autoComplete="off"
          autoCorrect="off"
          enterKeyHint="done"
          className="flex-1 min-w-0 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white
                     placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="button"
          // Keep focus in the input so onBlur does not commit the same text twice
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => {
            commit(inputValue);
            inputRef.current?.focus();
          }}
          disabled={!inputValue.trim()}
          className="shrink-0 w-11 h-11 flex items-center justify-center rounded-lg bg-blue-600
                     text-white hover:bg-blue-700 active:bg-blue-800 disabled:opacity-40
                     disabled:pointer-events-none"
          aria-label={`Add ${label}`}
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {/* Existing values, tappable */}
      {options.length > 0 ? (
        <div className="space-y-1">
          <p className="text-xs text-gray-500">{suggestionsLabel}</p>
          {suggestions.length > 0 ? (
            <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
              {suggestions.map((option) => (
                <button
                  key={option}
                  type="button"
                  // Prevent the blur-commit from also adding the typed text
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => commit(option)}
                  className={cn(
                    'inline-flex items-center gap-1 max-w-full rounded-full border border-gray-600',
                    'bg-gray-800 px-3 py-1.5 text-sm text-gray-200',
                    'hover:bg-gray-700 hover:border-gray-500 active:bg-gray-600'
                  )}
                >
                  <Plus className="w-3 h-3 shrink-0 text-gray-400" />
                  <span className="truncate">{option}</span>
                </button>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-600">—</p>
          )}
        </div>
      ) : (
        emptySuggestionsLabel && (
          <p className="text-xs text-gray-600">{emptySuggestionsLabel}</p>
        )
      )}
    </div>
  );
}
