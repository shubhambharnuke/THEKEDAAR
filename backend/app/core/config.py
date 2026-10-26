"""Centralized Configuration Module for THEKEDAR Backend"""

import os
from pathlib import Path
from typing import List, Union

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings with environment variable bindings."""

    # Project Information
    PROJECT_NAME: str = "THEKEDAR"
    VERSION: str = "1.0.0"
    API_V1_PREFIX: str = "/api/v1"
    ENVIRONMENT: str = Field(default="development", description="development | production | test")

    # Base URLs & Networking
    API_BASE_URL: str = Field(default="http://localhost:8000")
    NEXT_PUBLIC_APP_URL: str = Field(default="http://localhost:3000")
    CORS_ALLOWED_ORIGINS: Union[List[str], str] = Field(
        default=["http://localhost:3000", "http://127.0.0.1:3000"]
    )

    # Database (Neon PostgreSQL)
    DATABASE_URL: str = Field(
        default="postgresql://postgres:postgres@localhost:5432/thekedar",
        description="Neon PostgreSQL pooled connection URL",
    )

    # Better Auth / JWT Bridge
    BETTER_AUTH_SECRET: str = Field(
        default="default-development-secret-minimum-32-characters-long",
        description="Shared secret or JWT verification key from Better Auth",
    )
    BETTER_AUTH_JWKS_URL: str = Field(
        default="http://localhost:3000/api/auth/jwks",
        description="Next.js Better Auth JWKS endpoint for token signature verification",
    )
    JWT_ALGORITHM: str = "RS256"

    # Ethereum Sepolia Blockchain
    SEPOLIA_RPC_URL: str = Field(
        default="https://rpc.sepolia.org",
        description="Sepolia RPC endpoint (Alchemy, Infura, etc.)",
    )
    BLOCKCHAIN_CHAIN_ID: int = 11155111
    DOCUMENT_REGISTRY_ADDRESS: str = Field(
        default="0x0000000000000000000000000000000000000000",
        description="Deployed DocumentRegistry.sol contract address on Sepolia",
    )
    SIGNER_PRIVATE_KEY: str = Field(
        default="",
        description="Authority/Service Ethereum private key for on-chain registration",
    )

    # Document Storage
    STORAGE_DIR: Path = Field(
        default=Path(__file__).resolve().parent.parent.parent / "storage" / "letters",
        description="Directory for local storage of generated permission PDFs",
    )

    @field_validator("CORS_ALLOWED_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",") if i.strip()]
        elif isinstance(v, list):
            return v
        return ["http://localhost:3000", "http://127.0.0.1:3000"]

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )


settings = Settings()
