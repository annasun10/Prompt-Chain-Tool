import Link from "next/link";
import { requireAdmin } from "@/lib/auth";

export default async function HomePage() {
  const { user } = await requireAdmin();

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-xl w-full space-y-6 text-center">
        <h1 className="text-4xl font-bold">
          Prompt Chain Tool
        </h1>

        <p className="text-gray-600 dark:text-gray-400">
          Welcome! You are logged in as:
        </p>

        <p className="font-medium">
          {user.email}
        </p>

        <div className="flex justify-center gap-4 mt-6">
          <Link
            href="/flavors"
            className="rounded-lg border px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            Go to Humor Flavors
          </Link>
        </div>

        <div className="mt-8 text-sm text-gray-500">
          Only admins can access this tool
        </div>
      </div>
    </main>
  );
}