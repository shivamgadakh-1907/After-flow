import { useState, useEffect } from 'react';
import { useNavigate, NavLink, useLocation } from 'react-router-dom';
import {
  Search, Bell, Plus, LayoutDashboard, Calendar,
  FileText, CheckSquare, Users, BarChart3, Settings,
  Menu, X, ArrowRight,
} from 'lucide-react';
import { messagingService } from '../services/messagingService';
import { useSidebar } from '../SidebarContext';

const MAIN_BOTTOM_NAV = [
  { to: '/', icon: LayoutDashboard, label: 'Overview' },
  { to: '/events', icon: Calendar, label: 'Events' },
  { to: '/actions', icon: CheckSquare, label: 'Actions' },
  { to: '/connections', icon: Users, label: 'Connections' },
];

const ALL_DRAWER_NAV = [
  { to: '/', icon: LayoutDashboard, label: 'Overview' },
  { to: '/events', icon: Calendar, label: 'My Events' },
  { to: '/notes', icon: FileText, label: 'Smart Notes' },
  { to: '/actions', icon: CheckSquare, label: 'Action Board' },
  { to: '/connections', icon: Users, label: 'Connections' },
  { to: '/analytics', icon: BarChart3, label: 'Progress Analytics' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

interface TopbarProps {
  title?: string;
}

export default function Topbar({ title }: TopbarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { isCollapsed, toggleSidebar } = useSidebar();
  const [search, setSearch] = useState('');
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(() => messagingService.getUnreadCount());

  useEffect(() => {
    return messagingService.subscribe(() => {
      setUnreadCount(messagingService.getUnreadCount());
    });
  }, []);

  // Close drawer on route change
  useEffect(() => {
    setDrawerOpen(false);
    setShowMobileSearch(false);
  }, [location.pathname]);

  // Close drawer on Escape or toggle with Ctrl+B
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setDrawerOpen(false);
        setShowMobileSearch(false);
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        toggleSidebar();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleSidebar]);

  return (
    <>
      <header className="topbar">
        {/* Sidebar Toggle Button (Desktop & Mobile) */}
        <button
          className="topbar-btn sidebar-toggle-btn"
          onClick={toggleSidebar}
          aria-label={isCollapsed ? "Expand navigation sidebar" : "Collapse navigation sidebar"}
          title={isCollapsed ? "Expand sidebar (Ctrl+B)" : "Collapse sidebar (Ctrl+B)"}
          id="sidebar-toggle-btn"
          style={{ padding: '8px 10px', minWidth: 40, minHeight: 40, justifyContent: 'center', flexShrink: 0 }}
        >
          <Menu size={18} />
        </button>

        {/* Mobile Brand / Page Title */}
        <div className="mobile-topbar-brand" style={{ display: 'none', alignItems: 'center', gap: 8, cursor: 'pointer' }} onClick={() => navigate('/')}>
          <img
            src="/logo-mark.png"
            alt="AfterFlow"
            style={{
              width: 30,
              height: 30,
              borderRadius: 7,
              objectFit: 'contain',
              filter: 'drop-shadow(0 0 8px rgba(16, 185, 129, 0.45))',
              flexShrink: 0,
            }}
          />
          <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 16, color: 'var(--text-primary)', letterSpacing: '-0.3px', whiteSpace: 'nowrap' }}>
            {title || 'AfterFlow'}
          </span>
        </div>

        {/* Desktop Title if present */}
        {title && (
          <span className="desktop-page-title" style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 17, color: 'var(--text-primary)', whiteSpace: 'nowrap', flexShrink: 0 }}>
            {title}
          </span>
        )}

        {/* Search */}
        <div className={`topbar-search ${showMobileSearch ? 'mobile-search-active' : ''}`}>
          <span className="topbar-search-icon">
            <Search size={14} />
          </span>
          <input
            id="global-search"
            type="text"
            placeholder="Search events, notes, actions…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Global search"
          />
          {showMobileSearch && (
            <button
              className="btn btn-ghost btn-sm"
              style={{ position: 'absolute', right: 4, top: '50%', transform: 'translateY(-50%)', padding: 4 }}
              onClick={() => setShowMobileSearch(false)}
              aria-label="Close search"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div className="topbar-spacer" />

        {/* Right Action Controls Group */}
        <div className="topbar-right-controls" style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          {/* Mobile Search Toggle Button */}
          <button
            className="topbar-btn mobile-search-btn"
            onClick={() => setShowMobileSearch(!showMobileSearch)}
            aria-label="Toggle search"
            style={{ display: 'none', padding: '8px 10px', minWidth: 40, minHeight: 40 }}
          >
            <Search size={16} />
          </button>

          {/* Notification */}
          <button
            className="topbar-btn"
            style={{ position: 'relative', padding: '8px 10px', minWidth: 40, minHeight: 40, justifyContent: 'center' }}
            aria-label="Notifications"
            id="notification-btn"
          >
            <Bell size={16} />
            <span className="notification-dot" />
          </button>

          {/* New Event Button (Desktop text, compact on mobile) */}
          <button
            className="btn-primary desktop-new-event-btn"
            onClick={() => navigate('/events/new')}
            id="topbar-new-event-btn"
            style={{ minHeight: 38 }}
          >
            <Plus size={15} />
            <span>New Event</span>
          </button>

          {/* Avatar / Menu trigger */}
          <div
            className="topbar-avatar"
            role="button"
            tabIndex={0}
            aria-label="Open menu"
            id="profile-avatar"
            onClick={() => setDrawerOpen(true)}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setDrawerOpen(true); }}
            style={{ width: 36, height: 36, flexShrink: 0 }}
          >
            S
          </div>
        </div>
      </header>

      {/* Mobile bottom nav */}
      <nav className="mobile-nav" role="navigation" aria-label="Mobile navigation">
        {MAIN_BOTTOM_NAV.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) => `mobile-nav-item${isActive ? ' active' : ''}`}
            style={{ position: 'relative' }}
          >
            <div style={{ position: 'relative', display: 'inline-flex' }}>
              <Icon size={19} strokeWidth={1.8} />
              {to === '/connections' && unreadCount > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: -2,
                    right: -5,
                    width: 7,
                    height: 7,
                    borderRadius: '50%',
                    background: 'var(--emerald)',
                    boxShadow: '0 0 6px var(--emerald)',
                  }}
                />
              )}
            </div>
            <span>{label}</span>
          </NavLink>
        ))}

        {/* More / Menu tab */}
        <button
          type="button"
          className={`mobile-nav-item${drawerOpen ? ' active' : ''}`}
          onClick={() => setDrawerOpen(!drawerOpen)}
          aria-label="More navigation options"
        >
          <Menu size={19} strokeWidth={1.8} />
          <span>More</span>
        </button>
      </nav>

      {/* Mobile Drawer Backdrop */}
      <div
        className={`mobile-drawer-overlay ${drawerOpen ? 'open' : ''}`}
        onClick={() => setDrawerOpen(false)}
        aria-hidden="true"
      />

      {/* Mobile Slide-out Drawer */}
      <aside className={`mobile-drawer ${drawerOpen ? 'open' : ''}`} aria-label="Mobile menu">
        {/* Drawer Header */}
        <div style={{ padding: '18px 16px 14px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }} onClick={() => { navigate('/'); setDrawerOpen(false); }}>
            <img
              src="/logo-mark.png"
              alt="AfterFlow"
              style={{
                width: 34,
                height: 34,
                borderRadius: 8,
                objectFit: 'contain',
                filter: 'drop-shadow(0 0 10px rgba(16, 185, 129, 0.45))',
                flexShrink: 0,
              }}
            />
            <div>
              <div className="sidebar-logo-text" style={{ fontSize: 17 }}>AfterFlow</div>
              <div className="sidebar-logo-sub">Build 01</div>
            </div>
          </div>
          <button
            className="btn btn-ghost"
            style={{ padding: 6, minWidth: 36, minHeight: 36 }}
            onClick={() => setDrawerOpen(false)}
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>

        {/* User Card in Drawer */}
        <div style={{ padding: '12px 14px', margin: '12px 12px 6px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border)', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
          <div className="topbar-avatar" style={{ width: 32, height: 32, fontSize: 12 }}>
            S
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>Shivam</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Pro Member</div>
          </div>
          <NavLink to="/settings" style={{ color: 'var(--emerald)', textDecoration: 'none', display: 'flex' }}>
            <ArrowRight size={14} />
          </NavLink>
        </div>

        {/* Nav Links */}
        <nav style={{ flex: 1, padding: '10px 10px', display: 'flex', flexDirection: 'column', gap: 2 }}>
          <div className="nav-section-label">Navigation</div>
          {ALL_DRAWER_NAV.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
              style={{ minHeight: 42, padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span className="nav-item-icon">
                  <Icon size={17} strokeWidth={1.8} />
                </span>
                <span>{label}</span>
              </div>
              {to === '/connections' && unreadCount > 0 && (
                <span style={{
                  background: 'var(--emerald)',
                  color: '#04120b',
                  fontSize: 10,
                  fontWeight: 700,
                  borderRadius: 10,
                  padding: '1px 6px',
                }}>
                  {unreadCount}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Drawer Bottom Action */}
        <div style={{ padding: '14px 14px 6px', borderTop: '1px solid var(--border)' }}>
          <button
            className="btn btn-solid"
            style={{ width: '100%', justifyContent: 'center', minHeight: 44 }}
            onClick={() => { setDrawerOpen(false); navigate('/events/new'); }}
          >
            <Plus size={16} />
            New Event
          </button>
        </div>
      </aside>
    </>
  );
}
