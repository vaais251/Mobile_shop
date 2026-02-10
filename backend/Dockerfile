# ============================================
# Mobile Store Backend - Production Dockerfile
# ============================================
FROM python:3.12-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

# Set work directory
WORKDIR /app

# Install system dependencies (needed for psycopg2 and building packages)
RUN apt-get update && \
    apt-get install -y --no-install-recommends gcc libpq-dev libc6-dev python3-dev && \
    rm -rf /var/lib/apt/lists/*

# Copy requirements first (for Docker layer caching)
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application code
COPY . .

# Create static directory for uploaded images (persisted via volume)
RUN mkdir -p /app/static/images

# Expose the port uvicorn will listen on
EXPOSE 8000

# Run database migrations then start the server
CMD alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port 8000
