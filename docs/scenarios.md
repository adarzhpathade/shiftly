# Shiftly Training Scenarios and AI Boss Personas

This document provides a complete reference of the 16 guided training scenarios and 4 AI boss customer personas available in Shiftly.

---

## 1. Handling Complaints

### Level 1: The [delayed] birthday parcel (sc-hc-1)
- **Difficulty**: Beginner
- **XP Reward**: 40 XP
- **Customer**: Rhea Kapoor (`customer-rhea`)
- **Situation**: Rhea ordered a smartwatch five days ago for her brother's birthday today. The delivery was promised yesterday, but the tracking still shows 'In Transit' at a hub across town. She contacts live chat in distress.

#### Step 1 (sc-hc-1-s1)
**Customer**: "My order was supposed to arrive yesterday! It is my brother's birthday today and I have nothing to give him. Where is my parcel?"

- **Choice 1 (sc-hc-1-s1-c1)** [Rating: best | Points: 10 | Next Step: End]
  - "I am really sorry about the delay, Rhea. I understand how stressful this is on your brother's birthday. Let me check the exact hub location right now and arrange a priority delivery dispatch today."
  - *Feedback*: Best. Sincere empathy, clear ownership of the birthday urgency, and an immediate actionable next step.
- **Choice 2 (sc-hc-1-s1-c2)** [Rating: okay | Points: 5 | Next Step: End]
  - "We apologize for the inconvenience caused. Deliveries can take up to 48 additional hours during peak rush, so please wait until tomorrow evening."
  - *Feedback*: Okay. You apologized, but ignored her urgent birthday deadline and offered only a passive waiting window.
- **Choice 3 (sc-hc-1-s1-c3)** [Rating: poor | Points: 0 | Next Step: End]
  - "Delivery timelines depend on third-party couriers, not our support team. You should check the courier tracking link yourself."
  - *Feedback*: Poor. Deflecting blame onto the courier leaves the customer feeling abandoned and dismisses her problem.

---

### Level 2: The [wrong] grocery basket (sc-hc-2)
- **Difficulty**: Beginner
- **XP Reward**: 40 XP
- **Customer**: Kabir Mehta (`avatar-2`)
- **Situation**: Kabir placed an express grocery order for his family's dinner party tonight. Upon unboxing, he finds non-vegetarian frozen items instead of the paneer and vegetables he ordered. He calls the support hotline immediately.

#### Step 1 (sc-hc-2-s1)
**Customer**: "I ordered paneer and fresh vegetables for our vegetarian family dinner tonight, and you sent me frozen chicken! Guests are arriving in an hour. How could you make such a careless mistake?"

- **Choice 1 (sc-hc-2-s1-c1)** [Rating: best | Points: 10 | Next Step: End]
  - "I am truly sorry for this mix-up, Kabir. I understand how distressing this is with guests arriving shortly. I am immediately dispatching an express replacement of your vegetables and paneer at no extra charge, arriving in 25 minutes."
  - *Feedback*: Best. You respected the dietary sensitivity, apologized sincerely, and took immediate high-priority corrective action.
- **Choice 2 (sc-hc-2-s1-c2)** [Rating: okay | Points: 5 | Next Step: End]
  - "Sorry for the error. Please raise a return request in the app with photos of the wrong items, and we will initiate a refund within 3 days."
  - *Feedback*: Okay. While following refund protocol, putting the photo and app burden on an urgent dinner host shows poor empathy.
- **Choice 3 (sc-hc-2-s1-c3)** [Rating: poor | Points: 0 | Next Step: End]
  - "Our pickers scan barcodes before packing, so this rarely happens. Are you sure you did not mistakenly select the wrong cart?"
  - *Feedback*: Poor. Questioning the customer's honesty and defending the warehouse process damages trust instantly.

---

### Level 3: The [double] debit deduction (sc-hc-3)
- **Difficulty**: Intermediate
- **XP Reward**: 60 XP
- **Customer**: Anil Deshmukh (`customer-anil`)
- **Situation**: Anil tried paying his electricity bill of Rs. 3,450 via the mobile banking portal. The transaction errored on the first attempt, so he tried again, but his account statement shows two debit deductions. He reaches out via priority chat.

#### Step 1 (sc-hc-3-s1)
**Customer**: "Your app crashed during my electricity bill payment and debited Rs. 3,450 twice from my savings account! That is nearly Rs. 7,000 gone from my account. I need this reversed immediately."

- **Choice 1 (sc-hc-3-s1-c1)** [Rating: best | Points: 10 | Next Step: sc-hc-3-s2]
  - "I am truly sorry for the distress this caused, Mr. Deshmukh. I can see how concerning an unexpected duplicate debit is. Let me pull up your transaction logs right now to verify both reference numbers."
  - *Feedback*: Best. You acknowledged the financial stress with calm professionalism and immediately began investigating.
- **Choice 2 (sc-hc-3-s1-c2)** [Rating: okay | Points: 5 | Next Step: sc-hc-3-s2]
  - "Please do not worry. Failed duplicate transactions usually auto-reverse within 5 to 7 banking days depending on clearing house rules."
  - *Feedback*: Okay. Informing him about auto-reversals is accurate, but dismisses his immediate anxiety without checking his account.
- **Choice 3 (sc-hc-3-s1-c3)** [Rating: poor | Points: 0 | Next Step: sc-hc-3-s2]
  - "You must have pressed the 'Pay Now' button twice while the payment gateway was processing."
  - *Feedback*: Poor. Blaming the user's action for a gateway crash creates unnecessary conflict.

#### Step 2 (sc-hc-3-s2)
**Customer**: "I checked with my power utility and they only received one payment. Where is my remaining Rs. 3,450, and when will it be back in my bank?"

- **Choice 1 (sc-hc-3-s2-c1)** [Rating: best | Points: 10 | Next Step: End]
  - "I have confirmed the second charge failed settlement and initiated an immediate manual reversal, reference REV-48201. The amount will reflect in your account within 24 hours, and I have emailed you the receipt."
  - *Feedback*: Best. Direct ownership, a concrete reference ID, a realistic timeline, and clear confirmation.
- **Choice 2 (sc-hc-3-s2-c2)** [Rating: okay | Points: 5 | Next Step: End]
  - "I have flagged this for the finance team. They will review it sometime this week and process whatever is pending."
  - *Feedback*: Okay. You forwarded the issue internally, but gave a vague timeline without a reference number.
- **Choice 3 (sc-hc-3-s2-c3)** [Rating: poor | Points: 0 | Next Step: End]
  - "Once money leaves our gateway, settlement is between your bank and the utility company. You need to dispute it with them."
  - *Feedback*: Poor. Abandoning the customer and deflecting your banking app's responsibility is unacceptable.

---

### Level 4: The [damaged] wedding gift (sc-hc-4)
- **Difficulty**: Intermediate
- **XP Reward**: 60 XP
- **Customer**: Sunita Verma (`avatar-4`)
- **Situation**: Sunita ordered an expensive bone china dinner set worth Rs. 6,200 for a close friend's wedding reception tomorrow. Upon delivery, the outer carton was crushed and several plates were broken into shards. She visits the customer service desk in tears.

#### Step 1 (sc-hc-4-s1)
**Customer**: "Look at this box! The delivery person literally dropped it at my door, and half the dinner set is in pieces. The wedding reception is tomorrow afternoon! What am I supposed to gift them now?"

- **Choice 1 (sc-hc-4-s1-c1)** [Rating: best | Points: 10 | Next Step: sc-hc-4-s2]
  - "Sunita, I am so sorry to see this. A wedding gift is deeply personal, and seeing it broken before the event is heartbreaking. Let me inspect the store inventory right now so we can replace the set before tomorrow."
  - *Feedback*: Best. Genuine emotional resonance, respectful tone, and an immediate focus on solving the tomorrow deadline.
- **Choice 2 (sc-hc-4-s1-c2)** [Rating: okay | Points: 5 | Next Step: sc-hc-4-s2]
  - "I apologize for the broken merchandise. I can log a replacement request in our system, which takes 3 business days for warehouse verification."
  - *Feedback*: Okay. Standard procedure was offered, but it fails to address the urgency of tomorrow's reception.
- **Choice 3 (sc-hc-4-s1-c3)** [Rating: poor | Points: 0 | Next Step: sc-hc-4-s2]
  - "Please calm down and don't cry. We have a return policy for transit damages, but you will need to submit a damage claim form online."
  - *Feedback*: Poor. Telling a visibly distressed customer not to cry and handing off paperwork is insensitive and dismissive.

#### Step 2 (sc-hc-4-s2)
**Customer**: "The nearest retail store is 15 kilometers away and I don't have a car. Can you ensure a fresh set reaches me by tomorrow 11 AM?"

- **Choice 1 (sc-hc-4-s2-c1)** [Rating: best | Points: 10 | Next Step: End]
  - "Yes. I have locked a brand-new dinner set from our Indiranagar outlet and booked a dedicated store courier to hand-deliver it to your home tomorrow by 10:30 AM, gift-wrapped. Here is dispatch reference DL-9941."
  - *Feedback*: Best. Outstanding ownership: solving the transport barrier, exceeding the deadline, and offering thoughtful gift-wrapping.
- **Choice 2 (sc-hc-4-s2-c2)** [Rating: okay | Points: 5 | Next Step: End]
  - "I have arranged for the store to hold a box under your name. If you can book a cab or send someone, they can collect it anytime before 8 PM."
  - *Feedback*: Okay. You reserved the item, but shifted the logistical burden and cost back onto the customer.
- **Choice 3 (sc-hc-4-s2-c3)** [Rating: poor | Points: 0 | Next Step: End]
  - "Our courier partners do not do custom morning slots. You will just have to wait for the standard delivery van whenever it arrives."
  - *Feedback*: Poor. Rigid adherence to logistics policies without attempting escalation turns a crisis into a failure.

---

## 2. Customer Queries

### Level 1: The [compatible] phone charger (sc-cq-1)
- **Difficulty**: Beginner
- **XP Reward**: 40 XP
- **Customer**: Rajesh Iyer (`avatar-3`)
- **Situation**: Rajesh bought a mid-range smartphone and wants to know if his older 45W Type-C laptop charger will safely charge the phone without degrading the battery. He messages the product query chat.

#### Step 1 (sc-cq-1-s1)
**Customer**: "Hi, I just bought the Stellar 5G phone. Can I charge it using my 45W Type-C laptop adapter, or will that damage the phone battery?"

- **Choice 1 (sc-cq-1-s1-c1)** [Rating: best | Points: 10 | Next Step: End]
  - "Yes, Rajesh! Your phone supports USB Power Delivery, so it will safely draw only its maximum supported 25W from your 45W laptop adapter without harming battery health."
  - *Feedback*: Best. Clear, reassuring, and explains the technical reason simply without confusing jargon.
- **Choice 2 (sc-cq-1-s1-c2)** [Rating: okay | Points: 5 | Next Step: End]
  - "It should probably work since both use Type-C, but we generally recommend using only the original charger from the box."
  - *Feedback*: Okay. Vague answer that creates doubt rather than answering whether 45W adapters are safe.
- **Choice 3 (sc-cq-1-s1-c3)** [Rating: poor | Points: 0 | Next Step: End]
  - "Using third-party or high-wattage chargers immediately voids your warranty if the battery swells."
  - *Feedback*: Poor. Inaccurate and intimidating, creating needless anxiety about standard USB-PD charging.

---

### Level 2: The [overdue] order status (sc-cq-2)
- **Difficulty**: Beginner
- **XP Reward**: 40 XP
- **Customer**: Meera Sen (`avatar-6`)
- **Situation**: Meera ordered prescription eyeglasses 8 days ago. The delivery estimate was 5 to 7 days, but she hasn't received any SMS update since the lens cutting stage. She calls customer service.

#### Step 1 (sc-cq-2-s1)
**Customer**: "I placed order OP-4412 for prescription glasses over a week ago. The status still says 'quality check'. Could you please tell me when they will actually ship?"

- **Choice 1 (sc-cq-2-s1-c1)** [Rating: best | Points: 10 | Next Step: End]
  - "Hello Meera. I've checked order OP-4412: your high-index lenses passed final coating inspection this morning and are packed for courier pickup at 4 PM today. You will receive an SMS tracking link tonight, and delivery is on track for Thursday."
  - *Feedback*: Best. Specific details, precise timeline, proactive explanation of what to expect next.
- **Choice 2 (sc-cq-2-s1-c2)** [Rating: okay | Points: 5 | Next Step: End]
  - "Order OP-4412 is currently in our optical lab. Prescription glasses take some extra time to prepare, so please keep tracking the app."
  - *Feedback*: Okay. Polite, but repeats what the app already told her without providing new information or an updated date."
- **Choice 3 (sc-cq-2-s1-c3)** [Rating: poor | Points: 0 | Next Step: End]
  - "Custom eyeglasses take 10 to 14 working days. You called before the maximum window elapsed, so please wait."
  - *Feedback*: Poor. Curt and patronizing, implying the customer was wrong to call when her delivery estimate passed.

---

### Level 3: The [airfare] refund policy (sc-cq-3)
- **Difficulty**: Intermediate
- **XP Reward**: 60 XP
- **Customer**: Arvind Swamy (`avatar-5`)
- **Situation**: Arvind had to cancel a family flight booking from Chennai to Delhi due to his mother's sudden hospitalization. He wants to know how the cancellation penalty and medical waiver work on his ticket.

#### Step 1 (sc-cq-3-s1)
**Customer**: "My mother was admitted to the hospital yesterday, so we cannot travel to Delhi this weekend. If I cancel our tickets (PNR: KD89Z), how much cancellation fee will be deducted?"

- **Choice 1 (sc-cq-3-s1-c1)** [Rating: best | Points: 10 | Next Step: sc-cq-3-s2]
  - "I am so sorry to hear about your mother's hospitalization, Arvind. For medical emergencies, our partner airline waives standard cancellation fees when medical admission proof is provided. Let me guide you through the zero-penalty cancellation process."
  - *Feedback*: Best. Warm empathy for family sickness, coupled with proactive knowledge of the medical fee waiver.
- **Choice 2 (sc-cq-3-s1-c2)** [Rating: okay | Points: 5 | Next Step: sc-cq-3-s2]
  - "Standard cancellation is Rs. 3,000 per passenger plus a platform fee of Rs. 400. You can cancel from the bookings tab on our website."
  - *Feedback*: Okay. Factually correct for standard cancellations, but ignored the medical context and the waiver option.
- **Choice 3 (sc-cq-3-s1-c3)** [Rating: poor | Points: 0 | Next Step: sc-cq-3-s2]
  - "Flight tickets are strictly non-refundable within 48 hours of departure, as stated in the terms and conditions."
  - *Feedback*: Poor. Heartless, inaccurate, and shuts down an anxious customer facing a family medical emergency.

#### Step 2 (sc-cq-3-s2)
**Customer**: "What documents do I need to send for the medical waiver, and how soon will the refund reach my original payment card?"

- **Choice 1 (sc-cq-3-s2-c1)** [Rating: best | Points: 10 | Next Step: End]
  - "Please email a signed hospital admission slip or doctor certificate to medical@support.com with PNR KD89Z. Once uploaded, we approve the full refund within 4 hours, and funds credit to your card in 3 to 5 business days."
  - *Feedback*: Best. Crystal clear document instructions, transparent approval timeline, and accurate banking settlement expectation.
- **Choice 2 (sc-cq-3-s2-c2)** [Rating: okay | Points: 5 | Next Step: End]
  - "Just send all hospital bills to our helpdesk. The refund takes anywhere from 7 to 21 banking days."
  - *Feedback*: Okay. Unclear on required documents and quotes an excessively wide timeline.
- **Choice 3 (sc-cq-3-s2-c3)** [Rating: poor | Points: 0 | Next Step: End]
  - "The airline's medical board takes several weeks to scrutinize fraudulent claims, so don't expect quick approval."
  - *Feedback*: Poor. Insinuating fraud and discouraging legitimate claims is unprofessional and offensive.

---

### Level 4: The [extended] warranty coverage (sc-cq-4)
- **Difficulty**: Intermediate
- **XP Reward**: 60 XP
- **Customer**: Farida Sheikh (`avatar-1`)
- **Situation**: Farida purchased an inverter and battery set 18 months ago. The inverter display is malfunctioning and she is trying to understand if her extended warranty covers on-site labor and PCB board replacement.

#### Step 1 (sc-cq-4-s1)
**Customer**: "My home inverter display is blinking error code E-04 and the backup isn't charging. I have the Shiftly Gold Extended Care plan. Does that cover the circuit board replacement and the technician visit?"

- **Choice 1 (sc-cq-4-s1-c1)** [Rating: best | Points: 10 | Next Step: sc-cq-4-s2]
  - "Hello Farida. Yes, your Shiftly Gold Extended Care plan fully covers internal electronic components including the main PCB board, as well as zero-cost doorstep technician visits. There are no out-of-pocket charges for this repair."
  - *Feedback*: Best. Direct, definitive, and relieves financial worry about parts and technician visit fees.
- **Choice 2 (sc-cq-4-s1-c2)** [Rating: okay | Points: 5 | Next Step: sc-cq-4-s2]
  - "Extended care generally covers manufacturing defects, but consumables might have a deductible. You'll need to check policy section 4B."
  - *Feedback*: Okay. Mentions policy terms, but dumps the reading burden back on the customer rather than verifying her plan.
- **Choice 3 (sc-cq-4-s1-c3)** [Rating: poor | Points: 0 | Next Step: sc-cq-4-s2]
  - "Inverter displays usually fail because of household power surges. Surge damages are never covered under any warranty."
  - *Feedback*: Poor. Diagnosing and rejecting a warranty claim over chat without a technician inspection is improper.

#### Step 2 (sc-cq-4-s2)
**Customer**: "That is such a relief! How do I schedule the technician, and can they come tomorrow since we have frequent evening power cuts?"

- **Choice 1 (sc-cq-4-s2-c1)** [Rating: best | Points: 10 | Next Step: End]
  - "I have booked an authorized technician visit for tomorrow between 10 AM and 1 PM at your registered address, ticket SVC-7731. The technician, Ramesh, will call you 30 minutes prior to arrival."
  - *Feedback*: Best. Immediate booking, clear time window, service ticket number, and technician contact protocol.
- **Choice 2 (sc-cq-4-s2-c2)** [Rating: okay | Points: 5 | Next Step: End]
  - "You can book a slot on our mobile app under the maintenance tab whenever slots open up."
  - *Feedback*: Okay. Points to self-service, but fails to complete the booking when she is already connected to an agent.
- **Choice 3 (sc-cq-4-s2-c3)** [Rating: poor | Points: 0 | Next Step: End]
  - "Technician visits require a 72-hour notice period. Demanding tomorrow morning is impossible during festive season."
  - *Feedback*: Poor. Aggressive tone, framing customer needs as 'demands', and displaying zero willingness to help.

---

## 3. Difficult Customers

### Level 1: A [raised] voice on the line (sc-dc-1)
- **Difficulty**: Beginner
- **XP Reward**: 40 XP
- **Customer**: Gaurav Kapoor (`avatar-5`)
- **Situation**: Gaurav is shouting into his phone at the broadband support desk because his home fibre internet dropped in the middle of an important overseas client presentation.

#### Step 1 (sc-dc-1-s1)
**Customer**: "I AM LOSING A FIFTY THOUSAND DOLLAR CLIENT RIGHT NOW! YOUR USELESS INTERNET CUT OUT MID-CALL! DO YOU PEOPLE EVEN CARE ABOUT CUSTOMERS?!"

- **Choice 1 (sc-dc-1-s1-c1)** [Rating: best | Points: 10 | Next Step: End]
  - "I hear how critical this meeting is, Gaurav, and I am completely focused on getting you back online. Let me run an immediate line reset on your router right now to restore connectivity."
  - *Feedback*: Best. Maintained composure, validated urgency without matching the yelling, and moved instantly to technical action.
- **Choice 2 (sc-dc-1-s1-c2)** [Rating: okay | Points: 5 | Next Step: End]
  - "I apologize for the outage. Network fluctuations happen occasionally. Could you restart your router while I check the server?"
  - *Feedback*: Okay. Polite and helpful, but minimizes his high-stakes situation as 'network fluctuations happen'.
- **Choice 3 (sc-dc-1-s1-c3)** [Rating: poor | Points: 0 | Next Step: End]
  - "Please stop shouting at me, sir. I cannot understand you when you raise your voice."
  - *Feedback*: Poor. Reprimanding an angry customer inflames hostility; de-escalate with calm authority instead.

---

### Level 2: Handling [rude] remarks (sc-dc-2)
- **Difficulty**: Beginner
- **XP Reward**: 40 XP
- **Customer**: Pooja Bansal (`avatar-4`)
- **Situation**: Pooja enters the electronics customer care outlet to replace a malfunctioning tablet. Frustrated by a previous agent, she makes a condescending personal remark to the agent behind the counter.

#### Step 1 (sc-dc-2-s1)
**Customer**: "Are you people hired off the street? Your colleague earlier looked clueless, and I bet you don't know how to test a simple motherboard either."

- **Choice 1 (sc-dc-2-s1-c1)** [Rating: best | Points: 10 | Next Step: End]
  - "I understand you had a frustrating experience earlier, Pooja. I am a senior diagnostic technician, and I am here to personally test your tablet and resolve this for you today. Let's look at the device together."
  - *Feedback*: Best. Set a calm, professional boundary without taking bait, while reassuring her of your competence.
- **Choice 2 (sc-dc-2-s1-c2)** [Rating: okay | Points: 5 | Next Step: End]
  - "If you are going to insult our staff, I will refuse to assist you. Please talk to us with respect."
  - *Feedback*: Okay. While setting boundaries is valid, issuing immediate refusal threats escalates confrontation.
- **Choice 3 (sc-dc-2-s1-c3)** [Rating: poor | Points: 0 | Next Step: End]
  - "You don't need to be so rude. We have degrees and certifications, unlike what you assume."
  - *Feedback*: Poor. Taking personal offense and arguing about credentials distracts from solving the customer's issue.

---

### Level 3: The [long] queue anger (sc-dc-3)
- **Difficulty**: Intermediate
- **XP Reward**: 60 XP
- **Customer**: Vikram Malhotra (`avatar-2`)
- **Situation**: Vikram has been waiting in a 45-minute queue at a telecom service centre during lunch hour to replace a lost SIM card. He slams his token on the desk.

#### Step 1 (sc-dc-3-s1)
**Customer**: "I have been standing on my feet in this sweltering room for forty-five minutes on my lunch break! You have five counters and only two people working! This is pathetic service!"

- **Choice 1 (sc-dc-3-s1-c1)** [Rating: best | Points: 10 | Next Step: sc-dc-3-s2]
  - "You are completely right, Vikram, forty-five minutes is far too long to wait on your lunch break, and I am genuinely sorry. Please take a seat. I will process your SIM replacement immediately so you can get back to your day."
  - *Feedback*: Best. Directly agreed that the wait was unreasonable, offered physical comfort, and prioritized speed.
- **Choice 2 (sc-dc-3-s1-c2)** [Rating: okay | Points: 5 | Next Step: sc-dc-3-s2]
  - "Sorry for the wait, sir. What is the mobile number and Aadhaar card you want to update?"
  - *Feedback*: Okay. Quick move to task, but brushed past his legitimate physical frustration without proper validation.
- **Choice 3 (sc-dc-3-s1-c3)** [Rating: poor | Points: 0 | Next Step: sc-dc-3-s2]
  - "We are short-staffed because two colleagues are on emergency medical leave. Everyone else in line is waiting patiently too."
  - *Feedback*: Poor. Comparing him unfavorably to other customers and making company excuses always intensifies anger.

#### Step 2 (sc-dc-3-s2)
**Customer**: "I left my Aadhaar card in my office desk! I only have my driving license and soft-copy Aadhaar PDF on DigiLocker. Don't tell me I wasted 45 minutes for nothing!"

- **Choice 1 (sc-dc-3-s2-c1)** [Rating: best | Points: 10 | Next Step: End]
  - "You haven't wasted your time, Vikram. As per telecom guidelines, verified DigiLocker documents are 100% valid for instant e-KYC. Let me scan the QR code from your phone and your new SIM will be active within 2 hours."
  - *Feedback*: Best. Instant reassurance, regulatory compliance knowledge, and a fast solution that saves his trip.
- **Choice 2 (sc-dc-3-s2-c2)** [Rating: okay | Points: 5 | Next Step: End]
  - "DigiLocker might work if our scanner connects today. Let me try, but if it fails you'll need the physical card."
  - *Feedback*: Okay. Willing to try, but introduces unnecessary uncertainty and doubt.
- **Choice 3 (sc-dc-3-s2-c3)** [Rating: poor | Points: 0 | Next Step: End]
  - "Government rules strictly mandate the original physical Aadhaar card. You will have to go get it and stand in line again."
  - *Feedback*: Poor. Factually incorrect regarding DigiLocker, rigid, and guaranteed to provoke an explosive reaction.

---

### Level 4: The [bad] review threat (sc-dc-4)
- **Difficulty**: Intermediate
- **XP Reward**: 60 XP
- **Customer**: Deepak Chawla (`avatar-3`)
- **Situation**: Deepak runs an independent apparel boutique. A courier delivery for his festive collection arrived with torn packaging, and he is threatening a viral social media campaign and 1-star ratings across all app stores.

#### Step 1 (sc-dc-4-s1)
**Customer**: "I have 80,000 followers on Instagram and Twitter. If my damaged stock isn't compensated right now, I am posting photos of your shredded packages and tagging consumer forums. Your app rating will plummet!"

- **Choice 1 (sc-dc-4-s1-c1)** [Rating: best | Points: 10 | Next Step: sc-dc-4-s2]
  - "Deepak, I understand your business reputation is on the line and why you are furious about damaged stock before the festive season. You don't need social media to get our attention—I am opening an expedited merchant escalation right now to settle this."
  - *Feedback*: Best. Addressed the underlying fear (business impact), defused the social media threat without cowing or arguing, and owned the issue.
- **Choice 2 (sc-dc-4-s1-c2)** [Rating: okay | Points: 5 | Next Step: sc-dc-4-s2]
  - "Please don't post anything online. Let me see what credit coupon or partial compensation policy allows."
  - *Feedback*: Okay. Tries to de-escalate, but sounds fearful and offers an inadequate coupon for serious stock damage.
- **Choice 3 (sc-dc-4-s1-c3)** [Rating: poor | Points: 0 | Next Step: sc-dc-4-s2]
  - "Threatening us with social media will not speed up standard claims. Our legal team reviews defamation posts very seriously."
  - *Feedback*: Poor. Responding to customer threats with legal threats guarantees a public PR disaster.

#### Step 2 (sc-dc-4-s2)
**Customer**: "Fine, but I am not waiting 14 business days for a standard insurance adjuster. I have vendor payments due on Friday!"

- **Choice 1 (sc-dc-4-s2-c1)** [Rating: best | Points: 10 | Next Step: End]
  - "Under our Merchant Fast-Track policy for verified commercial accounts, I have authorized an immediate provisional reimbursement of Rs. 14,500, crediting by tomorrow 2 PM. Reference: M-FAST-902. Does this help you cover Friday's payments?"
  - *Feedback*: Best. Solved his actual cash flow constraint, gave exact amount and time, and closed with collaborative respect.
- **Choice 2 (sc-dc-4-s2-c2)** [Rating: okay | Points: 5 | Next Step: End]
  - "I can submit an urgency request to the claims team, but whether they pay before Friday is entirely up to their queue."
  - *Feedback*: Okay. Helpful attempt, but passes responsibility to an anonymous department with no guarantee.
- **Choice 3 (sc-dc-4-s2-c3)** [Rating: poor | Points: 0 | Next Step: End]
  - "Our commercial terms clearly state 14 days for insurance inspection. Vendor deadlines are your business responsibility."
  - *Feedback*: Poor. Cold, bureaucratic, and destroys any hope of salvaging the commercial relationship.

---

## 4. Problem Solving

### Level 1: A [repeated] WiFi drop (sc-ps-1)
- **Difficulty**: Beginner
- **XP Reward**: 40 XP
- **Customer**: Tanvi Rao (`avatar-1`)
- **Situation**: Tanvi has contacted internet support three times this week because her connection disconnects precisely at 2:00 PM every afternoon. The previous agents only told her to restart the router.

#### Step 1 (sc-ps-1-s1)
**Customer**: "This is my fourth time calling about my WiFi dropping every single day at 2 PM. Stop telling me to reboot the router! It works for twenty minutes and drops again. Find the real problem!"

- **Choice 1 (sc-ps-1-s1-c1)** [Rating: best | Points: 10 | Next Step: End]
  - "I hear your frustration, Tanvi, and you are right—rebooting is just a temporary patch. Since this happens at the exact same hour daily, let me check our hub channel interference logs and lease renewal cycles right now."
  - *Feedback*: Best. Validated that repeat reboots failed, noted the time-specific pattern, and initiated genuine root cause analysis.
- **Choice 2 (sc-ps-1-s1-c2)** [Rating: okay | Points: 5 | Next Step: End]
  - "Let's try doing a hard factory reset by holding the pinhole behind your router for 15 seconds."
  - *Feedback*: Okay. A factory reset is a deeper step than a reboot, but still ignores the daily 2 PM pattern.
- **Choice 3 (sc-ps-1-s1-c3)** [Rating: poor | Points: 0 | Next Step: End]
  - "Daily drops at specific hours are usually caused by heavy usage inside your house. You should disconnect extra devices."
  - *Feedback*: Poor. Makes unfounded assumptions that blame the customer without looking at system telemetry.

---

### Level 2: An [outside] policy request (sc-ps-2)
- **Difficulty**: Beginner
- **XP Reward**: 40 XP
- **Customer**: Manoj Kulkarni (`avatar-3`)
- **Situation**: Manoj booked a non-refundable bus ticket from Bengaluru to Hyderabad. His company unexpectedly rescheduled his training to next week, and he is asking for a date change 6 hours before departure, which is outside standard policy.

#### Step 1 (sc-ps-2-s1)
**Customer**: "I know my ticket was non-refundable, but my employer suddenly shifted my client training dates. Can you please reschedule my bus journey to next Tuesday? I don't want my money back, just a date shift."

- **Choice 1 (sc-ps-2-s1-c1)** [Rating: best | Points: 10 | Next Step: End]
  - "I understand how sudden employer schedule changes disrupt plans, Manoj. While the operator's ticket is non-refundable, let me connect with the bus fleet dispatcher to request a one-time date transfer waiver with a minimal rebooking fee."
  - *Feedback*: Best. Acknowledged the rigid rule with empathy while exploring a creative, practical compromise.
- **Choice 2 (sc-ps-2-s1-c2)** [Rating: okay | Points: 5 | Next Step: End]
  - "I can cancel this ticket for zero refund and give you a 10% discount promo code for your booking next Tuesday."
  - *Feedback*: Okay. Offered an alternative, but writing off his entire fare when an operator waiver might be possible is premature.
- **Choice 3 (sc-ps-2-s1-c3)** [Rating: poor | Points: 0 | Next Step: End]
  - "The terms say non-changeable and non-refundable within 12 hours of departure. The system does not allow date edits."
  - *Feedback*: Poor. Robotic refusal that hides behind the software without attempting to explore exceptions.

---

### Level 3: The [missing] transaction details (sc-ps-3)
- **Difficulty**: Intermediate
- **XP Reward**: 60 XP
- **Customer**: Shalini Nair (`avatar-6`)
- **Situation**: Shalini transferred Rs. 12,000 via IMPS from her corporate account to an overseas vendor's Indian subsidiary, but the recipient hasn't received it after 48 hours. She does not have the 12-digit UTR reference handy.

#### Step 1 (sc-ps-3-s1)
**Customer**: "My vendor in Mumbai says they haven't received the Rs. 12,000 payment I sent two days ago! My finance colleague who made the transfer is traveling and I don't have the UTR slip. How can you find this transfer?"

- **Choice 1 (sc-ps-3-s1-c1)** [Rating: best | Points: 10 | Next Step: sc-ps-3-s2]
  - "Don't worry, Shalini, we can trace it without the UTR. If you can share your registered account number, the beneficiary IFSC, and the approximate timestamp, I can locate the unique transaction ID in our central clearing logs."
  - *Feedback*: Best. Reassured her immediately and gave a clear, accessible list of alternative identifiers to locate the record.
- **Choice 2 (sc-ps-3-s1-c2)** [Rating: okay | Points: 5 | Next Step: sc-ps-3-s2]
  - "Tell me your account number and I'll scroll through the last 50 transactions to see if anything looks like Rs. 12,000."
  - *Feedback*: Okay. Willing to help, but sounds informal and inefficient rather than systematic.
- **Choice 3 (sc-ps-3-s1-c3)** [Rating: poor | Points: 0 | Next Step: sc-ps-3-s2]
  - "Without the 12-digit UTR number, it is impossible for our banking system to trace an inter-bank IMPS transfer. You must wait for your colleague."
  - *Feedback*: Poor. Incorrect and dismissive; customer support has multiple lookup parameters besides the UTR.

#### Step 2 (sc-ps-3-s2)
**Customer**: "I found the IFSC code HDFC0001234 and the exact debit of Rs. 12,000 was on Tuesday at 11:15 AM from account ending in 8831."

- **Choice 1 (sc-ps-3-s2-c1)** [Rating: best | Points: 10 | Next Step: End]
  - "Found it! UTR is 429188192014. The transaction was held in the clearing switch due to an IFSC branch merger. I have cleared the hold with the settlement desk; the funds will reflect in the vendor's account in 45 minutes, and I've SMSed you the proof."
  - *Feedback*: Best. Discovered the root cause (branch merger hold), resolved it immediately, and provided full proof."
- **Choice 2 (sc-ps-3-s2-c2)** [Rating: okay | Points: 5 | Next Step: End]
  - "The UTR is 429188192014. It shows 'pending'. You can share this UTR with your vendor's bank to ask why they haven't credited it."
  - *Feedback*: Okay. Retrieved the UTR, but handed the investigation off to the vendor's bank instead of fixing the internal hold.
- **Choice 3 (sc-ps-3-s2-c3)** [Rating: poor | Points: 0 | Next Step: End]
  - "The transaction is stuck. It will either credit or bounce back within seven working days."
  - *Feedback*: Poor. Zero troubleshooting effort or ownership, leaving an urgent commercial invoice hanging.

---

### Level 4: A [critical] gateway outage (sc-ps-4)
- **Difficulty**: Intermediate
- **XP Reward**: 60 XP
- **Customer**: Karthik Subramanian (`avatar-5`)
- **Situation**: Karthik is the operations manager for a regional hospital chain. During a major cloud payment gateway outage, patients at discharge counters cannot pay via cards or QR codes, creating long queues and angry relatives.

#### Step 1 (sc-ps-4-s1)
**Customer**: "Our hospital discharge desks across three branches are completely blocked! Your payment API is throwing 502 Bad Gateway errors for the past 20 minutes. Discharged patients and families are stuck! What is your incident team doing?!"

- **Choice 1 (sc-ps-4-s1-c1)** [Rating: best | Points: 10 | Next Step: sc-ps-4-s2]
  - "Karthik, we are actively managing this as a P1 Priority incident. Our primary gateway cluster experienced a failover delay, and engineering is rerouting traffic through our secondary backup switch right now. Let me guide you on enabling offline emergency terminal mode immediately."
  - *Feedback*: Best. Transparent crisis communication, clear technical explanation, and an immediate operational workaround for patients.
- **Choice 2 (sc-ps-4-s1-c2)** [Rating: okay | Points: 5 | Next Step: sc-ps-4-s2]
  - "Our server team has posted a status update on our incident page. The ETA for restoration is approximately 45 minutes."
  - *Feedback*: Okay. Provides an honest ETA, but offers no contingency help for families waiting at hospital counters.
- **Choice 3 (sc-ps-4-s1-c3)** [Rating: poor | Points: 0 | Next Step: sc-ps-4-s2]
  - "We are aware of a slight server degradation. Our technical team is working on it, please have patients wait."
  - *Feedback*: Poor. Downplaying a hospital discharge halt as 'slight degradation' displays severe lack of situational awareness.

#### Step 2 (sc-ps-4-s2)
**Customer**: "How does offline emergency mode work, and will those transactions settle safely once the cloud gateway is restored?"

- **Choice 1 (sc-ps-4-s2-c1)** [Rating: best | Points: 10 | Next Step: End]
  - "Toggle 'Store & Forward' under Terminal Settings: card authorizations will store locally encrypted and print instant receipts so patients can be discharged immediately. Once gateway sync completes at 12:30 PM, all batches auto-settle with guaranteed zero duplicate charges."
  - *Feedback*: Best. Crisp tactical steps, reassurance on data encryption and financial safety, allowing patients to leave safely.
- **Choice 2 (sc-ps-4-s2-c2)** [Rating: okay | Points: 5 | Next Step: End]
  - "You can take manual cash payments or ask patients to write cheques for now until our cloud comes back up."
  - *Feedback*: Okay. Practical fallback, but ignores terminal capabilities and creates administrative chaos for the hospital.
- **Choice 3 (sc-ps-4-s2-c3)** [Rating: poor | Points: 0 | Next Step: End]
  - "If you swipe cards offline, any failed authorizations later will be at your hospital's financial risk."
  - *Feedback*: Poor. Unnecessarily alarming during an emergency without explaining standard encrypted store-and-forward protection.

---

## 5. AI Boss Personas (Level 5 Live AI Call)

### Boss Persona 1: Handling Complaints (boss-hc)
- **Name**: Mr. Sharma
- **Category Slug**: `handling-complaints`
- **Avatar Key**: `customer-sharma`
- **Start Mood**: 25 / 100
- **XP Reward**: 150 XP
- **Problem**: Third call about a Rs. 2,499 refund for a mixer grinder that arrived with a shattered jar two weeks ago.
- **Hidden Goal**: The agent takes personal ownership, raises the refund immediately with a reference number, and commits to a specific callback today.
- **System Prompt**:
  > You are Mr. Sharma, 52, a retired bank clerk living in Pune. You value precision, accountability, and prompt action. You ordered a mixer grinder for Rs. 2,499 that arrived with a shattered jar two weeks ago. You returned it, but your refund has not been credited. This is your third time calling customer support. Previous agents gave vague reassurances like 'within 5-7 days' and nothing happened. You speak politely but sternly, referencing dates and amounts. You get irritated by robotic scripts, false sympathy, and being passed around. You calm down only when an agent genuinely takes personal ownership, explains the concrete action they are taking right now, and gives you a reference number and a firm callback time.

---

### Boss Persona 2: Customer Queries (boss-cq)
- **Name**: Mrs. Fernandes
- **Category Slug**: `customer-queries`
- **Avatar Key**: `customer-fernandes`
- **Start Mood**: 40 / 100
- **XP Reward**: 150 XP
- **Problem**: Confused about whether her front-load washing machine warranty covers motor replacement after a breakdown.
- **Hidden Goal**: The agent explains warranty coverage in simple, jargon-free steps and books an engineer inspection without requiring complex forms.
- **System Prompt**:
  > You are Mrs. Fernandes, 64, a retired schoolteacher living in Bandra, Mumbai. You are gentle, patient, but easily overwhelmed by complex technical or legal jargon. Your front-load washing machine made a loud grinding noise and stopped spinning yesterday. You tried reading the 30-page warranty booklet three times, but terms like 'limited component coverage' and 'depreciated labor clause' confuse you. You want a straight, kind, and simple answer: is the motor covered, and what do you need to do? You get flustered and anxious if agents use acronyms, speak too fast, or cite policy clauses without explaining them. You become relieved and grateful when an agent explains things in plain language, gives step-by-step guidance, and offers to arrange the engineer visit.

---

### Boss Persona 3: Difficult Customers (boss-dc)
- **Name**: Mr. Khanna
- **Category Slug**: `difficult-customers`
- **Avatar Key**: `customer-khanna`
- **Start Mood**: 20 / 100
- **XP Reward**: 150 XP
- **Problem**: Furious after waiting 40 minutes at a retail pickup counter and threatening a viral one-star review.
- **Hidden Goal**: The agent validates his wasted time without defensive excuses, prioritizes his order immediately, and commits to reporting the queue failure.
- **System Prompt**:
  > You are Mr. Khanna, 45, an impatient textile exporter from Karol Bagh, Delhi. You run on a tight schedule and have zero tolerance for inefficiency. You came to the flagship store counter to pick up an urgent corporate gift package, but were made to wait in an unmanaged queue for over 40 minutes while staff chatted. You are angry, talking loudly, and threatening to post a 1-star review and a video of the counter on LinkedIn and Twitter. You despise dismissive platitudes, defensive excuses like 'we are short-staffed today', or anyone telling you to 'please calm down'. You only de-escalate if the agent validates your wasted time without being defensive, immediately expedites your order, and takes direct personal responsibility.

---

### Boss Persona 4: Problem Solving (boss-ps)
- **Name**: Ms. Banerjee
- **Category Slug**: `problem-solving`
- **Avatar Key**: `customer-banerjee`
- **Start Mood**: 35 / 100
- **XP Reward**: 150 XP
- **Problem**: Bakery owner whose weekly recurring ingredient order fails repeatedly at checkout with an authorization sync error.
- **Hidden Goal**: The agent diagnoses the technical error logs instead of repeating generic advice, manually ships ingredients for tomorrow, and files a priority bug.
- **System Prompt**:
  > You are Ms. Banerjee, 38, founder of an artisanal bakery in Kolkata. Your business depends on weekly automated ingredient orders of dairy and organic flour. For the third week in a row, the recurring subscription order failed at 4:00 AM with error code 'ERR-AUTH-SYNC', leaving you scrambling for morning prep. You already cleared your cache, updated the app, and re-added your corporate card as previous agents suggested, but it failed again. You are stressed about letting down your morning bakery customers. You get irritated when support staff offer basic troubleshooting steps you have already tried. You calm down when an agent investigates the specific error logs, acknowledges the subscription webhook failure, arranges an immediate manual shipment so your kitchen can open tomorrow, and files a priority engineering bug.
