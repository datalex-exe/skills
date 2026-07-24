const bcrypt = require('bcryptjs');
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
        const { sessionId, sessionType, partnerName, skillName } = req.body;

        if (!userId) {
            return res.status(400).json({ success: false, message: 'User ID is required in headers.' });
        }

        const sid = sessionId ? parseInt(sessionId) : null;
        if (!sid) {
            return res.status(400).json({ success: false, message: 'Valid sessionId is required.' });
        }

        // 1. Fetch Session from DB (or fallback to session_requests)
        let session = await dbQuery.get('SELECT * FROM sessions WHERE id = ? OR request_id = ?', [sid, sid]);
        let requestId = sid;
        let teacherId, learnerId, skill;

        if (session) {
            requestId = session.request_id || session.id;
            learnerId = session.sender_id;  // Sender is Learner
            teacherId = session.recipient_id; // Recipient is Teacher
            skill = session.skill;
        } else {
            const reqRow = await dbQuery.get('SELECT * FROM session_requests WHERE id = ?', [sid]);
            if (reqRow) {
                requestId = reqRow.id;
                learnerId = reqRow.sender_id;
                teacherId = reqRow.recipient_id;
                skill = reqRow.skill;
            } else {
                return res.status(404).json({ success: false, message: 'Session record not found.' });
            }
        }

        if (!skill && skillName) skill = skillName;

        // 2. Check if completion record already exists in SQLite (Ensure single execution per session)
        const existingCompletion = await dbQuery.get('SELECT * FROM session_completions WHERE session_id = ?', [requestId]);
        if (existingCompletion || (session && session.status === 'completed')) {
            console.log(`⚠️ Session ${requestId} already completed previously. Skipping duplicate credit transfer.`);
            const callerUser = await dbQuery.get('SELECT credits_earned FROM users WHERE id = ?', [userId]);
            return res.status(200).json({
                success: true,
                alreadyCompleted: true,
                message: 'Session already completed previously.',
                creditsEarned: callerUser ? callerUser.credits_earned : 15
            });
        }

        // 3. Fetch Teacher and Learner user profiles
        const teacher = await dbQuery.get('SELECT * FROM users WHERE id = ?', [teacherId]);
        const learner = await dbQuery.get('SELECT * FROM users WHERE id = ?', [learnerId]);

        if (!teacher || !learner) {
            return res.status(404).json({ success: false, message: 'Teacher or Learner profile not found.' });
        }

        const teacherName = `${teacher.first_name} ${teacher.last_name}`;
        const learnerName = `${learner.first_name} ${learner.last_name}`;

        // 4. Create Session Completion Record in SQLite
        await dbQuery.run(
            `INSERT INTO session_completions (session_id, teacher_id, learner_id, skill, credits_transferred)
             VALUES (?, ?, ?, ?, 1)`,
            [requestId, teacherId, learnerId, skill]
        );

        // 5. Update Teacher: +1 credit, +1 skills_taught_count, recent_activity
        let teacherActivity = [];
        try { teacherActivity = teacher.recent_activity ? JSON.parse(teacher.recent_activity) : []; } catch (e) { teacherActivity = []; }
        teacherActivity.unshift({
            time: "Just now",
            icon: "✅",
            type: "teach",
            text: `Taught "${skill}" to ${learnerName}`
        });
        if (teacherActivity.length > 8) teacherActivity = teacherActivity.slice(0, 8);

        await dbQuery.run(
            `UPDATE users 
             SET credits_earned = credits_earned + 1, skills_taught_count = skills_taught_count + 1, recent_activity = ?
             WHERE id = ?`,
            [JSON.stringify(teacherActivity), teacherId]
        );

        // 6. Update Learner: -1 credit, +1 hours_learned, recent_activity
        let learnerActivity = [];
        try { learnerActivity = learner.recent_activity ? JSON.parse(learner.recent_activity) : []; } catch (e) { learnerActivity = []; }
        learnerActivity.unshift({
            time: "Just now",
            icon: "✅",
            type: "session",
            text: `Learned "${skill}" from ${teacherName}`
        });
        if (learnerActivity.length > 8) learnerActivity = learnerActivity.slice(0, 8);

        await dbQuery.run(
            `UPDATE users 
             SET credits_earned = credits_earned - 1, hours_learned = hours_learned + 1, recent_activity = ?
             WHERE id = ?`,
            [JSON.stringify(learnerActivity), learnerId]
        );

        // 7. Save both transactions in SQLite (Earned for Teacher, Spent for Learner)
        await dbQuery.run(
            `INSERT INTO transactions (user_id, partner_id, partner_name, session_id, type, amount, skill)
             VALUES (?, ?, ?, ?, 'earned', 1, ?)`,
            [teacherId, learnerId, learnerName, requestId, skill]
        );

        await dbQuery.run(
            `INSERT INTO transactions (user_id, partner_id, partner_name, session_id, type, amount, skill)
             VALUES (?, ?, ?, ?, 'spent', -1, ?)`,
            [learnerId, teacherId, teacherName, requestId, skill]
        );

        // 8. Update session and request status in SQLite
        await dbQuery.run('UPDATE sessions SET status = "completed" WHERE request_id = ? OR id = ?', [requestId, requestId]);
        await dbQuery.run('UPDATE session_requests SET status = "completed" WHERE id = ?', [requestId]);

        // 9. Console logs to verify (Requirement 6)
        console.log("Session ended: Session ID", requestId, "- Skill:", skill);
        console.log("Wallet updated: Teacher ID", teacherId, "(+1 Credit), Learner ID", learnerId, "(-1 Credit)");
        console.log("Transaction created: 2 SQLite transaction entries saved.");

        // 10. Notify clients via Socket.IO
        if (req.app && req.app.get('io')) {
            const io = req.app.get('io');
            io.to(`user_${teacherId}`).emit('wallet_updated', { sessionId: requestId });
            io.to(`user_${learnerId}`).emit('wallet_updated', { sessionId: requestId });
        }

        // 11. Return updated balance for caller
        const updatedCaller = await dbQuery.get('SELECT credits_earned FROM users WHERE id = ?', [userId]);

        return res.status(200).json({
            success: true,
            message: 'Session completed successfully! Wallet updated.',
            creditsEarned: updatedCaller ? updatedCaller.credits_earned : 15
        });

    } catch (error) {
        console.error('❌ Complete Session Error:', error);
        return res.status(500).json({ success: false, message: 'An internal server error occurred.' });
    }
};

// Get Transaction Log History Controller
exports.getTransactions = async (req, res) => {
    try {
        const userId = req.headers['x-user-id'];
        if (!userId) {
            return res.status(400).json({ success: false, message: 'User ID is required in headers.' });
        }

        const user = await dbQuery.get('SELECT credits_earned FROM users WHERE id = ?', [userId]);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found.' });
        }

        const transactions = await dbQuery.all(
            `SELECT * FROM transactions WHERE user_id = ? ORDER BY created_at DESC`,
            [userId]
        );

        let totalEarned = 0;
        let totalSpent = 0;

        const mappedTransactions = transactions.map(t => {
            if (t.amount > 0) {
                totalEarned += t.amount;
            } else {
                totalSpent += Math.abs(t.amount);
            }
            return {
                id: t.id,
                sessionId: t.session_id,
                type: t.type,
                partner: t.partner_name,
                partnerId: t.partner_id,
                skill: t.skill,
                date: t.created_at,
                amount: t.amount
            };
        });

        return res.status(200).json({
            success: true,
            balance: user.credits_earned,
            totalEarned,
            totalSpent,
            transactions: mappedTransactions
        });
    } catch (error) {
        console.error('❌ Get Transactions Error:', error);
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

// Get Session Requests Controller
exports.getSessionRequests = async (req, res) => {
    try {
        const userId = req.headers['x-user-id'];
        if (!userId) {
            return res.status(400).json({ success: false, message: 'User ID is required in headers.' });
        }

        const requests = await dbQuery.all(
            `SELECT * FROM session_requests WHERE sender_id = ? OR recipient_id = ? ORDER BY created_at DESC`,
            [userId, userId]
        );

        const mappedRequests = requests.map(r => ({
            id: r.id,
            senderId: r.sender_id,
            senderName: r.sender_name,
            senderAvatar: r.sender_avatar,
            recipientId: r.recipient_id,
            recipientName: r.recipient_name,
            recipientAvatar: r.recipient_avatar,
            skill: r.skill,
            date: r.date,
            time: r.time,
            status: r.status
        }));

        return res.status(200).json({
            success: true,
            requests: mappedRequests
        });
    } catch (error) {
        console.error('❌ Get Session Requests Error:', error);
        return res.status(500).json({ success: false, message: 'An internal server error occurred.' });
    }
};

// Create Session Request Controller
exports.createSessionRequest = async (req, res) => {
    try {
        const senderId = req.headers['x-user-id'];
        const { recipientId, recipientName, recipientAvatar, skill, date, time } = req.body;

        if (!senderId) {
            return res.status(400).json({ success: false, message: 'User ID is required in headers.' });
        }

        if (!recipientId || !recipientName || !skill || !date || !time) {
            return res.status(400).json({ success: false, message: 'Missing required session request fields.' });
        }

        // Fetch sender's profile to get name and avatar
        const sender = await dbQuery.get('SELECT first_name, last_name, avatar FROM users WHERE id = ?', [senderId]);
        if (!sender) {
            return res.status(404).json({ success: false, message: 'Sender not found.' });
        }

        const senderName = `${sender.first_name} ${sender.last_name}`;
        const senderAvatar = sender.avatar || '../images/avatar1.jpg';

        await dbQuery.run(
            `INSERT INTO session_requests (sender_id, sender_name, sender_avatar, recipient_id, recipient_name, recipient_avatar, skill, date, time, status)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
            [senderId, senderName, senderAvatar, recipientId, recipientName, recipientAvatar || '../images/avatar1.jpg', skill, date, time]
        );

        return res.status(201).json({
            success: true,
            message: 'Session request sent successfully!'
        });
    } catch (error) {
        console.error('❌ Create Session Request Error:', error);
        return res.status(500).json({ success: false, message: 'An internal server error occurred.' });
    }
};

// Update Session Request Status Controller
exports.updateSessionRequestStatus = async (req, res) => {
    try {
        const userId = req.headers['x-user-id'];
        let { reqId, status, date, time } = req.body;

        if (!userId) {
            return res.status(400).json({ success: false, message: 'User ID is required in headers.' });
        }

        if (!reqId) {
            return res.status(400).json({ success: false, message: 'Invalid or missing Request ID.' });
        }

        if (!status) {
            return res.status(400).json({ success: false, message: 'Status is required.' });
        }

        // Standardize status name for decline/reject
        let finalStatus = status;
        if (status === 'rejected' || status === 'declined' || status === 'Declined') {
            finalStatus = 'Declined';
        }

        if (finalStatus === 'Declined') {
            console.log("Decline request received");
        }

        // Check if request exists
        const request = await dbQuery.get('SELECT * FROM session_requests WHERE id = ?', [reqId]);
        if (!request) {
            return res.status(404).json({ success: false, message: 'Session request not found for the given ID.' });
        }

        if (finalStatus === 'accepted') {
            const finalDate = date || request.date;
            const finalTime = time || request.time;

            try {
                if (date && time) {
                    await dbQuery.run(
                        `UPDATE session_requests SET status = 'accepted', date = ?, time = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
                        [date, time, reqId]
                    );
                } else {
                    await dbQuery.run(
                        `UPDATE session_requests SET status = 'accepted', updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
                        [reqId]
                    );
                }
            } catch (err) {
                if (date && time) {
                    await dbQuery.run(
                        `UPDATE session_requests SET status = 'accepted', date = ?, time = ? WHERE id = ?`,
                        [date, time, reqId]
                    );
                } else {
                    await dbQuery.run(
                        `UPDATE session_requests SET status = 'accepted' WHERE id = ?`,
                        [reqId]
                    );
                }
            }

            // Generate one unique Jitsi room ID
            const roomId = `BarterLearn_Room_${reqId}_${Math.random().toString(36).substring(2, 10)}`;

            // Create a session record in SQLite if it does not already exist
            const existingSession = await dbQuery.get('SELECT id FROM sessions WHERE request_id = ?', [reqId]);
            if (!existingSession) {
                await dbQuery.run(
                    `INSERT INTO sessions (request_id, sender_id, recipient_id, skill, date, time, room_id, status)
                     VALUES (?, ?, ?, ?, ?, ?, ?, 'scheduled')`,
                    [reqId, request.sender_id, request.recipient_id, request.skill, finalDate, finalTime, roomId]
                );
            }
        } else {
            // Declined / Cancelled / Rejected -> Do NOT create Jitsi room or sessions row
            try {
                await dbQuery.run(
                    `UPDATE session_requests SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
                    [finalStatus, reqId]
                );
            } catch (err) {
                await dbQuery.run(
                    `UPDATE session_requests SET status = ? WHERE id = ?`,
                    [finalStatus, reqId]
                );
            }

            if (finalStatus === 'Declined') {
                console.log("SQLite updated successfully");
            }

            // If a session record already existed previously, update status as well
            await dbQuery.run(
                `UPDATE sessions SET status = ? WHERE request_id = ?`,
                [finalStatus, reqId]
            );
        }

        // Notify client using global socket handler if bound to app
        if (req.app && req.app.get('io')) {
            const io = req.app.get('io');
            const teacher = await dbQuery.get('SELECT first_name, last_name FROM users WHERE id = ?', [request.recipient_id]);
            const teacherName = teacher ? `${teacher.first_name} ${teacher.last_name}` : request.recipient_name;

            if (finalStatus === 'Declined') {
                // Specific decline notification for learner
                io.to(`user_${request.sender_id}`).emit('session_decline_notification', {
                    reqId: request.id,
                    status: 'Declined',
                    skill: request.skill,
                    teacherName
                });
            }

            // Notify both sender and receiver of status update
            io.to(`user_${request.sender_id}`).emit('session_status_update', { reqId: request.id, status: finalStatus });
            io.to(`user_${request.recipient_id}`).emit('session_status_update', { reqId: request.id, status: finalStatus });

            if (finalStatus === 'Declined') {
                console.log("Notification sent");
            }
        }

        return res.status(200).json({
            success: true,
            message: `Session request ${finalStatus} successfully!`
        });
    } catch (error) {
        console.error('❌ Update Session Request Status Error:', error);
        return res.status(500).json({ success: false, message: 'An internal server error occurred.' });
    }
};

// Get Scheduled or Active Sessions Controller
exports.getActiveSessions = async (req, res) => {
    try {
        const userId = req.headers['x-user-id'];
        if (!userId) {
            return res.status(400).json({ success: false, message: 'User ID is required in headers.' });
        }

        const querySql = `
            SELECT s.*, 
                   u1.first_name as sender_first_name, u1.last_name as sender_last_name, u1.avatar as sender_avatar,
                   u2.first_name as recipient_first_name, u2.last_name as recipient_last_name, u2.avatar as recipient_avatar
            FROM sessions s
            JOIN users u1 ON s.sender_id = u1.id
            JOIN users u2 ON s.recipient_id = u2.id
            WHERE (s.sender_id = ? OR s.recipient_id = ?) AND s.status IN ('scheduled', 'active')
            ORDER BY s.created_at DESC
        `;
        const list = await dbQuery.all(querySql, [userId, userId]);

        const mappedSessions = list.map(s => {
            const isOutgoing = s.sender_id == userId;
            const partnerName = isOutgoing 
                ? `${s.recipient_first_name} ${s.recipient_last_name}`
                : `${s.sender_first_name} ${s.sender_last_name}`;
            const partnerAvatar = isOutgoing ? s.recipient_avatar : s.sender_avatar;

            return {
                id: s.id,
                requestId: s.request_id,
                senderId: s.sender_id,
                recipientId: s.recipient_id,
                skill: s.skill,
                date: s.date,
                time: s.time,
                roomId: s.room_id,
                status: s.status,
                partnerName,
                partnerAvatar,
                isOutgoing
            };
        });

        return res.status(200).json({ success: true, sessions: mappedSessions });
    } catch (error) {
        console.error('❌ Get Active Sessions Error:', error);
        return res.status(500).json({ success: false, message: 'An internal server error occurred.' });
    }
};

// Get Session Details Controller
exports.getSessionDetails = async (req, res) => {
    try {
        const userId = req.headers['x-user-id'];
        const requestId = req.query.id; // Could be request_id or session_id
        if (!userId) {
            return res.status(400).json({ success: false, message: 'User ID is required in headers.' });
        }
        if (!requestId) {
            return res.status(400).json({ success: false, message: 'Session ID is required.' });
        }

        const querySql = `
            SELECT s.*, 
                   u1.first_name as sender_first_name, u1.last_name as sender_last_name, u1.avatar as sender_avatar,
                   u2.first_name as recipient_first_name, u2.last_name as recipient_last_name, u2.avatar as recipient_avatar
            FROM sessions s
            JOIN users u1 ON s.sender_id = u1.id
            JOIN users u2 ON s.recipient_id = u2.id
            WHERE (s.sender_id = ? OR s.recipient_id = ?) AND (s.request_id = ? OR s.id = ?)
            LIMIT 1
        `;
        const session = await dbQuery.get(querySql, [userId, userId, requestId, requestId]);

        if (!session) {
            return res.status(404).json({ success: false, message: 'Session record not found.' });
        }

        const isOutgoing = session.sender_id == userId;
        const partnerName = isOutgoing 
            ? `${session.recipient_first_name} ${session.recipient_last_name}`
            : `${session.sender_first_name} ${session.sender_last_name}`;
        const partnerAvatar = isOutgoing ? session.recipient_avatar : session.sender_avatar;

        const result = {
            id: session.id,
            requestId: session.request_id,
            senderId: session.sender_id,
            recipientId: session.recipient_id,
            skill: session.skill,
            date: session.date,
            time: session.time,
            roomId: session.room_id,
            status: session.status,
            partnerName,
            partnerAvatar,
            senderName: `${session.sender_first_name} ${session.sender_last_name}`,
            recipientName: `${session.recipient_first_name} ${session.recipient_last_name}`,
            senderAvatar: session.sender_avatar,
            recipientAvatar: session.recipient_avatar,
            isOutgoing
        };

        return res.status(200).json({ success: true, session: result });
    } catch (error) {
        console.error('❌ Get Session Details Error:', error);
        return res.status(500).json({ success: false, message: 'An internal server error occurred.' });
    }
};
