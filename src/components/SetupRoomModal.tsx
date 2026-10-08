import React, { useState } from 'react';
import { CURATED_TOPICS } from '../data/mockTopics';
import { ALL_AI_PARTICIPANTS } from '../data/defaultParticipants';
import { GDFormat, LanguageMode, Participant, TopicInfo, UserGDProfile } from '../types/gd';
import { Sparkles, Users, Clock, Globe2, HelpCircle, Check, BookOpen, Layers, ShieldCheck, Flame } from 'lucide-react';

interface SetupRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartGD: (config: {
    topic: TopicInfo;
    format: GDFormat;
    languageMode: LanguageMode;
    durationSec: number;
    participants: Participant[];
    userProfile: UserGDProfile;
  }) => void;
}

export const SetupRoomModal: React.FC<SetupRoomModalProps> = ({
  isOpen,
  onClose,
  onStartGD,
}) => {
  if (!isOpen) return null;

  const [selectedTopic, setSelectedTopic] = useState<TopicInfo>(CURATED_TOPICS[0]);
  const [activeTab, setActiveTab] = useState<'curated' | 'custom'>('curated');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');

  // Custom Topic fields
  const [customTitle, setCustomTitle] = useState('');
  const [customDescription, setCustomDescription] = useState('');

  // Room parameters
  const [panelSize, setPanelSize] = useState<number>(4); // 3, 4, or 5 AI participants
  const [format, setFormat] = useState<GDFormat>('standard');
  const [languageMode, setLanguageMode] = useState<LanguageMode>('english');
  const [durationSec, setDurationSec] = useState<number>(480); // 8 mins default
  const [patienceLevel, setPatienceLevel] = useState<'fast' | 'natural' | 'patient'>('natural');

  // User Profile
  const [studentName, setStudentName] = useState('Arjun Patel');
  const [targetRole, setTargetRole] = useState('Software Engineer / Tech Consulting');

  const categories = ['All', 'Tech & AI', 'Business & Economy', 'Case Study', 'Abstract', 'Controversial', 'Campus & Society'];

  const filteredTopics = categoryFilter === 'All'
    ? CURATED_TOPICS
    : CURATED_TOPICS.filter((t) => t.category === categoryFilter);

  const handleLaunch = () => {
    let finalTopic: TopicInfo = selectedTopic;
    if (activeTab === 'custom') {
      if (!customTitle.trim()) {
        alert('Please enter a custom topic title');
        return;
      }
      finalTopic = {
        id: `custom-${Date.now()}`,
        title: customTitle.trim(),
        category: 'Tech & AI',
        difficulty: 'Moderate',
        description: customDescription.trim() || 'Custom Group Discussion topic provided by candidate.',
        keyPillars: ['Problem Definition', 'Stakeholder Impact', 'Implementation Feasibility'],
        sampleQuestions: ['What are the trade-offs?', 'How does this scale sustainably?'],
        suggestedOpeningHooks: [
          `Good morning everyone. The topic before us is "${customTitle.trim()}". To give our discussion a structured anchor, I suggest we examine three core dimensions...`,
        ],
      };
    }

    // Select the chosen count of AI participants
    const activeAi = ALL_AI_PARTICIPANTS.slice(0, panelSize);

    onStartGD({
      topic: finalTopic,
      format,
      languageMode,
      durationSec,
      participants: activeAi,
      userProfile: {
        name: studentName.trim() || 'Candidate',
        targetRole: targetRole.trim() || 'General Placement Candidate',
        collegeOrYear: 'Campus Finalist',
        patienceLevel,
      },
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/40 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Sparkles className="w-4 h-4" />
              </span>
              <h2 className="text-xl font-bold text-slate-100 tracking-tight">Configure Your GD Room</h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Select room dynamics, participant personalities, and discussion rules
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition-colors text-sm"
          >
            ✕
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Step 1: Topic Selection */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-amber-400" />
                <span>1. Select Discussion Topic</span>
              </label>
              <div className="flex gap-1 p-0.5 bg-slate-950 rounded-lg border border-slate-800">
                <button
                  type="button"
                  onClick={() => setActiveTab('curated')}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                    activeTab === 'curated'
                      ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Curated Placement Topics ({CURATED_TOPICS.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('custom')}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                    activeTab === 'custom'
                      ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Custom Topic
                </button>
              </div>
            </div>

            {activeTab === 'curated' ? (
              <div className="space-y-3">
                {/* Categories */}
                <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategoryFilter(cat)}
                      className={`px-2.5 py-1 rounded-full whitespace-nowrap transition-colors ${
                        categoryFilter === cat
                          ? 'bg-slate-100 text-slate-950 font-semibold'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {/* Topics Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {filteredTopics.map((top) => {
                    const isSelected = selectedTopic.id === top.id;
                    return (
                      <div
                        key={top.id}
                        onClick={() => setSelectedTopic(top)}
                        className={`p-3.5 rounded-xl border cursor-pointer transition-all text-left flex flex-col justify-between ${
                          isSelected
                            ? 'bg-amber-500/10 border-amber-500/60 shadow-md shadow-amber-950/20 ring-1 ring-amber-500/30'
                            : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700 hover:bg-slate-950'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-1.5">
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                              {top.category}
                            </span>
                            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                              top.difficulty === 'High Stakes'
                                ? 'text-rose-400 bg-rose-950/40'
                                : 'text-emerald-400 bg-emerald-950/40'
                            }`}>
                              {top.difficulty}
                            </span>
                          </div>
                          <h4 className="text-xs sm:text-sm font-semibold text-slate-100 line-clamp-2">
                            {top.title}
                          </h4>
                          <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                            {top.description}
                          </p>
                        </div>
                        {isSelected && (
                          <div className="mt-2.5 pt-2 border-t border-amber-500/20 flex items-center justify-between text-[11px] text-amber-400 font-medium">
                            <span>Selected for this session</span>
                            <Check className="w-3.5 h-3.5" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">
                    Topic Title or Placement Prompt
                  </label>
                  <input
                    type="text"
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                    placeholder="e.g. Should central banks replace cash with programmable digital currency?"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">
                    Background Context / Case Brief (Optional)
                  </label>
                  <textarea
                    value={customDescription}
                    onChange={(e) => setCustomDescription(e.target.value)}
                    rows={2}
                    placeholder="Provide any specific company, industry, or data context you want the AI participants to debate..."
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>
            )}
          </section>

          {/* Step 2: Format & Room Dynamics */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            {/* GD Format */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-indigo-400" />
                <span>GD Format</span>
              </label>
              <select
                value={format}
                onChange={(e) => setFormat(e.target.value as GDFormat)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="standard">Standard Placement GD (Free flow)</option>
                <option value="case_study">Case Study Round (Root cause & solution)</option>
                <option value="abstract">Abstract / Metaphorical (Lateral depth)</option>
                <option value="controversial">Controversial Debate (Handling friction)</option>
                <option value="fishbowl">Fishbowl Mode (Observe 2m then enter)</option>
              </select>
              <p className="text-[10px] text-slate-400">
                {format === 'standard' && 'Classic 8-min round used by TCS, Infosys, Deloitte, Cognizant, etc.'}
                {format === 'case_study' && 'Focuses on structured MECE frameworks and business feasibility.'}
                {format === 'abstract' && 'Tests philosophy, creative analogies, and leadership metaphors.'}
                {format === 'controversial' && 'Tests emotional composure, polite counters, and de-escalation.'}
                {format === 'fishbowl' && 'Listen to AI participants first, then click "Tag In" to take the hot seat!'}
              </p>
            </div>

            {/* Language Mode */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Globe2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Language & Flavour</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setLanguageMode('english')}
                  className={`p-2 rounded-lg border text-xs font-medium text-center transition-all ${
                    languageMode === 'english'
                      ? 'bg-emerald-500/10 border-emerald-500 text-emerald-300'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  English (Formal)
                </button>
                <button
                  type="button"
                  onClick={() => setLanguageMode('hinglish')}
                  className={`p-2 rounded-lg border text-xs font-medium text-center transition-all ${
                    languageMode === 'hinglish'
                      ? 'bg-amber-500/10 border-amber-500 text-amber-300'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Hinglish (Natural Mix)
                </button>
              </div>
              <p className="text-[10px] text-slate-400">
                {languageMode === 'hinglish'
                  ? 'Personas will blend Hindi & English naturally ("point ye hai", "lekin dekho"), like real Indian mock GDs.'
                  : 'Pure English placement format with global professional vocabulary.'}
              </p>
            </div>

            {/* Duration */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>Discussion Timer</span>
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { label: '5 Mins', sec: 300, desc: 'Sprint drill' },
                  { label: '8 Mins', sec: 480, desc: 'Placement standard' },
                  { label: '12 Mins', sec: 720, desc: 'MBA/MBB round' },
                ].map((d) => (
                  <button
                    key={d.sec}
                    type="button"
                    onClick={() => setDurationSec(d.sec)}
                    className={`p-2 rounded-lg border text-center transition-all ${
                      durationSec === d.sec
                        ? 'bg-amber-500/10 border-amber-500 text-amber-300 font-semibold'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div className="text-xs font-bold">{d.label}</div>
                    <div className="text-[9px] text-slate-400 opacity-80">{d.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* Step 3: Panel Size & Personalities */}
          <section className="space-y-3 pt-2 border-t border-slate-800/80">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-rose-400" />
                <span>2. AI Discussion Panel: {panelSize} Candidates + 1 Senior Moderator</span>
              </label>
              <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 p-0.5 rounded-lg text-xs">
                {[3, 4, 5].map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => setPanelSize(size)}
                    className={`px-2.5 py-1 rounded-md font-semibold transition-colors ${
                      panelSize === size
                        ? 'bg-rose-500 text-white'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {size} AI Candidates
                  </button>
                ))}
              </div>
            </div>

            {/* Participant Cards Preview */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2">
              {ALL_AI_PARTICIPANTS.slice(0, panelSize).map((p) => (
                <div
                  key={p.id}
                  className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-center flex flex-col items-center justify-between"
                >
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-lg mb-1 border border-slate-700 bg-slate-900">
                    {p.avatarEmoji}
                  </div>
                  <div className="font-semibold text-xs text-slate-100">{p.name}</div>
                  <span className="text-[10px] text-slate-400 leading-tight line-clamp-1">{p.personalityTag}</span>
                  <div className="mt-1.5 text-[9px] text-slate-400 px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800/60 line-clamp-2">
                    {p.personalityDesc}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Step 4: User Profile & Interruption Patience */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-slate-800/80">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Your Full Name</label>
              <input
                type="text"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                placeholder="e.g. Arjun Patel"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Target Placement Role</label>
              <input
                type="text"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                placeholder="e.g. Software Engineer / Consultant"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                AI Turn-Taking Patience
              </label>
              <select
                value={patienceLevel}
                onChange={(e) => setPatienceLevel(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
              >
                <option value="fast">Aggressive (1.5s pause - high-pressure GD)</option>
                <option value="natural">Realistic (2.5s pause - campus standard)</option>
                <option value="patient">Patient (4.0s pause - friendly for beginners)</option>
              </select>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Mic recognition & voice turn-taking ready</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleLaunch}
              className="px-6 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-500 via-rose-500 to-indigo-600 hover:from-amber-400 hover:to-indigo-500 text-white shadow-lg shadow-rose-950/50 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Flame className="w-4 h-4" />
              <span>Enter Discussion Room</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
