import React, { useEffect, useRef } from "react";
import { createRoot } from "react-dom/client";
import { AlertTriangle } from "lucide-react";

// Themed replacement for window.confirm(): `if (!(await confirmDialog("Delete?"))) return;`
function ConfirmDialog({ message, title, confirmText, cancelText, danger, onClose }) {
  const confirmRef = useRef(null);
  const cancelRef = useRef(null);

  useEffect(() => {
    (danger ? cancelRef : confirmRef).current?.focus();
    const onKey = (e) => {
      if (e.key === "Escape") onClose(false);
      else if (e.key === "Tab") {
        // keep focus on the two buttons
        e.preventDefault();
        (document.activeElement === confirmRef.current ? cancelRef : confirmRef).current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [danger, onClose]);

  return (
    <div className="fixed inset-0 z-[2147483000] flex items-center justify-center p-4 bg-backdrop" onClick={() => onClose(false)}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        className="w-full max-w-md bg-elevated border border-line rounded-xl shadow-elevated p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${danger ? "bg-error/10 text-error" : "bg-brand/10 text-brand-fg"}`}>
            <AlertTriangle size={20} />
          </div>
          <div className="min-w-0">
            <h2 id="confirm-dialog-title" className="text-[16px] font-[600] text-fg-strong">{title}</h2>
            <p className="mt-1 text-[14px] text-fg-secondary whitespace-pre-line break-words">{message}</p>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button
            ref={cancelRef}
            type="button"
            onClick={() => onClose(false)}
            className="px-4 py-2 rounded-lg border border-line text-fg text-[14px] font-[500] hover:bg-hover"
          >
            {cancelText}
          </button>
          <button
            ref={confirmRef}
            type="button"
            onClick={() => onClose(true)}
            className={`px-4 py-2 rounded-lg text-on-brand text-[14px] font-[500] ${danger ? "bg-error-solid hover:opacity-90" : "bg-brand hover:bg-brand-hover"}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

export function confirmDialog(message, { title = "Please confirm", confirmText = "Confirm", cancelText = "Cancel", danger = false } = {}) {
  return new Promise((resolve) => {
    const host = document.createElement("div");
    document.body.appendChild(host);
    const root = createRoot(host);
    const previousFocus = document.activeElement;
    const onClose = (answer) => {
      root.unmount();
      host.remove();
      previousFocus?.focus?.();
      resolve(answer);
    };
    root.render(
      <ConfirmDialog message={message} title={title} confirmText={confirmText} cancelText={cancelText} danger={danger} onClose={onClose} />
    );
  });
}
