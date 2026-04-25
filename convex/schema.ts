import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  logs: defineTable({
    author: v.string(), // e.g., "User", "HOME REMEDIES-AI", "MOLTBOT"
    body: v.string(),   // The message or report content
    status: v.string(), // "success" (Green) or "error" (Red)
    requestId: v.optional(v.string()), // For async correlation
  }).index("by_requestId", ["requestId"]).searchIndex("search_body", {
    searchField: "body",
  }),

  activity_logs: defineTable({
    action: v.string(),   // e.g., "SYNC_TUI", "UPDATE_MODEL", "SCHEDULE_TASK"
    metadata: v.any(),    // Additional context
    timestamp: v.number(),
  }).searchIndex("search_action", {
    searchField: "action",
  }),

  scheduled_tasks: defineTable({
    title: v.string(),
    description: v.string(),
    scheduledTime: v.number(),
    type: v.string(),     // e.g., "AUTOMATION", "REPORTS", "MAINTENANCE"
    status: v.string(),   // "pending", "completed", "failed"
  }).searchIndex("search_title", {
    searchField: "title",
  }),
});