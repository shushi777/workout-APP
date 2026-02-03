import { NavLink } from 'react-router-dom';
import { Upload, Film, Library } from 'lucide-react';
import { cn } from '@/lib/utils';

const tabs = [
  { to: '/', icon: Upload, label: 'Upload' },
  { to: '/editor', icon: Film, label: 'Editor' },
  { to: '/library', icon: Library, label: 'Library' },
] as const;

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 inset-x-0 bg-gray-900 border-t border-gray-800 safe-area-pb z-50">
      <div className="flex justify-around">
        {tabs.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) => cn(
              "flex flex-col items-center justify-center",
              "min-h-[56px] min-w-[64px] px-3 py-2",  // 44px+ touch target
              "text-gray-400 transition-colors",
              isActive && "text-blue-500"
            )}
          >
            <Icon className="w-6 h-6" />
            <span className="text-xs mt-1">{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
