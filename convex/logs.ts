import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const get = query({
  args: {
    from: v.optional(v.number()),
    to: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let logsQuery = ctx.db.query("logs").order("desc");
    
    if (args.from && args.to) {
      logsQuery = logsQuery.filter((q) =>
        q.and(
          q.gte(q.field("_creationTime"), args.from!),
          q.lte(q.field("_creationTime"), args.to!)
        )
      );
    }
    
    return await logsQuery.take(100);
  },
});

export const send = mutation({
  args: { body: v.string(), author: v.string(), status: v.string() },
  handler: async (ctx, args) => {
    await ctx.db.insert("logs", {
      body: args.body,
      author: args.author,
      status: args.status,
    });
  },
});

export const clearAll = mutation({
  handler: async (ctx) => {
    const logs = await ctx.db.query("logs").collect();
    for (const log of logs) {
      await ctx.db.delete(log._id);
    }
  },
});
