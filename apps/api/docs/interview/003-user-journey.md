# 003 - User Journey

## Overview

The complete journey, from starting an interview to receiving personalized recommendations. The
user must be **signed in** (interviews are per-user); a guest is prompted to log in first.

---

## Goals

- Create a realistic interview experience.
- Keep the flow simple and distraction-free.
- Turn every interview into future learning.

---

## User flow

1. Open the Interview screen (hash route `#interview`, reached from the header/home).
2. Select a course (from the existing course bank).
3. Select a difficulty (`easy` / `medium` / `hard`).
4. Select the number of questions.
5. Press **Start Interview** → the backend creates an interview session and picks questions.
6. Answer one question at a time (typed).
7. Submit each answer (auto-saved to the backend).
8. Complete the interview.
9. The backend runs AI evaluation and generates the final report.
10. The Learning Profile is updated.
11. The personalized Dictionary is updated.
12. Recommendations are generated.
13. The user starts the next personalized interview.

---

## Functional requirements

- Show one question at a time.
- Auto-save each answer to the backend (survives refresh).
- Display interview progress.
- Allow skipping a question (recorded as skipped/empty).
- Generate the final report only after the interview ends.

---

## Acceptance criteria

- A signed-in user can finish an interview without assistance.
- The final report contains technical **and** English feedback.
- Recommendations are generated.
- The Learning Profile is updated.

---

## Edge cases

- **Browser refresh / re-open** → resume the in-progress session from the backend.
- **AI request failure / timeout** → keep the session, show a friendly error, allow re-running
  evaluation (see `005`/`006`).
- **Network interruption** → answer save retries; nothing is lost.
- **Empty / skipped answer** → allowed; scored accordingly.
- **User exits before completion** → the session stays `in_progress` and can be resumed. Only one
  active session per user at a time (see `004`).

---

## Future improvements

- Voice interviews.
- AI follow-up questions.
- Live coding.
- Pair programming.
