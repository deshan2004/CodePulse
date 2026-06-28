import uuid
from sqlalchemy import Column, String, Integer, Float, ForeignKey, DateTime, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base

# 1. Users Model
class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    username = Column(String(100), nullable=False)
    email = Column(String(150), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    created_at = Column(DateTime, server_default=func.now())

# 2. Projects Model
class Project(Base):
    __tablename__ = "projects"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    project_name = Column(String(150), nullable=False)
    programming_language = Column(String(50), nullable=False)
    github_url = Column(String(255), nullable=True)
    created_at = Column(DateTime, server_default=func.now())

# 3. Scan Reports Model
class ScanReport(Base):
    __tablename__ = "scan_reports"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    status = Column(String(50), nullable=False, default="Pending")
    triggered_at = Column(DateTime, server_default=func.now())
    completed_at = Column(DateTime, nullable=True)

# 4. Quality Metrics Model
class QualityMetric(Base):
    __tablename__ = "quality_metrics"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    report_id = Column(UUID(as_uuid=True), ForeignKey("scan_reports.id", ondelete="CASCADE"), unique=True, nullable=False)
    code_duplication_percentage = Column(Float, default=0.0)
    security_vulnerabilities_count = Column(Integer, default=0)
    test_coverage_percentage = Column(Float, default=0.0)
    total_lines_of_code = Column(Integer, default=0)
    raw_json_output = Column(JSON, nullable=True)

# 5. Performance Metrics Model
class PerformanceMetric(Base):
    __tablename__ = "performance_metrics"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    report_id = Column(UUID(as_uuid=True), ForeignKey("scan_reports.id", ondelete="CASCADE"), nullable=False)
    endpoint_url = Column(String(255), nullable=False)
    avg_response_time_ms = Column(Integer, default=0)
    error_rate_percentage = Column(Float, default=0.0)
    throughput = Column(Float, default=0.0)