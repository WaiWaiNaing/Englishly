export type Tone = "professional" | "friendly" | "formal";

export type Language = "en" | "th" | "ja" | "ko" | "my";

export type ContextType =
  | "slack"
  | "team"
  | "line"
  | "whatsapp"
  | "email"
  | "customer_reply"
  | "pr_comment"
  | "other";

// Single source of truth for tone/context options — imported by both the
// client form (src/app/page.tsx) and the API route's validation
// (src/app/api/rewrite/route.ts) so the two can't drift out of sync.
export const TONES: { value: Tone; label: string }[] = [
  { value: "professional", label: "Professional" },
  { value: "friendly", label: "Friendly" },
  { value: "formal", label: "Formal" },
];

// Output language for the final rewrite. English skips translation entirely
// (the Gemini rewrite step already produces English); any other language
// runs the Gemini rewrite → Gemini translate → ChatGPT natural-tone-check
// pipeline in src/app/api/rewrite/route.ts.
export const LANGUAGES: { value: Language; label: string; flag: string }[] = [
  { value: "en", label: "English", flag: "🇺🇸" },
  { value: "th", label: "Thai", flag: "🇹🇭" },
  { value: "ja", label: "Japanese", flag: "🇯🇵" },
  { value: "ko", label: "Korean", flag: "🇰🇷" },
  { value: "my", label: "Burmese", flag: "🇲🇲" },
];

export const CONTEXTS: { value: ContextType; label: string }[] = [
  { value: "slack", label: "Slack message" },
  { value: "team", label: "Team chat (Teams/Discord)" },
  { value: "line", label: "LINE" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "email", label: "Email" },
  { value: "customer_reply", label: "Customer reply" },
  { value: "pr_comment", label: "PR comment" },
  { value: "other", label: "Other" },
];
