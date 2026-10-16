import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  AfterFlowEvent, Note, Takeaway, Action, Connection,
  ActionStatus, FollowUpStatus,
} from './types';

// ===========================
// Helpers
// ===========================
function uid(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function now(): string {
  return new Date().toISOString();
}

// ===========================
// Demo Seed Data
// ===========================
function generateSeedData() {
  const e1id = 'evt-001';
  const e2id = 'evt-002';
  const e3id = 'evt-003';

  const events: AfterFlowEvent[] = [
    {
      id: e1id,
      name: 'TechSummit 2024 — Future of AI',
      date: '2024-10-05',
      endDate: '2024-10-07',
      type: 'conference',
      location: 'Bengaluru, India',
      description: 'A three-day conference bringing together AI researchers, engineers, and product leaders to discuss the future of artificial intelligence.',
      reflection: 'The sessions on responsible AI were particularly eye-opening. Need to revisit my understanding of alignment.',
      status: 'completed',
      tags: ['AI', 'Machine Learning', 'Ethics'],
      createdAt: '2024-10-01T09:00:00.000Z',
      updatedAt: '2024-10-08T12:00:00.000Z',
    },
    {
      id: e2id,
      name: 'Design Systems Workshop',
      date: '2024-10-12',
      type: 'workshop',
      location: 'Online',
      description: 'Hands-on workshop on building scalable design systems, component libraries, and design tokens.',
      reflection: 'Great practical exercises. The token-based approach really clicked for me.',
      status: 'completed',
      tags: ['Design', 'UI/UX', 'Figma'],
      createdAt: '2024-10-10T08:00:00.000Z',
      updatedAt: '2024-10-13T14:00:00.000Z',
    },
    {
      id: e3id,
      name: 'Startup Networking Meetup',
      date: '2024-10-18',
      type: 'networking',
      location: 'Mumbai, India',
      description: 'Monthly networking meetup for startup founders, investors, and builders in the ecosystem.',
      reflection: '',
      status: 'upcoming',
      tags: ['Networking', 'Startups', 'Entrepreneurship'],
      createdAt: '2024-10-14T10:00:00.000Z',
      updatedAt: '2024-10-14T10:00:00.000Z',
    },
  ];

  const notes: Note[] = [
    {
      id: 'note-001',
      eventId: e1id,
      title: 'Keynote: The Alignment Problem',
      content: 'Dr. Priya Sharma opened with a compelling argument that alignment is not just a technical problem but a sociotechnical one. We cannot solve alignment without including diverse stakeholders in the conversation.',
      speakerName: 'Dr. Priya Sharma',
      sourceType: 'manual',
      summary: 'Alignment is a sociotechnical problem requiring diverse stakeholder involvement.',
      takeaways: [
        {
          id: 'tw-001',
          eventId: e1id,
          title: 'Alignment needs diverse stakeholders',
          content: 'Include ethicists, sociologists, and domain experts—not just engineers—in AI alignment work.',
          category: 'learning',
          convertedToAction: false,
          createdAt: '2024-10-05T11:00:00.000Z',
        },
        {
          id: 'tw-002',
          eventId: e1id,
          title: 'Read "The Alignment Problem" by Brian Christian',
          content: 'Dr. Sharma repeatedly cited this book as foundational reading.',
          category: 'action',
          convertedToAction: true,
          createdAt: '2024-10-05T11:15:00.000Z',
        },
      ],
      createdAt: '2024-10-05T11:30:00.000Z',
      updatedAt: '2024-10-05T11:30:00.000Z',
    },
    {
      id: 'note-002',
      eventId: e1id,
      title: 'Panel: LLMs in Production',
      content: 'Discussion on the challenges of deploying LLMs at scale. Key themes: latency, cost, hallucination mitigation, and eval frameworks.',
      speakerName: 'Multiple Panelists',
      sourceType: 'manual',
      summary: 'LLMs in prod require rigorous eval frameworks and cost management.',
      takeaways: [
        {
          id: 'tw-003',
          eventId: e1id,
          title: 'Build evaluation frameworks early',
          content: 'Don\'t wait until deployment to think about evals. Design them alongside the feature.',
          category: 'concept',
          convertedToAction: false,
          createdAt: '2024-10-06T14:00:00.000Z',
        },
      ],
      createdAt: '2024-10-06T15:00:00.000Z',
      updatedAt: '2024-10-06T15:00:00.000Z',
    },
    {
      id: 'note-003',
      eventId: e2id,
      title: 'Design Tokens Deep Dive',
      content: 'Workshop session on implementing design tokens. Covered semantic tokens, multi-brand theming, and Token Studio in Figma.',
      speakerName: 'Alex Rivera',
      sourceType: 'manual',
      summary: 'Semantic tokens enable scalable design systems across brands and themes.',
      takeaways: [
        {
          id: 'tw-004',
          eventId: e2id,
          title: 'Implement semantic token layer',
          content: 'Instead of using raw values, map them through semantic names (--color-primary, not --color-emerald-500) to enable theming.',
          category: 'learning',
          convertedToAction: false,
          createdAt: '2024-10-12T14:00:00.000Z',
        },
      ],
      createdAt: '2024-10-12T14:30:00.000Z',
      updatedAt: '2024-10-12T14:30:00.000Z',
    },
  ];

  const actions: Action[] = [
    {
      id: 'act-001',
      title: 'Read "The Alignment Problem"',
      description: 'Book recommended by Dr. Priya Sharma at TechSummit. Focus on chapters about RLHF and reward hacking.',
      eventId: e1id,
      takeawayId: 'tw-002',
      priority: 'high',
      status: 'inprogress',
      dueDate: '2024-10-25',
      createdAt: '2024-10-05T12:00:00.000Z',
      updatedAt: '2024-10-08T09:00:00.000Z',
    },
    {
      id: 'act-002',
      title: 'Prototype evaluation framework for our LLM feature',
      description: 'Based on panel discussion insights. Start with a basic evals harness before shipping.',
      eventId: e1id,
      priority: 'high',
      status: 'pending',
      dueDate: '2024-10-20',
      createdAt: '2024-10-07T10:00:00.000Z',
      updatedAt: '2024-10-07T10:00:00.000Z',
    },
    {
      id: 'act-003',
      title: 'Migrate design tokens to semantic naming',
      description: 'Refactor our existing token system to use semantic layer as shown in the workshop.',
      eventId: e2id,
      priority: 'medium',
      status: 'pending',
      dueDate: '2024-10-30',
      createdAt: '2024-10-12T16:00:00.000Z',
      updatedAt: '2024-10-12T16:00:00.000Z',
    },
    {
      id: 'act-004',
      title: 'Write up TechSummit notes for team',
      description: 'Share key insights from TechSummit with the engineering team in a Notion doc.',
      eventId: e1id,
      priority: 'medium',
      status: 'completed',
      dueDate: '2024-10-10',
      completedAt: '2024-10-09T17:00:00.000Z',
      createdAt: '2024-10-08T08:00:00.000Z',
      updatedAt: '2024-10-09T17:00:00.000Z',
    },
    {
      id: 'act-005',
      title: 'Follow up with Meera on open-source collab',
      description: 'She mentioned interest in collaborating on an open dataset initiative.',
      eventId: e1id,
      priority: 'medium',
      status: 'pending',
      dueDate: '2024-10-17',
      createdAt: '2024-10-07T11:00:00.000Z',
      updatedAt: '2024-10-07T11:00:00.000Z',
    },
  ];

  const connections: Connection[] = [
    {
      id: 'con-001',
      name: 'Meera Krishnan',
      role: 'AI Research Lead',
      organization: 'DeepMind India',
      email: 'meera.k@example.com',
      linkedin: 'linkedin.com/in/meerakrishnan',
      phone: '+91 99001 22334',
      eventId: e1id,
      conversationNotes: 'Met at the alignment panel. She works on interpretability research. Very interested in the educational AI project I mentioned.',
      followUpIntention: 'Share our project scope and explore potential research collaboration.',
      followUpDate: '2024-10-17',
      followUpStatus: 'overdue',
      avatarColor: '#7C3AED',
      createdAt: '2024-10-07T10:00:00.000Z',
      updatedAt: '2024-10-07T10:00:00.000Z',
    },
    {
      id: 'con-002',
      name: 'Arjun Nair',
      role: 'Founding Engineer',
      organization: 'Sarvam AI',
      email: 'arjun@sarvam.ai',
      linkedin: 'linkedin.com/in/arjunnair-ai',
      phone: '+91 97112 88390',
      eventId: e1id,
      conversationNotes: 'Spoke about building Indian language models. He shared fascinating insights about low-resource languages and data collection challenges.',
      followUpIntention: 'Connect on LinkedIn and stay updated on Sarvam\'s work.',
      followUpDate: '2024-10-14',
      followUpStatus: 'completed',
      avatarColor: '#0EA5E9',
      createdAt: '2024-10-06T16:00:00.000Z',
      updatedAt: '2024-10-14T10:00:00.000Z',
    },
    {
      id: 'con-003',
      name: 'Alex Rivera',
      role: 'Principal Designer',
      organization: 'Figma',
      email: 'alex.r@figma.com',
      linkedin: 'linkedin.com/in/alexrivera-design',
      phone: '+1 415 889 0012',
      eventId: e2id,
      conversationNotes: 'Workshop facilitator. Very knowledgeable about design tokens and Token Studio. Offered to review our design system.',
      followUpIntention: 'Send our current design system for review as he offered.',
      followUpDate: '2024-10-19',
      followUpStatus: 'overdue',
      avatarColor: '#EC4899',
      createdAt: '2024-10-12T17:00:00.000Z',
      updatedAt: '2024-10-12T17:00:00.000Z',
    },
    {
      id: 'con-004',
      name: 'Siddharth Rao',
      role: 'VC Partner',
      organization: 'Lightspeed India',
      email: 'siddharth@lsvp.com',
      linkedin: 'linkedin.com/in/siddharthrao',
      phone: '+91 98211 43501',
      eventId: e1id,
      conversationNotes: 'Brief chat at the networking dinner. He\'s interested in AI infrastructure plays.',
      followUpIntention: 'Send a quick email about the EdTech AI project.',
      followUpDate: '2024-10-09',
      followUpStatus: 'overdue',
      avatarColor: '#F59E0B',
      createdAt: '2024-10-07T19:00:00.000Z',
      updatedAt: '2024-10-07T19:00:00.000Z',
    },
  ];

  return { events, notes, actions, connections };
}

// ===========================
// Store Interface
// ===========================
interface Store {
  events: AfterFlowEvent[];
  notes: Note[];
  actions: Action[];
  connections: Connection[];
  _seeded: boolean;

  // Events
  addEvent: (event: Omit<AfterFlowEvent, 'id' | 'createdAt' | 'updatedAt'>) => string;
  updateEvent: (id: string, updates: Partial<AfterFlowEvent>) => void;
  deleteEvent: (id: string) => void;

  // Notes
  addNote: (note: Omit<Note, 'id' | 'createdAt' | 'updatedAt' | 'takeaways'>) => string;
  updateNote: (id: string, updates: Partial<Note>) => void;
  deleteNote: (id: string) => void;
  addTakeaway: (noteId: string, takeaway: Omit<Takeaway, 'id' | 'createdAt'>) => void;
  deleteTakeaway: (noteId: string, takeawayId: string) => void;

  // Actions
  addAction: (action: Omit<Action, 'id' | 'createdAt' | 'updatedAt'>) => string;
  updateAction: (id: string, updates: Partial<Action>) => void;
  updateActionStatus: (id: string, status: ActionStatus) => void;
  deleteAction: (id: string) => void;

  // Connections
  addConnection: (conn: Omit<Connection, 'id' | 'createdAt' | 'updatedAt'>) => string;
  updateConnection: (id: string, updates: Partial<Connection>) => void;
  updateFollowUpStatus: (id: string, status: FollowUpStatus) => void;
  deleteConnection: (id: string) => void;
}

// ===========================
// Zustand Store
// ===========================
export const useStore = create<Store>()(
  persist(
    (set) => {
      const seed = generateSeedData();

      return {
        events: seed.events,
        notes: seed.notes,
        actions: seed.actions,
        connections: seed.connections,
        _seeded: true,

        // Events
        addEvent: (event) => {
          const id = uid();
          const ts = now();
          set((s) => ({ events: [...s.events, { ...event, id, createdAt: ts, updatedAt: ts }] }));
          return id;
        },
        updateEvent: (id, updates) =>
          set((s) => ({
            events: s.events.map((e) =>
              e.id === id ? { ...e, ...updates, updatedAt: now() } : e
            ),
          })),
        deleteEvent: (id) =>
          set((s) => ({
            events: s.events.filter((e) => e.id !== id),
            notes: s.notes.filter((n) => n.eventId !== id),
            actions: s.actions.filter((a) => a.eventId !== id),
            connections: s.connections.filter((c) => c.eventId !== id),
          })),

        // Notes
        addNote: (note) => {
          const id = uid();
          const ts = now();
          set((s) => ({
            notes: [...s.notes, { ...note, id, takeaways: [], createdAt: ts, updatedAt: ts }],
          }));
          return id;
        },
        updateNote: (id, updates) =>
          set((s) => ({
            notes: s.notes.map((n) =>
              n.id === id ? { ...n, ...updates, updatedAt: now() } : n
            ),
          })),
        deleteNote: (id) =>
          set((s) => ({ notes: s.notes.filter((n) => n.id !== id) })),
        addTakeaway: (noteId, takeaway) => {
          const id = uid();
          const ts = now();
          set((s) => ({
            notes: s.notes.map((n) =>
              n.id === noteId
                ? { ...n, takeaways: [...n.takeaways, { ...takeaway, id, createdAt: ts }] }
                : n
            ),
          }));
        },
        deleteTakeaway: (noteId, takeawayId) =>
          set((s) => ({
            notes: s.notes.map((n) =>
              n.id === noteId
                ? { ...n, takeaways: n.takeaways.filter((t) => t.id !== takeawayId) }
                : n
            ),
          })),

        // Actions
        addAction: (action) => {
          const id = uid();
          const ts = now();
          set((s) => ({
            actions: [...s.actions, { ...action, id, createdAt: ts, updatedAt: ts }],
          }));
          return id;
        },
        updateAction: (id, updates) =>
          set((s) => ({
            actions: s.actions.map((a) =>
              a.id === id ? { ...a, ...updates, updatedAt: now() } : a
            ),
          })),
        updateActionStatus: (id, status) =>
          set((s) => ({
            actions: s.actions.map((a) =>
              a.id === id
                ? {
                    ...a,
                    status,
                    completedAt: status === 'completed' ? now() : undefined,
                    updatedAt: now(),
                  }
                : a
            ),
          })),
        deleteAction: (id) =>
          set((s) => ({ actions: s.actions.filter((a) => a.id !== id) })),

        // Connections
        addConnection: (conn) => {
          const id = uid();
          const ts = now();
          set((s) => ({
            connections: [...s.connections, { ...conn, id, createdAt: ts, updatedAt: ts }],
          }));
          return id;
        },
        updateConnection: (id, updates) =>
          set((s) => ({
            connections: s.connections.map((c) =>
              c.id === id ? { ...c, ...updates, updatedAt: now() } : c
            ),
          })),
        updateFollowUpStatus: (id, status) =>
          set((s) => ({
            connections: s.connections.map((c) =>
              c.id === id ? { ...c, followUpStatus: status, updatedAt: now() } : c
            ),
          })),
        deleteConnection: (id) =>
          set((s) => ({ connections: s.connections.filter((c) => c.id !== id) })),
      };
    },
    {
      name: 'afterflow-storage',
      version: 1,
    }
  )
);
