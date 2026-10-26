"""Production Master Data Seeder for THEKEDAR

Idempotent initialization script for institutional departments, core facilities,
and administrative accounts. Safe to run against production Neon PostgreSQL.
"""

import sys
from pathlib import Path
from sqlalchemy import select

# Ensure project root is on sys.path
root_dir = Path(__file__).resolve().parent.parent.parent.parent
sys.path.insert(0, str(root_dir))

from backend.app.database.session import SessionLocal
from backend.app.database.models import (
    User,
    UserRole,
    Department,
    Resource,
    ResourceType,
)


def seed_production_data():
    db = SessionLocal()
    try:
        print("Initializing production master data...")

        # 1. Institutional Departments
        departments_data = [
            {
                "name": "Office of Student Welfare",
                "code": "SW",
                "contact_email": "sw@institutional-control.edu",
            },
            {
                "name": "Estate & Venues Directorate",
                "code": "EST",
                "contact_email": "estate@institutional-control.edu",
            },
            {
                "name": "Department of Computer Science & Engineering",
                "code": "CSE",
                "contact_email": "cse.hod@institutional-control.edu",
            },
            {
                "name": "Department of Physical Education & Sports",
                "code": "PE",
                "contact_email": "sports@institutional-control.edu",
            },
            {
                "name": "Campus Security & Gate Operations",
                "code": "SEC",
                "contact_email": "security@institutional-control.edu",
            },
        ]

        dept_map = {}
        for d in departments_data:
            existing = db.scalar(select(Department).where(Department.code == d["code"]))
            if not existing:
                dept = Department(
                    name=d["name"],
                    code=d["code"],
                    contact_email=d["contact_email"],
                )
                db.add(dept)
                db.flush()
                dept_map[d["code"]] = dept.id
                print(f"Created Department: {dept.name} ({dept.code})")
            else:
                dept_map[d["code"]] = existing.id
                print(f"Existing Department: {existing.name} ({existing.code})")

        # 2. Institutional Resources
        resources_data = [
            {
                "dept_code": "EST",
                "name": "Main Auditorium (Dr. APJ Abdul Kalam Hall)",
                "code": "AUD-MAIN",
                "type": ResourceType.AUDITORIUM,
                "location": "Academic Block A, Ground Floor",
                "capacity": 850,
                "spec": "Christie 4K Laser Projection, Line Array Acoustic System, Stage Lighting Grid, Green Rooms",
            },
            {
                "dept_code": "EST",
                "name": "Executive Seminar Hall",
                "code": "SEM-01",
                "type": ResourceType.SEMINAR_HALL,
                "location": "Administrative Block, 2nd Floor",
                "capacity": 180,
                "spec": "Dual Motorized Screens, Shure Wireless Microphones, Live Webcast Terminal",
            },
            {
                "dept_code": "SW",
                "name": "Student Activities Center Amphitheater",
                "code": "AMPHI-SAC",
                "type": ResourceType.OTHER,
                "location": "SAC Complex Courtyard",
                "capacity": 500,
                "spec": "Open-air stepped seating, 3-phase sound distribution board, perimeter floodlights",
            },
            {
                "dept_code": "CSE",
                "name": "High Performance Computing Lab",
                "code": "LAB-HPC",
                "type": ResourceType.LAB,
                "location": "CS Building, Room 301",
                "capacity": 65,
                "spec": "65 Dual-Monitor Workstations, NVIDIA A100 GPU Cluster access, Isolated Gigabit Subnet",
            },
            {
                "dept_code": "CSE",
                "name": "Robotics & Embedded Systems Lab",
                "code": "LAB-ROBO",
                "type": ResourceType.LAB,
                "location": "Innovation Block, Ground Floor",
                "capacity": 45,
                "spec": "Soldering stations, oscilloscope benches, 3D printing enclosure, safety exhaust",
            },
            {
                "dept_code": "PE",
                "name": "Campus Athletic Stadium Turf",
                "code": "FLD-FB",
                "type": ResourceType.GROUND,
                "location": "Sports Complex East",
                "capacity": 2500,
                "spec": "FIFA-standard artificial turf, 4-tower high-mast floodlights, digital scoreboard",
            },
            {
                "dept_code": "PE",
                "name": "Indoor Badminton & Sports Arena",
                "code": "CRT-BADM",
                "type": ResourceType.GROUND,
                "location": "Gymkhana Block Level 1",
                "capacity": 300,
                "spec": "4 Maple wood courts, anti-glare sports LED lighting, player locker access",
            },
        ]

        for r in resources_data:
            existing = db.scalar(select(Resource).where(Resource.code == r["code"]))
            if not existing:
                res = Resource(
                    department_id=dept_map[r["dept_code"]],
                    name=r["name"],
                    code=r["code"],
                    resource_type=r["type"],
                    location=r["location"],
                    capacity=r["capacity"],
                    equipment_spec=r["spec"],
                    is_active=True,
                )
                db.add(res)
                print(f"Created Resource: {res.name} [{res.code}]")
            else:
                print(f"Existing Resource: {existing.name} [{existing.code}]")

        # 3. Administrator & Authority Accounts
        admin_email = "admin@institutional-control.edu"
        existing_admin = db.scalar(select(User).where(User.email == admin_email))
        if not existing_admin:
            admin_user = User(
                email=admin_email,
                full_name="Registrar Office Administrator",
                role=UserRole.ADMIN,
                is_active=True,
            )
            db.add(admin_user)
            print(f"Created Master Admin: {admin_email}")

        db.commit()
        print("Production master data seeding complete.")
    except Exception as e:
        db.rollback()
        print(f"Error during seeding: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_production_data()
