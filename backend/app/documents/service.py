"""Document Generation, Cryptographic Signing, and Storage Management"""

import json
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional, List, Dict, Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from backend.app.core.config import settings
from backend.app.database.models import (
    DepartmentRequest,
    Event,
    Department,
    User,
    PermissionLetter,
    DocumentStatus,
    RequestVersion,
)
from backend.app.documents.generator import generate_permission_letter_pdf
from backend.app.documents.signer import sign_document_bytes


def generate_and_sign_letter_for_request(
    db: Session,
    department_request_id: int,
) -> PermissionLetter:
    """
    Creates an official permission letter PDF for an approved department request,
    digitally signs it, saves to local storage, and stores hash and signature in database.
    Supersedes any previous versions of the letter for this request.
    """
    dept_req = db.scalar(
        select(DepartmentRequest).where(DepartmentRequest.id == department_request_id)
    )
    if not dept_req:
        raise ValueError(f"DepartmentRequest {department_request_id} not found")

    event = db.scalar(select(Event).where(Event.id == dept_req.event_id))
    organizer = db.scalar(select(User).where(User.id == event.organizer_user_id))
    department = db.scalar(select(Department).where(Department.id == dept_req.department_id))

    # Load requested resources from current version
    current_ver = db.scalar(
        select(RequestVersion).where(
            RequestVersion.department_request_id == dept_req.id,
            RequestVersion.version_number == dept_req.current_version,
        )
    )
    allocated_items = []
    if current_ver and current_ver.requested_payload_json:
        try:
            allocated_items = json.loads(current_ver.requested_payload_json)
        except Exception:
            allocated_items = []

    # 1. Supersede any existing letters for this request
    existing_letters = db.scalars(
        select(PermissionLetter).where(
            PermissionLetter.department_request_id == dept_req.id,
            PermissionLetter.status == DocumentStatus.VALID,
        )
    ).all()
    for letter in existing_letters:
        letter.status = DocumentStatus.SUPERSEDED

    # 2. Generate canonical Letter ID & PDF
    letter_id = f"PL-{department.code}-{event.id:04d}-V{dept_req.current_version}-{uuid.uuid4().hex[:6].upper()}"
    now_utc = datetime.now(timezone.utc)

    pdf_bytes = generate_permission_letter_pdf(
        letter_id=letter_id,
        event_title=event.title,
        organizer_name=organizer.full_name,
        organizer_email=organizer.email,
        department_name=department.name,
        department_code=department.code,
        version_number=dept_req.current_version,
        allocated_resources=allocated_items,
        issued_at=now_utc,
    )

    # 3. Cryptographically Sign Document & Compute Hash
    doc_hash, signature_hex = sign_document_bytes(pdf_bytes)

    # 4. Save PDF to storage directory
    storage_dir = Path(settings.STORAGE_DIR)
    storage_dir.mkdir(parents=True, exist_ok=True)
    file_path = storage_dir / f"{letter_id}.pdf"
    with open(file_path, "wb") as f:
        f.write(pdf_bytes)

    # 5. Persist record in permission_letters table
    letter_record = PermissionLetter(
        id=letter_id,
        department_request_id=dept_req.id,
        version_number=dept_req.current_version,
        document_hash=doc_hash,
        digital_signature=signature_hex,
        storage_path=str(file_path),
        status=DocumentStatus.VALID,
        issued_at=now_utc,
    )
    db.add(letter_record)
    db.flush()

    # 6. Submit hash to on-chain DocumentRegistry
    from backend.app.blockchain.service import blockchain_service
    blockchain_service.submit_document_hash(
        db=db,
        permission_letter_id=letter_record.id,
        doc_hash_hex=doc_hash,
        doc_id=letter_id,
        version=dept_req.current_version,
    )

    return letter_record
