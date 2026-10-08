import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '10mb' }));

// Shared Gemini client setup as per skill guide
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// 1. Next AI Speaker Turn in Group Discussion
app.post('/api/gd/next-turn', async (req: Request, res: Response) => {
  try {
    const {
      topic,
      topicDescription,
      format,
      languageMode,
      activeParticipants,
      recentTranscript,
      lastSpeakerId,
      timeRemainingSec,
      totalDurationSec,
      isModeratorCalling,
    } = req.body;

    const availableAiSpeakers = activeParticipants.filter(
      (p: any) => p.role === 'ai_participant' && p.id !== lastSpeakerId
    );

    const systemPrompt = `You are the dynamic AI orchestrator for a realistic, voice-first campus placement Group Discussion (GD) simulation.
Topic: "${topic}"
Topic Context: "${topicDescription || ''}"
GD Format: ${format || 'Standard Placement GD'}
Language Mode: ${languageMode || 'English'} (If Hinglish: naturally blend casual conversational Hindi words like 'dekho', 'lekin', 'bilkul', 'mera manna hai', 'point ye hai' with English, just like smart Indian engineering/MBA students do in real mock GDs. If English: maintain natural conversational English).
Time remaining: ${timeRemainingSec}s of ${totalDurationSec}s.

Active AI Participants:
${availableAiSpeakers.map((p: any) => `- ID: "${p.id}", Name: "${p.name}", Personality: "${p.personalityTag}" (${p.personalityDesc})`).join('\n')}

RULES FOR REALISTIC GD DIALOGUE:
1. BREVITY: Real GD turns are 20 to 45 words (1-3 sentences maximum). People NEVER give long speeches in a 6-person room; they make a punchy point, give a brief concrete example or metric, and pass the ball.
2. CROSS-REFERENCING: Participants MUST directly react to, acknowledge, or challenge what previous speakers just said (by calling their name, e.g. "I see Priya's point on costs, but...", "Building on what Rohan mentioned...", or addressing the student if the student spoke recently).
3. PERSONALITY ACCURACY:
   - Dominator (Rohan): Jumps in fast, slightly competitive, challenges assumptions.
   - Analytical (Priya): Brings a concrete statistic, percentage, framework, or tangible ROI trade-off.
   - Synthesizer (Vikram): Reconciles two opposing viewpoints, bridges conflict, finds middle ground.
   - Creative / Lateral (Ananya): Thinks out-of-the-box, raises human/ethical angles, may slightly drift unless re-anchored.
   - Quiet/Impact (Kabir): Rare speaker, but brings a grounded reality check.
4. DO NOT repeat the prompt or preface. Deliver natural spoken dialogue.

Select ONE AI participant who naturally speaks next and craft their response.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: `Recent Transcript History:
${recentTranscript.slice(-8).map((t: any) => `${t.speakerName} (${t.role === 'user' ? 'STUDENT' : t.speakerId}): "${t.text}"`).join('\n')}

Generate the next speaker's turn.`,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            speakerId: {
              type: Type.STRING,
              description: 'The id of the AI participant who speaks next',
            },
            speakerName: {
              type: Type.STRING,
              description: 'The name of the speaker',
            },
            text: {
              type: Type.STRING,
              description: 'The spoken dialogue (20-45 words max, spoken style)',
            },
            emotion: {
              type: Type.STRING,
              description: 'Tone: e.g. "assertive", "analytical", "diplomatic", "curious", "challenging"',
            },
            referencedSpeaker: {
              type: Type.STRING,
              description: 'Name of the participant referenced or challenged, if any',
            },
            gesture: {
              type: Type.STRING,
              description: 'Visual physical action: e.g. "nodding", "hand-gesture", "leaning-forward", "thoughtful"',
            },
          },
          required: ['speakerId', 'speakerName', 'text', 'emotion'],
        },
        temperature: 0.85,
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json(parsed);
  } catch (err: any) {
    console.error('Error in /api/gd/next-turn:', err);
    return res.status(500).json({
      error: 'Failed to generate next turn',
      details: err?.message,
    });
  }
});

// 2. Moderator Actions (Opening, 1-Min Warning, Summary Invitation)
app.post('/api/gd/moderator-action', async (req: Request, res: Response) => {
  try {
    const { actionType, topic, topicDescription, format, languageMode, studentName } = req.body;

    const systemPrompt = `You are Mr. S. Rao, an experienced and dignified Campus Placement Moderator & Evaluator conducting an official Group Discussion.
Topic: "${topic}"
Context: "${topicDescription || ''}"
Action Type: ${actionType} ("opening" | "warning_1min" | "request_summary" | "refocus_drift")
Student Name: ${studentName || 'Candidate'}
Language Mode: ${languageMode || 'English'}

Rules:
- For "opening": Welcoming candidates, stating the topic clearly, reminding them of GD ground rules (listen actively, respect time, avoid talking all at once), and saying "The floor is now open, anyone may initiate." (Around 40-60 words).
- For "warning_1min": Announce that 1 minute remains, remind the group to move toward synthesizing key takeaways or concluding.
- For "request_summary": Invite candidates (specifically leaving the door open for the student or someone who hasn't summarized) to present a balanced 30-second final wrap-up without starting new arguments.
- For "refocus_drift": Gently bring the discussion back to the core theme if participants drifted.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: `Produce the moderator's spoken statement for action "${actionType}".`,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            text: {
              type: Type.STRING,
              description: 'Spoken text of the moderator',
            },
            actionType: {
              type: Type.STRING,
              description: 'Action type executed',
            },
          },
          required: ['text'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json(parsed);
  } catch (err: any) {
    console.error('Error in /api/gd/moderator-action:', err);
    return res.status(500).json({
      error: 'Failed to generate moderator turn',
      details: err?.message,
    });
  }
});

// 3. Silent Real-time Coach Nudge for the Student
app.post('/api/gd/silent-nudge', async (req: Request, res: Response) => {
  try {
    const { topic, recentTranscript, studentSilenceDurationSec, studentHasSpoken, userTotalTurns } = req.body;

    const systemPrompt = `You are a real-time Silent Coach for a student sitting in a campus placement GD.
Topic: "${topic}"
Student Silence: ${studentSilenceDurationSec}s since last speaking.
Student Total Turns so far: ${userTotalTurns}.
Transcript tail:
${recentTranscript.slice(-5).map((t: any) => `${t.speakerName}: "${t.text}"`).join('\n')}

TASK:
Provide a quick, highly tactical 1-sentence whisper nudge that pops up silently on their screen to help them seize an opening right now.
Categories:
- "seize_floor": If student has been quiet > 60-90s, tell them how to enter immediately (e.g. "Vikram just agreed with Priya — jump in with: 'I'd like to offer another perspective on...'")
- "counter_point": Point out a flaw or missing angle in what an AI participant just asserted.
- "data_nudge": Suggest bringing in a number, case example, or structured pillar (e.g. "Bring in the economic impact or ethical dimension.")
- "interruption_defense": If discussion is loud, give a polite assertive phrase to gain floor.

Keep suggestion short, encouraging, and razor-sharp!`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: 'Generate one tactical real-time nudge.',
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            nudgeType: {
              type: Type.STRING,
              description: 'seize_floor | counter_point | data_nudge | interruption_defense',
            },
            message: {
              type: Type.STRING,
              description: 'Short actionable coaching tip (15-25 words)',
            },
            suggestedEntryPhrase: {
              type: Type.STRING,
              description: 'Exact words student can use right now to enter smoothly',
            },
          },
          required: ['nudgeType', 'message', 'suggestedEntryPhrase'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json(parsed);
  } catch (err: any) {
    console.error('Error in /api/gd/silent-nudge:', err);
    return res.status(500).json({ error: 'Nudge generation failed' });
  }
});

// 4. Comprehensive Post-GD Feedback Report with Quoted Moments & Missed Openings
app.post('/api/gd/analyze-report', async (req: Request, res: Response) => {
  try {
    const {
      topic,
      topicDescription,
      format,
      studentName,
      studentTargetRole,
      transcript,
      totalDurationSec,
      userSpeakingTimeSec,
      userTurnsCount,
      speakerBreakdown,
    } = req.body;

    const userTranscriptEntries = transcript.filter((t: any) => t.role === 'user');
    const userUtterancesCount = userTranscriptEntries.length;

    const prompt = `You are a tough, fair, and experienced Senior Placement Cell Evaluator and Interview Panelist evaluating a student's performance in a competitive campus Group Discussion.

TOPIC: "${topic}"
CONTEXT: "${topicDescription || ''}"
FORMAT: ${format}
CANDIDATE NAME: ${studentName || 'Candidate'}
TARGET ROLE: ${studentTargetRole || 'Campus Placement Candidate'}
TOTAL GD DURATION: ${Math.round(totalDurationSec)} seconds
CANDIDATE SPEAKING TIME: ${Math.round(userSpeakingTimeSec)} seconds (${Math.round((userSpeakingTimeSec / (totalDurationSec || 1)) * 100)}% of airtime)
CANDIDATE TURNS COUNT: ${userTurnsCount}

FULL GD TRANSCRIPT:
${transcript.map((t: any, idx: number) => `[Turn ${idx + 1} | ${t.timestamp || '0:00'} | ${t.speakerName} (${t.role === 'user' ? 'CANDIDATE' : 'AI'})]: "${t.text}"`).join('\n')}

EVALUATION CRITERIA:
1. INITIATION & OPENING: Did the candidate start the GD? If yes, was it a definition/framework or hollow quote? If not, did they enter early (within first 2 turns) with a solid anchor?
2. CONTENT DEPTH & IDEA QUALITY: Did they bring fresh perspectives, metrics, frameworks, or did they only repeat generic surface-level tropes?
3. ACTIVE LISTENING & BUILDING ON OTHERS: Did they cite other participants by name (e.g. "As Priya pointed out", "Challenging Rohan's premise") and synthesize, or talk in a vacuum?
4. ASSERTIVENESS & INTERRUPTIONS: How did they manage turn-taking? Did they get bulldozed, or did they enter politely and assertively without shouting?
5. SUMMARY & CONCLUDING ROUND: Did they attempt or contribute to a structured, neutral consensus summary at the end?

CRITICAL REQUIREMENTS:
- EVERY single feedback point MUST quote the exact moment from the transcript!
- Identify 3 "What You Could Have Said" Missed Opportunities: moments where an AI speaker said something vulnerable or where a silence occurred, and provide the exact high-scoring phrase the student should have used.
- Be honest and specific: No generic praise. State if they were selected, on the fence, or rejected by the campus panel.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            overallScore: {
              type: Type.INTEGER,
              description: 'Overall score from 0 to 100',
            },
            verdict: {
              type: Type.STRING,
              description: 'Selected for PI / Round 2 | Borderline (Evaluator Split) | Rejected at GD Round',
            },
            verdictSummary: {
              type: Type.STRING,
              description: '2-3 sentences explaining the core hiring decision reason',
            },
            rubrics: {
              type: Type.ARRAY,
              description: 'Evaluation across the 5 standard placement rubrics',
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  name: { type: Type.STRING },
                  score: { type: Type.INTEGER, description: 'Score out of 20' },
                  maxScore: { type: Type.INTEGER, description: 'Always 20' },
                  status: { type: Type.STRING, description: 'strength | satisfactory | weakness' },
                  feedback: { type: Type.STRING, description: 'Direct, honest critique' },
                  quotedEvidence: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        quote: { type: Type.STRING, description: 'Exact quote from transcript' },
                        speaker: { type: Type.STRING },
                        timestamp: { type: Type.STRING },
                        analysis: { type: Type.STRING, description: 'Why this quote shows strength or flaw' },
                      },
                      required: ['quote', 'speaker', 'analysis'],
                    },
                  },
                },
                required: ['id', 'name', 'score', 'maxScore', 'status', 'feedback', 'quotedEvidence'],
              },
            },
            missedOpportunities: {
              type: Type.ARRAY,
              description: 'What you could have said replay moments',
              items: {
                type: Type.OBJECT,
                properties: {
                  timestamp: { type: Type.STRING },
                  contextQuote: { type: Type.STRING, description: 'What was said in the room' },
                  speakerWhoSpoke: { type: Type.STRING },
                  missedAngle: { type: Type.STRING, description: 'The golden opening that was missed' },
                  recommendedScript: { type: Type.STRING, description: 'Exact high-scoring phrase the student could have said' },
                  whyItScoresHigh: { type: Type.STRING, description: 'Why interviewers award bonus points for this response' },
                },
                required: ['contextQuote', 'speakerWhoSpoke', 'missedAngle', 'recommendedScript', 'whyItScoresHigh'],
              },
            },
            redFlags: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Critical placement red flags detected (or none)',
            },
            standoutStrengths: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Key positive traits noticed by the panel',
            },
            actionableNextSteps: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: '3 concrete drills to prepare for the next GD',
            },
          },
          required: [
            'overallScore',
            'verdict',
            'verdictSummary',
            'rubrics',
            'missedOpportunities',
            'redFlags',
            'standoutStrengths',
            'actionableNextSteps',
          ],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json(parsed);
  } catch (err: any) {
    console.error('Error in /api/gd/analyze-report:', err);
    return res.status(500).json({
      error: 'Failed to analyze report',
      details: err?.message,
    });
  }
});

// Configure Vite middleware or static serving
async function setupServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`GD Arena server listening on http://0.0.0.0:${PORT}`);
  });
}

setupServer();
