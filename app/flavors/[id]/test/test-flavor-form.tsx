"use client";

import { useState } from "react";

type Step = {
  id: number;
  order_by: number;
  description: string | null;
  llm_system_prompt: string | null;
  llm_user_prompt: string | null;
  llm_temperature: number | null;
};

type StepResult = {
  stepNumber: number;
  description: string;
  output: string;
};

export default function TestFlavorForm({
  flavorId,
  steps,
}: {
  flavorId: string;
  steps: Step[];
}) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [stepResults, setStepResults] = useState<StepResult[]>([]);
  const [finalOutput, setFinalOutput] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!file) {
      setError("Please choose an image first.");
      return;
    }

    setLoading(true);
    setError("");
    setStepResults([]);
    setFinalOutput("");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("flavorId", flavorId);

      const res = await fetch("/api/test-flavor", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Something went wrong.");
      }

      setStepResults(data.stepResults || []);
      setFinalOutput(data.finalOutput || "");
    } catch (err: any) {
      setError(err.message || "Failed to test flavor.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900"
      >
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold text-black dark:text-white">
              Upload Test Image
            </h2>
            <p className="mt-1 text-sm text-gray-600 dark:text-slate-300">
              Upload an image to test this humor flavor and generate captions.
            </p>
          </div>

          <div className="space-y-2">
            <label
              htmlFor="test-image"
              className="block text-sm font-medium text-black dark:text-white"
            >
              Choose Image
            </label>
            <input
              id="test-image"
              type="file"
              accept="image/*"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="block w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-black file:mr-4 file:rounded-lg file:border-0 file:bg-black file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:opacity-90 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:file:bg-white dark:file:text-black"
            />
            {file && (
              <p className="text-sm text-gray-600 dark:text-slate-300">
                Selected file: <span className="font-medium">{file.name}</span>
              </p>
            )}
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-black dark:text-white">
              Steps in this flavor
            </p>
            <div className="rounded-xl bg-gray-50 p-4 dark:bg-slate-950">
              {steps.length === 0 ? (
                <p className="text-sm text-gray-600 dark:text-slate-300">
                  No steps found for this flavor.
                </p>
              ) : (
                <ol className="list-decimal space-y-2 pl-5 text-sm text-black dark:text-slate-200">
                  {steps.map((step) => (
                    <li key={step.id}>
                      {step.description || `Step ${step.order_by}`}
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <button
              type="submit"
              disabled={loading}
              className="rounded-xl border border-black bg-black px-5 py-3 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white dark:bg-white dark:text-black"
            >
              {loading ? "Running..." : "Run Flavor"}
            </button>

            {error && (
              <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
                {error}
              </p>
            )}
          </div>
        </div>
      </form>

      {stepResults.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-black dark:text-white">
            Step Outputs
          </h2>

          {stepResults.map((result) => (
            <div
              key={result.stepNumber}
              className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900"
            >
              <p className="text-sm font-medium uppercase tracking-wide text-gray-500 dark:text-slate-400">
                Step {result.stepNumber}
              </p>
              <h3 className="mt-1 text-lg font-semibold text-black dark:text-white">
                {result.description}
              </h3>

              <pre className="mt-4 whitespace-pre-wrap rounded-xl bg-gray-100 p-4 text-sm text-black dark:bg-slate-950 dark:text-slate-200">
                {result.output}
              </pre>
            </div>
          ))}
        </section>
      )}

      {finalOutput && (
        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <h2 className="text-2xl font-semibold text-black dark:text-white">
            Final Output
          </h2>
          <p className="mt-1 text-sm text-gray-600 dark:text-slate-300">
            These are the generated captions or final results from the test run.
          </p>

          <pre className="mt-4 whitespace-pre-wrap rounded-xl bg-gray-100 p-4 text-sm text-black dark:bg-slate-950 dark:text-slate-200">
            {finalOutput}
          </pre>
        </section>
      )}
    </div>
  );
}