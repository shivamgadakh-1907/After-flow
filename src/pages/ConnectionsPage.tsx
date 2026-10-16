import { useState, useEffect, useRef, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import {
  Search, Plus, Users, Mail, Link, Phone, Calendar,
  Trash2, Edit2, CheckCircle, Clock, AlertCircle,
  Paperclip, Smile, Send, ArrowLeft, Info,
  PhoneCall, Video, CheckCheck, FileText,
  Copy, X, Sparkles, MessageSquare, Download
} from 'lucide-react';
import { getInitials, getAvatarGradient } from '../utils';
import AppLayout from '../components/AppLayout';
import ConfirmDialog from '../components/ConfirmDialog';
import ConnectionFormModal from '../components/ConnectionFormModal';
import { useToast } from '../ToastContext';
import { messagingService } from '../services/messagingService';
import type { ChatAttachment } from '../types';

export default function ConnectionsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { connections, events, deleteConnection, updateConnection, updateFollowUpStatus, addNote } = useStore();
  const { showToast } = useToast();

  // Active state
  const [activeConnectionId, setActiveConnectionId] = useState<string | null>(() => {
    const paramId = searchParams.get('id');
    if (paramId && connections.some(c => c.id === paramId)) return paramId;
    return connections[0]?.id || null;
  });

  // Filter & Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'unread' | 'overdue'>('all');
  const [inChatSearch, setInChatSearch] = useState(false);
  const [chatSearchQuery, setChatSearchQuery] = useState('');

  // UI Panels state
  const [showRightPanel, setShowRightPanel] = useState(true);
  const [mobileView, setMobileView] = useState<'list' | 'chat'>('list');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showCallModal, setShowCallModal] = useState<{ type: 'audio' | 'video'; name: string } | null>(null);

  // Forms & Dialogs
  const [showAddModal, setShowAddModal] = useState(searchParams.has('new') || false);
  const [editConnectionId, setEditConnectionId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [clearChatConfirmId, setClearChatConfirmId] = useState<string | null>(null);

  // Input & Messaging state
  const [messageText, setMessageText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [msgVersion, setMsgVersion] = useState(0); // bump to trigger re-renders from service

  // Editable quick notes
  const [localNotes, setLocalNotes] = useState('');

  // Auto-scroll ref
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Subscribe to messaging service updates
  useEffect(() => {
    return messagingService.subscribe(() => {
      setMsgVersion((v) => v + 1);
    });
  }, []);

  // Subscribe to typing indicator for active conversation
  useEffect(() => {
    if (!activeConnectionId) return;
    return messagingService.subscribeTyping(activeConnectionId, (typing) => {
      setIsTyping(typing);
    });
  }, [activeConnectionId]);

  // Keep active connection synchronized if list changes
  useEffect(() => {
    if (activeConnectionId && !connections.some((c) => c.id === activeConnectionId)) {
      setActiveConnectionId(connections[0]?.id || null);
    } else if (!activeConnectionId && connections.length > 0) {
      setActiveConnectionId(connections[0].id);
    }
  }, [connections, activeConnectionId]);

  // Active connection object
  const activeConn = useMemo(() => {
    return connections.find((c) => c.id === activeConnectionId) || null;
  }, [connections, activeConnectionId]);

  // Sync local notes when active connection changes
  useEffect(() => {
    if (activeConn) {
      setLocalNotes(activeConn.conversationNotes || '');
      // Mark as read when opening conversation
      messagingService.markAsRead(activeConn.id);
    }
  }, [activeConn]);

  // Scroll to bottom when messages update or conversation changes
  const messages = useMemo(() => {
    if (!activeConn) return [];
    return messagingService.getMessages(activeConn.id);
  }, [activeConn, msgVersion]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, isTyping, activeConnectionId]);

  // Handle select connection
  function handleSelectConnection(id: string) {
    setActiveConnectionId(id);
    messagingService.markAsRead(id);
    setMobileView('chat');
    setSearchParams({ id });
    setChatSearchQuery('');
    setInChatSearch(false);
  }

  // Handle send message
  function handleSendMessage(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!activeConn) return;

    const trimmed = messageText.trim();
    if (!trimmed) return;

    messagingService.sendMessage(activeConn.id, trimmed);
    setMessageText('');
    setShowEmojiPicker(false);
    chatInputRef.current?.focus();
  }

  // Handle quick reply click
  function handleInsertQuickReply(text: string) {
    if (!activeConn) return;
    setMessageText(text);
    chatInputRef.current?.focus();
  }

  // Handle demo attachment
  function handleAttachDemoFile() {
    if (!activeConn) return;
    const attachment: ChatAttachment = {
      name: 'AfterFlow_Project_Deck_2024.pdf',
      size: '2.4 MB',
      type: 'application/pdf',
    };
    messagingService.sendMessage(
      activeConn.id,
      '📄 Attached: AfterFlow Project Deck & Scope (PDF)',
      attachment
    );
    showToast('Project deck attached to conversation.', 'success');
  }

  // Handle file upload from device
  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!activeConn || !e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
    const attachment: ChatAttachment = {
      name: file.name,
      size: `${sizeMb} MB`,
      type: file.type || 'document',
    };
    messagingService.sendMessage(
      activeConn.id,
      `📎 Attached: ${file.name} (${sizeMb} MB)`,
      attachment
    );
    showToast(`Attached ${file.name}`, 'success');
    e.target.value = '';
  }

  // Handle emoji insertion
  function handleAddEmoji(emoji: string) {
    setMessageText((prev) => prev + emoji);
    setShowEmojiPicker(false);
    chatInputRef.current?.focus();
  }

  // Save quick notes to store
  function handleSaveNotes(newVal: string) {
    setLocalNotes(newVal);
    if (activeConn) {
      updateConnection(activeConn.id, { conversationNotes: newVal });
    }
  }

  // Sync conversation transcript to Smart Notes
  function handleSyncToSmartNotes() {
    if (!activeConn) return;
    const currentMessages = messagingService.getMessages(activeConn.id);
    if (currentMessages.length === 0) {
      showToast('No messages in this conversation to sync.', 'info');
      return;
    }

    const transcript = currentMessages
      .map((m) => `[${m.time}] ${m.sender === 'me' ? 'Shivam' : activeConn.name}: ${m.text}`)
      .join('\n\n');

    addNote({
      eventId: activeConn.eventId || (events[0]?.id || ''),
      title: `Chat Transcript with ${activeConn.name}`,
      content: `Meeting Summary & Follow-up Chat with ${activeConn.name} (${activeConn.role || 'Connection'}${activeConn.organization ? ` · ${activeConn.organization}` : ''}):\n\n${transcript}`,
      sourceType: 'manual',
      speakerName: activeConn.name,
    });

    showToast(`Conversation with ${activeConn.name} synced to Smart Notes!`, 'success');
  }

  // Follow-up status toggle
  function handleToggleFollowUp() {
    if (!activeConn) return;
    const nextStatus = activeConn.followUpStatus === 'completed' ? 'pending' : 'completed';
    updateFollowUpStatus(activeConn.id, nextStatus);
    showToast(
      nextStatus === 'completed'
        ? `Follow-up with ${activeConn.name} marked as Done!`
        : `Follow-up with ${activeConn.name} reopened.`,
      'success'
    );
  }

  // Handle connection deletion
  function handleDeleteConnection() {
    if (!deleteConfirmId) return;
    deleteConnection(deleteConfirmId);
    showToast('Connection removed.', 'success');
    setDeleteConfirmId(null);
    if (activeConnectionId === deleteConfirmId) {
      setActiveConnectionId(connections.find((c) => c.id !== deleteConfirmId)?.id || null);
    }
  }

  // Clear chat history
  function handleClearChat() {
    if (!clearChatConfirmId) return;
    messagingService.clearHistory(clearChatConfirmId);
    showToast('Conversation history cleared.', 'info');
    setClearChatConfirmId(null);
  }

  // Filter conversations
  const filteredConnections = useMemo(() => {
    return connections
      .filter((conn) => {
        const q = searchQuery.toLowerCase().trim();
        const connMessages = messagingService.getMessages(conn.id);
        const unread = messagingService.getUnreadCount(conn.id);

        // Status filter
        if (statusFilter === 'unread' && unread === 0) return false;
        if (statusFilter === 'overdue' && conn.followUpStatus !== 'overdue') return false;

        // Query filter
        if (!q) return true;
        const matchesName = conn.name.toLowerCase().includes(q);
        const matchesRole = conn.role?.toLowerCase().includes(q) || false;
        const matchesOrg = conn.organization?.toLowerCase().includes(q) || false;
        const matchesEvent = events.find((e) => e.id === conn.eventId)?.name.toLowerCase().includes(q) || false;
        const matchesMessage = connMessages.some((m) => m.text.toLowerCase().includes(q));

        return matchesName || matchesRole || matchesOrg || matchesEvent || matchesMessage;
      })
      .sort((a, b) => {
        // Sort by newest message timestamp
        const msgsA = messagingService.getMessages(a.id);
        const msgsB = messagingService.getMessages(b.id);
        const lastA = msgsA[msgsA.length - 1]?.timestamp || a.createdAt;
        const lastB = msgsB[msgsB.length - 1]?.timestamp || b.createdAt;
        return new Date(lastB).getTime() - new Date(lastA).getTime();
      });
  }, [connections, searchQuery, statusFilter, events, msgVersion]);

  // Counts for filter pills
  const totalCount = connections.length;
  const unreadCount = connections.reduce(
    (sum, c) => sum + (messagingService.getUnreadCount(c.id) > 0 ? 1 : 0),
    0
  );
  const overdueCount = connections.filter((c) => c.followUpStatus === 'overdue').length;

  // Event object for active connection
  const activeEvent = useMemo(() => {
    if (!activeConn?.eventId) return null;
    return events.find((e) => e.id === activeConn.eventId) || null;
  }, [activeConn, events]);

  return (
    <AppLayout isChatPage>
      {/* Page Header */}
      <div className="page-header" style={{ marginBottom: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <h1 className="page-title" style={{ margin: 0 }}>Connections</h1>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '3px 10px',
                  borderRadius: 20,
                  fontSize: 11,
                  fontWeight: 600,
                  background: 'rgba(0, 217, 149, 0.12)',
                  color: 'var(--emerald)',
                  border: '1px solid rgba(0, 217, 149, 0.25)',
                }}
              >
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: 'var(--emerald)',
                    boxShadow: '0 0 8px var(--emerald)',
                  }}
                />
                Direct Chat · Prototype Mode
              </span>
            </div>
            <p className="page-subtitle" style={{ marginTop: 2 }}>
              People you've met at events — modern messaging & follow-up tracker
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              className="btn btn-solid"
              onClick={() => setShowAddModal(true)}
              id="connections-new-btn"
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px' }}
            >
              <Plus size={14} /> Add Connection
            </button>
          </div>
        </div>
      </div>

      {/* Main 3-Panel Messaging Workspace */}
      <div className="chat-workspace">
        {/* ========================================================
            COLUMN 1: CONVERSATIONS LIST (LEFT PANEL)
           ======================================================== */}
        <aside
          className={`chat-panel-left ${mobileView === 'chat' ? 'mobile-hidden' : ''}`}
          aria-label="Conversations List"
        >
          {/* Search & Filter Header */}
          <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)' }}>
            <div className="search-bar" style={{ width: '100%', marginBottom: 10 }}>
              <Search size={13} className="search-icon" />
              <input
                type="text"
                placeholder="Search conversations…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ fontSize: 12.5 }}
              />
            </div>

            {/* Filter Pills */}
            <div style={{ display: 'flex', gap: 6 }}>
              {[
                { id: 'all', label: 'All', count: totalCount },
                { id: 'unread', label: 'Unread', count: unreadCount },
                { id: 'overdue', label: 'Overdue', count: overdueCount },
              ].map(({ id, label, count }) => {
                const active = statusFilter === id;
                return (
                  <button
                    key={id}
                    onClick={() => setStatusFilter(id as typeof statusFilter)}
                    style={{
                      flex: 1,
                      padding: '4px 8px',
                      borderRadius: 8,
                      fontSize: 11,
                      fontWeight: 600,
                      border: active ? '1px solid var(--emerald)' : '1px solid var(--border)',
                      background: active ? 'var(--emerald)' : 'rgba(0,0,0,0.2)',
                      color: active ? '#04120b' : 'var(--text-muted)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 4,
                    }}
                  >
                    <span>{label}</span>
                    <span
                      style={{
                        fontSize: 10,
                        opacity: active ? 0.9 : 0.7,
                        fontWeight: 700,
                      }}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Scrollable Conversation List */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {filteredConnections.length === 0 ? (
              <div style={{ padding: '36px 16px', textAlign: 'center' }}>
                <Users size={28} style={{ color: 'var(--text-muted)', margin: '0 auto 8px', opacity: 0.5 }} />
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>
                  No conversations found
                </div>
                <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 4 }}>
                  {searchQuery ? 'Try clearing your search query' : 'Add a new connection to start chatting'}
                </div>
              </div>
            ) : (
              filteredConnections.map((conn) => {
                const isActive = conn.id === activeConnectionId;
                const connMsgs = messagingService.getMessages(conn.id);
                const lastMsg = connMsgs[connMsgs.length - 1];
                const unread = messagingService.getUnreadCount(conn.id);
                const isOnline = messagingService.isOnline(conn.id);
                const isOverdue = conn.followUpStatus === 'overdue';

                const previewText = lastMsg
                  ? lastMsg.sender === 'me'
                    ? `You: ${lastMsg.text}`
                    : lastMsg.text
                  : conn.conversationNotes || 'No messages yet';

                return (
                  <div
                    key={conn.id}
                    className={`chat-conv-item ${isActive ? 'active' : ''}`}
                    onClick={() => handleSelectConnection(conn.id)}
                  >
                    {/* Avatar with Presence Ring */}
                    <div style={{ position: 'relative', flexShrink: 0 }}>
                      <div
                        className="connection-avatar"
                        style={{
                          width: 40,
                          height: 40,
                          fontSize: 13,
                          background: getAvatarGradient(conn.avatarColor),
                        }}
                      >
                        {getInitials(conn.name)}
                      </div>
                      <span
                        style={{
                          position: 'absolute',
                          bottom: 0,
                          right: 0,
                          width: 10,
                          height: 10,
                          borderRadius: '50%',
                          background: isOnline ? 'var(--emerald)' : '#6B7280',
                          border: '2px solid #091811',
                          boxShadow: isOnline ? '0 0 6px var(--emerald)' : 'none',
                        }}
                        title={isOnline ? 'Online (Simulated)' : 'Offline'}
                      />
                    </div>

                    {/* Metadata & Preview */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                        <span
                          style={{
                            fontSize: 13,
                            fontWeight: 600,
                            color: 'var(--text-primary)',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {conn.name}
                        </span>
                        <span
                          style={{
                            fontSize: 10.5,
                            color: unread > 0 ? 'var(--emerald)' : 'var(--text-muted)',
                            fontWeight: unread > 0 ? 600 : 400,
                            flexShrink: 0,
                          }}
                        >
                          {lastMsg ? lastMsg.time : 'New'}
                        </span>
                      </div>

                      <div
                        style={{
                          fontSize: 11,
                          color: 'var(--text-muted)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          marginTop: 1,
                        }}
                      >
                        {conn.role}
                        {conn.organization ? ` · ${conn.organization}` : ''}
                      </div>

                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: 6,
                          marginTop: 3,
                        }}
                      >
                        <p
                          style={{
                            fontSize: 11.5,
                            color: unread > 0 ? 'var(--text-primary)' : 'var(--text-secondary)',
                            fontWeight: unread > 0 ? 500 : 400,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            margin: 0,
                          }}
                        >
                          {previewText}
                        </p>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                          {isOverdue && (
                            <span
                              style={{
                                width: 7,
                                height: 7,
                                borderRadius: '50%',
                                background: '#FF6363',
                              }}
                              title="Follow-up overdue"
                            />
                          )}
                          {unread > 0 && (
                            <span
                              style={{
                                background: 'var(--emerald)',
                                color: '#04120b',
                                fontSize: 10,
                                fontWeight: 700,
                                borderRadius: 10,
                                minWidth: 18,
                                height: 18,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                padding: '0 4px',
                                boxShadow: '0 0 8px rgba(0, 217, 149, 0.4)',
                              }}
                            >
                              {unread}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </aside>

        {/* ========================================================
            COLUMN 2: CENTER CHAT WINDOW (MAIN FOCUS)
           ======================================================== */}
        <main
          className={`chat-panel-center ${mobileView === 'list' ? 'mobile-hidden' : ''}`}
          role="region"
          aria-label="Active Conversation"
        >
          {activeConn ? (
            <>
              {/* Chat Header */}
              <div
                style={{
                  height: 62,
                  padding: '0 16px',
                  borderBottom: '1px solid var(--border)',
                  background: 'rgba(7, 20, 14, 0.85)',
                  backdropFilter: 'blur(12px)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 10,
                  flexShrink: 0,
                  zIndex: 10,
                }}
              >
                {/* Contact info + Mobile Back */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                  <button
                    className="btn btn-ghost btn-sm md:hidden"
                    onClick={() => setMobileView('list')}
                    style={{ padding: '6px 8px', marginLeft: -6, color: 'var(--text-muted)' }}
                    aria-label="Back to conversations list"
                  >
                    <ArrowLeft size={16} />
                  </button>

                  <div style={{ position: 'relative', flexShrink: 0 }}>
                    <div
                      className="connection-avatar"
                      style={{
                        width: 38,
                        height: 38,
                        fontSize: 13,
                        background: getAvatarGradient(activeConn.avatarColor),
                      }}
                    >
                      {getInitials(activeConn.name)}
                    </div>
                    <span
                      style={{
                        position: 'absolute',
                        bottom: 0,
                        right: 0,
                        width: 9,
                        height: 9,
                        borderRadius: '50%',
                        background: messagingService.isOnline(activeConn.id) ? 'var(--emerald)' : '#6B7280',
                        border: '2px solid #06140e',
                      }}
                    />
                  </div>

                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <h2
                        style={{
                          fontSize: 14.5,
                          fontWeight: 700,
                          color: 'var(--text-primary)',
                          margin: 0,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {activeConn.name}
                      </h2>
                      {activeConn.phone && (
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 600,
                            padding: '1.5px 8px',
                            borderRadius: 10,
                            background: 'rgba(0, 217, 149, 0.12)',
                            color: 'var(--emerald)',
                            border: '1px solid rgba(0, 217, 149, 0.25)',
                            whiteSpace: 'nowrap',
                          }}
                          className="hidden sm:inline-block"
                        >
                          {activeConn.phone}
                        </span>
                      )}
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 600,
                          padding: '1px 6px',
                          borderRadius: 6,
                          background: 'rgba(0, 217, 149, 0.12)',
                          color: 'var(--emerald)',
                          border: '1px solid rgba(0, 217, 149, 0.25)',
                        }}
                      >
                        Connected
                      </span>
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: 1 }}>
                      {activeConn.role || 'Connection'}{activeConn.organization ? ` · ${activeConn.organization}` : ''} · {messagingService.getPresenceLabel(activeConn.id)}
                    </div>
                  </div>
                </div>

                {/* Header Action Tools */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => setShowCallModal({ type: 'audio', name: activeConn.name })}
                    title="Audio call (Preview)"
                    style={{ padding: 6, color: 'var(--text-secondary)' }}
                  >
                    <PhoneCall size={15} />
                  </button>
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => setShowCallModal({ type: 'video', name: activeConn.name })}
                    title="Video meeting (Preview)"
                    style={{ padding: 6, color: 'var(--text-secondary)' }}
                  >
                    <Video size={16} />
                  </button>
                  <button
                    className={`btn btn-ghost btn-sm ${inChatSearch ? 'active' : ''}`}
                    onClick={() => {
                      setInChatSearch(!inChatSearch);
                      if (inChatSearch) setChatSearchQuery('');
                    }}
                    title="Search in this conversation"
                    style={{ padding: 6, color: inChatSearch ? 'var(--emerald)' : 'var(--text-secondary)' }}
                  >
                    <Search size={15} />
                  </button>
                  <button
                    className={`btn btn-ghost btn-sm ${showRightPanel ? 'active' : ''}`}
                    onClick={() => setShowRightPanel(!showRightPanel)}
                    title="Toggle Connection Info Panel"
                    style={{ padding: 6, color: showRightPanel ? 'var(--emerald)' : 'var(--text-secondary)' }}
                  >
                    <Info size={16} />
                  </button>
                </div>
              </div>

              {/* In-Chat Search Bar */}
              {inChatSearch && (
                <div
                  style={{
                    padding: '8px 16px',
                    background: '#091c13',
                    borderBottom: '1px solid var(--border)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <Search size={13} style={{ color: 'var(--emerald)' }} />
                  <input
                    type="text"
                    placeholder="Search keywords in this chat…"
                    value={chatSearchQuery}
                    onChange={(e) => setChatSearchQuery(e.target.value)}
                    autoFocus
                    style={{
                      flex: 1,
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--text-primary)',
                      fontSize: 12,
                      outline: 'none',
                    }}
                  />
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => {
                      setInChatSearch(false);
                      setChatSearchQuery('');
                    }}
                    style={{ padding: '2px 6px', fontSize: 11 }}
                  >
                    <X size={13} />
                  </button>
                </div>
              )}

              {/* Scrollable Message History */}
              <div
                style={{
                  flex: 1,
                  overflowY: 'auto',
                  padding: '16px 20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                }}
              >
                {/* Event Context Pill at top of chat */}
                {activeEvent && (
                  <div style={{ display: 'flex', justifyContent: 'center', margin: '4px 0 8px' }}>
                    <div
                      style={{
                        fontSize: 11,
                        color: 'var(--text-muted)',
                        background: '#0a1d14',
                        border: '1px solid var(--border)',
                        padding: '4px 12px',
                        borderRadius: 20,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                      }}
                    >
                      <Calendar size={12} style={{ color: 'var(--emerald)' }} />
                      <span>
                        Connected at <strong style={{ color: 'var(--text-primary)' }}>{activeEvent.name}</strong>
                      </span>
                    </div>
                  </div>
                )}

                {/* Subtle Prototype Notice */}
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 6 }}>
                  <div
                    style={{
                      fontSize: 10.5,
                      color: 'var(--text-muted)',
                      background: 'rgba(0, 0, 0, 0.25)',
                      border: '1px solid rgba(160, 255, 205, 0.08)',
                      padding: '3px 10px',
                      borderRadius: 12,
                      textAlign: 'center',
                      maxWidth: '90%',
                    }}
                  >
                    🔒 Prototype Mode: Messages stored locally. Replies are simulated for demonstration.
                  </div>
                </div>

                {/* Messages */}
                {messages.length === 0 ? (
                  <div style={{ margin: 'auto', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <MessageSquare size={32} style={{ opacity: 0.4, margin: '0 auto 8px' }} />
                    <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)' }}>
                      Start the conversation with {activeConn.name}
                    </div>
                    <div style={{ fontSize: 11.5, marginTop: 4 }}>
                      Choose a quick reply below or type a message to follow up.
                    </div>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isMe = msg.sender === 'me';
                    const highlight = chatSearchQuery.trim();

                    // Highlight matching words if search is active
                    let renderedText = msg.text;

                    return (
                      <div
                        key={msg.id}
                        className="msg-enter"
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: isMe ? 'flex-end' : 'flex-start',
                          maxWidth: '82%',
                          alignSelf: isMe ? 'flex-end' : 'flex-start',
                        }}
                      >
                        <div className={isMe ? 'chat-bubble-out' : 'chat-bubble-in'}>
                          {highlight && renderedText.toLowerCase().includes(highlight.toLowerCase()) ? (
                            <span>
                              {renderedText.split(new RegExp(`(${highlight})`, 'gi')).map((part, i) =>
                                part.toLowerCase() === highlight.toLowerCase() ? (
                                  <mark
                                    key={i}
                                    style={{
                                      background: '#FFBA49',
                                      color: '#000',
                                      borderRadius: 2,
                                      padding: '0 2px',
                                    }}
                                  >
                                    {part}
                                  </mark>
                                ) : (
                                  part
                                )
                              )}
                            </span>
                          ) : (
                            renderedText
                          )}

                          {/* Attachment Card if present */}
                          {msg.attachment && (
                            <div
                              style={{
                                marginTop: 8,
                                padding: '8px 10px',
                                borderRadius: 10,
                                background: isMe ? 'rgba(0,0,0,0.15)' : 'rgba(0,0,0,0.3)',
                                border: '1px solid rgba(160, 255, 205, 0.15)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                gap: 10,
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                                <FileText size={16} style={{ color: isMe ? '#04120b' : 'var(--emerald)' }} />
                                <div style={{ minWidth: 0 }}>
                                  <div
                                    style={{
                                      fontSize: 11.5,
                                      fontWeight: 600,
                                      whiteSpace: 'nowrap',
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                    }}
                                  >
                                    {msg.attachment.name}
                                  </div>
                                  <div style={{ fontSize: 10, opacity: 0.75 }}>
                                    {msg.attachment.size || 'Document'}
                                  </div>
                                </div>
                              </div>
                              <button
                                onClick={() => showToast(`Downloaded ${msg.attachment?.name}`, 'success')}
                                style={{
                                  background: 'transparent',
                                  border: 'none',
                                  color: isMe ? '#04120b' : 'var(--emerald)',
                                  cursor: 'pointer',
                                  padding: 4,
                                }}
                                title="Download attachment"
                              >
                                <Download size={14} />
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Timestamp & Status */}
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                            marginTop: 3,
                            fontSize: 10,
                            color: 'var(--text-muted)',
                            padding: '0 4px',
                          }}
                        >
                          <span>{msg.time}</span>
                          {msg.isSimulated && (
                            <span style={{ fontSize: 9.5, opacity: 0.75 }}>· Demo</span>
                          )}
                          {isMe && (
                            <span style={{ display: 'inline-flex', alignItems: 'center', color: 'var(--emerald)' }}>
                              <CheckCheck size={12} />
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}

                {/* Typing Indicator */}
                {isTyping && (
                  <div
                    className="msg-enter"
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                      alignSelf: 'flex-start',
                    }}
                  >
                    <div
                      className="chat-bubble-in"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '8px 12px',
                      }}
                    >
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        {activeConn.name.split(' ')[0]} is typing
                      </span>
                      <span
                        className="typing-dot"
                        style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--emerald)' }}
                      />
                      <span
                        className="typing-dot"
                        style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--emerald)' }}
                      />
                      <span
                        className="typing-dot"
                        style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--emerald)' }}
                      />
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Quick Smart Replies Bar */}
              <div
                style={{
                  padding: '6px 14px',
                  background: '#07160f',
                  borderTop: '1px solid rgba(160, 255, 205, 0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  overflowX: 'auto',
                }}
              >
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    color: 'var(--text-muted)',
                    letterSpacing: 0.5,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 3,
                    flexShrink: 0,
                  }}
                >
                  <Sparkles size={11} style={{ color: 'var(--emerald)' }} /> Quick Reply:
                </span>

                <button
                  className="quick-reply-chip"
                  onClick={() =>
                    handleInsertQuickReply(
                      `Hey ${activeConn.name.split(' ')[0]}! Great meeting you at ${activeEvent?.name || 'the summit'}. Are you free for a quick 15-min call this week?`
                    )
                  }
                >
                  📅 Schedule 15-min call
                </button>

                <button
                  className="quick-reply-chip"
                  onClick={handleAttachDemoFile}
                  title="Attach project deck PDF"
                >
                  📎 Share Project Deck (PDF)
                </button>

                <button
                  className="quick-reply-chip"
                  onClick={() =>
                    handleInsertQuickReply(
                      `Connected with you on LinkedIn as promised! Looking forward to staying in touch.`
                    )
                  }
                >
                  🤝 LinkedIn follow-up
                </button>

                {activeConn.followUpIntention && (
                  <button
                    className="quick-reply-chip"
                    onClick={() =>
                      handleInsertQuickReply(
                        `Following up on our note: "${activeConn.followUpIntention}"`
                      )
                    }
                  >
                    🎯 Action: {activeConn.followUpIntention.slice(0, 24)}…
                  </button>
                )}
              </div>

              {/* Fixed Bottom Message Composer */}
              <div
                style={{
                  padding: '12px 16px',
                  background: '#091c13',
                  borderTop: '1px solid var(--border)',
                  position: 'relative',
                }}
              >
                {/* Emoji Picker Popover */}
                {showEmojiPicker && (
                  <div
                    style={{
                      position: 'absolute',
                      bottom: 58,
                      left: 16,
                      background: '#0b2318',
                      border: '1px solid var(--border)',
                      borderRadius: 14,
                      padding: '8px 10px',
                      display: 'flex',
                      gap: 8,
                      boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
                      zIndex: 30,
                    }}
                  >
                    {['👋', '🔥', '🚀', '🙌', '✅', '💡', '📅', '🎉', '🤝', '💬', '✨', '👍', '👏', '🎯'].map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => handleAddEmoji(emoji)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          fontSize: 18,
                          cursor: 'pointer',
                          padding: 2,
                          transition: 'transform 0.15s ease',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.25)')}
                        onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                )}

                {/* Hidden File Input for Device Attachments */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  style={{ display: 'none' }}
                />

                <form
                  onSubmit={handleSendMessage}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-end',
                    gap: 8,
                    background: '#05130d',
                    border: '1px solid var(--border)',
                    borderRadius: 20,
                    padding: '6px 8px 6px 14px',
                    transition: 'border-color 0.2s',
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--emerald)')}
                  onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
                >
                  <textarea
                    ref={chatInputRef}
                    rows={1}
                    placeholder={`Message ${activeConn.name}… (Enter to send, Shift+Enter for new line)`}
                    value={messageText}
                    onChange={(e) => {
                      setMessageText(e.target.value);
                      e.target.style.height = 'auto';
                      e.target.style.height = `${Math.min(e.target.scrollHeight, 110)}px`;
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        if (messageText.trim()) {
                          handleSendMessage();
                          if (chatInputRef.current) {
                            chatInputRef.current.style.height = 'auto';
                          }
                        }
                      }
                    }}
                    style={{
                      flex: 1,
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--text-primary)',
                      fontSize: 13,
                      outline: 'none',
                      resize: 'none',
                      maxHeight: 110,
                      lineHeight: 1.45,
                      padding: '4px 0',
                      fontFamily: 'inherit',
                    }}
                  />

                  {/* Attachment Button */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="btn btn-ghost btn-sm"
                    title="Attach file from device (or click Project Deck quick chip)"
                    style={{ padding: 6, color: 'var(--text-muted)' }}
                  >
                    <Paperclip size={16} />
                  </button>

                  {/* Emoji Button */}
                  <button
                    type="button"
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className="btn btn-ghost btn-sm"
                    title="Insert emoji"
                    style={{ padding: 6, color: showEmojiPicker ? 'var(--emerald)' : 'var(--text-muted)' }}
                  >
                    <Smile size={16} />
                  </button>

                  {/* Send Button */}
                  <button
                    type="submit"
                    disabled={!messageText.trim()}
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      background: messageText.trim()
                        ? 'linear-gradient(135deg, var(--emerald), var(--mint))'
                        : '#143023',
                      color: messageText.trim() ? '#04120b' : 'var(--text-muted)',
                      border: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: messageText.trim() ? 'pointer' : 'default',
                      transition: 'all 0.2s ease',
                      boxShadow: messageText.trim() ? '0 0 12px rgba(0, 217, 149, 0.4)' : 'none',
                      flexShrink: 0,
                      marginBottom: 2,
                    }}
                    title="Send message"
                  >
                    <Send size={14} style={{ marginLeft: 2 }} />
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div style={{ margin: 'auto', textAlign: 'center', padding: 24 }}>
              <Users size={36} style={{ color: 'var(--text-muted)', margin: '0 auto 12px', opacity: 0.4 }} />
              <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>
                Select a conversation
              </div>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', maxWidth: 300, margin: '8px auto 16px' }}>
                Choose a contact from the left panel to review past conversations or send follow-up messages.
              </p>
              <button className="btn btn-solid" onClick={() => setShowAddModal(true)}>
                <Plus size={14} /> Add New Connection
              </button>
            </div>
          )}
        </main>

        {/* ========================================================
            COLUMN 3: RIGHT CONTEXT & FOLLOW-UP PANEL
           ======================================================== */}
        {activeConn && showRightPanel && (
          <>
            {/* Backdrop when displayed as drawer on narrow screens */}
            <div
              className="chat-right-backdrop"
              onClick={() => setShowRightPanel(false)}
              aria-hidden="true"
            />
            <aside
              className={`chat-panel-right ${showRightPanel ? 'drawer-open' : ''}`}
              aria-label="Connection Details & Follow-up Tracker"
            >
              {/* Header */}
              <div
                style={{
                  padding: '16px 16px 12px',
                  borderBottom: '1px solid var(--border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexShrink: 0,
                }}
              >
                <div>
                  <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                    About {activeConn.name.split(' ')[0]}
                  </h3>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                    {messagingService.isOnline(activeConn.id) ? '🟢 Online now' : '⚪ Offline'}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => setEditConnectionId(activeConn.id)}
                    title="Edit contact info"
                    style={{ padding: 6, color: 'var(--text-muted)' }}
                  >
                    <Edit2 size={13} />
                  </button>
                  <button
                    className="btn btn-ghost btn-sm close-details-btn"
                    onClick={() => setShowRightPanel(false)}
                    title="Close info panel"
                    id="close-details-btn"
                    style={{ padding: 6, cursor: 'pointer' }}
                  >
                    <X size={15} />
                  </button>
                </div>
              </div>

              {/* Content Details */}
              <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* Profile Card */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div
                    className="connection-avatar"
                    style={{
                      width: 44,
                      height: 44,
                      fontSize: 15,
                      background: getAvatarGradient(activeConn.avatarColor),
                    }}
                  >
                    {getInitials(activeConn.name)}
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {activeConn.name}
                    </div>
                    <div style={{ fontSize: 11.5, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {activeConn.role || 'Attendee'}
                      {activeConn.organization ? ` · ${activeConn.organization}` : ''}
                    </div>
                  </div>
                </div>

                {/* Contact Links */}
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                    fontSize: 12,
                    background: 'rgba(0,0,0,0.2)',
                    borderRadius: 10,
                    padding: 10,
                    border: '1px solid var(--border)',
                  }}
                >
                  {activeConn.email && (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                      <a
                        href={`mailto:${activeConn.email}`}
                        style={{
                          color: 'var(--text-secondary)',
                          textDecoration: 'none',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          minWidth: 0,
                        }}
                      >
                        <Mail size={12} style={{ color: 'var(--emerald)', flexShrink: 0 }} />
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{activeConn.email}</span>
                      </a>
                      <button
                        onClick={() => {
                          navigator.clipboard?.writeText(activeConn.email || '');
                          showToast(`Copied ${activeConn.email}`, 'success');
                        }}
                        style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 2, flexShrink: 0 }}
                        title="Copy email"
                      >
                        <Copy size={11} />
                      </button>
                    </div>
                  )}

                  {activeConn.linkedin && (
                    <a
                      href={`https://${activeConn.linkedin.replace(/^https?:\/\//, '')}`}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        color: 'var(--text-secondary)',
                        textDecoration: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      <Link size={12} style={{ color: 'var(--emerald)', flexShrink: 0 }} />
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{activeConn.linkedin}</span>
                    </a>
                  )}

                  {activeConn.phone && (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0 }}>
                        <Phone size={12} style={{ color: 'var(--emerald)', flexShrink: 0 }} />
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: 500, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
                          {activeConn.phone}
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          navigator.clipboard?.writeText(activeConn.phone || '');
                          showToast(`Copied ${activeConn.phone}`, 'success');
                        }}
                        style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 2, flexShrink: 0 }}
                        title="Copy phone number"
                      >
                        <Copy size={11} />
                      </button>
                    </div>
                  )}
                </div>

              {/* Event Met At Card */}
              <div
                style={{
                  padding: 12,
                  borderRadius: 10,
                  background: '#0a2016',
                  border: '1px solid var(--border)',
                }}
              >
                <div style={{ fontSize: 10.5, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>
                  Event Met At
                </div>
                <div
                  style={{
                    fontSize: 12.5,
                    fontWeight: 600,
                    color: 'var(--emerald)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    cursor: activeEvent ? 'pointer' : 'default',
                  }}
                  onClick={() => activeEvent && navigate(`/events/${activeEvent.id}`)}
                  title={activeEvent ? 'View Event Workspace' : undefined}
                >
                  <Calendar size={13} />
                  <span>{activeEvent?.name || 'General Networking'}</span>
                </div>
              </div>

              {/* Editable Quick Notes */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>Personal Notes</span>
                  <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Auto-saved</span>
                </div>
                <textarea
                  rows={3}
                  value={localNotes}
                  onChange={(e) => handleSaveNotes(e.target.value)}
                  placeholder="Notes from your conversation, shared interests, ideas discussed…"
                  style={{
                    width: '100%',
                    background: '#05130d',
                    border: '1px solid var(--border)',
                    borderRadius: 10,
                    padding: '8px 10px',
                    fontSize: 12,
                    color: 'var(--text-primary)',
                    outline: 'none',
                    resize: 'none',
                    lineHeight: 1.5,
                  }}
                  onFocus={(e) => (e.target.style.borderColor = 'var(--emerald)')}
                  onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
                />
              </div>

              {/* Follow-Up Action Card */}
              <div
                style={{
                  padding: 12,
                  borderRadius: 10,
                  background: '#05130d',
                  border: '1px solid var(--border)',
                  borderLeft: `3.5px solid ${
                    activeConn.followUpStatus === 'overdue'
                      ? '#FF6363'
                      : activeConn.followUpStatus === 'completed'
                      ? 'var(--emerald)'
                      : '#FFBA49'
                  }`,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 10.5, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    Follow-Up Action
                  </span>
                  {activeConn.followUpIntention && (
                    <button
                      onClick={() => handleInsertQuickReply(`Following up on: "${activeConn.followUpIntention}"`)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--emerald)',
                        fontSize: 11,
                        fontWeight: 600,
                        cursor: 'pointer',
                        padding: 0,
                      }}
                    >
                      Send in chat →
                    </button>
                  )}
                </div>

                <p style={{ fontSize: 12, color: 'var(--text-primary)', lineHeight: 1.5, margin: '0 0 10px' }}>
                  {activeConn.followUpIntention || 'No follow-up action set.'}
                </p>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingTop: 8,
                    borderTop: '1px solid rgba(160, 255, 205, 0.08)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11.5 }}>
                    {activeConn.followUpStatus === 'completed' ? (
                      <span style={{ color: 'var(--emerald)', display: 'flex', alignItems: 'center', gap: 4, fontWeight: 500 }}>
                        <CheckCircle size={12} /> Done
                      </span>
                    ) : activeConn.followUpStatus === 'overdue' ? (
                      <span style={{ color: '#FF6363', display: 'flex', alignItems: 'center', gap: 4, fontWeight: 500 }}>
                        <AlertCircle size={12} /> Overdue {activeConn.followUpDate ? `· ${activeConn.followUpDate}` : ''}
                      </span>
                    ) : (
                      <span style={{ color: '#FFBA49', display: 'flex', alignItems: 'center', gap: 4, fontWeight: 500 }}>
                        <Clock size={12} /> Pending {activeConn.followUpDate ? `· ${activeConn.followUpDate}` : ''}
                      </span>
                    )}
                  </div>

                  <button
                    className={`btn btn-sm ${activeConn.followUpStatus === 'completed' ? 'btn-ghost' : 'btn-outline'}`}
                    onClick={handleToggleFollowUp}
                    style={{ fontSize: 11, padding: '3px 8px' }}
                  >
                    {activeConn.followUpStatus === 'completed' ? 'Reopen' : 'Mark Done'}
                  </button>
                </div>
              </div>

              {/* Bottom Quick Actions */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingTop: 4 }}>
                <button
                  className="btn btn-outline btn-sm"
                  onClick={handleSyncToSmartNotes}
                  style={{ width: '100%', justifyContent: 'center', fontSize: 11.5 }}
                >
                  <FileText size={13} /> Sync to Smart Notes
                </button>

                <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => setClearChatConfirmId(activeConn.id)}
                    style={{ flex: 1, justifyContent: 'center', fontSize: 11, color: 'var(--text-muted)' }}
                  >
                    Clear Chat
                  </button>
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => setDeleteConfirmId(activeConn.id)}
                    style={{ flex: 1, justifyContent: 'center', fontSize: 11, color: '#FF6363' }}
                  >
                    <Trash2 size={12} /> Remove
                  </button>
                </div>
              </div>
            </div>
          </aside>
        </>
      )}
      </div>

      {/* Call Preview Modal */}
      {showCallModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.75)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: 16,
          }}
          onClick={() => setShowCallModal(null)}
        >
          <div
            className="card"
            style={{ maxWidth: 420, width: '100%', padding: 22 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: 'rgba(0, 217, 149, 0.15)',
                  color: 'var(--emerald)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {showCallModal.type === 'video' ? <Video size={18} /> : <PhoneCall size={18} />}
              </div>
              <div>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                  {showCallModal.type === 'video' ? 'Video Meeting Preview' : 'Audio Call Preview'}
                </h3>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  Calling {showCallModal.name}
                </div>
              </div>
            </div>

            <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              In this client prototype, direct live voice/video streams require a WebRTC signaling server
              (such as LiveKit, Daily.co, or Agora). Text messaging and follow-ups are active and running in local demo mode!
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 18 }}>
              <button className="btn btn-solid btn-sm" onClick={() => setShowCallModal(null)}>
                Back to Direct Chat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Connection Form Modal */}
      {(showAddModal || editConnectionId) && (
        <ConnectionFormModal
          connectionId={editConnectionId || undefined}
          onClose={() => {
            setShowAddModal(false);
            setEditConnectionId(null);
          }}
        />
      )}

      {/* Delete Connection Confirmation Dialog */}
      {deleteConfirmId && (
        <ConfirmDialog
          title="Remove Connection"
          message="Remove this person from your connections? Their follow-up information will be lost."
          confirmLabel="Remove"
          onConfirm={handleDeleteConnection}
          onCancel={() => setDeleteConfirmId(null)}
        />
      )}

      {/* Clear Chat Confirmation Dialog */}
      {clearChatConfirmId && (
        <ConfirmDialog
          title="Clear Conversation History"
          message="Are you sure you want to clear all message history with this connection? Contact information will remain intact."
          confirmLabel="Clear Messages"
          onConfirm={handleClearChat}
          onCancel={() => setClearChatConfirmId(null)}
        />
      )}
    </AppLayout>
  );
}
