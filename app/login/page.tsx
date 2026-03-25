import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function LoginPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/");
  }

  async function signInWithGoogle() {
    "use server";

    const supabase = await createClient();

    const origin = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${origin}/auth/callback`,
      },
    });

    if (error) {
      throw new Error(error.message);
    }

    if (data.url) {
      redirect(data.url);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-xl border p-6 space-y-4 text-center">
        <h1 className="text-2xl font-bold">Login</h1>
        <p className="text-sm text-gray-500">
          Sign in with Google to access the Prompt Chain Tool.
        </p>

        <form action={signInWithGoogle}>
          <button type="submit" className="rounded border px-4 py-2">
            Continue with Google
          </button>
        </form>
      </div>
    </main>
  );
}