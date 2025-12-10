import env from "./config/env";
import app from "./app";
import { startOutboxWorker } from "./workers/outboxWorker";

const stopOutbox = startOutboxWorker();

const server = app.listen(env.port, () => {
  console.log(`API server running on http://localhost:${env.port}`);
});

const shutdown = () => {
  stopOutbox();
  server.close(() => {
    console.log("Server closed");
    process.exit(0);
  });
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
