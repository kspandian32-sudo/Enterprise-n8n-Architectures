"use client";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";

const ActivityFeed = dynamic(() => import("../components/ActivityFeed"), { ssr: false, loading: () => <div className="h-full bg-white/5 animate-pulse rounded-2xl" /> });
const WeeklyCalendar = dynamic(() => import("../components/WeeklyCalendar"), { ssr: false, loading: () => <div className="h-full bg-white/5 animate-pulse rounded-2xl" /> });
const GlobalSearch = dynamic(() => import("../components/GlobalSearch"), { ssr: false, loading: () => <div className="h-10 bg-white/5 animate-pulse rounded-xl" /> });

export default function Home() {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const logFilterRange = selectedDate ? {
    from: new Date(selectedDate).setHours(0, 0, 0, 0),
    to: new Date(selectedDate).setHours(23, 59, 59, 999)
  } : {};

  const logs = useQuery(api.logs.get, logFilterRange);
  const sendLog = useMutation(api.logs.send);
  const clearLogs = useMutation(api.logs.clearAll);
  const askAI = useAction(api.ai.chatWithAI);
  const syncTui = useAction(api.ai.triggerTuiSync);
  const sendCommand = useAction(api.ai.sendCommand);

  // Separate state for each input
  const [chatMessage, setChatMessage] = useState("");
  const [overrideMessage, setOverrideMessage] = useState("");
  const [niche, setNiche] = useState("AI Automation");
  const [objective, setObjective] = useState("");
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [time, setTime] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setTime(new Date().toLocaleTimeString());
    const t = setInterval(() => setTime(new Date().toLocaleTimeString()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (Array.isArray(logs)) {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs]);

  const latestStatus = Array.isArray(logs) && logs.length > 0 && logs[0].status === "error";
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleExport = () => {
    if (!Array.isArray(logs)) return;
    const content = logs?.map(l => `[${l.author}] ${l.body}`).join("\n\n");
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([content || ""], { type: "text/plain" }));
    link.download = `mission_report_${new Date().toISOString().split('T')[0]}.txt`;
    link.click();
  };

  // Send direct chat message to Pi
  const handleChatSend = async () => {
    const msg = chatMessage.trim();
    if (!msg || isAiThinking) return;
    setChatMessage("");
    setIsAiThinking(true);
    await sendLog({ body: msg, author: "Pandian Sir", status: "success" });
    try {
      await askAI({ prompt: msg, niche, missionObjective: objective || "General assistance" });
    } catch (err) {
      console.error("AI Uplink Failed:", err);
    } finally {
      setIsAiThinking(false);
    }
  };

  if (!isMounted) return <div className="min-h-screen bg-[#050505]" />;

  return (
    <main className="min-h-screen bg-[#050505] text-zinc-100 p-6 lg:p-8 font-mono bg-[radial-gradient(circle_at_50%_50%,rgba(20,20,30,1)_0%,rgba(5,5,5,1)_100%)]">
      <div className="max-w-[1600px] mx-auto space-y-8">

        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-center gap-6 backdrop-blur-md bg-black/20 p-8 rounded-3xl border border-white/5 shadow-2xl">
          <div className="flex items-center gap-5">
            <div className="relative">
              <div className={`w-4 h-4 rounded-full ${latestStatus ? 'bg-red-500 animate-ping' : 'bg-cyan-500 shadow-[0_0_15px_#06b6d4]'}`} />
              <div className={`absolute inset-0 w-4 h-4 rounded-full ${latestStatus ? 'bg-red-600' : 'bg-cyan-400'}`} />
            </div>
            <div>
              <h1 className="text-3xl font-black uppercase tracking-[0.2em] bg-clip-text text-transparent bg-gradient-to-r from-white via-zinc-400 to-zinc-600">
                Mission Control
              </h1>
              <p className="text-[10px] text-zinc-500 tracking-widest mt-1 opacity-60">PANDIAN K S // AI AUTOMATION HQ v3.2</p>
            </div>
          </div>
          <div className="w-full md:w-96">
            <GlobalSearch />
          </div>
          <div className="text-right">
            <div className="text-cyan-500/80 text-2xl font-black tracking-widest drop-shadow-[0_0_8px_rgba(6,182,212,0.3)] bg-black/40 px-4 py-1 rounded-lg border border-white/5">
              {time || "--:--:--"}
            </div>
            <div className={`text-[9px] mt-1 uppercase tracking-widest font-bold ${isAiThinking ? 'text-amber-400 animate-pulse' : 'text-cyan-600'}`}>
              {isAiThinking ? "⟳ Pi Thinking..." : "● Pi Online"}
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* Main Column */}
          <div className="lg:col-span-8 space-y-8">

            {/* Action Buttons */}
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => confirm("Wipe all telemetry data?") && clearLogs()}
                className="group relative overflow-hidden bg-zinc-900/50 py-3 text-[11px] text-zinc-400 hover:text-red-400 uppercase tracking-widest border border-white/5 rounded-xl transition-all"
              >
                <span className="relative z-10 font-bold">Wipe Data</span>
                <div className="absolute inset-0 bg-red-950/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
              </button>
              <button
                onClick={async () => {
                  setIsSyncing(true);
                  try { await syncTui({ niche, objective }); }
                  finally { setIsSyncing(false); }
                }}
                disabled={isSyncing}
                className={`group relative overflow-hidden py-3 text-[11px] uppercase tracking-widest rounded-xl transition-all border ${isSyncing ? 'border-zinc-700 text-zinc-600' : 'border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/10'}`}
              >
                <span className="relative z-10 font-bold">{isSyncing ? "SYNCING..." : "Sync to TUI"}</span>
                <div className="absolute inset-0 bg-cyan-500/5 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
              </button>
              <button
                onClick={handleExport}
                className="group relative overflow-hidden bg-zinc-900/50 py-3 text-[11px] text-zinc-400 hover:text-white uppercase tracking-widest border border-white/5 rounded-xl transition-all"
              >
                <span className="relative z-10 font-bold">Export Report</span>
                <div className="absolute inset-0 bg-white/5 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
              </button>
            </div>

            {/* Target Sector + Mission Objective */}
            <div className="bg-white/[0.02] p-6 border border-white/10 space-y-6 rounded-2xl shadow-inner backdrop-blur-md">
              <div className="flex gap-6 items-center">
                <span className="text-[11px] text-zinc-500 uppercase font-black tracking-widest">Target Sector:</span>
                <select
                  value={niche}
                  onChange={(e) => setNiche(e.target.value)}
                  className="bg-black/60 text-cyan-400 font-black px-4 py-2 rounded-lg border border-white/10 focus:outline-none focus:border-cyan-500/50 cursor-pointer appearance-none transition-all shadow-[0_4px_10px_rgba(0,0,0,0.5)]"
                >
                  <option value="AI Automation">AI Automation</option>
                  <option value="Solar Outreach">Solar Outreach</option>
                  <option value="n8n Workflows">n8n Workflows</option>
                  <option value="Home Remedies">Home Remedies</option>
                  <option value="Technical SEO">Technical SEO</option>
                </select>
              </div>
              <div className="relative group">
                <input
                  value={objective}
                  onChange={(e) => setObjective(e.target.value)}
                  placeholder="DEFINE MISSION CONTEXT (optional)..."
                  className="w-full bg-black/60 border border-white/10 px-5 py-4 text-sm text-zinc-200 placeholder:text-zinc-700 focus:border-cyan-500/50 outline-none rounded-xl transition-all shadow-inner"
                />
                <div className="absolute inset-0 rounded-xl bg-cyan-500/5 opacity-0 group-focus-within:opacity-100 transition-opacity pointer-events-none" />
              </div>
            </div>

            {/* DIRECT PI CHAT — Primary Input */}
            <div className="bg-black/40 border border-cyan-500/30 rounded-2xl p-5 space-y-3 shadow-[0_0_30px_rgba(6,182,212,0.05)]">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-black text-cyan-500 tracking-widest uppercase">🥧 Direct Pi Chat</span>
                <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold ${isAiThinking ? 'bg-amber-500/20 text-amber-400' : 'bg-cyan-500/10 text-cyan-600'}`}>
                  {isAiThinking ? "Thinking..." : "Ready"}
                </span>
              </div>
              <div className="flex gap-3">
                <input
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleChatSend(); }}
                  placeholder="Talk to Pi directly... (Enter to send)"
                  disabled={isAiThinking}
                  className="flex-1 bg-black/60 border border-cyan-500/20 px-5 py-4 text-sm text-cyan-100 placeholder:text-zinc-700 focus:border-cyan-500/60 outline-none rounded-xl transition-all shadow-inner disabled:opacity-40"
                />
                <button
                  onClick={handleChatSend}
                  disabled={isAiThinking || !chatMessage.trim()}
                  className={`px-6 py-4 rounded-xl font-black text-xs uppercase tracking-widest transition-all border ${isAiThinking || !chatMessage.trim() ? 'border-zinc-800 text-zinc-700 bg-zinc-900/20' : 'border-cyan-500/50 text-cyan-400 bg-cyan-500/10 hover:bg-cyan-500 hover:text-black active:scale-95'}`}
                >
                  {isAiThinking ? "..." : "SEND"}
                </button>
              </div>
            </div>

            {/* Weekly Calendar */}
            <div className="h-[400px]">
              <WeeklyCalendar selectedDate={selectedDate} onSelectDate={setSelectedDate} />
            </div>

            {/* Activity Log */}
            <div className="bg-black/60 border border-white/10 rounded-2xl p-6 h-[400px] overflow-y-auto scrollbar-hide shadow-inner relative group">
              <div className="absolute top-4 right-6 z-20 flex items-center gap-2">
                <span className="text-[9px] text-zinc-700 uppercase tracking-widest font-bold">Activity Log</span>
                {selectedDate && (
                  <button
                    onClick={() => setSelectedDate(null)}
                    className="text-[9px] font-black bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 px-3 py-1 rounded-full uppercase tracking-tighter hover:bg-cyan-500 hover:text-black transition-all"
                  >
                    Clear Filter ×
                  </button>
                )}
              </div>
              <div className="absolute top-0 left-0 w-full h-8 bg-gradient-to-b from-black/80 to-transparent pointer-events-none z-10" />
              {Array.isArray(logs) && logs.map((log) => (
                <div key={log._id} className={`mb-6 border-l-2 pl-6 py-2 transition-all hover:bg-white/[0.02] rounded-r-xl ${log.status === 'error' ? 'border-red-600 bg-red-900/5' : log.author === 'Pandian Sir' ? 'border-cyan-500/50' : 'border-cyan-900/30'}`}>
                  <div className="flex justify-between items-center mb-2">
                    <span className={`text-[10px] font-black tracking-widest px-2 py-0.5 rounded ${log.author === 'Pandian Sir' ? 'text-white bg-white/10' : log.author.includes("Pi") ? 'text-cyan-400 bg-cyan-400/10' : log.status === 'error' ? 'text-red-400 bg-red-400/10' : 'text-zinc-600 bg-zinc-600/10'}`}>
                      {log.author.toUpperCase()}
                    </span>
                    <span className="text-[9px] text-zinc-800 font-bold">{new Date(log._creationTime).toLocaleTimeString()}</span>
                  </div>
                  <p className="text-xs text-zinc-400 leading-relaxed font-medium whitespace-pre-wrap">{log.body}</p>
                </div>
              ))}
              {(!Array.isArray(logs) || logs.length === 0) && (
                <div className="h-full flex items-center justify-center text-zinc-800 text-xs uppercase tracking-widest font-bold">
                  {logs === undefined ? "Synchronizing Telemetry..." : "No mission data on record."}
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-4 space-y-8">

            {/* Manual Override */}
            <form onSubmit={async (e) => {
              e.preventDefault();
              const cmd = overrideMessage.trim();
              if (!cmd) return;
              setOverrideMessage("");
              await sendLog({ body: cmd, author: "OVERRIDE", status: "success" });
              try {
                await sendCommand({ command: cmd });
              } catch (err) {
                console.error("Command Relay Failed:", err);
              }
            }} className="space-y-2">
              <div className="text-[9px] text-zinc-700 uppercase tracking-widest font-bold px-1">Manual Override</div>
              <div className="flex gap-3">
                <input
                  value={overrideMessage}
                  onChange={(e) => setOverrideMessage(e.target.value)}
                  placeholder="FORCE COMMAND..."
                  className="flex-1 bg-zinc-900/50 border border-white/10 px-5 py-3 text-sm focus:outline-none focus:border-white/20 rounded-xl transition-all"
                />
                <button
                  type="submit"
                  className="bg-white/5 px-6 py-3 rounded-xl font-black text-xs hover:bg-white/10 active:scale-95 transition-all uppercase tracking-widest border border-white/5"
                >
                  GO
                </button>
              </div>
            </form>

            {/* Activity Feed */}
            <div className="h-[calc(100vh-320px)] min-h-[600px]">
              <ActivityFeed />
            </div>
          </div>
        </div>
      </div>

      {/* Background effects */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none -z-10 opacity-30">
        <div className="absolute top-[10%] left-[5%] w-64 h-64 bg-cyan-600/10 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[10%] right-[5%] w-80 h-80 bg-blue-600/5 blur-[120px] rounded-full animate-pulse delay-700" />
      </div>
    </main>
  );
}
