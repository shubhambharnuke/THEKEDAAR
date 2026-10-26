"""create_initial_schema

Revision ID: 001_initial_schema
Revises: 
Create Date: 2026-10-27 01:05:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '001_initial_schema'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Enums
    user_role_enum = postgresql.ENUM('STUDENT_CLUB', 'AUTHORITY', 'VERIFIER', 'ADMIN', name='user_role_enum')
    user_role_enum.create(op.get_bind(), checkfirst=True)

    resource_type_enum = postgresql.ENUM('AUDITORIUM', 'LAB', 'CLASSROOM', 'SEMINAR_HALL', 'GROUND', 'OTHER', name='resource_type_enum')
    resource_type_enum.create(op.get_bind(), checkfirst=True)

    event_status_enum = postgresql.ENUM('DRAFT', 'PENDING', 'PARTIALLY_APPROVED', 'APPROVED', 'REJECTED', 'CANCELLED', name='event_status_enum')
    event_status_enum.create(op.get_bind(), checkfirst=True)

    dept_request_status_enum = postgresql.ENUM('PENDING', 'CORRECTION_REQUESTED', 'APPROVED', 'REJECTED', 'CANCELLED', name='dept_request_status_enum')
    dept_request_status_enum.create(op.get_bind(), checkfirst=True)

    booking_status_enum = postgresql.ENUM('CONFIRMED', 'RELEASED', name='booking_status_enum')
    booking_status_enum.create(op.get_bind(), checkfirst=True)

    decision_action_enum = postgresql.ENUM('APPROVED', 'REJECTED', 'CORRECTION_REQUESTED', name='decision_action_enum')
    decision_action_enum.create(op.get_bind(), checkfirst=True)

    document_status_enum = postgresql.ENUM('VALID', 'SUPERSEDED', 'REVOKED', name='document_status_enum')
    document_status_enum.create(op.get_bind(), checkfirst=True)

    blockchain_tx_status_enum = postgresql.ENUM('PENDING', 'CONFIRMED', 'FAILED', name='blockchain_tx_status_enum')
    blockchain_tx_status_enum.create(op.get_bind(), checkfirst=True)

    # 2. Departments
    op.create_table(
        'departments',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('code', sa.String(length=50), nullable=False),
        sa.Column('contact_email', sa.String(length=255), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('name')
    )
    op.create_index(op.f('ix_departments_code'), 'departments', ['code'], unique=True)
    op.create_index(op.f('ix_departments_id'), 'departments', ['id'], unique=False)

    # 3. Users
    op.create_table(
        'users',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('full_name', sa.String(length=255), nullable=False),
        sa.Column('role', sa.Enum('STUDENT_CLUB', 'AUTHORITY', 'VERIFIER', 'ADMIN', name='user_role_enum'), nullable=False),
        sa.Column('department_id', sa.Integer(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.text('true')),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['department_id'], ['departments.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_users_email'), 'users', ['email'], unique=True)
    op.create_index(op.f('ix_users_id'), 'users', ['id'], unique=False)

    # 4. Resources
    op.create_table(
        'resources',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('department_id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('code', sa.String(length=50), nullable=False),
        sa.Column('resource_type', sa.Enum('AUDITORIUM', 'LAB', 'CLASSROOM', 'SEMINAR_HALL', 'GROUND', 'OTHER', name='resource_type_enum'), nullable=False),
        sa.Column('location', sa.String(length=255), nullable=False),
        sa.Column('capacity', sa.Integer(), nullable=False),
        sa.Column('equipment_spec', sa.Text(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.text('true')),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['department_id'], ['departments.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_resources_code'), 'resources', ['code'], unique=True)
    op.create_index(op.f('ix_resources_department_id'), 'resources', ['department_id'], unique=False)
    op.create_index(op.f('ix_resources_id'), 'resources', ['id'], unique=False)

    # 5. Events
    op.create_table(
        'events',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('organizer_user_id', sa.Integer(), nullable=False),
        sa.Column('status', sa.Enum('DRAFT', 'PENDING', 'PARTIALLY_APPROVED', 'APPROVED', 'REJECTED', 'CANCELLED', name='event_status_enum'), nullable=False),
        sa.Column('expected_attendance', sa.Integer(), nullable=False, server_default=sa.text('0')),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['organizer_user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_events_id'), 'events', ['id'], unique=False)
    op.create_index(op.f('ix_events_organizer_user_id'), 'events', ['organizer_user_id'], unique=False)
    op.create_index(op.f('ix_events_status'), 'events', ['status'], unique=False)

    # 6. Department Requests
    op.create_table(
        'department_requests',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('event_id', sa.Integer(), nullable=False),
        sa.Column('department_id', sa.Integer(), nullable=False),
        sa.Column('current_version', sa.Integer(), nullable=False, server_default=sa.text('1')),
        sa.Column('status', sa.Enum('PENDING', 'CORRECTION_REQUESTED', 'APPROVED', 'REJECTED', 'CANCELLED', name='dept_request_status_enum'), nullable=False),
        sa.Column('remarks', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['department_id'], ['departments.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['event_id'], ['events.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_department_requests_department_id'), 'department_requests', ['department_id'], unique=False)
    op.create_index(op.f('ix_department_requests_event_id'), 'department_requests', ['event_id'], unique=False)
    op.create_index(op.f('ix_department_requests_id'), 'department_requests', ['id'], unique=False)
    op.create_index(op.f('ix_department_requests_status'), 'department_requests', ['status'], unique=False)

    # 7. Resource Bookings
    op.create_table(
        'resource_bookings',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('department_request_id', sa.Integer(), nullable=False),
        sa.Column('resource_id', sa.Integer(), nullable=False),
        sa.Column('start_time', sa.DateTime(timezone=True), nullable=False),
        sa.Column('end_time', sa.DateTime(timezone=True), nullable=False),
        sa.Column('status', sa.Enum('CONFIRMED', 'RELEASED', name='booking_status_enum'), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['department_request_id'], ['department_requests.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['resource_id'], ['resources.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_resource_bookings_department_request_id'), 'resource_bookings', ['department_request_id'], unique=False)
    op.create_index(op.f('ix_resource_bookings_id'), 'resource_bookings', ['id'], unique=False)
    op.create_index(op.f('ix_resource_bookings_resource_id'), 'resource_bookings', ['resource_id'], unique=False)
    op.create_index(op.f('ix_resource_bookings_status'), 'resource_bookings', ['status'], unique=False)
    op.create_index('ix_resource_time_status', 'resource_bookings', ['resource_id', 'start_time', 'end_time', 'status'], unique=False)

    # 8. Request Versions
    op.create_table(
        'request_versions',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('department_request_id', sa.Integer(), nullable=False),
        sa.Column('version_number', sa.Integer(), nullable=False),
        sa.Column('requested_payload_json', sa.Text(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['department_request_id'], ['department_requests.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_request_versions_department_request_id'), 'request_versions', ['department_request_id'], unique=False)
    op.create_index(op.f('ix_request_versions_id'), 'request_versions', ['id'], unique=False)

    # 9. Decision History
    op.create_table(
        'decision_history',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('department_request_id', sa.Integer(), nullable=False),
        sa.Column('version_number', sa.Integer(), nullable=False),
        sa.Column('reviewer_user_id', sa.Integer(), nullable=False),
        sa.Column('action', sa.Enum('APPROVED', 'REJECTED', 'CORRECTION_REQUESTED', name='decision_action_enum'), nullable=False),
        sa.Column('remarks', sa.Text(), nullable=True),
        sa.Column('timestamp', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['department_request_id'], ['department_requests.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['reviewer_user_id'], ['users.id'], ondelete='RESTRICT'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_decision_history_department_request_id'), 'decision_history', ['department_request_id'], unique=False)
    op.create_index(op.f('ix_decision_history_id'), 'decision_history', ['id'], unique=False)

    # 10. Permission Letters
    op.create_table(
        'permission_letters',
        sa.Column('id', sa.String(length=64), nullable=False),
        sa.Column('department_request_id', sa.Integer(), nullable=False),
        sa.Column('version_number', sa.Integer(), nullable=False),
        sa.Column('document_hash', sa.String(length=64), nullable=False),
        sa.Column('digital_signature', sa.Text(), nullable=False),
        sa.Column('storage_path', sa.String(length=500), nullable=False),
        sa.Column('status', sa.Enum('VALID', 'SUPERSEDED', 'REVOKED', name='document_status_enum'), nullable=False),
        sa.Column('issued_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['department_request_id'], ['department_requests.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_permission_letters_department_request_id'), 'permission_letters', ['department_request_id'], unique=False)
    op.create_index(op.f('ix_permission_letters_document_hash'), 'permission_letters', ['document_hash'], unique=True)
    op.create_index(op.f('ix_permission_letters_id'), 'permission_letters', ['id'], unique=False)
    op.create_index(op.f('ix_permission_letters_status'), 'permission_letters', ['status'], unique=False)

    # 11. Blockchain Records
    op.create_table(
        'blockchain_records',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('permission_letter_id', sa.String(length=64), nullable=False),
        sa.Column('tx_hash', sa.String(length=66), nullable=True),
        sa.Column('block_number', sa.Integer(), nullable=True),
        sa.Column('contract_address', sa.String(length=42), nullable=True),
        sa.Column('status', sa.Enum('PENDING', 'CONFIRMED', 'FAILED', name='blockchain_tx_status_enum'), nullable=False),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('submitted_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('confirmed_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['permission_letter_id'], ['permission_letters.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_blockchain_records_id'), 'blockchain_records', ['id'], unique=False)
    op.create_index(op.f('ix_blockchain_records_permission_letter_id'), 'blockchain_records', ['permission_letter_id'], unique=False)
    op.create_index(op.f('ix_blockchain_records_status'), 'blockchain_records', ['status'], unique=False)
    op.create_index(op.f('ix_blockchain_records_tx_hash'), 'blockchain_records', ['tx_hash'], unique=True)

    # 12. Audit Logs
    op.create_table(
        'audit_logs',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('actor_id', sa.Integer(), nullable=True),
        sa.Column('actor_role', sa.String(length=50), nullable=False),
        sa.Column('action', sa.String(length=100), nullable=False),
        sa.Column('target_entity', sa.String(length=50), nullable=False),
        sa.Column('target_id', sa.String(length=100), nullable=False),
        sa.Column('details_json', sa.Text(), nullable=True),
        sa.Column('ip_address', sa.String(length=45), nullable=True),
        sa.Column('timestamp', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_audit_logs_action'), 'audit_logs', ['action'], unique=False)
    op.create_index(op.f('ix_audit_logs_actor_id'), 'audit_logs', ['actor_id'], unique=False)
    op.create_index(op.f('ix_audit_logs_id'), 'audit_logs', ['id'], unique=False)
    op.create_index(op.f('ix_audit_logs_timestamp'), 'audit_logs', ['timestamp'], unique=False)
    op.create_index('ix_audit_target_lookup', 'audit_logs', ['target_entity', 'target_id'], unique=False)


def downgrade() -> None:
    op.drop_table('audit_logs')
    op.drop_table('blockchain_records')
    op.drop_table('permission_letters')
    op.drop_table('decision_history')
    op.drop_table('request_versions')
    op.drop_table('resource_bookings')
    op.drop_table('department_requests')
    op.drop_table('events')
    op.drop_table('resources')
    op.drop_table('users')
    op.drop_table('departments')

    # Drop enums
    sa.Enum(name='blockchain_tx_status_enum').drop(op.get_bind(), checkfirst=True)
    sa.Enum(name='document_status_enum').drop(op.get_bind(), checkfirst=True)
    sa.Enum(name='decision_action_enum').drop(op.get_bind(), checkfirst=True)
    sa.Enum(name='booking_status_enum').drop(op.get_bind(), checkfirst=True)
    sa.Enum(name='dept_request_status_enum').drop(op.get_bind(), checkfirst=True)
    sa.Enum(name='event_status_enum').drop(op.get_bind(), checkfirst=True)
    sa.Enum(name='resource_type_enum').drop(op.get_bind(), checkfirst=True)
    sa.Enum(name='user_role_enum').drop(op.get_bind(), checkfirst=True)
