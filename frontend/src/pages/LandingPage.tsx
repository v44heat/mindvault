import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Feather,
  Sparkles,
  Search,
  Mic,
  SmilePlus,
  Clock,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";

const FEATURES = [
  {
    icon: Sparkles,
    title: "AI-powered journaling",
    desc: "Get summaries, themes, and reflection prompts pulled straight from what you actually wrote — never invented.",
  },
  {
    icon: Search,
    title: "Intelligent search",
    desc: "Find entries by meaning, not just keywords. \"That time I was stuck on a database problem\" just works.",
  },
  {
    icon: Mic,
    title: "Voice journaling",
    desc: "Speak your thoughts. MindVault transcribes, analyzes, and files them alongside your written entries.",
  },
  {
    icon: SmilePlus,
    title: "Mood tracking",
    desc: "Log how you feel in seconds and watch patterns emerge over weeks and months.",
  },
  {
    icon: Clock,
    title: "Timeline & memories",
    desc: "Scroll your life chronologically, or let \"On This Day\" resurface entries from years past.",
  },
  {
    icon: ShieldCheck,
    title: "Privacy-first architecture",
    desc: "Everything is private by default, strictly scoped to your account, never used to train anything.",
  },
];

export function LandingPage() {
  return (
    <div className="min-h-screen bg-ink-50 dark:bg-ink-950">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2 text-lg font-semibold text-ink-900 dark:text-ink-100">
          <Feather className="h-5 w-5 text-plum-500" />
          MindVault
        </div>
        <div className="flex items-center gap-3">
          <Link to="/login" className="text-sm font-medium text-ink-600 hover:text-ink-900 dark:text-ink-300 dark:hover:text-white">
            Log in
          </Link>
          <Link
            to="/register"
            className="rounded-full bg-plum-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-plum-500"
          >
            Start Journaling
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-4xl px-6 pb-16 pt-10 text-center md:pt-20">
        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-4xl font-semibold tracking-tight text-ink-900 dark:text-ink-50 md:text-6xl"
        >
          Your thoughts. Your memories.
          <br />
          <span className="text-plum-600 dark:text-plum-400">Your story.</span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mx-auto mt-5 max-w-2xl text-lg text-ink-500 dark:text-ink-400"
        >
          An intelligent private journal that helps you write, reflect, organize your memories,
          and discover patterns across your personal journey.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-8 flex flex-wrap items-center justify-center gap-3"
        >
          <Link
            to="/register"
            className="flex items-center gap-2 rounded-full bg-plum-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-plum-500"
          >
            Start Journaling <ArrowRight className="h-4 w-4" />
          </Link>
          <a
            href="#features"
            className="rounded-full border border-ink-200 px-6 py-3 text-sm font-semibold text-ink-700 transition hover:bg-white dark:border-ink-700 dark:text-ink-200 dark:hover:bg-ink-900"
          >
            Explore Features
          </a>
        </motion.div>
      </section>

      {/* Product preview */}
      <section className="mx-auto max-w-5xl px-6 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="overflow-hidden rounded-3xl border border-ink-200 bg-white p-6 shadow-xl shadow-plum-900/5 dark:border-ink-800 dark:bg-ink-900 md:p-10"
        >
          <div className="grid gap-6 md:grid-cols-3">
            <div className="rounded-2xl bg-ink-50 p-5 dark:bg-ink-800">
              <p className="text-xs font-medium uppercase tracking-wide text-ink-400">Streak</p>
              <p className="mt-2 text-3xl font-semibold text-ink-900 dark:text-ink-100">14 days</p>
            </div>
            <div className="rounded-2xl bg-ink-50 p-5 dark:bg-ink-800">
              <p className="text-xs font-medium uppercase tracking-wide text-ink-400">Entries this month</p>
              <p className="mt-2 text-3xl font-semibold text-ink-900 dark:text-ink-100">32</p>
            </div>
            <div className="rounded-2xl bg-plum-100 p-5 dark:bg-ink-700">
              <p className="text-xs font-medium uppercase tracking-wide text-plum-600 dark:text-plum-300">AI Insight</p>
              <p className="mt-2 text-sm text-ink-700 dark:text-ink-200">
                "You've mentioned feeling most productive on days when you start working before 9am."
              </p>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-6xl px-6 pb-24">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4 }}
              className="rounded-2xl border border-ink-200 bg-white p-6 dark:border-ink-800 dark:bg-ink-900"
            >
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-plum-100 text-plum-600 dark:bg-ink-800 dark:text-plum-300">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="text-base font-semibold text-ink-900 dark:text-ink-100">{title}</h3>
              <p className="mt-1.5 text-sm text-ink-500 dark:text-ink-400">{desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <footer className="border-t border-ink-200 px-6 py-8 text-center text-sm text-ink-400 dark:border-ink-800">
        © {new Date().getFullYear()} MindVault. Your journal stays yours.
      </footer>
    </div>
  );
}
