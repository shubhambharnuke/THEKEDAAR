"""Database Seed Script for THEKEDAR Initial Master Data"""

from sqlalchemy.orm import Session
from sqlalchemy import select

from backend.app.database.session import SessionLocal, engine, Base
from backend.app.database.models import (
    Department,
    Resource,
    ResourceType,
    User,
    UserRole,
)


def seed_database(db: Session) -> None:
    """Idempotently seed master data into the database."""
    print("Beginning database seed...")

    # 1. Departments
    departments_data = [
        {
            "name": "Dean of Academic Affairs",
            "code": "DEAN_ACAD",
            "contact_email": "academics@college.edu",
        },
        {
            "name": "Dean of Student Welfare",
            "code": "STUDENT_WELFARE",
            "contact_email": "sw@college.edu",
        },
        {
            "name": "Department of Computer Engineering",
            "code": "DEPT_CSE",
            "contact_email": "cse@college.edu",
        },
    ]

    dept_map = {}
    for d_data in departments_data:
        dept = db.scalar(select(Department).where(Department.code == d_data["code"]))
        if not dept:
            dept = Department(**d_data)
            db.add(dept)
            db.flush()
            print(f"  + Created Department: {dept.name} ({dept.code})")
        else:
            print(f"  = Existing Department: {dept.name} ({dept.code})")
        dept_map[dept.code] = dept

    # 2. Resources
    resources_data = [
        {
            "name": "Dr. APJ Abdul Kalam Main Auditorium",
            "code": "AUDI_MAIN",
            "department_id": dept_map["STUDENT_WELFARE"].id,
            "resource_type": ResourceType.AUDITORIUM,
            "location": "Central Campus, Building A, Ground Floor",
            "capacity": 800,
            "equipment_spec": "Audio system, 4K Projector, Stage lighting, 4 Wireless Mics",
        },
        {
            "name": "Mini Auditorium",
            "code": "AUDI_MINI",
            "department_id": dept_map["STUDENT_WELFARE"].id,
            "resource_type": ResourceType.AUDITORIUM,
            "location": "Student Activity Center, 2nd Floor",
            "capacity": 250,
            "equipment_spec": "Projector, Podium Mic, Sound console",
        },
        {
            "name": "Sir Visvesvaraya Seminar Hall A",
            "code": "SEM_HALL_A",
            "department_id": dept_map["DEAN_ACAD"].id,
            "resource_type": ResourceType.SEMINAR_HALL,
            "location": "Academic Complex, 3rd Floor",
            "capacity": 120,
            "equipment_spec": "Dual displays, collar mic, central AC",
        },
        {
            "name": "Advanced Computing & AI Lab",
            "code": "LAB_COMP_301",
            "department_id": dept_map["DEPT_CSE"].id,
            "resource_type": ResourceType.LAB,
            "location": "Computer Department Building, Room 301",
            "capacity": 60,
            "equipment_spec": "60 High-performance Linux workstations, Gigabit switch",
        },
        {
            "name": "Smart Classroom 101",
            "code": "ROOM_101",
            "department_id": dept_map["DEAN_ACAD"].id,
            "resource_type": ResourceType.CLASSROOM,
            "location": "Main Block, 1st Floor",
            "capacity": 70,
            "equipment_spec": "Interactive smart board, Audio recording setup",
        },
    ]

    for r_data in resources_data:
        res = db.scalar(select(Resource).where(Resource.code == r_data["code"]))
        if not res:
            res = Resource(**r_data)
            db.add(res)
            print(f"  + Created Resource: {res.name} ({res.code})")
        else:
            print(f"  = Existing Resource: {res.name} ({res.code})")

    # 3. Users
    users_data = [
        {
            "email": "admin@college.edu",
            "full_name": "System Administrator",
            "role": UserRole.ADMIN,
            "department_id": None,
        },
        {
            "email": "dean.acad@college.edu",
            "full_name": "Dr. Sarah Jenkins (Dean Academics)",
            "role": UserRole.AUTHORITY,
            "department_id": dept_map["DEAN_ACAD"].id,
        },
        {
            "email": "dean.sw@college.edu",
            "full_name": "Prof. Rajesh Sharma (Dean Student Welfare)",
            "role": UserRole.AUTHORITY,
            "department_id": dept_map["STUDENT_WELFARE"].id,
        },
        {
            "email": "acm.lead@college.edu",
            "full_name": "Aarav Patel (ACM Chapter President)",
            "role": UserRole.STUDENT_CLUB,
            "department_id": None,
        },
        {
            "email": "gate.security@college.edu",
            "full_name": "Main Gate Security Desk",
            "role": UserRole.VERIFIER,
            "department_id": None,
        },
    ]

    for u_data in users_data:
        user = db.scalar(select(User).where(User.email == u_data["email"]))
        if not user:
            user = User(**u_data)
            db.add(user)
            print(f"  + Created User: {user.full_name} ({user.email}) [{user.role.value}]")
        else:
            print(f"  = Existing User: {user.full_name} ({user.email}) [{user.role.value}]")

    db.commit()
    print("Database seeding completed successfully.")


if __name__ == "__main__":
    db = SessionLocal()
    try:
        seed_database(db)
    finally:
        db.close()
