-- Analytics Events Table
-- Stores all user interaction events for analytics purposes

CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Event details
  event_type VARCHAR(50) NOT NULL,
  event_category VARCHAR(50) NOT NULL,

  -- References (optional)
  pet_id UUID REFERENCES pets(id) ON DELETE SET NULL,
  ong_id UUID REFERENCES users(id) ON DELETE SET NULL,

  -- User session tracking
  user_session_id VARCHAR(100) NOT NULL,
  user_email VARCHAR(255),
  user_ip VARCHAR(45),
  user_agent TEXT,

  -- Event metadata (flexible JSON for any additional data)
  metadata JSONB DEFAULT '{}',

  -- Offline tracking
  is_offline_event BOOLEAN DEFAULT false,
  client_timestamp TIMESTAMP,

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_analytics_event_type ON analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_event_category ON analytics_events(event_category);
CREATE INDEX IF NOT EXISTS idx_analytics_created_at ON analytics_events(created_at);
CREATE INDEX IF NOT EXISTS idx_analytics_pet_id ON analytics_events(pet_id) WHERE pet_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_analytics_ong_id ON analytics_events(ong_id) WHERE ong_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_analytics_session_id ON analytics_events(user_session_id);
CREATE INDEX IF NOT EXISTS idx_analytics_user_email ON analytics_events(user_email) WHERE user_email IS NOT NULL;

-- Composite index for common queries
CREATE INDEX IF NOT EXISTS idx_analytics_ong_created ON analytics_events(ong_id, created_at) WHERE ong_id IS NOT NULL;

-- Comment on table
COMMENT ON TABLE analytics_events IS 'Stores all analytics events from frontend, including offline events';

-- Comments on important columns
COMMENT ON COLUMN analytics_events.metadata IS 'Flexible JSON field for additional event-specific data';
COMMENT ON COLUMN analytics_events.is_offline_event IS 'True if event was captured while user was offline';
COMMENT ON COLUMN analytics_events.client_timestamp IS 'Timestamp from client when event occurred (may differ from created_at for offline events)';
