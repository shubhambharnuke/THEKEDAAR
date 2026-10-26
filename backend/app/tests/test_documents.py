"""Document Generation, Cryptographic Signing, and Verification Test Suite"""

from datetime import datetime, timezone
import hashlib
import io
import pytest

from backend.app.documents.generator import generate_permission_letter_pdf
from backend.app.documents.signer import (
    sign_document_bytes,
    verify_document_signature,
    get_public_key_pem,
)


def test_pdf_generation_produces_valid_header():
    """Verify generated PDF buffer contains valid PDF magic header."""
    pdf_bytes = generate_permission_letter_pdf(
        letter_id="PL-TEST-0001-V1-ABCDEF",
        event_title="Hackathon 2026",
        organizer_name="Jane Doe",
        organizer_email="jane@college.edu",
        department_name="Computer Engineering",
        department_code="DEPT_CSE",
        version_number=1,
        allocated_resources=[
            {
                "resource_code": "LAB_301",
                "resource_name": "Computing Lab",
                "start_time": "2026-11-01T09:00:00Z",
                "end_time": "2026-11-01T17:00:00Z",
            }
        ],
        issued_at=datetime.now(timezone.utc),
    )

    assert isinstance(pdf_bytes, bytes)
    assert len(pdf_bytes) > 500
    # PDF magic byte signature (%PDF-)
    assert pdf_bytes.startswith(b"%PDF-")


def test_digital_signature_and_tamper_detection():
    """
    Verify:
    1. A valid PDF signed produces a verifiable signature.
    2. Any alteration of even 1 single byte fails verification immediately.
    """
    original_pdf = generate_permission_letter_pdf(
        letter_id="PL-TEST-0002-V1-123456",
        event_title="AI Workshop",
        organizer_name="John Smith",
        organizer_email="john@college.edu",
        department_name="Academic Affairs",
        department_code="DEAN_ACAD",
        version_number=1,
        allocated_resources=[],
        issued_at=datetime.now(timezone.utc),
    )

    doc_hash, signature_hex = sign_document_bytes(original_pdf)

    # 1. Verify untouched document passes
    is_valid = verify_document_signature(original_pdf, signature_hex)
    assert is_valid is True

    # 2. Verify SHA-256 hash matches
    expected_hash = hashlib.sha256(original_pdf).hexdigest()
    assert doc_hash == expected_hash

    # 3. Alter 1 byte in the PDF (simulate tampering or forgery)
    tampered_bytes = bytearray(original_pdf)
    tampered_bytes[len(tampered_bytes) // 2] ^= 0xFF  # Flip bits in middle of document
    tampered_pdf = bytes(tampered_bytes)

    # 4. Tampered PDF MUST fail signature verification
    is_tampered_valid = verify_document_signature(tampered_pdf, signature_hex)
    assert is_tampered_valid is False

    # 5. Tampered PDF hash MUST not match original hash
    tampered_hash = hashlib.sha256(tampered_pdf).hexdigest()
    assert tampered_hash != doc_hash


def test_public_key_pem_export():
    """Verify authority public key can be retrieved in PEM format."""
    pem = get_public_key_pem()
    assert pem.startswith("-----BEGIN PUBLIC KEY-----")
    assert pem.strip().endswith("-----END PUBLIC KEY-----")
