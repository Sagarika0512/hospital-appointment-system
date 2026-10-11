import { forwardRef } from "react";
import { ChevronDownIcon } from "./Icons";

/**
 * CarePulse HMS — Reusable Select Component
 */
export const Select = forwardRef(function Select(
  {
    id,
    options = [],
    placeholder = "Select an option",
    error,
    helperText,
    className = "",
    disabled = false,
    children,
    ...props
  },
  ref
) {
  const hasError = Boolean(error);
  const errorId = id && error ? `${id}-error` : undefined;
  const helperId = id && helperText && !error ? `${id}-helper` : undefined;
  const describedBy = errorId || helperId;

  const errorClass = hasError ? "cp-input-error" : "";

  return (
    <div className="cp-input-container">
      <select
        ref={ref}
        id={id}
        disabled={disabled}
        aria-invalid={hasError ? "true" : "false"}
        aria-describedby={describedBy}
        className={`cp-input cp-select cp-input-has-suffix ${errorClass} ${className}`.trim()}
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {children
          ? children
          : options.map((opt) => (
              <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                {opt.label}
              </option>
            ))}
      </select>

      <span className="cp-input-icon-suffix" style={{ pointerEvents: "none" }}>
        <ChevronDownIcon size={16} />
      </span>
    </div>
  );
});

export default Select;
