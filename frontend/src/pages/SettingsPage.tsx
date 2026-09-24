import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export function SettingsPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 text-2xl font-semibold text-ink-900 dark:text-ink-100">Settings</h1>

      <div className="rounded-2xl border border-ink-200 bg-white p-6 dark:border-ink-800 dark:bg-ink-900">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-ink-400">Profile</h2>
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-plum-500 text-xl font-semibold text-white">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-medium text-ink-900 dark:text-ink-100">{user?.name}</p>
            <p className="text-sm text-ink-500 dark:text-ink-400">{user?.email}</p>
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-ink-200 bg-white p-6 dark:border-ink-800 dark:bg-ink-900">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-ink-400">Privacy</h2>
        <p className="text-sm text-ink-500 dark:text-ink-400">
          All entries default to <span className="font-medium text-ink-700 dark:text-ink-300">Private</span>. Your
          journal content is never sent to the AI provider except when you explicitly request analysis, and only
          your own entries are ever used.
        </p>
      </div>

      <button
        onClick={async () => {
          await logout();
          navigate("/login");
        }}
        className="mt-6 rounded-xl border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-500 hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-950"
      >
        Log out
      </button>
    </div>
  );
}
