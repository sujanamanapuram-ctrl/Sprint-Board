// ===== SprintBoard — PostgreSQL Database Setup =====
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { Pool } = require('pg');

const pool = new Pool();

const schema = `
-- Project settings (issueCounter, projectKey, etc.)
CREATE TABLE IF NOT EXISTS project_settings (
    key   VARCHAR(100) PRIMARY KEY,
    value TEXT
);

-- Team members
CREATE TABLE IF NOT EXISTS members (
    id         VARCHAR(50)  PRIMARY KEY,
    name       VARCHAR(255) NOT NULL,
    role       VARCHAR(255),
    color      VARCHAR(50),
    created_at TIMESTAMPTZ  DEFAULT NOW()
);

-- Sprints
CREATE TABLE IF NOT EXISTS sprints (
    id         VARCHAR(50)  PRIMARY KEY,
    name       VARCHAR(255) NOT NULL,
    goal       TEXT,
    start_date DATE,
    end_date   DATE,
    status     VARCHAR(50)  DEFAULT 'planning',
    created_at TIMESTAMPTZ  DEFAULT NOW()
);

-- Issues
CREATE TABLE IF NOT EXISTS issues (
    id          VARCHAR(50)  PRIMARY KEY,
    key         VARCHAR(50)  NOT NULL UNIQUE,
    summary     VARCHAR(500) NOT NULL,
    type        VARCHAR(50)  DEFAULT 'task',
    description TEXT,
    priority    VARCHAR(50)  DEFAULT 'medium',
    status      VARCHAR(50)  DEFAULT 'todo',
    reporter_id VARCHAR(50)  REFERENCES members(id) ON DELETE SET NULL,
    assignee_id VARCHAR(50)  REFERENCES members(id) ON DELETE SET NULL,
    sprint_id   VARCHAR(50)  REFERENCES sprints(id) ON DELETE SET NULL,
    points      VARCHAR(20),
    labels      TEXT[]       DEFAULT '{}',
    sla         JSONB        DEFAULT '{"startedAt":null,"respondedAt":null,"resolvedAt":null,"isPaused":false,"pausedAt":null,"totalPausedMs":0,"pauses":[]}',
    created_at  TIMESTAMPTZ  DEFAULT NOW(),
    updated_at  TIMESTAMPTZ  DEFAULT NOW()
);

-- Issue links
CREATE TABLE IF NOT EXISTS issue_links (
    id        VARCHAR(50) PRIMARY KEY,
    source_id VARCHAR(50) NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
    target_id VARCHAR(50) NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
    type      VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(source_id, target_id, type)
);

-- SLA configuration per priority
CREATE TABLE IF NOT EXISTS sla_config (
    priority           VARCHAR(50) PRIMARY KEY,
    response_minutes   INTEGER     NOT NULL DEFAULT 60,
    resolution_minutes INTEGER     NOT NULL DEFAULT 480
);

-- Seed default SLA config if not present
INSERT INTO sla_config (priority, response_minutes, resolution_minutes) VALUES
    ('highest', 30,   240),
    ('high',    60,   480),
    ('medium',  240,  1440),
    ('low',     480,  2880),
    ('lowest',  1440, 4320)
ON CONFLICT (priority) DO NOTHING;

-- Seed default project settings
INSERT INTO project_settings (key, value) VALUES
    ('projectKey',    'SB'),
    ('issueCounter',  '0')
ON CONFLICT (key) DO NOTHING;
`;

async function setup() {
    const client = await pool.connect();
    try {
        console.log('🔗  Connected to PostgreSQL:', process.env.PGDATABASE, '@', process.env.PGHOST);
        await client.query(schema);
        console.log('✅  Schema created / verified successfully.');
        console.log('\n📋  Tables:');
        const res = await client.query(`
            SELECT tablename FROM pg_tables
            WHERE schemaname = 'public'
            ORDER BY tablename;
        `);
        res.rows.forEach(r => console.log('   •', r.tablename));
    } catch (err) {
        console.error('❌  Setup failed:', err.message);
        process.exit(1);
    } finally {
        client.release();
        await pool.end();
    }
}

setup();
