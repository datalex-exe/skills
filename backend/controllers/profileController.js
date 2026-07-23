const bcrypt = require('bcrypt');
const { dbQuery } = require('../config/db');

// Get Profile Controller
exports.getProfile = async (req, res) => {
    try {
        const userId = req.headers['x-user-id'];

        if (!userId) {
            return res.status(400).json({ success: false, message: 'User ID is required in headers.' });
        }

        const user = await dbQuery.get('SELECT * FROM users WHERE id = ?', [userId]);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found.' });
        }

        // Parse JSON fields or use defaults (ensuring they are arrays)
        let achievements = [];
        try {
            const parsed = user.achievements ? JSON.parse(user.achievements) : null;
            achievements = Array.isArray(parsed) ? parsed : [];
        } catch (e) {
            achievements = [];
        }

        let recentActivity = [];
        try {
            const parsed = user.recent_activity ? JSON.parse(user.recent_activity) : null;
            recentActivity = Array.isArray(parsed) ? parsed : [];
        } catch (e) {
            recentActivity = [];
        }

        return res.status(200).json({
            success: true,
            profile: {
                id: user.id,
                firstName: user.first_name,
                lastName: user.last_name,
                username: user.username,
                email: user.email,
                role: user.role,
                bio: user.bio || '',
                avatar: user.avatar || '',
                skillsTeach: user.skills_teach || '',
                skillsLearn: user.skills_learn || '',
                creditsEarned: user.credits_earned !== null ? user.credits_earned : 15,
                skillsTaughtCount: user.skills_taught_count !== null ? user.skills_taught_count : 45,
                hoursLearned: user.hours_learned !== null ? user.hours_learned : 78,
                achievements,
                recentActivity
            }
        });

    } catch (error) {
        console.error('❌ Get Profile Error:', error);
        return res.status(500).json({ success: false, message: 'An internal server error occurred.' });
    }
};

// Update Profile Controller
exports.updateProfile = async (req, res) => {
    try {
        const userId = req.headers['x-user-id'];
        const { firstName, lastName, bio, avatar, role, skillsTeach, skillsLearn, currentPassword, newPassword } = req.body;

        if (!userId) {
            return res.status(400).json({ success: false, message: 'User ID is required in headers.' });
        }

        // Validate basic details
        if (!firstName || !lastName || !role) {
            return res.status(400).json({ success: false, message: 'First name, last name, and role are required.' });
        }

        // Fetch current user row for logs/activity
        const user = await dbQuery.get('SELECT * FROM users WHERE id = ?', [userId]);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found.' });
        }

        // Validate and hash password update if requested
        let hashedPassword = user.password;
        if (newPassword) {
            if (!currentPassword) {
                return res.status(400).json({ success: false, message: 'Current password is required to change password.' });
            }
            const isMatch = await bcrypt.compare(currentPassword, user.password);
            if (!isMatch) {
                return res.status(401).json({ success: false, message: 'Incorrect current password.' });
            }
            hashedPassword = await bcrypt.hash(newPassword, 10);
        }

        // Preserve existing fields if they are not provided (e.g. when saving settings from settings tab)
        const updatedBio = bio !== undefined ? bio : (user.bio || '');
        const updatedAvatar = avatar !== undefined ? avatar : (user.avatar || '');
        const updatedSkillsTeach = skillsTeach !== undefined ? skillsTeach : (user.skills_teach || '');
        const updatedSkillsLearn = skillsLearn !== undefined ? skillsLearn : (user.skills_learn || '');

        // Prepare new activity logs (ensuring it is an array)
        let recentActivity = [];
        try {
            const parsed = user.recent_activity ? JSON.parse(user.recent_activity) : null;
            recentActivity = Array.isArray(parsed) ? parsed : [];
        } catch (e) {
            recentActivity = [];
        }

        // Add update activity log at the top of timeline
        recentActivity.unshift({
            time: "Just now",
            icon: "⚙️",
            type: "update",
            text: "Updated profile details"
        });

        // Limit activity array size
        if (recentActivity.length > 8) {
            recentActivity = recentActivity.slice(0, 8);
        }

        // Run UPDATE SQL
        await dbQuery.run(
            `UPDATE users 
             SET first_name = ?, last_name = ?, bio = ?, avatar = ?, role = ?, skills_teach = ?, skills_learn = ?, recent_activity = ?, password = ?
             WHERE id = ?`,
            [firstName, lastName, updatedBio, updatedAvatar, role, updatedSkillsTeach, updatedSkillsLearn, JSON.stringify(recentActivity), hashedPassword, userId]
        );

        return res.status(200).json({
            success: true,
            message: 'Profile updated successfully!',
            user: {
                id: userId,
                firstName,
                lastName,
                role
            }
        });

    } catch (error) {
        console.error('❌ Update Profile Error:', error);
        return res.status(500).json({ success: false, message: 'An internal server error occurred.' });
    }
};

// Complete Session & Adjust Credits Controller
exports.completeSession = async (req, res) => {
    try {
        const userId = req.headers['x-user-id'];
        const { sessionType, partnerName, skillName } = req.body;

        if (!userId) {
            return res.status(400).json({ success: false, message: 'User ID is required in headers.' });
        }

        if (!sessionType || !partnerName || !skillName) {
            return res.status(400).json({ success: false, message: 'sessionType, partnerName, and skillName are required.' });
        }

        // Fetch user from DB
        const user = await dbQuery.get('SELECT * FROM users WHERE id = ?', [userId]);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found.' });
        }

        // Parse and update recent activity log
        let recentActivity = [];
        try {
            recentActivity = user.recent_activity ? JSON.parse(user.recent_activity) : [];
        } catch (e) {
            recentActivity = [];
        }

        const textMsg = sessionType === 'teach' 
            ? `Taught "${skillName}" to ${partnerName}`
            : `Learned "${skillName}" from ${partnerName}`;

        recentActivity.unshift({
            time: "Just now",
            icon: "✅",
            type: sessionType === 'teach' ? "teach" : "session",
            text: textMsg
        });

        if (recentActivity.length > 8) {
            recentActivity = recentActivity.slice(0, 8);
        }

        // Calculate credit adjustment
        const creditChange = sessionType === 'teach' ? 1 : -1;

        // Perform UPDATE SQL
        await dbQuery.run(
            `UPDATE users 
             SET credits_earned = credits_earned + ?, recent_activity = ?
             WHERE id = ?`,
            [creditChange, JSON.stringify(recentActivity), userId]
        );

        // Fetch updated user to return fresh credit status
        const updatedUser = await dbQuery.get('SELECT credits_earned FROM users WHERE id = ?', [userId]);

        return res.status(200).json({
            success: true,
            message: 'Session completed successfully! Credits updated.',
            creditsEarned: updatedUser.credits_earned
        });

    } catch (error) {
        console.error('❌ Complete Session Error:', error);
        return res.status(500).json({ success: false, message: 'An internal server error occurred.' });
    }
};

// Search Profiles & Auto Seed Mock Users Controller
exports.searchProfiles = async (req, res) => {
    try {
        const userId = req.headers['x-user-id'] || 0;
        const searchVal = req.query.query ? req.query.query.trim().toLowerCase() : "";

        // Auto-seed of mock users has been removed to keep the database clean.

        // 2. Fetch matches from database (excluding active searcher)
        let querySql = `SELECT * FROM users WHERE id != ?`;
        let params = [userId];

        if (searchVal) {
            querySql += ` AND (LOWER(first_name) LIKE ? OR LOWER(last_name) LIKE ? OR LOWER(username) LIKE ? OR LOWER(skills_teach) LIKE ? OR LOWER(skills_learn) LIKE ?)`;
            const wildcard = `%${searchVal}%`;
            params.push(wildcard, wildcard, wildcard, wildcard, wildcard);
        }

        const users = await dbQuery.all(querySql, params);

        // Map database fields to front-end keys
        const mappedUsers = users.map(u => ({
            id: u.id,
            firstName: u.first_name,
            lastName: u.last_name,
            username: u.username,
            avatar: u.avatar || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&h=120&q=80",
            bio: u.bio || "",
            skillsTeach: u.skills_teach ? u.skills_teach.split(",") : [],
            skillsLearn: u.skills_learn ? u.skills_learn.split(",") : [],
            creditsEarned: u.credits_earned !== null ? u.credits_earned : 15,
            bestMatch: u.id % 2 === 1
        }));

        return res.status(200).json({
            success: true,
            profiles: mappedUsers
        });

    } catch (error) {
        console.error('❌ Search Profiles Error:', error);
        return res.status(500).json({ success: false, message: 'An internal server error occurred.' });
    }
};
