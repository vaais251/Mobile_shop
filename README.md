# 📱 Mobile Store - Second-Hand Phone E-Commerce Platform

A modern e-commerce platform for buying and selling second-hand phones, built with FastAPI and Next.js.

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend                              │
│                  Next.js 14 + Tailwind CSS                  │
│                    (App Router, RSC)                        │
└─────────────────────┬───────────────────────────────────────┘
                      │ REST API
┌─────────────────────▼───────────────────────────────────────┐
│                        Backend                               │
│                   Python FastAPI                            │
│              JWT Auth, Role-Based Access                    │
└─────────────────────┬───────────────────────────────────────┘
                      │ SQLAlchemy ORM
┌─────────────────────▼───────────────────────────────────────┐
│                       Database                               │
│                PostgreSQL (Docker)                          │
│              → Migration to Supabase                        │
└─────────────────────────────────────────────────────────────┘
```

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+
- **Python** 3.11+
- **Docker** & Docker Compose

### 1. Start the Database

```bash
docker-compose up -d postgres
```

This starts PostgreSQL on `localhost:5432` with:
- User: `mobile_store_user`
- Password: `mobile_store_password`
- Database: `mobile_store_db`

**Optional:** Access pgAdmin at `http://localhost:5050`
- Email: `admin@mobilestore.com`
- Password: `admin123`

### 2. Setup Backend

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate (Windows)
.\venv\Scripts\activate

# Activate (Linux/Mac)
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run the server
uvicorn app.main:app --reload
```

API available at: `http://localhost:8000`
API Docs: `http://localhost:8000/docs`

### 3. Setup Frontend

```bash
cd frontend

# Install dependencies
npm install

# Run development server
npm run dev
```

Frontend available at: `http://localhost:3000`

## 📁 Project Structure

```
01_mobile_store/
├── docker-compose.yml       # PostgreSQL + pgAdmin
├── backend/
│   ├── app/
│   │   ├── api/v1/          # API endpoints
│   │   ├── core/            # Config, DB, Security
│   │   ├── models/          # SQLAlchemy models
│   │   ├── schemas/         # Pydantic schemas
│   │   ├── services/        # Business logic
│   │   └── main.py          # FastAPI app
│   ├── alembic/             # DB migrations
│   └── requirements.txt
│
└── frontend/
    ├── app/                 # Next.js App Router
    ├── components/          # React components
    ├── lib/                 # Utilities & API client
    └── public/              # Static assets
```

## 🗄️ Database Schema

### Users
- **Roles:** Admin, Seller, Buyer
- **Features:** Email auth, seller verification, profile management

### PhoneInventory
- **Specs:** Brand, Model, Storage, Color
- **Condition:** 1-10 grading scale with defects list
- **Workflow:** User listings require admin approval

### Orders
- **Status:** Pending → Confirmed → Shipped → Delivered
- **Payments:** COD, Credit Card, Easypaisa, JazzCash

### Chat
- Direct messaging between buyers/sellers/admin
- Product inquiry support

## 🛠️ Development

### Database Migrations

```bash
cd backend

# Create migration
alembic revision --autogenerate -m "description"

# Apply migrations
alembic upgrade head
```

### Environment Variables

Backend: Copy `backend/.env.example` to `backend/.env`
Frontend: Copy `frontend/.env.example` to `frontend/.env.local`

## 🎯 Roadmap

- [x] Project scaffolding
- [x] Database models
- [ ] API endpoints (CRUD)
- [ ] Authentication (JWT)
- [ ] Frontend UI components
- [ ] Product listing page
- [ ] Shopping cart
- [ ] Checkout flow
- [ ] Admin dashboard
- [ ] Chat system
- [ ] Supabase migration

## 📄 License

MIT
