FROM python:3.11-slim

# Prevent Python from writing pyc files
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# System deps (psycopg2 needs this)
RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Python deps
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy app code
COPY . .

# Fly exposes port 8080
EXPOSE 8080

# Start server
CMD ["gunicorn", "app:app", "-w", "1", "--threads", "4", "--timeout", "120", "-b", "0.0.0.0:8080"]
