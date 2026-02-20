"""
Comprehensive seed script for Water Quality Monitor

Run: python seed_users.py
"""
import random
from datetime import datetime, timedelta
from database import SessionLocal
from security import hash_password
from models import (
    User, UserRole, WaterStation, StationReading,
    Alert, AlertType, Collaboration, Report, ReportStatus,
    NgoProject
)


def seed():
    db = SessionLocal()

    print("\n🌊 Water Quality Monitor — Seed Script")
    print("=" * 50)

    # ---------- Users ----------
    print("\n👥 Seeding users...")
    users_data = [
        {"name": "Aarav Citizen", "email": "citizen@example.com", "role": UserRole.citizen, "location": "New Delhi"},
        {"name": "Priya User", "email": "user@example.com", "role": UserRole.user, "location": "Mumbai"},
        {"name": "Clean Rivers NGO", "email": "ngo@example.com", "role": UserRole.ngo, "location": "Varanasi"},
        {"name": "Rajesh Authority", "email": "authority@example.com", "role": UserRole.authority, "location": "Hyderabad"},
        {"name": "Sita Admin", "email": "admin@example.com", "role": UserRole.admin, "location": "Bangalore"},
    ]

    created_users = {}
    for u in users_data:
        existing = db.query(User).filter(User.email == u["email"]).first()
        if existing:
            db.delete(existing)
            db.commit()
        user = User(
            name=u["name"],
            email=u["email"],
            password=hash_password("password123"),
            role=u["role"],
            location=u["location"],
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        created_users[u["role"].value] = user
        print(f"  ✓ Created {u['role'].value}: {u['email']}")

    # ---------- Water Stations ----------
    print("\n📍 Seeding water stations...")
    stations_data = [
        {"name": "Yamuna WQ Station", "location": "New Delhi", "latitude": "28.6139", "longitude": "77.2090", "managed_by": "CPCB"},
        {"name": "Ganga Monitoring Point", "location": "Varanasi", "latitude": "25.3176", "longitude": "83.0106", "managed_by": "CPCB"},
        {"name": "Hussain Sagar Station", "location": "Hyderabad", "latitude": "17.4239", "longitude": "78.4738", "managed_by": "TSPCB"},
        {"name": "Cauvery River Station", "location": "Bangalore", "latitude": "12.9716", "longitude": "77.5946", "managed_by": "KSPCB"},
        {"name": "Sabarmati Station", "location": "Ahmedabad", "latitude": "23.0225", "longitude": "72.5714", "managed_by": "GPCB"},
    ]

    created_stations = []
    for s in stations_data:
        station = WaterStation(**s)
        db.add(station)
        db.commit()
        db.refresh(station)
        created_stations.append(station)
        print(f"  ✓ Created station: {s['name']}")

    # ---------- Station Readings ----------
    print("\n📊 Seeding station readings...")
    parameters = {
        "pH": (6.0, 9.0),
        "DO": (3.0, 8.0),
        "turbidity": (1.0, 15.0),
        "lead": (0.001, 0.02),
        "arsenic": (0.001, 0.015),
    }

    reading_count = 0
    for station in created_stations:
        for days_ago in range(31):
            for param, (low, high) in parameters.items():
                value = round(random.uniform(low, high), 4)
                reading = StationReading(
                    station_id=station.id,
                    parameter=param,
                    value=str(value),
                    recorded_at=datetime.utcnow() - timedelta(days=days_ago, hours=random.randint(0, 12)),
                )
                db.add(reading)
                reading_count += 1
    db.commit()
    print(f"  ✓ Created {reading_count} station readings")

    # ---------- Alerts ----------
    print("\n🚨 Seeding alerts...")
    alerts_data = [
        {"type": AlertType.contamination, "message": "High lead levels detected in Yamuna water supply.", "location": "New Delhi", "lat": "28.6139", "lon": "77.2090", "severity": "high", "station": created_stations[0]},
        {"type": AlertType.boil_notice, "message": "Boil water advisory issued for Varanasi district.", "location": "Varanasi", "lat": "25.3176", "lon": "83.0106", "severity": "critical", "station": created_stations[1]},
        {"type": AlertType.outage, "message": "Water treatment plant maintenance scheduled.", "location": "Hyderabad", "lat": "17.4239", "lon": "78.4738", "severity": "medium", "station": created_stations[2]},
        {"type": AlertType.contamination, "message": "High turbidity observed in Cauvery River.", "location": "Bangalore", "lat": "12.9716", "lon": "77.5946", "severity": "medium", "station": created_stations[3]},
        {"type": AlertType.boil_notice, "message": "Precautionary boil notice for Sabarmati supply zone.", "location": "Ahmedabad", "lat": "23.0225", "lon": "72.5714", "severity": "low", "station": created_stations[4]},
    ]

    created_alerts = []
    for a in alerts_data:
        alert = Alert(
            type=a["type"],
            message=a["message"],
            location=a["location"],
            latitude=a["lat"],
            longitude=a["lon"],
            severity=a["severity"],
            station_id=a["station"].id,
            is_active="true",
        )
        db.add(alert)
        db.commit()
        db.refresh(alert)
        created_alerts.append(alert)
    print(f"  ✓ Created {len(created_alerts)} alerts")

    # ---------- Reports ----------
    print("\n📋 Seeding reports...")
    reports_data = [
        {"location": "Yamuna River Bank", "description": "Foam and industrial waste observed near the bank.", "water_source": "River", "station_name": "Yamuna WQ Station", "alert_id": created_alerts[0].id, "user": created_users["citizen"]},
        {"location": "Varanasi Ghat", "description": "Discoloration of water reported by locals.", "water_source": "River", "station_name": "Ganga Monitoring Point", "alert_id": None, "user": created_users["citizen"]},
        {"location": "Hussain Sagar Lake", "description": "Bad odor and floating debris observed.", "water_source": "Lake", "station_name": "Hussain Sagar Station", "alert_id": None, "user": created_users["user"]},
        {"location": "Cauvery Bank, Mysore Road", "description": "Sewage discharge spotted near residential area.", "water_source": "River", "station_name": "Cauvery River Station", "alert_id": None, "user": created_users["citizen"], "status": ReportStatus.verified},
        {"location": "Sabarmati Riverfront", "description": "Oil spill from nearby factory.", "water_source": "River", "station_name": "Sabarmati Station", "alert_id": None, "user": created_users["user"], "status": ReportStatus.rejected},
    ]

    for r in reports_data:
        report = Report(
            user_id=r["user"].id,
            location=r["location"],
            description=r["description"],
            water_source=r["water_source"],
            station_name=r["station_name"],
            alert_id=r.get("alert_id"),
            status=r.get("status", ReportStatus.pending),
        )
        db.add(report)
        db.commit()
        db.refresh(report)

        # Link report back to alert if applicable
        if r.get("alert_id"):
            alert = db.query(Alert).filter(Alert.id == r["alert_id"]).first()
            if alert:
                alert.report_id = report.id
                db.commit()

    print(f"  ✓ Created {len(reports_data)} reports")

    # ---------- Collaborations ----------
    print("\n🤝 Seeding collaborations...")
    collabs_data = [
        {"ngo_name": "Clean Ganga Mission", "project_name": "Project Ganga Clean", "contact_email": "contact@cleanganga.org", "phone": "+91-9876543210", "location": "Varanasi, UP", "description": "Comprehensive river cleanup and monitoring initiative.", "website": "https://cleanganga.org"},
        {"ngo_name": "Water Warriors", "project_name": "Yamuna Monitoring Project", "contact_email": "info@waterwarriors.in", "phone": "+91-9876543211", "location": "Delhi NCR", "description": "Community-driven water quality monitoring.", "website": "https://waterwarriors.in"},
        {"ngo_name": "Jal Jeevan Foundation", "project_name": "Community Water Kit Distribution", "contact_email": "support@jaljeevan.org", "phone": "+91-9876543212", "location": "Mumbai, MH", "description": "Distributing water testing kits to rural communities."},
    ]

    for c in collabs_data:
        collab = Collaboration(**c)
        db.add(collab)
    db.commit()
    print(f"  ✓ Created {len(collabs_data)} collaborations")

    # ---------- NGO Projects ----------
    print("\n🏛️ Seeding NGO projects...")
    ngo_user = created_users["ngo"]
    ngo_projects_data = [
        {"project_name": "River Cleanup Drive 2026", "contact_email": "cleanup@cleanrivers.org", "description": "Organizing monthly cleanup drives along the Ganga river banks in Varanasi."},
        {"project_name": "Water Quality Awareness Campaign", "contact_email": "awareness@cleanrivers.org", "description": "Educating communities about safe drinking water practices and water testing."},
        {"project_name": "Rural Water Testing Initiative", "contact_email": "rural@cleanrivers.org", "description": "Providing free water testing services to villages in UP and Bihar."},
    ]

    for np in ngo_projects_data:
        project = NgoProject(
            user_id=ngo_user.id,
            project_name=np["project_name"],
            contact_email=np["contact_email"],
            description=np["description"],
        )
        db.add(project)
    db.commit()
    print(f"  ✓ Created {len(ngo_projects_data)} NGO projects")

    print("\n" + "=" * 50)
    print("✅ Database seed completed successfully!")
    print("\nTest credentials:")
    print("  Citizen:   citizen@example.com / password123")
    print("  User:      user@example.com / password123")
    print("  NGO:       ngo@example.com / password123")
    print("  Authority: authority@example.com / password123")
    print("  Admin:     admin@example.com / password123")

    db.close()

if __name__ == "__main__":
    seed()
