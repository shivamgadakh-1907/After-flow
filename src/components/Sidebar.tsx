import { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Calendar, FileText, CheckSquare,
  Users, BarChart3, Settings, Plus, X
} from 'lucide-react';
import { messagingService } from '../services/messagingService';
import { useSidebar } from '../SidebarContext';

const NAV = [
  { to: '/', icon: LayoutDashboard, label: 'Overview' },
  { to: '/events', icon: Calendar, label: 'My Events' },
  { to: '/notes', icon: FileText, label: 'Smart Notes' },
  { to: '/actions', icon: CheckSquare, label: 'Action Board' },
  { to: '/connections', icon: Users, label: 'Connections', hasBadge: true },
  { to: '/analytics', icon: BarChart3, label: 'Progress Analytics' },
];

export default function Sidebar() {
  const navigate = useNavigate();
  const { isCollapsed, isMobileOpen, setIsMobileOpen } = useSidebar();
  const [unreadCount, setUnreadCount] = useState(() => messagingService.getUnreadCount());

  useEffect(() => {
    return messagingService.subscribe(() => {
      setUnreadCount(messagingService.getUnreadCount());
    });
  }, []);

  const handleNavClick = () => {
    setIsMobileOpen(false);
  };

  return (
    <>
      {/* Mobile Drawer Overlay Backdrop */}
      <div
        className={`sidebar-backdrop ${isMobileOpen ? 'open' : ''}`}
        onClick={() => setIsMobileOpen(false)}
        aria-hidden="true"
      />

      <aside
        id="appSidebar"
        className={`sidebar ${isCollapsed ? 'collapsed' : ''} ${isMobileOpen ? 'mobile-open' : ''}`}
        aria-label="Application navigation"
      >
        {/* Logo Header */}
        <div className="sidebar-logo" style={{ cursor: 'pointer', justifyContent: 'space-between' }}>
          <div
            style={{ display: 'flex', alignItems: 'center', gap: 10 }}
            onClick={() => {
              navigate('/');
              handleNavClick();
            }}
          >
            <img src="/logo-mark.png" alt="AfterFlow logo" className="sidebar-logo-img" />
            <div>
              <div className="sidebar-logo-text">AfterFlow</div>
              <div className="sidebar-logo-sub">Build 01</div>
            </div>
          </div>

          {/* Close button on mobile drawer */}
          <button
            className="sidebar-mobile-close-btn"
            onClick={() => setIsMobileOpen(false)}
            aria-label="Close navigation"
          >
            <X size={16} />
          </button>
        </div>

        {/* Nav */}
        <nav className="sidebar-nav">
          <div className="nav-section-label">Main</div>
          {NAV.map(({ to, icon: Icon, label, hasBadge }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              onClick={handleNavClick}
              className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span className="nav-item-icon">
                  <Icon size={16} strokeWidth={1.8} />
                </span>
                {label}
              </div>
              {hasBadge && unreadCount > 0 && (
                <span
                  style={{
                    background: 'var(--emerald)',
                    color: '#04120b',
                    fontSize: 10.5,
                    fontWeight: 700,
                    borderRadius: 10,
                    padding: '1px 6px',
                    lineHeight: 1.4,
                    boxShadow: '0 0 10px rgba(0, 217, 149, 0.4)',
                  }}
                >
                  {unreadCount}
                </span>
              )}
            </NavLink>
          ))}

          <div className="nav-section-label" style={{ marginTop: 8 }}>Account</div>
          <NavLink
            to="/settings"
            onClick={handleNavClick}
            className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
          >
            <span className="nav-item-icon"><Settings size={16} strokeWidth={1.8} /></span>
            Settings
          </NavLink>
        </nav>

        {/* Bottom action */}
        <div className="sidebar-bottom">
          <button
            className="btn btn-solid"
            style={{ width: '100%', justifyContent: 'center' }}
            onClick={() => {
              handleNavClick();
              navigate('/events/new');
            }}
          >
            <Plus size={15} />
            New Event
          </button>
        </div>
      </aside>
    </>
  );
}
