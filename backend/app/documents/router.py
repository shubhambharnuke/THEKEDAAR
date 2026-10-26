"""Document Verification, Download, and Public Key Endpoints"""

import hashlib
from pathlib import Path
from typing import Optional
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from fastapi.responses import FileResponse, PlainTextResponse
from pydantic import BaseModel, ConfigDict
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from backend.app.database.session import get_db
from backend.app.database.models import (
    PermissionLetter,
    DocumentStatus,
    DepartmentRequest,
    Event,
    Department,
)
from backend.app.documents.signer import (
    verify_document_signature,
    get_public_key_pem,
)

router = APIRouter(prefix="/documents", tags=["Permission Documents & Verification"])


class VerificationCheckResult(BaseModel):
    is_authentic: bool
    signature_valid: bool
    hash_matched: bool
    status: Optional[str] = None
    letter_id: Optional[str] = None
    version_number: Optional[int] = None
    event_title: Optional[str] = None
    department_name: Optional[str] = None
    issued_at: Optional[datetime] = None
    message: str

    model_config = ConfigDict(from_attributes=True)


@router.get("/public-key", response_class=PlainTextResponse)
def get_authority_public_key():
    """Retrieve institutional authority RSA public key for independent offline verification."""
    return get_public_key_pem()


@router.get("/{letter_id}/download")
def download_permission_letter(letter_id: str, db: Session = Depends(get_db)):
    """Download the official signed permission letter PDF."""
    letter = db.scalar(
        select(PermissionLetter).where(PermissionLetter.id == letter_id)
    )
    if not letter:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Permission letter '{letter_id}' not found",
        )

    file_path = Path(letter.storage_path)
    if not file_path.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Physical document file missing from storage",
        )

    return FileResponse(
        path=str(file_path),
        media_type="application/pdf",
        filename=f"{letter_id}.pdf",
    )


@router.post("/verify", response_model=VerificationCheckResult)
async def verify_permission_document(
    file: Optional[UploadFile] = File(None),
    letter_id: Optional[str] = Form(None),
    document_hash: Optional[str] = Form(None),
    db: Session = Depends(get_db),
):
    """
    Perform multi-step authenticity verification:
    1. Cryptographic RSA Digital Signature check against actual document bytes.
    2. SHA-256 Hash match against recorded institutional database.
    3. Status validation (ensuring document is VALID and not SUPERSEDED or REVOKED).
    """
    if not file and not letter_id and not document_hash:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Must provide either a PDF file upload, letter_id, or document_hash",
        )

    letter_record = None
    signature_valid = False
    hash_matched = False

    if file:
        file_bytes = await file.read()
        computed_hash = hashlib.sha256(file_bytes).hexdigest()

        # Find matching document by hash
        letter_record = db.scalar(
            select(PermissionLetter)
            .options(
                joinedload(PermissionLetter.department_request).joinedload(DepartmentRequest.event),
                joinedload(PermissionLetter.department_request).joinedload(DepartmentRequest.department),
            )
            .where(PermissionLetter.document_hash == computed_hash)
        )

        if letter_record:
            hash_matched = True
            signature_valid = verify_document_signature(file_bytes, letter_record.digital_signature)
        else:
            # Check if signature matches anyway
            hash_matched = False
            signature_valid = False

    elif letter_id:
        letter_record = db.scalar(
            select(PermissionLetter)
            .options(
                joinedload(PermissionLetter.department_request).joinedload(DepartmentRequest.event),
                joinedload(PermissionLetter.department_request).joinedload(DepartmentRequest.department),
            )
            .where(PermissionLetter.id == letter_id)
        )
        if letter_record:
            hash_matched = True
            # Re-verify on disk file
            p = Path(letter_record.storage_path)
            if p.exists():
                with open(p, "rb") as f:
                    content = f.read()
                signature_valid = verify_document_signature(content, letter_record.digital_signature)

    elif document_hash:
        letter_record = db.scalar(
            select(PermissionLetter)
            .options(
                joinedload(PermissionLetter.department_request).joinedload(DepartmentRequest.event),
                joinedload(PermissionLetter.department_request).joinedload(DepartmentRequest.department),
            )
            .where(PermissionLetter.document_hash == document_hash)
        )
        if letter_record:
            hash_matched = True
            p = Path(letter_record.storage_path)
            if p.exists():
                with open(p, "rb") as f:
                    content = f.read()
                signature_valid = verify_document_signature(content, letter_record.digital_signature)

    if not letter_record:
        return VerificationCheckResult(
            is_authentic=False,
            signature_valid=False,
            hash_matched=False,
            status="NOT_FOUND",
            message="No matching institutional permission letter found for the provided inputs.",
        )

    # Check status
    is_current = (letter_record.status == DocumentStatus.VALID)
    is_authentic = signature_valid and hash_matched and is_current

    event_title = None
    dept_name = None
    if letter_record.department_request:
        if letter_record.department_request.event:
            event_title = letter_record.department_request.event.title
        if letter_record.department_request.department:
            dept_name = letter_record.department_request.department.name

    if is_authentic:
        msg = "Document is authentic, signature verified, and authorization is CURRENT."
    elif not signature_valid:
        msg = "Digital signature verification FAILED. Document may be forged or tampered with."
    elif letter_record.status == DocumentStatus.SUPERSEDED:
        msg = f"Document is authentic but has been SUPERSEDED by version {letter_record.department_request.current_version}."
    elif letter_record.status == DocumentStatus.REVOKED:
        msg = "Document authorization has been officially REVOKED."
    else:
        msg = "Document integrity verification failed."

    return VerificationCheckResult(
        is_authentic=is_authentic,
        signature_valid=signature_valid,
        hash_matched=hash_matched,
        status=letter_record.status.value,
        letter_id=letter_record.id,
        version_number=letter_record.version_number,
        event_title=event_title,
        department_name=dept_name,
        issued_at=letter_record.issued_at,
        message=msg,
    )
