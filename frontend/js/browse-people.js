// Initialize Dark Mode theme from localStorage
(function() {
    if (localStorage.getItem("dark_theme") === "true") {
        document.body.classList.add("dark-theme");
    }
})();

// Mock Data for Barter Learn Users
const mockPeople = [
    {
        id: 101,
        firstName: "Sarah",
        lastName: "Jenkins",
        username: "sarahj",
        avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&h=120&q=80",
        bio: "UI/UX Designer with 4 years of experience. Loving to teach design principles, wireframing, and Figma secrets.",
        categories: ["Design"],
        rating: 4.9,
        skillsTeach: ["UI/UX Design", "Figma", "Wireframing"],
        skillsLearn: ["JavaScript", "Python"],
        bestMatch: true
    },
    {
        id: 102,
        firstName: "Mateo",
        lastName: "Silva",
        username: "mateo_codes",
        avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&h=120&q=80",
        bio: "Senior backend developer specializing in Python, SQL, and database optimizations. Let's trade code queries!",
        categories: ["Technology"],
        rating: 4.8,
        skillsTeach: ["Python", "SQLite", "PostgreSQL"],
        skillsLearn: ["Acoustic Guitar", "French"],
        bestMatch: false
    },
    {
        id: 103,
        firstName: "Emily",
        lastName: "Chen",
        username: "emily_c",
        avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=120&h=120&q=80",
        bio: "Native Mandarin speaker, professional translator, and language trainer. Interactive conversational tutor.",
        categories: ["Languages"],
        rating: 4.9,
        skillsTeach: ["Mandarin", "Chinese Culture"],
        skillsLearn: ["React", "CSS Transitions"],
        bestMatch: true
    },
    {
        id: 104,
        firstName: "Carlos",
        lastName: "Mendez",
        username: "carlos_music",
        avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&h=120&q=80",
        bio: "Guitarist and composer. Teaching acoustic, electric, and basic music theory classes. All skill levels welcome!",
        categories: ["Music"],
        rating: 4.7,
        skillsTeach: ["Acoustic Guitar", "Music Theory"],
        skillsLearn: ["Web Design", "SEO Basics"],
        bestMatch: false
    },
    {
        id: 105,
        firstName: "Jessica",
        lastName: "Taylor",
        username: "jess_biz",
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&h=120&q=80",
        bio: "Digital marketer and business strategist. Learn how to launch ads, write copy, and grow social media channels.",
        categories: ["Business"],
        rating: 4.6,
        skillsTeach: ["Digital Marketing", "SEO", "Copywriting"],
        skillsLearn: ["JavaScript", "HTML/CSS"],
        bestMatch: false
    },
    {
        id: 106,
        firstName: "Arjun",
        lastName: "Mehta",
        username: "arjun_dev",
        avatar: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=120&h=120&q=80",
        bio: "Full stack engineer. I teach React development, node JS setups, and API building integrations.",
        categories: ["Technology"],
        rating: 4.9,
        skillsTeach: ["React", "NodeJS", "Web Development"],
        skillsLearn: ["Figma", "Digital Marketing"],
        bestMatch: true
    }
];

let selectedCategory = "all";
let activeProfilesList = [];

document.addEventListener("DOMContentLoaded", () => {
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
        const response = await fetch(`/api/profile/search?query=${encodeURIComponent(searchQuery)}`, {
            method: 'GET',
            headers: {
                'X-User-Id': userId
            }
        });
        
        const data = await response.json();
        if (response.ok && data.success) {
            activeProfilesList = data.profiles;
        } else {
            fallbackSearch(searchQuery);
        }
    } catch (e) {
        console.log("Using front-end mock fallback search due to:", e.message);
        fallbackSearch(searchQuery);
    }

    renderPeople();
}

function fallbackSearch(query) {
    if (!query) {
        activeProfilesList = [...mockPeople];
        return;
    }
    const cleanQuery = query.toLowerCase().trim();
    activeProfilesList = mockPeople.filter(person => {
        const fullName = `${person.firstName} ${person.lastName}`.toLowerCase();
        const username = person.username.toLowerCase();
        const teaches = person.skillsTeach.join(" ").toLowerCase();
        const learns = person.skillsLearn.join(" ").toLowerCase();

        return fullName.includes(cleanQuery) || 
               username.includes(cleanQuery) || 
               teaches.includes(cleanQuery) || 
               learns.includes(cleanQuery);
    });
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

    // Retrieve already sent requests from localStorage
    const savedRequests = JSON.parse(localStorage.getItem("session_requests")) || [];

    filtered.forEach(person => {
        const card = document.createElement("div");
        card.className = "person-card";

        // Best Match Ribbon
        const ribbon = person.bestMatch ? `<div class="best-match-badge">Best Match</div>` : "";

        // Check if request was already sent to this person from the current user
        const currentUser = JSON.parse(localStorage.getItem('user'));
        const currentUserId = currentUser ? currentUser.id : null;
        const isSent = savedRequests.some(r => r.senderId === currentUserId && r.recipientId === person.id && r.status === 'pending');
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
                <button class="${btnClass}" ${btnDisabled} onclick="sendRequest(${person.id}, '${person.firstName} ${person.lastName}', '${person.skillsTeach[0]}', '${person.avatar}')">
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
    const savedRequests = JSON.parse(localStorage.getItem("session_requests")) || [];
    if (savedRequests.some(r => r.senderId === currentUser.id && r.recipientId === personId && r.status === 'pending')) {
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

    const savedRequests = JSON.parse(localStorage.getItem("session_requests")) || [];
    
    // Prevent double submission from concurrent clicks or race conditions
    if (savedRequests.some(r => r.senderId === currentUser.id && r.recipientId === personId && r.status === 'pending')) {
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

    // Create session request object
    const newRequest = {
        id: Date.now(),
        senderId: currentUser.id,
        senderName: `${currentUser.firstName} ${currentUser.lastName}`,
        senderAvatar: currentUser.avatar || "../images/avatar1.jpg",
        recipientId: personId,
        recipientName: fullName,
        recipientAvatar: avatar,
        skill: skill,
        date: selectedDate,
        time: formattedTimeRange,
        status: "pending"
    };

    savedRequests.push(newRequest);
    localStorage.setItem("session_requests", JSON.stringify(savedRequests));

    alert(`Session Request sent to ${fullName} for learning ${skill} on ${selectedDate} at ${formattedTimeRange}!`);
    closeBookingModal();
    renderPeople();
}
