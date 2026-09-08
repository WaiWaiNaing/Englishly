"use client";

import type { ComponentType } from "react";

interface ChipProps {
  icon?: ComponentType<{ className?: string }>;
  // Alternative to `icon` for cases an SVG doesn't fit better as-is — e.g.
  // a flag emoji for the language picker.
  flag?: string;
  label: string;
  selected: boolean;
  onClick: () => void;
  disabled?: boolean;
}

// Shared icon + label pill used for the Tone/Context/Language pickers on
// the Rewrite form and the filter row on History, so all three stay
// visually identical instead of drifting (one used to be a native <select>).
export function Chip({ icon: Icon, flag, label, selected, onClick, disabled }: ChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors disabled:opacity-40 ${
        selected
          ? "border-indigo-600 bg-indigo-600 text-white dark:border-indigo-500 dark:bg-indigo-500"
          : "border-neutral-300 text-neutral-600 hover:border-neutral-400 hover:text-neutral-900 dark:border-neutral-700 dark:text-neutral-400 dark:hover:border-neutral-500 dark:hover:text-neutral-100"
      }`}
    >
      {Icon && <Icon className="h-4 w-4" />}
      {flag && <span aria-hidden="true">{flag}</span>}
      {label}
    </button>
  );
}
