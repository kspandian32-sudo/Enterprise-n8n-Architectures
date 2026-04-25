"use client";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState, useEffect } from "react";

export default function GlobalSearch() {
    const [query, setQuery] = useState("");
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const results = useQuery(api.tasks.searchAll, query ? { query } : "skip");

    if (!isMounted) return <div className="bg-black/60 border border-white/10 rounded-xl px-4 py-2 h-8 animate-pulse" />;

    return (
        <div className="relative w-full group">
            <div className="flex items-center bg-black/60 border border-white/10 rounded-xl px-4 py-2 group-focus-within:border-cyan-500/50 transition-all shadow-inner">
                <svg className="w-4 h-4 text-zinc-600 group-focus-within:text-cyan-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="GLOBAL SYSTEM SEARCH..."
                    className="bg-transparent border-none outline-none flex-1 px-3 text-xs text-zinc-300 placeholder:text-zinc-700 font-mono tracking-wider"
                />
                {query && (
                    <button onClick={() => setQuery("")} className="text-zinc-600 hover:text-zinc-400">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                )}
            </div>

            {query && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-[#0a0a0c] border border-white/10 rounded-xl shadow-2xl z-50 max-h-[300px] overflow-y-auto backdrop-blur-xl">
                    {results?.length === 0 && (
                        <div className="p-8 text-center text-zinc-600 italic text-[10px] uppercase tracking-widest">
                            No matching vectors found.
                        </div>
                    )}
                    {results?.map((res: any, i: number) => (
                        <div
                            key={`${res.type}-${res._id}-${i}`}
                            className="p-3 border-b border-white/5 last:border-none hover:bg-white/[0.03] transition-colors cursor-pointer group/item"
                        >
                            <div className="flex items-center justify-between mb-1">
                                <span className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-tighter ${res.type === 'message' ? 'bg-zinc-800 text-zinc-400' :
                                    res.type === 'activity' ? 'bg-cyan-900/40 text-cyan-400' :
                                        'bg-amber-900/40 text-amber-400'
                                    }`}>
                                    {res.type}
                                </span>
                                <span className="text-[8px] text-zinc-700 font-mono">
                                    {new Date(res._creationTime || res.timestamp).toLocaleDateString()}
                                </span>
                            </div>
                            <div className="text-[11px] font-bold text-zinc-300 group-hover/item:text-white transition-colors">
                                {res.title}
                            </div>
                            {res.body && (
                                <div className="text-[9px] text-zinc-600 line-clamp-1 mt-1 italic">
                                    {res.body}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
