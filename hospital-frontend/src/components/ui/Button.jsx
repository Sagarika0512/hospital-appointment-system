import { forwardRef } from "react";
import { Spinner } from "../feedback/Spinner";

/**
 * CarePulse HMS Reusable Button
 *
 * @param {'primary' | 'secondary' | 'outline' | 'danger' | 'ghost'} variant
 * @param {'sm' | 'md' | 'lg'} size
 * @param {boolean} isLoading - Displays spinner and prevents click
 * @param {string} loadingText - Text shown while loading
 * @param {ReactNode} icon - Leading icon
 * @param {ReactNode} iconRight - Trailing icon
 * @param {boolean} fullWidth - 100% width
 */
export const Button = forwardRef(function Button(
  {
    children,
    type = "button",
    variant = "primary",
    size = "md",
    isLoading = false,
    loadingText,
    icon,
    iconRight,
    fullWidth = false,
    disabled = false,
    className = "",
    onClick,
    ...props
  },
  ref
) {
  const isDisabled = disabled || isLoading;

  const handleClick = (e) => {
    if (isDisabled) {
      e.preventDefault();
      return;
    }
    if (onClick) {
      onClick(e);
    }
  };

  const variantClass = `cp-btn-${variant}`;
  const sizeClass = `cp-btn-${size}`;
  const fullWidthClass = fullWidth ? "cp-btn-full" : "";

  return (
    <button
      ref={ref}
      type={type}
      disabled={isDisabled}
      aria-disabled={isDisabled}
      aria-busy={isLoading}
      onClick={handleClick}
      className={`cp-btn ${variantClass} ${sizeClass} ${fullWidthClass} ${className}`.trim()}
      {...props}
    >
      {isLoading ? (
        <>
          <Spinner size="xs" color={variant === "primary" || variant === "danger" ? "white" : "primary"} />
          <span>{loadingText || children}</span>
        </>
      ) : (
        <>
          {icon && <span className="cp-btn-icon-leading" aria-hidden="true">{icon}</span>}
          {children && <span>{children}</span>}
          {iconRight && <span className="cp-btn-icon-trailing" aria-hidden="true">{iconRight}</span>}
        </>
      )}
    </button>
  );
});

export default Button;
