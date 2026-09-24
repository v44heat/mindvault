import bcrypt from "bcryptjs";
import { env } from "@config/env";
import { connectDB, disconnectDB } from "@config/db";
import { User } from "@models/User.model";
import { JournalEntry } from "@models/JournalEntry.model";

const DEMO_EMAIL = "demo@mindvault.dev";
const DEMO_PASSWORD = "DemoPass123!"; // development-only credentials

async function seed() {
  console.log(`[seed] Connecting to ${env.mongodbUri}`);
  await connectDB();

  await User.deleteOne({ email: DEMO_EMAIL });
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);
  const user = await User.create({
    name: "Vincent",
    email: DEMO_EMAIL,
    passwordHash,
    onboardingCompleted: true,
  });

  await JournalEntry.deleteMany({ userId: user._id });

  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;

  const entries = [
    {
      title: "Finally finished the auth flow",
      content: "<p>Today was surprisingly productive. I got JWT auth working end to end.</p>",
      entryType: "achievement",
      mood: "good",
      tags: ["programming", "projects"],
      entryDate: new Date(now),
      isPinned: true,
    },
    {
      title: "Started learning MongoDB indexing",
      content: "<p>Spent the evening reading about compound indexes and query patterns.</p>",
      entryType: "reflection",
      mood: "neutral",
      tags: ["mongodb", "learning"],
      entryDate: new Date(now - day),
    },
    {
      title: "University project kickoff",
      content: "<p>Had an interesting meeting about the new semester project.</p>",
      entryType: "daily",
      mood: "excellent",
      tags: ["university", "projects"],
      entryDate: new Date(now - 3 * day),
    },
  ];

  for (const e of entries) {
    const contentText = e.content.replace(/<[^>]*>/g, " ").trim();
    await JournalEntry.create({
      ...e,
      userId: user._id,
      contentText,
      wordCount: contentText.split(/\s+/).filter(Boolean).length,
      readingTime: 1,
    });
  }

  console.log("[seed] Done. Demo login:");
  console.log(`  email:    ${DEMO_EMAIL}`);
  console.log(`  password: ${DEMO_PASSWORD}`);

  await disconnectDB();
}

seed().catch((err) => {
  console.error("[seed] Failed:", err);
  process.exit(1);
});
