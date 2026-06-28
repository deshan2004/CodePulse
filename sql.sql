CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    project_name VARCHAR(150) NOT NULL,
    programming_language VARCHAR(50) NOT NULL,
    github_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE scan_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'Pending',
    triggered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    CONSTRAINT fk_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE TABLE quality_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_id UUID UNIQUE NOT NULL,
    code_duplication_percentage FLOAT DEFAULT 0.0,
    security_vulnerabilities_count INT DEFAULT 0,
    test_coverage_percentage FLOAT DEFAULT 0.0,
    total_lines_of_code INT DEFAULT 0,
    raw_json_output JSONB,
    CONSTRAINT fk_report_quality FOREIGN KEY (report_id) REFERENCES scan_reports(id) ON DELETE CASCADE
);

CREATE TABLE performance_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_id UUID NOT NULL,
    endpoint_url VARCHAR(255) NOT NULL,
    avg_response_time_ms INT NOT NULL,
    error_rate_percentage FLOAT NOT NULL,
    throughput FLOAT NOT NULL,
    CONSTRAINT fk_report_perf FOREIGN KEY (report_id) REFERENCES scan_reports(id) ON DELETE CASCADE
);