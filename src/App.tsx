import React, { useState, useEffect } from 'react';
import { CURATED_TOPICS } from './data/mockTopics';
import { ALL_AI_PARTICIPANTS, MODERATOR_PARTICIPANT } from './data/defaultParticipants';
import { FeedbackReport, GDFormat, LanguageMode, Participant, TopicInfo, UserGDProfile } from './types/gd';
import { speechSynthesisService } from './services/speechSynthesisService';
import { Navbar } from './components/Navbar';
import { SetupRoomModal } from './components/SetupRoomModal';
import { GDArenaRoom } from './components/GDArenaRoom';
import { FeedbackReportView } from './components/FeedbackReportView';
import { SessionHistoryModal } from './components/SessionHistoryModal';
import { TopicGuidesModal } from './components/TopicGuidesModal';
import {
  Sparkles,
  Users,
  Mic,
  Award,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
  BookOpen,
  Flame,
  Globe2,
  MessageSquare,
  Play,
  Layers,
} from 'lucide-react';

interface ActiveRoomConfig {
  topic: TopicInfo;
  format: GDFormat;
  languageMode: LanguageMode;
  durationSec: number;
  participants: Participant[];
  userProfile: UserGDProfile;
}

const STORAGE_KEY = 'gd_arena_session_history_v1';

export default function App() {
  const [currentView, setCurrentView] = useState<'landing' | 'arena' | 'report'>('landing');
  const [activeConfig, setActiveConfig] = useState<ActiveRoomConfig | null>(null);
  const [currentReport, setCurrentReport] = useState<FeedbackReport | null>(null);

  // Audio mute state
  const [isMuted, setIsMuted] = useState<boolean>(false);

  // Modals
  const [isSetupModalOpen, setIsSetupModalOpen] = useState<boolean>(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState<boolean>(false);
  const [isTopicGuidesModalOpen, setIsTopicGuidesModalOpen] = useState<boolean>(false);

  // Session History in localStorage
  const [sessionHistory, setSessionHistory] = useState<FeedbackReport[]>([]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setSessionHistory(JSON.parse(saved));
      }
    } catch (e) {
      console.warn('Failed to load history from localStorage', e);
    }
  }, []);

  const saveReportToHistory = (report: FeedbackReport) => {
    try {
      const updated = [report, ...sessionHistory].slice(0, 20); // Keep latest 20
      setSessionHistory(updated);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('Failed to save report to localStorage', e);
    }
  };

  const handleToggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    speechSynthesisService.setMuted(next);
  };

  const handleStartGD = (config: ActiveRoomConfig) => {
    setActiveConfig(config);
    setIsSetupModalOpen(false);
    setCurrentView('arena');
  };

  const handleFinishGD = (report: FeedbackReport) => {
    setCurrentReport(report);
    saveReportToHistory(report);
    setCurrentView('report');
  };

  const handleQuickLaunchTopic = (topic: TopicInfo) => {
    handleStartGD({
      topic,
      format: 'standard',
      languageMode: 'english',
      durationSec: 480, // 8 minutes
      participants: ALL_AI_PARTICIPANTS.slice(0, 4),
      userProfile: {
        name: 'Arjun Patel',
        targetRole: 'Software Engineer / Tech Consulting',
        collegeOrYear: 'Final Year Student',
        patienceLevel: 'natural',
      },
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950">
      {/* Top Navbar */}
      <Navbar
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
        onOpenHistory={() => setIsHistoryModalOpen(true)}
        onOpenTopicGuides={() => setIsTopicGuidesModalOpen(true)}
        onNewSession={() => setIsSetupModalOpen(true)}
        historyCount={sessionHistory.length}
        isInSession={currentView === 'arena'}
      />

      {/* Main View Router */}
      <main className="flex-1">
        {/* VIEW 1: LANDING PAGE */}
        {currentView === 'landing' && (
          <div className="space-y-16 py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
            {/* Hero Section */}
            <div className="text-center space-y-6 max-w-3xl mx-auto pt-6">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-500/10 via-rose-500/10 to-indigo-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold shadow-lg shadow-amber-950/20">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Next-Gen Voice AI Campus Placement Simulator</span>
              </div>

              <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white leading-tight">
                Walk into your placement GD <br className="hidden sm:inline" />
                <span className="bg-gradient-to-r from-amber-400 via-rose-400 to-indigo-400 bg-clip-text text-transparent">
                  with genuine room experience.
                </span>
              </h1>

              <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl mx-auto">
                Group Discussion is one of the toughest campus placement elimination rounds. Sit in a live, voice-first room with distinct AI personalities who talk to each other, cut each other off, yield when you interrupt, and give you honest, quote-linked placement feedback.
              </p>

              {/* Primary Call to Actions */}
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => setIsSetupModalOpen(true)}
                  className="px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-500 via-rose-500 to-indigo-600 hover:from-amber-400 hover:to-indigo-500 text-white font-bold text-sm shadow-xl shadow-rose-950/40 transition-all flex items-center gap-2 cursor-pointer scale-100 hover:scale-105 active:scale-95"
                >
                  <Flame className="w-4 h-4" />
                  <span>Configure & Launch GD Room</span>
                </button>

                <button
                  onClick={() => handleQuickLaunchTopic(CURATED_TOPICS[0])}
                  className="px-5 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-200 font-semibold text-sm transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Play className="w-4 h-4 text-emerald-400" />
                  <span>Quick Start (AI in Software Engineering)</span>
                </button>
              </div>

              {/* Transparent AI Persona Notice */}
              <p className="text-[11px] text-slate-500 flex items-center justify-center gap-1.5 pt-1">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                <span>Clearly disclosed: All fellow participants & moderator are AI simulated personas</span>
              </p>
            </div>

            {/* Core Features Pillars */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800/80 space-y-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center">
                  <Mic className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-base text-slate-100">Live Spoken Dialogue & Interruption</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Real speech recognition transcribes your voice live. Speak at any moment — the active AI speaker stops immediately, yielding the floor like a real discussion.
                </p>
              </div>

              <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800/80 space-y-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center">
                  <Users className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-base text-slate-100">Distinct AI Personalities</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Debate Rohan (the Dominator), Priya (the Data Analyst), Vikram (the Synthesizer), Ananya (the Creative), and Kabir (the Silent Sniper). They cross-reference and challenge each other.
                </p>
              </div>

              <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800/80 space-y-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center">
                  <Award className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-base text-slate-100">Quote-Linked Feedback & Missed Openings</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Get a campus placement score out of 100 with every critique tied to exact quotes. See the "What You Could Have Said" replay to learn winning phrases for missed moments.
                </p>
              </div>
            </div>

            {/* Meet The Room Panel Showcase */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-lg text-slate-100">Meet Your Simulated GD Room</h3>
                  <p className="text-xs text-slate-400">Personalities calibrated to real campus placement candidates</p>
                </div>
                <span className="text-xs text-indigo-400 font-semibold hidden sm:inline">
                  Plus Senior Evaluator Mr. S. Rao (Moderator)
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
                {ALL_AI_PARTICIPANTS.map((p) => (
                  <div
                    key={p.id}
                    className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-left space-y-2 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="w-10 h-10 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-lg">
                          {p.avatarEmoji}
                        </div>
                        <span className="text-[10px] text-slate-400 font-semibold">{p.title}</span>
                      </div>
                      <h4 className="font-bold text-xs text-slate-100">{p.name}</h4>
                      <p className="text-[10px] text-amber-400 font-medium">{p.personalityTag}</p>
                      <p className="text-[10px] text-slate-400 mt-1 leading-snug line-clamp-3">
                        {p.personalityDesc}
                      </p>
                    </div>
                    <div className="pt-2 border-t border-slate-800/80 text-[9px] text-slate-500 font-mono">
                      {p.collegeOrCompany}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Curated Topic Vault Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-lg text-slate-100">Popular Placement GD Topics</h3>
                  <p className="text-xs text-slate-400">Click any topic to quick-launch an 8-minute mock round</p>
                </div>
                <button
                  onClick={() => setIsSetupModalOpen(true)}
                  className="text-xs text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <span>View All Topics</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {CURATED_TOPICS.slice(0, 6).map((top) => (
                  <div
                    key={top.id}
                    onClick={() => handleQuickLaunchTopic(top)}
                    className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-amber-500/50 hover:bg-slate-900/90 transition-all cursor-pointer flex flex-col justify-between group space-y-3"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                          {top.category}
                        </span>
                        <span className="text-[10px] text-emerald-400 font-medium">
                          {top.difficulty}
                        </span>
                      </div>
                      <h4 className="font-bold text-xs sm:text-sm text-slate-100 group-hover:text-amber-300 transition-colors leading-snug">
                        {top.title}
                      </h4>
                      <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                        {top.description}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs font-semibold text-amber-400">
                      <span>Start Spoken GD</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Formats & Multi-language Showcase */}
            <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-indigo-950/40 via-slate-900 to-slate-900 border border-slate-800 space-y-4">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs font-bold text-indigo-400 uppercase tracking-wider">
                    <Layers className="w-4 h-4" />
                    <span>Specialized Placement Variations</span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-100">
                    Case Studies, Abstract Rounds, Fishbowl, and Hinglish Mode
                  </h3>
                  <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
                    Practice across different styles: tackle high-heat controversies, structured B2B startup cases, or switch to <strong>Hinglish mode</strong> where personas blend Hindi and English naturally ("Bhai dekho market reality alag hai..."), just like real mock discussions on campus.
                  </p>
                </div>
                <button
                  onClick={() => setIsSetupModalOpen(true)}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs whitespace-nowrap shadow-md cursor-pointer"
                >
                  Configure Custom Room
                </button>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 2: LIVE GD ARENA */}
        {currentView === 'arena' && activeConfig && (
          <GDArenaRoom
            topic={activeConfig.topic}
            format={activeConfig.format}
            languageMode={activeConfig.languageMode}
            durationSec={activeConfig.durationSec}
            participants={activeConfig.participants}
            userProfile={activeConfig.userProfile}
            isMuted={isMuted}
            onFinishGD={handleFinishGD}
            onExit={() => setCurrentView('landing')}
          />
        )}

        {/* VIEW 3: COMPREHENSIVE FEEDBACK REPORT */}
        {currentView === 'report' && currentReport && (
          <FeedbackReportView
            report={currentReport}
            onNewSession={() => {
              setCurrentView('landing');
              setIsSetupModalOpen(true);
            }}
            onReattemptTopic={() => {
              if (activeConfig) {
                setCurrentView('arena');
              } else {
                setCurrentView('landing');
              }
            }}
          />
        )}
      </main>

      {/* MODALS */}
      <SetupRoomModal
        isOpen={isSetupModalOpen}
        onClose={() => setIsSetupModalOpen(false)}
        onStartGD={handleStartGD}
      />

      <SessionHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        history={sessionHistory}
        onSelectReport={(report) => {
          setCurrentReport(report);
          setCurrentView('report');
        }}
        onClearHistory={() => {
          setSessionHistory([]);
          localStorage.removeItem(STORAGE_KEY);
        }}
      />

      <TopicGuidesModal
        isOpen={isTopicGuidesModalOpen}
        onClose={() => setIsTopicGuidesModalOpen(false)}
      />
    </div>
  );
}
