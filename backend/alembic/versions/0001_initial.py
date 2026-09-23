from alembic import op
import sqlalchemy as sa

revision = "0001_initial"
down_revision = None
branch_labels = None
depends_on = None

def upgrade():
    op.create_table("pothole_reports", sa.Column("id",sa.Integer(),primary_key=True), sa.Column("source_filename",sa.String(),nullable=False), sa.Column("pothole_count",sa.Integer(),nullable=False,server_default="0"), sa.Column("severity",sa.String(),nullable=False), sa.Column("confidence",sa.Float(),nullable=False,server_default="0"), sa.Column("coverage_pct",sa.Float(),nullable=False,server_default="0"), sa.Column("location",sa.String(),nullable=True), sa.Column("latitude",sa.Float(),nullable=True), sa.Column("longitude",sa.Float(),nullable=True), sa.Column("status",sa.String(),nullable=False,server_default="reported"), sa.Column("evidence_path",sa.String(),nullable=True), sa.Column("created_at",sa.DateTime(),nullable=False))
    op.create_table("users", sa.Column("id",sa.Integer(),primary_key=True), sa.Column("email",sa.String(320),nullable=False), sa.Column("password_hash",sa.String(255),nullable=False), sa.Column("role",sa.String(32),nullable=False,server_default="citizen"), sa.Column("created_at",sa.DateTime(),nullable=False), sa.UniqueConstraint("email"))
    op.create_index("ix_users_email","users",["email"],unique=True)
    op.create_table("report_owners", sa.Column("report_id",sa.Integer(),sa.ForeignKey("pothole_reports.id"),primary_key=True), sa.Column("user_id",sa.Integer(),sa.ForeignKey("users.id"),nullable=False))
    op.create_index("ix_report_owners_user_id","report_owners",["user_id"])
    op.create_table("report_status_history", sa.Column("id",sa.Integer(),primary_key=True), sa.Column("report_id",sa.Integer(),sa.ForeignKey("pothole_reports.id"),nullable=False), sa.Column("from_status",sa.String(),nullable=True), sa.Column("to_status",sa.String(),nullable=False), sa.Column("note",sa.Text(),nullable=True), sa.Column("created_at",sa.DateTime(),nullable=False))
    op.create_index("ix_report_status_history_report_id","report_status_history",["report_id"])
    op.create_table("work_orders", sa.Column("id",sa.Integer(),primary_key=True), sa.Column("report_id",sa.Integer(),sa.ForeignKey("pothole_reports.id"),nullable=False), sa.Column("title",sa.String(200),nullable=False), sa.Column("assigned_team",sa.String(120),nullable=True), sa.Column("priority",sa.String(20),nullable=False,server_default="normal"), sa.Column("scheduled_date",sa.String(20),nullable=True), sa.Column("status",sa.String(30),nullable=False,server_default="open"), sa.Column("notes",sa.Text(),nullable=True), sa.Column("created_at",sa.DateTime(),nullable=False))
    op.create_index("ix_work_orders_report_id","work_orders",["report_id"])

def downgrade():
    op.drop_table("work_orders")
    op.drop_table("report_status_history")
    op.drop_table("report_owners")
    op.drop_index("ix_users_email",table_name="users")
    op.drop_table("users")
    op.drop_table("pothole_reports")
