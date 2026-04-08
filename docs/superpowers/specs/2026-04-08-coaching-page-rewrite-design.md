# Coaching Page Rewrite

## Goal

Rewrite the coaching landing page copy to:
1. Target senior data engineers wanting promotion and new data leads finding their feet
2. Replace vague corporate language with direct, specific, PAS-structured copy
3. Match Yordan's writing voice — short sentences, plain language, no consultant-speak

## Framework

PAS (Problem - Agitate - Solution) throughout the page structure.

## Audience

- Senior/staff data engineers who are technically strong but invisible to leadership
- New data leads (first 6-12 months) who got promoted for technical skill but now need soft skills
- Core pain: freezing in stakeholder meetings, not knowing how to build a promotion case

## Copy

### Hero (Problem)

- **Title:** "Become the Data Leader Every Team Wants"
- **Subtitle:** "I coach senior data engineers and new data leads who want to get promoted, own the room in stakeholder meetings, and build a career that matches their ability."

Badge removed — the page makes the 1:1 format obvious.

### Highlight Box (Agitate)

- **Title:** "The Problem"
- **Content:** "You can build the pipeline, design the architecture, and fix the production incident at 2am. But when it's time to present to the VP, make the case for headcount, or explain why your promotion is overdue — you go quiet. Technical skill got you here. It won't get you to the next level."

### Features Grid (Solution)

- **Title:** "What we work on:"

1. **Stakeholder Communication**
   "How to walk into a meeting with non-technical leadership and land your point. We work on structure, framing, and confidence — so you stop leaving meetings thinking 'I should have said that differently.'"

2. **Promotion Business Cases**
   "Most data people wait to be noticed. We build an actual case — impact framed in business terms, a clear narrative for your manager, and a strategy for making it happen on your timeline."

3. **Data Strategy & Roadmaps**
   "How to think beyond the next sprint. We work on building a roadmap that connects your technical work to what the business actually cares about — revenue, cost, risk."

4. **Leading Without a Playbook**
   "If you just got the title (or want it), we cover the stuff nobody teaches in data: managing up, running your first team, saying no to stakeholders, and figuring out what 'being strategic' actually means."

### AI Assistant Block

No changes. Stays as-is.

### CTA Section

- **Title:** "30 minutes. No pitch."
- **Description:** "Book a discovery call. Tell me what you're stuck on. If I can help, I'll tell you how. If I can't, I'll tell you that too."
- **Button:** "Book a Discovery Call"

### Testimonial

No changes. Katy Beckett quote stays as-is.

## Implementation

Single file change: `frontend/content/pages/coaching.json`. Update the JSON content for hero, highlight-box, features-grid, and cta-section blocks. No structural or component changes needed.

## What's NOT changing

- Page structure (same blocks in same order)
- Block components (no code changes)
- AI assistant block
- Testimonial block
- Cal.com integration
