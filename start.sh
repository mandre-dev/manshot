#!/bin/bash
uvicorn api.main:app --host 0.0.0.0 --port $PORT &
sleep 3
celery -A api.tasks.celery_app worker --loglevel=info --concurrency=1