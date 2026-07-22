# 003 - User Journey

## Overview

The complete journey, from starting an interview to reviewing results. The user must be **signed in**
(interviews are per-user); a guest is prompted to log in first. The interview itself is a **chat**:
the AI asks, the user answers, and feedback comes right after each answer.

---

## Goals

- Create a realistic, conversational interview experience.
- Give coaching feedback in the moment, not just at the end.
- Track scores over time (History).

---

## User flow

1. Open the Interview screen (hash route `#interview`, reached from the header/home).
2. Select a course (from the existing course bank).
3. Select a difficulty (`easy` / `medium` / `hard`).
4. Select the number of questions.
5. Select the **language** (English / Русский) — the interview runs in it (questions, model answer,
   AI feedback).
6. Press **Start Interview** → a **confirm modal** summarizes the session → confirm → the backend
   creates the session and returns the first question.
7. The chat shows the AI's question. Type an answer (or use **Sample answer**) and **Submit**.
8. The backend evaluates that answer and returns a **score + feedback**, shown as the AI's reply.
9. Repeat for each question (one at a time).
10. After the last answer, choose **See results** or **Review answers**.
11. **Results**: overall score /100, rubric breakdown, strengths / focus areas, recommended next
    steps.
12. **Review**: per-question score, your answer, strengths / to-improve, and the model answer.
13. The session appears in **History** with its score; start the next interview any time.

---

## Functional requirements

- Show one question at a time in the chat.
- Evaluate each answer on submit and show feedback immediately (with a "thinking" state).
- Persist every answer + evaluation to the backend (survives refresh).
- Display interview progress (question n of N, %).
- Allow skipping a question (recorded as skipped/empty, score 0).
- Produce the final report (overall score + rubric + recommendations) at completion.

---

## Acceptance criteria

- A signed-in user can finish an interview chat without assistance.
- Every answer gets a score and feedback in the chat.
- Results show an overall score /100 and the four-axis breakdown.
- History lists past interviews with scores.

---

## Edge cases

- **Browser refresh / re-open** → resume the in-progress chat from the backend (questions +
  answers + feedback so far).
- **AI request failure / timeout** → keep the answer, show a friendly error, allow re-submitting that
  answer (see `005`/`006`).
- **Network interruption** → submit retries; nothing is lost (idempotent per question).
- **Empty / skipped answer** → allowed; scored 0, no AI call.
- **User exits before completion** → the session stays `in_progress` and can be resumed. Only one
  active session per user at a time (see `004`).

---

## Future improvements

- Voice interviews, AI follow-up questions, live coding, pair programming.
- English-coaching feedback + personalized Dictionary (post-MVP, `007`/`008`).
