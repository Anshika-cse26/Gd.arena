import React from 'react';
import { BookOpen, Sparkles, CheckCircle2, Shield, Target, MessageSquare } from 'lucide-react';

interface TopicGuidesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TopicGuidesModal: React.FC<TopicGuidesModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <BookOpen className="w-4 h-4" />
            </span>
            <h3 className="font-bold text-slate-100 text-lg">
              Campus Placement GD Playbook & Winning Formulas
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 text-sm"
          >
            ✕
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto text-xs text-slate-300">
          {/* Framework 1: Initiation */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
              <Target className="w-4 h-4" />
              <span>1. How to Initiate (Without Sounding Shallow)</span>
            </div>
            <p className="leading-relaxed">
              Never initiate by simply reciting a generic dictionary definition. Placement evaluators look for candidates who provide a <strong>structured scope</strong> for the entire room:
            </p>
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 font-serif italic text-amber-200">
              "Good morning everyone. The topic before us has multiple dimensions. To ensure we have a comprehensive and balanced discussion, I propose we look at this across three pillars: technical feasibility, economic viability, and social/ethical impact. Let us begin with the first pillar..."
            </div>
          </div>

          {/* Framework 2: Handling Dominators */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
              <Shield className="w-4 h-4" />
              <span>2. Handling the Dominator / Interrupter (The "Diplomatic Shield")</span>
            </div>
            <p className="leading-relaxed">
              If an aggressive debater (like our simulated Rohan Malhotra) cuts you off, do not shout over them or go silent. Deploy the 5-second diplomatic shield:
            </p>
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 font-serif italic text-rose-200">
              "Rohan, I appreciate your enthusiasm on that point. Allow me 15 seconds to wrap up this thought, and then I would love to hear your counter-argument."
            </div>
          </div>

          {/* Framework 3: Synthesis */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm">
              <MessageSquare className="w-4 h-4" />
              <span>3. The Power of "Building On Others" (Cross-Referencing)</span>
            </div>
            <p className="leading-relaxed">
              Evaluators love team players who listen actively. Always mention another participant by name before presenting your insight:
            </p>
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 font-serif italic text-indigo-200">
              "To build directly on the cost statistics that Priya highlighted earlier, if we combine that with Vikram's point on implementation, the logical conclusion is a phased rollout..."
            </div>
          </div>

          {/* Framework 4: Summary */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
              <CheckCircle2 className="w-4 h-4" />
              <span>4. Summarizing at the End (The Consensus Winner)</span>
            </div>
            <p className="leading-relaxed">
              When the moderator asks for closing statements or the 1-minute warning sounds, summarize the whole group's points rather than preaching your own individual opinion:
            </p>
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 font-serif italic text-emerald-200">
              "To conclude, our group explored both sides. While on one hand we agreed with the risks raised regarding X, the overall consensus is that with proper regulatory guardrails, Y provides long-term value."
            </div>
          </div>
        </div>

        <div className="px-6 py-4 bg-slate-950 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
};
