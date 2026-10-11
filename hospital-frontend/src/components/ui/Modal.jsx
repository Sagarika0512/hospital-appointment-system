import { useEffect, useRef } from "react";
import { XIcon } from "./Icons";

/**
 * CarePulse HMS — Accessible Reusable Modal Dialog
 *
 * @param {boolean} isOpen - Controls visibility
 * @param {function} onClose - Called on close request (Escape, backdrop, X button)
 * @param {string} title - Dialog header title
 * @param {string} description - Optional descriptive subtitle
 * @param {'sm' | 'md' | 'lg'} size - Dialog width preset
 * @param {boolean} showCloseButton - Renders top-right close icon button
 * @param {boolean} closeOnBackdrop - Enables closing on clicking backdrop
 */
export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  size = "md",
  showCloseButton = true,
  closeOnBackdrop = true,
  className = "",
}) {
  const dialogRef = useRef(null);
  const previousActiveElement = useRef(null);

  // Keyboard accessibility: Escape key and focus restoration
  useEffect(() => {
    if (!isOpen) return;

    previousActiveElement.current = document.activeElement;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose?.();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    // Prevent document body scrolling while modal is active
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // Focus modal dialog container on mount
    dialogRef.current?.focus();

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = originalOverflow;
      if (previousActiveElement.current && previousActiveElement.current.focus) {
        previousActiveElement.current.focus();
      }
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleBackdropClick = (e) => {
    if (closeOnBackdrop && e.target === e.currentTarget) {
      onClose?.();
    }
  };

  const titleId = title ? "cp-modal-title" : undefined;
  const descId = description ? "cp-modal-description" : undefined;
  const sizeClass = `cp-modal-${size}`;

  return (
    <div
      className="cp-modal-overlay"
      onClick={handleBackdropClick}
      role="presentation"
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
        tabIndex={-1}
        className={`cp-modal-dialog ${sizeClass} ${className}`.trim()}
      >
        {(title || showCloseButton) && (
          <div className="cp-modal-header">
            <div>
              {title && (
                <h3 id={titleId} className="cp-modal-title">
                  {title}
                </h3>
              )}
              {description && (
                <p id={descId} className="cp-modal-description">
                  {description}
                </p>
              )}
            </div>

            {showCloseButton && (
              <button
                type="button"
                onClick={onClose}
                className="cp-modal-close-btn"
                aria-label="Close dialog"
              >
                <XIcon size={20} />
              </button>
            )}
          </div>
        )}

        <div className="cp-modal-body">{children}</div>
      </div>
    </div>
  );
}

export default Modal;
