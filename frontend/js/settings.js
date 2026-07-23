// Active user session data
let currentUser = null;

document.addEventListener("DOMContentLoaded", () => {
    // 1. Sync User Header info
    try {
        currentUser = JSON.parse(localStorage.getItem('user'));
    } catch (err) {
        currentUser = null;
    }
    if (currentUser) {
        document.getElementById('headerUserName').textContent = currentUser.firstName;
        document.getElementById('headerUserRole').textContent = currentUser.role.charAt(0).toUpperCase() + currentUser.role.slice(1);
        document.getElementById('headerUserAvatar').textContent = (currentUser.firstName.charAt(0) + currentUser.lastName.charAt(0)).toUpperCase();
        
        // 2. Fetch profile data from db
        fetchSettingsDetails(currentUser.id);
    }

    // 3. Load Dark mode preference
    initDarkMode();
});

// Fetch active user records from SQLite
async function fetchSettingsDetails(userId) {
    try {
        const response = await fetch('/api/profile', {
            method: 'GET',
            headers: {
                'X-User-Id': userId
            }
        });

        const data = await response.json();

        if (response.ok && data.success) {
            const p = data.profile;
            // Populate account fields
            document.getElementById('firstNameInput').value = p.firstName;
            document.getElementById('lastNameInput').value = p.lastName;
            document.getElementById('usernameInput').value = p.username;
            document.getElementById('emailInput').value = p.email;
            document.getElementById('roleSelect').value = p.role;
        }
    } catch (error) {
        console.error('Fetch settings details error:', error);
    }
}

// Tab Switching
function switchSettingsTab(e, tabId) {
    e.preventDefault();
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabBtns.forEach(btn => btn.classList.remove('active'));
    tabContents.forEach(content => content.classList.remove('active'));
    
    e.currentTarget.classList.add('active');
    document.getElementById(tabId).classList.add('active');
}

// Dark Mode Toggle Logic
function initDarkMode() {
    const toggle = document.getElementById("darkModeCheck");
    const isDark = localStorage.getItem("dark_theme") === "true";
    toggle.checked = isDark;
    
    if (isDark) {
        document.body.classList.add("dark-theme");
    }

    toggle.addEventListener("change", () => {
        if (toggle.checked) {
            document.body.classList.add("dark-theme");
            localStorage.setItem("dark_theme", "true");
        } else {
            document.body.classList.remove("dark-theme");
            localStorage.setItem("dark_theme", "false");
        }
    });
}

// Save Settings Form
async function saveSettings(e) {
    e.preventDefault();

    const firstName = document.getElementById("firstNameInput").value.trim();
    const lastName = document.getElementById("lastNameInput").value.trim();
    const role = document.getElementById("roleSelect").value;

    const currentPass = document.getElementById("currentPasswordInput").value;
    const newPass = document.getElementById("newPasswordInput").value;
    const confirmNewPass = document.getElementById("confirmNewPasswordInput").value;

    // 1. Password change validation
    if (newPass || currentPass || confirmNewPass) {
        if (!currentPass) {
            alert("Current password is required to change password.");
            return;
        }
        if (newPass !== confirmNewPass) {
            alert("New passwords do not match.");
            return;
        }
        if (newPass.length < 6) {
            alert("New password must be at least 6 characters.");
            return;
        }
    }

    // 2. Submit account detail changes to SQLite
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
                role,
                currentPassword: currentPass || undefined,
                newPassword: newPass || undefined
            })
        });

        const data = await response.json();

        if (response.ok && data.success) {
            // Update session data
            currentUser.firstName = firstName;
            currentUser.lastName = lastName;
            currentUser.role = role;
            localStorage.setItem('user', JSON.stringify(currentUser));

            // Sync Header
            document.getElementById('headerUserName').textContent = firstName;
            document.getElementById('headerUserRole').textContent = role.charAt(0).toUpperCase() + role.slice(1);
            document.getElementById('headerUserAvatar').textContent = (firstName.charAt(0) + lastName.charAt(0)).toUpperCase();

            // Clear password fields
            document.getElementById("currentPasswordInput").value = "";
            document.getElementById("newPasswordInput").value = "";
            document.getElementById("confirmNewPasswordInput").value = "";

            alert("Settings saved successfully!");
        } else {
            alert(data.message || "Error saving account details.");
        }

    } catch (error) {
        console.error("Save settings error:", error);
        alert("Could not connect to the server. Please check your connection.");
    }
}

// Perform Logout
function performLogout() {
    if (confirm("Are you sure you want to log out?")) {
        localStorage.removeItem("user");
        alert("Logged out successfully! Redirecting to login page...");
        window.location.href = "login.html";
    }
}
