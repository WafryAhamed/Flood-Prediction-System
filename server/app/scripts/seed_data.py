"""
Database seed script - Create initial test data.

Usage:
    python -m app.scripts.seed_data

Creates:
- Admin users with different roles
- Sample districts and risk zones
- Test shelters and evacuation routes
- Sample weather data
- Test reports
"""
import asyncio
from datetime import datetime, timedelta
from uuid import uuid4

from sqlalchemy import select
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker

from app.core.config import settings
from app.core.security import hash_password, generate_public_id, generate_report_id
from app.models.auth import User, UserRole
from app.models.gis import (
    District,
    RiskZone,
    RiskLevel,
    ZoneType,
    Shelter,
    FacilityType,
    FacilityStatus,
    EvacuationRoute,
)
from app.models.weather import WeatherObservation, WeatherSource
from app.models.reports import CitizenReport, ReportType, ReportStatus, UrgencyLevel


async def seed_database():
    """Seed the database with test data."""
    
    engine = create_async_engine(str(settings.DATABASE_URL), echo=False)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as db:
        print("🌱 Seeding database with test data...")
        
        # Create admin users
        print("\n👤 Creating users...")
        users = await create_users(db)
        print(f"   ✓ Created {len(users)} users")
        
        # Create districts
        print("\n🏘️  Creating districts...")
        districts = await create_districts(db)
        print(f"   ✓ Created {len(districts)} districts")
        
        # Create risk zones
        print("\n⚠️  Creating risk zones...")
        zones = await create_risk_zones(db, districts)
        print(f"   ✓ Created {len(zones)} risk zones")
        
        # Create shelters
        print("\n🏛️  Creating shelters...")
        shelters = await create_shelters(db, districts)
        print(f"   ✓ Created {len(shelters)} shelters")
        
        # Create evacuation routes
        print("\n🚗 Creating evacuation routes...")
        routes = await create_evacuation_routes(db, districts, zones, shelters)
        print(f"   ✓ Created {len(routes)} evacuation routes")
        
        # Create weather observations
        print("\n🌧️  Creating weather data...")
        observations = await create_weather_data(db, districts)
        print(f"   ✓ Created {len(observations)} weather observations")
        
        # Create sample reports
        print("\n📝 Creating sample reports...")
        reports = await create_sample_reports(db, users, districts)
        print(f"   ✓ Created {len(reports)} reports")
        
        await db.commit()
        
        print("\n✅ Database seeding complete!")


async def create_users(db: AsyncSession) -> list:
    """Create initial users with different roles."""
    
    users = [
        User(
            public_id=generate_public_id(),
            email="super_admin@floodweb.local",
            password_hash=hash_password("SuperAdmin@123"),
            full_name="Super Administrator",
            phone_number="+94712345670",
            role=UserRole.SUPER_ADMIN,
            is_active=True,
            is_verified=True,
            home_district_id=None,
        ),
        User(
            public_id=generate_public_id(),
            email="admin@floodweb.local",
            password_hash=hash_password("Admin@123"),
            full_name="District Administrator",
            phone_number="+94712345671",
            role=UserRole.ADMIN,
            is_active=True,
            is_verified=True,
        ),
        User(
            public_id=generate_public_id(),
            email="moderator@floodweb.local",
            password_hash=hash_password("Moderator@123"),
            full_name="Report Moderator",
            phone_number="+94712345672",
            role=UserRole.MODERATOR,
            is_active=True,
            is_verified=True,
        ),
        User(
            public_id=generate_public_id(),
            email="operator@floodweb.local",
            password_hash=hash_password("Operator@123"),
            full_name="Field Operator",
            phone_number="+94712345673",
            role=UserRole.OPERATOR,
            is_active=True,
            is_verified=True,
        ),
        User(
            public_id=generate_public_id(),
            email="analyst@floodweb.local",
            password_hash=hash_password("Analyst@123"),
            full_name="Data Analyst",
            phone_number="+94712345674",
            role=UserRole.ANALYST,
            is_active=True,
            is_verified=True,
        ),
        User(
            public_id=generate_public_id(),
            email="citizen@floodweb.local",
            password_hash=hash_password("Citizen@123"),
            full_name="John Citizen",
            phone_number="+94712345675",
            role=UserRole.CITIZEN,
            is_active=True,
            is_verified=True,
        ),
    ]
    
    for user in users:
        db.add(user)
    
    await db.flush()
    return users


async def create_districts(db: AsyncSession) -> list:
    """Create sample districts."""
    
    districts = [
        District(
            code="CMB",
            name_en="Colombo",
            name_si="කොළඹ",
            name_ta="கொழும்பு",
            province="Western",
            area_sq_km=699,
            population=2328000,
            centroid_lat=6.9271,
            centroid_lon=80.6393,
            current_risk_level=RiskLevel.MEDIUM,
            is_active=True,
        ),
        District(
            code="KND",
            name_en="Kandy",
            name_si="කැන්දි",
            name_ta="கண்டி",
            province="Central",
            area_sq_km=1944,
            population=1398000,
            centroid_lat=7.2906,
            centroid_lon=80.6337,
            current_risk_level=RiskLevel.MEDIUM,
            is_active=True,
        ),
        District(
            code="MTR",
            name_en="Matara",
            name_si="මාතර",
            name_ta="மதுரை",
            province="Southern",
            area_sq_km=1283,
            population=815000,
            centroid_lat=5.7667,
            centroid_lon=80.5500,
            current_risk_level=RiskLevel.HIGH,
            is_active=True,
        ),
        District(
            code="JNP",
            name_en="Jaffna",
            name_si="යාපනය",
            name_ta="யாழ்ப்பாணம்",
            province="Northern",
            area_sq_km=1025,
            population=579000,
            centroid_lat=9.6615,
            centroid_lon=80.7850,
            current_risk_level=RiskLevel.LOW,
            is_active=True,
        ),
    ]
    
    for district in districts:
        db.add(district)
    
    await db.flush()
    return districts


async def create_risk_zones(db: AsyncSession, districts: list) -> list:
    """Create risk zones within districts."""
    
    zones = [
        RiskZone(
            district_id=districts[0].id,
            zone_code="CMB-01",
            name_en="Colombo City Center",
            name_si="කොළඹ නගර මධ්‍ය",
            name_ta="கொழும்பு நகர மையம்",
            zone_type=ZoneType.FLOOD,
            risk_level=RiskLevel.HIGH,
            population_at_risk=150000,
            area_sq_km=25,
        ),
        RiskZone(
            district_id=districts[0].id,
            zone_code="CMB-02",
            name_en="Colombo Western Zone",
            name_si="කොළඹ බටහිර කලාපය",
            name_ta="கொழும்பு மேற்கு மண்டலம்",
            zone_type=ZoneType.FLOOD,
            risk_level=RiskLevel.MEDIUM,
            population_at_risk=200000,
            area_sq_km=40,
        ),
        RiskZone(
            district_id=districts[2].id,
            zone_code="MTR-01",
            name_en="Matara Coastal Zone",
            name_si="මාතර තීරබද කලාපය",
            name_ta="மதுரை கடல் மண்டலம்",
            zone_type=ZoneType.LANDSLIDE,
            risk_level=RiskLevel.HIGH,
            population_at_risk=50000,
            area_sq_km=15,
        ),
    ]
    
    for zone in zones:
        db.add(zone)
    
    await db.flush()
    return zones


async def create_shelters(db: AsyncSession, districts: list) -> list:
    """Create evacuation shelters."""
    
    shelters = [
        Shelter(
            district_id=districts[0].id,
            name_en="Colombo Sports Stadium",
            name_si="කොළඹ ක්‍රීඩා ඉඩ්ඩම්",
            name_ta="கொழும்பு விளையாட்டு மைதானம்",
            facility_type=FacilityType.STADIUM,
            latitude=6.9271,
            longitude=80.6393,
            address="Sports Complex, Colombo",
            capacity=5000,
            current_occupancy=0,
            status=FacilityStatus.ACTIVE,
            contact_name="Stadium Manager",
            contact_phone="+94112345678",
            amenities=["water", "electricity", "medical", "toilets"],
            accessibility_features=["wheelchair_access", "parking"],
        ),
        Shelter(
            district_id=districts[0].id,
            name_en="Colombo School Complex",
            name_si="කොළඹ පාසල් සංකීර්ණය",
            name_ta="கொழும்பு பள்ளி வளாகம்",
            facility_type=FacilityType.SCHOOL,
            latitude=6.9250,
            longitude=80.6350,
            address="School Road, Colombo",
            capacity=2000,
            current_occupancy=0,
            status=FacilityStatus.ACTIVE,
            contact_name="School Principal",
            contact_phone="+94112345679",
            amenities=["water", "electricity", "toilets", "kitchen"],
        ),
        Shelter(
            district_id=districts[2].id,
            name_en="Matara Community Center",
            name_si="මාතර ප්‍රජා මධ්‍ය',
            name_ta="மதுரை சமூக மையம்",
            facility_type=FacilityType.COMMUNITY_CENTER,
            latitude=5.7667,
            longitude=80.5500,
            address="Main Street, Matara",
            capacity=1500,
            current_occupancy=0,
            status=FacilityStatus.ACTIVE,
            contact_name="Center Manager",
            contact_phone="+94412345680",
        ),
    ]
    
    for shelter in shelters:
        db.add(shelter)
    
    await db.flush()
    return shelters


async def create_evacuation_routes(
    db: AsyncSession,
    districts: list,
    zones: list,
    shelters: list,
) -> list:
    """Create evacuation routes."""
    
    routes = [
        EvacuationRoute(
            district_id=districts[0].id,
            origin_zone_id=zones[0].id,
            destination_shelter_id=shelters[0].id,
            name_en="CMB High Risk to Stadium",
            name_si="CMB උচ්চ ඉතිරි වීම සිටුවුම් දක්වා",
            name_ta="CMB உচ்ച ঝுКி மைதானத்திற்கு",
            distance_km=3.5,
            estimated_time_minutes=15,
            waypoints=[
                {"lat": 6.9271, "lon": 80.6393},
                {"lat": 6.9260, "lon": 80.6380},
            ],
        ),
    ]
    
    for route in routes:
        db.add(route)
    
    await db.flush()
    return routes


async def create_weather_data(db: AsyncSession, districts: list) -> list:
    """Create sample weather observations."""
    
    observations = []
    now = datetime.utcnow()
    
    for district in districts:
        obs = WeatherObservation(
            district_id=district.id,
            latitude=district.centroid_lat,
            longitude=district.centroid_lon,
            station_name=f"{district.name_en} Weather Station",
            observed_at=now,
            source=WeatherSource.OPEN_METEO,
            temperature_celsius=28.5,
            humidity_percent=75,
            precipitation_mm=5.2,
            wind_speed_kmh=12.3,
            wind_direction_degrees=180,
            pressure_hpa=1013.25,
            cloud_cover_percent=40,
        )
        observations.append(obs)
        db.add(obs)
    
    await db.flush()
    return observations


async def create_sample_reports(
    db: AsyncSession,
    users: list,
    districts: list,
) -> list:
    """Create sample citizen reports."""
    
    reports = [
        CitizenReport(
            report_id=generate_report_id(),
            reporter_id=users[5].id,  # citizen user
            district_id=districts[0].id,
            report_type=ReportType.FLOOD,
            title="Flooding at Main Street",
            description="Water level rising rapidly on Main Street. Traffic blocked.",
            description_si="මහා වීතියේ ජලය සාගරිකව ඉහළ යමින්. ට්‍රැෆිකය වැසි ඇත.",
            latitude=6.9271,
            longitude=80.6393,
            address="Main Street, Colombo",
            urgency_level=UrgencyLevel.HIGH,
            status=ReportStatus.VERIFIED,
            people_affected=50,
            contact_phone="+94712345675",
            is_anonymous=False,
            upvote_count=15,
        ),
        CitizenReport(
            report_id=generate_report_id(),
            reporter_id=users[5].id,
            district_id=districts[2].id,
            report_type=ReportType.LANDSLIDE,
            title="Road collapse - Matara highway",
            description="Major landslide on the mountain. Road completely blocked.",
            latitude=5.7667,
            longitude=80.5500,
            address="Matara Highway, KM 42",
            urgency_level=UrgencyLevel.CRITICAL,
            status=ReportStatus.PENDING,
            people_affected=100,
            contact_phone="+94712345675",
        ),
    ]
    
    for report in reports:
        db.add(report)
    
    await db.flush()
    return reports


if __name__ == "__main__":
    asyncio.run(seed_database())
