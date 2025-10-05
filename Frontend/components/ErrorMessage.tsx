interface ErrorMessageProps {
  error: Error | null;
  retry?: () => void;
  className?: string;
}

export default function ErrorMessage({ error, retry, className = "" }: ErrorMessageProps) {
  if (!error) return null;

  return (
    <div className={`p-4 border border-red-200 rounded-lg bg-red-50 dark:bg-red-900/20 dark:border-red-800 ${className}`}>
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
            Error loading data
          </h3>
          <p className="text-sm text-red-600 dark:text-red-300 mt-1">
            {error.message || "Something went wrong"}
          </p>
        </div>
        {retry && (
          <button
            onClick={retry}
            className="ml-4 px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        )}
      </div>
    </div>
  );
}