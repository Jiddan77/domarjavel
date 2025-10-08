import { useState, useMemo } from "react";
import { TrendingUp, Calendar, BarChart3, Users, Target } from "lucide-react";
import Card from "./ui/Card";

type TrendData = {
  season: number;
  matches: number;
  avgCards: number;
  avgPenalties: number;
  winRate: number;
  homeWinRate: number;
  awayWinRate: number;
};

const fmt = (n?: number, d = 2) => (typeof n === "number" && isFinite(n)) ? n.toFixed(d) : "-";
const pct = (n?: number) => (typeof n === "number" && isFinite(n)) ? `${(n * 100).toFixed(1)}%` : "-";

function calculateTrends(matches: any[], refereeName: string): TrendData[] {
  const refereeMatches = matches.filter(m => m.referee === refereeName);
  const seasonGroups: { [season: number]: any[] } = {};

  // Group matches by season
  refereeMatches.forEach(match => {
    const season = match.season;
    if (!seasonGroups[season]) {
      seasonGroups[season] = [];
    }
    seasonGroups[season].push(match);
  });

  // Calculate trends for each season
  return Object.entries(seasonGroups)
    .map(([season, seasonMatches]) => {
      const seasonNum = parseInt(season);
      let totalCards = 0;
      let totalPenalties = 0;
      let homeWins = 0;
      let awayWins = 0;
      let totalWins = 0;

      seasonMatches.forEach(match => {
        // Parse cards
        const parseCardString = (cardStr: string) => {
          const parts = cardStr.split(/[–-]/);
          if (parts.length === 2) {
            return (parseInt(parts[0]) || 0) + (parseInt(parts[1]) || 0);
          }
          return 0;
        };

        totalCards += parseCardString(match.yellow || "0-0") + parseCardString(match.red || "0-0");
        totalPenalties += parseCardString(match.penalty || "0-0");

        // Parse score for win rates
        const scoreStr = match.score || "0-0";
        const scoreParts = scoreStr.split(/[–-]/);
        if (scoreParts.length === 2) {
          const homeScore = parseInt(scoreParts[0]) || 0;
          const awayScore = parseInt(scoreParts[1]) || 0;
          
          if (homeScore > awayScore) {
            homeWins++;
            totalWins++;
          } else if (awayScore > homeScore) {
            awayWins++;
            totalWins++;
          }
        }
      });

      return {
        season: seasonNum,
        matches: seasonMatches.length,
        avgCards: totalCards / seasonMatches.length,
        avgPenalties: totalPenalties / seasonMatches.length,
        winRate: totalWins / seasonMatches.length,
        homeWinRate: homeWins / seasonMatches.length,
        awayWinRate: awayWins / seasonMatches.length
      };
    })
    .sort((a, b) => a.season - b.season);
}

export default function HistoricalTrends({ 
  refereeName, 
  matches = [] 
}: { 
  refereeName: string;
  matches: any[];
}) {
  const [activeMetric, setActiveMetric] = useState<"cards" | "penalties" | "winRate">("cards");
  
  const trends = useMemo(() => calculateTrends(matches, refereeName), [matches, refereeName]);

  if (trends.length === 0) {
    return (
      <Card className="text-center">
        <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-50 text-slate-400" />
        <p className="text-slate-500 dark:text-slate-400">
          No historical data available for {refereeName}
        </p>
      </Card>
    );
  }

  const metrics = [
    { 
      id: "cards" as const, 
      label: "Cards per Match", 
      icon: Target,
      color: "text-orange-600",
      bgColor: "bg-orange-50 dark:bg-orange-900/20"
    },
    { 
      id: "penalties" as const, 
      label: "Penalties per Match", 
      icon: Users,
      color: "text-purple-600",
      bgColor: "bg-purple-50 dark:bg-purple-900/20"
    },
    { 
      id: "winRate" as const, 
      label: "Home Win Rate", 
      icon: TrendingUp,
      color: "text-green-600",
      bgColor: "bg-green-50 dark:bg-green-900/20"
    }
  ];

  const maxValue = Math.max(...trends.map(t => {
    switch (activeMetric) {
      case "cards": return t.avgCards;
      case "penalties": return t.avgPenalties;
      case "winRate": return t.homeWinRate;
      default: return 0;
    }
  }));

  return (
    <Card>
      <div className="flex items-center gap-3 mb-6">
        <Calendar className="w-5 h-5 text-indigo-600" />
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          Historical Trends: {refereeName}
        </h3>
      </div>

      {/* Metric Selection */}
      <div className="flex gap-2 mb-6 overflow-x-auto">
        {metrics.map(metric => {
          const Icon = metric.icon;
          return (
            <button
              key={metric.id}
              onClick={() => setActiveMetric(metric.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all whitespace-nowrap ${
                activeMetric === metric.id
                  ? `${metric.bgColor} ${metric.color} border-current`
                  : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 dark:bg-slate-700 dark:text-slate-400 dark:border-slate-600 dark:hover:bg-slate-600"
              }`}
            >
              <Icon className="w-4 h-4" />
              {metric.label}
            </button>
          );
        })}
      </div>

      {/* Trend Visualization */}
      <div className="space-y-4">
        {trends.map((trend, index) => {
          let value, displayValue;
          switch (activeMetric) {
            case "cards":
              value = trend.avgCards;
              displayValue = fmt(value, 1);
              break;
            case "penalties":
              value = trend.avgPenalties;
              displayValue = fmt(value, 2);
              break;
            case "winRate":
              value = trend.homeWinRate;
              displayValue = pct(value);
              break;
            default:
              value = 0;
              displayValue = "-";
          }

          const percentage = maxValue > 0 ? (value / maxValue) * 100 : 0;
          const activeColor = metrics.find(m => m.id === activeMetric)?.color || "text-blue-600";

          return (
            <div key={trend.season} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-3">
                  <span className="font-medium text-slate-900 dark:text-slate-100 w-12">
                    {trend.season}
                  </span>
                  <span className="text-slate-500 dark:text-slate-400">
                    {trend.matches} matches
                  </span>
                </div>
                <span className={`font-semibold ${activeColor}`}>
                  {displayValue}
                </span>
              </div>
              
              <div className="relative">
                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-500 ease-out ${
                      activeMetric === "cards" ? "bg-orange-500" :
                      activeMetric === "penalties" ? "bg-purple-500" :
                      "bg-green-500"
                    }`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary Stats */}
      <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-lg font-bold text-slate-900 dark:text-slate-100">
              {trends.length}
            </div>
            <div className="text-xs text-slate-500">Seasons</div>
          </div>
          <div>
            <div className="text-lg font-bold text-slate-900 dark:text-slate-100">
              {trends.reduce((sum, t) => sum + t.matches, 0)}
            </div>
            <div className="text-xs text-slate-500">Total Matches</div>
          </div>
          <div>
            <div className="text-lg font-bold text-slate-900 dark:text-slate-100">
              {fmt(trends.reduce((sum, t) => sum + t.avgCards, 0) / trends.length, 1)}
            </div>
            <div className="text-xs text-slate-500">Avg Cards/Match</div>
          </div>
        </div>
      </div>
    </Card>
  );
}