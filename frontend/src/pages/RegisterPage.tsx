import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Feather } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { AuthShell } from "../components/AuthShell";
import { Field } from "./LoginPage";

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await register(name, email, password);
      navigate("/onboarding");
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
      <h1 className="text-2xl font-semibold text-ink-900 dark:text-ink-50">Create your journal</h1>
      <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">Private by default. Always yours.</p>

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
        <Field label="Name" type="text" value={name} onChange={setName} autoComplete="name" required />
        <Field label="Email" type="email" value={email} onChange={setEmail} autoComplete="email" required />
        <Field
          label="Password"
          type="password"
          value={password}
          onChange={setPassword}
          autoComplete="new-password"
          required
        />
        <p className="-mt-2 text-xs text-ink-400">Must be at least 8 characters.</p>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="mt-2 rounded-xl bg-plum-600 py-2.5 text-sm font-semibold text-white transition hover:bg-plum-500 disabled:opacity-60"
        >
          {submitting ? "Creating account…" : "Create account"}
        </button>
      </form>

      <div className="mt-4 text-center text-sm">
        <span className="text-ink-500 dark:text-ink-400">Already have an account? </span>
        <Link to="/login" className="font-medium text-plum-600 hover:text-plum-500">
          Log in
        </Link>
      </div>
    </AuthShell>
  );
}
