import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";

type Flavor = {
  id: string | number;
  description: string | null;
  slug: string | null;
};

type Step = {
  id: number;
  humor_flavor_id: number;
  order_by: number;
  description: string | null;
  llm_system_prompt: string | null;
  llm_user_prompt: string | null;
  llm_temperature: number | null;
};

export default async function FlavorDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase, user } = await requireAdmin();

  const { data: flavorData, error: flavorError } = await supabase
    .from("humor_flavors")
    .select("id, description, slug")
    .eq("id", id)
    .single();

  if (flavorError || !flavorData) {
    redirect("/flavors");
  }

  const flavor: Flavor = flavorData;

  const { data: stepsData } = await supabase
    .from("humor_flavor_steps")
    .select(
      "id, humor_flavor_id, order_by, description, llm_system_prompt, llm_user_prompt, llm_temperature"
    )
    .eq("humor_flavor_id", id)
    .order("order_by", { ascending: true });

  const steps: Step[] = stepsData ?? [];

  async function createStep(formData: FormData) {
    "use server";

    const { supabase, user } = await requireAdmin();

    const flavorId = Number(formData.get("flavorId"));
    const description = String(formData.get("description") ?? "").trim();
    const llm_system_prompt = String(
      formData.get("llm_system_prompt") ?? ""
    ).trim();
    const llm_user_prompt = String(
      formData.get("llm_user_prompt") ?? ""
    ).trim();
    const llm_temperature = Number(formData.get("llm_temperature") ?? 0.7);

    if (!flavorId || !description) return;

    const { data: existingStepsData } = await supabase
      .from("humor_flavor_steps")
      .select("order_by")
      .eq("humor_flavor_id", flavorId)
      .order("order_by", { ascending: false });

    const existingSteps = existingStepsData ?? [];
    const nextOrder =
      existingSteps.length > 0 ? Number(existingSteps[0].order_by) + 1 : 1;

    const now = new Date().toISOString();

    const { error } = await supabase.from("humor_flavor_steps").insert({
      humor_flavor_id: flavorId,
      description,
      llm_system_prompt,
      llm_user_prompt,
      llm_temperature,
      order_by: nextOrder,
      llm_input_type_id: 1,
      llm_output_type_id: 1,
      llm_model_id: 1,
      humor_flavor_step_type_id: 1,
      created_by_user_id: user.id,
      modified_by_user_id: user.id,
      created_datetime_utc: now,
      modified_datetime_utc: now,
    });

    if (error) {
      throw new Error(error.message);
    }

    revalidatePath(`/flavors/${flavorId}`);
  }

  async function updateStep(formData: FormData) {
    "use server";

    const { supabase, user } = await requireAdmin();

    const stepId = Number(formData.get("stepId"));
    const flavorId = Number(formData.get("flavorId"));
    const description = String(formData.get("description") ?? "").trim();
    const llm_system_prompt = String(
      formData.get("llm_system_prompt") ?? ""
    ).trim();
    const llm_user_prompt = String(
      formData.get("llm_user_prompt") ?? ""
    ).trim();
    const llm_temperature = Number(formData.get("llm_temperature") ?? 0.7);

    if (!stepId || !flavorId || !description) return;

    const { error } = await supabase
      .from("humor_flavor_steps")
      .update({
        description,
        llm_system_prompt,
        llm_user_prompt,
        llm_temperature,
        modified_by_user_id: user.id,
        modified_datetime_utc: new Date().toISOString(),
      })
      .eq("id", stepId);

    if (error) {
      throw new Error(error.message);
    }

    revalidatePath(`/flavors/${flavorId}`);
  }

  async function deleteStep(formData: FormData) {
    "use server";

    const { supabase } = await requireAdmin();

    const stepId = Number(formData.get("stepId"));
    const flavorId = Number(formData.get("flavorId"));

    if (!stepId || !flavorId) return;

    const { error } = await supabase
      .from("humor_flavor_steps")
      .delete()
      .eq("id", stepId);

    if (error) {
      throw new Error(error.message);
    }

    revalidatePath(`/flavors/${flavorId}`);
  }

  async function moveStepUp(formData: FormData) {
    "use server";

    const { supabase } = await requireAdmin();

    const stepId = Number(formData.get("stepId"));
    const flavorId = Number(formData.get("flavorId"));

    if (!stepId || !flavorId) return;

    const { data: orderedStepsData } = await supabase
      .from("humor_flavor_steps")
      .select("id, order_by")
      .eq("humor_flavor_id", flavorId)
      .order("order_by", { ascending: true });

    const orderedSteps = orderedStepsData ?? [];
    const currentIndex = orderedSteps.findIndex((s) => s.id === stepId);

    if (currentIndex <= 0) return;

    const currentStep = orderedSteps[currentIndex];
    const previousStep = orderedSteps[currentIndex - 1];

    const { error: error1 } = await supabase
      .from("humor_flavor_steps")
      .update({ order_by: previousStep.order_by })
      .eq("id", currentStep.id);

    if (error1) throw new Error(error1.message);

    const { error: error2 } = await supabase
      .from("humor_flavor_steps")
      .update({ order_by: currentStep.order_by })
      .eq("id", previousStep.id);

    if (error2) throw new Error(error2.message);

    revalidatePath(`/flavors/${flavorId}`);
  }

  async function moveStepDown(formData: FormData) {
    "use server";

    const { supabase } = await requireAdmin();

    const stepId = Number(formData.get("stepId"));
    const flavorId = Number(formData.get("flavorId"));

    if (!stepId || !flavorId) return;

    const { data: orderedStepsData } = await supabase
      .from("humor_flavor_steps")
      .select("id, order_by")
      .eq("humor_flavor_id", flavorId)
      .order("order_by", { ascending: true });

    const orderedSteps = orderedStepsData ?? [];
    const currentIndex = orderedSteps.findIndex((s) => s.id === stepId);

    if (currentIndex === -1 || currentIndex >= orderedSteps.length - 1) return;

    const currentStep = orderedSteps[currentIndex];
    const nextStep = orderedSteps[currentIndex + 1];

    const { error: error1 } = await supabase
      .from("humor_flavor_steps")
      .update({ order_by: nextStep.order_by })
      .eq("id", currentStep.id);

    if (error1) throw new Error(error1.message);

    const { error: error2 } = await supabase
      .from("humor_flavor_steps")
      .update({ order_by: currentStep.order_by })
      .eq("id", nextStep.id);

    if (error2) throw new Error(error2.message);

    revalidatePath(`/flavors/${flavorId}`);
  }

  return (
    <main className="min-h-screen bg-white px-6 py-10 text-black dark:bg-black dark:text-white">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-2">
            <Link
              href="/flavors"
              className="text-sm text-gray-600 underline underline-offset-4 dark:text-slate-300"
            >
              Back to Flavors
            </Link>

            <p className="text-sm font-medium uppercase tracking-wide text-gray-500 dark:text-slate-400">
              Humor Flavor
            </p>

            <h1 className="text-4xl font-bold tracking-tight text-black dark:text-white">
              {flavor.description || "Untitled Flavor"}
            </h1>

            <p className="text-sm text-gray-600 dark:text-slate-300">
              Slug:{" "}
              <span className="rounded bg-gray-100 px-2 py-1 font-mono text-black dark:bg-slate-950 dark:text-slate-200">
                {flavor.slug || "no-slug"}
              </span>
            </p>
          </div>

          <Link
            href={`/flavors/${id}/test`}
            className="rounded-xl border border-black bg-black px-5 py-3 text-sm font-medium text-white transition hover:opacity-90 dark:border-white dark:bg-white dark:text-black"
          >
            Test This Flavor
          </Link>
        </div>

        <section className="rounded-2xl border border-gray-200 bg-gray-50 p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="mb-4">
            <h2 className="text-xl font-semibold text-black dark:text-white">
              Create a New Step
            </h2>
            <p className="mt-1 text-sm text-gray-600 dark:text-slate-300">
              Add a new prompt step to this humor flavor.
            </p>
          </div>

          <form action={createStep} className="space-y-4">
            <input type="hidden" name="flavorId" value={id} />

            <div>
              <label
                htmlFor="description"
                className="mb-2 block text-sm font-medium text-black dark:text-white"
              >
                Step Description
              </label>
              <input
                id="description"
                name="description"
                placeholder="Ex. Describe the image in plain text"
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-black placeholder:text-gray-400 outline-none transition focus:border-black dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-400 dark:focus:border-white"
                required
              />
            </div>

            <div>
              <label
                htmlFor="llm_system_prompt"
                className="mb-2 block text-sm font-medium text-black dark:text-white"
              >
                System Prompt
              </label>
              <textarea
                id="llm_system_prompt"
                name="llm_system_prompt"
                rows={4}
                placeholder="You are a helpful assistant..."
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-black placeholder:text-gray-400 outline-none transition focus:border-black dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-400 dark:focus:border-white"
              />
            </div>

            <div>
              <label
                htmlFor="llm_user_prompt"
                className="mb-2 block text-sm font-medium text-black dark:text-white"
              >
                User Prompt
              </label>
              <textarea
                id="llm_user_prompt"
                name="llm_user_prompt"
                rows={4}
                placeholder="Describe what is happening in this image..."
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-black placeholder:text-gray-400 outline-none transition focus:border-black dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-400 dark:focus:border-white"
              />
            </div>

            <div className="max-w-xs">
              <label
                htmlFor="llm_temperature"
                className="mb-2 block text-sm font-medium text-black dark:text-white"
              >
                Temperature
              </label>
              <input
                id="llm_temperature"
                name="llm_temperature"
                type="number"
                min="0"
                max="2"
                step="0.1"
                defaultValue="0.7"
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-black placeholder:text-gray-400 outline-none transition focus:border-black dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-400 dark:focus:border-white"
              />
            </div>

            <button
              type="submit"
              className="rounded-xl border border-black bg-black px-5 py-3 text-sm font-medium text-white transition hover:opacity-90 dark:border-white dark:bg-white dark:text-black"
            >
              Create Step
            </button>
          </form>
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-black dark:text-white">
              Existing Steps
            </h2>
            <p className="text-sm text-gray-500 dark:text-slate-400">
              {steps.length} {steps.length === 1 ? "step" : "steps"}
            </p>
          </div>

          {steps.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-300 p-10 text-center dark:border-slate-700 dark:bg-slate-900">
              <p className="text-lg font-medium text-black dark:text-white">
                No steps yet
              </p>
              <p className="mt-2 text-sm text-gray-600 dark:text-slate-300">
                Create your first step using the form above.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {steps.map((step, index) => (
                <div
                  key={step.id}
                  className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900"
                >
                  <div className="mb-4 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <p className="text-sm font-medium uppercase tracking-wide text-gray-500 dark:text-slate-400">
                        Step {index + 1}
                      </p>
                      <h3 className="mt-1 text-lg font-semibold text-black dark:text-white">
                        {step.description || "Untitled Step"}
                      </h3>
                      <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
                        order_by: {step.order_by}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <form action={moveStepUp}>
                        <input type="hidden" name="stepId" value={step.id} />
                        <input type="hidden" name="flavorId" value={id} />
                        <button
                          type="submit"
                          disabled={index === 0}
                          className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-black transition hover:bg-gray-100 disabled:opacity-50 dark:border-slate-600 dark:text-white dark:hover:bg-slate-800"
                        >
                          ↑ Move Up
                        </button>
                      </form>

                      <form action={moveStepDown}>
                        <input type="hidden" name="stepId" value={step.id} />
                        <input type="hidden" name="flavorId" value={id} />
                        <button
                          type="submit"
                          disabled={index === steps.length - 1}
                          className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-black transition hover:bg-gray-100 disabled:opacity-50 dark:border-slate-600 dark:text-white dark:hover:bg-slate-800"
                        >
                          ↓ Move Down
                        </button>
                      </form>

                      <form action={deleteStep}>
                        <input type="hidden" name="stepId" value={step.id} />
                        <input type="hidden" name="flavorId" value={id} />
                        <button
                          type="submit"
                          className="rounded-lg border border-red-300 px-3 py-2 text-sm text-red-600 transition hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-950"
                        >
                          Delete
                        </button>
                      </form>
                    </div>
                  </div>

                  <form action={updateStep} className="space-y-4">
                    <input type="hidden" name="stepId" value={step.id} />
                    <input type="hidden" name="flavorId" value={id} />

                    <div>
                      <label className="mb-2 block text-sm font-medium text-black dark:text-white">
                        Description
                      </label>
                      <input
                        name="description"
                        defaultValue={step.description ?? ""}
                        className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-black placeholder:text-gray-400 outline-none transition focus:border-black dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-400 dark:focus:border-white"
                        required
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-black dark:text-white">
                        System Prompt
                      </label>
                      <textarea
                        name="llm_system_prompt"
                        rows={4}
                        defaultValue={step.llm_system_prompt ?? ""}
                        className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-black placeholder:text-gray-400 outline-none transition focus:border-black dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-400 dark:focus:border-white"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-black dark:text-white">
                        User Prompt
                      </label>
                      <textarea
                        name="llm_user_prompt"
                        rows={4}
                        defaultValue={step.llm_user_prompt ?? ""}
                        className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-black placeholder:text-gray-400 outline-none transition focus:border-black dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-400 dark:focus:border-white"
                      />
                    </div>

                    <div className="max-w-xs">
                      <label className="mb-2 block text-sm font-medium text-black dark:text-white">
                        Temperature
                      </label>
                      <input
                        name="llm_temperature"
                        type="number"
                        min="0"
                        max="2"
                        step="0.1"
                        defaultValue={step.llm_temperature ?? 0.7}
                        className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-black placeholder:text-gray-400 outline-none transition focus:border-black dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-400 dark:focus:border-white"
                      />
                    </div>

                    <button
                      type="submit"
                      className="rounded-xl border border-black bg-black px-5 py-3 text-sm font-medium text-white transition hover:opacity-90 dark:border-white dark:bg-white dark:text-black"
                    >
                      Save Changes
                    </button>
                  </form>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}