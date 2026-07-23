// Initialize Dark Mode theme from localStorage
(function() {
    if (localStorage.getItem("dark_theme") === "true") {
        document.body.classList.add("dark-theme");
    }
})();

// Mock Inbox Conversations Data
const inboxThreads = [
    {
        id: 401,
        name: "Sarah Jenkins",
        avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&h=120&q=80",
        online: true,
        unread: 2,
        messages: [
            { sender: "them", text: "Hey! Are we still on for our Figma layout secrets session?" },
            { sender: "me", text: "Yes, absolutely! I've prepared a landing page mockup to work on." },
            { sender: "them", text: "Fantastic! I will show you how to build responsive auto layouts and nested grids." }
        ],
        sessionReminder: {
            skill: "Figma Layout Secrets",
            date: "Friday, July 23",
            time: "16:00 - 17:00"
        }
    },
    {
        id: 402,
        name: "Mateo Silva",
        avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&h=120&q=80",
        online: false,
        unread: 0,
        messages: [
            { sender: "me", text: "Hey Mateo, did you see my session request for Python database schemas?" },
            { sender: "them", text: "Hi! Yes, I just saw it. I'd love to swap. I'm free on Saturday." },
            { sender: "me", text: "Perfect, Saturday morning works for me!" }
        ]
    },
    {
        id: 403,
        name: "Emily Chen",
        avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=120&h=120&q=80",
        online: true,
        unread: 0,
        messages: [
            { sender: "them", text: "Nǐ hǎo! Thanks for scheduling the Mandarin conversational practice." },
            { sender: "me", text: "Nǐ hǎo Emily! Looking forward to learning basic greeting structures." }
        ],
        sessionReminder: {
            skill: "Conversational Mandarin",
            date: "Sunday, July 25",
            time: "09:00 - 10:00"
        }
    },
    {
        id: 404,
        name: "Jessica Taylor",
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&h=120&q=80",
        online: true,
        unread: 4,
        messages: [
            { sender: "them", text: "Hello! I saw you are teaching UI/UX design." },
            { sender: "them", text: "I'd love to review my app portfolio. Let me know if you have time credits available." }
        ]
    }
];

let activeThreadId = null;

document.addEventListener("DOMContentLoaded", () => {
    // 1. Sync User Header info
    const user = JSON.parse(localStorage.getItem('user'));
    if (user) {
        document.getElementById('headerUserName').textContent = user.firstName;
        document.getElementById('headerUserRole').textContent = user.role.charAt(0).toUpperCase() + user.role.slice(1);
        document.getElementById('headerUserAvatar').textContent = (user.firstName.charAt(0) + user.lastName.charAt(0)).toUpperCase();
    }

    // 2. Render Left sidebar inbox list
    renderInbox();
});

// Render user inbox list
function renderInbox() {
    const list = document.getElementById("usersList");
    list.innerHTML = "";

    inboxThreads.forEach(thread => {
        const card = document.createElement("div");
        card.className = `inbox-user-card ${thread.id === activeThreadId ? 'active' : ''}`;
        card.onclick = () => openConversation(thread.id);

        const onlineDot = thread.online ? `<div class="online-dot"></div>` : "";
        const unreadBadge = thread.unread > 0 ? `<div class="unread-msg-badge">${thread.unread}</div>` : "";
        const lastMsg = thread.messages.length > 0 ? thread.messages[thread.messages.length - 1].text : "No messages yet";

        card.innerHTML = `
            <div class="avatar-container">
                <img src="${thread.avatar}" alt="${thread.name}">
                ${onlineDot}
            </div>
            <div class="card-details-text">
                <h4>${thread.name}</h4>
                <p>${lastMsg}</p>
            </div>
            ${unreadBadge}
        `;

        list.appendChild(card);
    });
}

// Open active thread chat window
function openConversation(threadId) {
    activeThreadId = threadId;
    const thread = inboxThreads.find(t => t.id === threadId);
    if (!thread) return;

    // Clear unread badge
    thread.unread = 0;
    renderInbox();

    // Setup Active Header
    const avatarImg = document.getElementById("chatHeaderAvatar");
    avatarImg.src = thread.avatar;
    avatarImg.style.display = "block";

    document.getElementById("chatHeaderName").textContent = thread.name;
    const statusSpan = document.getElementById("chatHeaderStatus");
    statusSpan.textContent = thread.online ? "● Online" : "Offline";
    statusSpan.className = thread.online ? "user-status-text" : "user-status-text offline";

    // Show Chat input form
    document.getElementById("chatForm").style.display = "flex";

    // Render Messages feed
    renderMessages(thread);
}

// Render Messages thread list
function renderMessages(thread) {
    const feed = document.getElementById("chatMessagesFeed");
    feed.innerHTML = "";

    // Load reminder cards
    if (thread.sessionReminder) {
        const rem = thread.sessionReminder;
        const reminder = document.createElement("div");
        reminder.className = "message-reminder-card";
        reminder.innerHTML = `
            <div class="reminder-header">🔔 Scheduled Barter Call</div>
            <div class="reminder-body">
                <h4>${rem.skill}</h4>
                <p>Private session room with ${thread.name}</p>
                <div class="reminder-time">📅 ${rem.date} &nbsp;|&nbsp; 🕒 ${rem.time}</div>
            </div>
        `;
        feed.appendChild(reminder);
    }

    // Load bubbles
    thread.messages.forEach(msg => {
        const bubble = document.createElement("div");
        bubble.className = `message-bubble ${msg.sender === 'me' ? 'outgoing' : 'incoming'}`;
        bubble.textContent = msg.text;
        feed.appendChild(bubble);
    });

    // Scroll to bottom
    setTimeout(() => {
        feed.scrollTop = feed.scrollHeight;
    }, 50);
}

// Send Message handler
function sendMessage(e) {
    e.preventDefault();
    const input = document.getElementById("chatInput");
    const val = input.value.trim();
    if (!val || activeThreadId === null) return;

    const thread = inboxThreads.find(t => t.id === activeThreadId);
    if (!thread) return;

    // Append outgoing bubble
    thread.messages.push({ sender: "me", text: val });
    input.value = "";

    // Rerender chat window and list
    renderMessages(thread);
    renderInbox();

    // Emulate Automated chatbot reply after 1.5 seconds
    setTimeout(() => {
        if (activeThreadId === thread.id) {
            thread.messages.push({
                sender: "them",
                text: "Got it! Thanks for the update. Let's touch base soon!"
            });
            renderMessages(thread);
            renderInbox();
        }
    }, 1500);
}
