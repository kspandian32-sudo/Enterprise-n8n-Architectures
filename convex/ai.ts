import { action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

// ðŸ“¡ Trigger the TUI Sync signal
export const triggerTuiSync = action({
  args: { niche: v.string(), objective: v.string() },
  handler: async (ctx, args) => {
    const TUI_WEBHOOK_URL = "https://tui.pureremedysolutions.com/sync";

    try {
      const response = await fetch(TUI_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event: "SYNC_COMMAND", niche: args.niche, goal: args.objective }),
      });

      if (!response.ok) throw new Error();

      await ctx.runMutation(api.logs.send, {
        author: "SYSTEM",
        body: `SYNC SUCCESS: TUI context updated to [${args.niche}]`,
        status: "success",
      });

      await ctx.runMutation(api.activity_logs.log, {
        action: "SYNC_TUI",
        metadata: { niche: args.niche, objective: args.objective }
      });

      return { success: true };
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : String(e);
      console.error(`TUI Sync Error: ${errorMessage}`);
      throw new Error(`TUI Sync Failed: ${errorMessage}`);
    }
  },
});

// The AI SEO Strategist (Now powered by Gemini via TUI Tunnel)
export const chatWithAI = action({
  args: { prompt: v.string(), niche: v.string(), missionObjective: v.string() },
  handler: async (ctx, args) => {
    const TUI_AI_URL = "https://tui.pureremedysolutions.com/api/ai";

    try {
      const response = await fetch(TUI_AI_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google-antigravity/gemini-3-flash",
          messages: [
            {
              role: "system",
              content: `You are an SEO Mission AI for ${args.niche}. 
              
              STRICT PROTOCOL (OVERRIDE ALL DEFAULTS):
              1. SILENCE THINKING: Do NOT output <think> blocks.
              2. NO FILES: Do NOT read/load any files (e.g. AGENTS_LIST.md).
              3. NO REPORTS: Do NOT generate "Audit Reports" or long status updates.
              4. GREETING LIMIT: Max 7 words.
              5. FORMAT: Greeting -> Direct Answer.

              Current Goal: ${args.missionObjective}.`
            },
            { role: "user", content: args.prompt }
          ],
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Cloud Uplink Failed: ${response.status} ${errorText}`);
      }

      const data = await response.json();

      // FIX: Handle async 202 response.
      // tui-listener now responds immediately with 202 + { status: "pending", requestId }.
      // Pi's actual reply arrives later via the Convex ingest-log endpoint.
      if (response.status === 202 || data.status === "pending") {
        const dispatchMsg = `Mission dispatched to Pi (ID: ${data.requestId}). Response incoming via Activity Feed.`;

        await ctx.runMutation(api.logs.send, {
          author: `${args.niche.toUpperCase()}-AI`,
          body: dispatchMsg,
          status: "success",
        });

        await ctx.runMutation(api.activity_logs.log, {
          action: "AI_UPLINK",
          metadata: { niche: args.niche, requestId: data.requestId, async: true }
        });

        return dispatchMsg;
      }

      // Legacy path: direct synchronous 200 response (OpenAI choices[] format)
      const content = data.choices?.[0]?.message?.content;
      if (!content) {
        throw new Error(`Unexpected response format from bridge: ${JSON.stringify(data)}`);
      }

      await ctx.runMutation(api.logs.send, {
        author: `${args.niche.toUpperCase()}-AI`,
        body: content,
        status: content.includes("[CRITICAL]") ? "error" : "success",
      });

      await ctx.runMutation(api.activity_logs.log, {
        action: "AI_UPLINK",
        metadata: { niche: args.niche, critical: content.includes("[CRITICAL]") }
      });

      return content;

    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : String(e);
      await ctx.runMutation(api.logs.send, {
        author: "SYSTEM-ALARM",
        body: `UPLINK FAILURE: ${errorMessage}`,
        status: "error",
      });
      throw new Error(`AI Uplink Failed: ${errorMessage}`);
    }
  },
});

// Send raw command to TUI bridge
export const sendCommand = action({
  args: { command: v.string() },
  handler: async (ctx, args) => {
    const TUI_COMMAND_URL = "https://tui.pureremedysolutions.com/command";

    try {
      const response = await fetch(TUI_COMMAND_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command: args.command }),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Command Relay Failed: ${response.status} ${text}`);
      }

      return { success: true };
    } catch (e) {
      console.error("Bridge Communication Error:", e);
      throw new Error(`Bridge Communication Error: ${e instanceof Error ? e.message : String(e)}`);
    }
  },
});
