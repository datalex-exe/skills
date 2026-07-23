// Initialize Dark Mode theme from localStorage
(function() {
    if (localStorage.getItem("dark_theme") === "true") {
        document.body.classList.add("dark-theme");
    }
})();

// ========== SIDEBAR TOGGLE ==========
function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('open');
}

// ========== ANIMATED COUNTERS ==========
function animateCounter(element, target, duration = 1500) {
    const start = 0;
    const increment = target / (duration / 16);
    let current = start;

    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            current = target;
            clearInterval(timer);
        }
        element.textContent = Number.isInteger(target) ? Math.floor(current) : current.toFixed(1);
    }, 16);
}

// ========== PROGRESS CIRCLE ANIMATION ==========
function animateProgressCircles() {
    const circles = document.querySelectorAll('.progress-circle-bar');
    circles.forEach(circle => {
        const circumference = 2 * Math.PI * 40;
        circle.style.strokeDasharray = circumference;
        circle.style.strokeDashoffset = circumference;

        setTimeout(() => {
            circle.style.transition = 'stroke-dashoffset 1.5s ease';
            circle.style.strokeDashoffset = circumference * 0.25; // 75%
        }, 300);
    });
}

// ========== SKILL BAR ANIMATION ==========
function animateSkillBars() {
    const bars = document.querySelectorAll('.skill-bar-fill');
    bars.forEach((bar, index) => {
        const width = bar.style.width || getComputedStyle(bar).width;
        bar.style.width = '0%';
        setTimeout(() => {
            bar.style.transition = 'width 1s ease';
            bar.style.width = width;
        }, 500 + (index * 200));
    });
}

// ========== STAT CARDS ENTRANCE ==========
function animateStatCards() {
    const cards = document.querySelectorAll('.stat-card');
    cards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        setTimeout(() => {
            card.style.transition = 'all 0.5s ease';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, 200 + (index * 100));
    });
}

// ========== DARK CARDS ENTRANCE ==========
function animateDarkCards() {
    const cards = document.querySelectorAll('.dark-card');
    cards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateX(-20px)';
        setTimeout(() => {
            card.style.transition = 'all 0.6s ease';
            card.style.opacity = '1';
            card.style.transform = 'translateX(0)';
        }, 400 + (index * 150));
    });
}

// ========== ACTIVITY ITEMS STAGGER ==========
function animateActivities() {
    const items = document.querySelectorAll('.activity-item');
    items.forEach((item, index) => {
        item.style.opacity = '0';
        item.style.transform = 'translateX(-15px)';
        setTimeout(() => {
            item.style.transition = 'all 0.4s ease';
            item.style.opacity = '1';
            item.style.transform = 'translateX(0)';
        }, 600 + (index * 120));
    });
}

// ========== PERSON CARDS ENTRANCE ==========
function animatePersonCards() {
    const cards = document.querySelectorAll('.person-card');
    cards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'scale(0.9)';
        setTimeout(() => {
            card.style.transition = 'all 0.4s ease';
            card.style.opacity = '1';
            card.style.transform = 'scale(1)';
        }, 800 + (index * 100));
    });
}

// ========== SIDE CARDS ENTRANCE ==========
function animateSideCards() {
    const cards = document.querySelectorAll('.time-wallet, .calendar-card, .session-card, .contributors-card');
    cards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        setTimeout(() => {
            card.style.transition = 'all 0.6s ease';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, 300 + (index * 150));
    });
}

// ========== CONNECT BUTTON INTERACTION ==========
function setupConnectButtons() {
    document.querySelectorAll('.btn-connect').forEach(btn => {
        btn.addEventListener('click', function() {
            const originalText = this.textContent;
            this.textContent = '✓ Connected';
            this.style.background = '#10B981';
            this.style.pointerEvents = 'none';

            setTimeout(() => {
                this.textContent = originalText;
                this.style.background = '';
                this.style.pointerEvents = '';
            }, 2000);
        });
    });
}

// ========== CALENDAR DAY CLICK ==========
function setupCalendar() {
    document.querySelectorAll('.calendar-day:not(.other)').forEach(day => {
        day.addEventListener('click', function() {
            document.querySelectorAll('.calendar-day').forEach(d => d.classList.remove('active'));
            this.classList.add('active');
        });
    });
}

// ========== NAV ITEM CLICK ==========
function setupNavItems() {
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', function(e) {
            // Let the page navigate normally. Just style it briefly before unload.
            document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
            this.classList.add('active');
        });
    });
}

// ========== PEOPLE CAROUSEL NAVIGATION ==========
function setupCarousel() {
    const prevBtn = document.querySelector('.people-nav.prev');
    const nextBtn = document.querySelector('.people-nav.next');
    const carousel = document.querySelector('.people-carousel');

    if (prevBtn && nextBtn && carousel) {
        prevBtn.addEventListener('click', () => {
            carousel.scrollBy({ left: -200, behavior: 'smooth' });
        });
        nextBtn.addEventListener('click', () => {
            carousel.scrollBy({ left: 200, behavior: 'smooth' });
        });
    }
}

// ========== SPARKLINE ANIMATION ==========
function animateSparklines() {
    const sparklines = document.querySelectorAll('.stat-sparkline path');
    sparklines.forEach((path, index) => {
        const length = path.getTotalLength ? path.getTotalLength() : 100;
        path.style.strokeDasharray = length;
        path.style.strokeDashoffset = length;
        setTimeout(() => {
            path.style.transition = 'stroke-dashoffset 1s ease';
            path.style.strokeDashoffset = '0';
        }, 500 + (index * 200));
    });
}

// ========== HERO BANNER ENTRANCE ==========
function animateHero() {
    const hero = document.querySelector('.hero-banner');
    const heroContent = document.querySelector('.hero-content');
    const heroIllustration = document.querySelector('.hero-illustration');

    if (hero) {
        hero.style.opacity = '0';
        hero.style.transform = 'translateY(20px)';
        setTimeout(() => {
            hero.style.transition = 'all 0.8s ease';
            hero.style.opacity = '1';
            hero.style.transform = 'translateY(0)';
        }, 100);
    }

    if (heroContent) {
        heroContent.style.opacity = '0';
        heroContent.style.transform = 'translateX(-30px)';
        setTimeout(() => {
            heroContent.style.transition = 'all 0.6s ease 0.3s';
            heroContent.style.opacity = '1';
            heroContent.style.transform = 'translateX(0)';
        }, 300);
    }

    if (heroIllustration) {
        heroIllustration.style.opacity = '0';
        heroIllustration.style.transform = 'translateX(30px)';
        setTimeout(() => {
            heroIllustration.style.transition = 'all 0.6s ease 0.5s';
            heroIllustration.style.opacity = '1';
            heroIllustration.style.transform = 'translateX(0)';
        }, 500);
    }
}

// ========== WALLET CHART ANIMATION ==========
function animateWalletChart() {
    const chart = document.querySelector('.wallet-chart circle:last-child');
    if (chart) {
        const circumference = 2 * Math.PI * 40;
        chart.style.strokeDasharray = circumference;
        chart.style.strokeDashoffset = circumference;
        setTimeout(() => {
            chart.style.transition = 'stroke-dashoffset 1.5s ease';
            chart.style.strokeDashoffset = circumference * 0.25;
        }, 800);
    }
}

// ========== INIT ALL ==========
document.addEventListener('DOMContentLoaded', async function() {
    // Entrance animations for static shell elements
    animateHero();
    animateSideCards();
    setupCalendar();
    setupNavItems();
    setupCarousel();

    // Resolve user session
    let currentUser = JSON.parse(localStorage.getItem('user'));
    if (!currentUser) {
        // Fallback: If no user is logged in, auto-login with user ID 1 for testing
        currentUser = { id: 1, firstName: 'John', lastName: 'Doe', role: 'learner' };
        localStorage.setItem('user', JSON.stringify(currentUser));
    }

    // Sync header static items initially
    document.getElementById('headerUserName').textContent = currentUser.firstName;
    document.getElementById('headerUserRole').textContent = currentUser.role.charAt(0).toUpperCase() + currentUser.role.slice(1);
    document.getElementById('headerUserAvatar').textContent = (currentUser.firstName.charAt(0) + currentUser.lastName.charAt(0)).toUpperCase();
    document.getElementById('greetingName').textContent = `${currentUser.firstName} ${currentUser.lastName} 👋`;

    let skillsTeachCount = 0;
    let skillsLearnCount = 0;
    
    // Calculate rating dynamically from local storage user reviews
    let rating = 0.0;
    try {
        const storedReviews = localStorage.getItem("user_reviews");
        const reviewsList = storedReviews ? JSON.parse(storedReviews) : [];
        if (reviewsList.length > 0) {
            const sum = reviewsList.reduce((acc, r) => acc + r.rating, 0);
            rating = parseFloat((sum / reviewsList.length).toFixed(1));
        }
    } catch (e) {
        rating = 0.0;
    }

    // Calculate completed sessions dynamically from local storage session requests
    let completedSessions = 0;
    try {
        const sessions = JSON.parse(localStorage.getItem("session_requests")) || [];
        completedSessions = sessions.filter(s => s.status === 'completed').length;
    } catch (e) {
        completedSessions = 0;
    }

    try {
        // Fetch real database profile
        const response = await fetch('/api/profile', {
            method: 'GET',
            headers: {
                'X-User-Id': currentUser.id
            }
        });
        const data = await response.json();
        if (response.ok && data.success) {
            const p = data.profile;

            // Sync Header & Greeting
            document.getElementById('headerUserName').textContent = p.firstName;
            document.getElementById('headerUserRole').textContent = p.role.charAt(0).toUpperCase() + p.role.slice(1);
            document.getElementById('headerUserAvatar').textContent = (p.firstName.charAt(0) + p.lastName.charAt(0)).toUpperCase();
            document.getElementById('greetingName').textContent = `${p.firstName} ${p.lastName} 👋`;

            // Calculate skill counts
            skillsTeachCount = p.skillsTeach ? p.skillsTeach.split(',').map(s => s.trim()).filter(Boolean).length : 0;
            skillsLearnCount = p.skillsLearn ? p.skillsLearn.split(',').map(s => s.trim()).filter(Boolean).length : 0;
            
            // Add completed sessions count from database if higher
            completedSessions = Math.max(completedSessions, p.skillsTaughtCount || 0);

            // Set Time Wallet values (no dummy offsets)
            document.getElementById('walletAmount').textContent = p.creditsEarned;
            document.getElementById('walletEarned').textContent = p.creditsEarned;
            document.getElementById('walletSpent').textContent = 0;

            // Populate Skills Learn Progress List
            const progressSkillList = document.getElementById('progressSkillList');
            if (progressSkillList) {
                progressSkillList.innerHTML = '';
                const skillsLearn = p.skillsLearn ? p.skillsLearn.split(',').map(s => s.trim()).filter(Boolean) : [];
                if (skillsLearn.length === 0) {
                    progressSkillList.innerHTML = '<div style="font-size:0.85rem;color:#94A3B8;font-style:italic;padding:10px 0;">No learning skills added yet.</div>';
                } else {
                    const colors = ['purple', 'pink', 'orange', 'cyan'];
                    skillsLearn.forEach((skill, index) => {
                        const color = colors[index % colors.length];
                        const pct = Math.max(10, 100 - index * 20);
                        progressSkillList.innerHTML += `
                            <div class="skill-item">
                                <div class="skill-header">
                                    <span class="skill-name"><span class="skill-dot ${color}"></span> ${skill}</span>
                                    <span class="skill-percent">${pct}%</span>
                                </div>
                                <div class="skill-bar"><div class="skill-bar-fill ${color}" style="width: ${pct}%"></div></div>
                            </div>
                        `;
                    }
                );
                }
            }

            // Populate Recent Activity List
            const recentActivityList = document.getElementById('recentActivityList');
            if (recentActivityList) {
                recentActivityList.innerHTML = '';
                const activity = p.recentActivity || [];
                if (activity.length === 0) {
                    recentActivityList.innerHTML = '<div style="font-size:0.85rem;color:#94A3B8;font-style:italic;padding:10px 0;">No recent activity logs.</div>';
                } else {
                    const typeColors = {
                        'teach': 'purple',
                        'session': 'green',
                        'update': 'cyan',
                        'badge': 'pink',
                        'connect': 'blue'
                    };
                    activity.forEach(act => {
                        const color = typeColors[act.type] || 'purple';
                        recentActivityList.innerHTML += `
                            <div class="activity-item">
                                <div class="activity-icon ${color}">${act.icon || '✓'}</div>
                                <div class="activity-content">
                                    <div class="activity-text">${act.text}</div>
                                    <div class="activity-time">${act.time}</div>
                                </div>
                            </div>
                        `;
                    });
                }
            }

            // Populate Top Skill Contributors List dynamically
            const contributorsList = document.getElementById('contributorsList');
            if (contributorsList) {
                contributorsList.innerHTML = '';
                
                try {
                    const searchRes = await fetch('/api/profile/search', {
                        method: 'GET',
                        headers: {
                            'X-User-Id': currentUser.id
                        }
                    });
                    const searchData = await searchRes.json();
                    
                    if (searchRes.ok && searchData.success && searchData.profiles.length > 0) {
                        const topUsers = searchData.profiles
                            .sort((a, b) => (b.creditsEarned || 0) - (a.creditsEarned || 0))
                            .slice(0, 3);
                            
                        const ranks = ['gold', 'silver', 'bronze'];
                        topUsers.forEach((u, i) => {
                            const initials = (u.firstName.charAt(0) + (u.lastName ? u.lastName.charAt(0) : '')).toUpperCase();
                            const primarySkill = u.skillsTeach && u.skillsTeach.length > 0 ? u.skillsTeach[0] : 'Contributor';
                            const rankClass = ranks[i] || 'bronze';
                            
                            contributorsList.innerHTML += `
                                <div class="contributor-item">
                                    <div class="contributor-rank ${rankClass}">${i + 1}</div>
                                    <div class="contributor-avatar">${initials}</div>
                                    <div class="contributor-info">
                                        <div class="contributor-name">${u.firstName} ${u.lastName || ''}</div>
                                        <div class="contributor-skill">${primarySkill}</div>
                                    </div>
                                    <div class="contributor-points">
                                        <span>${u.creditsEarned || 0}</span>
                                        <span class="trophy">🏆</span>
                                    </div>
                                </div>
                            `;
                        });
                    } else {
                        contributorsList.innerHTML = '<div style="font-size:0.85rem;color:#94A3B8;font-style:italic;padding:20px;text-align:center;">No contributors this month yet.</div>';
                    }
                } catch (err) {
                    console.error('Error loading contributors:', err);
                    contributorsList.innerHTML = '<div style="font-size:0.85rem;color:#94A3B8;font-style:italic;padding:20px;text-align:center;">No contributors this month yet.</div>';
                }
            }

        } else {
            console.error('Error loading dashboard profile:', data.message);
            localStorage.removeItem('user');
            window.location.href = 'login.html';
        }
    } catch (err) {
        console.error('Error fetching dashboard profile data:', err);
        skillsTeachCount = 0;
        skillsLearnCount = 0;
        completedSessions = 0;
        rating = 0.0;
    }

    // Animate stats counter
    const statValues = document.querySelectorAll('.stat-value');
    const targets = [skillsTeachCount, skillsLearnCount, completedSessions, rating];
    statValues.forEach((el, i) => {
        animateCounter(el, targets[i]);
    });

    // Load upcoming session from LocalStorage
    const sessions = JSON.parse(localStorage.getItem("session_requests")) || [];
    const upcoming = sessions.find(s => s.status === 'accepted');
    const upcomingSessionContent = document.getElementById('upcomingSessionContent');
    if (upcomingSessionContent) {
        if (upcoming) {
            const initials = (upcoming.name.charAt(0) + (upcoming.name.split(' ')[1]?.charAt(0) || '')).toUpperCase();
            upcomingSessionContent.innerHTML = `
                <div class="session-avatar">${initials}</div>
                <div class="session-info">
                    <div class="session-title">${upcoming.skill}</div>
                    <div class="session-teacher">with ${upcoming.name}</div>
                    <div class="session-time">
                        <span>📅 ${upcoming.date}</span>
                        <span>⏱ ${upcoming.time}</span>
                    </div>
                </div>
                <button class="btn-join" onclick="window.open('session-room.html', '_blank')">
                    <span>▶</span>
                    <span>Join Session</span>
                    <span>→</span>
                </button>
            `;
        } else {
            upcomingSessionContent.innerHTML = `
                <div style="font-size:0.85rem;color:#94A3B8;font-style:italic;padding:20px 0;text-align:center;width:100%;">
                    No upcoming sessions scheduled.
                </div>
            `;
        }
    }

    // Fetch and populate People You May Want to Connect carousel
    try {
        const response = await fetch('/api/profile/search', {
            method: 'GET',
            headers: {
                'X-User-Id': currentUser.id
            }
        });
        const data = await response.json();
        const carousel = document.querySelector('.people-carousel');
        if (carousel && response.ok && data.success) {
            const profiles = data.profiles || [];
            
            // Keep nav buttons
            const prevBtn = carousel.querySelector('.people-nav.prev');
            const nextBtn = carousel.querySelector('.people-nav.next');
            
            // Remove hardcoded cards
            carousel.querySelectorAll('.person-card').forEach(card => card.remove());
            
            if (profiles.length === 0) {
                const noPeople = document.createElement('div');
                noPeople.style.cssText = 'grid-column: 1/-1; text-align: center; padding: 20px; color: #94A3B8; font-style: italic; width: 100%;';
                noPeople.innerHTML = 'No other users registered yet.';
                if (prevBtn) prevBtn.after(noPeople);
                else carousel.appendChild(noPeople);
            } else {
                const colors = ['pink', 'green', 'orange', 'blue'];
                profiles.slice(0, 5).forEach((p, idx) => {
                    const color = colors[idx % colors.length];
                    const initials = (p.firstName.charAt(0) + p.lastName.charAt(0)).toUpperCase();
                    const card = document.createElement('div');
                    card.className = 'person-card';
                    
                    let avatarHtml = `<div class="person-avatar">${initials}</div>`;
                    if (p.avatar && p.avatar.startsWith('http')) {
                        avatarHtml = `<img class="person-avatar" src="${p.avatar}" alt="${p.firstName}" style="object-fit: cover;">`;
                    }
                    
                    card.innerHTML = `
                        ${avatarHtml}
                        <div class="person-name">${p.firstName} ${p.lastName}</div>
                        <div class="person-role">${p.skillsTeach ? p.skillsTeach.slice(0, 2).join(', ') : 'Member'}</div>
                        <div class="person-rating">
                            <span class="star">⭐</span>
                            <span>4.8 (0)</span>
                        </div>
                        <button class="btn-connect ${color}" data-user-id="${p.id}">Connect</button>
                    `;
                    if (nextBtn) nextBtn.before(card);
                    else carousel.appendChild(card);
                });
            }
        }
    } catch (err) {
        console.error('Error loading people carousel:', err);
    }

    // Trigger remaining animations
    animateStatCards();
    animateDarkCards();
    animateActivities();
    animatePersonCards();

    // Progress animations trigger
    setTimeout(() => {
        animateProgressCircles();
        animateSkillBars();
        animateSparklines();
        animateWalletChart();
    }, 200);

    // Setup interactions
    setupConnectButtons();
});