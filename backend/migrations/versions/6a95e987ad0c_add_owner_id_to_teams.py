"""Add owner_id to teams

Revision ID: 6a95e987ad0c
Revises: 68380f2d6870
Create Date: 2025-10-03 21:43:30.050860

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '6a95e987ad0c'
down_revision = '68380f2d6870'  # last valid migration
branch_labels = None
depends_on = None




def upgrade() -> None:
    """Upgrade schema."""
    # Add owner_id column to teams
    op.add_column('teams', sa.Column('owner_id', sa.Integer(), nullable=False))
    
    # Drop existing foreign keys to avoid conflicts
    op.drop_constraint(op.f('teams_project_id_fkey'), 'teams', type_='foreignkey')
    
    # Recreate foreign keys including new owner_id
    op.create_foreign_key(None, 'teams', 'users', ['owner_id'], ['id'])
    op.create_foreign_key(None, 'teams', 'projects', ['project_id'], ['id'])

    # Optional: Adjust other tables foreign keys for consistency
    op.drop_constraint(op.f('team_members_team_id_fkey'), 'team_members', type_='foreignkey')
    op.drop_constraint(op.f('team_members_user_id_fkey'), 'team_members', type_='foreignkey')
    op.create_foreign_key(None, 'team_members', 'users', ['user_id'], ['id'])
    op.create_foreign_key(None, 'team_members', 'teams', ['team_id'], ['id'])

    # Optional: Adjust tasks table
    op.drop_constraint(op.f('tasks_project_id_fkey'), 'tasks', type_='foreignkey')
    op.drop_constraint(op.f('tasks_assigned_to_id_fkey'), 'tasks', type_='foreignkey')
    op.create_foreign_key(None, 'tasks', 'projects', ['project_id'], ['id'])
    op.create_foreign_key(None, 'tasks', 'users', ['assigned_to_id'], ['id'])

    # Optional: Adjust projects table
    op.drop_constraint(op.f('projects_admin_id_fkey'), 'projects', type_='foreignkey')
    op.drop_constraint(op.f('projects_owner_id_fkey'), 'projects', type_='foreignkey')
    op.create_foreign_key(None, 'projects', 'users', ['admin_id'], ['id'])
    op.create_foreign_key(None, 'projects', 'users', ['owner_id'], ['id'])


def downgrade() -> None:
    """Downgrade schema."""
    # Drop new foreign keys
    op.drop_constraint(None, 'teams', type_='foreignkey')
    op.drop_constraint(None, 'teams', type_='foreignkey')
    
    # Remove owner_id column
    op.drop_column('teams', 'owner_id')

    # Recreate original foreign key
    op.create_foreign_key(op.f('teams_project_id_fkey'), 'teams', 'projects', ['project_id'], ['id'], ondelete='CASCADE')

    # Restore team_members foreign keys
    op.drop_constraint(None, 'team_members', type_='foreignkey')
    op.drop_constraint(None, 'team_members', type_='foreignkey')
    op.create_foreign_key(op.f('team_members_team_id_fkey'), 'team_members', 'teams', ['team_id'], ['id'], ondelete='CASCADE')
    op.create_foreign_key(op.f('team_members_user_id_fkey'), 'team_members', 'users', ['user_id'], ['id'], ondelete='CASCADE')

    # Restore tasks foreign keys
    op.drop_constraint(None, 'tasks', type_='foreignkey')
    op.drop_constraint(None, 'tasks', type_='foreignkey')
    op.create_foreign_key(op.f('tasks_project_id_fkey'), 'tasks', 'projects', ['project_id'], ['id'], ondelete='CASCADE')
    op.create_foreign_key(op.f('tasks_assigned_to_id_fkey'), 'tasks', 'users', ['assigned_to_id'], ['id'], ondelete='SET NULL')

    # Restore projects foreign keys
    op.drop_constraint(None, 'projects', type_='foreignkey')
    op.drop_constraint(None, 'projects', type_='foreignkey')
    op.create_foreign_key(op.f('projects_admin_id_fkey'), 'projects', 'users', ['admin_id'], ['id'], ondelete='CASCADE')
    op.create_foreign_key(op.f('projects_owner_id_fkey'), 'projects', 'users', ['owner_id'], ['id'], ondelete='SET NULL')
