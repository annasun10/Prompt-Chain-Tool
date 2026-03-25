import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import FlavorForm from "./flavor-form";
import { deleteFlavor } from "./actions";
import DeleteFlavorButton from "./delete-flavor-button";
import ThemeToggle from "../theme-toggle";

type Flavor = {
  id: number;
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
    <main className="min-h-screen bg-white px-6 py-10 text-black dark:bg-black dark:text-white">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium uppercase tracking-wide text-gray-500 dark:text-slate-400">
              Prompt Chain Tool
            </p>
            <h1 className="text-4xl font-bold tracking-tight text-black dark:text-white">
              Humor Flavors
            </h1>
            <p className="max-w-2xl text-sm text-gray-600 dark:text-slate-300">
              Create, manage, and test humor flavors for your prompt chains.
            </p>
          </div>

          <ThemeToggle />
        </div>

        <section className="rounded-2xl border border-gray-200 bg-gray-50 p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="mb-4">
            <h2 className="text-xl font-semibold text-black dark:text-white">
              Create a New Flavor
            </h2>
            <p className="mt-1 text-sm text-gray-600 dark:text-slate-300">
              Add a description and a slug to create a new humor flavor.
            </p>
          </div>

          <FlavorForm />
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-black dark:text-white">
              Existing Flavors
            </h2>
            <p className="text-sm text-gray-500 dark:text-slate-400">
              {flavors.length} {flavors.length === 1 ? "flavor" : "flavors"}
            </p>
          </div>

          {flavors.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-300 p-10 text-center dark:border-slate-700 dark:bg-slate-900">
              <p className="text-lg font-medium text-black dark:text-white">
                No humor flavors yet
              </p>
              <p className="mt-2 text-sm text-gray-600 dark:text-slate-300">
                Create your first one using the form above.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {flavors.map((flavor) => (
                <div
                  key={flavor.id}
                  className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-700 dark:bg-slate-900"
                >
                  <div className="space-y-4">
                    <Link href={`/flavors/${flavor.id}`} className="block">
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-slate-400">
                          Flavor
                        </p>
                        <h3 className="mt-1 text-lg font-semibold text-black dark:text-white">
                          {flavor.description || "Untitled Flavor"}
                        </h3>
                      </div>

                      <div className="mt-3">
                        <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-slate-400">
                          Slug
                        </p>
                        <p className="rounded-lg bg-gray-100 px-3 py-2 font-mono text-sm text-black dark:bg-slate-950 dark:text-slate-200">
                          {flavor.slug || "no-slug"}
                        </p>
                      </div>
                    </Link>

                    <div className="flex items-center justify-between gap-3">
                      <Link
                        href={`/flavors/${flavor.id}`}
                        className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-black transition hover:bg-gray-100 dark:border-slate-600 dark:text-white dark:hover:bg-slate-800"
                      >
                        Open
                      </Link>

                      <form action={deleteFlavor}>
                        <input
                          type="hidden"
                          name="flavorId"
                          value={flavor.id}
                        />
                        <DeleteFlavorButton />
                      </form>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}