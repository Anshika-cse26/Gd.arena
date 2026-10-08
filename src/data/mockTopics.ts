import { TopicInfo } from '../types/gd';

export const CURATED_TOPICS: TopicInfo[] = [
  {
    id: 'ai-jobs-campus',
    title: 'Generative AI & Software Engineering: Job Killer or Productivity Multiplier for Fresh Graduates?',
    category: 'Tech & AI',
    difficulty: 'High Stakes',
    description: 'With LLMs writing 40%+ of enterprise code, placement committees want to see if students understand how the definition of an engineer is evolving from syntax writer to systems thinker.',
    keyPillars: ['Shift to code review & architectural design', 'Junior engineer hiring contraction', 'New roles: AI security, prompt systems, evaluation engineers'],
    sampleQuestions: ['Will companies stop hiring junior programmers?', 'How should engineering colleges revamp curricula?'],
    suggestedOpeningHooks: [
      'Good morning everyone. Looking at the data, GitHub Copilot reports a 55% speedup in coding tasks, but speed without verification is liability. Let us structure this discussion into three pillars...',
      'To ground our discussion, I would like to distinguish between replacement of tasks vs replacement of roles...'
    ]
  },
  {
    id: 'gig-economy-empowerment',
    title: 'The Gig Economy in Developing Nations: Financial Inclusion or Digital Exploitation?',
    category: 'Business & Economy',
    difficulty: 'Moderate',
    description: 'Platforms like Swiggy, Uber, and Zepto have created millions of flexible livelihoods, but concerns over minimum wage, healthcare safety nets, and algorithmic surveillance are escalating.',
    keyPillars: ['Livelihood generation vs lack of social security', 'Algorithmic rating pressure & 10-minute deliveries', 'Policy balance: Gig workers welfare board'],
    sampleQuestions: ['Should 10-minute instant delivery be regulated?', 'Who pays for health insurance and pension?'],
    suggestedOpeningHooks: [
      'Friends, let us look at this through the lens of economic alternatives. In an economy where youth unemployment is 10%, gig platforms are a vital shock absorber, yet...',
      'I suggest we evaluate this across three stakeholders: the delivery partner, the consumer convenience factor, and platform profitability...'
    ]
  },
  {
    id: 'case-fintech-crisis',
    title: 'Case Study: FinTech Unicorn Facing 45% Monthly Cash Burn — Layoffs vs Strategic Pivot?',
    category: 'Case Study',
    difficulty: 'High Stakes',
    description: 'A 4-year-old Buy-Now-Pay-Later startup with 12M users has 6 months of runway left. Venture capital has frozen up. The board is divided between slashing 35% headcount or pivoting to B2B credit infrastructure.',
    keyPillars: ['Unit economics & default rate management', 'Customer acquisition cost vs lifetime value', 'Severance ethics vs company survival'],
    sampleQuestions: ['How to triage costs without destroying tech core?', 'Can B2B pivot generate revenue in 90 days?'],
    suggestedOpeningHooks: [
      'Let us clearly define the core problem: with only 6 months of runway, capital preservation takes precedence over market expansion. Here is a 3-step triage framework...',
      'Colleagues, rather than treating this as a binary choice between firing people and pivoting, let us examine immediate cost rationalization alongside pilot B2B contracts...'
    ]
  },
  {
    id: 'abstract-black-white-grey',
    title: 'Abstract: "Black and white make clarity, but the real world moves in the grey"',
    category: 'Abstract',
    difficulty: 'High Stakes',
    description: 'A classic MBB / IIM / campus placement abstract topic designed to test lateral interpretation, business metaphors, and philosophical depth.',
    keyPillars: ['Black & White = Compliance, integrity, core ethics', 'Grey = Strategy, negotiation, cultural ambiguity', 'Synthesis: Leading in VUCA environments'],
    sampleQuestions: ['Where must a manager strictly draw black-and-white lines?', 'How do you navigate grey zones without compromising ethics?'],
    suggestedOpeningHooks: [
      'Friends, abstract topics allow us to build a meaningful metaphorical bridge. If black and white represent uncompromising compliance and non-negotiables, the grey represents tactical innovation...',
      'I would like to initiate by interpreting "black and white" as foundational data, and "grey" as contextual human judgment...'
    ]
  },
  {
    id: 'controversial-70hr-workweek',
    title: 'Controversial: Should Young Professionals Work 70 Hours a Week for National Growth?',
    category: 'Controversial',
    difficulty: 'Moderate',
    description: 'Triggered by corporate leaders advocating 70-hour workweeks to accelerate GDP. Tests a candidate’s ability to debate high-heat topics diplomatically without losing composure.',
    keyPillars: ['Productivity vs raw hours logged (Parkinson’s Law)', 'Burnout, mental health, and talent attrition', 'Global comparisons (Japan Karoshi vs Germany 35-hour efficiency)'],
    sampleQuestions: ['Does working 70 hours correlate with innovation?', 'Is output quality being confused with physical presence?'],
    suggestedOpeningHooks: [
      'Colleagues, this is a passionate topic, so let us distinguish between input metrics like hours clocked and output metrics like value generated per hour...',
      'To build consensus, let us examine whether startup sprints are being conflated with sustainable decade-long career endurance...'
    ]
  },
  {
    id: 'campus-degree-vs-portfolio',
    title: 'Tier-3 Engineering Degree with Live Projects vs Tier-1 College Brand: What Decides Careers?',
    category: 'Campus & Society',
    difficulty: 'Beginner',
    description: 'Directly relatable to campus students. Discusses whether institutional pedigree still trumps open-source contributions, proof-of-work, and grit in modern tech hiring.',
    keyPillars: ['First-job screening filters vs 5-year career trajectories', 'Signaling value of alumni networks', 'Open-source proof of work as the great equalizer'],
    sampleQuestions: ['Do recruiters actually look at GitHub repos during resume triage?', 'How can tier-3 students bridge the signaling gap?'],
    suggestedOpeningHooks: [
      'Friends, this directly impacts all of us in this placement room. While college brand gets you past the resume screening ATS bot, project depth decides the technical interview round...',
      'Let us examine this across short-term entry barriers versus long-term executive velocity...'
    ]
  },
  {
    id: 'hinglish-regional-ecommerce',
    title: 'Quick Commerce vs Kirana Stores: Kya Local Dukandar Khatam Ho Jayenge?',
    category: 'Business & Economy',
    difficulty: 'Moderate',
    description: 'Explores the aggressive blitzscaling of 10-minute grocery delivery apps in India and its impact on 12 million neighbourhood Kirana shopkeepers.',
    keyPillars: ['Credit trust & relationship banking of Kiranas', 'Margin pressure on dark stores', 'Hybrid coexistence models: ONDC & Kirana tech enablement'],
    sampleQuestions: ['Can Kiranas compete with venture-funded dark stores on fresh veggies?', 'Will consumer habit stick if delivery fees rise?'],
    suggestedOpeningHooks: [
      'Hello friends, dekhiye quick commerce ne convenience to di hai, lekin Kirana stores ka jo informal credit system aur zero-delivery cost advantage hai usko replace karna mushkil hai. Let us look at both sides...',
      'Let us evaluate this realistically: quick commerce tier-1 metros mein 15% wallet share capture kar chuka hai, par tier-2 and tier-3 India mein Kirana is still the backbone...'
    ]
  }
];
