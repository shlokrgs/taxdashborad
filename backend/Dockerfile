# backend/Dockerfile

FROM python:3.11-slim

WORKDIR /app

# Copy requirements file first
COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

# Copy rest of the backend code
COPY . .

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
