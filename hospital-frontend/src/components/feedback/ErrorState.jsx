import { AlertTriangleIcon, RefreshIcon } from "../ui/Icons";
import { Button } from "../ui/Button";

/**
 * CarePulse HMS — ErrorState Component
 * Displays user-friendly error guidance without leaking raw stack traces or internal errors
 *
 * @param {string} title
 * @param {string} description
 * @param {function} onRetry - Optional retry callback
 * @param {string} retryLabel - Button label
 * @param {boolean} isRetrying - Loading state on retry button
 */
export function ErrorState({
  title = "Unable to load data",
  description = "A system issue prevented us from completing this action. Please verify your connection and try again.",
  onRetry,
  retryLabel = "Try Again",
  isRetrying = false,
  className = "",
  ...props
}) {
  return (
    <div className={`cp-state-card ${className}`.trim()} role="alert" {...props}>
      <div className="cp-state-icon cp-state-icon-error" aria-hidden="true">
        <AlertTriangleIcon size={28} />
      </div>
      <h3 className="cp-state-title">{title}</h3>
      <p className="cp-state-desc">{description}</p>
      {onRetry && (
        <Button
          variant="outline"
          size="md"
          onClick={onRetry}
          isLoading={isRetrying}
          icon={<RefreshIcon size={16} />}
        >
          {retryLabel}
        </Button>
      )}
    </div>
  );
}

export default ErrorState;
