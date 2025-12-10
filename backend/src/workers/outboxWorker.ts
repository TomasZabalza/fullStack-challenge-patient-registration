import { OutboxChannel, OutboxStatus } from "../generated/prisma/client";
import prisma from "../lib/prisma";
import { sendEmail } from "../services/mailer";

const BATCH_SIZE = 10;
const POLL_INTERVAL_MS = 5000;

let isProcessing = false;
let intervalHandle: ReturnType<typeof setInterval> | undefined;

const markFailed = async (id: string, error: unknown) =>
  prisma.outbox.update({
    where: { id },
    data: {
      status: OutboxStatus.FAILED,
      error: error instanceof Error ? error.message : "Unknown error",
    },
  });

const markSent = async (id: string) =>
  prisma.outbox.update({
    where: { id },
    data: {
      status: OutboxStatus.SENT,
      sentAt: new Date(),
      error: null,
    },
  });

const processOutbox = async () => {
  if (isProcessing) {
    return;
  }

  isProcessing = true;

  try {
    const pending = await prisma.outbox.findMany({
      where: { status: OutboxStatus.PENDING },
      orderBy: { createdAt: "asc" },
      take: BATCH_SIZE,
    });

    for (const item of pending) {
      if (item.channel === OutboxChannel.EMAIL) {
        try {
          await sendEmail({
            to: item.to,
            subject: item.subject ?? "",
            body: item.body,
          });
        } catch (error) {
          await markFailed(item.id, error);
          continue;
        }

        await markSent(item.id);
      }

      // Future: add SMS handler here when needed.
    }
  } finally {
    isProcessing = false;
  }
};

export const startOutboxWorker = () => {
  if (!intervalHandle) {
    intervalHandle = setInterval(() => {
      void processOutbox();
    }, POLL_INTERVAL_MS);
  }
  void processOutbox();

  return () => {
    if (intervalHandle) {
      clearInterval(intervalHandle);
    }
  };
};
