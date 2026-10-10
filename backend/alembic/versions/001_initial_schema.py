"""Initial schema – all entities

Revision ID: 001_initial
Revises:
Create Date: 2025-01-01 00:00:00.000000
"""

import os

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "001_initial"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # --- enums ---
    # create_type=False: the types are created explicitly below, not again by create_table.
    file_type_enum = postgresql.ENUM(
        "presentation", "worksheet", "geogebra", "video",
        name="file_type_enum", create_type=False,
    )
    user_role_enum = postgresql.ENUM(
        "admin", "editor", name="user_role_enum", create_type=False,
    )

    file_type_enum.create(op.get_bind(), checkfirst=True)
    user_role_enum.create(op.get_bind(), checkfirst=True)

    # --- topics ---
    op.create_table(
        "topics",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("slug", sa.String(100), nullable=False),
        sa.Column("icon", sa.String(10), nullable=False),
        sa.Column("color", sa.String(20), nullable=False),
        sa.Column("bg_color", sa.String(20), nullable=False),
        sa.Column("name_he", sa.String(200), nullable=False),
        sa.Column("name_en", sa.String(200), nullable=False),
        sa.Column("name_ar", sa.String(200), nullable=False),
        sa.Column("description_he", sa.Text(), nullable=False, server_default=""),
        sa.Column("description_en", sa.Text(), nullable=False, server_default=""),
        sa.Column("description_ar", sa.Text(), nullable=False, server_default=""),
        sa.Column("sort_order", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("is_published", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("slug"),
    )
    op.create_index("ix_topics_slug", "topics", ["slug"])

    # --- subtopics ---
    op.create_table(
        "subtopics",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("topic_id", sa.Uuid(), nullable=False),
        sa.Column("slug", sa.String(100), nullable=False),
        sa.Column("name_he", sa.String(200), nullable=False),
        sa.Column("name_en", sa.String(200), nullable=False),
        sa.Column("name_ar", sa.String(200), nullable=False),
        sa.Column("sort_order", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("is_published", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["topic_id"], ["topics.id"], ondelete="CASCADE"),
        sa.UniqueConstraint("slug"),
    )
    op.create_index("ix_subtopics_slug", "subtopics", ["slug"])
    op.create_index("ix_subtopics_topic_id", "subtopics", ["topic_id"])

    # --- lessons ---
    op.create_table(
        "lessons",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("subtopic_id", sa.Uuid(), nullable=False),
        sa.Column("slug", sa.String(100), nullable=False),
        sa.Column("name_he", sa.String(200), nullable=False),
        sa.Column("name_en", sa.String(200), nullable=False),
        sa.Column("name_ar", sa.String(200), nullable=False),
        sa.Column("sort_order", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("is_published", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["subtopic_id"], ["subtopics.id"], ondelete="CASCADE"),
        sa.UniqueConstraint("slug"),
    )
    op.create_index("ix_lessons_slug", "lessons", ["slug"])
    op.create_index("ix_lessons_subtopic_id", "lessons", ["subtopic_id"])

    # --- content_files ---
    op.create_table(
        "content_files",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("lesson_id", sa.Uuid(), nullable=False),
        sa.Column("file_type", file_type_enum, nullable=False),
        sa.Column("file_url", sa.Text(), nullable=False),
        sa.Column("display_name", sa.String(300), nullable=False),
        sa.Column("sort_order", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["lesson_id"], ["lessons.id"], ondelete="CASCADE"),
    )
    op.create_index("ix_content_files_lesson_id", "content_files", ["lesson_id"])

    # --- hero_slides ---
    op.create_table(
        "hero_slides",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("title_he", sa.String(300), nullable=False),
        sa.Column("title_en", sa.String(300), nullable=False),
        sa.Column("title_ar", sa.String(300), nullable=False),
        sa.Column("subtitle_he", sa.Text(), nullable=False, server_default=""),
        sa.Column("subtitle_en", sa.Text(), nullable=False, server_default=""),
        sa.Column("subtitle_ar", sa.Text(), nullable=False, server_default=""),
        sa.Column("button_text_he", sa.String(100), nullable=False, server_default=""),
        sa.Column("button_text_en", sa.String(100), nullable=False, server_default=""),
        sa.Column("button_text_ar", sa.String(100), nullable=False, server_default=""),
        sa.Column("button_link", sa.String(500), nullable=False, server_default=""),
        sa.Column("sort_order", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.PrimaryKeyConstraint("id"),
    )

    # --- users ---
    op.create_table(
        "users",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("email", sa.String(320), nullable=False),
        sa.Column("hashed_password", sa.String(200), nullable=False),
        sa.Column("full_name", sa.String(200), nullable=False),
        sa.Column("role", user_role_enum, nullable=False, server_default="editor"),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("email"),
    )
    op.create_index("ix_users_email", "users", ["email"])

    # --- updated_at trigger function ---
    op.execute("""
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.updated_at = NOW();
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
    """)

    for table in ("topics", "subtopics", "lessons", "hero_slides", "users"):
        op.execute(f"""
            CREATE TRIGGER set_updated_at
            BEFORE UPDATE ON {table}
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
        """)

    # --- site_config ---
    op.create_table(
        "site_config",
        sa.Column("key", sa.String(100), nullable=False),
        sa.Column("value", sa.Text(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.PrimaryKeyConstraint("key"),
    )


def downgrade() -> None:
    if os.getenv("ENVIRONMENT", "").lower() in ("production", "prod"):
        raise RuntimeError(
            "Cannot rollback in production. Create a forward-fixing migration instead."
        )

    # Drop updated_at triggers and function
    for table in ("users", "hero_slides", "lessons", "subtopics", "topics"):
        op.execute(f"DROP TRIGGER IF EXISTS set_updated_at ON {table};")
    op.execute("DROP FUNCTION IF EXISTS update_updated_at_column();")

    # Drop in reverse order, children before parents
    op.drop_table("site_config")
    op.drop_table("users")
    op.drop_table("hero_slides")
    op.drop_table("content_files")
    op.drop_table("lessons")
    op.drop_table("subtopics")
    op.drop_table("topics")

    # Drop enums after tables that reference them are gone
    sa.Enum(name="user_role_enum").drop(op.get_bind(), checkfirst=True)
    sa.Enum(name="file_type_enum").drop(op.get_bind(), checkfirst=True)
