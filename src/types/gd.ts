export type GDFormat =
  | 'standard' // Free-flowing campus placement GD (8-10 mins)
  | 'case_study' // Root cause analysis, stakeholder trade-offs, consensus solution
  | 'abstract' // Lateral thinking, metaphorical topics (e.g. "Black vs White")
  | 'controversial' // High-heat debates, managing disagreement without shouting
  | 'fishbowl'; // User observes 2 minutes first, then swaps in as an active speaker

export type LanguageMode = 'english' | 'hinglish';

export type DiscussionPhase =
  | 'briefing' // Moderator establishes topic & rules
  | 'open_floor' // Free-flowing discussion
  | 'one_min_warning' // Moderator announces 1 minute left
  | 'concluding_round' // Participants synthesize takeaways
  | 'concluded'; // GD ended, ready for evaluation report

export type ParticipantRole = 'moderator' | 'ai_participant' | 'user';

export interface Participant {
  id: string;
  name: string;
  role: ParticipantRole;
  title: string;
  collegeOrCompany?: string;
  avatarBg: string;
  avatarEmoji: string;
  personalityTag: string;
  personalityDesc: string;
  stylePrompt: string;
  voiceGender: 'male' | 'female';
  voicePitch: number;
  voiceRate: number;
  // Live state
  isSpeaking?: boolean;
  isRaisingHand?: boolean;
  totalSpeakingTimeSec?: number;
  turnsCount?: number;
}

export interface TopicInfo {
  id: string;
  title: string;
  category: 'Tech & AI' | 'Business & Economy' | 'Case Study' | 'Abstract' | 'Controversial' | 'Campus & Society';
  difficulty: 'Beginner' | 'Moderate' | 'High Stakes';
  description: string;
  keyPillars: string[];
  sampleQuestions: string[];
  suggestedOpeningHooks: string[];
}

export interface Utterance {
  id: string;
  timestamp: string;
  timestampSec: number;
  speakerId: string;
  speakerName: string;
  role: ParticipantRole;
  text: string;
  durationSec: number;
  wasInterrupted?: boolean;
  interruptedBy?: string;
  referencedSpeakerName?: string;
  emotion?: string;
  gesture?: string;
}

export interface RealtimeNudge {
  id: string;
  timestamp: string;
  nudgeType: 'seize_floor' | 'counter_point' | 'data_nudge' | 'interruption_defense';
  message: string;
  suggestedEntryPhrase: string;
}

export interface RubricEvidence {
  quote: string;
  speaker: string;
  timestamp: string;
  analysis: string;
}

export interface RubricScore {
  id: string;
  name: string;
  score: number; // 0-20
  maxScore: 20;
  status: 'strength' | 'satisfactory' | 'weakness';
  feedback: string;
  quotedEvidence: RubricEvidence[];
}

export interface MissedOpportunity {
  timestamp: string;
  contextQuote: string;
  speakerWhoSpoke: string;
  missedAngle: string;
  recommendedScript: string;
  whyItScoresHigh: string;
}

export interface SpeakerStats {
  speakerId: string;
  name: string;
  role: ParticipantRole;
  speakingTimeSec: number;
  percent: number;
  turns: number;
}

export interface FeedbackReport {
  id: string;
  date: string;
  topicTitle: string;
  format: GDFormat;
  languageMode: LanguageMode;
  totalDurationSec: number;
  overallScore: number;
  verdict: string;
  verdictSummary: string;
  stats: {
    totalGdTimeSec: number;
    userSpeakingTimeSec: number;
    userSpeakingPercent: number;
    userTurnsCount: number;
    avgTurnDurationSec: number;
    timesInterrupted: number;
    speakerBreakdown: SpeakerStats[];
  };
  rubrics: RubricScore[];
  missedOpportunities: MissedOpportunity[];
  redFlags: string[];
  standoutStrengths: string[];
  actionableNextSteps: string[];
  transcript: Utterance[];
}

export interface UserGDProfile {
  name: string;
  targetRole: string;
  collegeOrYear: string;
  patienceLevel: 'fast' | 'natural' | 'patient'; // AI silence timeout before speaking
}
