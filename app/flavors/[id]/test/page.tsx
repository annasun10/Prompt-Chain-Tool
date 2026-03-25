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
    <main className="mx-auto max-w-5xl p-6 space-y-6">
      <div>
        <Link href={`/flavors/${id}`} className="text-sm underline">
          Back to Flavor
        </Link>
        <h1 className="mt-2 text-3xl font-bold">Test Flavor</h1>
        <p className="text-sm text-gray-500">{flavor?.description}</p>
      </div>

      <TestFlavorForm flavorId={id} steps={steps} />
    </main>
  );
}