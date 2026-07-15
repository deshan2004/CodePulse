import os
from dotenv import load_dotenv
# pyrefly: ignore [missing-import]
from sqlalchemy import create_engine
# pyrefly: ignore [missing-import]
from sqlalchemy.orm import sessionmaker, declarative_base

# Load environment variables
load_dotenv()

# Database Connection URL (defaults to SQLite if not provided)
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./codepulse.db")

# Engine එක සාදා ගැනීම
if DATABASE_URL.startswith("sqlite"):
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
else:
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