import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useStore } from '../store';
import { Plus, Tag, Minus } from 'lucide-react';
import { useToast } from '../ToastContext';
import AppLayout from '../components/AppLayout';
import type { EventType, EventStatus } from '../types';

const EVENT_TYPES: { value: EventType; label: string }[] = [
  { value: 'conference', label: 'Conference' },
  { value: 'workshop', label: 'Workshop' },
  { value: 'meetup', label: 'Meetup' },
  { value: 'webinar', label: 'Webinar' },
  { value: 'seminar', label: 'Seminar' },
  { value: 'networking', label: 'Networking Event' },
  { value: 'hackathon', label: 'Hackathon' },
  { value: 'other', label: 'Other' },
];

const EVENT_STATUSES: { value: EventStatus; label: string }[] = [
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'ongoing', label: 'Ongoing' },
  { value: 'completed', label: 'Completed' },
];

export default function EventForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { events, addEvent, updateEvent } = useStore();
  const { showToast } = useToast();

  const existing = id ? events.find((e) => e.id === id) : null;
  const isEdit = Boolean(existing);

  const [form, setForm] = useState({
    name: existing?.name || '',
    date: existing?.date || '',
    endDate: existing?.endDate || '',
    type: (existing?.type || 'conference') as EventType,
    status: (existing?.status || 'upcoming') as EventStatus,
    location: existing?.location || '',
    description: existing?.description || '',
    reflection: existing?.reflection || '',
  });

  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>(existing?.tags || []);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate() {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'Event name is required.';
    if (!form.date) e.date = 'Date is required.';
    return e;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    if (isEdit && existing) {
      updateEvent(existing.id, { ...form, tags });
      showToast('Event updated successfully.', 'success');
      navigate(`/events/${existing.id}`);
    } else {
      const newId = addEvent({ ...form, tags });
      showToast('Event created!', 'success');
      navigate(`/events/${newId}`);
    }
  }

  function addTag() {
    const t = tagInput.trim();
    if (t && !tags.includes(t) && tags.length < 10) {
      setTags([...tags, t]);
      setTagInput('');
    }
  }

  function removeTag(t: string) {
    setTags(tags.filter((x) => x !== t));
  }

  return (
    <AppLayout>
      <div className="page-header">
        <h1 className="page-title">{isEdit ? 'Edit Event' : 'New Event'}</h1>
        <p className="page-subtitle">
          {isEdit ? 'Update event details and reflections.' : 'Create a new event workspace to capture learnings and actions.'}
        </p>
      </div>

      <div style={{ maxWidth: 660 }}>
        <form onSubmit={handleSubmit}>
          <div className="card">
            <div style={{ fontFamily: 'Outfit,sans-serif', fontWeight: 600, fontSize: 14, color: 'var(--text-secondary)', marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.6px' }}>
              Event Details
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="event-name">Event Name *</label>
              <input
                id="event-name"
                className={`form-input ${errors.name ? 'error' : ''}`}
                type="text"
                placeholder="e.g. ReactConf India 2024"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                style={errors.name ? { borderColor: '#FF6363' } : {}}
              />
              {errors.name && <div style={{ fontSize: 11.5, color: '#FF6363', marginTop: 4 }}>{errors.name}</div>}
            </div>

            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label" htmlFor="event-date">Start Date *</label>
                <input
                  id="event-date"
                  className="form-input"
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  style={errors.date ? { borderColor: '#FF6363' } : {}}
                />
                {errors.date && <div style={{ fontSize: 11.5, color: '#FF6363', marginTop: 4 }}>{errors.date}</div>}
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="event-end-date">End Date</label>
                <input
                  id="event-end-date"
                  className="form-input"
                  type="date"
                  value={form.endDate}
                  onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                />
              </div>
            </div>

            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label" htmlFor="event-type">Event Type</label>
                <select
                  id="event-type"
                  className="form-select"
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value as EventType })}
                >
                  {EVENT_TYPES.map(({ value, label }) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="event-status">Status</label>
                <select
                  id="event-status"
                  className="form-select"
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value as EventStatus })}
                >
                  {EVENT_STATUSES.map(({ value, label }) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="event-location">Location</label>
              <input
                id="event-location"
                className="form-input"
                type="text"
                placeholder="e.g. Bengaluru, India or Online"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="event-description">Description</label>
              <textarea
                id="event-description"
                className="form-textarea"
                placeholder="Brief description of the event…"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>

            {/* Tags */}
            <div className="form-group">
              <label className="form-label">Tags</label>
              <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                <input
                  id="event-tag-input"
                  className="form-input"
                  type="text"
                  placeholder="Add a tag…"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
                />
                <button type="button" className="btn btn-outline" onClick={addTag}>
                  <Plus size={13} />
                </button>
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {tags.map((t) => (
                  <span key={t} className="tag" style={{ gap: 5 }}>
                    <Tag size={10} /> {t}
                    <button
                      type="button"
                      onClick={() => removeTag(t)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 0, marginLeft: 2, display: 'flex' }}
                    >
                      <Minus size={9} />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="card" style={{ marginTop: 14 }}>
            <div style={{ fontFamily: 'Outfit,sans-serif', fontWeight: 600, fontSize: 14, color: 'var(--text-secondary)', marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.6px' }}>
              Personal Reflection
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" htmlFor="event-reflection">What stood out? What will you do differently?</label>
              <textarea
                id="event-reflection"
                className="form-textarea"
                style={{ minHeight: 100 }}
                placeholder="Personal thoughts, highlights, and reflections on this event…"
                value={form.reflection}
                onChange={(e) => setForm({ ...form, reflection: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 16, justifyContent: 'flex-end' }}>
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => navigate(isEdit && existing ? `/events/${existing.id}` : '/events')}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-solid" id="event-form-submit">
              {isEdit ? 'Save Changes' : 'Create Event'}
            </button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}
