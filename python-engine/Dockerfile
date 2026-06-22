FROM python:3.11-slim

WORKDIR /workspace

RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq-dev gcc \
    && rm -rf /var/lib/apt/lists/*

COPY python-engine/requirements.txt ./python-engine/requirements.txt
RUN pip install --no-cache-dir -r python-engine/requirements.txt

COPY python-engine/ ./python-engine/
COPY shared/ ./shared/

WORKDIR /workspace/python-engine

ENV PYTHONUNBUFFERED=1

EXPOSE 8001

CMD ["python", "-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8001"]
