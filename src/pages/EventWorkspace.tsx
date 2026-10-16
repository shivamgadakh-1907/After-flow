import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useStore } from '../store';
import {
  Calendar, MapPin, Tag, Edit2, Trash2, Plus,
  BookOpen, CheckSquare, Users, ArrowLeft,
  ChevronRight, CheckCircle, Zap, FileText,
} from 'lucide-react';
import { formatDate, getEventTypeLabel, getEventStatusLabel, getInitials, getAvatarGradient } from '../utils';
import AppLayout from '../components/AppLayout';
import ConfirmDialog from '../components/ConfirmDialog';
import EmptyState from '../components/EmptyState';
import { useToast } from '../ToastContext';

const TABS = ['Overview', 'Learnings', 'Actions', 'Connections'] as const;
type Tab = typeof TABS[number];

export default function EventWorkspace() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { events, notes, actions, connections, deleteEvent, updateActionStatus } = useStore();
  const { showToast } = useToast();

  const [tab, setTab] = useState<Tab>('Overview');
  const [showDelete, setShowDelete] = useState(false);

  const evt = events.find((e) => e.id === id);
  if (!evt) {
    return (
      <AppLayout>
        <EmptyState
          icon={<Calendar size={24} />}
          title="Event not found"
          description="This event may have been deleted."
          action={<button className="btn btn-solid" onClick={() => navigate('/events')}><ArrowLeft size={13} /> Back to Events</button>}
        />
      </AppLayout>
    );
  }

  const evtNotes = notes.filter((n) => n.eventId === id);
  const evtActions = actions.filter((a) => a.eventId === id);
  const evtConnections = connections.filter((c) => c.eventId === id);
  const doneActions = evtActions.filter((a) => a.status === 'completed').length;
  const pct = evtActions.length > 0 ? Math.round((doneActions / evtActions.length) * 100) : 0;
  const totalTakeaways = evtNotes.reduce((sum, n) => sum + n.takeaways.length, 0);

  function handleDelete() {
    if (!evt) return;
    deleteEvent(evt.id);
    showToast('Event deleted.', 'success');
    navigate('/events');
  }

  return (
    <AppLayout>
      {/* Header */}
      <div style={{ marginBottom: 18 }}>
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => navigate('/events')}
          style={{ marginBottom: 10, padding: '4px 6px' }}
        >
          <ArrowLeft size={14} /> Events
        </button>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span style={{
                fontSize: 11, padding: '2px 8px', borderRadius: 20, fontWeight: 500,
                background: evt.status === 'completed' ? 'rgba(0,217,149,0.1)' : evt.status === 'ongoing' ? 'rgba(255,186,73,0.1)' : 'rgba(100,160,255,0.1)',
                color: evt.status === 'completed' ? 'var(--emerald)' : evt.status === 'ongoing' ? '#FFBA49' : '#64A0FF',
                border: `1px solid ${evt.status === 'completed' ? 'rgba(0,217,149,0.2)' : evt.status === 'ongoing' ? 'rgba(255,186,73,0.2)' : 'rgba(100,160,255,0.2)'}`,
              }}>
                {getEventStatusLabel(evt.status)}
              </span>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{getEventTypeLabel(evt.type)}</span>
            </div>
            <h1 style={{ fontFamily: 'Outfit,sans-serif', fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6, letterSpacing: '-0.3px' }}>
              {evt.name}
            </h1>
            <div style={{ display: 'flex', gap: 14, fontSize: 12.5, color: 'var(--text-muted)', flexWrap: 'wrap' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <Calendar size={12} /> {formatDate(evt.date)}{evt.endDate ? ` — ${formatDate(evt.endDate)}` : ''}
              </span>
              {evt.location && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <MapPin size={12} /> {evt.location}
                </span>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-outline btn-sm" onClick={() => navigate(`/events/${evt.id}/edit`)}>
              <Edit2 size={12} /> Edit
            </button>
            <button className="btn btn-danger btn-sm" onClick={() => setShowDelete(true)}>
              <Trash2 size={12} /> Delete
            </button>
          </div>
        </div>

        {evt.tags && evt.tags.length > 0 && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
            {evt.tags.map((t) => (
              <span key={t} className="tag" style={{ fontSize: 11 }}>
                <Tag size={9} /> {t}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Stats row */}
      <div className="stat-row" style={{ marginBottom: 16 }}>
        {[
          { label: 'Notes', value: evtNotes.length, icon: BookOpen, color: 'var(--emerald)' },
          { label: 'Takeaways', value: totalTakeaways, icon: FileText, color: '#64A0FF' },
          { label: 'Actions', value: evtActions.length, icon: CheckSquare, color: '#FFBA49' },
          { label: 'Connections', value: evtConnections.length, icon: Users, color: '#EC4899' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="stat-item">
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              <Icon size={13} color={color} />
            </div>
            <div className="stat-value" style={{ fontSize: 20 }}>{value}</div>
            <div className="stat-label">{label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="tabs" style={{ marginBottom: 18, overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
        {TABS.map((t) => (
          <button key={t} className={`tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
            {t}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {tab === 'Overview' && (
        <div className="form-grid-2">
          {/* Description */}
          <div className="card">
            <div className="card-header">
              <span className="card-title"><FileText size={13} className="card-title-icon" />Description</span>
            </div>
            {evt.description ? (
              <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', lineHeight: 1.7 }}>{evt.description}</p>
            ) : (
              <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>No description added.</p>
            )}
          </div>

          {/* Progress */}
          <div className="card">
            <div className="card-header">
              <span className="card-title"><CheckCircle size={13} className="card-title-icon" />Action Progress</span>
              <button className="card-action" onClick={() => setTab('Actions')}>View <ChevronRight size={11} /></button>
            </div>
            {evtActions.length === 0 ? (
              <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>No actions yet.</p>
            ) : (
              <>
                <div style={{ fontSize: 28, fontFamily: 'Outfit,sans-serif', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>
                  {pct}% <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 400 }}>complete</span>
                </div>
                <div className="progress-bar-track" style={{ height: 7, marginBottom: 10 }}>
                  <div className="progress-bar-fill" style={{ width: `${pct}%` }} />
                </div>
                <div style={{ display: 'flex', gap: 12, fontSize: 12, color: 'var(--text-muted)' }}>
                  <span style={{ color: 'var(--emerald)' }}>✓ {doneActions} done</span>
                  <span>{evtActions.length - doneActions} remaining</span>
                </div>
              </>
            )}
          </div>

          {/* Reflection */}
          <div className="card" style={{ gridColumn: '1 / -1' }}>
            <div className="card-header">
              <span className="card-title"><Zap size={13} className="card-title-icon" />Personal Reflection</span>
              <button className="card-action" onClick={() => navigate(`/events/${evt.id}/edit`)}>Edit</button>
            </div>
            {evt.reflection ? (
              <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', lineHeight: 1.7 }}>{evt.reflection}</p>
            ) : (
              <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                No reflection added yet.{' '}
                <button
                  className="card-action"
                  onClick={() => navigate(`/events/${evt.id}/edit`)}
                >Add one</button>
              </p>
            )}
          </div>
        </div>
      )}

      {tab === 'Learnings' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 14 }}>
            <button className="btn btn-solid btn-sm" onClick={() => navigate(`/notes/new?event=${evt.id}`)}>
              <Plus size={13} /> Add Note
            </button>
          </div>
          {evtNotes.length === 0 ? (
            <EmptyState
              icon={<BookOpen size={22} />}
              title="No notes yet"
              description="Capture session notes, speaker summaries, or paste transcripts."
              action={
                <button className="btn btn-solid" onClick={() => navigate(`/notes/new?event=${evt.id}`)}>
                  <Plus size={13} /> Add First Note
                </button>
              }
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {evtNotes.map((n) => (
                <div key={n.id} className="card" style={{ cursor: 'pointer' }} onClick={() => navigate(`/notes/${n.id}`)}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <div>
                      <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>{n.title}</h3>
                      {n.speakerName && (
                        <span style={{ fontSize: 11.5, color: 'var(--emerald)', fontWeight: 500 }}>by {n.speakerName}</span>
                      )}
                    </div>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', flexShrink: 0 }}>{formatDate(n.createdAt)}</span>
                  </div>
                  {n.summary && (
                    <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 8 }}>{n.summary}</p>
                  )}
                  {n.takeaways.length > 0 && (
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {n.takeaways.slice(0, 3).map((t) => (
                        <span key={t.id} className="badge badge-completed" style={{ fontSize: 10.5 }}>
                          {t.title}
                        </span>
                      ))}
                      {n.takeaways.length > 3 && (
                        <span className="badge" style={{ fontSize: 10.5, background: 'rgba(0,0,0,0.2)' }}>
                          +{n.takeaways.length - 3} more
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'Actions' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 14 }}>
            <button className="btn btn-solid btn-sm" onClick={() => navigate(`/actions/new?event=${evt.id}`)}>
              <Plus size={13} /> Add Action
            </button>
          </div>
          {evtActions.length === 0 ? (
            <EmptyState
              icon={<CheckSquare size={22} />}
              title="No actions yet"
              description="Convert takeaways into actionable tasks."
              action={
                <button className="btn btn-solid" onClick={() => navigate(`/actions/new?event=${evt.id}`)}>
                  <Plus size={13} /> Create Action
                </button>
              }
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {evtActions.map((a) => (
                <div key={a.id} className="card" style={{ flexDirection: 'row', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <button
                    onClick={() => {
                      const next = a.status === 'completed' ? 'pending' : a.status === 'pending' ? 'inprogress' : 'completed';
                      updateActionStatus(a.id, next);
                    }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, flexShrink: 0, color: a.status === 'completed' ? 'var(--emerald)' : 'var(--text-muted)' }}
                    aria-label="Toggle action status"
                  >
                    <CheckCircle size={18} />
                  </button>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 500, color: a.status === 'completed' ? 'var(--text-muted)' : 'var(--text-primary)', textDecoration: a.status === 'completed' ? 'line-through' : 'none' }}>
                      {a.title}
                    </div>
                    {a.dueDate && <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 2 }}>Due {formatDate(a.dueDate)}</div>}
                  </div>
                  <span className={`badge badge-${a.priority}`}>{a.priority}</span>
                  <span className={`badge badge-${a.status}`}>{a.status === 'inprogress' ? 'In Progress' : a.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'Connections' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 14 }}>
            <button className="btn btn-solid btn-sm" onClick={() => navigate(`/connections/new?event=${evt.id}`)}>
              <Plus size={13} /> Add Connection
            </button>
          </div>
          {evtConnections.length === 0 ? (
            <EmptyState
              icon={<Users size={22} />}
              title="No connections yet"
              description="Add people you met at this event to track follow-ups."
              action={
                <button className="btn btn-solid" onClick={() => navigate(`/connections/new?event=${evt.id}`)}>
                  <Plus size={13} /> Add Connection
                </button>
              }
            />
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
              {evtConnections.map((c) => (
                <div key={c.id} className="connection-card">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div className="connection-avatar" style={{ background: getAvatarGradient(c.avatarColor) }}>
                      {getInitials(c.name)}
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{c.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{c.role}{c.organization ? ` · ${c.organization}` : ''}</div>
                    </div>
                  </div>
                  {c.followUpIntention && (
                    <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{c.followUpIntention}</p>
                  )}
                  <span className={`badge badge-${c.followUpStatus === 'completed' ? 'completed' : c.followUpStatus === 'overdue' ? 'high' : 'pending'}`}>
                    {c.followUpStatus}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {showDelete && (
        <ConfirmDialog
          title="Delete Event"
          message={`Delete "${evt.name}" and all its notes, actions, and connections? This cannot be undone.`}
          onConfirm={handleDelete}
          onCancel={() => setShowDelete(false)}
        />
      )}
    </AppLayout>
  );
}
