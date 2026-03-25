import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import FlavorForm from "./flavor-form";

type Flavor = {
  id: string;
  description: string | null;
  slug: string | null;
  created_datetime_utc?: string | null;
};

export default async function FlavorsPage() {
  const { supabase } = await requireAdmin();

  const { data } = await supabase
    .from("humor_flavors")
    .select("*")
    .order("created_datetime_utc", { ascending: false });

  const flavors: Flavor[] = data ?? [];

  return (
    <main className="min-h-screen bg-white px-6 py-10 dark:bg-black">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="space-y-2">
          <p className="text-sm font-medium uppercase tracking-wide text-gray-500">
            Prompt Chain Tool
          </p>
          <h1 className="text-4xl font-bold tracking-tight">Humor Flavors</h1>
          <p className="max-w-2xl text-sm text-gray-600 dark:text-gray-400">
            Create and manage humor flavors for your prompt chains.
          </p>
        </div>

        <section className="rounded-2xl border border-gray-200 bg-gray-50 p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="mb-4">
            <h2 className="text-xl font-semibold">Create a New Flavor</h2>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Add a description and a slug to create a new humor flavor.
            </p>
          </div>

          <FlavorForm />
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">Existing Flavors</h2>
            <p className="text-sm text-gray-500">
              {flavors.length} {flavors.length === 1 ? "flavor" : "flavors"}
            </p>
          </div>

          {flavors.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-300 p-10 text-center dark:border-gray-700">
              <p className="text-lg font-medium">No humor flavors yet</p>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Create your first one using the form above.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {flavors.map((flavor) => (
                <Link
                  key={flavor.id}
                  href={`/flavors/${flavor.id}`}
                  className="group rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-gray-800 dark:bg-gray-900"
                >
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                        Flavor
                      </p>
                      <h3 className="mt-1 text-lg font-semibold">
                        {flavor.description || "Untitled Flavor"}
                      </h3>
                    </div>

                    <div>
                      <p className="text-xs uppercase tracking-wide text-gray-500">
                        Slug
                      </p>
                      <p className="rounded-lg bg-gray-100 px-3 py-2 font-mono text-sm dark:bg-black">
                        {flavor.slug || "no-slug"}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}