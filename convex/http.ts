import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";

const http = httpRouter();

// ðŸªµ LOG INGESTION ENDPOINT
// This allows the local TUI bridge to push Pi's real-time replies back to the dashboard.
http.route({
    path: "/ingest-log",
    method: "POST",
    handler: httpAction(async (ctx, request) => {
        try {
            const { body, author, status} = await request.json();

            if (!body || !author) {
                return new Response("Missing Body or Author", { status: 400 });
            }

            await ctx.runMutation(api.logs.send, {
                body,
                author: author.toUpperCase(),
                status: status || "success"});

            return new Response(JSON.stringify({ ok: true }), {
                status: 200,
                headers: { "Content-Type": "application/json" },
            });
        } catch (err) {
            console.error("Log Ingestion Failed:", err);
            return new Response("Internal Server Error", { status: 500 });
        }
    }),
});

export default http;

