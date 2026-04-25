import { v } from "convex/values";
import { query, action, mutation } from "./_generated/server";

export const listScheduled = query({
    args: {
        from: v.number(),
        to: v.number(),
    },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("scheduled_tasks")
            .filter((q) =>
                q.and(
                    q.gte(q.field("scheduledTime"), args.from),
                    q.lte(q.field("scheduledTime"), args.to)
                )
            )
            .collect();
    },
});

export const searchAll = query({
    args: { query: v.string() },
    handler: async (ctx, args) => {
        const searchTerm = args.query.trim();
        if (!searchTerm) return [];

        try {
            const logs = await ctx.db
                .query("logs")
                .withSearchIndex("search_body", (q) => q.search("body", searchTerm))
                .take(10);

            const activity = await ctx.db
                .query("activity_logs")
                .withSearchIndex("search_action", (q) => q.search("action", searchTerm))
                .take(10);

            const tasks = await ctx.db
                .query("scheduled_tasks")
                .withSearchIndex("search_title", (q) => q.search("title", searchTerm))
                .take(10);

            return [
                ...logs.map((l) => ({ ...l, type: "message", title: l.author || "Unknown" })),
                ...activity.map((a) => ({ ...a, type: "activity", title: a.action || "Action" })),
                ...tasks.map((t) => ({ ...t, type: "task", title: t.title || "Task" })),
            ];
        } catch (e) {
            console.error("Search failed:", e);
            return [];
        }
    },
});
export const create = mutation({
    args: {
        title: v.string(),
        description: v.string(),
        scheduledTime: v.number(),
        type: v.string(),
    },
    handler: async (ctx, args) => {
        await ctx.db.insert("scheduled_tasks", {
            title: args.title,
            description: args.description,
            scheduledTime: args.scheduledTime,
            type: args.type,
            status: "pending",
        });
    },
});
