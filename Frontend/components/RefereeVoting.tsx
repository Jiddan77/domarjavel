import { useState, useEffect } from "react";
import { ThumbsUp, ThumbsDown, Users } from "lucide-react";

type VoteData = {
  up: number;
  down: number;
  total: number;
  by_team: {
    [teamName: string]: {
      up: number;
      down: number;
      total: number;
    };
  };
};

const fmt = (n?: number) => (typeof n === "number" && isFinite(n)) ? n.toLocaleString() : "0";
const pct = (n?: number, total?: number) => {
  if (!n || !total || total === 0) return "0%";
  return `${((n / total) * 100).toFixed(1)}%`;
};

export default function RefereeVoting({ 
  refereeName, 
  userTeamPreference,
  compact = false 
}: { 
  refereeName: string;
  userTeamPreference?: string;
  compact?: boolean;
}) {
  const [votes, setVotes] = useState<VoteData>({ up: 0, down: 0, total: 0, by_team: {} });
  const [userVote, setUserVote] = useState<"up" | "down" | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Load existing votes
  useEffect(() => {
    fetchVotes();
  }, [refereeName]);

  const fetchVotes = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";
      const response = await fetch(`${apiUrl}/api/referee-votes?referee=${encodeURIComponent(refereeName)}`);
      if (response.ok) {
        const data = await response.json();
        setVotes(data);
      }
    } catch (error) {
      console.error("Failed to fetch votes:", error);
    }
  };

  const submitVote = async (vote: "up" | "down") => {
    if (isLoading) return;
    
    setIsLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";
      const response = await fetch(`${apiUrl}/api/referee-vote`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          referee: refereeName,
          vote: vote,
          teamPreference: userTeamPreference
        }),
      });

      if (response.ok) {
        setUserVote(vote);
        await fetchVotes(); // Refresh vote counts
      }
    } catch (error) {
      console.error("Failed to submit vote:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const approvalRate = votes.total > 0 ? (votes.up / votes.total) * 100 : 0;
  const teamVotes = userTeamPreference ? votes.by_team[userTeamPreference] : null;
  const teamApprovalRate = teamVotes && teamVotes.total > 0 ? (teamVotes.up / teamVotes.total) * 100 : 0;

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1">
          <button
            onClick={() => submitVote("up")}
            disabled={isLoading || userVote !== null}
            className={`p-1 rounded transition-colors ${
              userVote === "up" 
                ? "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
                : "hover:bg-green-50 text-green-600 dark:hover:bg-green-900/20 dark:text-green-500"
            } ${userVote !== null ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            <ThumbsUp className="w-3 h-3" />
          </button>
          <span className="text-xs text-green-600 font-medium">{fmt(votes.up)}</span>
        </div>
        
        <div className="flex items-center gap-1">
          <button
            onClick={() => submitVote("down")}
            disabled={isLoading || userVote !== null}
            className={`p-1 rounded transition-colors ${
              userVote === "down" 
                ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
                : "hover:bg-red-50 text-red-600 dark:hover:bg-red-900/20 dark:text-red-500"
            } ${userVote !== null ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            <ThumbsDown className="w-3 h-3" />
          </button>
          <span className="text-xs text-red-600 font-medium">{fmt(votes.down)}</span>
        </div>
        
        <div className="text-xs text-slate-500">
          {pct(votes.up, votes.total)} approval
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 sm:p-6">
      <div className="flex items-center gap-3 mb-4">
        <Users className="w-5 h-5 text-purple-600" />
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          Community Rating: {refereeName}
        </h3>
      </div>

      {/* Overall Rating */}
      <div className="grid sm:grid-cols-2 gap-6 mb-6">
        <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
          <div className="text-3xl font-bold text-blue-600 mb-2">
            {approvalRate.toFixed(1)}%
          </div>
          <div className="text-sm text-slate-600 dark:text-slate-400 mb-3">Overall Approval</div>
          <div className="text-xs text-slate-500">
            {fmt(votes.up)} 👍 • {fmt(votes.down)} 👎 • {fmt(votes.total)} total votes
          </div>
        </div>

        {teamVotes && (
          <div className="text-center p-4 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-xl border border-emerald-200 dark:border-emerald-800">
            <div className="text-3xl font-bold text-emerald-600 mb-2">
              {teamApprovalRate.toFixed(1)}%
            </div>
            <div className="text-sm text-slate-600 dark:text-slate-400 mb-3">
              {userTeamPreference} Fans
            </div>
            <div className="text-xs text-slate-500">
              {fmt(teamVotes.up)} 👍 • {fmt(teamVotes.down)} 👎 • {fmt(teamVotes.total)} votes
            </div>
          </div>
        )}
      </div>

      {/* Voting Buttons */}
      <div className="flex gap-4 justify-center">
        <button
          onClick={() => submitVote("up")}
          disabled={isLoading || userVote !== null}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${
            userVote === "up" 
              ? "bg-green-100 text-green-700 border-2 border-green-300 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700"
              : "bg-green-50 text-green-600 border-2 border-green-200 hover:bg-green-100 dark:bg-green-900/10 dark:text-green-500 dark:border-green-800 dark:hover:bg-green-900/20"
          } ${userVote !== null ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          <ThumbsUp className="w-5 h-5" />
          {userVote === "up" ? "Voted!" : "Good Referee"}
        </button>
        
        <button
          onClick={() => submitVote("down")}
          disabled={isLoading || userVote !== null}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${
            userVote === "down" 
              ? "bg-red-100 text-red-700 border-2 border-red-300 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700"
              : "bg-red-50 text-red-600 border-2 border-red-200 hover:bg-red-100 dark:bg-red-900/10 dark:text-red-500 dark:border-red-800 dark:hover:bg-red-900/20"
          } ${userVote !== null ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          <ThumbsDown className="w-5 h-5" />
          {userVote === "down" ? "Voted!" : "Poor Referee"}
        </button>
      </div>

      {userVote && (
        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-center">
          <div className="text-sm text-blue-700 dark:text-blue-300">
            Thanks for your feedback! Your vote has been recorded.
          </div>
        </div>
      )}

      {userVote === null && (
        <div className="mt-4 text-center">
          <div className="text-xs text-slate-500">
            Rate this referee based on your experience watching their matches
          </div>
        </div>
      )}
    </div>
  );
}