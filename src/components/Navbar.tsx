import React from 'react';
import { Volume2, VolumeX, History, Sparkles, BookOpen, ShieldAlert } from 'lucide-react';

interface NavbarProps {
  isMuted: boolean;
  onToggleMute: () => void;
  onOpenHistory: () => void;
  onOpenTopicGuides: () => void;
  onNewSession: () => void;
  historyCount: number;
  isInSession: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  isMuted,
  onToggleMute,
  onOpenHistory,
  onOpenTopicGuides,
  onNewSession,
  historyCount,
  isInSession,
}) => {
  return (
    <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40 px-4 lg:px-8 py-3 transition-colors">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        {/* Brand / Title */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 via-rose-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-rose-950/30">
            <span className="text-white font-black text-lg tracking-tighter">GD</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-slate-100 text-base md:text-lg tracking-tight">
                GD Arena
              </h1>
              <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">
                Voice AI Simulator
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Realistic Campus Placement & MBA Group Discussion Practice
            </p>
          </div>
        </div>

        {/* Clear AI Persona Disclosure Banner */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-950/40 border border-indigo-500/20 text-indigo-300 text-xs">
          <ShieldAlert className="w-3.5 h-3.5 text-indigo-400" />
          <span>All participants & moderator are AI simulated personas</span>
        </div>

        {/* Navigation & Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenTopicGuides}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 transition-colors"
            title="Browse GD topics and frameworks"
          >
            <BookOpen className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden md:inline">Topics & Frameworks</span>
          </button>

          <button
            onClick={onOpenHistory}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 transition-colors relative"
            title="View past sessions & progress"
          >
            <History className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden md:inline">Progress</span>
            {historyCount > 0 && (
              <span className="bg-indigo-600 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                {historyCount}
              </span>
            )}
          </button>

          <button
            onClick={onToggleMute}
            className={`p-2 rounded-lg border text-xs font-medium transition-colors ${
              isMuted
                ? 'bg-rose-950/40 border-rose-800/50 text-rose-400 hover:bg-rose-900/40'
                : 'bg-slate-900 border-slate-800 text-emerald-400 hover:bg-slate-800'
            }`}
            title={isMuted ? 'Voice audio muted. Click to enable sound' : 'Voice audio active'}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          {!isInSession && (
            <button
              onClick={onNewSession}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 text-white shadow-md shadow-rose-950/40 transition-all cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Start GD Room</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
