const path = require('path');
const fs = require('fs');
require('dotenv').config();

const dbInstanceId = "db_" + Date.now() + "_" + Math.floor(Math.random() * 1000000);

let db;
let usingMock = false;

// Mock database definition
class MockDatabase {
    constructor() {
        this.users = [];
        this.lastId = 0;
        console.log("ℹ️ Mock in-memory database initialized.");
    }
    
    serialize(callback) {
        callback();
    }
    
    run(sql, params, callback) {
        try {
            if (sql.startsWith("ALTER TABLE") || sql.startsWith("CREATE TABLE")) {
                if (callback) callback(null);
                return;
            }
            if (sql.startsWith("INSERT INTO")) {
                this.lastId++;
                const newUser = {
                    id: this.lastId,
                    first_name: params[0],
                    last_name: params[1],
                    email: params[2],
                    username: params[3],
                    role: params[4],
                    password: params[5],
                    bio: '',
                    avatar: '',
                    skills_teach: '',
                    skills_learn: '',
                    credits_earned: 15,
                    skills_taught_count: 0,
                    hours_learned: 0
                };
                this.users.push(newUser);
                if (callback) callback.call({ lastID: this.lastId, changes: 1 }, null);
                return;
            }
            if (sql.startsWith("UPDATE users")) {
                if (sql.includes("first_name = ?")) {
                    const id = params[6];
                    const user = this.users.find(u => u.id === id);
                    if (user) {
                        user.first_name = params[0];
                        user.last_name = params[1];
                        user.bio = params[2];
                        user.avatar = params[3];
                        user.skills_teach = params[4];
                        user.skills_learn = params[5];
                    }
                } else if (sql.includes("skills_taught_count = ?")) {
                    const id = params[2];
                    const user = this.users.find(u => u.id === id);
                    if (user) {
                        user.credits_earned = params[0];
                        user.skills_taught_count = params[1];
                    }
                } else if (sql.includes("hours_learned = ?")) {
                    const id = params[2];
                    const user = this.users.find(u => u.id === id);
                    if (user) {
                        user.credits_earned = params[0];
                        user.hours_learned = params[1];
                    }
                } else if (sql.includes("credits_earned = ?")) {
                    const id = params[1];
                    const user = this.users.find(u => u.id === id);
                    if (user) {
                        user.credits_earned = params[0];
                    }
                }
                if (callback) callback.call({ changes: 1 }, null);
                return;
            }
            if (callback) callback(null);
        } catch (err) {
            if (callback) callback(err);
        }
    }
    
    get(sql, params, callback) {
        try {
            if (sql.includes("email = ?")) {
                const user = this.users.find(u => u.email === params[0]);
                callback(null, user || null);
                return;
            }
            if (sql.includes("id = ?")) {
                const user = this.users.find(u => u.id === params[0]);
                callback(null, user || null);
                return;
            }
            callback(null, null);
        } catch (err) {
            callback(err, null);
        }
    }
    
    all(sql, params, callback) {
        try {
            if (sql.includes("id != ?")) {
                let list = this.users.filter(u => u.id !== params[0]);
                if (params.length > 1) {
                    const q = params[1].replace(/%/g, '').toLowerCase();
                    if (q) {
                        list = list.filter(u => 
                            u.first_name.toLowerCase().includes(q) ||
                            u.last_name.toLowerCase().includes(q) ||
                            u.username.toLowerCase().includes(q) ||
                            u.skills_teach.toLowerCase().includes(q) ||
                            u.skills_learn.toLowerCase().includes(q)
                        );
                    }
                }
                callback(null, list);
                return;
            }
            callback(null, []);
        } catch (err) {
            callback(err, null);
        }
    }
}

try {
    const sqlite3 = require('sqlite3').verbose();
    const dbPath = path.resolve(__dirname, '..', process.env.DB_PATH || '../database/skill_for_skill.db');
    const dbDir = path.dirname(dbPath);

    let finalPath = dbPath;
    
    // Check if db path directory can be created/written
    try {
        if (!fs.existsSync(dbDir)) {
            fs.mkdirSync(dbDir, { recursive: true });
        }
    } catch (writeErr) {
        console.warn('⚠️ Read-only filesystem or path error. Falling back to in-memory SQLite database:', writeErr.message);
        finalPath = ':memory:';
    }

    db = new sqlite3.Database(finalPath, (err) => {
        if (err) {
            console.error('❌ Error opening SQLite database file. Falling back to in-memory database:', err.message);
            db = new sqlite3.Database(':memory:', (inMemErr) => {
                if (inMemErr) {
                    console.error('❌ In-memory SQLite failed. Loading mock DB:', inMemErr.message);
                    loadMock();
                } else {
                    console.log('📦 Connected to in-memory SQLite database.');
                    initializeDatabase();
                }
            });
        } else {
            console.log(`📦 Connected to SQLite database at: ${finalPath}`);
            initializeDatabase();
        }
    });

} catch (loadErr) {
    console.error('❌ sqlite3 native module failed to load. Falling back to pure in-memory JS database.', loadErr.message);
    loadMock();
}

function loadMock() {
    usingMock = true;
    db = new MockDatabase();
}

function initializeDatabase() {
    if (usingMock) return;
    db.serialize(() => {
        db.run(`
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                first_name TEXT NOT NULL,
                last_name TEXT NOT NULL,
                email TEXT NOT NULL UNIQUE,
                username TEXT NOT NULL UNIQUE,
                role TEXT NOT NULL,
                password TEXT NOT NULL,
                bio TEXT DEFAULT '',
                avatar TEXT DEFAULT '',
                skills_teach TEXT DEFAULT '',
                skills_learn TEXT DEFAULT '',
                credits_earned INTEGER DEFAULT 15,
                skills_taught_count INTEGER DEFAULT 0,
                hours_learned INTEGER DEFAULT 0,
                achievements TEXT,
                recent_activity TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `, (err) => {
            if (err) {
                console.error('❌ Error creating users table:', err.message);
            } else {
                console.log('✔️ Database tables initialized successfully.');
                runMigrations();
            }
        });

        db.run(`
            CREATE TABLE IF NOT EXISTS session_requests (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                sender_id INTEGER NOT NULL,
                sender_name TEXT NOT NULL,
                sender_avatar TEXT DEFAULT '',
                recipient_id INTEGER NOT NULL,
                recipient_name TEXT NOT NULL,
                recipient_avatar TEXT DEFAULT '',
                skill TEXT NOT NULL,
                date TEXT NOT NULL,
                time TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'pending',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `, (err) => {
            if (err) {
                console.error('❌ Error creating session_requests table:', err.message);
            } else {
                console.log('✔️ session_requests table initialized successfully.');
            }
        });
    });
}

function runMigrations() {
    if (usingMock) return;
    const columns = [
        { name: 'bio', type: "TEXT DEFAULT ''" },
        { name: 'avatar', type: "TEXT DEFAULT ''" },
        { name: 'skills_teach', type: "TEXT DEFAULT ''" },
        { name: 'skills_learn', type: "TEXT DEFAULT ''" },
        { name: 'credits_earned', type: "INTEGER DEFAULT 15" },
        { name: 'skills_taught_count', type: "INTEGER DEFAULT 0" },
        { name: 'hours_learned', type: "INTEGER DEFAULT 0" },
        { name: 'achievements', type: "TEXT" },
        { name: 'recent_activity', type: "TEXT" }
    ];

    for (const col of columns) {
        db.run(`ALTER TABLE users ADD COLUMN ${col.name} ${col.type}`, (err) => {
            if (err && !err.message.includes('duplicate column name')) {
                console.error(`❌ Migration Error adding ${col.name}:`, err.message);
            }
        });
    }
}

const dbQuery = {
    run(sql, params = []) {
        return new Promise((resolve, reject) => {
            db.run(sql, params, function (err) {
                if (err) reject(err);
                else {
                    const lastID = this ? this.lastID : undefined;
                    const changes = this ? this.changes : undefined;
                    resolve({ id: lastID, changes: changes });
                }
            });
        });
    },
    get(sql, params = []) {
        return new Promise((resolve, reject) => {
            db.get(sql, params, (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
    },
    all(sql, params = []) {
        return new Promise((resolve, reject) => {
            db.all(sql, params, (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }
};

module.exports = { db, dbQuery, dbInstanceId };
