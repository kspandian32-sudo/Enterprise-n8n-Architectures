import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const log = mutation({
  args: {
    action: v.string(),
    metadata: v.any(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("activity_logs", {
      action: args.action,
      metadata: args.metadata,
      timestamp: Date.now(),
    });
  },
});

export const get = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const safeLimit = Math.min(args.limit ?? 50, 100);
    const q = ctx.db.query("activity_logs");
    return await q.order("desc").take(safeLimit);
  },
});

export const clearAll = mutation({
  handler: async (ctx) => {
    const logs = await ctx.db.query("activity_logs").collect();
    for (const log of logs) {
      await ctx.db.delete(log._id);
    }
  },
});
