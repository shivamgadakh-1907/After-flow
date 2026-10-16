import { useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useStore } from '../store';
import {
  Mic, MicOff, FileText, Brain, Plus, Minus,
  CheckCircle, ArrowRight, Lightbulb, Zap, BookOpen, Loader,
} from 'lucide-react';
import { useToast } from '../ToastContext';
import AppLayout from '../components/AppLayout';
import type { TakeawayCategory } from '../types';

type CaptureMode = 'idle' | 'recording' | 'processing' | 'done' | 'error';

const CATEGORY_OPTIONS: { value: TakeawayCategory; label: string; color: string }[] = [
  { value: 'learning', label: 'Learning', color: 'var(--emerald)' },
  { value: 'concept', label: 'Concept', color: '#64A0FF' },
  { value: 'idea', label: 'Idea', color: '#FFBA49' },
  { value: 'quote', label: 'Quote', color: '#EC4899' },
  { value: 'action', label: 'Action', color: '#FF6363' },
];

export default function SmartCapturePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedEvent = searchParams.get('event') || '';

  const { events, addNote, addAction } = useStore();
  const { showToast } = useToast();

  const [selectedEvent, setSelectedEvent] = useState(preselectedEvent);
  const [mode, setMode] = useState<CaptureMode>('idle');
  const [transcript, setTranscript] = useState('');
  const [speakerName, setSpeakerName] = useState('');
  const [noteTitle, setNoteTitle] = useState('');
  const [recordTime, setRecordTime] = useState(0);
  const recordTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  // Generated data
  const [summary, setSummary] = useState('');
  const [takeaways, setTakeaways] = useState<{ title: string; content: string; category: TakeawayCategory }[]>([]);
  const [savedNoteId, setSavedNoteId] = useState<string | null>(null);

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      recorder.start();
      setMode('recording');
      setRecordTime(0);
      recordTimerRef.current = setInterval(() => setRecordTime((t) => t + 1), 1000);
    } catch {
      showToast('Microphone access denied. Please paste a transcript instead.', 'error');
    }
  }

  function stopRecording() {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach((t) => t.stop());
    }
    if (recordTimerRef.current) clearInterval(recordTimerRef.current);
    setMode('idle');
    showToast('Recording stopped. Please paste your transcript below for processing.', 'info');
  }

  function formatTime(s: number) {
    const m = Math.floor(s / 60).toString().padStart(2, '0');
    const sec = (s % 60).toString().padStart(2, '0');
    return `${m}:${sec}`;
  }

  function processTranscript() {
    if (!transcript.trim()) {
      showToast('Please enter a transcript or notes to process.', 'error');
      return;
    }
    setMode('processing');

    setTimeout(() => {
      // Simulate AI processing from the transcript content
      const lines = transcript.trim().split('\n').filter(Boolean);
      const generatedSummary = `Summary of "${noteTitle || 'Session Notes'}": ${lines.slice(0, 2).join(' ')}`.slice(0, 200) + '…';

      const generatedTakeaways: typeof takeaways = [
        {
          title: 'Key Insight from Session',
          content: lines[0]?.slice(0, 100) || 'Captured from the session content.',
          category: 'learning',
        },
        {
          title: 'Concept to Explore Further',
          content: lines[1]?.slice(0, 100) || 'An idea worth investigating.',
          category: 'concept',
        },
        {
          title: 'Suggested Next Action',
          content: `Follow up on the discussion from ${speakerName || 'this session'}.`,
          category: 'action',
        },
      ];

      setSummary(generatedSummary);
      setTakeaways(generatedTakeaways);
      setMode('done');
    }, 2200);
  }

  function addTakeaway() {
    setTakeaways([...takeaways, { title: '', content: '', category: 'learning' }]);
  }

  function removeTakeaway(i: number) {
    setTakeaways(takeaways.filter((_, idx) => idx !== i));
  }

  function updateTakeaway(i: number, field: string, value: string) {
    setTakeaways(takeaways.map((t, idx) => idx === i ? { ...t, [field]: value } : t));
  }

  function saveNote() {
    if (!selectedEvent) { showToast('Please select an event.', 'error'); return; }
    if (!noteTitle.trim()) { showToast('Please enter a note title.', 'error'); return; }

    const noteId = addNote({
      eventId: selectedEvent,
      title: noteTitle,
      content: transcript,
      speakerName,
      sourceType: mode === 'done' ? 'ai-summary' : 'manual',
      summary,
    });

    // Add takeaways
    const store = useStore.getState();
    takeaways.forEach((tw) => {
      if (tw.title.trim()) {
        store.addTakeaway(noteId, {
          eventId: selectedEvent,
          title: tw.title,
          content: tw.content,
          category: tw.category,
          convertedToAction: false,
        });
      }
    });

    setSavedNoteId(noteId);
    showToast('Note saved successfully!', 'success');
  }

  function convertToAction(tw: typeof takeaways[0], idx: number) {
    if (!selectedEvent) return;
    addAction({
      title: tw.title,
      description: tw.content,
      eventId: selectedEvent,
      priority: 'medium',
      status: 'pending',
    });
    updateTakeaway(idx, 'convertedToAction', 'true');
    showToast('Action created from takeaway!', 'success');
  }

  return (
    <AppLayout>
      <div className="page-header">
        <h1 className="page-title">Smart Notes & Capture</h1>
        <p className="page-subtitle">Record, transcribe, or paste session content to generate AI-powered takeaways</p>
      </div>

      <div className="smart-capture-grid">
        {/* Left: Capture */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="card">
            <div className="card-header">
              <span className="card-title"><Brain size={13} className="card-title-icon" />Capture Setup</span>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="capture-event">Event *</label>
              <select
                id="capture-event"
                className="form-select"
                value={selectedEvent}
                onChange={(e) => setSelectedEvent(e.target.value)}
              >
                <option value="">Select an event…</option>
                {events.map((e) => (
                  <option key={e.id} value={e.id}>{e.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="note-title">Note Title *</label>
              <input
                id="note-title"
                className="form-input"
                placeholder="e.g. Keynote: Future of AI"
                value={noteTitle}
                onChange={(e) => setNoteTitle(e.target.value)}
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" htmlFor="speaker-name">Speaker / Session Name</label>
              <input
                id="speaker-name"
                className="form-input"
                placeholder="Optional — e.g. Dr. Priya Sharma"
                value={speakerName}
                onChange={(e) => setSpeakerName(e.target.value)}
              />
            </div>
          </div>

          {/* Recording section */}
          <div className="card">
            <div className="card-header">
              <span className="card-title"><Mic size={13} className="card-title-icon" />Audio Capture</span>
              <span style={{ fontSize: 11, color: 'var(--text-muted)', background: 'rgba(0,0,0,0.2)', padding: '2px 7px', borderRadius: 10, border: '1px solid var(--border)' }}>
                Browser API
              </span>
            </div>

            <div className={`capture-zone ${mode === 'recording' ? 'recording' : ''}`}>
              <button
                className={`record-btn ${mode === 'recording' ? 'active' : ''}`}
                onClick={mode === 'recording' ? stopRecording : startRecording}
                aria-label={mode === 'recording' ? 'Stop recording' : 'Start recording'}
                id="record-btn"
              >
                {mode === 'recording' ? <MicOff size={24} /> : <Mic size={24} />}
              </button>

              {mode === 'recording' ? (
                <>
                  <p style={{ fontSize: 14, fontWeight: 600, color: '#FF6363', marginBottom: 4 }}>
                    Recording… {formatTime(recordTime)}
                  </p>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    Click to stop. Paste transcript below after stopping.
                  </p>
                </>
              ) : (
                <>
                  <p style={{ fontSize: 13.5, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 4 }}>
                    Click to start audio recording
                  </p>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    Requires microphone permission · Audio is not uploaded
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Transcript */}
          <div className="card">
            <div className="card-header">
              <span className="card-title"><FileText size={13} className="card-title-icon" />Notes / Transcript</span>
            </div>
            <textarea
              id="transcript-input"
              className="form-textarea"
              style={{ minHeight: 160 }}
              placeholder="Paste your transcript, session notes, or type your notes here…&#10;&#10;The more detail you add, the better the AI-generated summary and takeaways will be."
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
            />
            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
              <button
                className="btn btn-solid"
                onClick={processTranscript}
                disabled={mode === 'processing'}
                id="process-btn"
                style={{ flex: 1, justifyContent: 'center' }}
              >
                {mode === 'processing' ? (
                  <><Loader size={13} className="spin" /> Processing…</>
                ) : (
                  <><Brain size={13} /> Generate Summary & Takeaways</>
                )}
              </button>
            </div>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8, textAlign: 'center' }}>
              ⚠️ Demo mode — outputs are derived from your input text. No external AI API is used.
            </p>
          </div>
        </div>

        {/* Right: Results */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {mode === 'idle' && !summary && (
            <div className="card" style={{ flex: 1 }}>
              <div className="empty-state" style={{ padding: '48px 0' }}>
                <div className="empty-state-icon">
                  <Lightbulb size={22} />
                </div>
                <h3>Ready to Capture</h3>
                <p>Add your session notes or transcript, then click "Generate Summary & Takeaways" to see results here.</p>
              </div>
            </div>
          )}

          {mode === 'processing' && (
            <div className="card" style={{ flex: 1 }}>
              <div className="empty-state" style={{ padding: '48px 0' }}>
                <div style={{ marginBottom: 16 }}>
                  <Loader size={36} color="var(--emerald)" className="spin" />
                </div>
                <h3>Processing your notes…</h3>
                <p>Generating summary and extracting key takeaways from your content.</p>
              </div>
            </div>
          )}

          {(mode === 'done' || summary) && (
            <>
              {/* Summary */}
              <div className="card">
                <div className="card-header">
                  <span className="card-title"><Zap size={13} className="card-title-icon" />Generated Summary</span>
                  <span style={{ fontSize: 10, padding: '1px 7px', borderRadius: 10, background: 'rgba(255,186,73,0.1)', color: '#FFBA49', border: '1px solid rgba(255,186,73,0.2)', fontWeight: 500 }}>
                    DEMO
                  </span>
                </div>
                <textarea
                  className="form-textarea"
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  style={{ minHeight: 70 }}
                />
              </div>

              {/* Takeaways */}
              <div className="card">
                <div className="card-header">
                  <span className="card-title"><Lightbulb size={13} className="card-title-icon" />Key Takeaways ({takeaways.length})</span>
                  <button className="btn btn-ghost btn-sm" onClick={addTakeaway}>
                    <Plus size={13} /> Add
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {takeaways.map((tw, i) => (
                    <div key={i} style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 10, padding: 12, border: '1px solid var(--border)' }}>
                      <div style={{ display: 'flex', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                        <input
                          className="form-input"
                          placeholder="Takeaway title…"
                          value={tw.title}
                          onChange={(e) => updateTakeaway(i, 'title', e.target.value)}
                          style={{ flex: '1 1 140px', fontSize: 13, minWidth: 0 }}
                        />
                        <div style={{ display: 'flex', gap: 6, flex: '0 0 auto' }}>
                          <select
                            className="form-select"
                            value={tw.category}
                            onChange={(e) => updateTakeaway(i, 'category', e.target.value)}
                            style={{ width: 100, fontSize: 12 }}
                          >
                            {CATEGORY_OPTIONS.map((c) => (
                              <option key={c.value} value={c.value}>{c.label}</option>
                            ))}
                          </select>
                          <button className="btn btn-ghost btn-sm" onClick={() => removeTakeaway(i)} style={{ color: '#FF6363', minHeight: 34 }}>
                            <Minus size={13} />
                          </button>
                        </div>
                      </div>
                      <textarea
                        className="form-textarea"
                        style={{ minHeight: 52, fontSize: 12.5 }}
                        placeholder="Details…"
                        value={tw.content}
                        onChange={(e) => updateTakeaway(i, 'content', e.target.value)}
                      />
                      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 6 }}>
                        <button
                          className="btn btn-outline btn-sm"
                          onClick={() => convertToAction(tw, i)}
                          style={{ fontSize: 11.5 }}
                        >
                          <ArrowRight size={11} /> Convert to Action
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Save */}
              <div className="card" style={{ background: 'rgba(0,217,149,0.06)', border: '1px solid rgba(0,217,149,0.15)' }}>
                {savedNoteId ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <CheckCircle size={20} color="var(--emerald)" />
                    <div style={{ flex: '1 1 160px', minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>Note saved!</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{takeaways.filter(t => t.title).length} takeaways captured</div>
                    </div>
                    <button className="btn btn-solid btn-sm" onClick={() => navigate(`/notes/${savedNoteId}`)}>
                      View Note <ArrowRight size={12} />
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    <button className="btn btn-solid" style={{ flex: '1 1 180px', justifyContent: 'center', minHeight: 40 }} onClick={saveNote} id="save-note-btn">
                      <BookOpen size={13} /> Save Note & Takeaways
                    </button>
                    <button className="btn btn-outline" style={{ minHeight: 40 }} onClick={() => navigate('/notes')}>
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
