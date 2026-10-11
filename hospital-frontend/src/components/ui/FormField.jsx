import { AlertCircleIcon } from "./Icons";

/**
 * CarePulse HMS — FormField Wrapper
 * Provides accessible label, required asterisk, helper text, and validation error
 */
export function FormField({
  id,
  label,
  required = false,
  error,
  helperText,
  children,
  className = "",
  disabled = false,
}) {
  const errorId = id && error ? `${id}-error` : undefined;
  const helperId = id && helperText && !error ? `${id}-helper` : undefined;

  return (
    <div className={`cp-form-field ${disabled ? "cp-form-field-disabled" : ""} ${className}`.trim()}>
      {label && (
        <label htmlFor={id} className="cp-form-label">
          {label}
          {required && <span className="cp-required-mark" aria-hidden="true">*</span>}
        </label>
      )}

      {children}

      {error ? (
        <div id={errorId} className="cp-form-error" role="alert">
          <AlertCircleIcon size={14} />
          <span>{error}</span>
        </div>
      ) : helperText ? (
        <div id={helperId} className="cp-form-helper">
          {helperText}
        </div>
      ) : null}
    </div>
  );
}

export default FormField;
