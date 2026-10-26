"""Production Migration Runner Script"""

import os
import sys
from pathlib import Path
from alembic.config import Config
from alembic import command

# Add repo root to sys.path
root_dir = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(root_dir))

from backend.app.core.config import settings


def run_upgrade():
    """Execute Alembic migrations to head against the configured DATABASE_URL."""
    ini_path = root_dir / "backend" / "alembic.ini"
    if not ini_path.exists():
        raise FileNotFoundError(f"alembic.ini not found at {ini_path}")

    alembic_cfg = Config(str(ini_path))
    alembic_cfg.set_main_option("script_location", str(root_dir / "backend" / "migrations"))

    print(f"Applying database migrations for {settings.PROJECT_NAME} ({settings.ENVIRONMENT})...")
    command.upgrade(alembic_cfg, "head")
    print("Database schema successfully upgraded to head.")


if __name__ == "__main__":
    run_upgrade()
