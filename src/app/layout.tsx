import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { auth, signOut } from "@/lib/auth";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Englishly",
  description: "Rewrite your workplace messages in natural English, and learn why.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const session = await auth();

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {session?.user && (
          <div className="flex items-center justify-end gap-3 border-b border-neutral-200 px-4 py-2 text-xs text-neutral-500 dark:border-neutral-800">
            <span>{session.user.email}</span>
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/signin" });
              }}
            >
              <button
                type="submit"
                className="underline hover:text-neutral-800 dark:hover:text-neutral-200"
              >
                Sign out
              </button>
            </form>
          </div>
        )}
        {children}
      </body>
    </html>
  );
}
