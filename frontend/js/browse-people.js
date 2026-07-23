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

let selectedCategory = "all";
let activeProfilesList = [];
let savedRequests = [];

document.addEventListener("DOMContentLoaded", () => {
    // 0. Check Database instance status
    checkDbStatus();

    // 1. Sync User Header info
    const user = JSON.parse(localStorage.getItem('user'));
    if (user) {
        document.getElementById('headerUserName').textContent = user.firstName;
        document.getElementById('headerUserRole').textContent = user.role.charAt(0).toUpperCase() + user.role.slice(1);
        document.getElementById('headerUserAvatar').textContent = (user.firstName.charAt(0) + user.lastName.charAt(0)).toUpperCase();
    }

    // 2. Fetch and render initial list from database (or fall back)
    fetchProfiles("");
});

// Fetch profiles list from SQLite database
async function fetchProfiles(searchQuery = "") {
    const user = JSON.parse(localStorage.getItem('user'));
    const userId = user ? user.id : 0;

    try {
        const reqsResponse = await fetch('/api/profile/session-requests', {
            method: 'GET',
            headers: {
                'X-User-Id': userId
            }
        });
        const reqsData = await reqsResponse.json();
        if (reqsResponse.ok && reqsData.success) {
            savedRequests = reqsData.requests;
        }
    } catch (err) {
        console.warn("Could not fetch session requests from backend:", err);
        savedRequests = [];
    }

    try {
        const response = await fetch(`/api/profile/search?query=${encodeURIComponent(searchQuery)}`, {
            method: 'GET',
            headers: {
                'X-User-Id': userId
            }
        });
        
        const data = await response.json();
        if (response.ok && data.success && data.profiles) {
            activeProfilesList = data.profiles;
        } else {
            activeProfilesList = [];
        }
    } catch (e) {
        console.error("Error fetching profiles:", e);
        activeProfilesList = [];
    }

    renderPeople();
}

// Category filtering selection
function selectCategory(e, category) {
    const chips = document.querySelectorAll('.filter-chip');
    chips.forEach(c => c.classList.remove('active'));
    e.currentTarget.classList.add('active');

    selectedCategory = category;
    renderPeople();
}

// Button search click trigger
function executeSearch() {
    const input = document.getElementById("searchInput");
    const query = input.value.trim();

    if (!query) {
        alert("Please enter a skill to search.");
        return;
    }

    fetchProfiles(query);
}

// Capture enter key on input
function handleSearchKey(event) {
    if (event.key === "Enter") {
        executeSearch();
    }
}

// Render cards
function renderPeople() {
    const grid = document.getElementById("peopleGrid");
    grid.innerHTML = "";

    // Apply category filters
    const filtered = activeProfilesList.filter(person => {
        if (selectedCategory === "all") return true;

        const catMap = {
            "Technology": ["javascript", "python", "react", "nodejs", "web", "sqlite", "postgresql", "programming", "code", "html", "css"],
            "Design": ["design", "figma", "wireframing", "ui", "ux", "web design", "layout"],
            "Languages": ["mandarin", "chinese", "conversational", "french", "spanish", "languages"],
            "Music": ["guitar", "music", "acoustic", "piano", "flute", "guitarist"],
            "Business": ["marketing", "seo", "copywriting", "ads", "digital marketing", "business"]
        };

        const targetSkills = person.skillsTeach.map(s => s.toLowerCase());
        const mappedKeywords = catMap[selectedCategory] || [];
        
        return targetSkills.some(s => mappedKeywords.some(kw => s.includes(kw)));
    });

    if (filtered.length === 0) {
        grid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 4rem; color: var(--text-light); background: var(--surface); border: 1px dashed var(--border); border-radius: var(--radius)">
                <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">🔍</div>
                <h3>No users found matching your search.</h3>
                <p style="font-size: 0.85rem; margin-top: 0.2rem;">Try typing another skill or category query.</p>
            </div>
        `;
        return;
    }

    filtered.forEach(person => {
        const card = document.createElement("div");
        card.className = "person-card";

        // Best Match Ribbon
        const ribbon = person.bestMatch ? `<div class="best-match-badge">Best Match</div>` : "";

        // Check if request was already sent to this person from the current user
        const currentUser = JSON.parse(localStorage.getItem('user'));
        const currentUserId = currentUser ? currentUser.id : null;
        const isSent = savedRequests.some(r => r.senderId == currentUserId && r.recipientId == person.id && r.status === 'pending');
        const btnText = isSent ? "Request Sent" : "Send Session Request";
        const btnClass = isSent ? "btn-request sent" : "btn-request";
        const btnDisabled = isSent ? "disabled" : "";

        card.innerHTML = `
            ${ribbon}
            <div class="card-profile-header">
                <img src="${person.avatar}" alt="${person.firstName}" class="card-avatar">
                <div class="profile-title-area">
                    <h3>${person.firstName} ${person.lastName}</h3>
                    <div class="username-tag">@${person.username}</div>
                    <div class="rating-bar">
                        <span class="star-icon">⭐</span>
                        <span>${person.rating}</span>
                    </div>
                </div>
            </div>
            <div class="card-bio">${person.bio}</div>
            
            <div class="skills-group">
                <h4>Teaches</h4>
                <div class="tags-wrap">
                    ${person.skillsTeach.map(s => `<span class="mini-tag teach">${s}</span>`).join("")}
                </div>
            </div>
            
            <div class="skills-group">
                <h4>Wants to Learn</h4>
                <div class="tags-wrap">
                    ${person.skillsLearn.map(s => `<span class="mini-tag learn">${s}</span>`).join("")}
                </div>
            </div>

            <div class="card-footer">
                <div class="cost-rate">
                    <span>1</span> Credit/hr
                </div>
                <button class="${btnClass}" ${btnDisabled} onclick="sendRequest('${person.id}', '${person.firstName} ${person.lastName}', '${person.skillsTeach[0]}', '${person.avatar}')">
                    ${btnText}
                </button>
            </div>
        `;

        grid.appendChild(card);
    });
}

// Send request action
function sendRequest(personId, fullName, skill, avatar) {
    const currentUser = JSON.parse(localStorage.getItem('user'));
    if (!currentUser) return;

    // Check duplicate first
    if (savedRequests.some(r => r.senderId == currentUser.id && r.recipientId == personId && r.status === 'pending')) {
        alert("A pending request was already sent to this user.");
        return;
    }

    openBookingModal(personId, fullName, skill, avatar);
}

// Booking Modal control
function openBookingModal(personId, fullName, skill, avatar) {
    document.getElementById("modalPersonId").value = personId;
    document.getElementById("modalPartnerFullName").value = fullName;
    document.getElementById("modalPartnerSkill").value = skill;
    document.getElementById("modalPartnerAvatarUrl").value = avatar;

    document.getElementById("modalPartnerAvatar").src = avatar;
    document.getElementById("modalPartnerAvatar").alt = fullName;
    document.getElementById("modalPartnerName").textContent = fullName;
    document.getElementById("modalSessionSkillLabel").innerHTML = `Teaches <span>${skill}</span>`;

    // Default values: 2 days from now
    const defaultDate = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    document.getElementById("bookingDateInput").value = defaultDate;
    document.getElementById("bookingStartTimeInput").value = "14:00";
    document.getElementById("bookingEndTimeInput").value = "15:00";

    document.getElementById("bookingModal").classList.add("active");
}

function closeBookingModal() {
    document.getElementById("bookingModal").classList.remove("active");
    document.getElementById("bookingForm").reset();
    
    // Restore button state
    const submitBtn = document.querySelector('#bookingForm .btn-modal-confirm');
    if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = "Send Request";
    }
}

function confirmBooking(event) {
    event.preventDefault();

    const currentUser = JSON.parse(localStorage.getItem('user'));
    if (!currentUser) {
        alert("You must be logged in to book a session.");
        return;
    }

    const personId = parseInt(document.getElementById("modalPersonId").value, 10);
    const fullName = document.getElementById("modalPartnerFullName").value;
    const skill = document.getElementById("modalPartnerSkill").value;
    const avatar = document.getElementById("modalPartnerAvatarUrl").value;

    const selectedDate = document.getElementById("bookingDateInput").value;
    const startTime = document.getElementById("bookingStartTimeInput").value;
    const endTime = document.getElementById("bookingEndTimeInput").value;

    if (!selectedDate || !startTime || !endTime) {
        alert("Please fill in all booking fields.");
        return;
    }

    const formattedTimeRange = `${startTime} - ${endTime}`;

    // Prevent double submission from concurrent clicks or race conditions
    if (savedRequests.some(r => r.senderId == currentUser.id && r.recipientId == personId && r.status === 'pending')) {
        alert("A pending request was already sent to this user.");
        closeBookingModal();
        return;
    }

    // Disable the submit button
    const submitBtn = event.target.querySelector('.btn-modal-confirm');
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = "Sending...";
    }

    // Send request to backend
    fetch('/api/profile/session-requests', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-User-Id': currentUser.id
        },
        body: JSON.stringify({
            recipientId: personId,
            recipientName: fullName,
            recipientAvatar: avatar,
            skill: skill,
            date: selectedDate,
            time: formattedTimeRange
        })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            alert(`Session Request sent to ${fullName} for learning ${skill} on ${selectedDate} at ${formattedTimeRange}!`);
            closeBookingModal();
            fetchProfiles(""); // Re-fetch to update button state
        } else {
            alert(data.message || "Failed to send session request.");
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = "Send Request";
            }
        }
    })
    .catch(err => {
        console.error("Error sending session request:", err);
        alert("Failed to connect to the server.");
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = "Send Request";
        }
    });
}
