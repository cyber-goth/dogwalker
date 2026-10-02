"use client";
import { useTransition } from "react";
import { checkInToday, toggleDate } from "@/app/actions";

type Props = {
  weeks: (string | null)[][];
  visited: string[];
  today: string;
  isOwner: boolean;
};

const DOW = ["M", "T", "W", "T", "F", "S", "S"];

export default function Calendar({ weeks, visited, today, isOwner }: Props) {
  const [pending, start] = useTransition();
  const seen = new Set(visited);
  const loggedToday = seen.has(today);

  return (
    <div>
      <button
        disabled={pending || loggedToday}
        onClick={() => start(() => checkInToday())}
        className="w-full p-4 rounded-xl text-lg font-bold bg-green-600 text-white disabled:bg-zinc-300"
      >
        {loggedToday ? "✓ Logged for today" : "🐕 I was here today"}
      </button>

      <div className="grid grid-cols-7 gap-1 mt-4 text-center text-xs text-zinc-500">
        {DOW.map((d, i) => (
          <div key={i}>{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1 mt-1">
        {weeks.flat().map((date, i) => {
          if (date === null) return <div key={i} />;
          const present = seen.has(date);
          const future = date > today;
          const clickable = isOwner && !future && !pending;
          const day = Number(date.slice(8));
          const cls = `aspect-square flex items-center justify-center rounded-lg text-sm ${
            present
              ? "bg-green-500 text-white font-bold"
              : future
              ? "bg-zinc-100 text-zinc-300"
              : "bg-zinc-100"
          }${clickable ? " cursor-pointer active:scale-95" : ""}`;
          if (!clickable) return <div key={date} className={cls}>{day}</div>;
          return (
            <button
              key={date}
              className={cls}
              onClick={() => start(() => toggleDate(date, present))}
              aria-label={`${date} ${present ? "visited" : "not visited"}`}
            >
              {day}
            </button>
          );
        })}
      </div>
      {isOwner && (
        <p className="mt-2 text-xs text-zinc-500">Owner mode: tap a day to add/remove.</p>
      )}
    </div>
  );
}
