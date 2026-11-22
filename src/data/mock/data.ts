/** Static seed content for the mock repositories. */
import type {
  CategoryKey,
  ColorToken,
  Difficulty,
  HabitTemplate,
  Rating,
  ScenarioCustomer,
} from "@/lib/types";

// ---------- Categories ----------

export interface CategoryDef {
  readonly key: CategoryKey;
  readonly name: string;
  readonly colorToken: ColorToken;
  readonly objectKey: string;
  readonly description: string;
  /** Titles for levels 1 to 4 (guided). Level 5 is the boss. */
  readonly levelTitles: readonly [string, string, string, string];
}

export const CATEGORY_DEFS: readonly CategoryDef[] = [
  {
    key: "handling-complaints",
    name: "Handling Complaints",
    colorToken: "peach",
    objectKey: "megaphone",
    description: "Listen, apologise and own the problem.",
    levelTitles: ["Late delivery", "Wrong order", "Double charge", "Damaged item"],
  },
  {
    key: "customer-queries",
    name: "Customer Queries",
    colorToken: "sky",
    objectKey: "bubble",
    description: "Give clear, accurate, helpful answers.",
    levelTitles: ["Product question", "Order status", "Refund policy", "Warranty cover"],
  },
  {
    key: "difficult-customers",
    name: "Difficult Customers",
    colorToken: "lav",
    objectKey: "cloud",
    description: "Stay calm, de-escalate and set boundaries.",
    levelTitles: ["Raised voice", "Rude remarks", "Long queue anger", "Bad review threat"],
  },
  {
    key: "problem-solving",
    name: "Problem Solving",
    colorToken: "lime",
    objectKey: "puzzle",
    description: "Find the root cause, offer options, follow through.",
    levelTitles: ["Repeated issue", "Outside policy", "Missing information", "System outage"],
  },
];

// ---------- Guided scenarios ----------

export interface ChoiceDef {
  readonly id: string;
  readonly text: string;
  readonly rating: Rating;
  readonly points: number;
  readonly feedback: string;
  readonly nextStepId: string | null;
}

export interface StepDef {
  readonly id: string;
  readonly customerMessage: string;
  readonly choices: readonly ChoiceDef[];
}

export interface ScenarioDef {
  readonly id: string;
  readonly title: string;
  readonly categoryKey: CategoryKey;
  readonly level: 1 | 2 | 3 | 4;
  readonly difficulty: Difficulty;
  readonly xpReward: number;
  readonly situation: string;
  readonly customer: ScenarioCustomer;
  readonly steps: readonly StepDef[];
}

export const LATE_DELIVERY: ScenarioDef = {
  id: "sc-late-delivery",
  title: "Late delivery",
  categoryKey: "handling-complaints",
  level: 1,
  difficulty: "beginner",
  xpReward: 40,
  situation:
    "Rhea ordered a birthday gift five days ago. It was promised for yesterday and has not arrived. She opens the support chat, upset.",
  customer: { name: "Rhea Kapoor", avatarKey: "customer-rhea" },
  steps: [
    {
      id: "s1",
      customerMessage:
        "My order was supposed to arrive yesterday! It's my sister's birthday today. What kind of service is this?",
      choices: [
        {
          id: "c1",
          text: "I'm really sorry, Rhea. I can hear how important today is. Let me check exactly where your parcel is right now and see how we can get it to you today.",
          rating: "best",
          points: 10,
          feedback:
            "Best. You acknowledged the feeling, apologised, and moved straight to action with a clear next step.",
          nextStepId: null,
        },
        {
          id: "c2",
          text: "Sorry for the delay. Deliveries sometimes run late. It should reach you within 2 to 3 days.",
          rating: "okay",
          points: 5,
          feedback:
            "Okay. You apologised, but ignored that the gift is needed today and promised a vague, longer wait.",
          nextStepId: null,
        },
        {
          id: "c3",
          text: "Delays happen because of the courier, not us. You can track the order on our website.",
          rating: "poor",
          points: 0,
          feedback:
            "Poor. Blaming someone else and pointing to a website leaves the customer alone with the problem.",
          nextStepId: null,
        },
        {
          id: "c4",
          text: "Please calm down. I will need your order number before I can say anything.",
          rating: "poor",
          points: 0,
          feedback:
            "Poor. Telling an upset customer to calm down sounds dismissive. Ask for the order number kindly, after empathy.",
          nextStepId: null,
        },
      ],
    },
  ],
};

export const DOUBLE_CHARGE: ScenarioDef = {
  id: "sc-double-charge",
  title: "Double charge",
  categoryKey: "handling-complaints",
  level: 3,
  difficulty: "intermediate",
  xpReward: 60,
  situation:
    "Mr. Deshmukh was charged twice for one order. He is calm but firm, and wants to know his money is safe.",
  customer: { name: "Anil Deshmukh", avatarKey: "customer-anil" },
  steps: [
    {
      id: "s1",
      customerMessage: "I was charged twice for the same order on my card! I want my money back right now.",
      choices: [
        {
          id: "c1",
          text: "I'm sorry about the double charge, Mr. Deshmukh. Could you share the order ID? I'll check both payments while we are on chat.",
          rating: "best",
          points: 10,
          feedback: "Best. Apology, a precise ask, and a promise to act now, all in two sentences.",
          nextStepId: "s2",
        },
        {
          id: "c2",
          text: "Sorry. Double charges usually reverse by themselves in 5 to 7 days, so please wait.",
          rating: "okay",
          points: 5,
          feedback: "Okay. It may be true, but it passes the work to the customer without checking anything.",
          nextStepId: "s2",
        },
        {
          id: "c3",
          text: "Are you sure you didn't place two orders?",
          rating: "poor",
          points: 0,
          feedback: "Poor. It sounds like you doubt him. Verify the facts yourself before asking.",
          nextStepId: "s2",
        },
      ],
    },
    {
      id: "s2",
      customerMessage: "Fine. But how long will it take to get the money back, and what are you doing about it?",
      choices: [
        {
          id: "c1",
          text: "I've raised a refund for the duplicate charge, reference RF-20931. It reaches your account in 3 to 5 working days, and I'll message you tomorrow to confirm.",
          rating: "best",
          points: 10,
          feedback: "Best. Action taken, a reference number, a realistic timeline and a follow-up promise.",
          nextStepId: null,
        },
        {
          id: "c2",
          text: "The refund will take 3 to 5 days.",
          rating: "okay",
          points: 5,
          feedback: "Okay. The timeline is right, but he does not hear what you did or what happens next.",
          nextStepId: null,
        },
        {
          id: "c3",
          text: "I can't say. It depends on your bank.",
          rating: "poor",
          points: 0,
          feedback: "Poor. It gives no commitment, no reference and no ownership.",
          nextStepId: null,
        },
      ],
    },
  ],
};

// ---------- Boss personas ----------

export interface BossPersonaDef {
  readonly id: string;
  readonly categoryKey: CategoryKey;
  readonly name: string;
  readonly problem: string;
  readonly avatarKey: string;
  readonly startMood: number;
  readonly opening: string;
  /** Customer replies by mood tier; two each, cycled by turn. */
  readonly replies: { readonly low: readonly string[]; readonly mid: readonly string[]; readonly high: readonly string[] };
  readonly won: string;
  readonly lost: string;
  readonly quickReplies: readonly string[];
  readonly betterReply: string;
}

export const BOSS_PERSONAS: readonly BossPersonaDef[] = [
  {
    id: "boss-sharma",
    categoryKey: "handling-complaints",
    name: "Mr. Sharma",
    problem: "Third call about a Rs. 2,499 refund for a blender that arrived broken.",
    avatarKey: "customer-sharma",
    startMood: 25,
    opening:
      "This is my THIRD call about the refund for the broken blender. Every time someone promises something and nothing happens. I want my money back today.",
    replies: {
      low: [
        "That is what the last person said too. I have heard all this before, so what exactly will you do?",
        "I don't want excuses. Nobody has taken responsibility for this so far.",
      ],
      mid: [
        "Hmm. Okay, that sounds a bit different from the last calls. When exactly will the refund show up?",
        "Alright, I'm listening. But I need a name and a reference number this time.",
      ],
      high: [
        "Thank you, that is the first clear answer I have had. I appreciate you taking this on yourself.",
        "Okay, that works for me. I'm glad someone finally explained what happens next.",
      ],
    },
    won: "Alright. A reference number and a follow-up call, that is all I wanted. Thank you for your help today.",
    lost: "I'm done with this. I'm disputing the payment with my bank. Goodbye.",
    quickReplies: [
      "I'm sorry, Mr. Sharma. I'll personally take this on.",
      "Let me check your refund status right now.",
      "I will raise it today and call you back by 5 pm.",
    ],
    betterReply:
      "Mr. Sharma, I'm sorry this has taken three calls. I'll own this now: I'm raising your Rs. 2,499 refund today, and here is the reference number. I'll call you back by 5 pm to confirm.",
  },
  {
    id: "boss-fernandes",
    categoryKey: "customer-queries",
    name: "Mrs. Fernandes",
    problem: "Confused about whether her washing machine warranty covers a motor fault.",
    avatarKey: "customer-fernandes",
    startMood: 45,
    opening:
      "Hello? I've read the warranty booklet three times and I still can't tell if the motor is covered. Can someone just tell me clearly?",
    replies: {
      low: [
        "That doesn't answer my question. Is the motor covered, yes or no?",
        "You're using too many technical words. I just need a straight answer.",
      ],
      mid: [
        "Okay, that is a little clearer. And what do I have to do to claim it?",
        "I see. Is there a cost to me if the engineer visits?",
      ],
      high: [
        "That makes sense now, thank you for explaining it so simply.",
        "Perfect, I know exactly what to do next. You've been very helpful.",
      ],
    },
    won: "Wonderful, I'll book the engineer visit today. Thank you for being so clear.",
    lost: "I'm sorry, this is still confusing. I'll ask at the shop instead.",
    quickReplies: [
      "Yes, the motor is covered for 5 years.",
      "Let me explain in simple steps.",
      "Could you share your purchase date?",
    ],
    betterReply:
      "Yes, Mrs. Fernandes, the motor is covered for 5 years from purchase. To claim, share your invoice and I'll book a free engineer visit. Would tomorrow morning work?",
  },
  {
    id: "boss-khanna",
    categoryKey: "difficult-customers",
    name: "Mr. Khanna",
    problem: "Angry about a long queue and threatening a one-star review.",
    avatarKey: "customer-khanna",
    startMood: 20,
    opening:
      "I have been waiting 40 minutes! Is this how you treat customers? I'm going to post a one-star review everywhere.",
    replies: {
      low: [
        "Don't give me scripts. I want to speak to someone who actually cares.",
        "Forty minutes of my time is gone. Sorry doesn't bring it back.",
      ],
      mid: [
        "Hmm. At least you are listening. What can you do for me now?",
        "Okay, but this must not happen again. What will you change?",
      ],
      high: [
        "Fine, I appreciate that you stayed calm with me. I may hold that review.",
        "Thank you. That is a reasonable offer, and I'm sorry I raised my voice.",
      ],
    },
    won: "Alright, I'll hold off on the review. Thank you for handling this so patiently.",
    lost: "That's it. The review is going up tonight. Goodbye.",
    quickReplies: [
      "You're right to be upset. Forty minutes is too long.",
      "I'd like to fix this for you right now.",
      "I'm sorry. Here is what I can offer.",
    ],
    betterReply:
      "Mr. Khanna, you're right, 40 minutes is too long and I'm sorry. I'll handle your request myself right now, and I'll also report the queue problem to my manager today.",
  },
  {
    id: "boss-banerjee",
    categoryKey: "problem-solving",
    name: "Ms. Banerjee",
    problem: "The app keeps logging her out. This is the fourth time she is reporting it.",
    avatarKey: "customer-banerjee",
    startMood: 35,
    opening:
      "The app logs me out every ten minutes. This is my fourth report and every time I'm told to reinstall it. It did not work.",
    replies: {
      low: [
        "Reinstalling again? That is exactly what the others said. Please find the real cause.",
        "I'm tired of repeating myself. Has anyone even looked at my account?",
      ],
      mid: [
        "Okay, that is a new idea. What would you need from me to test it?",
        "That sounds reasonable. And if that fails, what is the next option?",
      ],
      high: [
        "Good, you found something nobody checked before. Thank you for digging into it.",
        "That is a proper plan with a backup. I feel much better about this.",
      ],
    },
    won: "Great, I'll try the fix tonight and wait for your update tomorrow. Thank you for sticking with this.",
    lost: "Nothing has changed. I'll switch to a competitor's app. Goodbye.",
    quickReplies: [
      "Let me look at your account's login history.",
      "I'll find the root cause instead of repeating the same fix.",
      "Here are two options, and I'll follow up tomorrow.",
    ],
    betterReply:
      "Ms. Banerjee, I'm sorry about the repeat reports. I've checked your login history and see sessions expiring early. I'll escalate this to our engineers today, and message you tomorrow with a fix or a workaround.",
  },
];

// ---------- Habit templates ----------

const ALL_DAYS = [1, 2, 3, 4, 5, 6, 7] as const;

export const HABIT_TEMPLATES: readonly HabitTemplate[] = [
  { key: "punctuality", title: "Punctuality", icon: "clock", description: "Start every shift on time.", frequency: "daily", daysOfWeek: ALL_DAYS },
  { key: "communication", title: "Effective Communication", icon: "bubble", description: "Practise one clear, kind message a day.", frequency: "daily", daysOfWeek: ALL_DAYS },
  { key: "task-completion", title: "Task Completion", icon: "check", description: "Finish your top task before the day ends.", frequency: "daily", daysOfWeek: ALL_DAYS },
  { key: "teamwork", title: "Teamwork", icon: "handshake", description: "Help a teammate or share a tip.", frequency: "weekly", daysOfWeek: [2, 4] },
  { key: "follow-up", title: "Customer Follow-up", icon: "phone", description: "Follow up on one open customer case.", frequency: "weekly", daysOfWeek: [1, 3, 5] },
  { key: "daily-learning", title: "Daily Learning", icon: "book", description: "Spend 10 minutes learning something new.", frequency: "daily", daysOfWeek: ALL_DAYS },
];

// ---------- Badges ----------

export interface BadgeDef {
  readonly key: string;
  readonly name: string;
  readonly description: string;
  readonly objectKey: string;
}

export const BADGE_DEFS: readonly BadgeDef[] = [
  { key: "first-steps", name: "First Steps", description: "Finish your first scenario.", objectKey: "medal" },
  { key: "seven-day-streak", name: "7-Day Streak", description: "Check in on a habit 7 days in a row.", objectKey: "flame" },
  { key: "perfect-score", name: "Perfect Score", description: "Earn 3 stars on a scenario.", objectKey: "trophy" },
  { key: "complaint-crusher", name: "Complaint Crusher", description: "Clear 4 levels of Handling Complaints.", objectKey: "megaphone" },
  { key: "team-player", name: "Team Player", description: "Join a team and climb its leaderboard.", objectKey: "heart" },
  { key: "boss-slayer", name: "Boss Slayer", description: "Win a live call against a boss customer.", objectKey: "crown" },
];

// ---------- Leaderboard people ----------

export interface PersonDef {
  readonly id: string;
  readonly name: string;
  readonly avatarKey: string;
  readonly teamName: string;
  readonly xp: number;
  readonly weeklyXp: number;
  readonly rankChange: number;
}

export const ME_TEAM = "Support Team A";

export const PEOPLE: readonly PersonDef[] = [
  { id: "u-priya", name: "Priya Nair", avatarKey: "avatar-1", teamName: ME_TEAM, xp: 2860, weeklyXp: 320, rankChange: 1 },
  { id: "u-rohan", name: "Rohan Gupta", avatarKey: "avatar-2", teamName: ME_TEAM, xp: 1710, weeklyXp: 190, rankChange: -1 },
  { id: "u-ananya", name: "Ananya Iyer", avatarKey: "avatar-4", teamName: ME_TEAM, xp: 1120, weeklyXp: 150, rankChange: 2 },
  { id: "u-vikram", name: "Vikram Singh", avatarKey: "avatar-5", teamName: ME_TEAM, xp: 640, weeklyXp: 60, rankChange: 0 },
  { id: "u-meera", name: "Meera Reddy", avatarKey: "avatar-6", teamName: ME_TEAM, xp: 430, weeklyXp: 95, rankChange: 1 },
  { id: "u-karan", name: "Karan Malhotra", avatarKey: "avatar-2", teamName: "Support Team B", xp: 3320, weeklyXp: 410, rankChange: 0 },
  { id: "u-sneha", name: "Sneha Kulkarni", avatarKey: "avatar-1", teamName: "Support Team B", xp: 2410, weeklyXp: 260, rankChange: 2 },
  { id: "u-arjun", name: "Arjun Patel", avatarKey: "avatar-5", teamName: "Support Team B", xp: 1340, weeklyXp: 120, rankChange: -2 },
  { id: "u-divya", name: "Divya Menon", avatarKey: "avatar-4", teamName: "Escalations", xp: 2980, weeklyXp: 350, rankChange: 1 },
  { id: "u-imran", name: "Imran Sheikh", avatarKey: "avatar-3", teamName: "Escalations", xp: 1980, weeklyXp: 210, rankChange: -1 },
  { id: "u-neha", name: "Neha Joshi", avatarKey: "avatar-6", teamName: "Escalations", xp: 910, weeklyXp: 40, rankChange: -3 },
  { id: "u-siddharth", name: "Siddharth Rao", avatarKey: "avatar-3", teamName: "Onboarding", xp: 1560, weeklyXp: 175, rankChange: 3 },
  { id: "u-pooja", name: "Pooja Bansal", avatarKey: "avatar-1", teamName: "Onboarding", xp: 780, weeklyXp: 85, rankChange: 0 },
  { id: "u-rahul", name: "Rahul Verma", avatarKey: "avatar-2", teamName: "Onboarding", xp: 520, weeklyXp: 30, rankChange: -1 },
  { id: "u-kavya", name: "Kavya Pillai", avatarKey: "avatar-6", teamName: "Onboarding", xp: 260, weeklyXp: 70, rankChange: 2 },
];
