# Mobile Store Backend API

A FastAPI-based backend for a second-hand phone e-commerce platform.

## 🚀 Quick Start

### Prerequisites

- Python 3.11+
- Docker & Docker Compose
- PostgreSQL (via Docker)

### Setup

1. **Start the database:**
   ```bash
   docker-compose up -d postgres
   ```

2. **Create virtual environment:**
   ```bash
   cd backend
   python -m venv venv
   
   # Windows
   .\venv\Scripts\activate
   
   # Linux/Mac
   source venv/bin/activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Run the server:**
   ```bash
   uvicorn app.main:app --reload
   ```

5. **Access the API:**
   - API: http://localhost:8000
   - Swagger Docs: http://localhost:8000/docs
   - ReDoc: http://localhost:8000/redoc

## 📁 Project Structure

```
backend/
├── app/
│   ├── api/
│   │   └── v1/          # API route handlers
│   ├── core/
│   │   ├── config.py    # Application settings
│   │   ├── database.py  # Database connection
│   │   └── security.py  # JWT & password utilities
│   ├── models/          # SQLAlchemy models
│   │   ├── user.py
│   │   ├── phone_inventory.py
│   │   ├── order.py
│   │   └── chat.py
│   ├── schemas/         # Pydantic schemas
│   ├── services/        # Business logic
│   └── main.py          # FastAPI application
├── alembic/             # Database migrations
├── requirements.txt
└── .env
```

## 🗄️ Database Models

### User
- Roles: Admin, Seller, Buyer
- Seller verification system
- Password hashing with bcrypt

### PhoneInventory
- Detailed specifications (brand, model, storage, color)
- Condition grading (1-10 scale)
- Defects tracking
- Admin approval for user listings

### Order
- Status tracking (Pending → Delivered)
- Payment methods: COD, Credit Card, Easypaisa
- Shipment tracking

### Chat
- Direct messaging between users
- Read status tracking
- Product inquiry support

## 🔧 Database Migrations

```bash
# Create a new migration
alembic revision --autogenerate -m "Description"

# Apply migrations
alembic upgrade head

# Rollback one step
alembic downgrade -1
```

## 🧪 Testing

```bash
pytest
```
