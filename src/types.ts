// ===========================
// AfterFlow Data Types
// ===========================

export type EventType =
  | 'conference'
  | 'workshop'
  | 'meetup'
  | 'webinar'
  | 'seminar'
  | 'networking'
  | 'hackathon'
  | 'other';

export type EventStatus = 'upcoming' | 'ongoing' | 'completed';

export interface AfterFlowEvent {
  id: string;
  name: string;
  date: string; // ISO date string
  endDate?: string;
  type: EventType;
  location?: string;
  description?: string;
  reflection?: string;
  status: EventStatus;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export type TakeawayCategory =
  | 'learning'
  | 'concept'
  | 'idea'
  | 'quote'
  | 'action';

export interface Takeaway {
  id: string;
  eventId: string;
  title: string;
  content: string;
  category: TakeawayCategory;
  convertedToAction?: boolean;
  createdAt: string;
}

export interface Note {
  id: string;
  eventId: string;
  title: string;
  content: string;
  speakerName?: string;
  sourceType: 'manual' | 'audio' | 'transcript' | 'ai-summary';
  summary?: string;
  takeaways: Takeaway[];
  createdAt: string;
  updatedAt: string;
}

export type Priority = 'high' | 'medium' | 'low';
export type ActionStatus = 'pending' | 'inprogress' | 'completed';

export interface Action {
  id: string;
  title: string;
  description?: string;
  eventId?: string;
  takeawayId?: string;
  priority: Priority;
  status: ActionStatus;
  dueDate?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export type FollowUpStatus = 'pending' | 'completed' | 'overdue';

export interface Connection {
  id: string;
  name: string;
  role?: string;
  organization?: string;
  email?: string;
  linkedin?: string;
  phone?: string;
  eventId?: string;
  conversationNotes?: string;
  followUpIntention?: string;
  followUpDate?: string;
  followUpStatus: FollowUpStatus;
  avatarColor: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChatAttachment {
  name: string;
  size?: string;
  type?: string;
  url?: string;
}

export interface ChatMessage {
  id: string;
  connectionId: string;
  sender: 'me' | 'them';
  text: string;
  time: string;
  timestamp: string;
  seen?: boolean;
  delivered?: boolean;
  isSimulated?: boolean;
  attachment?: ChatAttachment;
}

export interface AppState {
  events: AfterFlowEvent[];
  notes: Note[];
  actions: Action[];
  connections: Connection[];
}

