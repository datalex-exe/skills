// Initialize Dark Mode theme from localStorage
(function() {
    if (localStorage.getItem("dark_theme") === "true") {
        document.body.classList.add("dark-theme");
    }
})();

// Synchronously/Asynchronously verify database instance to clear stale requests on server restart
function checkDbStatus() {
    fetch('/api/status')
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                const localDbId = localStorage.getItem("db_instance_id");
                localStorage.setItem("db_instance_id", data.dbInstanceId);
                if (localDbId && localDbId !== data.dbInstanceId) {
                    console.log("🔄 Database reset detected. Resetting local session requests...");
                    localStorage.removeItem("session_requests");
                    window.location.reload();
                }
            }
        })
        .catch(err => console.warn("Could not contact status endpoint:", err));
}

// Default Session Requests if localStorage is empty
const defaultRequests = [];

let activeTab = "incoming";
let requests = [];

document.addEventListener("DOMContentLoaded", async () => {
    // 0. Check Database instance status
    checkDbStatus();

    // 1. Sync User Header info
    const user = JSON.parse(localStorage.getItem('user'));
    if (user) {
        document.getElementById('headerUserName').textContent = user.firstName;
        document.getElementById('headerUserRole').textContent = user.role.charAt(0).toUpperCase() + user.role.slice(1);
        document.getElementById('headerUserAvatar').textContent = (user.firstName.charAt(0) + user.lastName.charAt(0)).toUpperCase();
    }

    // 2. Fetch and render requests from database
    await fetchSessionRequests();
});

// Fetch session requests from backend SQLite
async function fetchSessionRequests() {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) return;

    try {
        const response = await fetch('/api/profile/session-requests', {
            method: 'GET',
            headers: {
                'X-User-Id': user.id
            }
        });
        const data = await response.json();
        if (response.ok && data.success) {
            requests = data.requests;
        }
    } catch (err) {
        console.error("Error fetching session requests:", err);
        // Fallback to local storage
        requests = JSON.parse(localStorage.getItem("session_requests")) || [];
    }

    renderRequests();
}

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
    const currentUser = JSON.parse(localStorage.getItem('user'));

    if (!currentUser) {
        listContainer.innerHTML = `<div style="text-align:center; padding: 2rem;">Please log in to view session requests.</div>`;
        return;
    }

    // Update Counts
    const incomingCount = requests.filter(r => r.recipientId == currentUser.id && r.status === "pending").length;
    const outgoingCount = requests.filter(r => r.senderId == currentUser.id && r.status === "pending").length;
    const scheduledCount = requests.filter(r => r.status === "accepted" && (r.senderId == currentUser.id || r.recipientId == currentUser.id)).length;

    document.getElementById("incomingCount").textContent = incomingCount;
    document.getElementById("outgoingCount").textContent = outgoingCount;
    document.getElementById("scheduledCount").textContent = scheduledCount;

    listContainer.innerHTML = "";

    // Filter by active tab
    let filtered = [];
    if (activeTab === "incoming") {
        filtered = requests.filter(r => r.recipientId == currentUser.id && r.status === "pending");
    } else if (activeTab === "outgoing") {
        filtered = requests.filter(r => r.senderId == currentUser.id && r.status === "pending");
    } else if (activeTab === "scheduled") {
        filtered = requests.filter(r => r.status === "accepted" && (r.senderId == currentUser.id || r.recipientId == currentUser.id));
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

        const isIncoming = req.recipientId == currentUser.id;
        const partnerName = isIncoming ? req.senderName : req.recipientName;
        const partnerAvatar = isIncoming ? req.senderAvatar : req.recipientAvatar;

        // Header Skill Label wording
        const roleLabel = isIncoming ? "Wants to learn" : "You requested to learn";

        // Action Buttons / Status layout
        let actionMarkup = "";
        if (activeTab === "incoming") {
            actionMarkup = `
                <button class="btn-action-accept" onclick="updateStatus('${req.id}', 'accepted')">Accept</button>
                <button class="btn-action-reject" onclick="updateStatus('${req.id}', 'rejected')">Decline</button>
            `;
        } else if (activeTab === "outgoing") {
            actionMarkup = `<span class="status-badge pending">Pending</span>`;
        } else if (activeTab === "scheduled") {
            actionMarkup = `
                <button class="btn-action-meeting" onclick="launchMeeting('${req.id}')">💻 Launch Call</button>
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

    const currentUser = JSON.parse(localStorage.getItem('user'));
    if (!currentUser) return;

    const req = requests.find(r => r.id == reqId);
    if (!req) return;

    fetch('/api/profile/session-requests/update', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-User-Id': currentUser.id
        },
        body: JSON.stringify({
            reqId: reqId,
            status: newStatus
        })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            req.status = newStatus;
            const partnerName = req.recipientId == currentUser.id ? req.senderName : req.recipientName;
            alert(`Session Request from ${partnerName} declined.`);
            fetchSessionRequests();
        } else {
            alert(data.message || "Failed to update session request status.");
        }
    })
    .catch(err => {
        console.error("Error updating session request:", err);
        // Fallback locally
        req.status = newStatus;
        localStorage.setItem("session_requests", JSON.stringify(requests));
        const partnerName = req.recipientId == currentUser.id ? req.senderName : req.recipientName;
        alert(`[Offline] Session Request from ${partnerName} declined.`);
        renderRequests();
    });
}

// Modal management
function openScheduleModal(reqId) {
    const req = requests.find(r => r.id == reqId);
    if (!req) return;

    const currentUser = JSON.parse(localStorage.getItem('user'));
    const isIncoming = req.recipientId == currentUser.id;
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

    const reqId = document.getElementById("modalReqId").value;
    const selectedDate = document.getElementById("scheduleDateInput").value;
    const startTime = document.getElementById("scheduleStartTimeInput").value;
    const endTime = document.getElementById("scheduleEndTimeInput").value;

    if (!selectedDate || !startTime || !endTime) {
        alert("Please fill in all schedule fields.");
        return;
    }

    const formattedTimeRange = `${startTime} - ${endTime}`;
    const currentUser = JSON.parse(localStorage.getItem('user'));
    if (!currentUser) return;

    fetch('/api/profile/session-requests/update', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-User-Id': currentUser.id
        },
        body: JSON.stringify({
            reqId: reqId,
            status: "accepted",
            date: selectedDate,
            time: formattedTimeRange
        })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            const req = requests.find(r => r.id == reqId);
            if (req) {
                req.status = "accepted";
                req.date = selectedDate;
                req.time = formattedTimeRange;
            }
            const partnerName = req && req.recipientId == currentUser.id ? req.senderName : (req ? req.recipientName : "Partner");
            alert(`Session Scheduled with ${partnerName} for ${selectedDate} at ${formattedTimeRange}!`);
            closeScheduleModal();
            fetchSessionRequests();
        } else {
            alert(data.message || "Failed to confirm schedule.");
        }
    })
    .catch(err => {
        console.error("Error scheduling session:", err);
        // Local fallback
        const req = requests.find(r => r.id == reqId);
        if (req) {
            req.status = "accepted";
            req.date = selectedDate;
            req.time = formattedTimeRange;
            localStorage.setItem("session_requests", JSON.stringify(requests));
            const partnerName = req.recipientId == currentUser.id ? req.senderName : req.recipientName;
            alert(`[Offline] Session Scheduled with ${partnerName} for ${selectedDate} at ${formattedTimeRange}!`);
        }
        closeScheduleModal();
        renderRequests();
    });
}

// Redirect to meeting room
function launchMeeting(reqId) {
    window.location.href = `session-room.html?id=${reqId}`;
}
