import { useState, useEffect } from 'react';
import { useStore } from '../store';
import { X } from 'lucide-react';
import { useToast } from '../ToastContext';
import type { Priority, ActionStatus } from '../types';

interface ActionFormModalProps {
  actionId?: string;
  defaultEventId?: string;
  onClose: () => void;
}

export default function ActionFormModal({ actionId, defaultEventId, onClose }: ActionFormModalProps) {
  const { actions, events, addAction, updateAction } = useStore();
  const { showToast } = useToast();

  const existing = actionId ? actions.find((a) => a.id === actionId) : null;

  const [form, setForm] = useState({
    title: existing?.title || '',
    description: existing?.description || '',
    eventId: existing?.eventId || defaultEventId || '',
    priority: (existing?.priority || 'medium') as Priority,
    status: (existing?.status || 'pending') as ActionStatus,
    dueDate: existing?.dueDate || '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate() {
    const e: Record<string, string> = {};
    if (!form.title.trim()) e.title = 'Title is required.';
    return e;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    if (existing) {
      updateAction(existing.id, form);
      showToast('Action updated.', 'success');
    } else {
      addAction(form);
      showToast('Action created!', 'success');
    }
    onClose();
  }

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{existing ? 'Edit Action' : 'New Action'}</h2>
          <button className="btn btn-ghost" onClick={onClose} aria-label="Close"><X size={16} /></button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="action-title">Title *</label>
            <input
              id="action-title"
              className="form-input"
              placeholder="What needs to be done?"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              style={errors.title ? { borderColor: '#FF6363' } : {}}
              autoFocus
            />
            {errors.title && <div style={{ fontSize: 11.5, color: '#FF6363', marginTop: 4 }}>{errors.title}</div>}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="action-description">Description</label>
            <textarea
              id="action-description"
              className="form-textarea"
              placeholder="Additional details or context…"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label" htmlFor="action-event">Event</label>
              <select
                id="action-event"
                className="form-select"
                value={form.eventId}
                onChange={(e) => setForm({ ...form, eventId: e.target.value })}
              >
                <option value="">No event</option>
                {events.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="action-due">Due Date</label>
              <input
                id="action-due"
                className="form-input"
                type="date"
                value={form.dueDate}
                onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
              />
            </div>
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label" htmlFor="action-priority">Priority</label>
              <select
                id="action-priority"
                className="form-select"
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value as Priority })}
              >
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="action-status">Status</label>
              <select
                id="action-status"
                className="form-select"
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as ActionStatus })}
              >
                <option value="pending">Pending</option>
                <option value="inprogress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-solid" id="action-form-submit">
              {existing ? 'Save Changes' : 'Create Action'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
