import { forwardRef } from "react";

/**
 * CarePulse HMS — Reusable Input Component
 */
export const Input = forwardRef(function Input(
  {
    id,
    type = "text",
    error,
    helperText,
    iconPrefix,
    iconSuffix,
    className = "",
    disabled = false,
    ...props
  },
  ref
) {
  const hasError = Boolean(error);
  const errorId = id && error ? `${id}-error` : undefined;
  const helperId = id && helperText && !error ? `${id}-helper` : undefined;
  const describedBy = errorId || helperId;

  const prefixClass = iconPrefix ? "cp-input-has-prefix" : "";
  const suffixClass = iconSuffix ? "cp-input-has-suffix" : "";
  const errorClass = hasError ? "cp-input-error" : "";

  return (
    <div className="cp-input-container">
      {iconPrefix && (
        <span className="cp-input-icon-prefix" aria-hidden="true">
          {iconPrefix}
        </span>
      )}

      <input
        ref={ref}
        id={id}
        type={type}
        disabled={disabled}
        aria-invalid={hasError ? "true" : "false"}
        aria-describedby={describedBy}
        className={`cp-input ${prefixClass} ${suffixClass} ${errorClass} ${className}`.trim()}
        {...props}
      />

      {iconSuffix && (
        <span className="cp-input-icon-suffix" aria-hidden="true">
          {iconSuffix}
        </span>
      )}
    </div>
  );
});

export default Input;
