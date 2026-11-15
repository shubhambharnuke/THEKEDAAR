FROM python:3.12-slim

WORKDIR /app

# Install Python requirements using official CDN mirror for fast download
COPY backend/requirements.txt /app/backend/requirements.txt
RUN pip install --no-cache-dir \
    -i https://pypi.org/simple \
    --extra-index-url https://mirrors.aliyun.com/pypi/simple/ \
    -r /app/backend/requirements.txt

# Copy backend code and scripts
COPY backend /app/backend

# Create runtime directories for SQLite and storage
RUN mkdir -p /app/backend/data /app/backend/storage/letters /app/backend/storage/keys

EXPOSE 8000

ENV PYTHONPATH=/app
ENV DATABASE_URL=sqlite:////app/backend/data/thekedar.db

CMD ["sh", "-c", "alembic -c backend/alembic.ini upgrade head && python -c 'from backend.app.database.seed import seed_all; from backend.app.database.session import SessionLocal; db = SessionLocal(); seed_all(db); db.close()' && uvicorn backend.app.main:app --host 0.0.0.0 --port 8000"]

