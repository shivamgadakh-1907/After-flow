import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import {
  Calendar, Brain, CheckSquare, Users,
  ArrowRight, Plus, Zap, TrendingUp,
  Clock, Target, BookOpen, Lightbulb,
} from 'lucide-react';
import { formatDate, formatDateRelative, getInitials, getAvatarGradient, isOverdue } from '../utils';
import AppLayout from '../components/AppLayout';

// Circular progress SVG
function CircularProgress({ value, size = 88 }: { value: number; size?: number }) {
  const r = (size - 10) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (value / 100) * circ;

  return (
    <div className="circular-progress" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(0,0,0,0.3)" strokeWidth={8} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke="url(#emeraldGrad)" strokeWidth={8}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={isNaN(offset) ? circ : offset}
          style={{ transition: 'stroke-dashoffset 0.7s cubic-bezier(0.4,0,0.2,1)' }}
        />
        <defs>
          <linearGradient id="emeraldGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#00D995" />
            <stop offset="100%" stopColor="#36F5A0" />
          </linearGradient>
        </defs>
      </svg>
      <div className="circular-progress-text">
        <span style={{ fontFamily: 'Outfit,sans-serif', fontWeight: 700, fontSize: size * 0.18, color: 'var(--text-primary)', lineHeight: 1 }}>
          {Math.round(value)}%
        </span>
        <span style={{ fontSize: size * 0.12, color: 'var(--text-muted)', marginTop: 1 }}>done</span>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { events, notes, actions, connections } = useStore();

  // Derived stats
  const totalActions = actions.length;
  const completedActions = actions.filter((a) => a.status === 'completed').length;
  const pendingActions = actions.filter((a) => a.status === 'pending').length;
  const completionPct = totalActions > 0 ? (completedActions / totalActions) * 100 : 0;

  const upcomingEvents = events
    .filter((e) => e.status === 'upcoming')
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 3);

  const recentNotes = [...notes]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 4);

  const pendingFollowUps = connections
    .filter((c) => c.followUpStatus !== 'completed')
    .sort((a, b) => {
      if (!a.followUpDate) return 1;
      if (!b.followUpDate) return -1;
      return new Date(a.followUpDate).getTime() - new Date(b.followUpDate).getTime();
    })
    .slice(0, 4);

  const totalTakeaways = notes.reduce((sum, n) => sum + n.takeaways.length, 0);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <AppLayout>
      {/* Page Header */}
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ minWidth: 0, flex: '1 1 220px' }}>
            <h1 className="page-title">
              {greeting} 👋
            </h1>
            <p className="page-subtitle">
              Here's your post-event progress overview — {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          </div>
          <button
            className="btn btn-solid"
            onClick={() => navigate('/events/new')}
            id="dashboard-new-event-btn"
            style={{ flexShrink: 0 }}
          >
            <Plus size={14} /> New Event
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="stat-row" style={{ marginBottom: 18 }}>
        {[
          { label: 'Events', value: events.length, icon: Calendar, color: 'var(--emerald)' },
          { label: 'Takeaways', value: totalTakeaways, icon: BookOpen, color: '#64A0FF' },
          { label: 'Actions', value: totalActions, icon: Target, color: '#FFBA49' },
          { label: 'Connections', value: connections.length, icon: Users, color: '#EC4899' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="stat-item">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <div style={{
                width: 28, height: 28, borderRadius: 8, background: `${color}18`,
                border: `1px solid ${color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Icon size={14} color={color} />
              </div>
            </div>
            <div className="stat-value">{value}</div>
            <div className="stat-label">{label}</div>
          </div>
        ))}
      </div>

      {/* Main Grid */}
      <div className="dashboard-grid">

        {/* Card A: Upcoming Events */}
        <div className="card col-span-5">
          <div className="card-header">
            <span className="card-title">
              <Calendar size={13} className="card-title-icon" />
              Upcoming Events
            </span>
            <button className="card-action" onClick={() => navigate('/events')}>
              View all <ArrowRight size={11} style={{ display: 'inline', verticalAlign: 'middle' }} />
            </button>
          </div>

          {upcomingEvents.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)', fontSize: 13 }}>
              <Calendar size={28} style={{ opacity: 0.3, margin: '0 auto 10px', display: 'block' }} />
              No upcoming events yet
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {upcomingEvents.map((evt) => (
                <div
                  key={evt.id}
                  className="list-item"
                  onClick={() => navigate(`/events/${evt.id}`)}
                >
                  <span className="list-item-dot" />
                  <div className="list-item-content">
                    <div className="list-item-title">{evt.name}</div>
                    <div className="list-item-meta">
                      {formatDateRelative(evt.date)} · {evt.type} {evt.location ? `· ${evt.location}` : ''}
                    </div>
                  </div>
                  <span style={{
                    fontSize: 11, color: 'var(--emerald)', background: 'rgba(0,217,149,0.08)',
                    padding: '2px 8px', borderRadius: 20, border: '1px solid rgba(0,217,149,0.15)',
                    fontWeight: 500, flexShrink: 0,
                  }}>
                    {formatDateRelative(evt.date)}
                  </span>
                </div>
              ))}
            </div>
          )}

          {events.length === 0 && (
            <button className="btn btn-outline btn-sm" style={{ marginTop: 12, width: '100%' }}
              onClick={() => navigate('/events/new')}>
              <Plus size={12} /> Add your first event
            </button>
          )}
        </div>

        {/* Card D: Action Progress */}
        <div className="card col-span-4">
          <div className="card-header">
            <span className="card-title">
              <Target size={13} className="card-title-icon" />
              Action Progress
            </span>
            <button className="card-action" onClick={() => navigate('/actions')}>
              Board <ArrowRight size={11} style={{ display: 'inline', verticalAlign: 'middle' }} />
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
            <CircularProgress value={completionPct} size={88} />
            <div style={{ flex: 1 }}>
              {[
                { label: 'Total Tasks', value: totalActions, color: 'var(--text-secondary)' },
                { label: 'Completed', value: completedActions, color: 'var(--emerald)' },
                { label: 'Pending', value: pendingActions, color: '#FFBA49' },
                { label: 'In Progress', value: actions.filter(a => a.status === 'inprogress').length, color: '#64A0FF' },
              ].map(({ label, value, color }) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{label}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color }}>{value}</span>
                </div>
              ))}
            </div>
          </div>

          {totalActions > 0 && (
            <div style={{ marginTop: 12 }}>
              <div className="progress-bar-track">
                <div className="progress-bar-fill" style={{ width: `${completionPct}%` }} />
              </div>
            </div>
          )}
        </div>

        {/* Card E: Quick Actions */}
        <div className="card col-span-3">
          <div className="card-header">
            <span className="card-title">
              <Zap size={13} className="card-title-icon" />
              Quick Actions
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { label: 'Add Event', icon: Calendar, to: '/events/new', id: 'qa-add-event' },
              { label: 'Capture Learning', icon: Brain, to: '/notes/new', id: 'qa-capture' },
              { label: 'Create Action', icon: CheckSquare, to: '/actions/new', id: 'qa-action' },
              { label: 'Add Connection', icon: Users, to: '/connections/new', id: 'qa-connection' },
            ].map(({ label, icon: Icon, to, id }) => (
              <button
                key={to}
                id={id}
                className="btn btn-outline"
                style={{ justifyContent: 'flex-start', width: '100%' }}
                onClick={() => navigate(to)}
              >
                <Icon size={13} />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Card B: Smart Capture */}
        <div className="card col-span-6" style={{
          background: 'linear-gradient(135deg, rgba(0,217,149,0.08), rgba(54,245,160,0.04))',
          border: '1px solid rgba(0,217,149,0.18)',
        }}>
          <div className="card-header">
            <span className="card-title">
              <Brain size={13} className="card-title-icon" />
              Smart Capture
            </span>
            <span style={{ fontSize: 11, color: 'var(--text-muted)', background: 'rgba(0,0,0,0.2)', padding: '2px 8px', borderRadius: 12, border: '1px solid var(--border)' }}>
              AI-Powered
            </span>
          </div>

          <div style={{ textAlign: 'center', padding: '8px 0 4px' }}>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16, lineHeight: 1.6 }}>
              Capture session notes, speaker summaries, or paste a transcript to generate AI-powered takeaways and action items.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                className="btn btn-solid"
                onClick={() => navigate('/notes/new')}
                id="smart-capture-btn"
              >
                <Brain size={14} />
                Open Smart Capture
              </button>
              <button
                className="btn btn-outline"
                onClick={() => navigate('/notes')}
              >
                <BookOpen size={14} />
                View Notes
              </button>
            </div>
          </div>

          {recentNotes.length > 0 && (
            <>
              <div className="divider" />
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: 600 }}>
                Recent Captures
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {recentNotes.slice(0, 2).map((n) => {
                  const evt = events.find((e) => e.id === n.eventId);
                  return (
                    <div
                      key={n.id}
                      className="list-item"
                      onClick={() => navigate(`/notes/${n.id}`)}
                      style={{ padding: '8px 10px' }}
                    >
                      <Lightbulb size={12} color="var(--emerald)" style={{ flexShrink: 0, marginTop: 2 }} />
                      <div className="list-item-content">
                        <div className="list-item-title" style={{ fontSize: 13 }}>{n.title}</div>
                        <div className="list-item-meta">{evt?.name} · {n.takeaways.length} takeaway{n.takeaways.length !== 1 ? 's' : ''}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Card C: Recent Notes */}
        <div className="card col-span-6">
          <div className="card-header">
            <span className="card-title">
              <BookOpen size={13} className="card-title-icon" />
              Recent Learnings
            </span>
            <button className="card-action" onClick={() => navigate('/notes')}>
              All Notes <ArrowRight size={11} style={{ display: 'inline', verticalAlign: 'middle' }} />
            </button>
          </div>

          {recentNotes.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-muted)', fontSize: 13 }}>
              <BookOpen size={24} style={{ opacity: 0.3, margin: '0 auto 8px', display: 'block' }} />
              No notes yet. Capture your first learning!
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {recentNotes.map((n) => {
                const evt = events.find((e) => e.id === n.eventId);
                return (
                  <div
                    key={n.id}
                    className="list-item"
                    onClick={() => navigate(`/notes/${n.id}`)}
                  >
                    <div style={{
                      width: 28, height: 28, borderRadius: 7,
                      background: 'rgba(0,217,149,0.08)', border: '1px solid rgba(0,217,149,0.12)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>
                      <BookOpen size={12} color="var(--emerald)" />
                    </div>
                    <div className="list-item-content">
                      <div className="list-item-title">{n.title}</div>
                      <div className="list-item-meta">
                        {evt?.name} · {n.takeaways.length} takeaway{n.takeaways.length !== 1 ? 's' : ''} · {formatDate(n.createdAt)}
                      </div>
                    </div>
                    <ArrowRight size={13} color="var(--text-muted)" />
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Card F: Follow-up Tracker */}
        <div className="card col-span-6">
          <div className="card-header">
            <span className="card-title">
              <Users size={13} className="card-title-icon" />
              Follow-up Tracker
            </span>
            <button className="card-action" onClick={() => navigate('/connections')}>
              All <ArrowRight size={11} style={{ display: 'inline', verticalAlign: 'middle' }} />
            </button>
          </div>

          {pendingFollowUps.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-muted)', fontSize: 13 }}>
              <Users size={24} style={{ opacity: 0.3, margin: '0 auto 8px', display: 'block' }} />
              No pending follow-ups — nice work!
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {pendingFollowUps.map((c) => {
                const overdue = c.followUpDate && isOverdue(c.followUpDate);
                const evt = events.find((e) => e.id === c.eventId);
                return (
                  <div
                    key={c.id}
                    className="list-item"
                    onClick={() => navigate('/connections')}
                  >
                    <div
                      className="connection-avatar"
                      style={{ width: 32, height: 32, background: getAvatarGradient(c.avatarColor), fontSize: 12 }}
                    >
                      {getInitials(c.name)}
                    </div>
                    <div className="list-item-content">
                      <div className="list-item-title">{c.name}</div>
                      <div className="list-item-meta">
                        {c.role}{evt ? ` · ${evt.name}` : ''}
                      </div>
                    </div>
                    {c.followUpDate && (
                      <span style={{
                        fontSize: 11, padding: '2px 7px', borderRadius: 12, fontWeight: 500, flexShrink: 0,
                        background: overdue ? 'rgba(255,99,99,0.1)' : 'rgba(255,186,73,0.1)',
                        color: overdue ? '#FF6363' : '#FFBA49',
                        border: `1px solid ${overdue ? 'rgba(255,99,99,0.2)' : 'rgba(255,186,73,0.2)'}`,
                      }}>
                        {overdue ? 'Overdue' : formatDateRelative(c.followUpDate)}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Trending / Progress snapshot */}
        <div className="card col-span-6">
          <div className="card-header">
            <span className="card-title">
              <TrendingUp size={13} className="card-title-icon" />
              Progress by Event
            </span>
          </div>
          {events.filter(e => e.status === 'completed').length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-muted)', fontSize: 13 }}>
              <TrendingUp size={24} style={{ opacity: 0.3, margin: '0 auto 8px', display: 'block' }} />
              Complete events to track your progress here.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {events.filter(e => e.status === 'completed').slice(0, 4).map((evt) => {
                const evtActions = actions.filter((a) => a.eventId === evt.id);
                const done = evtActions.filter((a) => a.status === 'completed').length;
                const pct = evtActions.length > 0 ? Math.round((done / evtActions.length) * 100) : 0;
                const takeawayCount = notes.filter(n => n.eventId === evt.id).reduce((sum, n) => sum + n.takeaways.length, 0);
                return (
                  <div key={evt.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/events/${evt.id}`)}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                      <span style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500 }}>{evt.name}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{takeawayCount} learnings</span>
                        <span style={{ fontSize: 12, fontWeight: 600, color: pct === 100 ? 'var(--emerald)' : 'var(--text-secondary)' }}>
                          {pct}%
                        </span>
                      </div>
                    </div>
                    <div className="progress-bar-track">
                      <div className="progress-bar-fill" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Pending high-priority actions */}
        <div className="card col-span-12">
          <div className="card-header">
            <span className="card-title">
              <Clock size={13} className="card-title-icon" />
              Due Soon
            </span>
            <button className="card-action" onClick={() => navigate('/actions')}>
              Action Board <ArrowRight size={11} style={{ display: 'inline', verticalAlign: 'middle' }} />
            </button>
          </div>
          {actions.filter(a => a.status !== 'completed').length === 0 ? (
            <div style={{ color: 'var(--text-muted)', fontSize: 13, padding: '8px 0' }}>
              🎉 All actions are complete. Create new ones from your notes.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 240px), 1fr))', gap: 10 }}>
              {actions
                .filter((a) => a.status !== 'completed')
                .sort((a, b) => {
                  if (!a.dueDate) return 1; if (!b.dueDate) return -1;
                  return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
                })
                .slice(0, 6)
                .map((action) => {
                  const overdue = action.dueDate && isOverdue(action.dueDate);
                  const evt = events.find((e) => e.id === action.eventId);
                  return (
                    <div
                      key={action.id}
                      className="kanban-card"
                      style={{ cursor: 'pointer' }}
                      onClick={() => navigate('/actions')}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 6 }}>
                        <span className="kanban-card-title" style={{ margin: 0 }}>{action.title}</span>
                        <span className={`badge badge-${action.priority}`} style={{ flexShrink: 0 }}>
                          {action.priority}
                        </span>
                      </div>
                      {evt && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>{evt.name}</div>}
                      {action.dueDate && (
                        <div style={{ fontSize: 11, color: overdue ? '#FF6363' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Clock size={10} />
                          {overdue ? 'Overdue · ' : ''}{formatDateRelative(action.dueDate)}
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          )}
        </div>

      </div>
    </AppLayout>
  );
}
