import React, { useEffect } from "react";
import "./FormModal.css";

interface FormModalProps {
  isOpen: boolean;
  title: string;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  children: React.ReactNode;
  submitLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  size?: "small" | "medium" | "large";
}

const FormModal: React.FC<FormModalProps> = ({
  isOpen,
  title,
  onClose,
  onSubmit,
  children,
  submitLabel = "Save",
  cancelLabel = "Cancel",
  loading = false,
  size = "medium",
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="form-modal-overlay" onClick={onClose}>
      <div
        className={`form-modal ${size}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="form-modal-header">
          <h2>{title}</h2>
          <button
            className="form-modal-close"
            onClick={onClose}
            aria-label="Close"
          >
            <svg viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>
        <form onSubmit={onSubmit} className="form-modal-form">
          <div className="form-modal-body">{children}</div>
          <div className="form-modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={loading}
            >
              {cancelLabel}
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="btn-spinner" />
                  Saving...
                </>
              ) : (
                submitLabel
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FormModal;

