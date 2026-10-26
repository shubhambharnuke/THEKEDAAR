"""Cryptographic Asymmetric Key Management & Digital Signature Service"""

import os
import hashlib
from pathlib import Path
from typing import Tuple

from cryptography.exceptions import InvalidSignature
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import padding, rsa
from cryptography.hazmat.backends import default_backend

from backend.app.core.config import settings

KEYS_DIR = Path(__file__).resolve().parent.parent.parent / "storage" / "keys"
PRIVATE_KEY_PATH = KEYS_DIR / "authority_private_key.pem"
PUBLIC_KEY_PATH = KEYS_DIR / "authority_public_key.pem"


def _ensure_keypair_exists() -> Tuple[rsa.RSAPrivateKey, rsa.RSAPublicKey]:
    """Ensure authority RSA key pair is generated and persisted."""
    KEYS_DIR.mkdir(parents=True, exist_ok=True)

    if not PRIVATE_KEY_PATH.exists() or not PUBLIC_KEY_PATH.exists():
        # Generate 2048-bit RSA key pair
        private_key = rsa.generate_private_key(
            public_exponent=65537,
            key_size=2048,
            backend=default_backend(),
        )
        public_key = private_key.public_key()

        # Save private key
        with open(PRIVATE_KEY_PATH, "wb") as f:
            f.write(
                private_key.private_bytes(
                    encoding=serialization.Encoding.PEM,
                    format=serialization.PrivateFormat.PKCS8,
                    encryption_algorithm=serialization.NoEncryption(),
                )
            )

        # Save public key
        with open(PUBLIC_KEY_PATH, "wb") as f:
            f.write(
                public_key.public_bytes(
                    encoding=serialization.Encoding.PEM,
                    format=serialization.PublicFormat.SubjectPublicKeyInfo,
                )
            )
        return private_key, public_key

    # Load existing keys
    with open(PRIVATE_KEY_PATH, "rb") as f:
        private_key = serialization.load_pem_private_key(
            f.read(),
            password=None,
            backend=default_backend(),
        )

    with open(PUBLIC_KEY_PATH, "rb") as f:
        public_key = serialization.load_pem_public_key(
            f.read(),
            backend=default_backend(),
        )

    return private_key, public_key


def get_public_key_pem() -> str:
    """Return the institutional authority public key in PEM format."""
    _, public_key = _ensure_keypair_exists()
    return public_key.public_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PublicFormat.SubjectPublicKeyInfo,
    ).decode("utf-8")


def sign_document_bytes(data: bytes) -> Tuple[str, str]:
    """
    Computes SHA-256 hash of document bytes and produces an RSA digital signature.
    Returns (document_hash_hex, signature_hex).
    """
    private_key, _ = _ensure_keypair_exists()

    # 1. Compute SHA-256 Hash
    sha256_hash = hashlib.sha256(data).hexdigest()

    # 2. Cryptographically sign the document bytes using RSA-PSS
    signature = private_key.sign(
        data,
        padding.PSS(
            mgf=padding.MGF1(hashes.SHA256()),
            salt_length=padding.PSS.MAX_LENGTH,
        ),
        hashes.SHA256(),
    )

    return sha256_hash, signature.hex()


def verify_document_signature(data: bytes, signature_hex: str) -> bool:
    """
    Verifies that the provided RSA digital signature matches the exact document bytes.
    Returns True if valid; False if forged or document has been modified.
    """
    try:
        _, public_key = _ensure_keypair_exists()
        signature_bytes = bytes.fromhex(signature_hex)

        public_key.verify(
            signature_bytes,
            data,
            padding.PSS(
                mgf=padding.MGF1(hashes.SHA256()),
                salt_length=padding.PSS.MAX_LENGTH,
            ),
            hashes.SHA256(),
        )
        return True
    except (InvalidSignature, ValueError, Exception):
        return False
