"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";

export type FlavorFormState = {
  error: string | null;
  success: string | null;
};

function makeSlug(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, "-");
}

export async function createFlavor(
  prevState: FlavorFormState,
  formData: FormData
): Promise<FlavorFormState> {
  const { supabase } = await requireAdmin();

  const description = String(formData.get("description") ?? "").trim();
  const slug = makeSlug(String(formData.get("slug") ?? ""));

  if (!description || !slug) {
    return {
      error: "Description and slug are required.",
      success: null,
    };
  }

  const { data: existingFlavor, error: existingError } = await supabase
    .from("humor_flavors")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();

  if (existingError) {
    return { error: existingError.message, success: null };
  }

  if (existingFlavor) {
    return {
      error: "That slug already exists. Please choose a different one.",
      success: null,
    };
  }

  const { error } = await supabase.from("humor_flavors").insert({
    description,
    slug,
  });

  if (error) {
    return { error: error.message, success: null };
  }

  revalidatePath("/flavors");

  return {
    error: null,
    success: "Humor flavor created successfully.",
  };
}

export async function duplicateFlavor(formData: FormData): Promise<void> {
  const { supabase } = await requireAdmin();

  const flavorId = Number(formData.get("flavorId"));
  const description = String(formData.get("description") ?? "").trim();
  const slug = makeSlug(String(formData.get("slug") ?? ""));

  if (!flavorId) {
    throw new Error("Missing flavor id.");
  }

  if (!description || !slug) {
    throw new Error("New description and slug are required.");
  }

  const { data: existingFlavor, error: existingError } = await supabase
    .from("humor_flavors")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();

  if (existingError) {
    throw new Error(existingError.message);
  }

  if (existingFlavor) {
    throw new Error("That slug already exists. Please choose a different one.");
  }

  const { data: newFlavor, error: flavorInsertError } = await supabase
    .from("humor_flavors")
    .insert({
      description,
      slug,
    })
    .select("id")
    .single();

  if (flavorInsertError || !newFlavor) {
    throw new Error(flavorInsertError?.message ?? "Could not duplicate flavor.");
  }

  const { data: oldSteps, error: stepsFetchError } = await supabase
    .from("humor_flavor_steps")
    .select(
      `
      description,
      llm_temperature,
      order_by,
      llm_input_type_id,
      llm_output_type_id,
      llm_model_id,
      humor_flavor_step_type_id,
      llm_system_prompt,
      llm_user_prompt
    `
    )
    .eq("humor_flavor_id", flavorId)
    .order("order_by", { ascending: true });

  if (stepsFetchError) {
    throw new Error(stepsFetchError.message);
  }

  if (oldSteps && oldSteps.length > 0) {
    const newSteps = oldSteps.map((step) => ({
      ...step,
      humor_flavor_id: newFlavor.id,
    }));

    const { error: stepsInsertError } = await supabase
      .from("humor_flavor_steps")
      .insert(newSteps);

    if (stepsInsertError) {
      throw new Error(stepsInsertError.message);
    }
  }

  revalidatePath("/flavors");
}

// export async function duplicateFlavor(
//   prevState: FlavorFormState,
//   formData: FormData
// ): Promise<FlavorFormState> {
//   const { supabase } = await requireAdmin();

//   const flavorId = Number(formData.get("flavorId"));
//   const description = String(formData.get("description") ?? "").trim();
//   const slug = makeSlug(String(formData.get("slug") ?? ""));

//   if (!flavorId) {
//     return { error: "Missing flavor id.", success: null };
//   }

//   if (!description || !slug) {
//     return {
//       error: "New description and slug are required.",
//       success: null,
//     };
//   }

//   const { data: existingFlavor, error: existingError } = await supabase
//     .from("humor_flavors")
//     .select("id")
//     .eq("slug", slug)
//     .maybeSingle();

//   if (existingError) {
//     return { error: existingError.message, success: null };
//   }

//   if (existingFlavor) {
//     return {
//       error: "That slug already exists. Please choose a different one.",
//       success: null,
//     };
//   }

//   const { data: newFlavor, error: flavorInsertError } = await supabase
//     .from("humor_flavors")
//     .insert({
//       description,
//       slug,
//     })
//     .select("id")
//     .single();

//   if (flavorInsertError || !newFlavor) {
//     return {
//       error: flavorInsertError?.message ?? "Could not duplicate flavor.",
//       success: null,
//     };
//   }

//   const { data: oldSteps, error: stepsFetchError } = await supabase
//     .from("humor_flavor_steps")
//     .select(
//       `
//       description,
//       llm_temperature,
//       order_by,
//       llm_input_type_id,
//       llm_output_type_id,
//       llm_model_id,
//       humor_flavor_step_type_id,
//       llm_system_prompt,
//       llm_user_prompt
//     `
//     )
//     .eq("humor_flavor_id", flavorId)
//     .order("order_by", { ascending: true });

//   if (stepsFetchError) {
//     return { error: stepsFetchError.message, success: null };
//   }

//   if (oldSteps && oldSteps.length > 0) {
//     const newSteps = oldSteps.map((step) => ({
//       ...step,
//       humor_flavor_id: newFlavor.id,
//     }));

//     const { error: stepsInsertError } = await supabase
//       .from("humor_flavor_steps")
//       .insert(newSteps);

//     if (stepsInsertError) {
//       return { error: stepsInsertError.message, success: null };
//     }
//   }

//   revalidatePath("/flavors");

//   return {
//     error: null,
//     success: "Humor flavor duplicated successfully.",
//   };
// }

export async function deleteFlavor(formData: FormData): Promise<void> {
  const { supabase } = await requireAdmin();

  const flavorId = Number(formData.get("flavorId"));

  if (!flavorId) {
    throw new Error("Missing flavor id.");
  }

  const { error: stepDeleteError } = await supabase
    .from("humor_flavor_steps")
    .delete()
    .eq("humor_flavor_id", flavorId);

  if (stepDeleteError) {
    throw new Error(stepDeleteError.message);
  }

  const { error: flavorDeleteError } = await supabase
    .from("humor_flavors")
    .delete()
    .eq("id", flavorId);

  if (flavorDeleteError) {
    throw new Error(flavorDeleteError.message);
  }

  revalidatePath("/flavors");
}

// "use server";

// import { revalidatePath } from "next/cache";
// import { requireAdmin } from "@/lib/auth";

// export type FlavorFormState = {
//   error: string | null;
//   success: string | null;
// };

// export async function createFlavor(
//   prevState: FlavorFormState,
//   formData: FormData
// ): Promise<FlavorFormState> {
//   const { supabase } = await requireAdmin();

//   const description = String(formData.get("description") ?? "").trim();
//   const slug = String(formData.get("slug") ?? "")
//     .trim()
//     .toLowerCase()
//     .replace(/\s+/g, "-");

//   if (!description || !slug) {
//     return {
//       error: "Description and slug are required.",
//       success: null,
//     };
//   }

//   const { data: existingFlavor, error: existingError } = await supabase
//     .from("humor_flavors")
//     .select("id")
//     .eq("slug", slug)
//     .maybeSingle();

//   if (existingError) {
//     return {
//       error: existingError.message,
//       success: null,
//     };
//   }

//   if (existingFlavor) {
//     return {
//       error: "That slug already exists. Please choose a different one.",
//       success: null,
//     };
//   }

//   const { error } = await supabase.from("humor_flavors").insert({
//     description,
//     slug,
//   });

//   if (error) {
//     return {
//       error: error.message,
//       success: null,
//     };
//   }

//   revalidatePath("/flavors");

//   return {
//     error: null,
//     success: "Humor flavor created successfully.",
//   };
// }

// export async function deleteFlavor(formData: FormData): Promise<void> {
//   const { supabase } = await requireAdmin();

//   const flavorId = Number(formData.get("flavorId"));

//   if (!flavorId) {
//     throw new Error("Missing flavor id.");
//   }

//   const { error: stepDeleteError } = await supabase
//     .from("humor_flavor_steps")
//     .delete()
//     .eq("humor_flavor_id", flavorId);

//   if (stepDeleteError) {
//     throw new Error(stepDeleteError.message);
//   }

//   const { error: flavorDeleteError } = await supabase
//     .from("humor_flavors")
//     .delete()
//     .eq("id", flavorId);

//   if (flavorDeleteError) {
//     throw new Error(flavorDeleteError.message);
//   }

//   revalidatePath("/flavors");
// }