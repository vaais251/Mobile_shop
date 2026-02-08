-- Team Messages Table for internal team communication
-- Supports both direct messages and group chat

CREATE TABLE team_messages (
    id SERIAL PRIMARY KEY,
    sender_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    message_type VARCHAR(20) NOT NULL CHECK (message_type IN ('direct', 'group')),
    receiver_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    content TEXT NOT NULL,
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_team_messages_sender ON team_messages(sender_id);
CREATE INDEX idx_team_messages_receiver ON team_messages(receiver_id);
CREATE INDEX idx_team_messages_type ON team_messages(message_type);
CREATE INDEX idx_team_messages_created ON team_messages(created_at DESC);

-- Composite index for fetching conversations
CREATE INDEX idx_team_messages_conversation ON team_messages(sender_id, receiver_id, created_at DESC);

-- Comment
COMMENT ON TABLE team_messages IS 'Internal team communication messages';
COMMENT ON COLUMN team_messages.message_type IS 'Type of message: direct (between two team members) or group (team-wide channel)';
COMMENT ON COLUMN team_messages.receiver_id IS 'NULL for group messages, user_id for direct messages';
