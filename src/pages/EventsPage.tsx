import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import {
  Plus, Search, Calendar, MapPin, Tag,
  ChevronRight, Edit2, Trash2, CheckCircle, Clock, Zap,
} from 'lucide-react';
import { formatDate, getEventTypeLabel, getEventStatusLabel, truncate } from '../utils';
import AppLayout from '../components/AppLayout';
import EmptyState from '../components/EmptyState';
import ConfirmDialog from '../components/ConfirmDialog';
import { useToast } from '../ToastContext';
import type { EventType, EventStatus } from '../types';

const EVENT_TYPES: EventType[] = ['conference', 'workshop', 'meetup', 'webinar', 'seminar', 'networking', 'hackathon', 'other'];
const EVENT_STATUSES: EventStatus[] = ['upcoming', 'ongoing', 'completed'];

function EventStatusIcon({ status }: { status: EventStatus }) {
  if (status === 'completed') return <CheckCircle size={13} color="var(--emerald)" />;
  if (status === 'ongoing') return <Zap size={13} color="#FFBA49" />;
  return <Clock size={13} color="#64A0FF" />;
}

export default function EventsPage() {
  const navigate = useNavigate();
  const { events, deleteEvent } = useStore();
  const { showToast } = useToast();

  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<EventType | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<EventStatus | 'all'>('all');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filtered = events.filter((e) => {
    const q = search.toLowerCase();
    const matchSearch = !q || e.name.toLowerCase().includes(q) || e.description?.toLowerCase().includes(q);
    const matchType = filterType === 'all' || e.type === filterType;
    const matchStatus = filterStatus === 'all' || e.status === filterStatus;
    return matchSearch && matchType && matchStatus;
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  function handleDelete() {
    if (!deleteId) return;
    deleteEvent(deleteId);
    showToast('Event deleted.', 'success');
    setDeleteId(null);
  }

  const { notes, actions } = useStore();

  return (
    <AppLayout>
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ minWidth: 0, flex: '1 1 200px' }}>
            <h1 className="page-title">My Events</h1>
            <p className="page-subtitle">Create and manage your event workspaces</p>
          </div>
          <button className="btn btn-solid" onClick={() => navigate('/events/new')} id="events-new-btn" style={{ flexShrink: 0 }}>
            <Plus size={14} /> New Event
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="filter-row">
        <div className="search-bar" style={{ flex: '1 1 220px', minWidth: 0 }}>
          <Search size={14} className="search-icon" />
          <input
            id="events-search"
            type="text"
            placeholder="Search events…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div style={{ display: 'flex', gap: 8, flex: '1 1 260px' }}>
          <select
            className="form-select"
            style={{ flex: 1, minWidth: 120 }}
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as EventType | 'all')}
            id="events-type-filter"
          >
            <option value="all">All Types</option>
            {EVENT_TYPES.map((t) => (
              <option key={t} value={t}>{getEventTypeLabel(t)}</option>
            ))}
          </select>
          <select
            className="form-select"
            style={{ flex: 1, minWidth: 120 }}
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as EventStatus | 'all')}
            id="events-status-filter"
          >
            <option value="all">All Statuses</option>
            {EVENT_STATUSES.map((s) => (
              <option key={s} value={s}>{getEventStatusLabel(s)}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Events Grid */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={<Calendar size={24} />}
          title={search || filterType !== 'all' || filterStatus !== 'all' ? 'No events match your filters' : 'No events yet'}
          description={search || filterType !== 'all' || filterStatus !== 'all'
            ? 'Try adjusting your search or filters.'
            : 'Create your first event to start capturing learnings, actions, and connections.'}
          action={
            !search && filterType === 'all' && filterStatus === 'all' ? (
              <button className="btn btn-solid" onClick={() => navigate('/events/new')}>
                <Plus size={13} /> Add First Event
              </button>
            ) : undefined
          }
        />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 300px), 1fr))', gap: 14 }}>
          {filtered.map((evt) => {
            const evtNotes = notes.filter((n) => n.eventId === evt.id);
            const evtActions = actions.filter((a) => a.eventId === evt.id);
            const doneActions = evtActions.filter((a) => a.status === 'completed').length;
            const pct = evtActions.length > 0 ? Math.round((doneActions / evtActions.length) * 100) : 0;

            return (
              <div key={evt.id} className="event-card" onClick={() => navigate(`/events/${evt.id}`)}>
                {/* Status + Type */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingLeft: 10, marginBottom: 8 }}>
                  <EventStatusIcon status={evt.status} />
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>
                    {getEventStatusLabel(evt.status)} · {getEventTypeLabel(evt.type)}
                  </span>
                </div>

                <div className="event-card-title">{evt.name}</div>

                <div className="event-card-meta">
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Calendar size={11} /> {formatDate(evt.date)}
                  </span>
                  {evt.location && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <MapPin size={11} /> {evt.location}
                    </span>
                  )}
                </div>

                {evt.description && (
                  <p style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 8, paddingLeft: 10, lineHeight: 1.5 }}>
                    {truncate(evt.description, 90)}
                  </p>
                )}

                {/* Tags */}
                {evt.tags && evt.tags.length > 0 && (
                  <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', paddingLeft: 10, marginTop: 8 }}>
                    {evt.tags.slice(0, 3).map((t) => (
                      <span key={t} className="tag" style={{ fontSize: 10 }}>
                        <Tag size={9} /> {t}
                      </span>
                    ))}
                    {evt.tags.length > 3 && (
                      <span className="tag" style={{ fontSize: 10 }}>+{evt.tags.length - 3}</span>
                    )}
                  </div>
                )}

                {/* Stats row */}
                <div style={{
                  display: 'flex', gap: 12, marginTop: 12, paddingLeft: 10,
                  paddingTop: 10, borderTop: '1px solid var(--border)',
                  fontSize: 11.5, color: 'var(--text-muted)',
                }}>
                  <span>{evtNotes.length} notes</span>
                  <span>{evtActions.length} actions</span>
                  {evtActions.length > 0 && <span style={{ color: 'var(--emerald)' }}>{pct}% done</span>}
                </div>

                {/* Progress bar */}
                {evtActions.length > 0 && (
                  <div style={{ paddingLeft: 10, paddingRight: 4, marginTop: 6 }}>
                    <div className="progress-bar-track">
                      <div className="progress-bar-fill" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div
                  style={{ display: 'flex', gap: 6, marginTop: 10, paddingLeft: 10 }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={(e) => { e.stopPropagation(); navigate(`/events/${evt.id}/edit`); }}
                    aria-label="Edit event"
                  >
                    <Edit2 size={12} />
                  </button>
                  <button
                    className="btn btn-ghost btn-sm"
                    style={{ color: '#FF6363' }}
                    onClick={(e) => { e.stopPropagation(); setDeleteId(evt.id); }}
                    aria-label="Delete event"
                  >
                    <Trash2 size={12} />
                  </button>
                  <button
                    className="btn btn-outline btn-sm"
                    style={{ marginLeft: 'auto' }}
                    onClick={(e) => { e.stopPropagation(); navigate(`/events/${evt.id}`); }}
                  >
                    Open <ChevronRight size={12} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirm */}
      {deleteId && (
        <ConfirmDialog
          title="Delete Event"
          message="This will permanently delete the event and all its associated notes, actions, and connections. This action cannot be undone."
          onConfirm={handleDelete}
          onCancel={() => setDeleteId(null)}
        />
      )}
    </AppLayout>
  );
}
