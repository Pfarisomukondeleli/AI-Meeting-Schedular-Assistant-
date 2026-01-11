# AI-Powered Meeting Scheduler (UI-Constrained Agent)

## Overview
This project implements a **UI-constrained, task-focused agent** for scheduling meetings.  Users select participants, a date range, and a time window via predefined UI controls, and the agent proposes optimal meeting slots with **deterministic, explainable decisions**.

---

## How to Run
1. Clone the repository.  
2. Open `index.html` in a modern browser (Chrome / Edge / Firefox).  
3. No backend or build steps are required.

---

## System Design

### UI vs Agent vs Memory State

**UI**
- Buttons and dropdowns only (no free-form input)  
- Displays proposals, confidence, and agent status  

**Agent (`Agent.js`)**
- Reacts only to UI selections  
- Generates deterministic proposals  
- Enforces a **120-character response limit**  

**State / Memory**
- JavaScript state object tracking participants, date range, time window, rejected proposals, and scheduled meetings  

The agent cannot act outside UI-defined constraints.

---

## Key Behaviours
- **Partial task completion:** Inputs can be selected in any order; progress is preserved.  
- **User correction:** Proposals can be rejected or constraints changed without restarting.  
- **Agent confidence:** Each proposal includes a confidence score, explanation, and visual indicator.

---

## Failure Scenario & Recovery

**Scenario:** All valid meeting slots are unavailable or rejected.  

**Recovery:**  
The agent displays *“No available slots. Update constraints.”*, hides the proposal UI, and allows the user to adjust constraints and continue without resetting.

---

## Why Not Plain Text Chat
A free-form chat would allow ambiguous inputs, remove enforceable response limits, hide task state, complicate corrections, and eliminate visual confidence explanations.  
This UI-constrained design prevents those issues.


---### Screenshots

**1. Landing page**  
![Participant Selection](https://github.com/Pfarisomukondeleli/AI-Meeting-Schedular-Assistant-/blob/main/AI%20Powered%20meeting%20schedular%20landing%20page%20.jpeg)

**2. Meeting proposal**  
![Date & Time Selection](https://github.com/Pfarisomukondeleli/AI-Meeting-Schedular-Assistant-/blob/main/proposed%20meeting.jpeg)

**3. change constraints**  
![Proposal Card](https://github.com/Pfarisomukondeleli/AI-Meeting-Schedular-Assistant-/blob/main/update%20constraints%20.jpeg)

**4. Meeting Confirmed**  
![Meeting Confirmed](https://github.com/Pfarisomukondeleli/AI-Meeting-Schedular-Assistant-/blob/main/meeting%20confirmed.jpeg)

**State Machine Diagram**
![State Machine diagram](https://github.com/Pfarisomukondeleli/AI-Meeting-Schedular-Assistant-/blob/main/state%20diagram.png)


## Summary
This project demonstrates **agent-aware interaction design**, deterministic behavior, recoverable failure handling, and clear state management under strict UI constraints.
