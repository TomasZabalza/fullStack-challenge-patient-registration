import { EmailStatus } from "../generated/prisma/client";
import prisma from "../lib/prisma";
import { sendEmail } from "../services/mailer";

const BATCH_SIZE = 10;
const POLL_INTERVAL_MS = 5000;

let isProcessing = false;
let intervalHandle: ReturnType<typeof setInterval> | undefined;

const processOutbox = async () => {
  if (isProcessing) {
    return;
  }

  isProcessing = true;

  try {
    const pending = await prisma.emailOutbox.findMany({
      where: { status: EmailStatus.PENDING },
      orderBy: { createdAt: "asc" },
      take: BATCH_SIZE,
    });

    for (const item of pending) {
      try {
        await sendEmail({
          to: item.toEmail,
          subject: item.subject,
          body: item.body,
        });
      } catch (error) {
        // update status to failed and store error message
        await prisma.emailOutbox.update({
          where: { id: item.id },
          data: {
            status: EmailStatus.FAILED,
            error: error instanceof Error ? error.message : "Unknown error",
          },
        });
        continue;
      }

      await prisma.emailOutbox.update({
        where: { id: item.id },
        data: {
          status: EmailStatus.SENT,
          sentAt: new Date(),
          error: null,
        },
      });
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
