// src/pages/OnboardingPage.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { authApi } from "../services/api";
import useStore from "../store/useStore";
import {
  Brain, Plus, Users, ArrowRight, Copy, CheckCircle2,
  RefreshCw, Building2, Shield, UserCheck, AlertCircle
} from "lucide-react";

export default function OnboardingPage() {
  const navigate = useNavigate();
  const { teams, setTeams, setActiveTeam, activeTeam, user } = useStore();

  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [createdTeam, setCreatedTeam] = useState(null);
  const [form, setForm] = useState({ name: "", description: "" });
  const [inviteCode, setInviteCode] = useState("");
  const [selectedTeamId, setSelectedTeamId] = useState("");

  // Filter only active teams that the user can access
  const activeTeams = (teams || []).filter(t => t.membershipStatus !== "pending");

  // Default mode: if teams exist, start with "continue"; if none, start with "create"
  const [tab, setTab] = useState(activeTeams.length > 0 ? "continue" : "create");

  // Sync selectedTeamId when activeTeams change
  useEffect(() => {
    if (activeTeams.length > 0) {
      if (!selectedTeamId || !activeTeams.some(t => t.id === selectedTeamId)) {
        // Prioritize lastActiveTeamId or activeTeam or first team
        const initial = activeTeams.find(t => t.id === activeTeam?.id) || activeTeams[0];
        setSelectedTeamId(initial.id);
      }
    } else if (tab === "continue") {
      setTab("create");
    }
  }, [teams]);

  // Load / refresh teams from server & Firestore
  const refreshTeams = async () => {
    setRefreshing(true);
    try {
      const res = await authApi.getMyTeams();
      const updatedTeams = res.data.teams || [];
      setTeams(updatedTeams);
      toast.success("Team memberships refreshed!");
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to refresh teams");
    } finally {
      setRefreshing(false);
    }
  };

  // Option 1: Continue to Existing Team
  const handleContinue = async () => {
    if (!selectedTeamId) {
      toast.error("Please select a team to continue");
      return;
    }
    setLoading(true);
    try {
      const r = await authApi.selectTeam(selectedTeamId);
      const team = r.data.team || activeTeams.find(t => t.id === selectedTeamId);
      setActiveTeam(team);
      toast.success(`Entering ${team.name} workspace…`);
      navigate("/");
    } catch (e) {
      // Offline fallback: continue with cached active team
      const fallback = activeTeams.find(t => t.id === selectedTeamId);
      if (fallback) {
        setActiveTeam(fallback);
        navigate("/");
      } else {
        toast.error(e.response?.data?.error || "Failed to enter team workspace");
      }
    } finally {
      setLoading(false);
    }
  };

  // Option 2: Create New Team
  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("Team name is required");
      return;
    }
    setLoading(true);
    try {
      const r = await authApi.createTeam(form);
      const team = r.data.team;
      const teamsR = await authApi.getMyTeams();
      setTeams(teamsR.data.teams);
      setActiveTeam(team);
      setCreatedTeam(team);
      toast.success(`Team "${team.name}" created! 🎉`);
    } catch (e) {
      toast.error(e.response?.data?.error || "Failed to create team");
    } finally {
      setLoading(false);
    }
  };

  // Option 3: Join Another Team via Code
  const handleJoin = async (e) => {
    e.preventDefault();
    if (!inviteCode.trim()) {
      toast.error("Invite code is required");
      return;
    }
    setLoading(true);
    try {
      const r = await authApi.joinTeam(inviteCode.trim());
      const team = r.data.team;
      const status = r.data.membershipStatus || team.membershipStatus;
      const teamsR = await authApi.getMyTeams();
      setTeams(teamsR.data.teams);

      if (status === "pending") {
        toast("Join request sent! Waiting for team owner approval.", { icon: "⏳" });
        setTab("continue");
      } else {
        setActiveTeam(team);
        toast.success(`Joined "${team.name}" successfully! 🎉`);
        navigate("/");
      }
    } catch (e) {
      toast.error(e.response?.data?.error || "Invalid invite code");
    } finally {
      setLoading(false);
    }
  };

  // Celebration screen after creating a new team
  if (createdTeam) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg)] p-6">
        <div className="w-full max-w-md text-center">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">🎉</span>
          </div>
          <h1 className="text-2xl font-bold text-[var(--text)] mb-2">Team Created!</h1>
          <p className="text-[var(--text-2)] text-sm mb-6">
            Share this invite code with your teammates so they can join your workspace.
          </p>

          <div className="card p-5 mb-5 shadow-sm">
            <p className="text-xs font-semibold text-[var(--text-2)] uppercase tracking-wider mb-2">Workspace Invite Code</p>
            <div className="flex items-center gap-3 bg-[var(--surface-2)] rounded-xl px-4 py-3 border border-[var(--border)]">
              <span className="font-mono text-2xl font-bold text-brand-600 tracking-widest flex-1 text-center select-all">
                {createdTeam.inviteCode}
              </span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(createdTeam.inviteCode);
                  toast.success("Invite code copied to clipboard!");
                }}
                className="btn-ghost p-2"
                title="Copy code"
              >
                <Copy size={16}/>
              </button>
            </div>
            <p className="text-xs text-[var(--text-2)] mt-2 text-center">
              Teammates select "Join Another Team via Code" and paste this code.
            </p>
          </div>

          <button
            onClick={() => navigate("/")}
            className="btn-primary w-full justify-center py-3"
          >
            Enter Dashboard <ArrowRight size={16}/>
          </button>
        </div>
      </div>
    );
  }

  const selectedTeam = activeTeams.find(t => t.id === selectedTeamId) || activeTeams[0];

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg)] p-4 sm:p-6">
      <div className="w-full max-w-xl">
        {/* Header / Branding */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-brand-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-brand">
            <Brain size={32} className="text-white"/>
          </div>
          <h1 className="text-2xl font-bold text-[var(--text)]">Choose Your Workspace</h1>
          <p className="text-[var(--text-2)] text-sm mt-1">
            {user?.email ? `Signed in as ${user.email}` : "Collaborate with your team seamlessly"}
          </p>
        </div>

        {/* Card Container */}
        <div className="card p-6 shadow-md border border-[var(--border)]">
          {/* Top 3 Options Navigation */}
          <div className="grid grid-cols-3 gap-2 bg-[var(--surface-2)] p-1.5 rounded-xl mb-6 border border-[var(--border)]">
            {/* Option 1: Continue to Existing Team */}
            <button
              onClick={() => activeTeams.length > 0 && setTab("continue")}
              disabled={activeTeams.length === 0}
              className={`py-2.5 px-2 rounded-lg text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-1.5 ${
                tab === "continue"
                  ? "bg-[var(--surface)] shadow-sm text-brand-600 dark:text-brand-400 font-bold"
                  : activeTeams.length === 0
                  ? "opacity-40 cursor-not-allowed text-[var(--text-muted)]"
                  : "text-[var(--text-2)] hover:text-[var(--text)]"
              }`}
              title={activeTeams.length === 0 ? "No existing teams yet" : "Continue to an existing team"}
            >
              <Building2 size={15}/>
              <span>Continue Team</span>
            </button>

            {/* Option 2: Create New Team */}
            <button
              onClick={() => setTab("create")}
              className={`py-2.5 px-2 rounded-lg text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-1.5 ${
                tab === "create"
                  ? "bg-[var(--surface)] shadow-sm text-brand-600 dark:text-brand-400 font-bold"
                  : "text-[var(--text-2)] hover:text-[var(--text)]"
              }`}
            >
              <Plus size={15}/>
              <span>Create Team</span>
            </button>

            {/* Option 3: Join via Code */}
            <button
              onClick={() => setTab("join")}
              className={`py-2.5 px-2 rounded-lg text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-1.5 ${
                tab === "join"
                  ? "bg-[var(--surface)] shadow-sm text-brand-600 dark:text-brand-400 font-bold"
                  : "text-[var(--text-2)] hover:text-[var(--text)]"
              }`}
            >
              <Users size={15}/>
              <span>Join via Code</span>
            </button>
          </div>

          {/* TAB 1: Continue to Existing Team */}
          {tab === "continue" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className="text-sm font-bold text-[var(--text)]">Previously Joined Teams</h3>
                  <p className="text-xs text-[var(--text-2)]">Select a workspace to resume collaboration</p>
                </div>
                <button
                  onClick={refreshTeams}
                  disabled={refreshing}
                  className="btn-ghost text-xs p-1.5 gap-1"
                  title="Refresh team list"
                >
                  <RefreshCw size={13} className={refreshing ? "animate-spin" : ""}/>
                  <span>Refresh</span>
                </button>
              </div>

              {activeTeams.length === 0 ? (
                <div className="text-center py-8 border border-dashed border-[var(--border)] rounded-xl p-4">
                  <AlertCircle size={32} className="mx-auto text-[var(--text-muted)] mb-2"/>
                  <p className="text-sm font-semibold text-[var(--text)]">No Teams Found</p>
                  <p className="text-xs text-[var(--text-2)] mt-1 mb-4">
                    You haven't joined any teams yet. Create a new team or join one with an invite code.
                  </p>
                  <button onClick={() => setTab("create")} className="btn-primary text-xs py-2 px-4 mx-auto">
                    + Create Your First Team
                  </button>
                </div>
              ) : (
                <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                  {activeTeams.map((t) => {
                    const isSelected = t.id === selectedTeamId;
                    return (
                      <div
                        key={t.id}
                        onClick={() => setSelectedTeamId(t.id)}
                        className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                          isSelected
                            ? "border-brand-600 bg-brand-50/50 dark:bg-brand-900/20 shadow-sm"
                            : "border-[var(--border)] hover:border-gray-300 dark:hover:border-gray-700 bg-[var(--surface)]"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${
                            isSelected
                              ? "bg-brand-600 text-white"
                              : "bg-[var(--surface-2)] text-[var(--text)]"
                          }`}>
                            {t.name.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-sm text-[var(--text)]">{t.name}</span>
                              {t.createdBy === user?.id && (
                                <span className="text-[10px] bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 px-1.5 py-0.5 rounded font-medium">
                                  Owner
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-[var(--text-2)] line-clamp-1">
                              {t.description || "Active team workspace"}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-xs text-[var(--text-muted)] font-mono">
                            {t.memberCount || 1} {t.memberCount === 1 ? "member" : "members"}
                          </span>
                          <input
                            type="radio"
                            name="selectedTeam"
                            checked={isSelected}
                            onChange={() => setSelectedTeamId(t.id)}
                            className="text-brand-600 focus:ring-brand-500 h-4 w-4"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {activeTeams.length > 0 && (
                <button
                  onClick={handleContinue}
                  disabled={loading || !selectedTeamId}
                  className="btn-primary w-full justify-center py-3 text-sm mt-3"
                >
                  {loading ? "Connecting to Workspace…" : (
                    <>
                      <span>Continue to {selectedTeam?.name || "Team"}</span>
                      <ArrowRight size={16}/>
                    </>
                  )}
                </button>
              )}
            </div>
          )}

          {/* TAB 2: Create New Team */}
          {tab === "create" && (
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--text-2)] mb-1.5 uppercase tracking-wide">
                  Team / Workspace Name *
                </label>
                <input
                  className="input w-full"
                  placeholder="e.g. Acme Engineering, Product Design"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-2)] mb-1.5 uppercase tracking-wide">
                  Description <span className="font-normal normal-case text-[var(--text-muted)]">(optional)</span>
                </label>
                <textarea
                  className="input w-full resize-none"
                  rows={2}
                  placeholder="What is the mission or focus of this team?"
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full justify-center py-3 text-sm"
              >
                {loading ? "Creating Workspace…" : (
                  <>
                    <span>Create Team Workspace</span>
                    <ArrowRight size={16}/>
                  </>
                )}
              </button>
            </form>
          )}

          {/* TAB 3: Join Another Team via Code */}
          {tab === "join" && (
            <form onSubmit={handleJoin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--text-2)] mb-1.5 uppercase tracking-wide text-center">
                  8-Character Invite Code *
                </label>
                <input
                  className="input text-center tracking-[0.35em] text-2xl font-mono font-bold uppercase w-full py-3"
                  placeholder="XXXXXXXX"
                  value={inviteCode}
                  onChange={e => setInviteCode(e.target.value.toUpperCase())}
                  maxLength={8}
                  required
                  autoFocus
                />
                <p className="text-xs text-[var(--text-2)] mt-2 text-center">
                  Ask your team administrator or coworker for their team invite code.
                </p>
              </div>

              <button
                type="submit"
                disabled={loading || inviteCode.trim().length === 0}
                className="btn-primary w-full justify-center py-3 text-sm"
              >
                {loading ? "Joining Workspace…" : (
                  <>
                    <span>Join Team</span>
                    <ArrowRight size={16}/>
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        {/* Footer info */}
        <p className="text-center text-xs text-[var(--text-muted)] mt-4">
          Persistent cloud synchronization powered by Firestore & TeamX Backend.
        </p>
      </div>
    </div>
  );
}
