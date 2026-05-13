'use strict';

const path = require('path');
const fs = require('fs');
const express = require('express');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const Database = require('better-sqlite3');
require('dotenv').config();

const PORT = Number(process.env.PORT) || 3000;
const ROOT = __dirname;
const DB_PATH = path.join(ROOT, 'data', 'app.db');

function ensureDataDir() {
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
}

function initDb() {
    ensureDataDir();
    const db = new Database(DB_PATH);
    db.exec(`
        CREATE TABLE IF NOT EXISTS admins (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            created_at TEXT DEFAULT (datetime('now'))
        )
    `);

    const count = db.prepare('SELECT COUNT(*) AS n FROM admins').get().n;
    if (count === 0) {
        const username = process.env.ADMIN_USERNAME;
        const password = process.env.ADMIN_PASSWORD;
        if (!username || !password) {
            console.warn(
                '[sys] No admins in database. Set ADMIN_USERNAME and ADMIN_PASSWORD in .env to seed the first admin.'
            );
        } else {
            const passwordHash = bcrypt.hashSync(password, 10);
            db.prepare(
                'INSERT INTO admins (username, password_hash) VALUES (?, ?)'
            ).run(username, passwordHash);
            console.log('[sys] Seeded initial admin user:', username);
        }
    }

    return db;
}

const db = initDb();

const app = express();

app.use(
    session({
        secret: process.env.SESSION_SECRET || 'dev-only-change-me-in-production',
        resave: false,
        saveUninitialized: false,
        cookie: {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 7 * 24 * 60 * 60 * 1000,
            sameSite: 'lax',
        },
    })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

function requireAdmin(req, res, next) {
    if (req.session && req.session.adminId) {
        return next();
    }
    return res.redirect('/admin/login.html');
}

app.post('/api/admin/login', (req, res) => {
    const username = (req.body.username || '').trim();
    const password = req.body.password || '';
    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required.' });
    }

    const row = db.prepare('SELECT id, username, password_hash FROM admins WHERE username = ?').get(username);
    if (!row || !bcrypt.compareSync(password, row.password_hash)) {
        return res.status(401).json({ error: 'Invalid username or password.' });
    }

    req.session.adminId = row.id;
    req.session.adminUsername = row.username;
    return res.json({ ok: true });
});

app.post('/api/admin/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ error: 'Could not log out.' });
        }
        res.clearCookie('connect.sid');
        return res.json({ ok: true });
    });
});

app.get('/api/admin/me', (req, res) => {
    if (req.session && req.session.adminId) {
        return res.json({
            loggedIn: true,
            username: req.session.adminUsername || null,
        });
    }
    return res.json({ loggedIn: false });
});

app.get('/admin/', (req, res) => {
    if (req.session && req.session.adminId) {
        return res.redirect('/admin/dashboard.html');
    }
    return res.redirect('/admin/login.html');
});

app.get('/admin/dashboard.html', requireAdmin, (req, res) => {
    res.sendFile(path.join(ROOT, 'admin', 'dashboard.html'));
});

app.get('/login.html', (req, res) => {
    res.redirect(301, '/admin/login.html');
});

// Protect your existing dashboard folder (it contains spaces in its name).
// This ensures `/sys dashboard1/index.html` is only reachable after admin login.
const sysDashboardRoot = path.join(ROOT, 'sys dashboard1');
app.use(['/sys dashboard1', '/sys%20dashboard1'], requireAdmin, express.static(sysDashboardRoot));

app.use(express.static(ROOT));

app.listen(PORT, () => {
    console.log(`[sys] Server http://localhost:${PORT}`);
});
