import { useStore } from '../store';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import { TrendingUp, Calendar, BookOpen, CheckSquare, Users, Target, ArrowRight, BarChart3 } from 'lucide-react';
import AppLayout from '../components/AppLayout';

const COLORS = ['#00D995', '#36F5A0', '#64A0FF', '#FFBA49'];

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'var(--bg-card-elevated)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 14px', fontSize: 12 }}>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 4 }}>{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color || 'var(--emerald)', fontWeight: 600 }}>{p.name}: {p.value}</p>
      ))}
    </div>
  );
}

export default function AnalyticsPage() {
  const navigate = useNavigate();
  const { events, notes, actions, connections } = useStore();

  const totalEvents = events.length;
  const completedEvents = events.filter((e) => e.status === 'completed').length;
  const totalTakeaways = notes.reduce((s, n) => s + n.takeaways.length, 0);
  const totalActions = actions.length;
  const completedActions = actions.filter((a) => a.status === 'completed').length;
  const actionCompRate = totalActions > 0 ? Math.round((completedActions / totalActions) * 100) : 0;
  const totalConnections = connections.length;
  const completedFollowUps = connections.filter((c) => c.followUpStatus === 'completed').length;
  const followUpRate = totalConnections > 0 ? Math.round((completedFollowUps / totalConnections) * 100) : 0;
  const pendingFollowUps = connections.filter((c) => c.followUpStatus === 'pending').length;
  const overdueFollowUps = connections.filter((c) => c.followUpStatus === 'overdue').length;

  // Per-event breakdown
  const eventData = events.filter((e) => e.status === 'completed').map((e) => {
    const evtNotes = notes.filter((n) => n.eventId === e.id);
    const evtTakeaways = evtNotes.reduce((s, n) => s + n.takeaways.length, 0);
    const evtActions = actions.filter((a) => a.eventId === e.id);
    const evtDone = evtActions.filter((a) => a.status === 'completed').length;
    return {
      name: e.name.length > 20 ? e.name.slice(0, 20) + '…' : e.name,
      takeaways: evtTakeaways,
      actions: evtActions.length,
      completed: evtDone,
    };
  });

  // Action status pie
  const actionPie = [
    { name: 'Completed', value: completedActions },
    { name: 'In Progress', value: actions.filter((a) => a.status === 'inprogress').length },
    { name: 'Pending', value: actions.filter((a) => a.status === 'pending').length },
  ].filter((x) => x.value > 0);

  // Follow-up pie
  const followUpPie = [
    { name: 'Done', value: completedFollowUps },
    { name: 'Pending', value: pendingFollowUps },
    { name: 'Overdue', value: overdueFollowUps },
  ].filter((x) => x.value > 0);

  const noData = totalEvents === 0;

  return (
    <AppLayout>
      <div className="page-header">
        <h1 className="page-title">Progress Analytics</h1>
        <p className="page-subtitle">Measure your post-event follow-through and outcomes</p>
      </div>

      {noData ? (
        <div className="card" style={{ textAlign: 'center', padding: '64px 24px' }}>
          <TrendingUp size={40} color="var(--text-muted)" style={{ opacity: 0.3, margin: '0 auto 16px', display: 'block' }} />
          <h3 style={{ fontSize: 16, color: 'var(--text-secondary)', marginBottom: 8 }}>No data yet</h3>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>
            Create events, capture learnings, and complete actions to see your progress here.
          </p>
          <button className="btn btn-solid" onClick={() => navigate('/events/new')}>
            Create your first event
          </button>
        </div>
      ) : (
        <>
          {/* Hero stats */}
          <div className="analytics-hero" style={{ marginBottom: 20, padding: '16px 14px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
              {[
                { label: 'Events Attended', value: completedEvents, total: totalEvents, icon: Calendar, color: 'var(--emerald)' },
                { label: 'Takeaways Captured', value: totalTakeaways, icon: BookOpen, color: '#64A0FF' },
                { label: 'Action Completion', value: `${actionCompRate}%`, icon: Target, color: '#FFBA49' },
                { label: 'Follow-up Rate', value: `${followUpRate}%`, icon: Users, color: '#EC4899' },
              ].map(({ label, value, total, icon: Icon, color }) => (
                <div key={label} style={{ textAlign: 'center', padding: '6px 4px' }}>
                  <div style={{
                    width: 38, height: 38, borderRadius: 12, margin: '0 auto 8px',
                    background: `${color}18`, border: `1px solid ${color}30`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Icon size={17} color={color} />
                  </div>
                  <div style={{ fontFamily: 'Outfit,sans-serif', fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1 }}>
                    {value}
                  </div>
                  {total !== undefined && (
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>of {total}</div>
                  )}
                  <div style={{ fontSize: 11.5, color: 'var(--text-secondary)', marginTop: 4 }}>{label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="dashboard-grid">
            {/* Event breakdown bar chart */}
            {eventData.length > 0 && (
              <div className="card col-span-8">
                <div className="card-header">
                  <span className="card-title"><BarChart3 size={13} className="card-title-icon" />Learnings & Actions by Event</span>
                </div>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={eventData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(160,255,205,0.06)" />
                    <XAxis dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="takeaways" name="Takeaways" fill="#00D995" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="completed" name="Actions Done" fill="#36F5A0" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Action pie */}
            {actionPie.length > 0 && (
              <div className="card col-span-4">
                <div className="card-header">
                  <span className="card-title"><CheckSquare size={13} className="card-title-icon" />Actions</span>
                </div>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={actionPie} cx="50%" cy="50%" innerRadius={44} outerRadius={66} paddingAngle={4} dataKey="value">
                      {actionPie.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: 11, color: 'var(--text-muted)' }} />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ textAlign: 'center', marginTop: 4 }}>
                  <span style={{ fontFamily: 'Outfit,sans-serif', fontSize: 24, fontWeight: 700, color: 'var(--emerald)' }}>{actionCompRate}%</span>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>completion rate</div>
                </div>
              </div>
            )}

            {/* Progress by event */}
            <div className="card col-span-8">
              <div className="card-header">
                <span className="card-title"><TrendingUp size={13} className="card-title-icon" />Action Progress by Event</span>
              </div>
              {eventData.length === 0 ? (
                <div style={{ color: 'var(--text-muted)', fontSize: 13, padding: '16px 0' }}>No completed events to show.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {eventData.map((ed) => {
                    const pct = ed.actions > 0 ? Math.round((ed.completed / ed.actions) * 100) : 0;
                    return (
                      <div key={ed.name}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                          <span style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500 }}>{ed.name}</span>
                          <div style={{ display: 'flex', gap: 12, fontSize: 12, color: 'var(--text-muted)' }}>
                            <span>{ed.takeaways} takeaways</span>
                            <span>{ed.completed}/{ed.actions} actions</span>
                            <span style={{ color: pct === 100 ? 'var(--emerald)' : 'var(--text-secondary)', fontWeight: 600 }}>{pct}%</span>
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

            {/* Follow-up pie */}
            {followUpPie.length > 0 && (
              <div className="card col-span-4">
                <div className="card-header">
                  <span className="card-title"><Users size={13} className="card-title-icon" />Follow-ups</span>
                </div>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={followUpPie} cx="50%" cy="50%" innerRadius={44} outerRadius={66} paddingAngle={4} dataKey="value">
                      <Cell fill="var(--emerald)" />
                      <Cell fill="#FFBA49" />
                      <Cell fill="#FF6363" />
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: 11, color: 'var(--text-muted)' }} />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ textAlign: 'center', marginTop: 4 }}>
                  <span style={{ fontFamily: 'Outfit,sans-serif', fontSize: 24, fontWeight: 700, color: '#EC4899' }}>{followUpRate}%</span>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>follow-up rate</div>
                </div>
              </div>
            )}

            {/* Quick nav */}
            <div className="card col-span-12">
              <div className="card-header">
                <span className="card-title"><Target size={13} className="card-title-icon" />Jump To</span>
              </div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {[
                  { label: 'View All Events', to: '/events' },
                  { label: 'Open Action Board', to: '/actions' },
                  { label: 'Review Notes', to: '/notes' },
                  { label: 'Check Connections', to: '/connections' },
                ].map(({ label, to }) => (
                  <button key={to} className="btn btn-outline" onClick={() => navigate(to)}>
                    {label} <ArrowRight size={12} />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </AppLayout>
  );
}
