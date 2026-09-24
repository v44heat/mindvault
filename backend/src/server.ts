import { env, assertAuthSecretsConfigured } from "@config/env";
import { connectDB } from "@config/db";
import { createApp } from "./app";

async function main() {
  assertAuthSecretsConfigured();
  await connectDB();

  const app = createApp();

  app.listen(env.port, () => {
    console.log(`[server] MindVault API listening on port ${env.port} (${env.nodeEnv})`);
  });
}

main().catch((err) => {
  console.error("[server] Failed to start:", err);
  process.exit(1);
});
