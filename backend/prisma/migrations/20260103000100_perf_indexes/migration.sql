-- Hot-path indexes for dashboard and list queries at scale.
CREATE INDEX IF NOT EXISTS "notifications_classId_createdAt_idx"
  ON "notifications"("classId", "createdAt" DESC);

-- Unread badge counts rows per user.
CREATE INDEX IF NOT EXISTS "notification_reads_userId_idx"
  ON "notification_reads"("userId");

-- Audit trail is only ever queried newest-first.
CREATE INDEX IF NOT EXISTS "audit_logs_createdAt_idx" ON "audit_logs"("createdAt" DESC);

-- Fee dashboards aggregate by status and due date.
CREATE INDEX IF NOT EXISTS "invoices_dueDate_idx" ON "invoices"("dueDate");
