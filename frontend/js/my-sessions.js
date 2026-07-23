// Initialize Dark Mode theme from localStorage
(function() {
    if (localStorage.getItem("dark_theme") === "true") {
        document.body.classList.add("dark-theme");
    }
})();

let activeSessionsTab = "upcoming";

const defaultRequests = [];

document.addEventListener("DOMContentLoaded", () => {
    // 1. Sync User Header info
    const user = JSON.parse(localStorage.getItem('user'));
    if (user) {
        document.getElementById('headerUserName').textContent = user.firstName;
        document.getElementById('headerUserRole').textContent = user.role.charAt(0).toUpperCase() + user.role.slice(1);
        document.getElementById('headerUserAvatar').textContent = (user.firstName.charAt(0) + user.lastName.charAt(0)).toUpperCase();
    }

    // 2. Initialize requests from LocalStorage & upgrade if necessary
    let existingReqs = localStorage.getItem("session_requests");
    if (!existingReqs || (JSON.parse(existingReqs).length > 0 && JSON.parse(existingReqs)[0].id === 201)) {
        localStorage.setItem("session_requests", JSON.stringify([]));
    }

    // 3. Load and render sessions list
    renderMySessions();
});

// Toggle Sessions Tabs
function selectSessionsTab(e, tabName) {
    const tabs = document.querySelectorAll(".session-tab-btn");
    tabs.forEach(t => t.classList.remove("active"));
    e.currentTarget.classList.add("active");

    activeSessionsTab = tabName;
    renderMySessions();
}

// Render Scheduled Sessions Feed
function renderMySessions() {
    const container = document.getElementById("sessionsFeedContainer");
    const sessions = JSON.parse(localStorage.getItem("session_requests")) || [];
    const currentUser = JSON.parse(localStorage.getItem('user'));

    if (!currentUser) {
        container.innerHTML = `<div style="grid-column: 1/-1; text-align:center; padding: 2rem;">Please log in to view sessions.</div>`;
        return;
    }

    // Filter sessions belonging to the current user (either sender or recipient)
    const mySessions = sessions.filter(s => s.senderId === currentUser.id || s.recipientId === currentUser.id);

    // Calculate tab stats
    const upcomingCount = mySessions.filter(s => s.status === 'accepted').length;
    const completedCount = mySessions.filter(s => s.status === 'completed').length;
    const cancelledCount = mySessions.filter(s => s.status === 'rejected' || s.status === 'cancelled').length;

    document.getElementById("upcomingCount").textContent = upcomingCount;
    document.getElementById("completedCount").textContent = completedCount;
    document.getElementById("cancelledCount").textContent = cancelledCount;

    container.innerHTML = "";

    // Filter items based on active tab
    let filtered = [];
    if (activeSessionsTab === "upcoming") {
        filtered = mySessions.filter(s => s.status === 'accepted');
    } else if (activeSessionsTab === "completed") {
        filtered = mySessions.filter(s => s.status === 'completed');
    } else if (activeSessionsTab === "cancelled") {
        filtered = mySessions.filter(s => s.status === 'rejected' || s.status === 'cancelled');
    }

    if (filtered.length === 0) {
        container.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 4rem; color: var(--text-light); background: var(--surface); border: 1px dashed var(--border); border-radius: var(--radius)">
                <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">📖</div>
                <h3>No sessions found under this tab.</h3>
                <p style="font-size: 0.85rem; margin-top: 0.2rem;">Sessions that are scheduled, finished, or closed will show here.</p>
            </div>
        `;
        return;
    }

    filtered.forEach(session => {
        const card = document.createElement("div");
        card.className = "my-session-card";

        // Date Display
        const dateObj = new Date(session.date);
        const options = { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' };
        const formattedDate = dateObj.toLocaleDateString('en-US', options);

        // Determine Teacher and Role label based on IDs
        const isOutgoing = session.senderId === currentUser.id;
        const partnerName = isOutgoing ? session.recipientName : session.senderName;
        const partnerAvatar = isOutgoing ? session.recipientAvatar : session.senderAvatar;
        const teacherName = isOutgoing ? session.recipientName : "You (Teaching)";
        const learnerName = isOutgoing ? "You" : session.senderName;
        const roleLabel = isOutgoing ? "Learn Skill" : "Teach Skill";

        // Status Badge class
        let badgeClass = "upcoming";
        if (session.status === "completed") badgeClass = "completed";
        if (session.status === "rejected" || session.status === "cancelled") badgeClass = "cancelled";

        // Start button / text layout
        let actionMarkup = "";
        if (activeSessionsTab === "upcoming") {
            const sessionDateStr = session.date;
            const startTimeStr = session.time.split(" - ")[0];
            const scheduledDateTime = new Date(`${sessionDateStr}T${startTimeStr}:00`);
            const isBeforeTime = new Date() < scheduledDateTime;

            if (isOutgoing && isBeforeTime) {
                actionMarkup = `
                    <button class="btn-start-session disabled-waiting" onclick="startSession(${session.id})" style="background:#cbd5e1; color:#64748b; cursor:not-allowed; box-shadow:none;">🕒 Waiting for time</button>
                `;
            } else {
                actionMarkup = `
                    <button class="btn-start-session" onclick="startSession(${session.id})">💻 Start Session</button>
                `;
            }
        } else {
            actionMarkup = `<span style="font-size:0.8rem; color:var(--text-light); font-style:italic;">Session locked</span>`;
        }

        card.innerHTML = `
            <div class="mysession-header">
                <img src="${partnerAvatar}" alt="${partnerName}" class="mysession-avatar">
                <div class="mysession-title-block">
                    <h3>${partnerName}</h3>
                    <div class="mysession-role-txt">${roleLabel}: <span>${session.skill}</span></div>
                </div>
            </div>

            <div class="mysession-schedule-box">
                <div>
                    <span class="schedule-icon">📅</span>
                    <span>${formattedDate}</span>
                </div>
                <div>
                    <span class="schedule-icon">🕒</span>
                    <span>${session.time}</span>
                </div>
                <div style="margin-top:0.4rem; font-weight:600;">
                    <span>👤 Teacher:</span> &nbsp; <span>${teacherName}</span>
                </div>
                <div style="font-weight:600;">
                    <span>👤 Learner:</span> &nbsp; <span>${learnerName}</span>
                </div>
            </div>

            <div class="mysession-footer">
                <span class="session-status ${badgeClass}">${session.status}</span>
                ${actionMarkup}
            </div>
        `;

        container.appendChild(card);
    });
}

// Redirect to Jitsi Session call room passing session ID
function startSession(sessionId) {
    const sessions = JSON.parse(localStorage.getItem("session_requests")) || [];
    const session = sessions.find(s => s.id === sessionId);
    const currentUser = JSON.parse(localStorage.getItem('user'));

    if (session && currentUser && session.senderId === currentUser.id) {
        const sessionDateStr = session.date;
        const startTimeStr = session.time.split(" - ")[0];
        const scheduledDateTime = new Date(`${sessionDateStr}T${startTimeStr}:00`);

        if (new Date() < scheduledDateTime) {
            const options = { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' };
            const formattedDate = new Date(session.date).toLocaleDateString('en-US', options);
            alert(`This session is scheduled for ${formattedDate} at ${session.time.split(" - ")[0]}.\n\nYou can only start the session once the scheduled time is reached!`);
            return;
        }
    }

    window.location.href = `session-room.html?id=${sessionId}`;
}
