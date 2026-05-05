"use client";
import { useState, useRef, useEffect } from "react";
import { X, Plus } from "lucide-react";

const COLORS = ["#60a5fa", "#a78bfa", "#34d399", "#f59e0b"];
const MAX_REFEREES = 4;

interface Props {
  selected: string[];
  allReferees: string[];
  onChange: (refs: string[]) => void;
}

export default function RefereeSelector({ selected, allReferees, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const filtered = allReferees
    .filter(r => !selected.includes(r))
    .filter(r => r.toLowerCase().includes(query.toLowerCase()))
    .slice(0, 20);

  const add = (ref: string) => {
    if (selected.length < MAX_REFEREES) {
      onChange([...selected, ref]);
    }
    setQuery("");
    setOpen(false);
  };

  const remove = (ref: string) => {
    onChange(selected.filter(r => r !== ref));
  };

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="flex flex-wrap gap-2 items-center">
      {selected.map((ref, i) => {
        const color = COLORS[i] ?? "#94a3b8";
        const displayName = ref
          .toLowerCase()
          .replace(/\b\w/g, c => c.toUpperCase());
        return (
          <div
            key={ref}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm"
            style={{
              background: "#1e293b",
              border: `1px solid #334155`,
              color,
            }}
          >
            {displayName}
            <button
              onClick={() => remove(ref)}
              className="text-slate-500 hover:text-slate-300 transition-colors"
              aria-label={`Remove ${displayName}`}
            >
              <X size={13} />
            </button>
          </div>
        );
      })}

      {selected.length < MAX_REFEREES && (
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => {
              setOpen(v => !v);
              setTimeout(() => inputRef.current?.focus(), 50);
            }}
            className="flex items-center gap-1 px-3 py-1.5 rounded-md text-sm text-slate-400 border border-dashed border-slate-600 hover:border-slate-400 transition-colors"
          >
            <Plus size={13} /> Add referee
          </button>

          {open && (
            <div className="absolute top-full left-0 mt-1 z-20 w-64 bg-slate-800 border border-slate-600 rounded-lg shadow-xl">
              <div className="p-2 border-b border-slate-700">
                <input
                  ref={inputRef}
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Search referees..."
                  className="w-full bg-slate-900 text-slate-100 text-sm px-2 py-1 rounded outline-none placeholder-slate-500"
                />
              </div>
              <ul className="max-h-48 overflow-y-auto">
                {filtered.length === 0 ? (
                  <li className="px-3 py-2 text-sm text-slate-500">No matches</li>
                ) : (
                  filtered.map(ref => (
                    <li key={ref}>
                      <button
                        onClick={() => add(ref)}
                        className="w-full text-left px-3 py-2 text-sm text-slate-200 hover:bg-slate-700 transition-colors"
                      >
                        {ref
                          .toLowerCase()
                          .replace(/\b\w/g, c => c.toUpperCase())}
                      </button>
                    </li>
                  ))
                )}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
