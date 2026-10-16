import type { Priority, ActionStatus, FollowUpStatus, EventType, EventStatus } from './types';

export function formatDate(dateStr: string, opts?: Intl.DateTimeFormatOptions): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', opts || { day: 'numeric', month: 'short', year: 'numeric' });
}

export function formatDateRelative(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  if (diff === -1) return 'Yesterday';
  if (diff > 0 && diff <= 7) return `In ${diff} days`;
  if (diff < 0 && diff >= -7) return `${Math.abs(diff)} days ago`;
  return formatDate(dateStr);
}

export function isOverdue(dateStr?: string): boolean {
  if (!dateStr) return false;
  return new Date(dateStr) < new Date();
}

export function getPriorityLabel(p: Priority): string {
  return { high: 'High', medium: 'Medium', low: 'Low' }[p];
}

export function getStatusLabel(s: ActionStatus): string {
  return { pending: 'Pending', inprogress: 'In Progress', completed: 'Completed' }[s];
}

export function getFollowUpLabel(s: FollowUpStatus): string {
  return { pending: 'Pending', completed: 'Done', overdue: 'Overdue' }[s];
}

export function getEventTypeLabel(t: EventType): string {
  return {
    conference: 'Conference',
    workshop: 'Workshop',
    meetup: 'Meetup',
    webinar: 'Webinar',
    seminar: 'Seminar',
    networking: 'Networking',
    hackathon: 'Hackathon',
    other: 'Other',
  }[t];
}

export function getEventStatusLabel(s: EventStatus): string {
  return { upcoming: 'Upcoming', ongoing: 'Ongoing', completed: 'Completed' }[s];
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function getAvatarGradient(color: string): string {
  const colorMap: Record<string, string> = {
    '#7C3AED': 'linear-gradient(135deg, #7C3AED, #A855F7)',
    '#0EA5E9': 'linear-gradient(135deg, #0EA5E9, #38BDF8)',
    '#EC4899': 'linear-gradient(135deg, #EC4899, #F472B6)',
    '#F59E0B': 'linear-gradient(135deg, #F59E0B, #FCD34D)',
    '#10B981': 'linear-gradient(135deg, #10B981, #34D399)',
    '#EF4444': 'linear-gradient(135deg, #EF4444, #FCA5A5)',
    '#6366F1': 'linear-gradient(135deg, #6366F1, #A5B4FC)',
    '#14B8A6': 'linear-gradient(135deg, #14B8A6, #5EEAD4)',
  };
  return colorMap[color] || `linear-gradient(135deg, ${color}, ${color}aa)`;
}

export const AVATAR_COLORS = [
  '#7C3AED', '#0EA5E9', '#EC4899', '#F59E0B',
  '#10B981', '#EF4444', '#6366F1', '#14B8A6',
];

export function pickAvatarColor(): string {
  return AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];
}

export function truncate(str: string, max: number): string {
  return str.length > max ? str.slice(0, max) + '…' : str;
}
