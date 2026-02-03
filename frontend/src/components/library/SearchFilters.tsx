import { Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SearchFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedMuscleGroups: string[];
  onToggleMuscleGroup: (muscleGroup: string) => void;
  allMuscleGroups: string[];
  selectedEquipment: string[];
  onToggleEquipment: (equipment: string) => void;
  allEquipment: string[];
  onClearFilters: () => void;
}

export function SearchFilters({
  searchQuery,
  onSearchChange,
  selectedMuscleGroups,
  onToggleMuscleGroup,
  allMuscleGroups,
  selectedEquipment,
  onToggleEquipment,
  allEquipment,
  onClearFilters,
}: SearchFiltersProps) {
  const hasActiveFilters = searchQuery || selectedMuscleGroups.length > 0 || selectedEquipment.length > 0;

  return (
    <div className="space-y-4">
      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search exercises..."
          className="w-full bg-gray-900 border border-gray-700 rounded-lg pl-10 pr-10 py-3 text-white
                     placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {searchQuery && (
          <button
            onClick={() => onSearchChange('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
            aria-label="Clear search"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Filter chips container */}
      <div className="space-y-3">
        {/* Muscle groups filter */}
        {allMuscleGroups.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Muscle Groups
            </label>
            <div className="flex flex-wrap gap-2">
              {allMuscleGroups.map((muscleGroup) => {
                const isSelected = selectedMuscleGroups.includes(muscleGroup);
                return (
                  <button
                    key={muscleGroup}
                    onClick={() => onToggleMuscleGroup(muscleGroup)}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-sm font-medium transition-colors",
                      "min-h-[44px] min-w-[44px]", // WCAG AAA touch target
                      isSelected
                        ? "bg-blue-600 text-white hover:bg-blue-700"
                        : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                    )}
                  >
                    {muscleGroup}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Equipment filter */}
        {allEquipment.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Equipment
            </label>
            <div className="flex flex-wrap gap-2">
              {allEquipment.map((equipment) => {
                const isSelected = selectedEquipment.includes(equipment);
                return (
                  <button
                    key={equipment}
                    onClick={() => onToggleEquipment(equipment)}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-sm font-medium transition-colors",
                      "min-h-[44px] min-w-[44px]", // WCAG AAA touch target
                      isSelected
                        ? "bg-blue-600 text-white hover:bg-blue-700"
                        : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                    )}
                  >
                    {equipment}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Clear filters button */}
        {hasActiveFilters && (
          <button
            onClick={onClearFilters}
            className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1"
          >
            <X className="w-4 h-4" />
            Clear all filters
          </button>
        )}
      </div>
    </div>
  );
}
