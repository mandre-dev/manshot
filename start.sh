#!/bin/bash
celery -A api.tasks.celery_app worker --loglevel=info --concurrency=1 &
sleep 3
uvicorn api.main:app --host 0.0.0.0 --port $PORT