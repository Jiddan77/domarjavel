"use client";

import { useState } from "react";

type Option = {
  label: string;
  value: string;
};

type Props = {
  label: string;
  options: Option[];
  selected: string[];
  onChange: (newSelected: string[]) => void;
  presets?: { name: string; values: string[] }[];
};

export default function FancyMultiSelect({
  label,
  options,
  selected,
  onChange,
  presets = [],
}: Props) {
  const [query, setQuery] = useState("");

  const toggleValue = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter((v) => v !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  const selectAll = () => onChange(options.map((o) => o.value));
  const clearAll = () => onChange([]);

  const filteredOptions = options.filter((opt) =>
    opt.label.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="bg-white/5 rounded-xl p-4">
      <label className="block text-sm font-medium mb-2">{label}</label>

      {presets.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {presets.map((p) => (
            <button
              key={p.name}
              onClick={() => onChange(p.values)}
              className="text-xs bg-white/10 hover:bg-white/20 rounded px-2 py-1"
            >
              {p.name}
            </button>
          ))}
          <button
            onClick={selectAll}
            className="text-xs bg-white/10 hover:bg-white/20 rounded px-2 py-1"
          >
            Alla
          </button>
          <button
            onClick={clearAll}
            className="text-xs bg-white/10 hover:bg-white/20 rounded px-2 py-1"
          >
            Rensa
          </button>
        </div>
      )}

      <input
        type="text"
        placeholder="Sök..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-full mb-2 px-2 py-1 rounded bg-gray-800 text-white"
      />

      <div className="max-h-40 overflow-y-auto">
        {filteredOptions.map((opt) => (
          <label
            key={opt.value}
            className="flex items-center gap-2 text-sm text-white mb-1"
          >
            <input
              type="checkbox"
              checked={selected.includes(opt.value)}
              onChange={() => toggleValue(opt.value)}
            />
            <span>{opt.label}</span>
          </label>
        ))}
      </div>
    </div>
  );
}