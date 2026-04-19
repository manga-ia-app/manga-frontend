"use client";

import { NavigationOption } from "@/lib/types/chat";

interface NavigationChipsProps {
  options: NavigationOption[];
  onNavigate: (route: string) => void;
}

export function NavigationChips({ options, onNavigate }: NavigationChipsProps) {
  return (
    <div role="navigation" aria-label="Opções de navegação" className="flex flex-wrap gap-1.5 mt-2">
      {options.map((option) => (
        <button
          key={option.route}
          type="button"
          onClick={() => onNavigate(option.route)}
          className="bg-primary/10 text-primary hover:bg-primary/20 rounded-full px-3 py-1 text-xs cursor-pointer transition-colors"
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
