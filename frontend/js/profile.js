// Initialize Dark Mode theme from localStorage
(function() {
    if (localStorage.getItem("dark_theme") === "true") {
        document.body.classList.add("dark-theme");
    }
})();

// Active user session data
let currentUser = null;
let skillsTeachList = [];
let skillsLearnList = [];
let avatarBase64 = '';

document.addEventListener('DOMContentLoaded', () => {
    // 1. Resolve active user session or redirect
    try {
        currentUser = JSON.parse(localStorage.getItem('user'));
    } catch (err) {
        currentUser = null;
    }
    if (!currentUser) {
        // Fallback: If no user is logged in, auto-login with user ID 1 for testing
        currentUser = { id: 1, firstName: 'John', lastName: 'Doe', role: 'learner' };
        localStorage.setItem('user', JSON.stringify(currentUser));
    }

    // Synchronously sync initial session details to avoid flashing dummy data
    if (document.getElementById('headerUserName')) document.getElementById('headerUserName').textContent = currentUser.firstName;
    if (document.getElementById('headerUserRole')) document.getElementById('headerUserRole').textContent = currentUser.role.charAt(0).toUpperCase() + currentUser.role.slice(1);
    
    const initialLetters = (currentUser.firstName.charAt(0) + (currentUser.lastName ? currentUser.lastName.charAt(0) : '')).toUpperCase();
    if (document.getElementById('headerUserAvatar')) document.getElementById('headerUserAvatar').textContent = initialLetters;

    if (document.getElementById('displayFullName')) document.getElementById('displayFullName').textContent = `${currentUser.firstName} ${currentUser.lastName || ''}`;
    if (document.getElementById('displayUsername')) document.getElementById('displayUsername').textContent = currentUser.username ? `@${currentUser.username}` : '';

    // 2. Fetch profile data
    fetchProfileData();

    // 3. Setup avatar upload listener
    setupAvatarUpload();
});

// Switch Tabs (Personal Details vs Skills Inventory)
function switchTab(e, tabId) {
    if (e && e.preventDefault) {
        e.preventDefault();
    }
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabBtns.forEach(btn => btn.classList.remove('active'));
    tabContents.forEach(content => content.classList.remove('active'));
    
    const clickedBtn = (e && e.currentTarget) ? e.currentTarget : (e && e.target ? e.target : null);
    if (clickedBtn) {
        clickedBtn.classList.add('active');
    }
    
    const tabContent = document.getElementById(tabId);
    if (tabContent) {
        tabContent.classList.add('active');
    }
}

// Fetch user profile from SQLite
async function fetchProfileData() {
    try {
        const response = await fetch('/api/profile', {
            method: 'GET',
            headers: {
                'X-User-Id': currentUser.id
            }
        });

        const data = await response.json();

        if (response.ok && data.success) {
            const p = data.profile;

            // Update Header Display
            document.getElementById('headerUserName').textContent = p.firstName;
            document.getElementById('headerUserRole').textContent = p.role.charAt(0).toUpperCase() + p.role.slice(1);
            
            // Generate letters for avatar fallback icon
            const initialLetters = (p.firstName.charAt(0) + p.lastName.charAt(0)).toUpperCase();
            document.getElementById('headerUserAvatar').textContent = initialLetters;

            // Update Left Column Card
            document.getElementById('displayFullName').textContent = `${p.firstName} ${p.lastName}`;
            document.getElementById('displayUsername').textContent = `@${p.username}`;
            document.getElementById('displayBioShort').textContent = p.bio || 'No bio description set yet.';
            
            // Set Avatar image
            if (p.avatar) {
                document.getElementById('avatarImage').src = p.avatar;
                avatarBase64 = p.avatar;
            } else {
                // Default avatar image placeholder
                document.getElementById('avatarImage').src = `https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&h=150&q=80`;
            }

            // Update Statistics
            document.getElementById('statCredits').textContent = p.creditsEarned;
            document.getElementById('statTaught').textContent = p.skillsTaughtCount;
            document.getElementById('statLearned').textContent = p.hoursLearned;

            // Populate Form Fields
            document.getElementById('firstNameInput').value = p.firstName;
            document.getElementById('lastNameInput').value = p.lastName;
            document.getElementById('usernameInput').value = p.username;
            document.getElementById('emailInput').value = p.email;
            document.getElementById('roleSelect').value = p.role;
            document.getElementById('bioTextarea').value = p.bio;

            // Load Skills
            skillsTeachList = p.skillsTeach ? p.skillsTeach.split(',').map(s => s.trim()).filter(Boolean) : [];
            skillsLearnList = p.skillsLearn ? p.skillsLearn.split(',').map(s => s.trim()).filter(Boolean) : [];
            renderSkills('Teach');
            renderSkills('Learn');

            // Render Achievements
            renderAchievements(p.achievements);

            // Render Activity Timeline
            renderTimeline(p.recentActivity);

        } else {
            console.error('Error fetching profile details:', data.message);
            localStorage.removeItem('user');
            window.location.href = 'login.html';
        }

    } catch (error) {
        console.error('Fetch Profile Error:', error);
    }
}

// Render Skills tags
function renderSkills(type) {
    const container = document.getElementById(`skills${type}Container`);
    const list = type === 'Teach' ? skillsTeachList : skillsLearnList;
    container.innerHTML = '';

    if (list.length === 0) {
        container.innerHTML = `<span style="font-size:0.8rem; color:#94A3B8; font-style:italic;">No skills added yet.</span>`;
        return;
    }

    list.forEach((skill, index) => {
        const tag = document.createElement('span');
        tag.className = 'skill-tag';
        tag.innerHTML = `
            <span>${skill}</span>
            <button type="button" class="btn-tag-remove" onclick="removeSkillTag('${type}', ${index})">✕</button>
        `;
        container.appendChild(tag);
    });
}

// Add Skill tag
function addSkillTag(type) {
    const input = document.getElementById(`skills${type}Input`);
    const val = input.value.trim();
    if (!val) return;

    const list = type === 'Teach' ? skillsTeachList : skillsLearnList;

    // Avoid duplicates
    if (!list.some(s => s.toLowerCase() === val.toLowerCase())) {
        list.push(val);
        renderSkills(type);
    }

    input.value = '';
}

// Remove Skill tag
function removeSkillTag(type, index) {
    const list = type === 'Teach' ? skillsTeachList : skillsLearnList;
    list.splice(index, 1);
    renderSkills(type);
}

// Render Achievements List
function renderAchievements(list) {
    const container = document.getElementById('achievementsList');
    container.innerHTML = '';

    if (!list || list.length === 0) {
        container.innerHTML = `<p style="font-size:0.8rem; color:#94A3B8; font-style:italic;">No achievements unlocked yet.</p>`;
        return;
    }

    list.forEach(ach => {
        const div = document.createElement('div');
        div.className = 'achievement-item';
        div.innerHTML = `
            <div class="achievement-icon">${ach.icon}</div>
            <div class="achievement-info">
                <h4>${ach.title}</h4>
                <p>${ach.description}</p>
            </div>
        `;
        container.appendChild(div);
    });
}

// Render Activity Timeline
function renderTimeline(list) {
    const container = document.getElementById('timelineContainer');
    container.innerHTML = '';

    if (!list || list.length === 0) {
        container.innerHTML = `<p style="font-size:0.8rem; color:#94A3B8; font-style:italic;">No activity logs found.</p>`;
        return;
    }

    list.forEach(act => {
        const div = document.createElement('div');
        div.className = 'timeline-item';
        
        let markerClass = '';
        if (act.type === 'update') markerClass = 'update';
        else if (act.type === 'session') markerClass = 'session';
        else if (act.type === 'teach') markerClass = 'teach';
        else if (act.type === 'badge') markerClass = 'badge';

        div.innerHTML = `
            <div class="timeline-marker ${markerClass}">${act.icon}</div>
            <div class="timeline-content">
                <div class="timeline-time">${act.time}</div>
                <div class="timeline-text">${act.text}</div>
            </div>
        `;
        container.appendChild(div);
    });
}

// Setup local Avatar photo selection emulating upload
function setupAvatarUpload() {
    const fileInput = document.getElementById('avatarUploadInput');
    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Size check (limit to ~2MB for SQLite efficiency)
        if (file.size > 2 * 1024 * 1024) {
            alert('Please select an image smaller than 2MB.');
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            const base64String = event.target.result;
            // Update UI preview
            document.getElementById('avatarImage').src = base64String;
            avatarBase64 = base64String;
        };
        reader.readAsDataURL(file);
    });
}

// Save Changes to SQLite DB
async function saveProfileChanges(e) {
    e.preventDefault();

    const firstName = document.getElementById('firstNameInput').value.trim();
    const lastName = document.getElementById('lastNameInput').value.trim();
    const role = document.getElementById('roleSelect').value;
    const bio = document.getElementById('bioTextarea').value.trim();

    // Serialize skills arrays into comma-separated strings
    const skillsTeach = skillsTeachList.join(',');
    const skillsLearn = skillsLearnList.join(',');

    // Disable Save button
    const saveBtn = document.getElementById('btnSaveProfile');
    const originalContent = saveBtn.innerHTML;
    saveBtn.innerHTML = '<span>💾 Saving changes...</span>';
    saveBtn.disabled = true;

    try {
        const response = await fetch('/api/profile/update', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-User-Id': currentUser.id
            },
            body: JSON.stringify({
                firstName,
                lastName,
                bio,
                avatar: avatarBase64,
                role,
                skillsTeach,
                skillsLearn
            })
        });

        const data = await response.json();

        if (response.ok && data.success) {
            alert(data.message || 'Profile saved successfully!');
            // Update session data
            currentUser.firstName = firstName;
            currentUser.lastName = lastName;
            currentUser.role = role;
            localStorage.setItem('user', JSON.stringify(currentUser));

            // Reload profile data (updates logs, display stats and fields)
            fetchProfileData();
        } else {
            alert(data.message || 'Error updating profile. Please try again.');
        }

    } catch (error) {
        console.error('Update Profile Fetch Error:', error);
        alert('Could not save changes. Please try again.');
    } finally {
        saveBtn.innerHTML = originalContent;
        saveBtn.disabled = false;
    }
}
