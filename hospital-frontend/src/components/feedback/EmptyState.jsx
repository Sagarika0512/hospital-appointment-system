import { CalendarIcon } from "../ui/Icons";

/**
 * CarePulse HMS — EmptyState Component
 *
 * @param {ReactNode} icon - Optional custom icon
 * @param {string} title - Main headline
 * @param {string} description - Helpful guidance message
 * @param {ReactNode} action - Optional action Button
 */
export function EmptyState({
  icon,
  title = "No records found",
  description = "There is currently no data available to display.",
  action,
  className = "",
  ...props
}) {
  return (
    <div className={`cp-state-card ${className}`.trim()} {...props}>
      <div className="cp-state-icon cp-state-icon-empty" aria-hidden="true">
        {icon || <CalendarIcon size={28} />}
      </div>
      <h3 className="cp-state-title">{title}</h3>
      <p className="cp-state-desc">{description}</p>
      {action && <div className="cp-state-action">{action}</div>}
    </div>
  );
}

export default EmptyState;
