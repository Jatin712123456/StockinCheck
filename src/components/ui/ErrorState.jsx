import { AlertTriangle } from 'lucide-react';
import Button from './Button';

export default function ErrorState({ message, onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-red-100 bg-red-50 px-6 py-12 text-center">
      <AlertTriangle className="mb-3 h-10 w-10 text-red-500" />
      <h3 className="text-base font-semibold text-red-700">
        Something went wrong
      </h3>
      <p className="mt-1 max-w-sm text-sm text-red-600">
        {message || 'Could not load data.'}
      </p>
      {onRetry && (
        <div className="mt-4">
          <Button variant="danger" onClick={onRetry}>
            Try again
          </Button>
        </div>
      )}
    </div>
  );
}
