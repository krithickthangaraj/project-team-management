# backend/migrations/env.py
import sys
import os
from logging.config import fileConfig
from sqlalchemy import engine_from_config, pool, create_engine
from alembic import context
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Add project root to path so Alembic can import 'app'
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

# Import Base and all models so metadata includes them
from app.models.user import Base as UserBase
import app.models.project   # Project model
import app.models.task      # Task model
import app.models.team      # Team model 

# Use the same Base for all models
Base = UserBase

# Alembic config
config = context.config

# Configure logging
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Target metadata for autogenerate
target_metadata = Base.metadata

# Get DATABASE_URL from .env and enforce sslmode=require if missing
db_url = os.getenv("DATABASE_URL")
if not db_url:
    raise ValueError("DATABASE_URL not set in .env")

# Ensure sslmode=require for Alembic connections (Render/Supabase need SSL)
if "sslmode=" not in db_url:
    separator = '&' if '?' in db_url else '?'
    db_url = f"{db_url}{separator}sslmode=require"


# --- Offline migrations ---
def run_migrations_offline():
    context.configure(
        url=db_url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()


# --- Online migrations ---
def run_migrations_online():
    connectable = create_engine(db_url, poolclass=pool.NullPool)
    with connectable.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata)
        with context.begin_transaction():
            context.run_migrations()


# Run the correct migration mode
if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
