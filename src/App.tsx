import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ToastProvider } from './ToastContext';
import { SidebarProvider } from './SidebarContext';

import Dashboard from './pages/Dashboard';
import EventsPage from './pages/EventsPage';
import EventForm from './pages/EventForm';
import EventWorkspace from './pages/EventWorkspace';
import NotesPage from './pages/NotesPage';
import SmartCapturePage from './pages/SmartCapturePage';
import NoteDetail from './pages/NoteDetail';
import ActionBoard from './pages/ActionBoard';
import ConnectionsPage from './pages/ConnectionsPage';
import AnalyticsPage from './pages/AnalyticsPage';
import SettingsPage from './pages/SettingsPage';

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <SidebarProvider>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/events" element={<EventsPage />} />
            <Route path="/events/new" element={<EventForm />} />
            <Route path="/events/:id" element={<EventWorkspace />} />
            <Route path="/events/:id/edit" element={<EventForm />} />
            <Route path="/notes" element={<NotesPage />} />
            <Route path="/notes/new" element={<SmartCapturePage />} />
            <Route path="/notes/:id" element={<NoteDetail />} />
            <Route path="/actions" element={<ActionBoard />} />
            <Route path="/actions/new" element={<ActionBoard />} />
            <Route path="/connections" element={<ConnectionsPage />} />
            <Route path="/connections/new" element={<ConnectionsPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            {/* Fallback */}
            <Route path="*" element={<Dashboard />} />
          </Routes>
        </SidebarProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}
