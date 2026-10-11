import { forwardRef, useState } from "react";
import { EyeIcon, EyeOffIcon } from "./Icons";

/**
 * CarePulse HMS — Reusable PasswordInput with Accessible Visibility Toggle
 */
export const PasswordInput = forwardRef(function PasswordInput(
  {
    id,
    error,
    helperText,
    iconPrefix,
    className = "",
    disabled = false,
    ...props
  },
  ref
) {
  const [showPassword, setShowPassword] = useState(false);

  const hasError = Boolean(error);
  const errorId = id && error ? `${id}-error` : undefined;
  const helperId = id && helperText && !error ? `${id}-helper` : undefined;
  const describedBy = errorId || helperId;

  const prefixClass = iconPrefix ? "cp-input-has-prefix" : "";
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
        type={showPassword ? "text" : "password"}
        disabled={disabled}
        aria-invalid={hasError ? "true" : "false"}
        aria-describedby={describedBy}
        className={`cp-input ${prefixClass} cp-input-has-suffix ${errorClass} ${className}`.trim()}
        {...props}
      />

      <span className="cp-input-icon-suffix">
        <button
          type="button"
          onClick={() => setShowPassword((prev) => !prev)}
          className="cp-password-toggle-btn"
          aria-label={showPassword ? "Hide password" : "Show password"}
          tabIndex={disabled ? -1 : 0}
          disabled={disabled}
        >
          {showPassword ? <EyeOffIcon size={18} /> : <EyeIcon size={18} />}
        </button>
      </span>
    </div>
  );
});

export default PasswordInput;
