import { useState } from "react";
import { X, Calendar, Users, AlertTriangle, Target, Trophy, ExternalLink } from "lucide-react";

type MatchDetail = {
  match_id: string;
  date: string;
  home: string;
  away: string;
  score: string;
  referee: string;
  season: number;
  yellow: string;
  red: string;
  penalty: string;
  teamWon?: boolean;
  teamYellow?: number;
  teamRed?: number;
  teamPenalties?: number;
  isHome?: boolean;
  matchUrl?: string;
};

export default function MatchDetailsModal({ 
  isOpen, 
  onClose, 
  matches, 
  referee, 
  teamName 
}: {
  isOpen: boolean;
  onClose: () => void;
  matches: MatchDetail[];
  referee: string;
  teamName: string;
}) {
  if (!isOpen) return null;

  const parseCardString = (cardStr: string) => {
    const parts = cardStr.split(/[–-]/);
    if (parts.length === 2) {
      return {
        home: parseInt(parts[0]) || 0,
        away: parseInt(parts[1]) || 0
      };
    }
    return { home: 0, away: 0 };
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-slate-200 dark:border-slate-700">
          <div>
            <h2 className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-slate-100">
              {referee} vs {teamName}
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {matches.length} matches • {matches.filter(m => m.teamWon).length} wins for {teamName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="space-y-4">
            {matches.map((match, i) => {
              const yellowCards = parseCardString(match.yellow);
              const redCards = parseCardString(match.red);
              const penalties = parseCardString(match.penalty);

              return (
                <div 
                  key={i} 
                  className={`p-4 rounded-xl border-2 ${
                    match.teamWon 
                      ? "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800" 
                      : "bg-slate-50 border-slate-200 dark:bg-slate-800 dark:border-slate-600"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Calendar className="w-4 h-4 text-slate-500" />
                        <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                          {match.date}
                        </span>
                        <span className="text-xs text-slate-500">Season {match.season}</span>
                      </div>
                      
                      <div className="flex items-center gap-2 mb-3">
                        <div className={`text-base font-semibold ${
                          match.isHome ? "text-blue-600" : "text-slate-600"
                        }`}>
                          {match.home}
                        </div>
                        <span className="text-slate-400">vs</span>
                        <div className={`text-base font-semibold ${
                          !match.isHome ? "text-blue-600" : "text-slate-600"
                        }`}>
                          {match.away}
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1">
                          <Trophy className="w-4 h-4 text-slate-500" />
                          <span className={`font-semibold ${
                            match.teamWon ? "text-green-600" : "text-slate-600"
                          }`}>
                            {match.score}
                          </span>
                        </div>
                        
                        {(match.teamYellow || 0) > 0 && (
                          <div className="flex items-center gap-1">
                            <div className="w-3 h-3 bg-yellow-400 rounded-sm"></div>
                            <span>{match.teamYellow} yellow</span>
                          </div>
                        )}
                        
                        {(match.teamRed || 0) > 0 && (
                          <div className="flex items-center gap-1">
                            <div className="w-3 h-3 bg-red-500 rounded-sm"></div>
                            <span>{match.teamRed} red</span>
                          </div>
                        )}
                        
                        {(match.teamPenalties || 0) > 0 && (
                          <div className="flex items-center gap-1">
                            <Target className="w-4 h-4 text-purple-500" />
                            <span>{match.teamPenalties} penalty</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className={`text-lg font-bold ${
                        match.teamWon ? "text-green-600" : "text-slate-500"
                      }`}>
                        {match.teamWon ? "WIN" : "LOSS/DRAW"}
                      </div>
                      <div className="text-xs text-slate-500">
                        {match.isHome ? "Home" : "Away"}
                      </div>
                      {match.matchUrl && (
                        <a
                          href={match.matchUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 mt-2 text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          <ExternalLink className="w-3 h-3" />
                          View Match
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Detailed card breakdown */}
                  <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-600">
                    <div className="grid grid-cols-3 gap-4 text-xs">
                      <div>
                        <div className="font-medium text-slate-700 dark:text-slate-300 mb-1">Yellow Cards</div>
                        <div className="text-slate-600 dark:text-slate-400">
                          {match.home}: {yellowCards.home} • {match.away}: {yellowCards.away}
                        </div>
                      </div>
                      <div>
                        <div className="font-medium text-slate-700 dark:text-slate-300 mb-1">Red Cards</div>
                        <div className="text-slate-600 dark:text-slate-400">
                          {match.home}: {redCards.home} • {match.away}: {redCards.away}
                        </div>
                      </div>
                      <div>
                        <div className="font-medium text-slate-700 dark:text-slate-300 mb-1">Penalties</div>
                        <div className="text-slate-600 dark:text-slate-400">
                          {match.home}: {penalties.home} • {match.away}: {penalties.away}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}