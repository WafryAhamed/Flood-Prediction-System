"""
Database seed script.

Seeds:
  - 25 Sri Lanka districts
  - System roles (super_admin, admin, moderator, analyst, operator, citizen)
  - Default permissions per role
  - Initial system_settings rows for adminControl and maintenance

Usage:
    cd server
    python scripts/seed_db.py
"""

import asyncio
import json
import sys
from pathlib import Path

# Ensure server root is on sys.path
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert as pg_insert

from app.db.session import async_session_factory
from app.models.auth import Role, Permission
from app.models.gis import District
from app.models.audit import SystemSetting

# ---------------------------------------------------------------------------
# 1. Sri Lanka districts
# ---------------------------------------------------------------------------

SRI_LANKA_DISTRICTS = [
    {"code": "CMB", "name": "Colombo",       "name_si": "කොළඹ",       "name_ta": "கொழும்பு",      "province": "Western"},
    {"code": "GAM", "name": "Gampaha",       "name_si": "ගම්පහ",       "name_ta": "கம்பஹா",        "province": "Western"},
    {"code": "KLT", "name": "Kalutara",      "name_si": "කළුතර",       "name_ta": "களுத்துறை",     "province": "Western"},
    {"code": "KND", "name": "Kandy",         "name_si": "මහනුවර",      "name_ta": "கண்டி",         "province": "Central"},
    {"code": "MTL", "name": "Matale",        "name_si": "මාතලේ",       "name_ta": "மாத்தளை",       "province": "Central"},
    {"code": "NWE", "name": "Nuwara Eliya",  "name_si": "නුවරඑළිය",    "name_ta": "நுவரெலியா",     "province": "Central"},
    {"code": "GAL", "name": "Galle",         "name_si": "ගාල්ල",       "name_ta": "காலி",          "province": "Southern"},
    {"code": "MTR", "name": "Matara",        "name_si": "මාතර",        "name_ta": "மாத்தறை",       "province": "Southern"},
    {"code": "HMB", "name": "Hambantota",    "name_si": "හම්බන්තොට",   "name_ta": "அம்பாந்தோட்டை", "province": "Southern"},
    {"code": "JAF", "name": "Jaffna",        "name_si": "යාපනය",       "name_ta": "யாழ்ப்பாணம்",  "province": "Northern"},
    {"code": "KIL", "name": "Kilinochchi",   "name_si": "කිලිනොච්චිය", "name_ta": "கிளிநொச்சி",   "province": "Northern"},
    {"code": "MNR", "name": "Mannar",        "name_si": "මන්නාරම",     "name_ta": "மன்னார்",       "province": "Northern"},
    {"code": "VVN", "name": "Vavuniya",      "name_si": "වවුනියාව",    "name_ta": "வவுனியா",       "province": "Northern"},
    {"code": "MLP", "name": "Mullaitivu",    "name_si": "මුලතිව්",     "name_ta": "முல்லைத்தீவு", "province": "Northern"},
    {"code": "BTK", "name": "Batticaloa",    "name_si": "මඩකලපුව",     "name_ta": "மட்டக்களப்பு", "province": "Eastern"},
    {"code": "AMP", "name": "Ampara",        "name_si": "අම්පාර",      "name_ta": "அம்பாறை",       "province": "Eastern"},
    {"code": "TRN", "name": "Trincomalee",   "name_si": "ත්‍රිකුණාමලය", "name_ta": "திருகோணமலை",  "province": "Eastern"},
    {"code": "KUR", "name": "Kurunegala",    "name_si": "කුරුණෑගල",    "name_ta": "குருநாகல்",     "province": "North Western"},
    {"code": "PUT", "name": "Puttalam",      "name_si": "පුත්තලම",     "name_ta": "புத்தளம்",      "province": "North Western"},
    {"code": "ANR", "name": "Anuradhapura",  "name_si": "අනුරාධපුර",   "name_ta": "அனுராதபுரம்",  "province": "North Central"},
    {"code": "PLN", "name": "Polonnaruwa",   "name_si": "පොළොන්නරුව",  "name_ta": "பொலன்னறுவை",   "province": "North Central"},
    {"code": "BDL", "name": "Badulla",       "name_si": "බදුල්ල",      "name_ta": "பதுளை",         "province": "Uva"},
    {"code": "MNG", "name": "Monaragala",    "name_si": "මොණරාගල",     "name_ta": "மொணராகலை",      "province": "Uva"},
    {"code": "RAT", "name": "Ratnapura",     "name_si": "රත්නපුර",     "name_ta": "இரத்தினபுரி",   "province": "Sabaragamuwa"},
    {"code": "KEG", "name": "Kegalle",       "name_si": "කෑගල්ල",      "name_ta": "கேகாலை",        "province": "Sabaragamuwa"},
]

# ---------------------------------------------------------------------------
# 2. Roles
# ---------------------------------------------------------------------------

ROLES = [
    {"name": "super_admin",  "display_name": "Super Admin",   "description": "Full system access"},
    {"name": "admin",        "display_name": "Administrator", "description": "Administrative access"},
    {"name": "moderator",    "display_name": "Moderator",     "description": "Content moderation"},
    {"name": "analyst",      "display_name": "Analyst",       "description": "Read-only analytics"},
    {"name": "operator",     "display_name": "Operator",      "description": "Field operations"},
    {"name": "citizen",      "display_name": "Citizen",       "description": "End-user (citizen)"},
]

# ---------------------------------------------------------------------------
# 3. Permissions
# ---------------------------------------------------------------------------

PERMISSIONS = [
    {"code": "reports:read",       "name": "View Reports",         "resource": "reports",    "action": "read",     "description": "View reports"},
    {"code": "reports:write",      "name": "Submit Reports",       "resource": "reports",    "action": "write",    "description": "Submit / edit reports"},
    {"code": "reports:moderate",   "name": "Moderate Reports",     "resource": "reports",    "action": "moderate", "description": "Verify / reject reports"},
    {"code": "broadcasts:read",    "name": "View Broadcasts",      "resource": "broadcasts", "action": "read",     "description": "View broadcasts"},
    {"code": "broadcasts:write",   "name": "Create Broadcasts",    "resource": "broadcasts", "action": "write",    "description": "Create / edit broadcasts"},
    {"code": "broadcasts:publish", "name": "Publish Broadcasts",   "resource": "broadcasts", "action": "publish",  "description": "Publish broadcasts"},
    {"code": "users:read",         "name": "View Users",           "resource": "users",      "action": "read",     "description": "View user list"},
    {"code": "users:write",        "name": "Manage Users",         "resource": "users",      "action": "write",    "description": "Create / edit users"},
    {"code": "users:delete",       "name": "Delete Users",         "resource": "users",      "action": "delete",   "description": "Delete users"},
    {"code": "settings:read",      "name": "View Settings",        "resource": "settings",   "action": "read",     "description": "View system settings"},
    {"code": "settings:write",     "name": "Edit Settings",        "resource": "settings",   "action": "write",    "description": "Edit system settings"},
    {"code": "analytics:read",     "name": "View Analytics",       "resource": "analytics",  "action": "read",     "description": "View analytics"},
    {"code": "gis:read",           "name": "View Map Layers",      "resource": "gis",        "action": "read",     "description": "View map layers"},
    {"code": "gis:write",          "name": "Edit GIS Layers",      "resource": "gis",        "action": "write",    "description": "Edit GIS layers"},
    {"code": "content:read",       "name": "View Content",         "resource": "content",    "action": "read",     "description": "View content"},
    {"code": "content:write",      "name": "Create Content",       "resource": "content",    "action": "write",    "description": "Create / edit content"},
]

# Permissions assigned per role
ROLE_PERMISSIONS: dict[str, list[str]] = {
    "super_admin": [p["code"] for p in PERMISSIONS],
    "admin": [
        "reports:read", "reports:write", "reports:moderate",
        "broadcasts:read", "broadcasts:write", "broadcasts:publish",
        "users:read", "users:write",
        "settings:read", "settings:write",
        "analytics:read",
        "gis:read", "gis:write",
        "content:read", "content:write",
    ],
    "moderator": ["reports:read", "reports:moderate", "broadcasts:read", "content:read", "content:write"],
    "analyst": ["reports:read", "analytics:read", "gis:read", "content:read"],
    "operator": ["reports:read", "reports:write", "broadcasts:read", "gis:read"],
    "citizen": ["reports:read", "reports:write", "content:read"],
}

# ---------------------------------------------------------------------------
# 4. Default system settings (adminControl + maintenance blobs)
# ---------------------------------------------------------------------------

DEFAULT_ADMIN_CONTROL = {
    "systemStatus": "online",
    "alertLevel": "GREEN",
    "maintenanceMode": False,
    "broadcastsEnabled": True,
    "reportsEnabled": True,
    "chatEnabled": True,
    "autoVerifyReports": False,
    "maxReportsPerHour": 100,
}

DEFAULT_MAINTENANCE = {
    "isActive": False,
    "message": "",
    "startTime": None,
    "endTime": None,
    "allowedRoles": ["super_admin", "admin"],
}

# ---------------------------------------------------------------------------
# Seed functions
# ---------------------------------------------------------------------------


async def seed_districts(session) -> int:
    count = 0
    for d in SRI_LANKA_DISTRICTS:
        exists = await session.execute(
            select(District).where(District.code == d["code"])
        )
        if exists.scalar_one_or_none():
            continue
        district = District(
            code=d["code"],
            name=d["name"],
            name_si=d.get("name_si"),
            name_ta=d.get("name_ta"),
            province=d["province"],
            is_active=True,
            shelter_readiness=0,
        )
        session.add(district)
        count += 1
    return count


async def seed_roles_permissions(session) -> tuple[int, int]:
    role_map: dict[str, Role] = {}
    roles_added = 0
    for rd in ROLES:
        row = (await session.execute(select(Role).where(Role.name == rd["name"]))).scalar_one_or_none()
        if row:
            role_map[rd["name"]] = row
        else:
            row = Role(name=rd["name"], display_name=rd["display_name"], description=rd["description"], is_system=rd.get("is_system", False))
            session.add(row)
            await session.flush()
            role_map[rd["name"]] = row
            roles_added += 1

    perm_map: dict[str, Permission] = {}
    perms_added = 0
    for pd in PERMISSIONS:
        row = (await session.execute(select(Permission).where(Permission.code == pd["code"]))).scalar_one_or_none()
        if row:
            perm_map[pd["code"]] = row
        else:
            row = Permission(code=pd["code"], name=pd["name"], resource=pd["resource"], action=pd["action"], description=pd["description"])
            session.add(row)
            await session.flush()
            perm_map[pd["code"]] = row
            perms_added += 1

    # Assign permissions to roles
    for role_name, perm_codes in ROLE_PERMISSIONS.items():
        role = role_map.get(role_name)
        if not role:
            continue
        for code in perm_codes:
            perm = perm_map.get(code)
            if not perm:
                continue
            # Check if already linked
            from app.models.auth import role_permissions as rp_table
            check = await session.execute(
                select(rp_table).where(
                    rp_table.c.role_id == role.id,
                    rp_table.c.permission_id == perm.id,
                )
            )
            if not check.fetchone():
                await session.execute(
                    rp_table.insert().values(role_id=role.id, permission_id=perm.id)
                )

    return roles_added, perms_added


async def seed_system_settings(session) -> int:
    settings_to_seed = [
        ("adminControl", DEFAULT_ADMIN_CONTROL),
        ("maintenance", DEFAULT_MAINTENANCE),
    ]
    count = 0
    for key, value in settings_to_seed:
        stmt = pg_insert(SystemSetting.__table__).values(
            key=key,
            value=json.dumps(value),
            value_type="json",
            category="integration",
            description=f"Default {key} state for integration layer",
        ).on_conflict_do_nothing(index_elements=["key"])
        result = await session.execute(stmt)
        count += result.rowcount
    return count


async def main() -> None:
    print("Starting seed...")
    async with async_session_factory() as session:
        d = await seed_districts(session)
        print(f"  Districts: {d} added")

        r, p = await seed_roles_permissions(session)
        print(f"  Roles: {r} added, Permissions: {p} added")

        s = await seed_system_settings(session)
        print(f"  System settings: {s} added")

        await session.commit()
    print("Seed complete.")


if __name__ == "__main__":
    asyncio.run(main())
