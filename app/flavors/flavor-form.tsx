"use client";

import { useActionState } from "react";
import { createFlavor, type FlavorFormState } from "./actions";

const initialState: FlavorFormState = {
  error: null,
  success: null,
};

export default function FlavorForm() {
  const [state, formAction, isPending] = useActionState(
    createFlavor,
    initialState
  );

  return (
    <form action={formAction} className="grid gap-4 md:grid-cols-3">
      <div className="md:col-span-2">
        <label
          htmlFor="description"
          className="mb-2 block text-sm font-medium text-black dark:text-white"
        >
          Description
        </label>
        <input
          id="description"
          name="description"
          placeholder="Ex. Dry sarcasm for everyday situations"
          className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-black placeholder:text-gray-400 outline-none transition focus:border-black dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-400 dark:focus:border-white"
          required
        />
      </div>

      <div>
        <label
          htmlFor="slug"
          className="mb-2 block text-sm font-medium text-black dark:text-white"
        >
          Slug
        </label>
        <input
          id="slug"
          name="slug"
          placeholder="dry-sarcasm"
          className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-black placeholder:text-gray-400 outline-none transition focus:border-black dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-400 dark:focus:border-white"
          required
        />
      </div>

      <div className="md:col-span-3 space-y-3">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-xl border border-black bg-black px-5 py-3 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white dark:bg-white dark:text-black"
        >
          {isPending ? "Creating..." : "Create Flavor"}
        </button>

        {state.error && (
          <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
            {state.error}
          </p>
        )}

        {state.success && (
          <p className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-300">
            {state.success}
          </p>
        )}
      </div>
    </form>
  );
}