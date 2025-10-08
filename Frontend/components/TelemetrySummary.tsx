import { useState, useEffect } from "react";
import { BarChart3, Activity, Clock, Trash2, Eye, EyeOff } from "lucide-react";
import { telemetry } from "@/lib/telemetry";
import Card from "./ui/Card";
import Button from "./ui/Button";

const formatTime = (timestamp: number) => {
  return new Date(timestamp).toLocaleString();
};

const formatDuration = (ms: number) => {
  const minutes = Math.floor(ms / (1000 * 60));
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `${days}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  return `${minutes}m`;
};

export default function TelemetrySummary() {
  const [summary, setSummary] = useState<any>(null);
  const [recentEvents, setRecentEvents] = useState<any[]>([]);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = () => {
    setSummary(telemetry.getSummary());
    setRecentEvents(telemetry.getEvents(undefined, 10));
  };

  const handleClearData = () => {
    if (confirm('Are you sure you want to clear all telemetry data?')) {
      telemetry.clearData();
      refreshData();
    }
  };

  if (!summary) {
    return (
      <Card>
        <div className="text-center py-8">
          <Activity className="w-12 h-12 mx-auto mb-3 opacity-50 text-slate-400" />
          <p className="text-slate-500 dark:text-slate-400">Loading telemetry data...</p>
        </div>
      </Card>
    );
  }

  const eventTypeLabels: Record<string, string> = {
    filter_change: "Filter Changes",
    drill_down: "Drill-downs",
    vote: "Votes Cast",
    page_view: "Page Views",
    team_select: "Team Selections",
    ranking_view: "Ranking Views"
  };

  const eventTypeIcons: Record<string, string> = {
    filter_change: "🔍",
    drill_down: "🔎", 
    vote: "👍",
    page_view: "📄",
    team_select: "❤️",
    ranking_view: "🏆"
  };

  return (
    <Card>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <BarChart3 className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Usage Analytics
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            icon={showDetails ? EyeOff : Eye}
            onClick={() => setShowDetails(!showDetails)}
          >
            {showDetails ? "Hide" : "Show"} Details
          </Button>
          <Button
            variant="danger"
            size="sm"
            icon={Trash2}
            onClick={handleClearData}
          >
            Clear Data
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">{summary.totalEvents}</div>
          <div className="text-xs text-slate-600 dark:text-slate-400">Total Events</div>
        </div>
        <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
          <div className="text-2xl font-bold text-green-600">{summary.recentEvents}</div>
          <div className="text-xs text-slate-600 dark:text-slate-400">Last 24h</div>
        </div>
        <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
          <div className="text-2xl font-bold text-purple-600">{summary.hourlyEvents}</div>
          <div className="text-xs text-slate-600 dark:text-slate-400">Last Hour</div>
        </div>
        <div className="text-center p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
          <div className="text-2xl font-bold text-orange-600">
            {Object.keys(summary.eventTypes).length}
          </div>
          <div className="text-xs text-slate-600 dark:text-slate-400">Event Types</div>
        </div>
      </div>

      {/* Event Type Breakdown */}
      <div className="space-y-3 mb-6">
        <h4 className="font-medium text-slate-900 dark:text-slate-100">Event Breakdown</h4>
        {Object.entries(summary.eventTypes).map(([type, count]) => (
          <div key={type} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
            <div className="flex items-center gap-3">
              <span className="text-lg">{eventTypeIcons[type] || "📊"}</span>
              <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                {eventTypeLabels[type] || type}
              </span>
            </div>
            <span className="text-sm font-bold text-slate-600 dark:text-slate-400">
              {count}
            </span>
          </div>
        ))}
      </div>

      {/* Session Info */}
      <div className="p-3 bg-slate-50 dark:bg-slate-700 rounded-lg mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Clock className="w-4 h-4 text-slate-500" />
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Session Info</span>
        </div>
        <div className="text-xs text-slate-600 dark:text-slate-400 space-y-1">
          <div>Session ID: {summary.sessionId}</div>
          {summary.firstEvent && (
            <div>First Event: {formatTime(summary.firstEvent)}</div>
          )}
          {summary.lastEvent && (
            <div>Last Event: {formatTime(summary.lastEvent)}</div>
          )}
          {summary.firstEvent && summary.lastEvent && (
            <div>Session Duration: {formatDuration(summary.lastEvent - summary.firstEvent)}</div>
          )}
        </div>
      </div>

      {/* Recent Events */}
      {showDetails && (
        <div>
          <h4 className="font-medium text-slate-900 dark:text-slate-100 mb-3">Recent Events</h4>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {recentEvents.map((event) => (
              <div key={event.id} className="p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{eventTypeIcons[event.type] || "📊"}</span>
                    <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                      {eventTypeLabels[event.type] || event.type}
                    </span>
                  </div>
                  <span className="text-xs text-slate-500">
                    {formatTime(event.timestamp)}
                  </span>
                </div>
                {Object.keys(event.data).length > 0 && (
                  <div className="text-xs text-slate-600 dark:text-slate-400 font-mono">
                    {JSON.stringify(event.data, null, 2)}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}