import React, { useState, useEffect, useRef } from 'react';
import {
  DiscussionPhase,
  FeedbackReport,
  GDFormat,
  LanguageMode,
  Participant,
  RealtimeNudge,
  TopicInfo,
  UserGDProfile,
  Utterance,
} from '../types/gd';
import { MODERATOR_PARTICIPANT } from '../data/defaultParticipants';
import { speechSynthesisService } from '../services/speechSynthesisService';
import { speechRecognitionService } from '../services/speechRecognitionService';
import {
  fetchModeratorAction,
  fetchNextAITurn,
  fetchSilentNudge,
  generatePlacementReport,
} from '../services/gdService';
import {
  Mic,
  MicOff,
  Hand,
  Send,
  Clock,
  Sparkles,
  AlertCircle,
  Volume2,
  ChevronRight,
  Maximize2,
  MessageSquare,
  ShieldAlert,
  ArrowRight,
  UserCheck,
  Eye,
  LogIn,
} from 'lucide-react';

interface GDArenaRoomProps {
  topic: TopicInfo;
  format: GDFormat;
  languageMode: LanguageMode;
  durationSec: number;
  participants: Participant[];
  userProfile: UserGDProfile;
  isMuted: boolean;
  onFinishGD: (report: FeedbackReport) => void;
  onExit: () => void;
}

export const GDArenaRoom: React.FC<GDArenaRoomProps> = ({
  topic,
  format,
  languageMode,
  durationSec,
  participants: initialAiParticipants,
  userProfile,
  isMuted,
  onFinishGD,
  onExit,
}) => {
  // Session Timers & Phases
  const [phase, setPhase] = useState<DiscussionPhase>('briefing');
  const [secondsRemaining, setSecondsRemaining] = useState<number>(durationSec);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [isPaused, setIsPaused] = useState<boolean>(false);

  // Participants & State
  const [moderator, setModerator] = useState<Participant>(MODERATOR_PARTICIPANT);
  const [aiParticipants, setAiParticipants] = useState<Participant[]>(initialAiParticipants);
  const [activeSpeakerId, setActiveSpeakerId] = useState<string | null>(MODERATOR_PARTICIPANT.id);
  const [lastSpeakerId, setLastSpeakerId] = useState<string | null>(null);

  // User live state
  const [isUserSpeaking, setIsUserSpeaking] = useState<boolean>(false);
  const [isUserHandRaised, setIsUserHandRaised] = useState<boolean>(false);
  const [userInterimText, setUserInterimText] = useState<string>('');
  const [userTypedInput, setUserTypedInput] = useState<string>('');
  const [userSpeakingTimeSec, setUserSpeakingTimeSec] = useState<number>(0);
  const [userTurnsCount, setUserTurnsCount] = useState<number>(0);
  const [userSilenceDurationSec, setUserSilenceDurationSec] = useState<number>(0);

  // Fishbowl observer state
  const [isFishbowlObserving, setIsFishbowlObserving] = useState<boolean>(format === 'fishbowl');

  // Mic availability
  const [isMicActive, setIsMicActive] = useState<boolean>(false);
  const [micErrorNote, setMicErrorNote] = useState<string | null>(null);

  // Transcript & Nudges
  const [transcript, setTranscript] = useState<Utterance[]>([]);
  const [currentNudge, setCurrentNudge] = useState<RealtimeNudge | null>(null);
  const [showCaptions, setShowCaptions] = useState<boolean>(true);
  const [isGeneratingReport, setIsGeneratingReport] = useState<boolean>(false);

  // Refs for tracking mutable timing in intervals
  const isUserSpeakingRef = useRef(isUserSpeaking);
  isUserSpeakingRef.current = isUserSpeaking;

  const activeSpeakerIdRef = useRef(activeSpeakerId);
  activeSpeakerIdRef.current = activeSpeakerId;

  const transcriptRef = useRef(transcript);
  transcriptRef.current = transcript;

  const phaseRef = useRef(phase);
  phaseRef.current = phase;

  const secondsRemainingRef = useRef(secondsRemaining);
  secondsRemainingRef.current = secondsRemaining;

  const transcriptEndRef = useRef<HTMLDivElement | null>(null);
  const turnTimeoutRef = useRef<any>(null);
  const speakingStartTimestampRef = useRef<number>(0);

  // Auto scroll transcript
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcript, userInterimText]);

  // Master Clock Interval
  useEffect(() => {
    const clockInterval = setInterval(() => {
      if (isPaused || phase === 'concluded' || isGeneratingReport) return;

      setElapsedSeconds((prev) => prev + 1);
      setSecondsRemaining((prev) => {
        const next = Math.max(0, prev - 1);

        // Check phase transitions
        if (next === 60 && phaseRef.current === 'open_floor') {
          triggerOneMinuteWarning();
        } else if (next === 0 && phaseRef.current !== 'concluded') {
          triggerConclusionRound();
        }

        return next;
      });

      // Track silence & speaking metrics
      if (isUserSpeakingRef.current) {
        setUserSpeakingTimeSec((t) => t + 1);
        setUserSilenceDurationSec(0);
      } else {
        setUserSilenceDurationSec((s) => s + 1);
      }
    }, 1000);

    return () => clearInterval(clockInterval);
  }, [isPaused, phase, isGeneratingReport]);

  // Kickoff Group Discussion on Mount with Moderator Opening
  useEffect(() => {
    startModeratorOpening();
    initSpeechRecognition();

    return () => {
      speechSynthesisService.stop();
      speechRecognitionService.stopListening();
      if (turnTimeoutRef.current) clearTimeout(turnTimeoutRef.current);
    };
  }, []);

  // Periodic Silent Coach Nudge Trigger
  useEffect(() => {
    if (phase !== 'open_floor' || isFishbowlObserving) return;

    // Trigger nudge if student hasn't spoken for 60s or every 90s
    if (userSilenceDurationSec >= 60 && userSilenceDurationSec % 40 === 0) {
      fetchSilentNudge({
        topic: topic.title,
        recentTranscript: transcriptRef.current,
        studentSilenceDurationSec: userSilenceDurationSec,
        studentHasSpoken: userTurnsCount > 0,
        userTotalTurns: userTurnsCount,
      }).then((nudge) => {
        if (nudge) {
          setCurrentNudge(nudge);
          // Auto-hide after 18s
          setTimeout(() => setCurrentNudge(null), 18000);
        }
      });
    }
  }, [userSilenceDurationSec, phase, isFishbowlObserving]);

  // Initialize Speech Recognition
  const initSpeechRecognition = () => {
    if (!speechRecognitionService.isSupported()) {
      setMicErrorNote('Speech recognition not supported in this browser. You can type in the speech box.');
      return;
    }

    try {
      speechRecognitionService.startListening({
        onInterim: (interim) => {
          handleStudentInterruption();
          setUserInterimText(interim);
        },
        onFinal: (final) => {
          if (final.trim()) {
            commitStudentUtterance(final.trim());
            setUserInterimText('');
          }
        },
        onSpeechStart: () => {
          handleStudentInterruption();
        },
        onSpeechEnd: () => {
          setIsUserSpeaking(false);
          // Wait a natural pause before AI attempts to take floor
          scheduleNextAITurn(getPatienceDelayMs());
        },
        onError: (err) => {
          setMicErrorNote(err);
        },
      });
      setIsMicActive(true);
    } catch (e: any) {
      setMicErrorNote(e?.message || 'Could not access microphone');
    }
  };

  // Immediate Interruption Handler: STUDENT INTERRUPTS AI
  const handleStudentInterruption = () => {
    // If an AI participant or moderator is currently speaking, HALT IMMEDIATELY!
    if (activeSpeakerIdRef.current && activeSpeakerIdRef.current !== 'user') {
      speechSynthesisService.stop();

      // Mark the active turn as interrupted in transcript
      setTranscript((prev) => {
        if (prev.length === 0) return prev;
        const last = { ...prev[prev.length - 1] };
        if (last.speakerId === activeSpeakerIdRef.current && !last.wasInterrupted) {
          last.wasInterrupted = true;
          last.interruptedBy = userProfile.name;
          return [...prev.slice(0, -1), last];
        }
        return prev;
      });
    }

    if (turnTimeoutRef.current) {
      clearTimeout(turnTimeoutRef.current);
    }

    setActiveSpeakerId('user');
    setIsUserSpeaking(true);
    setIsUserHandRaised(false);
    setUserSilenceDurationSec(0);
  };

  const getPatienceDelayMs = () => {
    switch (userProfile.patienceLevel) {
      case 'fast':
        return 1600;
      case 'patient':
        return 3800;
      default:
        return 2400;
    }
  };

  // Moderator Opening Round
  const startModeratorOpening = async () => {
    setActiveSpeakerId(MODERATOR_PARTICIPANT.id);
    const modAction = await fetchModeratorAction({
      actionType: 'opening',
      topic: topic.title,
      topicDescription: topic.description,
      format,
      languageMode,
      studentName: userProfile.name,
    });

    const utterance: Utterance = {
      id: `mod-${Date.now()}`,
      timestamp: formatTime(durationSec - secondsRemainingRef.current),
      timestampSec: elapsedSeconds,
      speakerId: MODERATOR_PARTICIPANT.id,
      speakerName: MODERATOR_PARTICIPANT.name,
      role: 'moderator',
      text: modAction.text,
      durationSec: 8,
      emotion: 'authoritative',
    };

    setTranscript((prev) => [...prev, utterance]);

    await speechSynthesisService.speak(MODERATOR_PARTICIPANT, modAction.text);

    // Floor is now open to participants!
    setActiveSpeakerId(null);
    setLastSpeakerId(MODERATOR_PARTICIPANT.id);
    setPhase('open_floor');

    // Give student 3 seconds to take initiative; if silent, an aggressive AI (e.g. Rohan) initiates!
    scheduleNextAITurn(3200);
  };

  // Moderator 1-Minute Warning
  const triggerOneMinuteWarning = async () => {
    setPhase('one_min_warning');
    if (activeSpeakerIdRef.current && activeSpeakerIdRef.current !== 'user') {
      speechSynthesisService.stop();
    }

    setActiveSpeakerId(MODERATOR_PARTICIPANT.id);
    const modAction = await fetchModeratorAction({
      actionType: 'warning_1min',
      topic: topic.title,
      format,
      languageMode,
      studentName: userProfile.name,
    });

    const utterance: Utterance = {
      id: `mod-warn-${Date.now()}`,
      timestamp: formatTime(durationSec - secondsRemainingRef.current),
      timestampSec: elapsedSeconds,
      speakerId: MODERATOR_PARTICIPANT.id,
      speakerName: MODERATOR_PARTICIPANT.name,
      role: 'moderator',
      text: modAction.text,
      durationSec: 5,
      emotion: 'caution',
    };

    setTranscript((prev) => [...prev, utterance]);
    await speechSynthesisService.speak(MODERATOR_PARTICIPANT, modAction.text);

    setActiveSpeakerId(null);
    scheduleNextAITurn(2000);
  };

  // Moderator Conclusion Request
  const triggerConclusionRound = async () => {
    setPhase('concluding_round');
    if (activeSpeakerIdRef.current && activeSpeakerIdRef.current !== 'user') {
      speechSynthesisService.stop();
    }

    setActiveSpeakerId(MODERATOR_PARTICIPANT.id);
    const modAction = await fetchModeratorAction({
      actionType: 'request_summary',
      topic: topic.title,
      format,
      languageMode,
      studentName: userProfile.name,
    });

    const utterance: Utterance = {
      id: `mod-concl-${Date.now()}`,
      timestamp: formatTime(durationSec - secondsRemainingRef.current),
      timestampSec: elapsedSeconds,
      speakerId: MODERATOR_PARTICIPANT.id,
      speakerName: MODERATOR_PARTICIPANT.name,
      role: 'moderator',
      text: modAction.text,
      durationSec: 6,
      emotion: 'summary',
    };

    setTranscript((prev) => [...prev, utterance]);
    await speechSynthesisService.speak(MODERATOR_PARTICIPANT, modAction.text);

    // Floor remains open for 45s for candidate to deliver the closing summary!
    setActiveSpeakerId(null);
  };

  // Schedule Next AI Speaker Turn
  const scheduleNextAITurn = (delayMs: number = 2400) => {
    if (turnTimeoutRef.current) clearTimeout(turnTimeoutRef.current);

    turnTimeoutRef.current = setTimeout(async () => {
      // Check if user has taken floor in the meantime or if paused/finished
      if (isUserSpeakingRef.current || phaseRef.current === 'concluded' || isGeneratingReport) {
        return;
      }

      // If user has hand raised, give user first priority
      if (isUserHandRaised) {
        return;
      }

      try {
        const aiTurn = await fetchNextAITurn({
          topic: topic.title,
          topicDescription: topic.description,
          format,
          languageMode,
          activeParticipants: aiParticipants,
          recentTranscript: transcriptRef.current,
          lastSpeakerId: lastSpeakerId || undefined,
          timeRemainingSec: secondsRemainingRef.current,
          totalDurationSec: durationSec,
        });

        // Double check user didn't start speaking during network fetch
        if (isUserSpeakingRef.current) return;

        const speaker = aiParticipants.find((p) => p.id === aiTurn.speakerId) || aiParticipants[0];

        setActiveSpeakerId(speaker.id);
        setLastSpeakerId(speaker.id);

        const newUtterance: Utterance = {
          id: `ai-${Date.now()}`,
          timestamp: formatTime(durationSec - secondsRemainingRef.current),
          timestampSec: elapsedSeconds,
          speakerId: speaker.id,
          speakerName: speaker.name,
          role: 'ai_participant',
          text: aiTurn.text,
          durationSec: Math.max(3, Math.round(aiTurn.text.split(' ').length / 2.5)),
          emotion: aiTurn.emotion,
          referencedSpeakerName: aiTurn.referencedSpeaker,
          gesture: aiTurn.gesture,
        };

        setTranscript((prev) => [...prev, newUtterance]);

        // Speak utterance out loud
        await speechSynthesisService.speak(speaker, aiTurn.text, {
          onEnd: () => {
            // Check if user is speaking
            if (!isUserSpeakingRef.current) {
              setActiveSpeakerId(null);
              // AI took turn; next turn follows after natural pause
              scheduleNextAITurn(getPatienceDelayMs());
            }
          },
        });
      } catch (err) {
        console.warn('Next AI turn execution error:', err);
        setActiveSpeakerId(null);
        scheduleNextAITurn(3000);
      }
    }, delayMs);
  };

  // Student Utterance Commit
  const commitStudentUtterance = (text: string) => {
    if (!text.trim()) return;

    const utterance: Utterance = {
      id: `user-${Date.now()}`,
      timestamp: formatTime(durationSec - secondsRemainingRef.current),
      timestampSec: elapsedSeconds,
      speakerId: 'user',
      speakerName: userProfile.name,
      role: 'user',
      text: text.trim(),
      durationSec: Math.max(2, Math.round(text.split(' ').length / 2.4)),
    };

    setTranscript((prev) => [...prev, utterance]);
    setUserTurnsCount((c) => c + 1);
    setLastSpeakerId('user');
    setIsUserSpeaking(false);
    setActiveSpeakerId(null);
    setIsUserHandRaised(false);
    setUserSilenceDurationSec(0);

    // Schedule next AI response reacting to student's point
    scheduleNextAITurn(getPatienceDelayMs());
  };

  const handleManualSpeechSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!userTypedInput.trim()) return;

    handleStudentInterruption();
    commitStudentUtterance(userTypedInput.trim());
    setUserTypedInput('');
  };

  // Hand Raise Toggle
  const toggleUserHandRaise = () => {
    setIsUserHandRaised((prev) => !prev);
  };

  // Conclude GD & Generate Placement Report
  const handleWrapUpAndEvaluate = async () => {
    setIsGeneratingReport(true);
    speechSynthesisService.stop();
    speechRecognitionService.stopListening();
    if (turnTimeoutRef.current) clearTimeout(turnTimeoutRef.current);
    setPhase('concluded');

    const totalTime = Math.max(1, elapsedSeconds);
    const userPercent = Math.round((userSpeakingTimeSec / totalTime) * 100);

    // Calculate speaker breakdowns
    const speakerBreakdown = [
      {
        speakerId: 'user',
        name: userProfile.name,
        role: 'user' as const,
        speakingTimeSec: userSpeakingTimeSec,
        percent: userPercent,
        turns: userTurnsCount,
      },
      ...aiParticipants.map((ai) => {
        const aiUtterances = transcript.filter((t) => t.speakerId === ai.id);
        const sec = aiUtterances.reduce((acc, curr) => acc + (curr.durationSec || 4), 0);
        return {
          speakerId: ai.id,
          name: ai.name,
          role: 'ai_participant' as const,
          speakingTimeSec: sec,
          percent: Math.round((sec / totalTime) * 100),
          turns: aiUtterances.length,
        };
      }),
    ];

    try {
      const report = await generatePlacementReport({
        topic: topic.title,
        topicDescription: topic.description,
        format,
        studentName: userProfile.name,
        studentTargetRole: userProfile.targetRole,
        transcript,
        totalDurationSec: totalTime,
        userSpeakingTimeSec,
        userTurnsCount,
        speakerBreakdown,
        languageMode,
      });

      setIsGeneratingReport(false);
      onFinishGD(report);
    } catch (err) {
      console.error('Failed to generate report:', err);
      setIsGeneratingReport(false);
      alert('There was a temporary error compiling the report. Please try again.');
    }
  };

  // Helper time formatter
  function formatTime(sec: number) {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  }

  const activeSpeakerObj = activeSpeakerId === 'user'
    ? { name: userProfile.name, role: 'user', title: userProfile.targetRole }
    : activeSpeakerId === MODERATOR_PARTICIPANT.id
    ? moderator
    : aiParticipants.find((p) => p.id === activeSpeakerId);

  return (
    <div className="min-h-[calc(100vh-65px)] bg-slate-950 flex flex-col justify-between text-slate-100 relative overflow-hidden">
      {/* Top Status & Timer Bar */}
      <div className="bg-slate-900/90 border-b border-slate-800 px-4 py-2.5 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          {/* Topic & Format Info */}
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="text-xs font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 whitespace-nowrap">
              {topic.category}
            </span>
            <div className="truncate">
              <h3 className="text-xs sm:text-sm font-bold text-slate-100 truncate">
                {topic.title}
              </h3>
              <div className="flex items-center gap-2 text-[10px] text-slate-400">
                <span>Format: {format.replace('_', ' ').toUpperCase()}</span>
                <span>•</span>
                <span className="capitalize">Language: {languageMode}</span>
              </div>
            </div>
          </div>

          {/* Center Timer & Phase Pill */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-950 border border-slate-800">
              <Clock className={`w-3.5 h-3.5 ${secondsRemaining < 60 ? 'text-rose-400 animate-pulse' : 'text-amber-400'}`} />
              <span className={`text-xs font-mono font-bold ${secondsRemaining < 60 ? 'text-rose-400' : 'text-slate-100'}`}>
                {formatTime(secondsRemaining)}
              </span>
            </div>

            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
              phase === 'briefing'
                ? 'bg-blue-950/60 text-blue-300 border border-blue-800'
                : phase === 'one_min_warning'
                ? 'bg-rose-950 text-rose-300 border border-rose-800 animate-pulse'
                : phase === 'concluding_round'
                ? 'bg-amber-950 text-amber-300 border border-amber-800'
                : 'bg-emerald-950/60 text-emerald-300 border border-emerald-800'
            }`}>
              {phase === 'briefing' && 'Phase 1: Briefing'}
              {phase === 'open_floor' && 'Phase 2: Floor Open'}
              {phase === 'one_min_warning' && '1-Min Warning'}
              {phase === 'concluding_round' && 'Phase 3: Conclusion'}
              {phase === 'concluded' && 'Adjourned'}
            </span>
          </div>

          {/* Right Action: Conclude & Evaluate */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowCaptions(!showCaptions)}
              className={`p-1.5 rounded-lg border text-xs font-medium transition-colors ${
                showCaptions ? 'bg-slate-800 text-slate-200 border-slate-700' : 'bg-slate-950 text-slate-400 border-slate-800'
              }`}
              title="Toggle Live Transcript Drawer"
            >
              <MessageSquare className="w-4 h-4" />
            </button>

            <button
              onClick={handleWrapUpAndEvaluate}
              disabled={isGeneratingReport}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-md shadow-rose-950/40 transition-all cursor-pointer disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isGeneratingReport ? 'Compiling Report...' : 'End & Generate Report'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main GD Discussion Arena Visual Layout */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
        {/* Left / Center Area: Virtual Boardroom Arena Table (Cols 1-8 or 1-12) */}
        <div className={`space-y-4 ${showCaptions ? 'lg:col-span-8' : 'lg:col-span-12'}`}>
          {/* Fishbowl Banner if Observing */}
          {isFishbowlObserving && (
            <div className="p-3 rounded-xl bg-indigo-950/50 border border-indigo-500/30 flex items-center justify-between gap-3 animate-in fade-in">
              <div className="flex items-center gap-2 text-xs text-indigo-200">
                <Eye className="w-4 h-4 text-indigo-400" />
                <span>
                  <strong>Fishbowl Observation Mode:</strong> You are watching the opening round. Listen to how participants initiate and synthesize.
                </span>
              </div>
              <button
                onClick={() => {
                  setIsFishbowlObserving(false);
                  handleStudentInterruption();
                }}
                className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center gap-1.5 whitespace-nowrap shadow cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Tag In & Take Floor</span>
              </button>
            </div>
          )}

          {/* Real-time Silent Coach Nudge Drawer */}
          {currentNudge && (
            <div className="p-3.5 rounded-xl bg-gradient-to-r from-amber-950/80 via-slate-900 to-indigo-950/80 border border-amber-500/40 shadow-xl shadow-amber-950/20 flex items-start justify-between gap-3 animate-in slide-in-from-top-2 duration-300">
              <div className="flex items-start gap-2.5">
                <div className="p-1 rounded-lg bg-amber-500 text-slate-950 mt-0.5">
                  <Sparkles className="w-3.5 h-3.5 font-black" />
                </div>
                <div>
                  <div className="text-[11px] font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                    <span>Silent Real-Time Coach</span>
                    <span className="text-slate-400 font-normal">({currentNudge.nudgeType.replace('_', ' ')})</span>
                  </div>
                  <p className="text-xs text-slate-100 font-medium mt-0.5">
                    {currentNudge.message}
                  </p>
                  <div className="mt-1.5 flex items-center gap-2">
                    <span className="text-[10px] text-slate-400">Winning Entry Phrase:</span>
                    <button
                      onClick={() => {
                        setUserTypedInput(currentNudge.suggestedEntryPhrase);
                        handleStudentInterruption();
                      }}
                      className="text-[11px] font-semibold text-amber-400 hover:text-amber-300 underline decoration-amber-500/50 flex items-center gap-1 cursor-pointer"
                    >
                      "{currentNudge.suggestedEntryPhrase}"
                      <ArrowRight className="w-3 h-3 inline" />
                    </button>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setCurrentNudge(null)}
                className="text-slate-400 hover:text-white text-xs p-1"
              >
                ✕
              </button>
            </div>
          )}

          {/* Boardroom Circle Table & Avatars Layout */}
          <div className="relative bg-gradient-to-b from-slate-900/90 to-slate-950 border border-slate-800 rounded-3xl p-4 sm:p-8 min-h-[360px] sm:min-h-[440px] flex flex-col justify-between shadow-2xl">
            {/* Top Table Head: MODERATOR */}
            <div className="flex justify-center">
              <div
                className={`relative p-3 rounded-2xl border transition-all flex items-center gap-3 max-w-sm ${
                  activeSpeakerId === moderator.id
                    ? 'bg-amber-950/40 border-amber-500 shadow-xl shadow-amber-950/40 ring-2 ring-amber-500/40 scale-105'
                    : 'bg-slate-900/80 border-slate-800 opacity-90'
                }`}
              >
                <div className="relative">
                  <div className="w-11 h-11 rounded-xl bg-slate-800 flex items-center justify-center text-xl border border-amber-500/30">
                    {moderator.avatarEmoji}
                  </div>
                  {activeSpeakerId === moderator.id && (
                    <span className="absolute -bottom-1 -right-1 flex h-3.5 w-3.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-amber-500"></span>
                    </span>
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-xs text-slate-100">{moderator.name}</span>
                    <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30">
                      Moderator
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400">{moderator.title}</p>
                </div>
              </div>
            </div>

            {/* Virtual Conference Table Center Graphic */}
            <div className="my-auto py-4 relative flex items-center justify-center">
              <div className="w-full max-w-lg h-24 rounded-full bg-gradient-to-r from-slate-800/40 via-indigo-950/30 to-slate-800/40 border border-slate-700/50 flex flex-col items-center justify-center text-center px-4 relative overflow-hidden backdrop-blur-sm shadow-inner">
                {/* Active speaker wave animation */}
                {activeSpeakerObj && (
                  <div className="space-y-1">
                    <div className="flex items-center justify-center gap-1.5">
                      <div className="flex items-center gap-1 h-3">
                        <span className="w-1 bg-amber-400 rounded-full animate-bounce [animation-delay:-0.3s] h-3"></span>
                        <span className="w-1 bg-amber-400 rounded-full animate-bounce [animation-delay:-0.15s] h-4"></span>
                        <span className="w-1 bg-amber-400 rounded-full animate-bounce h-2"></span>
                      </div>
                      <span className="text-xs font-bold text-amber-300 tracking-wide">
                        {activeSpeakerObj.name} holds the floor
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300 italic max-w-md truncate px-2">
                      {transcript.slice(-1)[0]?.text || 'Waiting for initial contribution...'}
                    </p>
                  </div>
                )}
                {!activeSpeakerObj && (
                  <div className="text-xs text-slate-400 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                    <span>Floor open • Start speaking anytime to take the turn</span>
                  </div>
                )}
              </div>
            </div>

            {/* Middle Row: AI PARTICIPANTS Arranged Around the Virtual Table */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-2">
              {aiParticipants.map((p) => {
                const isSpeaking = activeSpeakerId === p.id;
                return (
                  <div
                    key={p.id}
                    className={`p-3 rounded-2xl border transition-all text-left relative flex flex-col justify-between ${
                      isSpeaking
                        ? 'bg-indigo-950/40 border-indigo-500 shadow-xl shadow-indigo-950/40 ring-2 ring-indigo-500/40 scale-105'
                        : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-1 mb-2">
                      <div className="relative">
                        <div className="w-10 h-10 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-lg">
                          {p.avatarEmoji}
                        </div>
                        {isSpeaking && (
                          <span className="absolute -bottom-1 -right-1 flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500"></span>
                          </span>
                        )}
                      </div>
                      <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded ${
                        isSpeaking
                          ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                          : 'bg-slate-800 text-slate-400'
                      }`}>
                        {isSpeaking ? 'Speaking 🎙️' : 'Listening 👂'}
                      </span>
                    </div>

                    <div>
                      <div className="font-bold text-xs text-slate-100 truncate">{p.name}</div>
                      <div className="text-[10px] text-amber-400 font-medium truncate">{p.personalityTag}</div>
                      <div className="text-[9px] text-slate-500 mt-0.5 truncate">{p.collegeOrCompany}</div>
                    </div>

                    {isSpeaking && (
                      <div className="mt-2 pt-2 border-t border-indigo-500/20 text-[10px] text-indigo-200 line-clamp-2 italic">
                        "{transcript.slice(-1)[0]?.text}"
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Bottom Row: STUDENT / USER PRIMARY DESK */}
            <div className="mt-4 pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4">
              {/* User Avatar Card */}
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <div className="relative">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-bold border ${
                    isUserSpeaking
                      ? 'bg-rose-950 border-rose-500 shadow-lg shadow-rose-950/50 text-white'
                      : 'bg-slate-900 border-slate-700 text-slate-200'
                  }`}>
                    🎓
                  </div>
                  {isUserSpeaking && (
                    <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-rose-500"></span>
                    </span>
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-100">{userProfile.name} (You)</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
                      Candidate
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-0.5">
                    <span>Target: {userProfile.targetRole}</span>
                    <span>•</span>
                    <span>Turns Taken: <strong>{userTurnsCount}</strong></span>
                    <span>•</span>
                    <span>Airtime: <strong>{userSpeakingTimeSec}s</strong></span>
                  </div>
                </div>
              </div>

              {/* Student Live Speaking Controls */}
              <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
                {/* Hand Raise Button */}
                <button
                  onClick={toggleUserHandRaise}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all cursor-pointer ${
                    isUserHandRaised
                      ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md font-bold'
                      : 'bg-slate-900 border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                  title="Signal intent to speak next"
                >
                  <Hand className="w-4 h-4" />
                  <span>{isUserHandRaised ? 'Hand Raised ✋' : 'Raise Hand'}</span>
                </button>

                {/* Main Microphone Button */}
                <button
                  onClick={() => {
                    handleStudentInterruption();
                  }}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-lg cursor-pointer ${
                    isUserSpeaking
                      ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-950/60 ring-4 ring-rose-500/30'
                      : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-950/40'
                  }`}
                >
                  <Mic className={`w-4 h-4 ${isUserSpeaking ? 'animate-pulse' : ''}`} />
                  <span>{isUserSpeaking ? 'Speaking Now (AI Yielded)' : 'Take Floor / Speak'}</span>
                </button>
              </div>
            </div>

            {/* Live Interim Transcript Bubble if Student is Speaking */}
            {userInterimText && (
              <div className="mt-3 p-3 rounded-xl bg-rose-950/40 border border-rose-500/40 text-xs text-rose-200 animate-in fade-in flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping"></span>
                <span>Transcribing: "{userInterimText}..."</span>
              </div>
            )}

            {/* Mic Denied Warning or Text Fallback Box */}
            <form onSubmit={handleManualSpeechSubmit} className="mt-3 flex gap-2">
              <input
                type="text"
                value={userTypedInput}
                onChange={(e) => setUserTypedInput(e.target.value)}
                placeholder={
                  micErrorNote
                    ? 'Microphone blocked: Type your point here and press Enter to deliver to the room...'
                    : 'Or type your point here and hit Enter (immediately interrupts AI and takes floor)...'
                }
                className="flex-1 bg-slate-950/90 border border-slate-700/80 rounded-xl px-3.5 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
              />
              <button
                type="submit"
                disabled={!userTypedInput.trim()}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Deliver Point</span>
              </button>
            </form>
          </div>
        </div>

        {/* Right Area: Live Captions / Transcript Drawer (Cols 9-12) */}
        {showCaptions && (
          <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-3xl p-4 flex flex-col h-[600px] shadow-2xl">
            {/* Drawer Header */}
            <div className="pb-3 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-amber-400" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                  Live Discussion Transcript
                </h4>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">
                {transcript.length} turns recorded
              </span>
            </div>

            {/* Transcript Timeline Stream */}
            <div className="flex-1 overflow-y-auto py-3 space-y-3 pr-1 scrollbar-thin">
              {transcript.length === 0 && (
                <div className="h-full flex items-center justify-center text-center text-xs text-slate-500 p-4">
                  Discussion initiating. Moderator is establishing room guidelines...
                </div>
              )}

              {transcript.map((item, idx) => {
                const isUser = item.role === 'user';
                const isMod = item.role === 'moderator';

                return (
                  <div
                    key={item.id || idx}
                    className={`p-3 rounded-xl border text-xs space-y-1 transition-all ${
                      isUser
                        ? 'bg-rose-950/30 border-rose-500/40 text-rose-100 ml-4'
                        : isMod
                        ? 'bg-amber-950/30 border-amber-500/30 text-amber-100 mr-4'
                        : 'bg-slate-950 border-slate-800 text-slate-200 mr-2'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 text-[10px]">
                      <span className={`font-bold ${isUser ? 'text-rose-400' : isMod ? 'text-amber-400' : 'text-indigo-400'}`}>
                        {item.speakerName} {isUser && '(You)'}
                      </span>
                      <span className="text-slate-500 font-mono">{item.timestamp}</span>
                    </div>

                    <p className="leading-relaxed">{item.text}</p>

                    {item.wasInterrupted && (
                      <div className="text-[9px] text-rose-400/90 font-medium italic pt-1 border-t border-rose-500/20">
                        ⚡ Yielded floor when {item.interruptedBy || 'next speaker'} interrupted
                      </div>
                    )}
                  </div>
                );
              })}
              <div ref={transcriptEndRef} />
            </div>

            {/* Airtime Meter at Drawer Bottom */}
            <div className="pt-3 border-t border-slate-800 space-y-1.5">
              <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium">
                <span>Your Airtime Share</span>
                <span className="font-mono font-bold text-slate-200">
                  {Math.round((userSpeakingTimeSec / (Math.max(1, elapsedSeconds))) * 100)}%
                  <span className="text-[9px] text-slate-500 font-normal"> (Target: 18-25%)</span>
                </span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-slate-950 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-rose-500 transition-all duration-500"
                  style={{
                    width: `${Math.min(100, Math.round((userSpeakingTimeSec / (Math.max(1, elapsedSeconds))) * 100))}%`,
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
