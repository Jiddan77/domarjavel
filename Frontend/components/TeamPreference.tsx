import { useState, useEffect } from "react";
import { Heart, Settings, Users } from "lucide-react";

export default function TeamPreference({ 
  teams = [],
  onTeamChange 
}: { 
  teams: string[];
  onTeamChange?: (team: string | null) => void;
}) {
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  // Load saved team preference from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("dommarjavel_team_preference");
    if (saved && teams.includes(saved)) {
      setSelectedTeam(saved);
      onTeamChange?.(saved);
    }
  }, [teams, onTeamChange]);

  const handleTeamSelect = (team: string | null) => {
    setSelectedTeam(team);
    if (team) {
      localStorage.setItem("dommarjavel_team_preference", team);
    } else {
      localStorage.removeItem("dommarjavel_team_preference");
    }
    onTeamChange?.(team);
    setShowSettings(false);
  };

  return (
    <div className="relative">
      {/* Team Preference Button */}
      <button
        onClick={() => setShowSettings(!showSettings)}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all ${
          selectedTeam
            ? "bg-red-50 border-red-200 text-red-700 dark:bg-red-900/20 dark:border-red-700 dark:text-red-300"
            : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 dark:bg-slate-800 dark:border-slate-600 dark:text-slate-400 dark:hover:bg-slate-700"
        }`}
      >
        <Heart className={`w-4 h-4 ${selectedTeam ? "fill-current" : ""}`} />
        <span className="text-sm font-medium">
          {selectedTeam || "Choose Team"}
        </span>
        <Settings className="w-3 h-3 opacity-60" />
      </button>

      {/* Team Selection Dropdown */}
      {showSettings && (
        <div className="absolute top-full left-0 mt-2 w-64 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-lg z-50">
          <div className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-4 h-4 text-slate-600 dark:text-slate-400" />
              <h3 className="font-medium text-slate-900 dark:text-slate-100">Your Favorite Team</h3>
            </div>
            
            <div className="text-xs text-slate-600 dark:text-slate-400 mb-4">
              This helps us show team-specific referee ratings and personalized insights.
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto">
              <button
                onClick={() => handleTeamSelect(null)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                  !selectedTeam
                    ? "bg-slate-100 text-slate-900 dark:bg-slate-700 dark:text-slate-100"
                    : "hover:bg-slate-50 text-slate-600 dark:hover:bg-slate-700 dark:text-slate-400"
                }`}
              >
                No preference
              </button>
              
              {teams.sort().map(team => (
                <button
                  key={team}
                  onClick={() => handleTeamSelect(team)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    selectedTeam === team
                      ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                      : "hover:bg-slate-50 text-slate-600 dark:hover:bg-slate-700 dark:text-slate-400"
                  }`}
                >
                  {team}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Overlay to close dropdown */}
      {showSettings && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowSettings(false)}
        />
      )}
    </div>
  );
}