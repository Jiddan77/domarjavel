import { TrendingUp, Activity, Award } from "lucide-react";

type Stats = {
  totalMatches: number;
  totalYellow: number;
  totalRed: number;
  totalPenalty: number;
  avgYellow: number;
  avgRed: number;
  avgPenalty: number;
};

const fmt = (n?: number, d=2) => (typeof n === "number" && isFinite(n)) ? n.toFixed(d) : "-";

export default function FactsPanel({ stats }: { stats: Stats | null | undefined }) {
  if (!stats) return null;
  
  const getActivityLevel = () => {
    if (stats.avgYellow > 4) return { level: "Hög kortaktivitet", color: "text-red-600", intensity: "high" };
    if (stats.avgYellow > 2.5) return { level: "Medel kortaktivitet", color: "text-yellow-600", intensity: "medium" };
    return { level: "Låg kortaktivitet", color: "text-green-600", intensity: "low" };
  };

  const getRedCardLevel = () => {
    if (stats.avgRed > 0.2) return { level: "Många röda kort", color: "text-red-600" };
    if (stats.avgRed > 0.05) return { level: "Normalt antal röda", color: "text-yellow-600" };
    return { level: "Få röda kort", color: "text-green-600" };
  };

  const activity = getActivityLevel();
  const redLevel = getRedCardLevel();

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-6">
        <Activity className="w-5 h-5 text-blue-600" />
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Match Insights</h3>
      </div>
      
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Activity Level */}
        <div className="bg-white dark:bg-slate-700 rounded-xl p-4 border border-slate-200 dark:border-slate-600">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-slate-600 dark:text-slate-400" />
            <div className="text-sm font-medium text-slate-600 dark:text-slate-400">Aktivitetsnivå</div>
          </div>
          <div className={`text-lg font-semibold ${activity.color} mb-1`}>
            {activity.level}
          </div>
          <div className="text-sm text-slate-500 dark:text-slate-400">
            {fmt(stats.avgYellow)} gula kort/match
          </div>
        </div>

        {/* Red Card Analysis */}
        <div className="bg-white dark:bg-slate-700 rounded-xl p-4 border border-slate-200 dark:border-slate-600">
          <div className="flex items-center gap-2 mb-3">
            <Award className="w-4 h-4 text-slate-600 dark:text-slate-400" />
            <div className="text-sm font-medium text-slate-600 dark:text-slate-400">Röda kort</div>
          </div>
          <div className={`text-lg font-semibold ${redLevel.color} mb-1`}>
            {redLevel.level}
          </div>
          <div className="text-sm text-slate-500 dark:text-slate-400">
            {fmt(stats.avgRed)} röda kort/match
          </div>
        </div>

        {/* Penalty Analysis */}
        <div className="bg-white dark:bg-slate-700 rounded-xl p-4 border border-slate-200 dark:border-slate-600">
          <div className="flex items-center gap-2 mb-3">
            <Activity className="w-4 h-4 text-slate-600 dark:text-slate-400" />
            <div className="text-sm font-medium text-slate-600 dark:text-slate-400">Straffar</div>
          </div>
          <div className="text-lg font-semibold text-purple-600 mb-1">
            {stats.totalPenalty} totalt
          </div>
          <div className="text-sm text-slate-500 dark:text-slate-400">
            {fmt(stats.avgPenalty)} straffar/match
          </div>
        </div>
      </div>

      {/* Summary Insight */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/10 dark:to-indigo-900/10 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
        <div className="text-sm text-blue-800 dark:text-blue-200">
          <strong>Sammanfattning:</strong> Baserat på {stats.totalMatches} matcher visar statistiken {activity.level.toLowerCase()} 
          med totalt {stats.totalYellow} gula kort, {stats.totalRed} röda kort och {stats.totalPenalty} straffar.
        </div>
      </div>
    </div>
  );
}
