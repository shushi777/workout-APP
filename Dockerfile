# Use Python 3.13.3 base image
FROM python:3.13.3-slim

# Set working directory
WORKDIR /app

# Install system dependencies including FFmpeg and build tools
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    libgl1-mesa-glx \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    libgomp1 \
    libpq-dev \
    build-essential \
    gcc \
    g++ \
    python3-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Expose port (Railway will set PORT env var)
EXPOSE 8080

# Run Gunicorn
# Railway sets PORT environment variable automatically
# Use shell form to allow PORT variable expansion at runtime
CMD ["sh", "-c", "gunicorn server:app --bind 0.0.0.0:${PORT:-8080} --workers 2 --timeout 120"]
