"""Add owner_id to teams and fix team_members issues

Revision ID: 436aa4a9cf7f
Revises: 06c901c7ffec
Create Date: 2025-10-03 22:30:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '436aa4a9cf7f'
down_revision = '06c901c7ffec'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # 1️⃣ Add owner_id to teams (nullable for now)
    op.add_column('teams', sa.Column('owner_id', sa.Integer(), nullable=True))

    # 2️⃣ Backfill existing teams with a default owner
    # You can choose: project owner, first admin (id=1), or some logic
    op.execute("""
        UPDATE teams
        SET owner_id = COALESCE(
            (SELECT owner_id FROM projects WHERE projects.id = teams.project_id),
            1
        )
        WHERE owner_id IS NULL
    """)

    # 3️⃣ Alter column to be NOT NULL
    op.alter_column('teams', 'owner_id', nullable=False)

    # 4️⃣ Create foreign key constraint
    op.create_foreign_key(
        "fk_teams_owner_id_users",
        source_table='teams',
        referent_table='users',
        local_cols=['owner_id'],
        remote_cols=['id'],
        ondelete='CASCADE'
    )

    # ⚠️ IMPORTANT: DO NOT alter team_members primary key columns


def downgrade() -> None:
    # Drop FK first
    op.drop_constraint('fk_teams_owner_id_users', 'teams', type_='foreignkey')

    # Drop the owner_id column
    op.drop_column('teams', 'owner_id')

    # team_members untouched
