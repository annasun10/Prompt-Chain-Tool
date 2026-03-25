import { requireAdmin } from "@/lib/auth";
import Link from "next/link";
import TestFlavorForm from "./test-flavor-form";

type Step = {
  id: number;
  order_by: number;
  description: string | null;
  llm_system_prompt: string | null;
  llm_user_prompt: string | null;
  llm_temperature: number | null;
};

type Flavor = {
  id: number;
  description: string | null;
  slug: string | null;
};

export default async function TestFlavorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase } = await requireAdmin();

  const { data: flavorData } = await supabase
    .from("humor_flavors")
    .select("id, description, slug")
    .eq("id", id)
    .single();

  const flavor: Flavor | null = flavorData;

  const { data: stepsData } = await supabase
    .from("humor_flavor_steps")
    .select(
      "id, order_by, description, llm_system_prompt, llm_user_prompt, llm_temperature"
    )
    .eq("humor_flavor_id", id)
    .order("order_by", { ascending: true });

  const steps: Step[] = stepsData ?? [];

  return (
    <main className="min-h-screen bg-white px-6 py-10 text-black dark:bg-black dark:text-white">
      <div className="mx-auto max-w-5xl space-y-8">
        <div className="space-y-3">
          <Link
            href={`/flavors/${id}`}
            className="text-sm text-gray-600 underline underline-offset-4 dark:text-slate-300"
          >
            Back to Flavor
          </Link>

          <div className="space-y-2">
            <p className="text-sm font-medium uppercase tracking-wide text-gray-500 dark:text-slate-400">
              Test Flavor
            </p>

            <h1 className="text-4xl font-bold tracking-tight text-black dark:text-white">
              {flavor?.description || "Untitled Flavor"}
            </h1>

            <p className="text-sm text-gray-600 dark:text-slate-300">
              Run this humor flavor against a test image and review the outputs.
            </p>

            <p className="text-sm text-gray-600 dark:text-slate-300">
              Slug:{" "}
              <span className="rounded bg-gray-100 px-2 py-1 font-mono text-black dark:bg-slate-950 dark:text-slate-200">
                {flavor?.slug || "no-slug"}
              </span>
            </p>
          </div>
        </div>

        <TestFlavorForm flavorId={id} steps={steps} />
      </div>
    </main>
  );
}