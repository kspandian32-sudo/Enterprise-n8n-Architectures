"use client";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useEffect, useRef, useState } from "react";
import { formatDate } from "date-fns";

export default function ActivityFeed() {
    const activities = useQuery(api.logs.get, {}) ?? []; 
    const endOfFeedRef = useRef<HTMLDivElement>(null);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    // Auto-scroll to bottom on new activity
    useEffect(() => {
        if (isMounted && activities.length > 0) {
            endOfFeedRef.current?.scrollIntoView({ behavior: "smooth" });
        }
    }, [activities, isMounted]);

    if (!isMounted) return <div className="h-full bg-white/5 animate-pulse rounded-2xl" />;

    return (
        <div className="bg-black/40 border border-white/5 rounded-2xl p-6 h-full flex flex-col backdrop-blur-md">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-black uppercase tracking-[0.2em] text-zinc-400">Activity Telemetry</h2>
                <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse" />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                {activities.map((log: any) => (
                    <div key={log._id} className="group relative pl-4 border-l border-white/10 hover:border-cyan-500/50 transition-colors py-1">
                        <div className="flex justify-between items-start mb-1">
                            <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider">
                                {log.author}
                            </span>
                            <span className="text-[9px] text-zinc-600 font-mono">
                                {new Date(log._creationTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                            </span>
                        </div>
                        <div className="text-[11px] text-zinc-400 font-mono leading-tight group-hover:text-white transition-colors">
                            {log.body}
                        </div>
                        <div className="absolute left-[-1.5px] top-2 w-[3px] h-[3px] rounded-full bg-white/20 group-hover:bg-cyan-400 transition-colors" />
                    </div>
                ))}
                <div ref={endOfFeedRef} />

                {activities.length === 0 && (
                    <div className="h-full flex items-center justify-center text-[10px] uppercase tracking-widest text-zinc-700 font-bold">
                        Passive Monitoring Mode...
                    </div>
                )}
            </div>
        </div>
    );
}
