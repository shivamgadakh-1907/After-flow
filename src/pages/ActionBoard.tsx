import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useStore } from '../store';
import {
  LayoutList, LayoutGrid, Search, Plus,
  CheckCircle, Circle, Clock, Loader, Trash2, Edit2, Calendar,
} from 'lucide-react';
import { formatDateRelative, isOverdue } from '../utils';
import AppLayout from '../components/AppLayout';
import EmptyState from '../components/EmptyState';
import ConfirmDialog from '../components/ConfirmDialog';
import ActionFormModal from '../components/ActionFormModal';
import { useToast } from '../ToastContext';
import type { ActionStatus, Priority } from '../types';

const PRIORITIES: Priority[] = ['high', 'medium', 'low'];
const STATUSES: ActionStatus[] = ['pending', 'inprogress', 'completed'];

const STATUS_COLORS: Record<ActionStatus, string> = {
  pending: '#FFBA49',
  inprogress: '#64A0FF',
  completed: 'var(--emerald)',
};

const STATUS_ICONS: Record<ActionStatus, typeof Circle> = {
  pending: Circle,
  inprogress: Loader,
  completed: CheckCircle,
};

export default function ActionBoard() {
  const [searchParams] = useSearchParams();
  const { actions, events, deleteAction, updateActionStatus } = useStore();
  const { showToast } = useToast();

  const [view, setView] = useState<'list' | 'kanban'>('kanban');
  const [search, setSearch] = useState('');
  const [filterEvent, setFilterEvent] = useState('');
  const [filterPriority, setFilterPriority] = useState<Priority | 'all'>('all');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editAction, setEditAction] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(searchParams.has('new') || false);

  const [mobileKanbanTab, setMobileKanbanTab] = useState<'all' | ActionStatus>('all');

  const filtered = actions.filter((a) => {
    const q = search.toLowerCase();
    const matchSearch = !q || a.title.toLowerCase().includes(q) || a.description?.toLowerCase().includes(q);
    const matchEvent = !filterEvent || a.eventId === filterEvent;
    const matchPriority = filterPriority === 'all' || a.priority === filterPriority;
    return matchSearch && matchEvent && matchPriority;
  });

  const byStatus = (status: ActionStatus) =>
    filtered.filter((a) => a.status === status).sort((a, b) => {
      if (!a.dueDate) return 1; if (!b.dueDate) return -1;
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    });

  function handleDelete() {
    if (!deleteId) return;
    deleteAction(deleteId);
    showToast('Action deleted.', 'success');
    setDeleteId(null);
  }

  function cycleStatus(id: string, current: ActionStatus) {
    const next: ActionStatus = current === 'pending' ? 'inprogress' : current === 'inprogress' ? 'completed' : 'pending';
    updateActionStatus(id, next);
  }

  function ActionCard({ action }: { action: typeof actions[0] }) {
    const evt = events.find((e) => e.id === action.eventId);
    const overdue = action.dueDate && action.status !== 'completed' && isOverdue(action.dueDate);
    const StatusIcon = STATUS_ICONS[action.status];

    return (
      <div className="kanban-card" style={{ position: 'relative' }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 8 }}>
          <button
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', color: STATUS_COLORS[action.status], flexShrink: 0, minHeight: 28, minWidth: 28, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            onClick={() => cycleStatus(action.id, action.status)}
            aria-label="Cycle status"
          >
            <StatusIcon size={16} className={action.status === 'inprogress' ? 'spin' : ''} />
          </button>
          <div className="kanban-card-title" style={{ flex: 1, margin: 0, textDecoration: action.status === 'completed' ? 'line-through' : 'none', color: action.status === 'completed' ? 'var(--text-muted)' : undefined, overflowWrap: 'anywhere' }}>
            {action.title}
          </div>
        </div>

        {action.description && (
          <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: 8, overflowWrap: 'anywhere' }}>
            {action.description.slice(0, 80)}{action.description.length > 80 ? '…' : ''}
          </p>
        )}

        {evt && (
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6, overflowWrap: 'anywhere' }}>{evt.name}</div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <span className={`badge badge-${action.priority}`}>{action.priority}</span>
          {action.dueDate && (
            <span style={{ fontSize: 11, color: overdue ? '#FF6363' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 3 }}>
              <Calendar size={10} />
              {formatDateRelative(action.dueDate)}
            </span>
          )}
        </div>

        <div style={{ display: 'flex', gap: 4, marginTop: 8, justifyContent: 'flex-end' }}>
          <button className="btn btn-ghost btn-sm" onClick={() => setEditAction(action.id)} aria-label="Edit action">
            <Edit2 size={12} />
          </button>
          <button className="btn btn-ghost btn-sm" style={{ color: '#FF6363' }} onClick={() => setDeleteId(action.id)} aria-label="Delete action">
            <Trash2 size={12} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <AppLayout>
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10 }}>
          <div style={{ minWidth: 0, flex: '1 1 200px' }}>
            <h1 className="page-title">Action Board</h1>
            <p className="page-subtitle">Track and manage post-event action items</p>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <div className="view-toggle">
              <button className={`view-btn ${view === 'list' ? 'active' : ''}`} onClick={() => setView('list')} aria-label="List view" style={{ minWidth: 36, minHeight: 36, justifyContent: 'center' }}>
                <LayoutList size={16} />
              </button>
              <button className={`view-btn ${view === 'kanban' ? 'active' : ''}`} onClick={() => setView('kanban')} aria-label="Kanban view" style={{ minWidth: 36, minHeight: 36, justifyContent: 'center' }}>
                <LayoutGrid size={16} />
              </button>
            </div>
            <button className="btn btn-solid" onClick={() => setShowForm(true)} id="action-new-btn">
              <Plus size={14} /> Add Action
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="filter-row">
        <div className="search-bar" style={{ flex: '1 1 200px', minWidth: 0 }}>
          <Search size={14} className="search-icon" />
          <input
            id="actions-search"
            type="text"
            placeholder="Search actions…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div style={{ display: 'flex', gap: 8, flex: '1 1 260px' }}>
          <select
            className="form-select"
            style={{ flex: 1, minWidth: 120 }}
            value={filterEvent}
            onChange={(e) => setFilterEvent(e.target.value)}
            id="actions-event-filter"
          >
            <option value="">All Events</option>
            {events.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
          </select>
          <select
            className="form-select"
            style={{ flex: 1, minWidth: 110 }}
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value as Priority | 'all')}
            id="actions-priority-filter"
          >
            <option value="all">All Priorities</option>
            {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
      </div>

      {/* Stats */}
      <div className="stat-row" style={{ marginBottom: 16 }}>
        {[
          { label: 'Total', value: filtered.length, color: 'var(--text-secondary)' },
          { label: 'Pending', value: byStatus('pending').length, color: '#FFBA49' },
          { label: 'In Progress', value: byStatus('inprogress').length, color: '#64A0FF' },
          { label: 'Completed', value: byStatus('completed').length, color: 'var(--emerald)' },
        ].map(({ label, value, color }) => (
          <div key={label} className="stat-item" style={{ textAlign: 'center' }}>
            <div className="stat-value" style={{ color }}>{value}</div>
            <div className="stat-label">{label}</div>
          </div>
        ))}
      </div>

      {/* Mobile Kanban Tab Selector (visible on mobile screens when in Kanban view) */}
      {view === 'kanban' && filtered.length > 0 && (
        <div className="mobile-kanban-tabs" style={{ display: 'flex', gap: 4, marginBottom: 14, overflowX: 'auto', WebkitOverflowScrolling: 'touch', paddingBottom: 4 }}>
          {[
            { id: 'all', label: `All Stacked (${filtered.length})` },
            { id: 'pending', label: `Pending (${byStatus('pending').length})` },
            { id: 'inprogress', label: `In Progress (${byStatus('inprogress').length})` },
            { id: 'completed', label: `Done (${byStatus('completed').length})` },
          ].map((t) => (
            <button
              key={t.id}
              className={`tab ${mobileKanbanTab === t.id ? 'active' : ''}`}
              onClick={() => setMobileKanbanTab(t.id as any)}
              style={{ whiteSpace: 'nowrap', fontSize: 12, padding: '6px 10px', minHeight: 34 }}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={<CheckCircle size={24} />}
          title={search || filterEvent ? 'No actions match your filters' : 'No actions yet'}
          description="Create action items from your event learnings and takeaways."
          action={!search && !filterEvent ? (
            <button className="btn btn-solid" onClick={() => setShowForm(true)}>
              <Plus size={13} /> Create First Action
            </button>
          ) : undefined}
        />
      ) : view === 'kanban' ? (
        <div className="kanban-board mobile-stacked">
          {STATUSES
            .filter((status) => mobileKanbanTab === 'all' || mobileKanbanTab === status)
            .map((status) => {
              const cols = byStatus(status);
              const colColor = STATUS_COLORS[status];
              const ColIcon = STATUS_ICONS[status];
              return (
                <div key={status} className="kanban-column">
                  <div className="kanban-column-header">
                    <span className="kanban-column-title" style={{ color: colColor }}>
                      <ColIcon size={13} className={status === 'inprogress' ? 'spin' : ''} />
                      {status === 'inprogress' ? 'In Progress' : status.charAt(0).toUpperCase() + status.slice(1)}
                    </span>
                    <span className="kanban-count">{cols.length}</span>
                  </div>
                  {cols.map((a) => <ActionCard key={a.id} action={a} />)}
                  <button
                    className="btn btn-ghost btn-sm"
                    style={{ justifyContent: 'center', width: '100%', marginTop: 4, minHeight: 36 }}
                    onClick={() => setShowForm(true)}
                  >
                    <Plus size={13} /> Add
                  </button>
                </div>
              );
            })}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtered.map((action) => {
            const evt = events.find((e) => e.id === action.eventId);
            const overdue = action.dueDate && action.status !== 'completed' && isOverdue(action.dueDate);
            return (
              <div
                key={action.id}
                className="card"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  flexWrap: 'wrap',
                  padding: '12px 14px',
                }}
              >
                <button
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: STATUS_COLORS[action.status], flexShrink: 0, minWidth: 28, minHeight: 28, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  onClick={() => cycleStatus(action.id, action.status)}
                  aria-label="Toggle status"
                >
                  <CheckCircle size={18} />
                </button>
                <div style={{ flex: '1 1 180px', minWidth: 0 }}>
                  <div style={{
                    fontSize: 13.5, fontWeight: 500,
                    color: action.status === 'completed' ? 'var(--text-muted)' : 'var(--text-primary)',
                    textDecoration: action.status === 'completed' ? 'line-through' : 'none',
                    overflowWrap: 'anywhere',
                  }}>
                    {action.title}
                  </div>
                  <div style={{ display: 'flex', gap: 8, fontSize: 11.5, color: 'var(--text-muted)', marginTop: 3, flexWrap: 'wrap' }}>
                    {evt && <span style={{ overflowWrap: 'anywhere' }}>{evt.name}</span>}
                    {action.dueDate && (
                      <span style={{ color: overdue ? '#FF6363' : undefined, display: 'flex', alignItems: 'center', gap: 3 }}>
                        <Clock size={10} />
                        {overdue ? 'Overdue · ' : ''}{formatDateRelative(action.dueDate)}
                      </span>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginLeft: 'auto' }}>
                  <span className={`badge badge-${action.priority}`}>{action.priority}</span>
                  <span className={`badge badge-${action.status}`}>{action.status === 'inprogress' ? 'In Progress' : action.status}</span>
                  <div style={{ display: 'flex', gap: 2 }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => setEditAction(action.id)} aria-label="Edit action"><Edit2 size={12} /></button>
                    <button className="btn btn-ghost btn-sm" style={{ color: '#FF6363' }} onClick={() => setDeleteId(action.id)} aria-label="Delete action"><Trash2 size={12} /></button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {(showForm || editAction) && (
        <ActionFormModal
          actionId={editAction || undefined}
          onClose={() => { setShowForm(false); setEditAction(null); }}
        />
      )}
      {deleteId && (
        <ConfirmDialog
          title="Delete Action"
          message="Remove this action item permanently?"
          onConfirm={handleDelete}
          onCancel={() => setDeleteId(null)}
        />
      )}
    </AppLayout>
  );
}
