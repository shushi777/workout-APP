# Use Python 3.13.3 base image
FROM python:3.13.3-slim

# Set working directory
WORKDIR /app

# Install system dependencies including FFmpeg, Node.js, and build tools
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
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Node.js 20.x for frontend build
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy entrypoint script and make it executable
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Copy all application code
COPY . .

# Build frontend (after COPY . . to ensure fresh build)
# Frontend builds to static/react/ directory
RUN cd frontend && npm ci && npm run build

# Expose port (Railway will set PORT env var)
EXPOSE 8080

# Set default PORT environment variable
ENV PORT=8080

# Run entrypoint script
# Railway sets PORT environment variable at runtime
ENTRYPOINT ["/entrypoint.sh"]
