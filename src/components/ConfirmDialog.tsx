import { AlertTriangle, X } from 'lucide-react';

interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  danger?: boolean;
}

export default function ConfirmDialog({
  title,
  message,
  confirmLabel = 'Delete',
  onConfirm,
  onCancel,
  danger = true,
}: ConfirmDialogProps) {
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal" style={{ maxWidth: 400 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: danger ? 'rgba(255,99,99,0.12)' : 'rgba(0,217,149,0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: `1px solid ${danger ? 'rgba(255,99,99,0.2)' : 'var(--border)'}`,
            }}>
              <AlertTriangle size={18} color={danger ? '#FF6363' : 'var(--emerald)'} />
            </div>
            <h2 className="modal-title">{title}</h2>
          </div>
          <button className="btn btn-ghost" onClick={onCancel} aria-label="Close">
            <X size={16} />
          </button>
        </div>

        <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.6 }}>
          {message}
        </p>

        <div className="modal-footer">
          <button className="btn btn-outline" onClick={onCancel}>Cancel</button>
          <button
            className={`btn ${danger ? 'btn-danger' : 'btn-solid'}`}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
