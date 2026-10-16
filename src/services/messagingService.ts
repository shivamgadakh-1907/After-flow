import type { ChatMessage, ChatAttachment } from '../types';

/**
 * ============================================================================
 * ARCHITECTURE & REAL-TIME MESSAGING SPECIFICATION
 * ============================================================================
 * 
 * CURRENT STATUS: Local Prototype & Demo Simulation Mode
 * ----------------------------------------------------------------------------
 * This service currently runs in a reliable local simulation mode backed by 
 * the browser's `localStorage`. Contacts from your event network have sample 
 * conversation threads, unread counters, and contextual auto-replies to 
 * simulate realistic post-event follow-up conversations.
 * 
 * All simulated replies are explicitly tagged with `isSimulated: true` so 
 * they are never mistaken for messages sent by real external human users.
 * 
 * TO ENABLE REAL CROSS-USER REAL-TIME MESSAGING:
 * ----------------------------------------------------------------------------
 * To support genuine person-to-person messaging across multiple devices/browsers:
 * 1. Authentication:
 *    Integrate an identity provider (e.g., Supabase Auth or Firebase Auth).
 *    Each user must have a verified `uid` with a JWT session.
 * 
 * 2. Message Persistence Database:
 *    A relational table (PostgreSQL/Supabase) or document collection (Firestore):
 *    - `id` (uuid, primary key)
 *    - `conversation_id` (uuid, indexed)
 *    - `sender_id` (uuid, references users.id)
 *    - `recipient_id` (uuid, references users.id)
 *    - `content` (text)
 *    - `attachment` (jsonb/optional)
 *    - `status` ('sent' | 'delivered' | 'read')
 *    - `created_at` (timestamptz)
 *    Row Level Security (RLS) policy: Only participants can SELECT/INSERT.
 * 
 * 3. Real-Time Transport:
 *    - Supabase Realtime (PostgreSQL CDC over WebSockets)
 *    - Firebase Realtime Database / Firestore Listeners
 *    - Or custom WebSocket / Socket.io server with Redis pub/sub.
 * 
 * 4. Audio/Video Signaling:
 *    Audio and video calls require WebRTC with STUN/TURN servers (e.g., LiveKit, 
 *    Twilio, or Daily.co) and a signaling channel.
 * 
 * 5. Security Note:
 *    No API secrets or service keys should ever be committed or exposed in 
 *    client-side code. Use environment variables (VITE_*) only for public anon keys.
 * ============================================================================
 */

export interface IMessagingService {
  getMessages(connectionId: string): ChatMessage[];
  sendMessage(connectionId: string, text: string, attachment?: ChatAttachment): ChatMessage;
  markAsRead(connectionId: string): void;
  clearHistory(connectionId: string): void;
  getUnreadCount(connectionId?: string): number;
  isOnline(connectionId: string): boolean;
  getPresenceLabel(connectionId: string): string;
  subscribe(listener: () => void): () => void;
  subscribeTyping(connectionId: string, listener: (isTyping: boolean) => void): () => void;
  triggerSimulatedReply(connectionId: string, customText?: string, delayMs?: number): void;
}

const STORAGE_KEY = 'afterflow-chat-messages-v1';
const UNREAD_STORAGE_KEY = 'afterflow-chat-unread-v1';

// Initial preloaded seed conversation threads for default demo connections
const SEED_MESSAGES: Record<string, ChatMessage[]> = {
  // Siddharth Rao (con-004) - VC Partner at Lightspeed India
  'con-004': [
    {
      id: 'msg-s01',
      connectionId: 'con-004',
      sender: 'them',
      text: 'Hi! Great meeting you at TechSummit. Are you free to jump on a quick call this week?',
      time: '10:14 AM',
      timestamp: '2024-10-16T04:44:00.000Z',
      delivered: true,
      seen: true,
      isSimulated: true,
    },
    {
      id: 'msg-s02',
      connectionId: 'con-004',
      sender: 'me',
      text: 'Hey Siddharth, definitely. I can do Thursday afternoon. Let me know what time works.',
      time: '10:18 AM',
      timestamp: '2024-10-16T04:48:00.000Z',
      delivered: true,
      seen: true,
    },
    {
      id: 'msg-s03',
      connectionId: 'con-004',
      sender: 'them',
      text: 'Thursday 4 PM IST works well for me! Also send across the EdTech AI deck beforehand so I can review it.',
      time: '12:30 PM',
      timestamp: '2024-10-16T07:00:00.000Z',
      delivered: true,
      seen: false,
      isSimulated: true,
    },
  ],

  // Arjun Nair (con-002) - Founding Engineer at Sarvam AI
  'con-002': [
    {
      id: 'msg-a01',
      connectionId: 'con-002',
      sender: 'me',
      text: 'Hey Arjun! Loved your talk on Indic LLM tokenization at the summit.',
      time: '11:20 AM',
      timestamp: '2024-10-16T05:50:00.000Z',
      delivered: true,
      seen: true,
    },
    {
      id: 'msg-a02',
      connectionId: 'con-002',
      sender: 'them',
      text: "Hi, let's connect! Just accepted your LinkedIn request. Here's the benchmark repo we discussed at the booth.",
      time: '12:15 PM',
      timestamp: '2024-10-16T06:45:00.000Z',
      delivered: true,
      seen: false,
      isSimulated: true,
    },
  ],

  // Meera Krishnan (con-001) - AI Research Lead at DeepMind India
  'con-001': [
    {
      id: 'msg-m01',
      connectionId: 'con-001',
      sender: 'them',
      text: 'Hi! It was wonderful chatting after the alignment panel yesterday.',
      time: 'Yesterday',
      timestamp: '2024-10-15T11:00:00.000Z',
      delivered: true,
      seen: true,
      isSimulated: true,
    },
    {
      id: 'msg-m02',
      connectionId: 'con-001',
      sender: 'me',
      text: 'Likewise Meera! Putting together a 2-pager on our interpretability evaluation dataset to share with you.',
      time: 'Yesterday',
      timestamp: '2024-10-15T12:30:00.000Z',
      delivered: true,
      seen: true,
    },
  ],

  // Alex Rivera (con-003) - Principal Designer at Figma
  'con-003': [
    {
      id: 'msg-al01',
      connectionId: 'con-003',
      sender: 'them',
      text: "Hey! Send over your Figma file link whenever you're ready. Happy to audit your token variables.",
      time: 'Yesterday',
      timestamp: '2024-10-15T14:10:00.000Z',
      delivered: true,
      seen: true,
      isSimulated: true,
    },
    {
      id: 'msg-al02',
      connectionId: 'con-003',
      sender: 'me',
      text: 'Thanks Alex! Cleaning up our semantic color tokens today, will drop the link shortly.',
      time: 'Yesterday',
      timestamp: '2024-10-15T15:00:00.000Z',
      delivered: true,
      seen: true,
    },
  ],
};

// Initial unread counts matching prototype
const INITIAL_UNREAD: Record<string, number> = {
  'con-004': 1,
  'con-002': 1,
  'con-001': 0,
  'con-003': 0,
};

// Contextual reply pools for prototype simulation
const AUTO_REPLY_POOLS: Record<string, string[]> = {
  'con-004': [
    "Sounds awesome! Looking forward to reviewing the EdTech AI metrics.",
    "Perfect, I've just sent a calendar invite for Thursday 4 PM IST.",
    "Let's also loop in my principal analyst on the call to review the pitch deck.",
    "Thanks for following up! We're actively evaluating new seed investments this quarter.",
  ],
  'con-002': [
    "For sure! Try running our voice API on those Hindi + English code-mixed prompts.",
    "Let me know if you need higher rate limits on the developer sandbox key!",
    "Great questions on the tokenizer vocabulary. I'll send over the benchmark paper.",
    "Definitely let me know how the Indic eval suite runs on your test dataset.",
  ],
  'con-001': [
    "Thank you! I'll go through the 2-pager with our Bangalore research group and get back.",
    "This dataset looks very promising for our next workshop on representation alignment.",
    "Happy to co-author or provide advisory feedback on your evaluation methodology.",
    "Thanks for the prompt follow-up. Let's schedule a 20-min sync next Tuesday.",
  ],
  'con-003': [
    "Just opened the Figma file! The dark emerald contrast ratios look super clean.",
    "Left a few comments on the component spacing and border tokens for you!",
    "Love the glassmorphism approach with the 1px subtle emerald borders.",
    "Let me know if you want to pair on the responsive layout variants next week.",
  ],
};

const DEFAULT_REPLIES = [
  "Thanks for following up! Great connecting with you at the event.",
  "Sounds like a plan. Let's touch base early next week.",
  "Appreciate the message! I'm reviewing the notes from our discussion right now.",
  "Awesome! Let me check my calendar and get back to you shortly.",
];

class LocalMessagingService implements IMessagingService {
  private messages: Record<string, ChatMessage[]> = {};
  private unreadCounts: Record<string, number> = {};
  private listeners: Set<() => void> = new Set();
  private typingListeners: Map<string, Set<(isTyping: boolean) => void>> = new Map();

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        this.messages = JSON.parse(stored);
      } else {
        this.messages = { ...SEED_MESSAGES };
        this.saveToStorage();
      }

      const storedUnread = localStorage.getItem(UNREAD_STORAGE_KEY);
      if (storedUnread) {
        this.unreadCounts = JSON.parse(storedUnread);
      } else {
        this.unreadCounts = { ...INITIAL_UNREAD };
        this.saveUnreadToStorage();
      }
    } catch {
      this.messages = { ...SEED_MESSAGES };
      this.unreadCounts = { ...INITIAL_UNREAD };
    }
  }

  private saveToStorage() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.messages));
    } catch (e) {
      console.warn('Failed to save chat messages to localStorage', e);
    }
  }

  private saveUnreadToStorage() {
    try {
      localStorage.setItem(UNREAD_STORAGE_KEY, JSON.stringify(this.unreadCounts));
    } catch (e) {
      console.warn('Failed to save unread counts to localStorage', e);
    }
  }

  private notify() {
    this.listeners.forEach((fn) => {
      try {
        fn();
      } catch (err) {
        console.error('Error in messaging listener', err);
      }
    });
  }

  private notifyTyping(connectionId: string, isTyping: boolean) {
    const list = this.typingListeners.get(connectionId);
    if (list) {
      list.forEach((fn) => fn(isTyping));
    }
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  public subscribeTyping(connectionId: string, listener: (isTyping: boolean) => void): () => void {
    if (!this.typingListeners.has(connectionId)) {
      this.typingListeners.set(connectionId, new Set());
    }
    this.typingListeners.get(connectionId)!.add(listener);
    return () => {
      this.typingListeners.get(connectionId)?.delete(listener);
    };
  }

  public getMessages(connectionId: string): ChatMessage[] {
    return this.messages[connectionId] || [];
  }

  public getUnreadCount(connectionId?: string): number {
    if (connectionId) {
      return this.unreadCounts[connectionId] || 0;
    }
    return Object.values(this.unreadCounts).reduce((acc, count) => acc + (count > 0 ? count : 0), 0);
  }

  public markAsRead(connectionId: string) {
    if (this.unreadCounts[connectionId]) {
      this.unreadCounts[connectionId] = 0;
      this.saveUnreadToStorage();
      this.notify();
    }
  }

  public isOnline(connectionId: string): boolean {
    // Ground truth for presence: in this prototype, specific contacts are marked active
    if (connectionId === 'con-001') return false; // Meera Krishnan is marked offline
    return true; // Siddharth, Arjun, Alex & newly met contacts are marked active
  }

  public getPresenceLabel(connectionId: string): string {
    if (!this.isOnline(connectionId)) {
      return 'Offline · Last seen yesterday';
    }
    return 'Active now · Simulated Contact';
  }

  public sendMessage(connectionId: string, text: string, attachment?: ChatAttachment): ChatMessage {
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const msg: ChatMessage = {
      id: 'msg-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
      connectionId,
      sender: 'me',
      text: text.trim(),
      time: timeStr,
      timestamp: now.toISOString(),
      delivered: true,
      seen: true,
      attachment,
    };

    if (!this.messages[connectionId]) {
      this.messages[connectionId] = [];
    }
    this.messages[connectionId].push(msg);
    this.saveToStorage();
    this.notify();

    // Trigger prototype simulated reply after realistic delay
    this.triggerSimulatedReply(connectionId);

    return msg;
  }

  public triggerSimulatedReply(connectionId: string, customText?: string, delayMs = 1300) {
    this.notifyTyping(connectionId, true);

    setTimeout(() => {
      this.notifyTyping(connectionId, false);

      const pool = AUTO_REPLY_POOLS[connectionId] || DEFAULT_REPLIES;
      const text = customText || pool[Math.floor(Math.random() * pool.length)];
      const now = new Date();
      const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      const reply: ChatMessage = {
        id: 'msg-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
        connectionId,
        sender: 'them',
        text,
        time: timeStr,
        timestamp: now.toISOString(),
        delivered: true,
        seen: false,
        isSimulated: true, // Transparently labeled as demo prototype auto-reply
      };

      if (!this.messages[connectionId]) {
        this.messages[connectionId] = [];
      }
      this.messages[connectionId].push(reply);

      // Increment unread count
      this.unreadCounts[connectionId] = (this.unreadCounts[connectionId] || 0) + 1;

      this.saveToStorage();
      this.saveUnreadToStorage();
      this.notify();
    }, delayMs);
  }

  public clearHistory(connectionId: string) {
    this.messages[connectionId] = [];
    this.unreadCounts[connectionId] = 0;
    this.saveToStorage();
    this.saveUnreadToStorage();
    this.notify();
  }
}

export const messagingService: IMessagingService = new LocalMessagingService();
