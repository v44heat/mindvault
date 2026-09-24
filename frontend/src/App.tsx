import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AppLayout } from "./layouts/AppLayout";

import { LandingPage } from "./pages/LandingPage";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { DashboardPage } from "./pages/DashboardPage";
import { JournalListPage } from "./pages/JournalListPage";
import { EntryEditorPage } from "./pages/EntryEditorPage";
import { EntryDetailsPage } from "./pages/EntryDetailsPage";
import { ArchivePage } from "./pages/ArchivePage";
import { TrashPage } from "./pages/TrashPage";
import { CalendarPage } from "./pages/CalendarPage";
import { InsightsPage } from "./pages/InsightsPage";
import { SearchPage } from "./pages/SearchPage";
import { HabitsPage } from "./pages/HabitsPage";
import { GoalsPage } from "./pages/GoalsPage";
import { AnalyticsPage } from "./pages/AnalyticsPage";
import { SettingsPage } from "./pages/SettingsPage";

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/journal" element={<JournalListPage />} />
            <Route path="/journal/new" element={<EntryEditorPage />} />
            <Route path="/journal/archive" element={<ArchivePage />} />
            <Route path="/journal/trash" element={<TrashPage />} />
            <Route path="/journal/:id" element={<EntryDetailsPage />} />
            <Route path="/journal/:id/edit" element={<EntryEditorPage />} />
            <Route path="/calendar" element={<CalendarPage />} />
            <Route path="/insights" element={<InsightsPage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/habits" element={<HabitsPage />} />
            <Route path="/goals" element={<GoalsPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/profile" element={<SettingsPage />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}
