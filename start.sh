#!/bin/bash
celery -A api.tasks.celery_app worker --loglevel=info &
uvicorn api.main:app --host 0.0.0.0 --port $PORT
