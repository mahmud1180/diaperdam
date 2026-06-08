"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="max-w-2xl mx-auto px-4 py-16 text-center">
      <h2 className="text-2xl font-bold text-slate-900 mb-4">Something went wrong</h2>
      <p className="text-slate-600 mb-2">
        {error.message || "An unexpected error occurred."}
      </p>
      {error.digest && (
        <p className="text-xs text-slate-400 mb-6">Error ID: {error.digest}</p>
      )}
      <button
        onClick={() => reset()}
        className="bg-emerald-600 text-white font-semibold px-6 py-2 rounded-xl hover:bg-emerald-700 transition-colors"
      >
        Try again
      </button>
    </div>
  );
}
