# Quick Setup Guide

## Step 1: Apply Database Migration

Choose one of these methods:

### Method A: Using Docker (Recommended)
```bash
cd backend
docker exec -i phone_shop_db psql -U postgres -d phone_shop_db < migrations/add_verified_seller_and_notifications.sql
```

### Method B: Direct PostgreSQL Connection
```bash
cd backend
psql -U postgres -d phone_shop_db -f migrations/add_verified_seller_and_notifications.sql
```

### Method C: Via Python (if psql not available)
```bash
cd backend
python -c "
from app.core.database import engine
from sqlalchemy import text

with open('migrations/add_verified_seller_and_notifications.sql') as f:
    sql = f.read()
    with engine.begin() as conn:
        for statement in sql.split(';'):
            if statement.strip():
                conn.execute(text(statement))
print('Migration applied successfully!')
"
```

---

## Step 2: Start the Backend
```bash
cd backend
# Activate virtual environment
source venv/bin/activate  # On Windows: venv\Scripts\activate
# Or if using uv:
uv venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Run the server
uvicorn app.main:app --reload --port 8000
```

---

## Step 3: Start the Frontend
```bash
cd frontend
npm run dev
# Or
yarn dev
```

---

## Step 4: Quick Test

1. **Test Notifications**:
   - Login as admin
   - Look at top-right corner for bell icon 🔔
   - List a new phone (from another account or as seller)
   - Check if notification appears

2. **Test Verified Seller Badge**:
   - Navigate to: http://localhost:3000/admin/users
   - Find a seller account
   - Click the BadgeCheck icon to toggle verified status
   - Visit Community page and see the blue checkmark

3. **Test Address Auto-Save**:
   - Place an order with shipping details
   - Check user profile via API:
     ```bash
     curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:8000/api/v1/auth/me
     ```
   - Verify `shipping_address` field is populated

---

## Troubleshooting

### Migration Fails
- Ensure database is running: `docker ps` or check PostgreSQL service
- Check if columns already exist: `\d users` in psql
- Try running statements individually

### Notifications Not Appearing
- Check browser console for errors
- Verify backend is running on port 8000
- Check network tab for `/api/v1/notifications` calls
- Ensure you're logged in as admin

### Verified Badge Not Showing
- Verify database migration ran successfully
- Check API response includes `is_verified_seller` field
- Clear browser cache and refresh
- Check console for JavaScript errors

---

## Database Verification

To verify the migration was successful:

```sql
-- Connect to database
psql -U postgres -d phone_shop_db

-- Check users table
\d users

-- You should see:
-- - is_verified_seller | boolean | not null | default false
-- - shipping_address   | text    |          |

-- Check notifications table exists
\d notifications

-- Should show all notification columns
```

---

## API Testing

Use these curl commands to test endpoints:

```bash
# Get notifications (admin only)
curl -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  http://localhost:8000/api/v1/notifications

# Get unread count
curl -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  http://localhost:8000/api/v1/notifications/unread-count

# Toggle verified seller badge
curl -X PATCH \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  http://localhost:8000/api/v1/admin/users/USER_ID/verified-seller-badge?verified_seller=true

# Update user shipping address
curl -X PATCH \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"shipping_address": "123 Main St, City"}' \
  http://localhost:8000/api/v1/auth/me
```

---

## Success!

If you see:
- ✅ Bell icon in admin navbar
- ✅ Blue checkmark on verified sellers in Community tab
- ✅ Notifications appear when listing phones or placing orders
- ✅ Shipping address saves automatically

**You're all set!** 🎉
