-- Notification read receipts
--
-- Notices are broadcast (ALL / role / class) but "read" is per user, so the
-- inbox needs a join table rather than a column on notifications.

CREATE TABLE "notification_reads" (
    "id" TEXT NOT NULL,
    "notificationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "readAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notification_reads_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "notification_reads_notificationId_userId_key" ON "notification_reads"("notificationId", "userId");
CREATE INDEX "notification_reads_userId_readAt_idx" ON "notification_reads"("userId", "readAt");

ALTER TABLE "notification_reads" ADD CONSTRAINT "notification_reads_notificationId_fkey" FOREIGN KEY ("notificationId") REFERENCES "notifications"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "notification_reads" ADD CONSTRAINT "notification_reads_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
