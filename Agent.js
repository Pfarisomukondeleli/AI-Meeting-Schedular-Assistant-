let state = {
    active: false,
    dateRange: null,
    timeWindow: null,
    participants: [],
    currentProposal: null,
    rejectedProposals: []
};

let scheduledMeetings = [];

function agentSpeak(message) {
    const MAX = 120;
    const safe = message.length > MAX
        ? message.slice(0, MAX - 1) + "…"
        : message;

    document.getElementById("agentMessage").innerText = safe;
}

function highlightSelected(button, selector) {
    document.querySelectorAll(selector).forEach(btn =>
        btn.classList.remove("active")
    );
    button.classList.add("active");
}

function resetAgentState() {
    state.active = false;
    state.dateRange = null;
    state.timeWindow = null;
    state.participants = [];
    state.currentProposal = null;
    state.rejectedProposals = [];
}

function resetUISelections() {
    document.querySelectorAll("button.active")
        .forEach(btn => btn.classList.remove("active"));

    document.getElementById("proposalSection")
        .classList.add("hidden");

    document.getElementById("selectedParticipants").innerHTML = "";
}

function formatDate(dateObj) {
    return dateObj.toLocaleDateString("en-GB", {
        weekday: "short",
        day: "numeric",
        month: "short"
    });
}

function getDatesForRange(range) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let dates = [];

    const day = today.getDay();
    const monday = new Date(today);
    monday.setDate(today.getDate() - ((day + 6) % 7));

    if (range === "Next Week") {
        monday.setDate(monday.getDate() + 7);
    }

    if (range === "This Week" || range === "Next Week") {
        for (let i = 0; i < 5; i++) {
            const d = new Date(monday);
            d.setDate(monday.getDate() + i);
            dates.push(formatDate(d));
        }
    }

    if (range === "Next 30 Days") {
        for (let i = 1; i <= 30; i++) {
            const d = new Date(today);
            d.setDate(today.getDate() + i);
            dates.push(formatDate(d));
        }
    }

    return dates;
}

function selectDateRange(range, button) {
    state.dateRange = range;
    highlightSelected(button, ".selection-row:nth-of-type(2) button");
    agentSpeak(`Date range set: ${range}`);
    checkAndProposeMeeting();
}

function selectTimeWindow(time, button) {
    state.timeWindow = time;
    highlightSelected(button, ".selection-row:nth-of-type(3) button");
    agentSpeak(`Preferred time: ${time}`);
    checkAndProposeMeeting();
}

document.addEventListener("DOMContentLoaded", () => {
    const participantItems = document.querySelectorAll(".participant-item");
    const selectedContainer = document.getElementById("selectedParticipants");
    const participantBtn = document.getElementById("participantBtn");
    const participantDropdown = document.getElementById("participantDropdown");

    participantDropdown.style.display = "none";

    function renderSelectedParticipants() {
        selectedContainer.innerHTML = "";
        state.participants.forEach(name => {
            const pill = document.createElement("div");
            pill.className = "pill";
            pill.innerHTML = `${name} <span class="remove">&times;</span>`;

            pill.querySelector(".remove").onclick = () => {
                state.participants =
                    state.participants.filter(p => p !== name);
                renderSelectedParticipants();
                updateDropdown();
                agentSpeak(`${state.participants.length} participant(s) selected`);
                checkAndProposeMeeting();
            };

            selectedContainer.appendChild(pill);
        });
    }

    function updateDropdown() {
        participantItems.forEach(item => {
            item.classList.toggle(
                "active",
                state.participants.includes(item.innerText)
            );
        });
    }

    participantItems.forEach(item => {
        item.onclick = () => {
            const name = item.innerText;
            if (state.participants.includes(name)) {
                state.participants = state.participants.filter(p => p !== name);
            } else {
                state.participants.push(name);
            }
            updateDropdown();
            renderSelectedParticipants();
            agentSpeak(`${state.participants.length} participant(s) selected`);
            checkAndProposeMeeting();

            participantDropdown.style.display = "none";

        };

    });

    participantBtn.onclick = e => {
        e.stopPropagation();
        participantDropdown.style.display =
            participantDropdown.style.display === "block" ? "none" : "block";
    };

    document.onclick = e => {
        if (!e.target.closest(".dropdown")) {
            participantDropdown.style.display = "none";
        }
    };
});

function checkAndProposeMeeting() {
    if (
        state.dateRange &&
        state.timeWindow &&
        state.participants.length > 0
    ) {
        proposeMeeting();
    }
}

function calculateConfidence(date, time) {
    const total = state.participants.length;

    const unavailable = state.participants.filter(p =>
        scheduledMeetings.some(
            m => m.date === date && m.time === time && m.participants.includes(p)
        )
    ).length;

    const availabilityScore = ((total - unavailable) / total) * 80;

    const contentionPenalty = scheduledMeetings.some(
        m => m.date === date && m.time === time
    ) ? 15 : 0;

    const uncertaintyBuffer = 5;

    const confidence = Math.round(
        availabilityScore - contentionPenalty + uncertaintyBuffer
    );

    return Math.min(100, Math.max(0, confidence));
}


function explainConfidence(unavailable) {
    if (unavailable === 0) {
        return "All participants available";
    }
    if (unavailable === 1) {
        return "One participant may be unavailable";
    }
    return `${unavailable} participants may be unavailable`;
}

function proposeMeeting() {
    const dates = getDatesForRange(state.dateRange);
    const slots = {
        Morning: ["09:00", "10:00", "11:00"],
        Afternoon: ["12:00", "13:00", "14:00", "15:00", "16:00"],
        Evening: ["18:00", "19:00", "20:00"]
    }[state.timeWindow];

    let best = null;
    let bestScore = -Infinity;

    for (const date of dates) {
        for (const time of slots) {
            const key = `${date}|${time}`;
            if (state.rejectedProposals.includes(key)) continue;
            if (scheduledMeetings.some(m => m.date === date && m.time === time))
                continue;

            const free = state.participants.filter(p =>
                !scheduledMeetings.some(
                    m => m.date === date && m.time === time && m.participants.includes(p)
                )
            ).length;

            const score = free * 10 - dates.indexOf(date);
            if (score > bestScore) {
                bestScore = score;
                best = { date, time, free };
            }
        }
    }

    if (!best) {
        agentSpeak("⚠️ No available slots. Update constraints.");
        document.getElementById("proposalSection").classList.add("hidden");
        return;
    }

    const unavailable =
        state.participants.length - best.free;

    const confidence =
        calculateConfidence(best.date, best.time);

    const reason =
        explainConfidence(unavailable);

    ;

    state.currentProposal = { ...best, confidence, reason };

    const color =
        confidence >= 80 ? "green" :
            confidence >= 50 ? "orange" : "red";

    document.getElementById("proposalCard").innerHTML = `
        <strong>Date:</strong> ${best.date}<br/>
        <strong>Time:</strong> ${best.time}<br/>
        <strong>Participants:</strong> ${state.participants.join(", ")}<br/>
        <strong>Confidence:</strong>
        <span style="color:${color}">${confidence}%</span><br/>
        <small>${reason}</small>
    `;

    document.getElementById("proposalSection").classList.remove("hidden");
    agentSpeak(`✅Proposal ready`)
}

function suggestAnother() {
    if (!state.currentProposal) return;
    state.rejectedProposals.push(
        `${state.currentProposal.date}|${state.currentProposal.time}`
    );
    agentSpeak("🔄 Alternative slot evaluated");
    state.currentProposal = null;
    proposeMeeting();
}

function confirmMeeting() {
    if (!state.currentProposal) return;

    scheduledMeetings.push({
        date: state.currentProposal.date,
        time: state.currentProposal.time,
        participants: [...state.participants]
    });

    agentSpeak(
        `✅ Meeting scheduled · ${state.currentProposal.date} ${state.currentProposal.time}`
    );

    setTimeout(() => {
        resetAgentState();
        resetUISelections();
        agentSpeak("Waiting for user input...");
    }, 2500);
}

resetAgentState();
resetUISelections();

function changeConstraints() {
    state.currentProposal = null;
    document.getElementById("proposalSection").classList.add("hidden");
    agentSpeak("⚠️ Update constraints to continue");
}


