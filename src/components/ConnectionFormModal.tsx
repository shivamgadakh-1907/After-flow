import { useState, useEffect } from 'react';
import { useStore } from '../store';
import { X, Mail, Link, Phone } from 'lucide-react';
import { useToast } from '../ToastContext';
import { pickAvatarColor, AVATAR_COLORS, getAvatarGradient, getInitials } from '../utils';
import type { FollowUpStatus } from '../types';

interface ConnectionFormModalProps {
  connectionId?: string;
  defaultEventId?: string;
  onClose: () => void;
}

export default function ConnectionFormModal({ connectionId, defaultEventId, onClose }: ConnectionFormModalProps) {
  const { connections, events, addConnection, updateConnection } = useStore();
  const { showToast } = useToast();

  const existing = connectionId ? connections.find((c) => c.id === connectionId) : null;

  const [form, setForm] = useState({
    name: existing?.name || '',
    role: existing?.role || '',
    organization: existing?.organization || '',
    email: existing?.email || '',
    linkedin: existing?.linkedin || '',
    phone: existing?.phone || '',
    eventId: existing?.eventId || defaultEventId || '',
    conversationNotes: existing?.conversationNotes || '',
    followUpIntention: existing?.followUpIntention || '',
    followUpDate: existing?.followUpDate || '',
    followUpStatus: (existing?.followUpStatus || 'pending') as FollowUpStatus,
    avatarColor: existing?.avatarColor || pickAvatarColor(),
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate() {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'Name is required.';
    return e;
  }

  function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    if (existing) {
      updateConnection(existing.id, form);
      showToast('Connection updated.', 'success');
    } else {
      addConnection(form);
      showToast('Connection added!', 'success');
    }
    onClose();
  }

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{existing ? 'Edit Connection' : 'Add Connection'}</h2>
          <button className="btn btn-ghost" onClick={onClose} aria-label="Close"><X size={16} /></button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Avatar preview */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <div
              className="connection-avatar"
              style={{ width: 52, height: 52, background: getAvatarGradient(form.avatarColor), fontSize: 18 }}
            >
              {form.name ? getInitials(form.name) : '?'}
            </div>
            <div>
              <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginBottom: 6 }}>Avatar color</div>
              <div style={{ display: 'flex', gap: 6 }}>
                {AVATAR_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setForm({ ...form, avatarColor: c })}
                    style={{
                      width: 18, height: 18, borderRadius: '50%',
                      background: getAvatarGradient(c), border: 'none', cursor: 'pointer',
                      outline: form.avatarColor === c ? `2px solid var(--emerald)` : 'none',
                      outlineOffset: 2,
                    }}
                    aria-label={`Select color ${c}`}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label" htmlFor="conn-name">Name *</label>
              <input
                id="conn-name"
                className="form-input"
                placeholder="Full name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                style={errors.name ? { borderColor: '#FF6363' } : {}}
                autoFocus
              />
              {errors.name && <div style={{ fontSize: 11.5, color: '#FF6363', marginTop: 4 }}>{errors.name}</div>}
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="conn-role">Role</label>
              <input id="conn-role" className="form-input" placeholder="e.g. AI Research Lead" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="conn-org">Organization</label>
              <input id="conn-org" className="form-input" placeholder="Company or institution" value={form.organization} onChange={(e) => setForm({ ...form, organization: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="conn-event">Event</label>
              <select id="conn-event" className="form-select" value={form.eventId} onChange={(e) => setForm({ ...form, eventId: e.target.value })}>
                <option value="">No event</option>
                {events.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="conn-phone"><Phone size={11} style={{ display: 'inline', marginRight: 4 }} />Phone / WhatsApp</label>
              <input id="conn-phone" className="form-input" placeholder="e.g. +91 98765 43210" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="conn-email"><Mail size={11} style={{ display: 'inline', marginRight: 4 }} />Email</label>
              <input id="conn-email" className="form-input" type="email" placeholder="email@example.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label className="form-label" htmlFor="conn-linkedin"><Link size={11} style={{ display: 'inline', marginRight: 4 }} />LinkedIn URL</label>
              <input id="conn-linkedin" className="form-input" placeholder="linkedin.com/in/…" value={form.linkedin} onChange={(e) => setForm({ ...form, linkedin: e.target.value })} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="conn-notes">Conversation Notes</label>
            <textarea id="conn-notes" className="form-textarea" placeholder="What did you talk about?" value={form.conversationNotes} onChange={(e) => setForm({ ...form, conversationNotes: e.target.value })} />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="conn-followup-intention">Follow-up Intention</label>
            <input id="conn-followup-intention" className="form-input" placeholder="What do you want to follow up on?" value={form.followUpIntention} onChange={(e) => setForm({ ...form, followUpIntention: e.target.value })} />
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label" htmlFor="conn-followup-date">Follow-up Date</label>
              <input id="conn-followup-date" className="form-input" type="date" value={form.followUpDate} onChange={(e) => setForm({ ...form, followUpDate: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="conn-followup-status">Status</label>
              <select id="conn-followup-status" className="form-select" value={form.followUpStatus} onChange={(e) => setForm({ ...form, followUpStatus: e.target.value as FollowUpStatus })}>
                <option value="pending">Pending</option>
                <option value="overdue">Overdue</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-solid" id="conn-form-submit">
              {existing ? 'Save Changes' : 'Add Connection'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
