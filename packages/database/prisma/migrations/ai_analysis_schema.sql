-- AI Analysis Database Schema Migration
-- This migration adds tables for storing AI-powered code analysis results

CREATE TABLE ai_analysis_sessions (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    repository_url VARCHAR(500) NOT NULL,
    analysis_type VARCHAR(100) NOT NULL, -- 'security', 'performance', 'quality'
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}'
);

CREATE TABLE ai_analysis_results (
    id SERIAL PRIMARY KEY,
    session_id INTEGER REFERENCES ai_analysis_sessions(id) ON DELETE CASCADE,
    file_path VARCHAR(1000) NOT NULL,
    line_number INTEGER,
    severity VARCHAR(20) NOT NULL, -- 'low', 'medium', 'high', 'critical'
    category VARCHAR(100) NOT NULL,
    message TEXT NOT NULL,
    suggestion TEXT,
    confidence_score DECIMAL(3,2), -- 0.00 to 1.00
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ai_model VARCHAR(100) NOT NULL -- 'gpt-4', 'claude-3', etc.
);

CREATE TABLE ai_analysis_metrics (
    id SERIAL PRIMARY KEY,
    session_id INTEGER REFERENCES ai_analysis_sessions(id) ON DELETE CASCADE,
    metric_name VARCHAR(100) NOT NULL,
    metric_value DECIMAL(10,2) NOT NULL,
    metric_unit VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_ai_sessions_user_id ON ai_analysis_sessions(user_id);
CREATE INDEX idx_ai_sessions_status ON ai_analysis_sessions(status);
CREATE INDEX idx_ai_results_session_id ON ai_analysis_results(session_id);
CREATE INDEX idx_ai_results_severity ON ai_analysis_results(severity);
CREATE INDEX idx_ai_metrics_session_id ON ai_analysis_metrics(session_id);

-- Comments for documentation
COMMENT ON TABLE ai_analysis_sessions IS 'Stores AI analysis session metadata and status';
COMMENT ON TABLE ai_analysis_results IS 'Stores individual AI analysis findings and suggestions';
COMMENT ON TABLE ai_analysis_metrics IS 'Stores quantitative metrics from AI analysis';
