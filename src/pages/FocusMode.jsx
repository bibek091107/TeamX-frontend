// src/pages/FocusMode.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import useStore from "../store/useStore";
import { tasksApi } from "../services/api";
import { format, parseISO, isToday, isPast } from "date-fns";
import { 
  Target, CheckCircle, Circle, Clock, AlertTriangle, Pin, PinOff,
  ArrowRight, MessageSquare, Plus, RefreshCw
} from "lucide-react";
import toast from "react-hot-toast";

function PriorityBadge({ priority }) {
  const cls = {
    critical: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    high: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
    medium: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
    low: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400",
  };
  return <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${cls[priority] || cls.medium}`}>{priority}</span>;
}

export default function FocusMode() {
  const { activeTeam, user, teamMembers } = useStore();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pinning, setPinning] = useState({});

  const load = async () => {
    if (!activeTeam) return;
    setLoading(true);
    try {
      const r = await tasksApi.getFocus(activeTeam.id);
      setData(r.data);
    } catch (e) {
      toast.error("Failed to load focus data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [activeTeam?.id]);

  const togglePin = async (taskId, isPinned) => {
    setPinning(p => ({ ...p, [taskId]: true }));
    try {
      if (isPinned) {
        await tasksApi.removePin(activeTeam.id, taskId);
        toast.success("Unpinned");
      } else {
        await tasksApi.addPin(activeTeam.id, taskId);
        toast.success("Pinned as priority");
      }
      load();
    } catch (e) {
      toast.error("Failed to update pin");
    } finally {
      setPinning(p => ({ ...p, [taskId]: false }));
    }
  };

  const updateStatus = async (taskId, status) => {
    try {
      await tasksApi.changeStatus(activeTeam.id, taskId, status);
      toast.success("Status updated");
      load();
    } catch (e) {
      toast.error(e.response?.data?.error || "Failed to update");
    }
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-6 max-w-7xl mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-[var(--surface-2)] rounded w-48"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {[1,2,3].map(i => <div key={i} className="h-40 bg-[var(--surface-2)] rounded-xl"></div>)}
          </div>
        </div>
      </div>
    );
  }

  const priorities = data?.priorities || [];
  const pinned = data?.pinned || [];
  const myTasks = data?.myTasks || { to_do: [], in_progress: [], in_review: [], done: [] };
  const dueSoon = data?.dueSoon || { today: [], week: [], overdue: [] };
  const blocked = data?.blocked || [];
  const recentActivity = data?.recentActivity || [];

  const totalMy = (myTasks.to_do?.length || 0) + (myTasks.in_progress?.length || 0) + (myTasks.in_review?.length || 0);

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text)] flex items-center gap-2">
            <Target className="text-brand-500" size={28} />
            Focus Mode
          </h1>
          <p className="text-[var(--text-2)] mt-1">What should I work on next?</p>
        </div>
        <button onClick={load} className="btn-secondary flex items-center gap-2">
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      {/* Today's Priorities */}
      <section className="card p-4 sm:p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-[var(--text)] flex items-center gap-2">
            <Target size={20} className="text-brand-500" />
            Today's Priorities
          </h2>
        </div>
        {priorities.length === 0 ? (
          <p className="text-[var(--text-2)] text-sm py-4">No urgent priorities right now. Great job staying on top of things!</p>
        ) : (
          <div className="space-y-2">
            {priorities.map(task => (
              <div key={task.id} className="flex items-center gap-3 p-3 rounded-xl bg-[var(--surface-2)] hover:bg-[var(--border)] transition-colors">
                <button onClick={() => updateStatus(task.id, task.status === 'in_progress' ? 'done' : task.status === 'to_do' || task.status === 'backlog' ? 'in_progress' : 'done')}>
                  {task.status === 'done' ? <CheckCircle size={18} className="text-green-500" /> : 
                   task.status === 'in_progress' ? <Circle size={18} className="text-blue-500" /> : 
                   <Circle size={18} className="text-[var(--text-2)]" />}
                </button>
                <div className="flex-1 min-w-0" onClick={() => navigate('/tasks')} style={{ cursor: 'pointer' }}>
                  <p className={`font-medium text-[var(--text)] ${task.status === 'done' ? 'line-through opacity-60' : ''}`}>{task.title}</p>
                  <p className="text-xs text-brand-500 mt-0.5">{task.priorityReason}</p>
                </div>
                <PriorityBadge priority={task.priority} />
                {task.deadline && (
                  <span className="text-xs text-[var(--text-2)] hidden sm:flex items-center gap-1">
                    <Clock size={12} /> {format(parseISO(task.deadline), "MMM d")}
                  </span>
                )}
                <button onClick={() => togglePin(task.id, pinned.some(p => p.id === task.id))} className="p-1.5 hover:bg-[var(--surface)] rounded-lg">
                  {pinned.some(p => p.id === task.id) ? <Pin size={16} className="text-brand-500" /> : <PinOff size={16} className="text-[var(--text-2)]" />}
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* My Tasks */}
          <section className="card p-4 sm:p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-[var(--text)]">My Tasks</h2>
              <button onClick={() => navigate('/tasks')} className="text-sm text-brand-500 hover:underline flex items-center gap-1">
                View all <ArrowRight size={14} />
              </button>
            </div>
            {totalMy === 0 && (myTasks.done?.length || 0) === 0 ? (
              <p className="text-[var(--text-2)] text-sm py-4">No tasks assigned to you yet.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { key: 'to_do', label: 'To Do', color: 'bg-gray-500' },
                  { key: 'in_progress', label: 'In Progress', color: 'bg-blue-500' },
                  { key: 'in_review', label: 'In Review', color: 'bg-purple-500' },
                  { key: 'done', label: 'Done', color: 'bg-green-500' },
                ].map(col => (
                  <div key={col.key}>
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`w-2 h-2 rounded-full ${col.color}`}></div>
                      <span className="text-sm font-medium text-[var(--text)]">{col.label}</span>
                      <span className="text-xs text-[var(--text-2)]">({myTasks[col.key]?.length || 0})</span>
                    </div>
                    <div className="space-y-2">
                      {(myTasks[col.key] || []).slice(0, 3).map(task => (
                        <div key={task.id} className="p-2.5 rounded-lg bg-[var(--surface-2)] text-sm text-[var(--text)] truncate">
                          {task.title}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Recent Team Activity */}
          <section className="card p-4 sm:p-5">
            <h2 className="text-lg font-semibold text-[var(--text)] mb-4">Recent Team Activity</h2>
            {recentActivity.length === 0 ? (
              <p className="text-[var(--text-2)] text-sm py-4">No recent activity.</p>
            ) : (
              <div className="space-y-2">
                {recentActivity.slice(0, 5).map((activity, i) => (
                  <div key={i} className="flex items-center gap-3 p-2 rounded-lg">
                    <div className="w-8 h-8 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center">
                      <CheckCircle size={16} className="text-brand-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-[var(--text)] truncate">{activity.task?.title}</p>
                      <p className="text-xs text-[var(--text-2)]">Updated recently</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        <div className="space-y-6">
          {/* Due Soon */}
          <section className="card p-4 sm:p-5">
            <h2 className="text-lg font-semibold text-[var(--text)] mb-4 flex items-center gap-2">
              <Clock size={20} className="text-amber-500" />
              Due Soon
            </h2>
            {dueSoon.overdue?.length > 0 && (
              <div className="mb-3">
                <p className="text-xs font-medium text-red-500 mb-2">Overdue</p>
                {dueSoon.overdue.map(task => (
                  <div key={task.id} className="flex items-center gap-2 p-2 rounded-lg bg-red-50 dark:bg-red-900/10 mb-1">
                    <AlertTriangle size={14} className="text-red-500" />
                    <span className="text-sm text-[var(--text)] flex-1 truncate">{task.title}</span>
                    <span className="text-xs text-red-500">{task.overdueDays}d</span>
                  </div>
                ))}
              </div>
            )}
            {dueSoon.today?.length > 0 && (
              <div className="mb-3">
                <p className="text-xs font-medium text-amber-500 mb-2">Due Today</p>
                {dueSoon.today.map(task => (
                  <div key={task.id} className="flex items-center gap-2 p-2 rounded-lg bg-amber-50 dark:bg-amber-900/10 mb-1">
                    <Clock size={14} className="text-amber-500" />
                    <span className="text-sm text-[var(--text)] flex-1 truncate">{task.title}</span>
                  </div>
                ))}
              </div>
            )}
            {dueSoon.week?.length > 0 && (
              <div>
                <p className="text-xs font-medium text-[var(--text-2)] mb-2">Next 7 Days</p>
                {dueSoon.week.slice(0, 3).map(task => (
                  <div key={task.id} className="flex items-center gap-2 p-2 rounded-lg mb-1">
                    <Clock size={14} className="text-[var(--text-2)]" />
                    <span className="text-sm text-[var(--text)] flex-1 truncate">{task.title}</span>
                    {task.deadline && <span className="text-xs text-[var(--text-2)]">{format(parseISO(task.deadline), "MMM d")}</span>}
                  </div>
                ))}
              </div>
            )}
            {(!dueSoon.overdue?.length && !dueSoon.today?.length && !dueSoon.week?.length) && (
              <p className="text-[var(--text-2)] text-sm">Nothing due soon</p>
            )}
          </section>

          {/* Blocked Tasks */}
          <section className="card p-4 sm:p-5">
            <h2 className="text-lg font-semibold text-[var(--text)] mb-4 flex items-center gap-2">
              <AlertTriangle size={20} className="text-red-500" />
              Blocked Tasks
            </h2>
            {blocked.length === 0 ? (
              <p className="text-[var(--text-2)] text-sm">No blocked tasks</p>
            ) : (
              <div className="space-y-2">
                {blocked.map(task => (
                  <div key={task.id} className="p-2.5 rounded-lg bg-red-50 dark:bg-red-900/10">
                    <p className="text-sm font-medium text-[var(--text)]">{task.title}</p>
                    {task.blockedReason && <p className="text-xs text-red-600 dark:text-red-400 mt-1">{task.blockedReason}</p>}
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Quick Actions */}
          <section className="card p-4 sm:p-5">
            <h2 className="text-lg font-semibold text-[var(--text)] mb-4">Quick Actions</h2>
            <div className="space-y-2">
              <button onClick={() => navigate('/tasks')} className="w-full flex items-center gap-2 p-2.5 rounded-lg hover:bg-[var(--surface-2)] text-left text-[var(--text)]">
                <CheckCircle size={18} className="text-brand-500" /> Open Kanban Board
              </button>
              <button onClick={() => navigate('/tasks')} className="w-full flex items-center gap-2 p-2.5 rounded-lg hover:bg-[var(--surface-2)] text-left text-[var(--text)]">
                <Target size={18} className="text-blue-500" /> View Assigned Tasks
              </button>
              <button onClick={() => navigate('/chat')} className="w-full flex items-center gap-2 p-2.5 rounded-lg hover:bg-[var(--surface-2)] text-left text-[var(--text)]">
                <MessageSquare size={18} className="text-green-500" /> Go to Team Chat
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
