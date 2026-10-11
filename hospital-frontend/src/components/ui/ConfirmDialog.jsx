import { Modal } from "./Modal";
import { Button } from "./Button";
import { AlertCircleIcon } from "./Icons";

/**
 * CarePulse HMS — Reusable Confirmation Dialog
 * Accessible replacement for native browser window.confirm
 *
 * @param {boolean} isOpen
 * @param {function} onClose
 * @param {function} onConfirm
 * @param {string} title
 * @param {string} description
 * @param {string} confirmText
 * @param {string} cancelText
 * @param {'danger' | 'primary'} confirmVariant
 * @param {boolean} isLoading
 */
export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = "Are you sure?",
  description = "This action cannot be undone. Please confirm to proceed.",
  confirmText = "Confirm",
  cancelText = "Cancel",
  confirmVariant = "danger",
  isLoading = false,
}) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={isLoading ? undefined : onClose}
      size="sm"
      showCloseButton={!isLoading}
      closeOnBackdrop={!isLoading}
    >
      <div style={{ display: "flex", gap: "1rem", alignItems: "flex-start", marginBottom: "1.5rem" }}>
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: "var(--cp-radius-full)",
            backgroundColor: confirmVariant === "danger" ? "var(--cp-danger-background)" : "var(--cp-surface-highlight)",
            color: confirmVariant === "danger" ? "var(--cp-danger)" : "var(--cp-primary)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
          aria-hidden="true"
        >
          <AlertCircleIcon size={22} />
        </div>

        <div>
          <h3 style={{ margin: "0 0 0.375rem 0", fontSize: "var(--cp-font-size-lg)", fontWeight: "var(--cp-font-weight-bold)", color: "var(--cp-text-primary)" }}>
            {title}
          </h3>
          <p style={{ margin: 0, fontSize: "var(--cp-font-size-sm)", color: "var(--cp-text-secondary)", lineHeight: "var(--cp-line-height-normal)" }}>
            {description}
          </p>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
        <Button
          variant="outline"
          size="md"
          onClick={onClose}
          disabled={isLoading}
        >
          {cancelText}
        </Button>
        <Button
          variant={confirmVariant}
          size="md"
          onClick={onConfirm}
          isLoading={isLoading}
          loadingText="Processing..."
        >
          {confirmText}
        </Button>
      </div>
    </Modal>
  );
}

export default ConfirmDialog;
