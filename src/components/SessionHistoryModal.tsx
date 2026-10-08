import React from 'react';
import { FeedbackReport } from '../types/gd';
import { History, Trash2, ArrowRight, Award, Clock } from 'lucide-react';

interface SessionHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  history: FeedbackReport[];
  onSelectReport: (report: FeedbackReport) => void;
  onClearHistory: () => void;
}

export const SessionHistoryModal: React.FC<SessionHistoryModalProps> = ({
  isOpen,
  onClose,
  history,
  onSelectReport,
  onClearHistory,
}) => {
  if (!isOpen) return null;

  const averageScore = history.length
    ? Math.round(history.reduce((acc, curr) => acc + curr.overallScore, 0) / history.length)
    : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <History className="w-4 h-4" />
            </span>
            <h3 className="font-bold text-slate-100 text-lg">Your GD Practice History</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 text-sm"
          >
            ✕
          </button>
        </div>

        <div className="p-6 space-y-4 max-h-[65vh] overflow-y-auto">
          {history.length > 0 && (
            <div className="grid grid-cols-2 gap-3 p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs">
              <div>
                <span className="text-slate-400 block">Total GD Rounds Practiced</span>
                <span className="text-xl font-bold text-slate-100">{history.length} sessions</span>
              </div>
              <div>
                <span className="text-slate-400 block">Average Placement Score</span>
                <span className="text-xl font-bold text-amber-400">{averageScore}/100</span>
              </div>
            </div>
          )}

          {history.length === 0 ? (
            <div className="text-center py-12 text-slate-500 space-y-2 text-xs">
              <p>No past GD sessions found yet.</p>
              <p>Complete a group discussion round to track your placement scores and progress over time!</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {history.map((item) => (
                <div
                  key={item.id}
                  onClick={() => {
                    onSelectReport(item);
                    onClose();
                  }}
                  className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-indigo-500/50 hover:bg-slate-950 transition-all cursor-pointer flex items-center justify-between gap-3 text-left group"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 text-[10px] text-slate-400">
                      <span>{item.date}</span>
                      <span>•</span>
                      <span className="capitalize">{item.format.replace('_', ' ')}</span>
                      <span>•</span>
                      <span>{item.stats.userSpeakingPercent}% airtime</span>
                    </div>
                    <h4 className="text-xs font-bold text-slate-200 truncate group-hover:text-indigo-300">
                      {item.topicTitle}
                    </h4>
                    <span className="text-[11px] text-slate-400 line-clamp-1">
                      {item.verdict}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <div className="text-base font-black text-amber-400">{item.overallScore}</div>
                      <div className="text-[9px] text-slate-500">/100 pts</div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-indigo-400 transition-colors" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="px-6 py-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          {history.length > 0 && (
            <button
              onClick={onClearHistory}
              className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1.5 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear History</span>
            </button>
          )}
          <button
            onClick={onClose}
            className="ml-auto px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
