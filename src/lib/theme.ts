import type { ComponentType } from "react";
import type { Tone, ContextType } from "@/lib/constants";
import {
  BriefcaseIcon,
  SmileIcon,
  FeatherIcon,
  HashIcon,
  UsersIcon,
  MessageCircleIcon,
  PhoneIcon,
  MailIcon,
  HeadsetIcon,
  CodeIcon,
  DotsIcon,
  LightbulbIcon,
  TargetIcon,
  BookOpenIcon,
  AlertTriangleIcon,
} from "@/components/icons";

type IconType = ComponentType<{ className?: string }>;

export const TONE_ICONS: Record<Tone, IconType> = {
  professional: BriefcaseIcon,
  friendly: SmileIcon,
  formal: FeatherIcon,
};

export const CONTEXT_ICONS: Record<ContextType, IconType> = {
  slack: HashIcon,
  team: UsersIcon,
  line: MessageCircleIcon,
  whatsapp: PhoneIcon,
  email: MailIcon,
  customer_reply: HeadsetIcon,
  pr_comment: CodeIcon,
  other: DotsIcon,
};

interface AccentClasses {
  border: string;
  bg: string;
  text: string;
  solid: string;
}

// Distinct accent per tone, used to color-code rewrite results and history
// entries so the tone is recognizable at a glance, not just from its label.
export const TONE_ACCENT: Record<Tone, AccentClasses> = {
  professional: {
    border: "border-indigo-400 dark:border-indigo-600",
    bg: "bg-indigo-50 dark:bg-indigo-950/40",
    text: "text-indigo-700 dark:text-indigo-300",
    solid: "bg-indigo-600",
  },
  friendly: {
    border: "border-emerald-400 dark:border-emerald-600",
    bg: "bg-emerald-50 dark:bg-emerald-950/40",
    text: "text-emerald-700 dark:text-emerald-300",
    solid: "bg-emerald-600",
  },
  formal: {
    border: "border-violet-400 dark:border-violet-600",
    bg: "bg-violet-50 dark:bg-violet-950/40",
    text: "text-violet-700 dark:text-violet-300",
    solid: "bg-violet-600",
  },
};

interface CardAccent {
  // A literal Tailwind class, not derived at runtime — Tailwind only
  // generates CSS for class names it can find as-written in source.
  borderTop: string;
  badge: string;
  icon: IconType;
}

// Cycled by index across the Insights flashcards, purely for visual variety
// — an AI-generated tip has no inherent category to key off of.
export const CARD_ACCENTS: CardAccent[] = [
  {
    borderTop: "border-t-indigo-500",
    badge: "bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300",
    icon: LightbulbIcon,
  },
  {
    borderTop: "border-t-amber-500",
    badge: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
    icon: TargetIcon,
  },
  {
    borderTop: "border-t-rose-500",
    badge: "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300",
    icon: AlertTriangleIcon,
  },
  {
    borderTop: "border-t-emerald-500",
    badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
    icon: BookOpenIcon,
  },
];
