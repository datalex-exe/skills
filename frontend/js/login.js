// Initialize Dark Mode theme from localStorage
(function() {
    if (localStorage.getItem("dark_theme") === "true") {
        document.body.classList.add("dark-theme");
    }
})();

function togglePassword() {
    const input = document.getElementById('passwordInput');
    const btn = event.currentTarget;
    if (input.type === 'password') {
        input.type = 'text';
        btn.textContent = '🙈';
    } else {
        input.type = 'password';
        btn.textContent = '👁️';
    }
}

async function handleLogin(e) {
    e.preventDefault();

    // 1. Get input values
    const email = document.getElementById('emailInput').value.trim();
    const password = document.getElementById('passwordInput').value;

    // 2. Disable submit button & show loading state
    const btn = e.target.querySelector('.btn-submit');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<span>Logging in...</span>';
    btn.disabled = true;

    try {
        // 3. Send request to backend
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok && data.success) {
            // Save user details to localStorage if needed
            localStorage.setItem('user', JSON.stringify(data.user));

            alert('Login successful! Redirecting to dashboard...');
            // Redirect user to dashboard
            window.location.href = 'dashboard.html';
        } else {
            alert(data.message || 'Login failed. Please check your credentials.');
        }

    } catch (error) {
        console.error('Login Fetch Error:', error);
        alert('Could not connect to the server. Please check your connection.');
    } finally {
        // 4. Restore submit button
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}

function handleGoogleLogin() {
    alert('Google login would open OAuth popup here.');
}