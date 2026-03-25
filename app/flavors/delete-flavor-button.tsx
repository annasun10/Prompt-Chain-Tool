"use client";

export default function DeleteFlavorButton() {
  return (
    <button
      type="submit"
      className="rounded-lg border px-3 py-2 text-sm"
      onClick={(e) => {
        if (!confirm("Are you sure you want to delete this humor flavor?")) {
          e.preventDefault();
        }
      }}
    >
      Delete
    </button>
  );
}