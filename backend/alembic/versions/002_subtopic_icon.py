"""Add icon to subtopics

Revision ID: 002_subtopic_icon
Revises: 001_initial
Create Date: 2026-10-09 00:00:00.000000
"""

from alembic import op
import sqlalchemy as sa

revision = "002_subtopic_icon"
down_revision = "001_initial"
branch_labels = None
depends_on = None


def _has_icon() -> bool:
    columns = sa.inspect(op.get_bind()).get_columns("subtopics")
    return any(column["name"] == "icon" for column in columns)


def upgrade() -> None:
    # Idempotent: databases created by seeds.run_seed (create_all) may already have it.
    if not _has_icon():
        op.add_column(
            "subtopics",
            sa.Column("icon", sa.String(20), nullable=False, server_default=""),
        )


def downgrade() -> None:
    if _has_icon():
        op.drop_column("subtopics", "icon")
