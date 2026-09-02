import { signIn } from "@/lib/auth";

export default function SignInPage() {
  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col items-center justify-center gap-6 px-4 py-12 text-center">
      <div>
        <h1 className="text-2xl font-semibold">Englishly</h1>
        <p className="text-sm text-neutral-500">
          Sign in to rewrite messages and keep your history.
        </p>
      </div>
      <form
        action={async () => {
          "use server";
          await signIn("google", { redirectTo: "/" });
        }}
      >
        <button
          type="submit"
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white dark:bg-neutral-100 dark:text-neutral-900"
        >
          Sign in with Google
        </button>
      </form>
    </main>
  );
}
