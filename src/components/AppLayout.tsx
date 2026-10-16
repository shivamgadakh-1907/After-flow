import { useEffect, useRef } from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { useSidebar } from '../SidebarContext';

interface AppLayoutProps {
  children: React.ReactNode;
  title?: string;
  isChatPage?: boolean;
}

export default function AppLayout({ children, title, isChatPage }: AppLayoutProps) {
  const { isCollapsed } = useSidebar();
  const mainRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const main = mainRef.current;
    if (!main) return;

    let lastCard: HTMLElement | null = null;

    function handleMouseMove(e: MouseEvent) {
      // Find the nearest .card ancestor of the event target
      const target = e.target as Element;
      const card = target.closest('.card') as HTMLElement | null;

      // If we've moved to a new card, reset the old one
      if (lastCard && lastCard !== card) {
        lastCard.style.setProperty('--neon-x', '-200%');
        lastCard.style.setProperty('--neon-y', '-200%');
      }

      if (card) {
        const rect = card.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        card.style.setProperty('--neon-x', `${x}%`);
        card.style.setProperty('--neon-y', `${y}%`);
      }

      lastCard = card;
    }

    function handleMouseLeave(e: MouseEvent) {
      const target = e.target as Element;
      const card = target.closest('.card') as HTMLElement | null;
      if (card) {
        card.style.setProperty('--neon-x', '-200%');
        card.style.setProperty('--neon-y', '-200%');
      }
      if (lastCard) {
        lastCard.style.setProperty('--neon-x', '-200%');
        lastCard.style.setProperty('--neon-y', '-200%');
        lastCard = null;
      }
    }

    main.addEventListener('mousemove', handleMouseMove, { passive: true });
    main.addEventListener('mouseleave', handleMouseLeave, { passive: true });

    return () => {
      main.removeEventListener('mousemove', handleMouseMove);
      main.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  return (
    <div className={`app-layout ${isCollapsed ? 'sidebar-is-collapsed' : ''}`}>
      <Sidebar />
      <div className="main-content">
        <Topbar title={title} />
        <main ref={mainRef} className={`page-content ${isChatPage ? 'page-content-chat' : ''}`} role="main">
          {children}
        </main>
      </div>
    </div>
  );
}
