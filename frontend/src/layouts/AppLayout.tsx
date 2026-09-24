import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import {
  LayoutDashboard,
  BookOpen,
  Calendar,
  Sparkles,
  BarChart3,
  ListChecks,
  Target,
  Search,
  Settings,
  Menu,
  X,
  Feather,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

const NAV_ITEMS = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/journal", label: "Journal", icon: BookOpen },
  { to: "/calendar", label: "Calendar", icon: Calendar },
  { to: "/insights", label: "AI Insights", icon: Sparkles },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/habits", label: "Habits", icon: ListChecks },
  { to: "/goals", label: "Goals", icon: Target },
  { to: "/search", label: "Search", icon: Search },
  { to: "/settings", label: "Settings", icon: Settings },
];

export function AppLayout() {
  const { user } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-ink-50 dark:bg-ink-950">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-ink-200 bg-white p-5 dark:border-ink-800 dark:bg-ink-900 md:flex">
        <SidebarContent userName={user?.name} />
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/30" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-72 bg-white p-5 dark:bg-ink-900">
            <button
              className="mb-4 rounded-lg p-2 text-ink-500 hover:bg-ink-100 dark:hover:bg-ink-800"
              onClick={() => setMobileOpen(false)}
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
            <SidebarContent userName={user?.name} onNavigate={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-ink-200 bg-white px-4 py-3 dark:border-ink-800 dark:bg-ink-900 md:hidden">
          <div className="flex items-center gap-2 font-semibold text-ink-900 dark:text-ink-100">
            <Feather className="h-5 w-5 text-plum-500" />
            MindVault
          </div>
          <button
            className="rounded-lg p-2 text-ink-500 hover:bg-ink-100 dark:hover:bg-ink-800"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        </header>

        <main className="flex-1 p-4 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function SidebarContent({ userName, onNavigate }: { userName?: string; onNavigate?: () => void }) {
  return (
    <>
      <div className="mb-8 flex items-center gap-2 px-1 text-lg font-semibold text-ink-900 dark:text-ink-100">
        <Feather className="h-5 w-5 text-plum-500" />
        MindVault
      </div>
      <nav className="flex flex-1 flex-col gap-1">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onNavigate}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                isActive
                  ? "bg-plum-100 text-plum-700 dark:bg-ink-800 dark:text-plum-300"
                  : "text-ink-500 hover:bg-ink-100 hover:text-ink-900 dark:hover:bg-ink-800 dark:hover:text-ink-100"
              }`
            }
          >
            <Icon className="h-4.5 w-4.5" />
            {label}
          </NavLink>
        ))}
      </nav>
      {userName && (
        <NavLink
          to="/profile"
          onClick={onNavigate}
          className="mt-4 flex items-center gap-2 rounded-xl border border-ink-200 px-3 py-2.5 text-sm text-ink-600 dark:border-ink-800 dark:text-ink-300"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-plum-500 text-sm font-semibold text-white">
            {userName.charAt(0).toUpperCase()}
          </div>
          <span className="truncate">{userName}</span>
        </NavLink>
      )}
    </>
  );
}
