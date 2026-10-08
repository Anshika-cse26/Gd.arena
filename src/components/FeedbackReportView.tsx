import React, { useState, useEffect } from 'react';
import { FeedbackReport, RubricScore } from '../types/gd';
import confetti from 'canvas-confetti';
import {
  Award,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  Quote,
  Share2,
  Download,
  RotateCcw,
  ArrowRight,
  TrendingUp,
  Volume2,
  ChevronDown,
  ChevronUp,
  Search,
  Copy,
  Check,
} from 'lucide-react';

interface FeedbackReportViewProps {
  report: FeedbackReport;
  onNewSession: () => void;
  onReattemptTopic: () => void;
}

export const FeedbackReportView: React.FC<FeedbackReportViewProps> = ({
  report,
  onNewSession,
  onReattemptTopic,
}) => {
  const [activeTab, setActiveTab] = useState<'rubrics' | 'replay' | 'transcript' | 'action_plan'>('rubrics');
  const [copied, setCopied] = useState(false);
  const [transcriptSearch, setTranscriptSearch] = useState('');
  const [expandedRubricId, setExpandedRubricId] = useState<string | null>(report.rubrics[0]?.id || null);

  useEffect(() => {
    // Fire celebratory confetti if high score
    if (report.overallScore >= 75) {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    }
  }, [report.overallScore]);

  const handleCopyReport = () => {
    const text = `GD Arena Performance Report
Topic: ${report.topicTitle}
Verdict: ${report.verdict} (${report.overallScore}/100)
Summary: ${report.verdictSummary}
Speaking Share: ${report.stats.userSpeakingPercent}% (${report.stats.userSpeakingTimeSec}s across ${report.stats.userTurnsCount} turns)

Rubrics Breakdown:
${report.rubrics.map((r) => `- ${r.name}: ${r.score}/20 (${r.status})\n  Feedback: ${r.feedback}`).join('\n')}

Missed Opportunities & Winning Scripts:
${report.missedOpportunities.map((m) => `[At ${m.timestamp} when ${m.speakerWhoSpoke} spoke]:\n  Recommended: "${m.recommendedScript}"`).join('\n\n')}
`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const getVerdictBadge = () => {
    if (report.verdict.toLowerCase().includes('select') || report.overallScore >= 78) {
      return {
        bg: 'bg-emerald-950/80 border-emerald-500 text-emerald-300',
        label: 'Selected for Personal Interview',
        statusColor: 'text-emerald-400',
      };
    }
    if (report.verdict.toLowerCase().includes('border') || report.overallScore >= 60) {
      return {
        bg: 'bg-amber-950/80 border-amber-500 text-amber-300',
        label: 'Borderline (Evaluator Split)',
        statusColor: 'text-amber-400',
      };
    }
    return {
      bg: 'bg-rose-950/80 border-rose-500 text-rose-300',
      label: 'Eliminated at GD Round',
      statusColor: 'text-rose-400',
    };
  };

  const verdictMeta = getVerdictBadge();

  const filteredTranscript = transcriptSearch.trim()
    ? report.transcript.filter(
        (t) =>
          t.text.toLowerCase().includes(transcriptSearch.toLowerCase()) ||
          t.speakerName.toLowerCase().includes(transcriptSearch.toLowerCase())
      )
    : report.transcript;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8 animate-in fade-in duration-300 text-slate-100">
      {/* Hero Placement Verdict Card */}
      <div className={`p-6 sm:p-8 rounded-3xl border shadow-2xl relative overflow-hidden ${verdictMeta.bg}`}>
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-black/40 border border-white/10">
                <Award className="w-5 h-5 text-amber-400" />
              </span>
              <span className="text-xs uppercase tracking-widest font-bold opacity-90">
                Campus Placement Committee Evaluation
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              {report.verdict}
            </h2>
            <p className="text-sm opacity-90 leading-relaxed font-medium">
              {report.verdictSummary}
            </p>
            <div className="pt-1 flex flex-wrap items-center gap-3 text-xs opacity-80">
              <span>Topic: <strong>{report.topicTitle}</strong></span>
              <span>•</span>
              <span>Evaluated on: {report.date}</span>
            </div>
          </div>

          {/* Score Ring */}
          <div className="flex flex-col items-center justify-center p-5 rounded-2xl bg-black/40 border border-white/10 min-w-[140px] text-center shadow-lg">
            <span className="text-4xl sm:text-5xl font-black tracking-tighter text-white">
              {report.overallScore}
            </span>
            <span className="text-[11px] uppercase tracking-wider font-semibold opacity-75 mt-0.5">
              out of 100 points
            </span>
          </div>
        </div>
      </div>

      {/* Speaking Share & Airtime Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
          <div className="text-xs text-slate-400 flex items-center justify-between">
            <span>Airtime Dominance</span>
            <Clock className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold text-slate-100">
            {report.stats.userSpeakingPercent}%
          </div>
          <p className="text-[11px] text-slate-500">
            {report.stats.userSpeakingPercent >= 18 && report.stats.userSpeakingPercent <= 28
              ? 'Ideal placement sweet spot (18-28%)'
              : report.stats.userSpeakingPercent < 18
              ? 'Too passive (<18%). Needs more assertive entries.'
              : 'Dominating (>28%). Watch out for monopolizing airtime.'}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
          <div className="text-xs text-slate-400 flex items-center justify-between">
            <span>Floor Entries / Turns</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-slate-100">
            {report.stats.userTurnsCount} turns
          </div>
          <p className="text-[11px] text-slate-500">
            Avg {report.stats.avgTurnDurationSec}s per contribution
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
          <div className="text-xs text-slate-400 flex items-center justify-between">
            <span>Total Discussion Time</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-slate-100">
            {Math.round(report.stats.totalGdTimeSec / 60)} mins
          </div>
          <p className="text-[11px] text-slate-500">
            You spoke for {report.stats.userSpeakingTimeSec}s total
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
          <div className="text-xs text-slate-400 flex items-center justify-between">
            <span>Red Flags Detected</span>
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-bold text-slate-100">
            {report.redFlags.length}
          </div>
          <p className="text-[11px] text-slate-500">
            {report.redFlags.length === 0 ? 'Clean round. No fatal placement errors.' : 'Critical areas to eliminate next round.'}
          </p>
        </div>
      </div>

      {/* Speaker Airtime Distribution Bar */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
        <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
          Room Airtime Distribution (Candidate vs AI Participants)
        </h4>
        <div className="space-y-2">
          {report.stats.speakerBreakdown.map((s) => (
            <div key={s.speakerId} className="space-y-1">
              <div className="flex justify-between text-xs text-slate-300">
                <span className={s.role === 'user' ? 'font-bold text-amber-400' : ''}>
                  {s.name} {s.role === 'user' && '(You)'}
                </span>
                <span className="font-mono text-slate-400">
                  {s.speakingTimeSec}s ({s.percent}%) • {s.turns} turns
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-950 overflow-hidden">
                <div
                  className={`h-full ${
                    s.role === 'user'
                      ? 'bg-gradient-to-r from-amber-500 to-rose-500'
                      : 'bg-indigo-600/70'
                  }`}
                  style={{ width: `${Math.max(4, s.percent)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Tabs for Deep-Dive Sections */}
      <div className="border-b border-slate-800 flex gap-2 overflow-x-auto pb-1 text-sm font-semibold">
        <button
          onClick={() => setActiveTab('rubrics')}
          className={`px-4 py-2 rounded-t-xl transition-all border-b-2 flex items-center gap-2 ${
            activeTab === 'rubrics'
              ? 'border-amber-500 text-amber-400 bg-slate-900/60'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>Placement Rubrics & Quotes ({report.rubrics.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('replay')}
          className={`px-4 py-2 rounded-t-xl transition-all border-b-2 flex items-center gap-2 ${
            activeTab === 'replay'
              ? 'border-indigo-500 text-indigo-400 bg-slate-900/60'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>"What You Could Have Said" Replay ({report.missedOpportunities.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('action_plan')}
          className={`px-4 py-2 rounded-t-xl transition-all border-b-2 flex items-center gap-2 ${
            activeTab === 'action_plan'
              ? 'border-emerald-500 text-emerald-400 bg-slate-900/60'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>Action Plan & Drills</span>
        </button>

        <button
          onClick={() => setActiveTab('transcript')}
          className={`px-4 py-2 rounded-t-xl transition-all border-b-2 flex items-center gap-2 ${
            activeTab === 'transcript'
              ? 'border-rose-500 text-rose-400 bg-slate-900/60'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Quote className="w-4 h-4" />
          <span>Full Transcript ({report.transcript.length} turns)</span>
        </button>
      </div>

      {/* Tab 1: Rubrics with Exact Quoted Evidence */}
      {activeTab === 'rubrics' && (
        <div className="space-y-4">
          <p className="text-xs text-slate-400">
            Every feedback point below is directly grounded in an exact quoted moment from the discussion:
          </p>

          <div className="space-y-3">
            {report.rubrics.map((rubric) => {
              const isExpanded = expandedRubricId === rubric.id;
              return (
                <div
                  key={rubric.id}
                  className="rounded-2xl border border-slate-800 bg-slate-900/80 overflow-hidden transition-all"
                >
                  <div
                    onClick={() => setExpandedRubricId(isExpanded ? null : rubric.id)}
                    className="p-5 flex items-center justify-between cursor-pointer hover:bg-slate-800/40"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-sm text-slate-100">{rubric.name}</h4>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                            rubric.status === 'strength'
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                              : rubric.status === 'weakness'
                              ? 'bg-rose-950 text-rose-400 border border-rose-800'
                              : 'bg-amber-950 text-amber-400 border border-amber-800'
                          }`}
                        >
                          {rubric.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 line-clamp-1">{rubric.feedback}</p>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <span className="text-base font-black text-slate-100 font-mono">
                          {rubric.score}
                        </span>
                        <span className="text-xs text-slate-500">/{rubric.maxScore}</span>
                      </div>
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="px-5 pb-5 pt-2 border-t border-slate-800/80 space-y-4 bg-slate-950/40">
                      <div>
                        <h5 className="text-xs font-semibold text-slate-300 mb-1">Evaluator Critique:</h5>
                        <p className="text-xs text-slate-300 leading-relaxed">{rubric.feedback}</p>
                      </div>

                      {/* Quoted Moments in this Rubric */}
                      <div className="space-y-2">
                        <h5 className="text-xs font-semibold text-amber-400 flex items-center gap-1.5">
                          <Quote className="w-3.5 h-3.5" />
                          <span>Linked Quoted Evidence from Room:</span>
                        </h5>
                        <div className="grid grid-cols-1 gap-2">
                          {rubric.quotedEvidence.map((ev, idx) => (
                            <div
                              key={idx}
                              className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-xs space-y-1.5"
                            >
                              <div className="flex items-center justify-between text-[11px] text-slate-400">
                                <span className="font-semibold text-slate-200">Speaker: {ev.speaker}</span>
                                <span className="font-mono">{ev.timestamp}</span>
                              </div>
                              <div className="p-2.5 rounded-lg bg-slate-950/80 border-l-2 border-amber-500 text-amber-100/90 italic font-serif text-xs">
                                "{ev.quote}"
                              </div>
                              <p className="text-[11px] text-slate-400 pt-1">
                                <strong className="text-slate-300">Analysis:</strong> {ev.analysis}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 2: "What You Could Have Said" Interactive Replay */}
      {activeTab === 'replay' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-indigo-950/30 border border-indigo-500/30 text-xs text-indigo-200">
            <strong>Missed Openings Analysis:</strong> In competitive GDs, top candidates capitalize on moments where an opponent makes an extreme claim or when the room falls into a 2-second pause. Here is how you could have seized those turns:
          </div>

          <div className="space-y-4">
            {report.missedOpportunities.map((opp, idx) => (
              <div
                key={idx}
                className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 relative overflow-hidden"
              >
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-[11px]">
                      {idx + 1}
                    </span>
                    <span className="font-bold text-slate-200">Opening at {opp.timestamp}</span>
                    <span className="text-slate-500">•</span>
                    <span className="text-slate-400">When {opp.speakerWhoSpoke} spoke</span>
                  </div>
                </div>

                {/* What happened in the room */}
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                    What was said in the room:
                  </span>
                  <p className="italic text-slate-300">"{opp.contextQuote}"</p>
                </div>

                {/* The Missed Angle */}
                <div className="text-xs text-rose-300/90 font-medium">
                  <strong>The Golden Opening:</strong> {opp.missedAngle}
                </div>

                {/* Recommended Winning Script */}
                <div className="p-3.5 rounded-xl bg-gradient-to-r from-emerald-950/60 to-slate-950 border border-emerald-500/40 text-xs space-y-1.5">
                  <div className="flex items-center justify-between text-emerald-400 font-bold text-[11px] uppercase tracking-wider">
                    <span>What You Could Have Said (High-Scoring Response):</span>
                  </div>
                  <p className="text-emerald-100 font-medium text-sm leading-relaxed">
                    "{opp.recommendedScript}"
                  </p>
                  <p className="text-[11px] text-emerald-400/80 pt-1">
                    <strong>Why Recruiters Award Top Marks:</strong> {opp.whyItScoresHigh}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Action Plan & Red Flags */}
      {activeTab === 'action_plan' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Red Flags & Strengths */}
          <div className="space-y-4">
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
              <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>Standout Strengths Noticed by Panel</span>
              </h4>
              <ul className="space-y-2 text-xs text-slate-300">
                {report.standoutStrengths.map((str, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold mt-0.5">•</span>
                    <span>{str}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
              <h4 className="text-xs font-bold text-rose-400 uppercase tracking-wider flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                <span>Elimination Red Flags</span>
              </h4>
              {report.redFlags.length === 0 ? (
                <p className="text-xs text-slate-400">No major disqualifying flags observed!</p>
              ) : (
                <ul className="space-y-2 text-xs text-slate-300">
                  {report.redFlags.map((flag, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-rose-400 font-bold mt-0.5">•</span>
                      <span>{flag}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Concrete Drills for Next GD */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              <span>3 Concrete Drills for Your Next Round</span>
            </h4>
            <div className="space-y-3">
              {report.actionableNextSteps.map((step, idx) => (
                <div key={idx} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1">
                  <div className="font-bold text-slate-200 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-[10px]">
                      {idx + 1}
                    </span>
                    <span>Action Drill #{idx + 1}</span>
                  </div>
                  <p className="text-slate-300 pl-7 leading-relaxed">{step}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Full Searchable Transcript */}
      {activeTab === 'transcript' && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs">
            <Search className="w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={transcriptSearch}
              onChange={(e) => setTranscriptSearch(e.target.value)}
              placeholder="Search statements or speakers..."
              className="bg-transparent border-none text-slate-100 placeholder:text-slate-500 focus:outline-none w-full"
            />
          </div>

          <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
            {filteredTranscript.map((turn, i) => (
              <div
                key={turn.id || i}
                className={`p-3.5 rounded-xl border text-xs space-y-1 ${
                  turn.role === 'user'
                    ? 'bg-rose-950/30 border-rose-500/40 text-rose-100'
                    : turn.role === 'moderator'
                    ? 'bg-amber-950/20 border-amber-500/30 text-amber-100'
                    : 'bg-slate-900 border-slate-800 text-slate-200'
                }`}
              >
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold">
                    {turn.speakerName} {turn.role === 'user' && '(You)'}
                  </span>
                  <span className="font-mono text-slate-500">{turn.timestamp}</span>
                </div>
                <p className="leading-relaxed">{turn.text}</p>
                {turn.wasInterrupted && (
                  <span className="text-[9px] text-rose-400 block pt-0.5">
                    ⚡ Yielded floor to {turn.interruptedBy || 'next speaker'}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bottom Sticky Action Bar */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <button
          onClick={handleCopyReport}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer"
        >
          {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          <span>{copied ? 'Copied Full Report!' : 'Copy Report Summary'}</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={onReattemptTopic}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Re-attempt Same Topic</span>
          </button>

          <button
            onClick={onNewSession}
            className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 text-white shadow-lg shadow-rose-950/40 transition-all cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>Configure New GD</span>
          </button>
        </div>
      </div>
    </div>
  );
};
