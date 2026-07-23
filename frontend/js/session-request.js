// Initialize Dark Mode theme from localStorage
(function() {
    if (localStorage.getItem("dark_theme") === "true") {
        document.body.classList.add("dark-theme");
    }
})();

// Default Session Requests if localStorage is empty
const defaultRequests = [];

let activeTab = "incoming";

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
    if (!existingReqs || (JSON.parse(existingReqs).length > 0 && (JSON.parse(existingReqs)[0].id === 201 || JSON.parse(existingReqs)[0].id === 101))) {
        localStorage.setItem("session_requests", JSON.stringify([]));
    }

    // 3. Render requests
    renderRequests();
});

// Tab navigation handler
function selectTab(e, tabName) {
    const tabs = document.querySelectorAll('.session-tab-btn');
    tabs.forEach(t => t.classList.remove('active'));
    e.currentTarget.classList.add('active');

    activeTab = tabName;
    renderRequests();
}

// Render Request cards
function renderRequests() {
    const listContainer = document.getElementById("sessionsList");
    const requests = JSON.parse(localStorage.getItem("session_requests")) || [];
    const currentUser = JSON.parse(localStorage.getItem('user'));

    if (!currentUser) {
        listContainer.innerHTML = `<div style="text-align:center; padding: 2rem;">Please log in to view session requests.</div>`;
        return;
    }

    // Update Counts
    const incomingCount = requests.filter(r => r.recipientId === currentUser.id && r.status === "pending").length;
    const outgoingCount = requests.filter(r => r.senderId === currentUser.id && r.status === "pending").length;
    const scheduledCount = requests.filter(r => r.status === "accepted" && (r.senderId === currentUser.id || r.recipientId === currentUser.id)).length;

    document.getElementById("incomingCount").textContent = incomingCount;
    document.getElementById("outgoingCount").textContent = outgoingCount;
    document.getElementById("scheduledCount").textContent = scheduledCount;

    listContainer.innerHTML = "";

    // Filter by active tab
    let filtered = [];
    if (activeTab === "incoming") {
        filtered = requests.filter(r => r.recipientId === currentUser.id && r.status === "pending");
    } else if (activeTab === "outgoing") {
        filtered = requests.filter(r => r.senderId === currentUser.id && r.status === "pending");
    } else if (activeTab === "scheduled") {
        filtered = requests.filter(r => r.status === "accepted" && (r.senderId === currentUser.id || r.recipientId === currentUser.id));
    }

    if (filtered.length === 0) {
        listContainer.innerHTML = `
            <div style="text-align: center; padding: 4rem; color: var(--text-light); background: var(--surface); border: 1px dashed var(--border); border-radius: var(--radius)">
                <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">📅</div>
                <h3>No sessions found in this category.</h3>
                <p style="font-size: 0.85rem; margin-top: 0.2rem;">Requests you interact with will display here.</p>
            </div>
        `;
        return;
    }

    filtered.forEach(req => {
        const card = document.createElement("div");
        card.className = "session-card";

        // Date Display
        const dateObj = new Date(req.date);
        const options = { weekday: 'short', month: 'short', day: 'numeric' };
        const formattedDate = dateObj.toLocaleDateString('en-US', options);

        const isIncoming = req.recipientId === currentUser.id;
        const partnerName = isIncoming ? req.senderName : req.recipientName;
        const partnerAvatar = isIncoming ? req.senderAvatar : req.recipientAvatar;

        // Header Skill Label wording
        const roleLabel = isIncoming ? "Wants to learn" : "You requested to learn";

        // Action Buttons / Status layout
        let actionMarkup = "";
        if (activeTab === "incoming") {
            actionMarkup = `
                <button class="btn-action-accept" onclick="updateStatus(${req.id}, 'accepted')">Accept</button>
                <button class="btn-action-reject" onclick="updateStatus(${req.id}, 'rejected')">Decline</button>
            `;
        } else if (activeTab === "outgoing") {
            actionMarkup = `<span class="status-badge pending">Pending</span>`;
        } else if (activeTab === "scheduled") {
            actionMarkup = `
                <button class="btn-action-meeting" onclick="launchMeeting(${req.id})">💻 Launch Call</button>
            `;
        }

        card.innerHTML = `
            <div class="session-left-area">
                <img src="${partnerAvatar}" alt="${partnerName}" class="session-user-img">
                <div class="session-info-details">
                    <h3>${partnerName}</h3>
                    <div class="session-skill-label">${roleLabel} <span>${req.skill}</span></div>
                    <div class="session-schedule">
                        <span>🕒</span>
                        <span>${formattedDate} &nbsp;|&nbsp; ${req.time}</span>
                    </div>
                </div>
            </div>
            <div class="session-right-area">
                ${actionMarkup}
            </div>
        `;

        listContainer.appendChild(card);
    });
}

// Update Request Status (Accept / Decline)
function updateStatus(reqId, newStatus) {
    if (newStatus === "accepted") {
        openScheduleModal(reqId);
        return;
    }

    const requests = JSON.parse(localStorage.getItem("session_requests")) || [];
    const index = requests.findIndex(r => r.id === reqId);

    if (index !== -1) {
        requests[index].status = newStatus;
        localStorage.setItem("session_requests", JSON.stringify(requests));

        const currentUser = JSON.parse(localStorage.getItem('user'));
        const partnerName = requests[index].recipientId === currentUser.id ? requests[index].senderName : requests[index].recipientName;
        alert(`Session Request from ${partnerName} declined.`);
        renderRequests();
    }
}

// Modal management
function openScheduleModal(reqId) {
    const requests = JSON.parse(localStorage.getItem("session_requests")) || [];
    const req = requests.find(r => r.id === reqId);
    if (!req) return;

    const currentUser = JSON.parse(localStorage.getItem('user'));
    const isIncoming = req.recipientId === currentUser.id;
    const partnerName = isIncoming ? req.senderName : req.recipientName;
    const partnerAvatar = isIncoming ? req.senderAvatar : req.recipientAvatar;

    // Populate Modal Elements
    document.getElementById("modalReqId").value = reqId;
    document.getElementById("modalPartnerAvatar").src = partnerAvatar;
    document.getElementById("modalPartnerAvatar").alt = partnerName;
    document.getElementById("modalPartnerName").textContent = partnerName;

    const skillLabelElement = document.getElementById("modalSessionSkillLabel");
    const roleLabel = isIncoming ? "Wants to learn" : "You requested to learn";
    skillLabelElement.innerHTML = `${roleLabel} <span>${req.skill}</span>`;

    // Parse Date & prefill
    document.getElementById("scheduleDateInput").value = req.date || new Date().toISOString().split('T')[0];

    // Parse Time: e.g. "14:00 - 15:00"
    const timeParts = (req.time || "14:00 - 15:00").split(" - ");
    const startTime = timeParts[0] || "14:00";
    const endTime = timeParts[1] || "15:00";

    document.getElementById("scheduleStartTimeInput").value = startTime;
    document.getElementById("scheduleEndTimeInput").value = endTime;

    // Show modal
    document.getElementById("scheduleModal").classList.add("active");
}

function closeScheduleModal() {
    document.getElementById("scheduleModal").classList.remove("active");
    document.getElementById("scheduleForm").reset();
}

function confirmSchedule(event) {
    event.preventDefault();

    const reqId = parseInt(document.getElementById("modalReqId").value, 10);
    const selectedDate = document.getElementById("scheduleDateInput").value;
    const startTime = document.getElementById("scheduleStartTimeInput").value;
    const endTime = document.getElementById("scheduleEndTimeInput").value;

    if (!selectedDate || !startTime || !endTime) {
        alert("Please fill in all schedule fields.");
        return;
    }

    const formattedTimeRange = `${startTime} - ${endTime}`;

    const requests = JSON.parse(localStorage.getItem("session_requests")) || [];
    const index = requests.findIndex(r => r.id === reqId);

    if (index !== -1) {
        requests[index].status = "accepted";
        requests[index].date = selectedDate;
        requests[index].time = formattedTimeRange;
        localStorage.setItem("session_requests", JSON.stringify(requests));

        const currentUser = JSON.parse(localStorage.getItem('user'));
        const partnerName = requests[index].recipientId === currentUser.id ? requests[index].senderName : requests[index].recipientName;
        alert(`Session Scheduled with ${partnerName} for ${selectedDate} at ${formattedTimeRange}!`);
        closeScheduleModal();
        renderRequests();
    }
}

// Redirect to meeting room
function launchMeeting(reqId) {
    window.location.href = `session-room.html?id=${reqId}`;
}
