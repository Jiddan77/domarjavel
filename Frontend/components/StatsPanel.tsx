import { BarChart3, Users, AlertTriangle, Target } from "lucide-react";

export default function StatsPanel({ stats }: { stats: any }) {
  if (!stats) return null;
  
  const statItems = [
    {
      icon: Users,
      label: "Matcher",
      value: stats.totalMatches ?? 0,
      color: "text-blue-600",
      bgColor: "bg-blue-50 dark:bg-blue-900/20",
      borderColor: "border-blue-200 dark:border-blue-800"
    },
    {
      icon: AlertTriangle,
      label: "Gula kort",
      value: stats.totalYellow ?? 0,
      average: stats.avgYellow,
      color: "text-yellow-600",
      bgColor: "bg-yellow-50 dark:bg-yellow-900/20",
      borderColor: "border-yellow-200 dark:border-yellow-800"
    },
    {
      icon: BarChart3,
      label: "Röda kort",
      value: stats.totalRed ?? 0,
      average: stats.avgRed,
      color: "text-red-600",
      bgColor: "bg-red-50 dark:bg-red-900/20",
      borderColor: "border-red-200 dark:border-red-800"
    },
    {
      icon: Target,
      label: "Straffar",
      value: stats.totalPenalty ?? 0,
      average: stats.avgPenalty,
      color: "text-purple-600",
      bgColor: "bg-purple-50 dark:bg-purple-900/20",
      borderColor: "border-purple-200 dark:border-purple-800"
    }
  ];
  
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {statItems.map((item, index) => {
        const Icon = item.icon;
        return (
          <div 
            key={index}
            className={`p-3 sm:p-6 rounded-xl border-2 ${item.bgColor} ${item.borderColor} transition-all hover:shadow-md`}
          >
            <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
              <div className={`p-1 sm:p-2 rounded-lg ${item.bgColor} ${item.color}`}>
                <Icon className="w-3 h-3 sm:w-5 sm:h-5" />
              </div>
              <div className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300">
                {item.label}
              </div>
            </div>
            
            <div className="space-y-1">
              <div className={`text-xl sm:text-3xl font-bold ${item.color}`}>
                {item.value.toLocaleString()}
              </div>
              {item.average !== undefined && (
                <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                  Snitt: {typeof item.average === 'number' ? item.average.toFixed(2) : '-'}/match
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}