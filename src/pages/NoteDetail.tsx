import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useStore } from '../store';
import {
  ArrowLeft, Edit2, Trash2, Plus, Lightbulb, ArrowRight,
  BookOpen, Minus, CheckCircle,
} from 'lucide-react';
import { formatDate } from '../utils';
import AppLayout from '../components/AppLayout';
import ConfirmDialog from '../components/ConfirmDialog';
import EmptyState from '../components/EmptyState';
import { useToast } from '../ToastContext';
import type { TakeawayCategory, Takeaway } from '../types';

const CATEGORY_OPTIONS: { value: TakeawayCategory; label: string; color: string }[] = [
  { value: 'learning', label: 'Learning', color: 'var(--emerald)' },
  { value: 'concept', label: 'Concept', color: '#64A0FF' },
  { value: 'idea', label: 'Idea', color: '#FFBA49' },
  { value: 'quote', label: 'Quote', color: '#EC4899' },
  { value: 'action', label: 'Action Item', color: '#FF6363' },
];

export default function NoteDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { notes, events, updateNote, deleteNote, deleteTakeaway, addTakeaway, addAction } = useStore();
  const { showToast } = useToast();

  const note = notes.find((n) => n.id === id);
  const [showDeleteNote, setShowDeleteNote] = useState(false);
  const [deleteTwId, setDeleteTwId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(note?.title || '');
  const [editContent, setEditContent] = useState(note?.content || '');
  const [editSummary, setEditSummary] = useState(note?.summary || '');
  const [editSpeaker, setEditSpeaker] = useState(note?.speakerName || '');
  const [addingTw, setAddingTw] = useState(false);
  const [newTw, setNewTw] = useState({ title: '', content: '', category: 'learning' as TakeawayCategory });
  const [convertedIds, setConvertedIds] = useState<Set<string>>(new Set());

  if (!note) {
    return (
      <AppLayout>
        <EmptyState
          icon={<BookOpen size={24} />}
          title="Note not found"
          description="This note may have been deleted."
          action={<button className="btn btn-solid" onClick={() => navigate('/notes')}><ArrowLeft size={13} /> Back to Notes</button>}
        />
      </AppLayout>
    );
  }

  const evt = events.find((e) => e.id === note.eventId);

  function saveEdits() {
    if (!note) return;
    updateNote(note.id, {
      title: editTitle,
      content: editContent,
      summary: editSummary,
      speakerName: editSpeaker,
    });
    setIsEditing(false);
    showToast('Note updated.', 'success');
  }

  function handleDeleteNote() {
    if (!note) return;
    deleteNote(note.id);
    showToast('Note deleted.', 'success');
    navigate('/notes');
  }

  function handleDeleteTakeaway() {
    if (!note || !deleteTwId) return;
    deleteTakeaway(note.id, deleteTwId);
    showToast('Takeaway removed.', 'success');
    setDeleteTwId(null);
  }

  function handleAddTakeaway() {
    if (!note) return;
    if (!newTw.title.trim()) { showToast('Please enter a title.', 'error'); return; }
    addTakeaway(note.id, { ...newTw, eventId: note.eventId, convertedToAction: false });
    setNewTw({ title: '', content: '', category: 'learning' });
    setAddingTw(false);
    showToast('Takeaway added.', 'success');
  }

  function convertToAction(tw: Takeaway) {
    if (!note) return;
    addAction({
      title: tw.title,
      description: tw.content,
      eventId: note.eventId,
      takeawayId: tw.id,
      priority: 'medium',
      status: 'pending',
    });
    setConvertedIds((s) => new Set([...s, tw.id]));
    showToast('Action created from takeaway!', 'success');
  }

  const getCatColor = (c: TakeawayCategory) => CATEGORY_OPTIONS.find((x) => x.value === c)?.color || 'var(--emerald)';

  return (
    <AppLayout>
      <button className="btn btn-ghost btn-sm" onClick={() => navigate('/notes')} style={{ marginBottom: 12, padding: '4px 6px' }}>
        <ArrowLeft size={14} /> Notes
      </button>

      {/* Note Header */}
      <div className="card" style={{ marginBottom: 14 }}>
        {isEditing ? (
          <>
            <div className="form-group">
              <label className="form-label">Title</label>
              <input className="form-input" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Speaker / Session</label>
              <input className="form-input" value={editSpeaker} onChange={(e) => setEditSpeaker(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Summary</label>
              <textarea className="form-textarea" value={editSummary} onChange={(e) => setEditSummary(e.target.value)} style={{ minHeight: 70 }} />
            </div>
            <div className="form-group">
              <label className="form-label">Full Notes / Content</label>
              <textarea className="form-textarea" value={editContent} onChange={(e) => setEditContent(e.target.value)} style={{ minHeight: 120 }} />
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button className="btn btn-outline btn-sm" onClick={() => setIsEditing(false)}>Cancel</button>
              <button className="btn btn-solid btn-sm" onClick={saveEdits}>Save Changes</button>
            </div>
          </>
        ) : (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8, flexWrap: 'wrap', gap: 10 }}>
              <div style={{ minWidth: 0, flex: '1 1 200px' }}>
                {evt && (
                  <div style={{ fontSize: 11.5, color: 'var(--emerald)', fontWeight: 500, marginBottom: 4 }}>
                    {evt.name}
                  </div>
                )}
                <h1 style={{ fontFamily: 'Outfit,sans-serif', fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4, overflowWrap: 'anywhere' }}>
                  {note.title}
                </h1>
                {note.speakerName && (
                  <div style={{ fontSize: 12.5, color: 'var(--text-muted)', fontStyle: 'italic' }}>by {note.speakerName}</div>
                )}
              </div>
              <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                <button className="btn btn-outline btn-sm" onClick={() => setIsEditing(true)}>
                  <Edit2 size={12} /> Edit
                </button>
                <button className="btn btn-danger btn-sm" onClick={() => setShowDeleteNote(true)}>
                  <Trash2 size={12} />
                </button>
              </div>
            </div>

            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 12 }}>
              {formatDate(note.createdAt)} · {note.sourceType}
            </div>

            {note.summary && (
              <div style={{ background: 'rgba(0,217,149,0.06)', border: '1px solid rgba(0,217,149,0.15)', borderRadius: 10, padding: '10px 14px', marginBottom: 10 }}>
                <div style={{ fontSize: 10.5, color: 'var(--emerald)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 4 }}>Summary</div>
                <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', lineHeight: 1.7, overflowWrap: 'anywhere' }}>{note.summary}</p>
              </div>
            )}

            {note.content && (
              <div>
                <div style={{ fontSize: 10.5, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 6 }}>Full Notes</div>
                <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', lineHeight: 1.8, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{note.content}</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Takeaways */}
      <div className="card">
        <div className="card-header">
          <span className="card-title"><Lightbulb size={13} className="card-title-icon" />Takeaways ({note.takeaways.length})</span>
          <button className="btn btn-outline btn-sm" onClick={() => setAddingTw(true)}>
            <Plus size={12} /> Add
          </button>
        </div>

        {addingTw && (
          <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 10, padding: 12, border: '1px solid var(--border)', marginBottom: 12 }}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
              <input
                className="form-input"
                placeholder="Takeaway title…"
                value={newTw.title}
                onChange={(e) => setNewTw({ ...newTw, title: e.target.value })}
                style={{ flex: '1 1 140px', minWidth: 0 }}
              />
              <select
                className="form-select"
                value={newTw.category}
                onChange={(e) => setNewTw({ ...newTw, category: e.target.value as TakeawayCategory })}
                style={{ width: 110, flex: '0 0 auto' }}
              >
                {CATEGORY_OPTIONS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <textarea
              className="form-textarea"
              style={{ minHeight: 56 }}
              placeholder="Details…"
              value={newTw.content}
              onChange={(e) => setNewTw({ ...newTw, content: e.target.value })}
            />
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
              <button className="btn btn-outline btn-sm" onClick={() => setAddingTw(false)}>Cancel</button>
              <button className="btn btn-solid btn-sm" onClick={handleAddTakeaway}>Save Takeaway</button>
            </div>
          </div>
        )}

        {note.takeaways.length === 0 && !addingTw ? (
          <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)', fontSize: 13 }}>
            <Lightbulb size={22} style={{ opacity: 0.3, margin: '0 auto 8px', display: 'block' }} />
            No takeaways yet. Add insights from this session.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {note.takeaways.map((tw) => {
              const converted = convertedIds.has(tw.id) || tw.convertedToAction;
              return (
                <div key={tw.id} style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 10, padding: 12, border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 6, alignItems: 'flex-start' }}>
                    <span style={{
                      fontSize: 10.5, padding: '1px 7px', borderRadius: 10, flexShrink: 0, fontWeight: 500, marginTop: 2,
                      background: `${getCatColor(tw.category)}12`,
                      color: getCatColor(tw.category),
                      border: `1px solid ${getCatColor(tw.category)}30`,
                    }}>
                      {CATEGORY_OPTIONS.find((c) => c.value === tw.category)?.label}
                    </span>
                    <div style={{ flex: 1, fontSize: 13.5, fontWeight: 500, color: 'var(--text-primary)' }}>{tw.title}</div>
                    <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                      {!converted && (
                        <button
                          className="btn btn-ghost btn-sm"
                          style={{ fontSize: 11, color: 'var(--emerald)' }}
                          onClick={() => convertToAction(tw)}
                          title="Convert to action"
                        >
                          <ArrowRight size={11} />
                        </button>
                      )}
                      {converted && <CheckCircle size={14} color="var(--emerald)" />}
                      <button className="btn btn-ghost btn-sm" style={{ color: '#FF6363' }} onClick={() => setDeleteTwId(tw.id)}>
                        <Minus size={11} />
                      </button>
                    </div>
                  </div>
                  {tw.content && (
                    <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{tw.content}</p>
                  )}
                  {converted && (
                    <div style={{ fontSize: 11, color: 'var(--emerald)', marginTop: 4 }}>✓ Converted to action</div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showDeleteNote && (
        <ConfirmDialog
          title="Delete Note"
          message="This will permanently delete this note and all its takeaways."
          onConfirm={handleDeleteNote}
          onCancel={() => setShowDeleteNote(false)}
        />
      )}
      {deleteTwId && (
        <ConfirmDialog
          title="Remove Takeaway"
          message="Remove this takeaway from the note?"
          confirmLabel="Remove"
          onConfirm={handleDeleteTakeaway}
          onCancel={() => setDeleteTwId(null)}
        />
      )}
    </AppLayout>
  );
}
