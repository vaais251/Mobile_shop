"""
Quick script to check database schema and test commission creation
"""
import sys
sys.path.insert(0, '/c/Users/Vaais/Desktop/Weekly MVPs/01_mobile_store/backend')

from app.core.database import get_db, engine
from app.models.commission import Commission, CommissionStatus
from sqlalchemy import inspect, text

# Check if commission_status enum exists
with engine.connect() as conn:
    result = conn.execute(text("""
        SELECT enumlabel 
        FROM pg_enum  
        JOIN pg_type ON pg_enum.enumtypid = pg_type.oid 
        WHERE pg_type.typname = 'commission_status'
        ORDER BY enumsortorder;
    """))
    print("Database commission_status enum values:")
    for row in result:
        print(f"  - {row[0]}")

# Check Python enum values
print("\nPython CommissionStatus enum values:")
for status in CommissionStatus:
    print(f"  - {status.name} = {status.value}")

# Test creating a commission with enum
print("\nPython enum CommissionStatus.PENDING:")
print(f"  Value: {CommissionStatus.PENDING}")
print(f"  Type: {type(CommissionStatus.PENDING)}")
print(f"  String value: {CommissionStatus.PENDING.value}")
