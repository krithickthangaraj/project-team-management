import sys
import os
from logging.config import fileConfig
from sqlalchemy import engine_from_config, pool
from alembic import context
from dotenv import load_dotenv

# Load environment variables from .env
load_dotenv()

# Add app folder to path so Alembic can import models
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

# Alembic config
config = context.config

# Get DATABASE_URL from .env
db_url = os.getenv("DATABASE_URL")
if not db_url:
    raise ValueError("DATABASE_URL not set in .env")

# Set SQLAlchemy URL dynamically
config.set_main_option("sqlalchemy.url", db_url)

# Logging configuration
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Import all models here
from app.models import Base

# Set target metadata for Alembic autogenerate
target_metadata = Base.metadata

# Offline migrations
def run_migrations_offline():
    url = config.get_main_option("sqlalchemy.url")
    context.configure(url=url, target_metadata=target_metadata, literal_binds=True)
    with context.begin_transaction():
        context.run_migrations()

# Online migrations
def run_migrations_online():
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool
    )
    with connectable.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata)
        with context.begin_transaction():
            context.run_migrations()

if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
