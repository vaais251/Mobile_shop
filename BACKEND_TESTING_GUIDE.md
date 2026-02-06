# Backend API Testing Guide

## Test the Advanced Features

### 1. Test Multi-Image Upload (Admin)

```bash
# Using curl (Windows Git Bash or WSL)
curl -X POST "http://localhost:8000/api/v1/admin/phones/upload" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -F "brand=Apple" \
  -F "model=iPhone 15 Pro" \
  -F "storage_gb=256" \
  -F "color=Titanium Blue" \
  -F "condition_grade=9.5" \
  -F "condition_category=excellent" \
  -F "price=180000" \
  -F "images=@/path/to/image1.jpg" \
  -F "images=@/path/to/image2.jpg" \
  -F "images=@/path/to/image3.jpg" \
  -F "thumbnail_index=0"
```

### 2. Test Search Functionality

```bash
# Search for iPhone
curl "http://localhost:8000/api/v1/phones/shop?search=iPhone"

# Search for Samsung
curl "http://localhost:8000/api/v1/phones/shop?search=Samsung"
```

### 3. Test Color Filter

```bash
# Filter by Black color
curl "http://localhost:8000/api/v1/phones/shop?color=Black"

# Combine search and color
curl "http://localhost:8000/api/v1/phones/shop?search=iPhone&color=Gold"
```

### 4. Interactive API Documentation

Open your browser and navigate to:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

You can test all endpoints interactively from the Swagger UI.

### 5. Verify Database Schema

```bash
# Connect to PostgreSQL (adjust credentials as needed)
psql -U postgres -d phoneshop

# Check if thumbnail column exists
\d phone_inventory

# You should see a 'thumbnail' column of type VARCHAR(255)
```

## Response Examples

### Multi-Image Phone Response
```json
{
  "id": 1,
  "brand": "Apple",
  "model": "iPhone 15 Pro",
  "images": "[\"/static/images/uuid1.jpg\", \"/static/images/uuid2.jpg\", \"/static/images/uuid3.jpg\"]",
  "thumbnail": "/static/images/uuid1.jpg",
  ...
}
```

### Search Results
```json
{
  "items": [
    {
      "id": 1,
      "brand": "Apple",
      "model": "iPhone 14 Pro",
      ...
    }
  ],
  "total": 1,
  "page": 1,
  "size": 20,
  "pages": 1
}
```
