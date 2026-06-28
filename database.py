from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# PostgreSQL Database Connection URL
DATABASE_URL = "postgresql://postgres@localhost:5432/sqa_dashboard_db"

# Engine එක සාදා ගැනීම
engine = create_engine(DATABASE_URL)

# Database එකත් එක්ක ගනුදෙනු කරන්න Session එකක් හදාගන්නවා
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Our Tables (Models) Base Class
Base = declarative_base()

# Backend එකේදී Database Connection එකක් ඕන වුනාම පාවිච්චි කරන function එක
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()