"use client";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import {
    startOfWeek,
    endOfWeek,
    eachDayOfInterval,
    format,
    isSameDay,
    addDays
} from "date-fns";
import { useState, useEffect } from "react";

export default function WeeklyCalendar({
    selectedDate,
    onSelectDate
}: {
    selectedDate: Date | null,
    onSelectDate: (date: Date) => void
}) {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const start = startOfWeek(currentDate);
    const end = endOfWeek(currentDate);
    const days = eachDayOfInterval({ start, end });

    const tasks = useQuery(api.tasks.listScheduled, {
        from: start.getTime(),
        to: end.getTime(),
    });

    if (!isMounted) return <div className="bg-black/40 border border-white/5 rounded-2xl p-6 h-full flex flex-col backdrop-blur-md animate-pulse" />;

    return (
        <div className="bg-black/40 border border-white/5 rounded-2xl p-6 h-full flex flex-col backdrop-blur-md">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-sm font-black uppercase tracking-[0.2em] text-zinc-400">Temporal Grid</h2>
                <div className="flex gap-2 text-[10px] font-mono">
                    <button
                        onClick={() => setCurrentDate(addDays(currentDate, -7))}
                        className="px-2 py-1 bg-white/5 border border-white/10 rounded hover:bg-white/10 transition-colors"
                    >
                        &lt; PREV
                    </button>
                    <div className="px-3 py-1 bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 rounded">
                        {format(start, "MMM dd")} - {format(end, "MMM dd")}
                    </div>
                    <button
                        onClick={() => setCurrentDate(addDays(currentDate, 7))}
                        className="px-2 py-1 bg-white/5 border border-white/10 rounded hover:bg-white/10 transition-colors"
                    >
                        NEXT &gt;
                    </button>
                </div>
            </div>

            <div className="flex-1 grid grid-cols-7 gap-2 overflow-hidden">
                {days.map((day) => {
                    const dayTasks = tasks?.filter(t => isSameDay(new Date(t.scheduledTime), day));
                    const isToday = isSameDay(day, new Date());
                    const isSelected = selectedDate && isSameDay(day, selectedDate);

                    return (
                        <button
                            key={day.toString()}
                            onClick={() => onSelectDate(day)}
                            className={`flex flex-col min-w-0 border rounded-xl p-2 transition-all text-left outline-none ${isSelected
                                ? 'border-cyan-500 bg-cyan-500/20 shadow-[0_0_15px_rgba(6,182,212,0.2)]'
                                : isToday
                                    ? 'border-cyan-500/30 bg-cyan-500/5'
                                    : 'border-white/5 bg-white/[0.02] hover:bg-white/[0.05]'
                                }`}
                        >
                            <div className="text-center mb-2 w-full">
                                <div className={`text-[9px] font-black uppercase tracking-wider ${isSelected || isToday ? 'text-cyan-400' : 'text-zinc-600'}`}>
                                    {format(day, "EEE")}
                                </div>
                                <div className={`text-xs font-bold ${isSelected || isToday ? 'text-white' : 'text-zinc-400'}`}>
                                    {format(day, "d")}
                                </div>
                            </div>

                            <div className="flex-1 space-y-1 overflow-y-auto scrollbar-hide pointer-events-none">
                                {dayTasks?.map((task) => (
                                    <div
                                        key={task._id}
                                        className={`text-[8px] p-1 rounded border leading-tight break-words ${task.status === 'completed'
                                            ? 'border-emerald-500/20 bg-emerald-500/5 text-emerald-400'
                                            : task.status === 'failed'
                                                ? 'border-red-500/20 bg-red-500/5 text-red-400'
                                                : 'border-cyan-500/20 bg-cyan-500/5 text-zinc-300'
                                            }`}
                                    >
                                        <div className="font-black opacity-80">{task.title}</div>
                                    </div>
                                ))}
                                {(!dayTasks || dayTasks.length === 0) && (
                                    <div className="h-full flex items-center justify-center pointer-events-none opacity-10">
                                        <div className="w-[1px] h-4 bg-white/20" />
                                    </div>
                                )}
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
