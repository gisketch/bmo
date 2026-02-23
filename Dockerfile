FROM python:3.13-slim

# Install system deps for audio processing
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libsndfile1 \
    && rm -rf /var/lib/apt/lists/*

# Install uv
COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv

WORKDIR /app

# Copy dependency files first (cache layer)
COPY pyproject.toml uv.lock* ./

# Install dependencies
RUN uv sync --no-dev --frozen

# Copy agent code, modules, and prompts
COPY agent.py .
COPY bmo/ bmo/
COPY prompts/ prompts/

# Download model files (Silero VAD + Turn Detector)
RUN uv run agent.py download-files

# Health check
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
    CMD curl -f http://localhost:8081/ || exit 1

# Run agent in production mode
CMD ["uv", "run", "agent.py", "start"]
