"use client";
import { useMemo } from "react";
type Opt = { value: string; label: string };
export default function MultiSelect(props: {
  label: string;
  options: Opt[];
  values: string[];
  onChange: (values: string[]) => void;
}) {
  const { label, options, values, onChange } = props;
  const map = useMemo(() => new Set(values), [values]);
  function toggle(v: string) {
    const s = new Set(map);
    s.has(v) ? s.delete(v) : s.add(v);
    onChange([...s]);
  }
  return (
    <div className="space-y-1">
      <div className="text-sm opacity-80">{label}</div>
      <div className="flex flex-wrap gap-2">
        {options.map(o => (
          <button
            key={o.value}
            onClick={() => toggle(o.value)}
            className={`px-2 py-1 rounded border text-sm hover:opacity-90 ${map.has(o.value) ? "bg-white text-black dark:bg-white dark:text-black" : "bg-transparent"}`}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}