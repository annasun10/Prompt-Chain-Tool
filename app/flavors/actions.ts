"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";

export type FlavorFormState = {
  error: string | null;
  success: string | null;
};

export async function createFlavor(
  prevState: FlavorFormState,
  formData: FormData
): Promise<FlavorFormState> {
  const { supabase } = await requireAdmin();

  const description = String(formData.get("description") ?? "").trim();
  const slug = String(formData.get("slug") ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-");

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
    return {
      error: existingError.message,
      success: null,
    };
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
    return {
      error: error.message,
      success: null,
    };
  }

  revalidatePath("/flavors");

  return {
    error: null,
    success: "Humor flavor created successfully.",
  };
}