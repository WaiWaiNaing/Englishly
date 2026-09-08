import type { ReactNode } from "react";

interface IconProps {
  className?: string;
}

function IconBase({ className, children }: IconProps & { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

export function SparklesIcon({ className }: IconProps) {
  return (
    <IconBase className={className}>
      <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6.5 6.5l2 2M15.5 15.5l2 2M17.5 6.5l-2 2M8.5 15.5l-2 2" />
      <path d="M12 8a4 4 0 0 0 4 4 4 4 0 0 0-4 4 4 4 0 0 0-4-4 4 4 0 0 0 4-4Z" />
    </IconBase>
  );
}

export function ClockIcon({ className }: IconProps) {
  return (
    <IconBase className={className}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 3" />
    </IconBase>
  );
}

export function BriefcaseIcon({ className }: IconProps) {
  return (
    <IconBase className={className}>
      <rect x="3" y="7" width="18" height="13" rx="2" />
      <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <path d="M3 13h18" />
    </IconBase>
  );
}

export function SmileIcon({ className }: IconProps) {
  return (
    <IconBase className={className}>
      <circle cx="12" cy="12" r="9" />
      <path d="M8 14s1.5 2 4 2 4-2 4-2" />
      <path d="M9 9h.01M15 9h.01" />
    </IconBase>
  );
}

export function FeatherIcon({ className }: IconProps) {
  return (
    <IconBase className={className}>
      <path d="M20 4 9 15" />
      <path d="M20 4c1 4-1 9-5 12-3 2.3-7 3-9 3l1.5-4.5C9 12 13 8 20 4Z" />
      <path d="M4 21l4-4" />
    </IconBase>
  );
}

export function HashIcon({ className }: IconProps) {
  return (
    <IconBase className={className}>
      <path d="M5 9h14M5 15h14M10 4 8 20M16 4l-2 16" />
    </IconBase>
  );
}

export function UsersIcon({ className }: IconProps) {
  return (
    <IconBase className={className}>
      <circle cx="9" cy="8" r="3" />
      <path d="M3 20a6 6 0 0 1 12 0" />
      <circle cx="17" cy="9" r="2.5" />
      <path d="M15 20a5 5 0 0 1 6.5-4.8" />
    </IconBase>
  );
}

export function MessageCircleIcon({ className }: IconProps) {
  return (
    <IconBase className={className}>
      <path d="M12 20c4.97 0 9-3.58 9-8s-4.03-8-9-8-9 3.58-9 8c0 1.85.63 3.55 1.7 4.95L3 21l4.5-1.2A9.9 9.9 0 0 0 12 20Z" />
    </IconBase>
  );
}

export function PhoneIcon({ className }: IconProps) {
  return (
    <IconBase className={className}>
      <path d="M4 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L14 13l5 2v4a2 2 0 0 1-2 2C9.5 21 3 14.5 3 6a2 2 0 0 1 1-2Z" />
    </IconBase>
  );
}

export function MailIcon({ className }: IconProps) {
  return (
    <IconBase className={className}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m4 7 8 6 8-6" />
    </IconBase>
  );
}

export function HeadsetIcon({ className }: IconProps) {
  return (
    <IconBase className={className}>
      <path d="M4 13a8 8 0 0 1 16 0" />
      <rect x="3" y="13" width="4" height="6" rx="1.5" />
      <rect x="17" y="13" width="4" height="6" rx="1.5" />
      <path d="M19 19v1a3 3 0 0 1-3 3h-3" />
    </IconBase>
  );
}

export function CodeIcon({ className }: IconProps) {
  return (
    <IconBase className={className}>
      <path d="m9 8-4 4 4 4M15 8l4 4-4 4" />
    </IconBase>
  );
}

export function DotsIcon({ className }: IconProps) {
  return (
    <IconBase className={className}>
      <path d="M5 12h.01M12 12h.01M19 12h.01" strokeWidth={2.5} />
    </IconBase>
  );
}

export function CopyIcon({ className }: IconProps) {
  return (
    <IconBase className={className}>
      <rect x="9" y="9" width="12" height="12" rx="2" />
      <path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1" />
    </IconBase>
  );
}

export function CheckIcon({ className }: IconProps) {
  return (
    <IconBase className={className}>
      <path d="m5 12 5 5L20 7" />
    </IconBase>
  );
}

export function XIcon({ className }: IconProps) {
  return (
    <IconBase className={className}>
      <path d="M6 6l12 12M18 6 6 18" />
    </IconBase>
  );
}

export function SearchIcon({ className }: IconProps) {
  return (
    <IconBase className={className}>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </IconBase>
  );
}

export function ChevronRightIcon({ className }: IconProps) {
  return (
    <IconBase className={className}>
      <path d="m9 6 6 6-6 6" />
    </IconBase>
  );
}

export function LightbulbIcon({ className }: IconProps) {
  return (
    <IconBase className={className}>
      <path d="M9 18h6M10 21h4" />
      <path d="M12 3a6 6 0 0 0-4 10.5c.7.7 1 1.3 1 2.5h6c0-1.2.3-1.8 1-2.5A6 6 0 0 0 12 3Z" />
    </IconBase>
  );
}

export function TargetIcon({ className }: IconProps) {
  return (
    <IconBase className={className}>
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="12" cy="12" r="0.5" strokeWidth={3} />
    </IconBase>
  );
}

export function BookOpenIcon({ className }: IconProps) {
  return (
    <IconBase className={className}>
      <path d="M12 6c-1.5-1.3-4-2-7-2v13c3 0 5.5.7 7 2 1.5-1.3 4-2 7-2V4c-3 0-5.5.7-7 2Z" />
      <path d="M12 6v13" />
    </IconBase>
  );
}

export function AlertTriangleIcon({ className }: IconProps) {
  return (
    <IconBase className={className}>
      <path d="M12 3 2 20h20L12 3Z" />
      <path d="M12 10v4M12 17h.01" />
    </IconBase>
  );
}
