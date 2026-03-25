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
      <form onSubmit={handleSubmit} className="rounded-xl border p-4 space-y-4">
        <div>
          <p className="font-medium">Upload Test Image</p>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="mt-2"
          />
        </div>

        <div>
          <p className="font-medium">Steps in this flavor</p>
          <ol className="mt-2 list-decimal pl-5 text-sm">
            {steps.map((step) => (
              <li key={step.id}>
                {step.description || `Step ${step.order_by}`}
              </li>
            ))}
          </ol>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="rounded border px-4 py-2"
        >
          {loading ? "Running..." : "Run Flavor"}
        </button>

        {error && <p className="text-sm text-red-600">{error}</p>}
      </form>

      {stepResults.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Step Outputs</h2>

          {stepResults.map((result) => (
            <div key={result.stepNumber} className="rounded-xl border p-4">
              <p className="font-medium">
                Step {result.stepNumber}: {result.description}
              </p>
              <pre className="mt-2 whitespace-pre-wrap rounded bg-gray-100 p-3 text-sm dark:bg-gray-800">
                {result.output}
              </pre>
            </div>
          ))}
        </section>
      )}

      {finalOutput && (
        <section className="rounded-xl border p-4">
          <h2 className="text-xl font-semibold">Final Output</h2>
          <pre className="mt-2 whitespace-pre-wrap rounded bg-gray-100 p-3 text-sm dark:bg-gray-800">
            {finalOutput}
          </pre>
        </section>
      )}
    </div>
  );
}