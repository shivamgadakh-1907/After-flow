import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import {
  Search, Plus, BookOpen, Lightbulb,
  Trash2, Edit2, ArrowRight,
} from 'lucide-react';
import { formatDate, truncate } from '../utils';
import AppLayout from '../components/AppLayout';
import EmptyState from '../components/EmptyState';
import ConfirmDialog from '../components/ConfirmDialog';
import { useToast } from '../ToastContext';

const CATEGORY_COLORS: Record<string, string> = {
  learning: 'var(--emerald)',
  concept: '#64A0FF',
  idea: '#FFBA49',
  quote: '#EC4899',
  action: '#FF6363',
};

export default function NotesPage() {
  const navigate = useNavigate();
  const { notes, events, deleteNote } = useStore();
  const { showToast } = useToast();

  const [search, setSearch] = useState('');
  const [filterEvent, setFilterEvent] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filtered = notes.filter((n) => {
    const q = search.toLowerCase();
    const matchSearch = !q || n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q);
    const matchEvent = !filterEvent || n.eventId === filterEvent;
    return matchSearch && matchEvent;
  }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  function handleDelete() {
    if (!deleteId) return;
    deleteNote(deleteId);
    showToast('Note deleted.', 'success');
    setDeleteId(null);
  }

  return (
    <AppLayout>
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ minWidth: 0, flex: '1 1 200px' }}>
            <h1 className="page-title">Smart Notes</h1>
            <p className="page-subtitle">Session notes, speaker summaries, and captured takeaways</p>
          </div>
          <button className="btn btn-solid" onClick={() => navigate('/notes/new')} id="notes-new-btn" style={{ flexShrink: 0 }}>
            <Plus size={14} /> Capture Note
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="filter-row">
        <div className="search-bar" style={{ flex: '1 1 220px', minWidth: 0 }}>
          <Search size={14} className="search-icon" />
          <input
            id="notes-search"
            type="text"
            placeholder="Search notes…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="form-select"
          style={{ flex: '1 1 180px', minWidth: 140, width: 'auto' }}
          value={filterEvent}
          onChange={(e) => setFilterEvent(e.target.value)}
          id="notes-event-filter"
        >
          <option value="">All Events</option>
          {events.map((e) => (
            <option key={e.id} value={e.id}>{e.name}</option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<BookOpen size={24} />}
          title={search || filterEvent ? 'No notes match your filters' : 'No notes yet'}
          description={search || filterEvent ? 'Try adjusting your search.' : 'Capture speaker notes, session summaries, or paste transcripts.'}
          action={!search && !filterEvent ? (
            <button className="btn btn-solid" onClick={() => navigate('/notes/new')}>
              <Plus size={13} /> Capture First Note
            </button>
          ) : undefined}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.map((note) => {
            const evt = events.find((e) => e.id === note.eventId);
            return (
              <div key={note.id} className="card" style={{ cursor: 'pointer' }} onClick={() => navigate(`/notes/${note.id}`)}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {/* Source + Event */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                      <span style={{
                        fontSize: 10.5, padding: '1px 7px', borderRadius: 10, fontWeight: 500, flexShrink: 0,
                        background: 'rgba(0,217,149,0.08)', color: 'var(--emerald)', border: '1px solid rgba(0,217,149,0.15)',
                      }}>
                        {note.sourceType === 'ai-summary' ? 'AI Summary' : note.sourceType === 'manual' ? 'Manual' : note.sourceType}
                      </span>
                      {evt && (
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                          {evt.name}
                        </span>
                      )}
                    </div>
                    <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
                      {note.title}
                    </h3>
                    {note.speakerName && (
                      <span style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>by {note.speakerName}</span>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0, marginLeft: 12 }} onClick={(e) => e.stopPropagation()}>
                    <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/notes/${note.id}`)}>
                      <Edit2 size={12} />
                    </button>
                    <button className="btn btn-ghost btn-sm" style={{ color: '#FF6363' }} onClick={() => setDeleteId(note.id)}>
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>

                {note.summary && (
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 10 }}>
                    {truncate(note.summary, 180)}
                  </p>
                )}

                {!note.summary && note.content && (
                  <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 10 }}>
                    {truncate(note.content, 160)}
                  </p>
                )}

                {/* Takeaways preview */}
                {note.takeaways.length > 0 && (
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
                    {note.takeaways.slice(0, 4).map((tw) => (
                      <span
                        key={tw.id}
                        style={{
                          fontSize: 11, padding: '2px 8px', borderRadius: 20,
                          background: `${CATEGORY_COLORS[tw.category]}12`,
                          color: CATEGORY_COLORS[tw.category],
                          border: `1px solid ${CATEGORY_COLORS[tw.category]}30`,
                          fontWeight: 500, display: 'flex', alignItems: 'center', gap: 4,
                        }}
                      >
                        <Lightbulb size={9} />
                        {truncate(tw.title, 28)}
                      </span>
                    ))}
                    {note.takeaways.length > 4 && (
                      <span style={{ fontSize: 11, color: 'var(--text-muted)', padding: '2px 8px' }}>
                        +{note.takeaways.length - 4} more
                      </span>
                    )}
                  </div>
                )}

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>
                    {formatDate(note.createdAt)} · {note.takeaways.length} takeaway{note.takeaways.length !== 1 ? 's' : ''}
                  </span>
                  <ArrowRight size={13} color="var(--text-muted)" />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {deleteId && (
        <ConfirmDialog
          title="Delete Note"
          message="This will permanently delete this note and all its takeaways."
          onConfirm={handleDelete}
          onCancel={() => setDeleteId(null)}
        />
      )}
    </AppLayout>
  );
}
