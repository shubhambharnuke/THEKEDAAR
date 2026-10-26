"""Audit Trail Service for Tamper-Evident System Event Logging"""

import json
from datetime import datetime, timezone
from typing import Optional, Dict, Any
from sqlalchemy.orm import Session

from backend.app.database.models import AuditLog


def record_audit_event(
    db: Session,
    actor_id: Optional[int],
    actor_role: str,
    action: str,
    target_entity: str,
    target_id: str,
    details: Optional[Dict[str, Any]] = None,
    ip_address: Optional[str] = None,
) -> AuditLog:
    """
    Append an immutable event record to the audit_logs table.
    """
    details_str = json.dumps(details) if details else None

    entry = AuditLog(
        actor_id=actor_id,
        actor_role=actor_role,
        action=action,
        target_entity=target_entity,
        target_id=str(target_id),
        details_json=details_str,
        ip_address=ip_address,
        timestamp=datetime.now(timezone.utc),
    )
    db.add(entry)
    db.flush()
    return entry
