"""JWT / JWKS Token Verification and Authentication Dependencies"""

import json
import logging
from typing import Optional, Dict, Any
from urllib.error import URLError
from urllib.request import urlopen

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from sqlalchemy import select
from sqlalchemy.orm import Session

from backend.app.core.config import settings
from backend.app.database.session import get_db
from backend.app.database.models import User

logger = logging.getLogger("thekedar.auth")

security = HTTPBearer(auto_error=False)

# In-memory JWKS cache
_cached_jwks: Optional[Dict[str, Any]] = None


def fetch_jwks() -> Optional[Dict[str, Any]]:
    """Fetch JSON Web Key Set from Better Auth Next.js endpoint with caching."""
    global _cached_jwks
    if _cached_jwks is not None:
        return _cached_jwks

    # Skip network fetch in testing environment or if URL is not configured
    if settings.ENVIRONMENT == "test" or not settings.BETTER_AUTH_JWKS_URL:
        return None

    try:
        with urlopen(settings.BETTER_AUTH_JWKS_URL, timeout=1) as response:
            if response.status == 200:
                data = json.loads(response.read().decode())
                _cached_jwks = data
                return _cached_jwks
    except (URLError, TimeoutError, Exception) as exc:
        logger.warning("Could not fetch remote JWKS: %s", exc)

    return None


def decode_token(token: str) -> Dict[str, Any]:
    """
    Decode and verify JWT signature.
    Checks token header algorithm: uses RS256 with JWKS if RS256,
    or HS256 with BETTER_AUTH_SECRET if HS256.
    """
    try:
        unverified_header = jwt.get_unverified_header(token)
        alg = unverified_header.get("alg", "HS256")
    except Exception:
        alg = "HS256"

    # If RS256, verify with JWKS
    if alg == "RS256":
        jwks = fetch_jwks()
        if jwks and "keys" in jwks:
            try:
                kid = unverified_header.get("kid")
                for key in jwks["keys"]:
                    if key.get("kid") == kid:
                        return jwt.decode(
                            token,
                            key,
                            algorithms=["RS256"],
                            options={"verify_aud": False},
                        )
            except JWTError:
                pass

    # Verify with symmetric secret
    try:
        return jwt.decode(
            token,
            settings.BETTER_AUTH_SECRET,
            algorithms=["HS256", "RS256"],
            options={"verify_aud": False},
        )
    except JWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Could not validate credentials: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )


def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: Session = Depends(get_db),
) -> User:
    """Dependency for extracting and validating the authenticated user."""
    if not credentials or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization token required",
            headers={"WWW-Authenticate": "Bearer"},
        )

    payload = decode_token(credentials.credentials)
    email: Optional[str] = payload.get("email") or payload.get("sub")

    if not email:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token claims: subject/email missing",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = db.scalar(select(User).where(User.email == email))
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User associated with token not found in system",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is deactivated",
        )

    return user
