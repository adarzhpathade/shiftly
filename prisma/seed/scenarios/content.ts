import type {
  CategoryKey,
  Difficulty,
  Rating,
  ScenarioCustomer,
} from "../../../src/lib/types";

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

export interface BossPersonaDef {
  readonly id: string;
  readonly categoryKey: CategoryKey;
  readonly name: string;
  readonly problem: string;
  readonly avatarKey: string;
  readonly startMood: number;
  readonly hiddenGoal: string;
  readonly systemPrompt: string;
  readonly xpReward: number;
  readonly opening: string;
  readonly replies: {
    readonly low: readonly string[];
    readonly mid: readonly string[];
    readonly high: readonly string[];
  };
  readonly won: string;
  readonly lost: string;
  readonly quickReplies: readonly string[];
  readonly betterReply: string;
}

// ==========================================
// GUIDED SCENARIOS (16 total: 4 per category)
// ==========================================

export const GUIDED_SCENARIOS: readonly ScenarioDef[] = [
  // ----------------------------------------------------
  // Handling Complaints (4 scenarios)
  // ----------------------------------------------------
  {
    id: "sc-hc-1",
    title: "The [delayed] birthday parcel",
    categoryKey: "handling-complaints",
    level: 1,
    difficulty: "beginner",
    xpReward: 40,
    situation:
      "Rhea ordered a smartwatch five days ago for her brother's birthday today. The delivery was promised yesterday, but the tracking still shows 'In Transit' at a hub across town. She contacts live chat in distress.",
    customer: { name: "Rhea Kapoor", avatarKey: "customer-rhea" },
    steps: [
      {
        id: "sc-hc-1-s1",
        customerMessage:
          "My order was supposed to arrive yesterday! It is my brother's birthday today and I have nothing to give him. Where is my parcel?",
        choices: [
          {
            id: "sc-hc-1-s1-c1",
            text: "I am really sorry about the delay, Rhea. I understand how stressful this is on your brother's birthday. Let me check the exact hub location right now and arrange a priority delivery dispatch today.",
            rating: "best",
            points: 10,
            feedback:
              "Best. Sincere empathy, clear ownership of the birthday urgency, and an immediate actionable next step.",
            nextStepId: null,
          },
          {
            id: "sc-hc-1-s1-c2",
            text: "We apologize for the inconvenience caused. Deliveries can take up to 48 additional hours during peak rush, so please wait until tomorrow evening.",
            rating: "okay",
            points: 5,
            feedback:
              "Okay. You apologized, but ignored her urgent birthday deadline and offered only a passive waiting window.",
            nextStepId: null,
          },
          {
            id: "sc-hc-1-s1-c3",
            text: "Delivery timelines depend on third-party couriers, not our support team. You should check the courier tracking link yourself.",
            rating: "poor",
            points: 0,
            feedback:
              "Poor. Deflecting blame onto the courier leaves the customer feeling abandoned and dismisses her problem.",
            nextStepId: null,
          },
        ],
      },
    ],
  },
  {
    id: "sc-hc-2",
    title: "The [wrong] grocery basket",
    categoryKey: "handling-complaints",
    level: 2,
    difficulty: "beginner",
    xpReward: 40,
    situation:
      "Kabir placed an express grocery order for his family's dinner party tonight. Upon unboxing, he finds non-vegetarian frozen items instead of the paneer and vegetables he ordered. He calls the support hotline immediately.",
    customer: { name: "Kabir Mehta", avatarKey: "avatar-2" },
    steps: [
      {
        id: "sc-hc-2-s1",
        customerMessage:
          "I ordered paneer and fresh vegetables for our vegetarian family dinner tonight, and you sent me frozen chicken! Guests are arriving in an hour. How could you make such a careless mistake?",
        choices: [
          {
            id: "sc-hc-2-s1-c1",
            text: "I am truly sorry for this mix-up, Kabir. I understand how distressing this is with guests arriving shortly. I am immediately dispatching an express replacement of your vegetables and paneer at no extra charge, arriving in 25 minutes.",
            rating: "best",
            points: 10,
            feedback:
              "Best. You respected the dietary sensitivity, apologized sincerely, and took immediate high-priority corrective action.",
            nextStepId: null,
          },
          {
            id: "sc-hc-2-s1-c2",
            text: "Sorry for the error. Please raise a return request in the app with photos of the wrong items, and we will initiate a refund within 3 days.",
            rating: "okay",
            points: 5,
            feedback:
              "Okay. While following refund protocol, putting the photo and app burden on an urgent dinner host shows poor empathy.",
            nextStepId: null,
          },
          {
            id: "sc-hc-2-s1-c3",
            text: "Our pickers scan barcodes before packing, so this rarely happens. Are you sure you did not mistakenly select the wrong cart?",
            rating: "poor",
            points: 0,
            feedback:
              "Poor. Questioning the customer's honesty and defending the warehouse process damages trust instantly.",
            nextStepId: null,
          },
        ],
      },
    ],
  },
  {
    id: "sc-hc-3",
    title: "The [double] debit deduction",
    categoryKey: "handling-complaints",
    level: 3,
    difficulty: "intermediate",
    xpReward: 60,
    situation:
      "Anil tried paying his electricity bill of Rs. 3,450 via the mobile banking portal. The transaction errored on the first attempt, so he tried again, but his account statement shows two debit deductions. He reaches out via priority chat.",
    customer: { name: "Anil Deshmukh", avatarKey: "customer-anil" },
    steps: [
      {
        id: "sc-hc-3-s1",
        customerMessage:
          "Your app crashed during my electricity bill payment and debited Rs. 3,450 twice from my savings account! That is nearly Rs. 7,000 gone from my account. I need this reversed immediately.",
        choices: [
          {
            id: "sc-hc-3-s1-c1",
            text: "I am truly sorry for the distress this caused, Mr. Deshmukh. I can see how concerning an unexpected duplicate debit is. Let me pull up your transaction logs right now to verify both reference numbers.",
            rating: "best",
            points: 10,
            feedback:
              "Best. You acknowledged the financial stress with calm professionalism and immediately began investigating.",
            nextStepId: "sc-hc-3-s2",
          },
          {
            id: "sc-hc-3-s1-c2",
            text: "Please do not worry. Failed duplicate transactions usually auto-reverse within 5 to 7 banking days depending on clearing house rules.",
            rating: "okay",
            points: 5,
            feedback:
              "Okay. Informing him about auto-reversals is accurate, but dismisses his immediate anxiety without checking his account.",
            nextStepId: "sc-hc-3-s2",
          },
          {
            id: "sc-hc-3-s1-c3",
            text: "You must have pressed the 'Pay Now' button twice while the payment gateway was processing.",
            rating: "poor",
            points: 0,
            feedback:
              "Poor. Blaming the user's action for a gateway crash creates unnecessary conflict.",
            nextStepId: "sc-hc-3-s2",
          },
        ],
      },
      {
        id: "sc-hc-3-s2",
        customerMessage:
          "I checked with my power utility and they only received one payment. Where is my remaining Rs. 3,450, and when will it be back in my bank?",
        choices: [
          {
            id: "sc-hc-3-s2-c1",
            text: "I have confirmed the second charge failed settlement and initiated an immediate manual reversal, reference REV-48201. The amount will reflect in your account within 24 hours, and I have emailed you the receipt.",
            rating: "best",
            points: 10,
            feedback:
              "Best. Direct ownership, a concrete reference ID, a realistic timeline, and clear confirmation.",
            nextStepId: null,
          },
          {
            id: "sc-hc-3-s2-c2",
            text: "I have flagged this for the finance team. They will review it sometime this week and process whatever is pending.",
            rating: "okay",
            points: 5,
            feedback:
              "Okay. You forwarded the issue internally, but gave a vague timeline without a reference number.",
            nextStepId: null,
          },
          {
            id: "sc-hc-3-s2-c3",
            text: "Once money leaves our gateway, settlement is between your bank and the utility company. You need to dispute it with them.",
            rating: "poor",
            points: 0,
            feedback:
              "Poor. Abandoning the customer and deflecting your banking app's responsibility is unacceptable.",
            nextStepId: null,
          },
        ],
      },
    ],
  },
  {
    id: "sc-hc-4",
    title: "The [damaged] wedding gift",
    categoryKey: "handling-complaints",
    level: 4,
    difficulty: "intermediate",
    xpReward: 60,
    situation:
      "Sunita ordered an expensive bone china dinner set worth Rs. 6,200 for a close friend's wedding reception tomorrow. Upon delivery, the outer carton was crushed and several plates were broken into shards. She visits the customer service desk in tears.",
    customer: { name: "Sunita Verma", avatarKey: "avatar-4" },
    steps: [
      {
        id: "sc-hc-4-s1",
        customerMessage:
          "Look at this box! The delivery person literally dropped it at my door, and half the dinner set is in pieces. The wedding reception is tomorrow afternoon! What am I supposed to gift them now?",
        choices: [
          {
            id: "sc-hc-4-s1-c1",
            text: "Sunita, I am so sorry to see this. A wedding gift is deeply personal, and seeing it broken before the event is heartbreaking. Let me inspect the store inventory right now so we can replace the set before tomorrow.",
            rating: "best",
            points: 10,
            feedback:
              "Best. Genuine emotional resonance, respectful tone, and an immediate focus on solving the tomorrow deadline.",
            nextStepId: "sc-hc-4-s2",
          },
          {
            id: "sc-hc-4-s1-c2",
            text: "I apologize for the broken merchandise. I can log a replacement request in our system, which takes 3 business days for warehouse verification.",
            rating: "okay",
            points: 5,
            feedback:
              "Okay. Standard procedure was offered, but it fails to address the urgency of tomorrow's reception.",
            nextStepId: "sc-hc-4-s2",
          },
          {
            id: "sc-hc-4-s1-c3",
            text: "Please calm down and don't cry. We have a return policy for transit damages, but you will need to submit a damage claim form online.",
            rating: "poor",
            points: 0,
            feedback:
              "Poor. Telling a visibly distressed customer not to cry and handing off paperwork is insensitive and dismissive.",
            nextStepId: "sc-hc-4-s2",
          },
        ],
      },
      {
        id: "sc-hc-4-s2",
        customerMessage:
          "The nearest retail store is 15 kilometers away and I don't have a car. Can you ensure a fresh set reaches me by tomorrow 11 AM?",
        choices: [
          {
            id: "sc-hc-4-s2-c1",
            text: "Yes. I have locked a brand-new dinner set from our Indiranagar outlet and booked a dedicated store courier to hand-deliver it to your home tomorrow by 10:30 AM, gift-wrapped. Here is dispatch reference DL-9941.",
            rating: "best",
            points: 10,
            feedback:
              "Best. Outstanding ownership: solving the transport barrier, exceeding the deadline, and offering thoughtful gift-wrapping.",
            nextStepId: null,
          },
          {
            id: "sc-hc-4-s2-c2",
            text: "I have arranged for the store to hold a box under your name. If you can book a cab or send someone, they can collect it anytime before 8 PM.",
            rating: "okay",
            points: 5,
            feedback:
              "Okay. You reserved the item, but shifted the logistical burden and cost back onto the customer.",
            nextStepId: null,
          },
          {
            id: "sc-hc-4-s2-c3",
            text: "Our courier partners do not do custom morning slots. You will just have to wait for the standard delivery van whenever it arrives.",
            rating: "poor",
            points: 0,
            feedback:
              "Poor. Rigid adherence to logistics policies without attempting escalation turns a crisis into a failure.",
            nextStepId: null,
          },
        ],
      },
    ],
  },

  // ----------------------------------------------------
  // Customer Queries (4 scenarios)
  // ----------------------------------------------------
  {
    id: "sc-cq-1",
    title: "The [compatible] phone charger",
    categoryKey: "customer-queries",
    level: 1,
    difficulty: "beginner",
    xpReward: 40,
    situation:
      "Rajesh bought a mid-range smartphone and wants to know if his older 45W Type-C laptop charger will safely charge the phone without degrading the battery. He messages the product query chat.",
    customer: { name: "Rajesh Iyer", avatarKey: "avatar-3" },
    steps: [
      {
        id: "sc-cq-1-s1",
        customerMessage:
          "Hi, I just bought the Stellar 5G phone. Can I charge it using my 45W Type-C laptop adapter, or will that damage the phone battery?",
        choices: [
          {
            id: "sc-cq-1-s1-c1",
            text: "Yes, Rajesh! Your phone supports USB Power Delivery, so it will safely draw only its maximum supported 25W from your 45W laptop adapter without harming battery health.",
            rating: "best",
            points: 10,
            feedback:
              "Best. Clear, reassuring, and explains the technical reason simply without confusing jargon.",
            nextStepId: null,
          },
          {
            id: "sc-cq-1-s1-c2",
            text: "It should probably work since both use Type-C, but we generally recommend using only the original charger from the box.",
            rating: "okay",
            points: 5,
            feedback:
              "Okay. Vague answer that creates doubt rather than answering whether 45W adapters are safe.",
            nextStepId: null,
          },
          {
            id: "sc-cq-1-s1-c3",
            text: "Using third-party or high-wattage chargers immediately voids your warranty if the battery swells.",
            rating: "poor",
            points: 0,
            feedback:
              "Poor. Inaccurate and intimidating, creating needless anxiety about standard USB-PD charging.",
            nextStepId: null,
          },
        ],
      },
    ],
  },
  {
    id: "sc-cq-2",
    title: "The [overdue] order status",
    categoryKey: "customer-queries",
    level: 2,
    difficulty: "beginner",
    xpReward: 40,
    situation:
      "Meera ordered prescription eyeglasses 8 days ago. The delivery estimate was 5 to 7 days, but she hasn't received any SMS update since the lens cutting stage. She calls customer service.",
    customer: { name: "Meera Sen", avatarKey: "avatar-6" },
    steps: [
      {
        id: "sc-cq-2-s1",
        customerMessage:
          "I placed order OP-4412 for prescription glasses over a week ago. The status still says 'quality check'. Could you please tell me when they will actually ship?",
        choices: [
          {
            id: "sc-cq-2-s1-c1",
            text: "Hello Meera. I've checked order OP-4412: your high-index lenses passed final coating inspection this morning and are packed for courier pickup at 4 PM today. You will receive an SMS tracking link tonight, and delivery is on track for Thursday.",
            rating: "best",
            points: 10,
            feedback:
              "Best. Specific details, precise timeline, proactive explanation of what to expect next.",
            nextStepId: null,
          },
          {
            id: "sc-cq-2-s1-c2",
            text: "Order OP-4412 is currently in our optical lab. Prescription glasses take some extra time to prepare, so please keep tracking the app.",
            rating: "okay",
            points: 5,
            feedback:
              "Okay. Polite, but repeats what the app already told her without providing new information or an updated date.",
            nextStepId: null,
          },
          {
            id: "sc-cq-2-s1-c3",
            text: "Custom eyeglasses take 10 to 14 working days. You called before the maximum window elapsed, so please wait.",
            rating: "poor",
            points: 0,
            feedback:
              "Poor. Curt and patronizing, implying the customer was wrong to call when her delivery estimate passed.",
            nextStepId: null,
          },
        ],
      },
    ],
  },
  {
    id: "sc-cq-3",
    title: "The [airfare] refund policy",
    categoryKey: "customer-queries",
    level: 3,
    difficulty: "intermediate",
    xpReward: 60,
    situation:
      "Arvind had to cancel a family flight booking from Chennai to Delhi due to his mother's sudden hospitalization. He wants to know how the cancellation penalty and medical waiver work on his ticket.",
    customer: { name: "Arvind Swamy", avatarKey: "avatar-5" },
    steps: [
      {
        id: "sc-cq-3-s1",
        customerMessage:
          "My mother was admitted to the hospital yesterday, so we cannot travel to Delhi this weekend. If I cancel our tickets (PNR: KD89Z), how much cancellation fee will be deducted?",
        choices: [
          {
            id: "sc-cq-3-s1-c1",
            text: "I am so sorry to hear about your mother's hospitalization, Arvind. For medical emergencies, our partner airline waives standard cancellation fees when medical admission proof is provided. Let me guide you through the zero-penalty cancellation process.",
            rating: "best",
            points: 10,
            feedback:
              "Best. Warm empathy for family sickness, coupled with proactive knowledge of the medical fee waiver.",
            nextStepId: "sc-cq-3-s2",
          },
          {
            id: "sc-cq-3-s1-c2",
            text: "Standard cancellation is Rs. 3,000 per passenger plus a platform fee of Rs. 400. You can cancel from the bookings tab on our website.",
            rating: "okay",
            points: 5,
            feedback:
              "Okay. Factually correct for standard cancellations, but ignored the medical context and the waiver option.",
            nextStepId: "sc-cq-3-s2",
          },
          {
            id: "sc-cq-3-s1-c3",
            text: "Flight tickets are strictly non-refundable within 48 hours of departure, as stated in the terms and conditions.",
            rating: "poor",
            points: 0,
            feedback:
              "Poor. Heartless, inaccurate, and shuts down an anxious customer facing a family medical emergency.",
            nextStepId: "sc-cq-3-s2",
          },
        ],
      },
      {
        id: "sc-cq-3-s2",
        customerMessage:
          "What documents do I need to send for the medical waiver, and how soon will the refund reach my original payment card?",
        choices: [
          {
            id: "sc-cq-3-s2-c1",
            text: "Please email a signed hospital admission slip or doctor certificate to medical@support.com with PNR KD89Z. Once uploaded, we approve the full refund within 4 hours, and funds credit to your card in 3 to 5 business days.",
            rating: "best",
            points: 10,
            feedback:
              "Best. Crystal clear document instructions, transparent approval timeline, and accurate banking settlement expectation.",
            nextStepId: null,
          },
          {
            id: "sc-cq-3-s2-c2",
            text: "Just send all hospital bills to our helpdesk. The refund takes anywhere from 7 to 21 banking days.",
            rating: "okay",
            points: 5,
            feedback:
              "Okay. Unclear on required documents and quotes an excessively wide timeline.",
            nextStepId: null,
          },
          {
            id: "sc-cq-3-s2-c3",
            text: "The airline's medical board takes several weeks to scrutinize fraudulent claims, so don't expect quick approval.",
            rating: "poor",
            points: 0,
            feedback:
              "Poor. Insinuating fraud and discouraging legitimate claims is unprofessional and offensive.",
            nextStepId: null,
          },
        ],
      },
    ],
  },
  {
    id: "sc-cq-4",
    title: "The [extended] warranty coverage",
    categoryKey: "customer-queries",
    level: 4,
    difficulty: "intermediate",
    xpReward: 60,
    situation:
      "Farida purchased an inverter and battery set 18 months ago. The inverter display is malfunctioning and she is trying to understand if her extended warranty covers on-site labor and PCB board replacement.",
    customer: { name: "Farida Sheikh", avatarKey: "avatar-1" },
    steps: [
      {
        id: "sc-cq-4-s1",
        customerMessage:
          "My home inverter display is blinking error code E-04 and the backup isn't charging. I have the Shiftly Gold Extended Care plan. Does that cover the circuit board replacement and the technician visit?",
        choices: [
          {
            id: "sc-cq-4-s1-c1",
            text: "Hello Farida. Yes, your Shiftly Gold Extended Care plan fully covers internal electronic components including the main PCB board, as well as zero-cost doorstep technician visits. There are no out-of-pocket charges for this repair.",
            rating: "best",
            points: 10,
            feedback:
              "Best. Direct, definitive, and relieves financial worry about parts and technician visit fees.",
            nextStepId: "sc-cq-4-s2",
          },
          {
            id: "sc-cq-4-s1-c2",
            text: "Extended care generally covers manufacturing defects, but consumables might have a deductible. You'll need to check policy section 4B.",
            rating: "okay",
            points: 5,
            feedback:
              "Okay. Mentions policy terms, but dumps the reading burden back on the customer rather than verifying her plan.",
            nextStepId: "sc-cq-4-s2",
          },
          {
            id: "sc-cq-4-s1-c3",
            text: "Inverter displays usually fail because of household power surges. Surge damages are never covered under any warranty.",
            rating: "poor",
            points: 0,
            feedback:
              "Poor. Diagnosing and rejecting a warranty claim over chat without a technician inspection is improper.",
            nextStepId: "sc-cq-4-s2",
          },
        ],
      },
      {
        id: "sc-cq-4-s2",
        customerMessage:
          "That is such a relief! How do I schedule the technician, and can they come tomorrow since we have frequent evening power cuts?",
        choices: [
          {
            id: "sc-cq-4-s2-c1",
            text: "I have booked an authorized technician visit for tomorrow between 10 AM and 1 PM at your registered address, ticket SVC-7731. The technician, Ramesh, will call you 30 minutes prior to arrival.",
            rating: "best",
            points: 10,
            feedback:
              "Best. Immediate booking, clear time window, service ticket number, and technician contact protocol.",
            nextStepId: null,
          },
          {
            id: "sc-cq-4-s2-c2",
            text: "You can book a slot on our mobile app under the maintenance tab whenever slots open up.",
            rating: "okay",
            points: 5,
            feedback:
              "Okay. Points to self-service, but fails to complete the booking when she is already connected to an agent.",
            nextStepId: null,
          },
          {
            id: "sc-cq-4-s2-c3",
            text: "Technician visits require a 72-hour notice period. Demanding tomorrow morning is impossible during festive season.",
            rating: "poor",
            points: 0,
            feedback:
              "Poor. Aggressive tone, framing customer needs as 'demands', and displaying zero willingness to help.",
            nextStepId: null,
          },
        ],
      },
    ],
  },

  // ----------------------------------------------------
  // Difficult Customers (4 scenarios)
  // ----------------------------------------------------
  {
    id: "sc-dc-1",
    title: "A [raised] voice on the line",
    categoryKey: "difficult-customers",
    level: 1,
    difficulty: "beginner",
    xpReward: 40,
    situation:
      "Gaurav is shouting into his phone at the broadband support desk because his home fibre internet dropped in the middle of an important overseas client presentation.",
    customer: { name: "Gaurav Kapoor", avatarKey: "avatar-5" },
    steps: [
      {
        id: "sc-dc-1-s1",
        customerMessage:
          "I AM LOSING A FIFTY THOUSAND DOLLAR CLIENT RIGHT NOW! YOUR USELESS INTERNET CUT OUT MID-CALL! DO YOU PEOPLE EVEN CARE ABOUT CUSTOMERS?!",
        choices: [
          {
            id: "sc-dc-1-s1-c1",
            text: "I hear how critical this meeting is, Gaurav, and I am completely focused on getting you back online. Let me run an immediate line reset on your router right now to restore connectivity.",
            rating: "best",
            points: 10,
            feedback:
              "Best. Maintained composure, validated urgency without matching the yelling, and moved instantly to technical action.",
            nextStepId: null,
          },
          {
            id: "sc-dc-1-s1-c2",
            text: "I apologize for the outage. Network fluctuations happen occasionally. Could you restart your router while I check the server?",
            rating: "okay",
            points: 5,
            feedback:
              "Okay. Polite and helpful, but minimizes his high-stakes situation as 'network fluctuations happen'.",
            nextStepId: null,
          },
          {
            id: "sc-dc-1-s1-c3",
            text: "Please stop shouting at me, sir. I cannot understand you when you raise your voice.",
            rating: "poor",
            points: 0,
            feedback:
              "Poor. Reprimanding an angry customer inflames hostility; de-escalate with calm authority instead.",
            nextStepId: null,
          },
        ],
      },
    ],
  },
  {
    id: "sc-dc-2",
    title: "Handling [rude] remarks",
    categoryKey: "difficult-customers",
    level: 2,
    difficulty: "beginner",
    xpReward: 40,
    situation:
      "Pooja enters the electronics customer care outlet to replace a malfunctioning tablet. Frustrated by a previous agent, she makes a condescending personal remark to the agent behind the counter.",
    customer: { name: "Pooja Bansal", avatarKey: "avatar-4" },
    steps: [
      {
        id: "sc-dc-2-s1",
        customerMessage:
          "Are you people hired off the street? Your colleague earlier looked clueless, and I bet you don't know how to test a simple motherboard either.",
        choices: [
          {
            id: "sc-dc-2-s1-c1",
            text: "I understand you had a frustrating experience earlier, Pooja. I am a senior diagnostic technician, and I am here to personally test your tablet and resolve this for you today. Let's look at the device together.",
            rating: "best",
            points: 10,
            feedback:
              "Best. Set a calm, professional boundary without taking bait, while reassuring her of your competence.",
            nextStepId: null,
          },
          {
            id: "sc-dc-2-s1-c2",
            text: "If you are going to insult our staff, I will refuse to assist you. Please talk to us with respect.",
            rating: "okay",
            points: 5,
            feedback:
              "Okay. While setting boundaries is valid, issuing immediate refusal threats escalates confrontation.",
            nextStepId: null,
          },
          {
            id: "sc-dc-2-s1-c3",
            text: "You don't need to be so rude. We have degrees and certifications, unlike what you assume.",
            rating: "poor",
            points: 0,
            feedback:
              "Poor. Taking personal offense and arguing about credentials distracts from solving the customer's issue.",
            nextStepId: null,
          },
        ],
      },
    ],
  },
  {
    id: "sc-dc-3",
    title: "The [long] queue anger",
    categoryKey: "difficult-customers",
    level: 3,
    difficulty: "intermediate",
    xpReward: 60,
    situation:
      "Vikram has been waiting in a 45-minute queue at a telecom service centre during lunch hour to replace a lost SIM card. He slams his token on the desk.",
    customer: { name: "Vikram Malhotra", avatarKey: "avatar-2" },
    steps: [
      {
        id: "sc-dc-3-s1",
        customerMessage:
          "I have been standing on my feet in this sweltering room for forty-five minutes on my lunch break! You have five counters and only two people working! This is pathetic service!",
        choices: [
          {
            id: "sc-dc-3-s1-c1",
            text: "You are completely right, Vikram, forty-five minutes is far too long to wait on your lunch break, and I am genuinely sorry. Please take a seat. I will process your SIM replacement immediately so you can get back to your day.",
            rating: "best",
            points: 10,
            feedback:
              "Best. Directly agreed that the wait was unreasonable, offered physical comfort, and prioritized speed.",
            nextStepId: "sc-dc-3-s2",
          },
          {
            id: "sc-dc-3-s1-c2",
            text: "Sorry for the wait, sir. What is the mobile number and Aadhaar card you want to update?",
            rating: "okay",
            points: 5,
            feedback:
              "Okay. Quick move to task, but brushed past his legitimate physical frustration without proper validation.",
            nextStepId: "sc-dc-3-s2",
          },
          {
            id: "sc-dc-3-s1-c3",
            text: "We are short-staffed because two colleagues are on emergency medical leave. Everyone else in line is waiting patiently too.",
            rating: "poor",
            points: 0,
            feedback:
              "Poor. Comparing him unfavorably to other customers and making company excuses always intensifies anger.",
            nextStepId: "sc-dc-3-s2",
          },
        ],
      },
      {
        id: "sc-dc-3-s2",
        customerMessage:
          "I left my Aadhaar card in my office desk! I only have my driving license and soft-copy Aadhaar PDF on DigiLocker. Don't tell me I wasted 45 minutes for nothing!",
        choices: [
          {
            id: "sc-dc-3-s2-c1",
            text: "You haven't wasted your time, Vikram. As per telecom guidelines, verified DigiLocker documents are 100% valid for instant e-KYC. Let me scan the QR code from your phone and your new SIM will be active within 2 hours.",
            rating: "best",
            points: 10,
            feedback:
              "Best. Instant reassurance, regulatory compliance knowledge, and a fast solution that saves his trip.",
            nextStepId: null,
          },
          {
            id: "sc-dc-3-s2-c2",
            text: "DigiLocker might work if our scanner connects today. Let me try, but if it fails you'll need the physical card.",
            rating: "okay",
            points: 5,
            feedback:
              "Okay. Willing to try, but introduces unnecessary uncertainty and doubt.",
            nextStepId: null,
          },
          {
            id: "sc-dc-3-s2-c3",
            text: "Government rules strictly mandate the original physical Aadhaar card. You will have to go get it and stand in line again.",
            rating: "poor",
            points: 0,
            feedback:
              "Poor. Factually incorrect regarding DigiLocker, rigid, and guaranteed to provoke an explosive reaction.",
            nextStepId: null,
          },
        ],
      },
    ],
  },
  {
    id: "sc-dc-4",
    title: "The [bad] review threat",
    categoryKey: "difficult-customers",
    level: 4,
    difficulty: "intermediate",
    xpReward: 60,
    situation:
      "Deepak runs an independent apparel boutique. A courier delivery for his festive collection arrived with torn packaging, and he is threatening a viral social media campaign and 1-star ratings across all app stores.",
    customer: { name: "Deepak Chawla", avatarKey: "avatar-3" },
    steps: [
      {
        id: "sc-dc-4-s1",
        customerMessage:
          "I have 80,000 followers on Instagram and Twitter. If my damaged stock isn't compensated right now, I am posting photos of your shredded packages and tagging consumer forums. Your app rating will plummet!",
        choices: [
          {
            id: "sc-dc-4-s1-c1",
            text: "Deepak, I understand your business reputation is on the line and why you are furious about damaged stock before the festive season. You don't need social media to get our attention—I am opening an expedited merchant escalation right now to settle this.",
            rating: "best",
            points: 10,
            feedback:
              "Best. Addressed the underlying fear (business impact), defused the social media threat without cowing or arguing, and owned the issue.",
            nextStepId: "sc-dc-4-s2",
          },
          {
            id: "sc-dc-4-s1-c2",
            text: "Please don't post anything online. Let me see what credit coupon or partial compensation policy allows.",
            rating: "okay",
            points: 5,
            feedback:
              "Okay. Tries to de-escalate, but sounds fearful and offers an inadequate coupon for serious stock damage.",
            nextStepId: "sc-dc-4-s2",
          },
          {
            id: "sc-dc-4-s1-c3",
            text: "Threatening us with social media will not speed up standard claims. Our legal team reviews defamation posts very seriously.",
            rating: "poor",
            points: 0,
            feedback:
              "Poor. Responding to customer threats with legal threats guarantees a public PR disaster.",
            nextStepId: "sc-dc-4-s2",
          },
        ],
      },
      {
        id: "sc-dc-4-s2",
        customerMessage:
          "Fine, but I am not waiting 14 business days for a standard insurance adjuster. I have vendor payments due on Friday!",
        choices: [
          {
            id: "sc-dc-4-s2-c1",
            text: "Under our Merchant Fast-Track policy for verified commercial accounts, I have authorized an immediate provisional reimbursement of Rs. 14,500, crediting by tomorrow 2 PM. Reference: M-FAST-902. Does this help you cover Friday's payments?",
            rating: "best",
            points: 10,
            feedback:
              "Best. Solved his actual cash flow constraint, gave exact amount and time, and closed with collaborative respect.",
            nextStepId: null,
          },
          {
            id: "sc-dc-4-s2-c2",
            text: "I can submit an urgency request to the claims team, but whether they pay before Friday is entirely up to their queue.",
            rating: "okay",
            points: 5,
            feedback:
              "Okay. Helpful attempt, but passes responsibility to an anonymous department with no guarantee.",
            nextStepId: null,
          },
          {
            id: "sc-dc-4-s2-c3",
            text: "Our commercial terms clearly state 14 days for insurance inspection. Vendor deadlines are your business responsibility.",
            rating: "poor",
            points: 0,
            feedback:
              "Poor. Cold, bureaucratic, and destroys any hope of salvaging the commercial relationship.",
            nextStepId: null,
          },
        ],
      },
    ],
  },

  // ----------------------------------------------------
  // Problem Solving (4 scenarios)
  // ----------------------------------------------------
  {
    id: "sc-ps-1",
    title: "A [repeated] WiFi drop",
    categoryKey: "problem-solving",
    level: 1,
    difficulty: "beginner",
    xpReward: 40,
    situation:
      "Tanvi has contacted internet support three times this week because her connection disconnects precisely at 2:00 PM every afternoon. The previous agents only told her to restart the router.",
    customer: { name: "Tanvi Rao", avatarKey: "avatar-1" },
    steps: [
      {
        id: "sc-ps-1-s1",
        customerMessage:
          "This is my fourth time calling about my WiFi dropping every single day at 2 PM. Stop telling me to reboot the router! It works for twenty minutes and drops again. Find the real problem!",
        choices: [
          {
            id: "sc-ps-1-s1-c1",
            text: "I hear your frustration, Tanvi, and you are right—rebooting is just a temporary patch. Since this happens at the exact same hour daily, let me check our hub channel interference logs and lease renewal cycles right now.",
            rating: "best",
            points: 10,
            feedback:
              "Best. Validated that repeat reboots failed, noted the time-specific pattern, and initiated genuine root cause analysis.",
            nextStepId: null,
          },
          {
            id: "sc-ps-1-s1-c2",
            text: "Let's try doing a hard factory reset by holding the pinhole behind your router for 15 seconds.",
            rating: "okay",
            points: 5,
            feedback:
              "Okay. A factory reset is a deeper step than a reboot, but still ignores the daily 2 PM pattern.",
            nextStepId: null,
          },
          {
            id: "sc-ps-1-s1-c3",
            text: "Daily drops at specific hours are usually caused by heavy usage inside your house. You should disconnect extra devices.",
            rating: "poor",
            points: 0,
            feedback:
              "Poor. Makes unfounded assumptions that blame the customer without looking at system telemetry.",
            nextStepId: null,
          },
        ],
      },
    ],
  },
  {
    id: "sc-ps-2",
    title: "An [outside] policy request",
    categoryKey: "problem-solving",
    level: 2,
    difficulty: "beginner",
    xpReward: 40,
    situation:
      "Manoj booked a non-refundable bus ticket from Bengaluru to Hyderabad. His company unexpectedly rescheduled his training to next week, and he is asking for a date change 6 hours before departure, which is outside standard policy.",
    customer: { name: "Manoj Kulkarni", avatarKey: "avatar-3" },
    steps: [
      {
        id: "sc-ps-2-s1",
        customerMessage:
          "I know my ticket was non-refundable, but my employer suddenly shifted my client training dates. Can you please reschedule my bus journey to next Tuesday? I don't want my money back, just a date shift.",
        choices: [
          {
            id: "sc-ps-2-s1-c1",
            text: "I understand how sudden employer schedule changes disrupt plans, Manoj. While the operator's ticket is non-refundable, let me connect with the bus fleet dispatcher to request a one-time date transfer waiver with a minimal rebooking fee.",
            rating: "best",
            points: 10,
            feedback:
              "Best. Acknowledged the rigid rule with empathy while exploring a creative, practical compromise.",
            nextStepId: null,
          },
          {
            id: "sc-ps-2-s1-c2",
            text: "I can cancel this ticket for zero refund and give you a 10% discount promo code for your booking next Tuesday.",
            rating: "okay",
            points: 5,
            feedback:
              "Okay. Offered an alternative, but writing off his entire fare when an operator waiver might be possible is premature.",
            nextStepId: null,
          },
          {
            id: "sc-ps-2-s1-c3",
            text: "The terms say non-changeable and non-refundable within 12 hours of departure. The system does not allow date edits.",
            rating: "poor",
            points: 0,
            feedback:
              "Poor. Robotic refusal that hides behind the software without attempting to explore exceptions.",
            nextStepId: null,
          },
        ],
      },
    ],
  },
  {
    id: "sc-ps-3",
    title: "The [missing] transaction details",
    categoryKey: "problem-solving",
    level: 3,
    difficulty: "intermediate",
    xpReward: 60,
    situation:
      "Shalini transferred Rs. 12,000 via IMPS from her corporate account to an overseas vendor's Indian subsidiary, but the recipient hasn't received it after 48 hours. She does not have the 12-digit UTR reference handy.",
    customer: { name: "Shalini Nair", avatarKey: "avatar-6" },
    steps: [
      {
        id: "sc-ps-3-s1",
        customerMessage:
          "My vendor in Mumbai says they haven't received the Rs. 12,000 payment I sent two days ago! My finance colleague who made the transfer is traveling and I don't have the UTR slip. How can you find this transfer?",
        choices: [
          {
            id: "sc-ps-3-s1-c1",
            text: "Don't worry, Shalini, we can trace it without the UTR. If you can share your registered account number, the beneficiary IFSC, and the approximate timestamp, I can locate the unique transaction ID in our central clearing logs.",
            rating: "best",
            points: 10,
            feedback:
              "Best. Reassured her immediately and gave a clear, accessible list of alternative identifiers to locate the record.",
            nextStepId: "sc-ps-3-s2",
          },
          {
            id: "sc-ps-3-s1-c2",
            text: "Tell me your account number and I'll scroll through the last 50 transactions to see if anything looks like Rs. 12,000.",
            rating: "okay",
            points: 5,
            feedback:
              "Okay. Willing to help, but sounds informal and inefficient rather than systematic.",
            nextStepId: "sc-ps-3-s2",
          },
          {
            id: "sc-ps-3-s1-c3",
            text: "Without the 12-digit UTR number, it is impossible for our banking system to trace an inter-bank IMPS transfer. You must wait for your colleague.",
            rating: "poor",
            points: 0,
            feedback:
              "Poor. Incorrect and dismissive; customer support has multiple lookup parameters besides the UTR.",
            nextStepId: "sc-ps-3-s2",
          },
        ],
      },
      {
        id: "sc-ps-3-s2",
        customerMessage:
          "I found the IFSC code HDFC0001234 and the exact debit of Rs. 12,000 was on Tuesday at 11:15 AM from account ending in 8831.",
        choices: [
          {
            id: "sc-ps-3-s2-c1",
            text: "Found it! UTR is 429188192014. The transaction was held in the clearing switch due to an IFSC branch merger. I have cleared the hold with the settlement desk; the funds will reflect in the vendor's account in 45 minutes, and I've SMSed you the proof.",
            rating: "best",
            points: 10,
            feedback:
              "Best. Discovered the root cause (branch merger hold), resolved it immediately, and provided full proof.",
            nextStepId: null,
          },
          {
            id: "sc-ps-3-s2-c2",
            text: "The UTR is 429188192014. It shows 'pending'. You can share this UTR with your vendor's bank to ask why they haven't credited it.",
            rating: "okay",
            points: 5,
            feedback:
              "Okay. Retrieved the UTR, but handed the investigation off to the vendor's bank instead of fixing the internal hold.",
            nextStepId: null,
          },
          {
            id: "sc-ps-3-s2-c3",
            text: "The transaction is stuck. It will either credit or bounce back within seven working days.",
            rating: "poor",
            points: 0,
            feedback:
              "Poor. Zero troubleshooting effort or ownership, leaving an urgent commercial invoice hanging.",
            nextStepId: null,
          },
        ],
      },
    ],
  },
  {
    id: "sc-ps-4",
    title: "A [critical] gateway outage",
    categoryKey: "problem-solving",
    level: 4,
    difficulty: "intermediate",
    xpReward: 60,
    situation:
      "Karthik is the operations manager for a regional hospital chain. During a major cloud payment gateway outage, patients at discharge counters cannot pay via cards or QR codes, creating long queues and angry relatives.",
    customer: { name: "Karthik Subramanian", avatarKey: "avatar-5" },
    steps: [
      {
        id: "sc-ps-4-s1",
        customerMessage:
          "Our hospital discharge desks across three branches are completely blocked! Your payment API is throwing 502 Bad Gateway errors for the past 20 minutes. Discharged patients and families are stuck! What is your incident team doing?!",
        choices: [
          {
            id: "sc-ps-4-s1-c1",
            text: "Karthik, we are actively managing this as a P1 Priority incident. Our primary gateway cluster experienced a failover delay, and engineering is rerouting traffic through our secondary backup switch right now. Let me guide you on enabling offline emergency terminal mode immediately.",
            rating: "best",
            points: 10,
            feedback:
              "Best. Transparent crisis communication, clear technical explanation, and an immediate operational workaround for patients.",
            nextStepId: "sc-ps-4-s2",
          },
          {
            id: "sc-ps-4-s1-c2",
            text: "Our server team has posted a status update on our incident page. The ETA for restoration is approximately 45 minutes.",
            rating: "okay",
            points: 5,
            feedback:
              "Okay. Provides an honest ETA, but offers no contingency help for families waiting at hospital counters.",
            nextStepId: "sc-ps-4-s2",
          },
          {
            id: "sc-ps-4-s1-c3",
            text: "We are aware of a slight server degradation. Our technical team is working on it, please have patients wait.",
            rating: "poor",
            points: 0,
            feedback:
              "Poor. Downplaying a hospital discharge halt as 'slight degradation' displays severe lack of situational awareness.",
            nextStepId: "sc-ps-4-s2",
          },
        ],
      },
      {
        id: "sc-ps-4-s2",
        customerMessage:
          "How does offline emergency mode work, and will those transactions settle safely once the cloud gateway is restored?",
        choices: [
          {
            id: "sc-ps-4-s2-c1",
            text: "Toggle 'Store & Forward' under Terminal Settings: card authorizations will store locally encrypted and print instant receipts so patients can be discharged immediately. Once gateway sync completes at 12:30 PM, all batches auto-settle with guaranteed zero duplicate charges.",
            rating: "best",
            points: 10,
            feedback:
              "Best. Crisp tactical steps, reassurance on data encryption and financial safety, allowing patients to leave safely.",
            nextStepId: null,
          },
          {
            id: "sc-ps-4-s2-c2",
            text: "You can take manual cash payments or ask patients to write cheques for now until our cloud comes back up.",
            rating: "okay",
            points: 5,
            feedback:
              "Okay. Practical fallback, but ignores terminal capabilities and creates administrative chaos for the hospital.",
            nextStepId: null,
          },
          {
            id: "sc-ps-4-s2-c3",
            text: "If you swipe cards offline, any failed authorizations later will be at your hospital's financial risk.",
            rating: "poor",
            points: 0,
            feedback:
              "Poor. Unnecessarily alarming during an emergency without explaining standard encrypted store-and-forward protection.",
            nextStepId: null,
          },
        ],
      },
    ],
  },
];

// ==========================================
// BOSS PERSONAS (4 total: 1 per category)
// ==========================================

export const BOSS_PERSONAS: readonly BossPersonaDef[] = [
  {
    id: "boss-hc",
    categoryKey: "handling-complaints",
    name: "Mr. Sharma",
    problem:
      "Third call about a Rs. 2,499 refund for a mixer grinder that arrived with a shattered jar two weeks ago.",
    avatarKey: "customer-sharma",
    startMood: 25,
    hiddenGoal:
      "The agent takes personal ownership, raises the refund immediately with a reference number, and commits to a specific callback today.",
    systemPrompt:
      "You are Mr. Sharma, 52, a retired bank clerk living in Pune. You value precision, accountability, and prompt action. You ordered a mixer grinder for Rs. 2,499 that arrived with a shattered jar two weeks ago. You returned it, but your refund has not been credited. This is your third time calling customer support. Previous agents gave vague reassurances like 'within 5-7 days' and nothing happened. You speak politely but sternly, referencing dates and amounts. You get irritated by robotic scripts, false sympathy, and being passed around. You calm down only when an agent genuinely takes personal ownership, explains the concrete action they are taking right now, and gives you a reference number and a firm callback time.",
    xpReward: 150,
    opening:
      "This is my THIRD call about the refund for my broken mixer grinder. Every time someone promises something and nothing happens. I want my Rs. 2,499 back today.",
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
      "Mr. Sharma, I'm sorry this has taken three calls. I'll own this now: I'm raising your Rs. 2,499 refund today, and here is reference RF-2499. I'll call you back by 5 pm to confirm.",
  },
  {
    id: "boss-cq",
    categoryKey: "customer-queries",
    name: "Mrs. Fernandes",
    problem:
      "Confused about whether her front-load washing machine warranty covers motor replacement after a breakdown.",
    avatarKey: "customer-fernandes",
    startMood: 40,
    hiddenGoal:
      "The agent explains warranty coverage in simple, jargon-free steps and books an engineer inspection without requiring complex forms.",
    systemPrompt:
      "You are Mrs. Fernandes, 64, a retired schoolteacher living in Bandra, Mumbai. You are gentle, patient, but easily overwhelmed by complex technical or legal jargon. Your front-load washing machine made a loud grinding noise and stopped spinning yesterday. You tried reading the 30-page warranty booklet three times, but terms like 'limited component coverage' and 'depreciated labor clause' confuse you. You want a straight, kind, and simple answer: is the motor covered, and what do you need to do? You get flustered and anxious if agents use acronyms, speak too fast, or cite policy clauses without explaining them. You become relieved and grateful when an agent explains things in plain language, gives step-by-step guidance, and offers to arrange the engineer visit.",
    xpReward: 150,
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
    id: "boss-dc",
    categoryKey: "difficult-customers",
    name: "Mr. Khanna",
    problem:
      "Furious after waiting 40 minutes at a retail pickup counter and threatening a viral one-star review.",
    avatarKey: "customer-khanna",
    startMood: 20,
    hiddenGoal:
      "The agent validates his wasted time without defensive excuses, prioritizes his order immediately, and commits to reporting the queue failure.",
    systemPrompt:
      "You are Mr. Khanna, 45, an impatient textile exporter from Karol Bagh, Delhi. You run on a tight schedule and have zero tolerance for inefficiency. You came to the flagship store counter to pick up an urgent corporate gift package, but were made to wait in an unmanaged queue for over 40 minutes while staff chatted. You are angry, talking loudly, and threatening to post a 1-star review and a video of the counter on LinkedIn and Twitter. You despise dismissive platitudes, defensive excuses like 'we are short-staffed today', or anyone telling you to 'please calm down'. You only de-escalate if the agent validates your wasted time without being defensive, immediately expedites your order, and takes direct personal responsibility.",
    xpReward: 150,
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
    id: "boss-ps",
    categoryKey: "problem-solving",
    name: "Ms. Banerjee",
    problem:
      "Bakery owner whose weekly recurring ingredient order fails repeatedly at checkout with an authorization sync error.",
    avatarKey: "customer-banerjee",
    startMood: 35,
    hiddenGoal:
      "The agent diagnoses the technical error logs instead of repeating generic advice, manually ships ingredients for tomorrow, and files a priority bug.",
    systemPrompt:
      "You are Ms. Banerjee, 38, founder of an artisanal bakery in Kolkata. Your business depends on weekly automated ingredient orders of dairy and organic flour. For the third week in a row, the recurring subscription order failed at 4:00 AM with error code 'ERR-AUTH-SYNC', leaving you scrambling for morning prep. You already cleared your cache, updated the app, and re-added your corporate card as previous agents suggested, but it failed again. You are stressed about letting down your morning bakery customers. You get irritated when support staff offer basic troubleshooting steps you have already tried. You calm down when an agent investigates the specific error logs, acknowledges the subscription webhook failure, arranges an immediate manual shipment so your kitchen can open tomorrow, and files a priority engineering bug.",
    xpReward: 150,
    opening:
      "The app failed my recurring bakery ingredient order for the third week in a row. Every time I'm told to reinstall the app. It did not work and my kitchen opens at 6 AM.",
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
      "Ms. Banerjee, I'm sorry about the repeat reports. I've checked your account logs and see the subscription webhook failing. I'll manually dispatch your ingredients today and escalate this to engineering.",
  },
];
