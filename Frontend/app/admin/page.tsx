"use client";

import { useState } from "react";
import { Shield, Users, Trash2, Eye, AlertTriangle, ArrowLeft } from "lucide-react";
import Link from "next/link";
import TelemetrySummary from "@/components/TelemetrySummary";

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

type AdminVoteData = {
  [refereeName: string]: VoteData;
};

export default function AdminPage() {
  const [votes, setVotes] = useState<AdminVoteData>({});
  const [isLoading, setIsLoading] = useState(true);
  const [adminPassword, setAdminPassword] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showDetails, setShowDetails] = useState<string | null>(null);

  // Simple admin authentication (in production, use proper auth)
  const handleAuth = () => {
    if (adminPassword === "dommarjavel2024") {
      setIsAuthenticated(true);
      fetchAllVotes();
    } else {
      alert("Incorrect password");
    }
  };

  const fetchAllVotes = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";
      const response = await fetch(`${apiUrl}/api/referee-votes`);
      if (response.ok) {
        const data = await response.json();
        setVotes(data);
      }
    } catch (error) {
      console.error("Failed to fetch votes:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const clearRefereeVotes = async (refereeName: string) => {
    if (!confirm(`Are you sure you want to clear all votes for ${refereeName}?`)) {
      return;
    }

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";
      const response = await fetch(`${apiUrl}/api/referee-votes/clear`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ referee: refereeName }),
      });

      if (response.ok) {
        await fetchAllVotes();
      } else {
        alert("Failed to clear votes");
      }
    } catch (error) {
      console.error("Failed to clear votes:", error);
      alert("Failed to clear votes");
    }
  };

  const clearAllVotes = async () => {
    if (!confirm("Are you sure you want to clear ALL votes? This cannot be undone!")) {
      return;
    }

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";
      const response = await fetch(`${apiUrl}/api/referee-votes/clear-all`, {
        method: "POST",
      });

      if (response.ok) {
        await fetchAllVotes();
      } else {
        alert("Failed to clear all votes");
      }
    } catch (error) {
      console.error("Failed to clear all votes:", error);
      alert("Failed to clear all votes");
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-8 max-w-md w-full mx-4">
          <div className="text-center mb-6">
            <Shield className="w-12 h-12 mx-auto mb-4 text-red-600" />
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Admin Access</h1>
            <p className="text-slate-600 dark:text-slate-400 mt-2">
              Enter admin password to manage votes
            </p>
          </div>
          
          <div className="space-y-4">
            <input
              type="password"
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              placeholder="Admin password"
              className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-red-500 focus:border-transparent"
              onKeyPress={(e) => e.key === "Enter" && handleAuth()}
            />
            
            <button
              onClick={handleAuth}
              className="w-full px-4 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
            >
              Access Admin Panel
            </button>
            
            <Link
              href="/"
              className="flex items-center justify-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Homepage
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const sortedReferees = Object.entries(votes).sort(([,a], [,b]) => b.total - a.total);
  const totalVotes = Object.values(votes).reduce((sum, vote) => sum + vote.total, 0);
  const suspiciousReferees = sortedReferees.filter(([, vote]) => {
    const approvalRate = vote.total > 0 ? (vote.up / vote.total) : 0;
    return vote.total > 50 && (approvalRate < 0.1 || approvalRate > 0.9);
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-b border-slate-200 dark:border-slate-700">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link 
                href="/"
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-red-600">Admin Panel</h1>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Vote management and spam detection
                </p>
              </div>
            </div>
            
            <button
              onClick={clearAllVotes}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Clear All Votes
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Summary Stats */}
        <div className="grid sm:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
            <div className="flex items-center gap-3 mb-2">
              <Users className="w-5 h-5 text-blue-600" />
              <h3 className="font-semibold text-slate-900 dark:text-slate-100">Total Votes</h3>
            </div>
            <div className="text-3xl font-bold text-blue-600">{totalVotes.toLocaleString()}</div>
            <div className="text-sm text-slate-600 dark:text-slate-400">Across all referees</div>
          </div>
          
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
            <div className="flex items-center gap-3 mb-2">
              <Shield className="w-5 h-5 text-green-600" />
              <h3 className="font-semibold text-slate-900 dark:text-slate-100">Referees Voted</h3>
            </div>
            <div className="text-3xl font-bold text-green-600">{Object.keys(votes).length}</div>
            <div className="text-sm text-slate-600 dark:text-slate-400">With at least 1 vote</div>
          </div>
          
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
            <div className="flex items-center gap-3 mb-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <h3 className="font-semibold text-slate-900 dark:text-slate-100">Suspicious</h3>
            </div>
            <div className="text-3xl font-bold text-red-600">{suspiciousReferees.length}</div>
            <div className="text-sm text-slate-600 dark:text-slate-400">Extreme ratings (&gt;50 votes)</div>
          </div>
        </div>

        {/* Suspicious Referees Alert */}
        {suspiciousReferees.length > 0 && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <h3 className="font-semibold text-red-700 dark:text-red-300">Suspicious Voting Patterns</h3>
            </div>
            <div className="space-y-2">
              {suspiciousReferees.map(([name, vote]) => {
                const approvalRate = (vote.up / vote.total) * 100;
                return (
                  <div key={name} className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-lg">
                    <div>
                      <div className="font-medium text-slate-900 dark:text-slate-100">{name}</div>
                      <div className="text-sm text-slate-600 dark:text-slate-400">
                        {vote.total} votes • {approvalRate.toFixed(1)}% approval
                      </div>
                    </div>
                    <button
                      onClick={() => clearRefereeVotes(name)}
                      className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition-colors"
                    >
                      Clear Votes
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Usage Analytics */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 mb-8">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Usage Analytics</h3>
          <TelemetrySummary />
        </div>

        {/* All Referees List */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
          <div className="p-6 border-b border-slate-200 dark:border-slate-700">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">All Referee Votes</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              Click to view detailed breakdown by team
            </p>
          </div>
          
          <div className="p-6">
            {isLoading ? (
              <div className="text-center py-8">
                <div className="text-slate-600 dark:text-slate-400">Loading votes...</div>
              </div>
            ) : (
              <div className="space-y-3">
                {sortedReferees.map(([name, vote]) => {
                  const approvalRate = vote.total > 0 ? (vote.up / vote.total) * 100 : 0;
                  const isExpanded = showDetails === name;
                  
                  return (
                    <div key={name} className="border border-slate-200 dark:border-slate-600 rounded-lg">
                      <div 
                        className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                        onClick={() => setShowDetails(isExpanded ? null : name)}
                      >
                        <div className="flex items-center gap-4">
                          <Eye className="w-4 h-4 text-slate-400" />
                          <div>
                            <div className="font-medium text-slate-900 dark:text-slate-100">{name}</div>
                            <div className="text-sm text-slate-600 dark:text-slate-400">
                              {vote.total} votes • {approvalRate.toFixed(1)}% approval
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4">
                          <div className="text-right text-sm">
                            <div className="text-green-600 font-medium">{vote.up} 👍</div>
                            <div className="text-red-600 font-medium">{vote.down} 👎</div>
                          </div>
                          
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              clearRefereeVotes(name);
                            }}
                            className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition-colors"
                          >
                            Clear
                          </button>
                        </div>
                      </div>
                      
                      {isExpanded && Object.keys(vote.by_team).length > 0 && (
                        <div className="px-4 pb-4 border-t border-slate-200 dark:border-slate-600">
                          <div className="pt-4">
                            <h4 className="font-medium text-slate-900 dark:text-slate-100 mb-3">Votes by Team</h4>
                            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                              {Object.entries(vote.by_team).map(([team, teamVote]) => {
                                const teamApproval = teamVote.total > 0 ? (teamVote.up / teamVote.total) * 100 : 0;
                                return (
                                  <div key={team} className="p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
                                    <div className="font-medium text-sm text-slate-900 dark:text-slate-100">{team}</div>
                                    <div className="text-xs text-slate-600 dark:text-slate-400">
                                      {teamVote.total} votes • {teamApproval.toFixed(1)}% approval
                                    </div>
                                    <div className="flex gap-2 mt-1 text-xs">
                                      <span className="text-green-600">{teamVote.up} 👍</span>
                                      <span className="text-red-600">{teamVote.down} 👎</span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
                
                {sortedReferees.length === 0 && (
                  <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                    No votes recorded yet
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}