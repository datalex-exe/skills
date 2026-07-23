const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
require('dotenv').config();

// Ensure the database directory exists
const dbPath = path.resolve(__dirname, '..', process.env.DB_PATH || '../database/skill_for_skill.db');
const dbDir = path.dirname(dbPath);

if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}

// Connect to SQLite database
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('❌ Error connecting to SQLite database:', err.message);
    } else {
        console.log('📦 Connected to SQLite database at:', dbPath);
        initializeDatabase();
    }
});

function initializeDatabase() {
    db.serialize(() => {
        // Create users table if not exists
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
    });
}

function runMigrations() {
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
            // Ignore duplicate column name error in SQLite
            if (err && !err.message.includes('duplicate column name')) {
                console.error(`❌ Migration Error adding ${col.name}:`, err.message);
            }
        });
    }
}

// Helper utility for promise-based database operations
const dbQuery = {
    run(sql, params = []) {
        return new Promise((resolve, reject) => {
            db.run(sql, params, function (err) {
                if (err) reject(err);
                else resolve({ id: this.lastID, changes: this.changes });
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

module.exports = { db, dbQuery };
