import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Feather } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { AuthShell } from "../components/AuthShell";

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password);
      navigate("/dashboard");
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthShell>
      <div className="mb-6 flex items-center gap-2 text-lg font-semibold text-ink-900 dark:text-ink-100">
        <Feather className="h-5 w-5 text-plum-500" />
        MindVault
      </div>
      <h1 className="text-2xl font-semibold text-ink-900 dark:text-ink-50">Welcome back</h1>
      <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">Log in to continue your journal.</p>

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
        <Field label="Email" type="email" value={email} onChange={setEmail} autoComplete="email" required />
        <Field
          label="Password"
          type="password"
          value={password}
          onChange={setPassword}
          autoComplete="current-password"
          required
        />

        {error && <p className="text-sm text-red-500">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="mt-2 rounded-xl bg-plum-600 py-2.5 text-sm font-semibold text-white transition hover:bg-plum-500 disabled:opacity-60"
        >
          {submitting ? "Logging in…" : "Log in"}
        </button>
      </form>

      <div className="mt-4 flex justify-between text-sm">
        <Link to="/forgot-password" className="text-ink-500 hover:text-ink-800 dark:text-ink-400">
          Forgot password?
        </Link>
        <Link to="/register" className="font-medium text-plum-600 hover:text-plum-500">
          Create an account
        </Link>
      </div>
    </AuthShell>
  );
}

export function Field({
  label,
  type,
  value,
  onChange,
  autoComplete,
  required,
}: {
  label: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete?: string;
  required?: boolean;
}) {
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span className="font-medium text-ink-700 dark:text-ink-300">{label}</span>
      <input
        type={type}
        value={value}
        required={required}
        autoComplete={autoComplete}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-xl border border-ink-200 bg-white px-3.5 py-2.5 text-ink-900 outline-none transition focus:border-plum-400 focus:ring-2 focus:ring-plum-100 dark:border-ink-700 dark:bg-ink-900 dark:text-ink-100 dark:focus:ring-ink-800"
      />
    </label>
  );
}
