# Manshot

<p align="center">
  <img alt="Manshot" src="https://img.shields.io/badge/MANSHOT-FF6B00?style=for-the-badge&labelColor=0D1117" />
  <img alt="Status" src="https://img.shields.io/badge/Status-Online-1F8B4C?style=for-the-badge" />
  <img alt="API" src="https://img.shields.io/badge/API-FastAPI-05998B?style=for-the-badge&logo=fastapi&logoColor=white" />
  <img alt="Dashboard" src="https://img.shields.io/badge/Dashboard-React-20232A?style=for-the-badge&logo=react" />
</p>

<p align="center">
  Plataforma de disparo em massa multicanal com foco em produtividade para campanhas de Email, SMS e Telegram.
</p>

---

## Paleta Visual Manshot

- Laranja principal: `#FF6B00`
- Fundo principal: `#0D1117`
- Fundo secundario: `#131A27`
- Texto principal: `#E5E7EB`

## O que o Manshot faz

- Organiza contatos por conta autenticada.
- Cria campanhas multicanal com anexos e mensagem personalizada.
- Processa disparos em background (Celery + Redis).
- Exibe status e metricas de execucao por campanha.
- Permite credenciais de remetente por usuario.

## Stack Tecnologica

## Backend

![Python](https://img.shields.io/badge/Python-3.x-3776AB?logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.111-009688?logo=fastapi&logoColor=white)
![SQLAlchemy](https://img.shields.io/badge/SQLAlchemy-2.0-D71F00?logo=sqlalchemy&logoColor=white)
![Alembic](https://img.shields.io/badge/Alembic-Migrations-222222)
![Celery](https://img.shields.io/badge/Celery-5.3-37814A?logo=celery&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-5-DC382D?logo=redis&logoColor=white)

- `fastapi`, `uvicorn`
- `sqlalchemy`, `alembic`
- `celery`, `redis`
- `pydantic-settings`, `python-dotenv`
- `python-jose` para JWT
- `httpx` para integracoes externas
- `vonage` + `vonage-sms` para SMS
- `twilio` presente como dependencia legada/alternativa

## Frontend

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=000)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)
![Router](https://img.shields.io/badge/Router-React_Router-CA4245?logo=reactrouter&logoColor=white)

- `react`, `react-dom`, `react-router-dom`
- `axios`
- `lucide-react`
- `@react-oauth/google`
- `@tiptap/*` (editor rico)
- `recharts`
- `xlsx`

## Integracoes e Canais

- Email SMTP (credenciais por usuario ou fallback admin)
- SMS via Vonage
- Telegram Bot API
- Upload de imagem via ImgBB
- Upload local de arquivos em `uploads/`

## Arquitetura

```text
manshot/
  api/
    routes/        # auth, contacts, campaigns
    models/        # SQLAlchemy models
    schemas/       # validacao Pydantic
    tasks.py       # worker Celery (disparo assíncrono)
    upload.py      # upload e armazenamento de anexos
    main.py        # bootstrap da API
  core/
    auth.py        # JWT e password hashing
    email.py       # canal Email
    sms.py         # canal SMS
    telegram.py    # canal Telegram
    config.py      # carregamento de .env
  dashboard/
    src/           # interface React
  migrations/
    versions/      # migrations Alembic
  uploads/
  manshot.db
```

## Como o sistema funciona

1. Usuario autentica via login local ou Google.
2. Contatos e campanhas sao persistidos por `owner_email`.
3. Ao enviar campanha, a API muda status para `running`.
4. A task `dispatch_campaign` entra na fila do Celery.
5. Worker processa canal por canal para cada contato.
6. Resultado final atualiza metricas: `total`, `success`, `failed`.

## Banco de dados

- Banco atual: SQLite local
- Arquivo: `manshot.db`
- URL: `sqlite:///./manshot.db`
- Migrations: Alembic

## Variaveis de ambiente (exemplo minimo)

```env
# Email SMTP padrao (admin)
GMAIL_USER=
GMAIL_APP_PASSWORD=
EMAIL_FROM_NAME=Manshot

# SMS (Vonage)
VONAGE_API_KEY=
VONAGE_API_SECRET=
VONAGE_PHONE_FROM=Manshot

# Telegram
TELEGRAM_BOT_TOKEN=

# Redis (Celery)
REDIS_URL=redis://localhost:6379/0

# Upload de imagens
IMGBB_API_KEY=

# Auth
ADMIN_EMAIL=admin@manshot.local
ADMIN_PASSWORD=admin123
JWT_SECRET_KEY=change-this-secret-key
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60

# Google OAuth
google_client_id=
google_client_secret=
```

## Subir ambiente local

## 1) API

```bash
cd /home/mandre/manshot
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
alembic upgrade head
uvicorn api.main:app --reload
```

- API: `http://127.0.0.1:8000`
- Docs: `http://127.0.0.1:8000/docs`

## 2) Worker Celery

```bash
cd /home/mandre/manshot
source .venv/bin/activate
celery -A api.tasks.celery_app worker --loglevel=info
```

## 3) Dashboard

```bash
cd /home/mandre/manshot/dashboard
npm install
npm run dev
```

- Dashboard: `http://localhost:5173`

## Fluxo rapido de uso

1. Login
2. Cadastro/importacao de contatos
3. Configuracao de credenciais em Credenciais
4. Criacao de campanha
5. Disparo
6. Acompanhamento de status

## Endpoints principais

## Auth

- `POST /auth/login`
- `POST /auth/register`
- `POST /auth/google`
- `GET /auth/me`
- `GET /auth/me/sender-credentials`
- `PATCH /auth/me/sender-credentials`

## Contatos

- `POST /contacts/`
- `GET /contacts/`
- `PUT /contacts/{contact_id}`
- `DELETE /contacts/{contact_id}`
- `POST /contacts/{contact_id}/pin`

## Campanhas

- `POST /campaigns/`
- `GET /campaigns/`
- `PUT /campaigns/{campaign_id}`
- `DELETE /campaigns/{campaign_id}`
- `POST /campaigns/{campaign_id}/send`
- `POST /campaigns/{campaign_id}/reset`
- `POST /campaigns/{campaign_id}/pin`

## Upload

- `POST /upload/file`
- `POST /upload/image`

## Boas praticas operacionais

- Nao commitar `.env`, tokens ou app passwords.
- Evitar versionar dados reais no `manshot.db`.
- Usar logs do worker Celery para diagnosticar falhas de envio.

---

<p align="center"><strong>Manshot</strong> - Disparo inteligente com identidade propria.</p>
