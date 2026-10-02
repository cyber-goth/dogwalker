"use client";
import { useTransition } from "react";
import { checkInToday, toggleDate } from "@/app/actions";

type Props = {
  weeks: (string | null)[][];
  visited: string[];
  today: string;
  isOwner: boolean;
};

const DOW = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

export default function Calendar({ weeks, visited, today, isOwner }: Props) {
  const [pending, start] = useTransition();
  const seen = new Set(visited);
  const loggedToday = seen.has(today);

  return (
    <div>
      <button
        disabled={pending || loggedToday}
        onClick={() => start(() => checkInToday())}
        className={`w-full p-5 rounded-3xl text-xl font-extrabold shadow-lg transition active:scale-[0.98] ${
          loggedToday
            ? "bg-leaf-100 text-leaf-600 shadow-none"
            : "bg-honey-500 text-white hover:bg-honey-600 shadow-honey-500/30"
        } disabled:cursor-default`}
      >
        {loggedToday ? "✓ Logged for today" : "🐾 I was here today"}
      </button>

      <div className="mt-4 bg-white rounded-3xl shadow-lg shadow-orange-900/5 p-4">
        <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold text-cocoa-500">
          {DOW.map((d, i) => (
            <div key={i} className="py-1">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1 mt-1">
          {weeks.flat().map((date, i) => {
            if (date === null) return <div key={i} />;
            const present = seen.has(date);
            const future = date > today;
            const isToday = date === today;
            const clickable = isOwner && !future && !pending;
            const day = Number(date.slice(8));
            const cls = `aspect-square flex items-center justify-center rounded-2xl text-sm transition active:scale-95 ${
              present
                ? "bg-leaf-500 text-white font-extrabold shadow-md shadow-leaf-500/30"
                : future
                ? "bg-stone-100 text-stone-300"
                : isToday
                ? "bg-honey-100 text-cocoa-950 font-extrabold ring-2 ring-honey-500"
                : "bg-orange-50 text-cocoa-800"
            }${clickable ? " cursor-pointer hover:ring-2 hover:ring-cocoa-800/20" : ""}${
              pending ? " opacity-70" : ""
            }`;
            if (!clickable)
              return (
                <div
                  key={date}
                  className={cls}
                  title={present ? "Walker came" : undefined}
                >
                  {present ? "✓" : day}
                </div>
              );
            return (
              <button
                key={date}
                className={cls}
                onClick={() => start(() => toggleDate(date, present))}
                aria-label={`${date} ${present ? "visited" : "not visited"}`}
              >
                {present ? "✓" : day}
              </button>
            );
          })}
        </div>
        {isOwner && (
          <p className="mt-3 text-center text-xs text-cocoa-500">
            👑 Owner mode — tap any past day to add or remove it
          </p>
        )}
      </div>
    </div>
  );
}
