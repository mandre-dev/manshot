# Manshot

<p align="center">
  <img alt="Manshot" src="https://img.shields.io/badge/MANSHOT-FF6B00?style=for-the-badge&labelColor=0D1117" />
</p>

<p align="center">
  <img alt="Python" src="https://img.shields.io/badge/Python-3.11+-3776AB?logo=python&logoColor=white" />
  <img alt="FastAPI" src="https://img.shields.io/badge/FastAPI-0.111-009688?logo=fastapi&logoColor=white" />
  <img alt="React" src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=000" />
  <img alt="Vite" src="https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white" />
  <img alt="Celery" src="https://img.shields.io/badge/Celery-5.3-37814A?logo=celery&logoColor=white" />
  <img alt="Redis" src="https://img.shields.io/badge/Redis-7+-DC382D?logo=redis&logoColor=white" />
  <img alt="License" src="https://img.shields.io/badge/license-Internal-orange" />
  <img alt="Status" src="https://img.shields.io/badge/status-active-1F8B4C" />
</p>

<p align="center">
  Plataforma de disparo em massa multicanal para campanhas de Email, SMS e Telegram.
</p>

---

## Identidade visual

- Cor principal: `#FF6B00`
- Fundo principal: `#0D1117`
- Fundo secundario: `#131A27`
- Texto principal: `#E5E7EB`

## Screenshots

## Dashboard (hero)

![Dashboard Hero](dashboard/src/assets/hero.png)

## Logo

![Logo Manshot](dashboard/src/assets/logo-manshot.png)

## O que o Manshot faz

- Gerencia contatos por conta autenticada.
- Cria campanhas multicanal com anexos.
- Dispara campanhas em background com Celery.
- Atualiza métricas por campanha (`total`, `success`, `failed`).
- Permite credenciais de remetente por usuário.

## Stack tecnologica

## Backend

- `fastapi`, `uvicorn`
- `sqlalchemy`, `alembic`
- `celery`, `redis`
- `pydantic-settings`, `python-dotenv`
- `python-jose` (JWT)
- `httpx`
- `vonage`, `vonage-sms`
- `twilio` (dependência instalada, nao ativa no fluxo atual)

## Frontend

- `react`, `react-dom`, `react-router-dom`
- `axios`
- `lucide-react`
- `@react-oauth/google`
- `@tiptap/*`
- `recharts`
- `xlsx`

## Banco e dados

- Banco local: `sqlite:///./manshot.db`
- Arquivo: `manshot.db`
- Migrations: Alembic
- Upload de imagem: ImgBB
- Upload de arquivos: pasta `uploads/`

## Pre-requisitos

- Python `3.11+`
- Node.js `18+`
- Redis `7+`
- npm `9+` (recomendado)
- Docker + Docker Compose (opcional, recomendado para ambiente padronizado)

## Arquitetura

```text
manshot/
  api/
    routes/        # auth, contacts, campaigns
    models/        # SQLAlchemy models
    schemas/       # validacao Pydantic
    tasks.py       # worker Celery
    upload.py      # upload de anexos
    main.py        # bootstrap da API
  core/
    auth.py        # JWT e hash de senha
    email.py       # canal Email
    sms.py         # canal SMS
    telegram.py    # canal Telegram
    config.py      # carregamento de .env
  dashboard/
    src/
  migrations/
    versions/
  uploads/
  manshot.db
```

## Como funciona

1. Usuario faz login local ou Google.
2. API persiste contatos/campanhas por `owner_email`.
3. Envio de campanha altera status para `running`.
4. Task `dispatch_campaign` entra na fila do Celery.
5. Worker processa contato por contato, canal por canal.
6. Status final e métricas sao gravados no banco.

## Provedores de SMS: estado atual

Para evitar confusão de configuração:

- Provedor ativo no codigo atual: `Vonage`.
- `Twilio`: dependência presente, não ativa no fluxo atual desta branch.
- `MySMSGate`: não ativo nesta branch.

Exemplo de `.env` alinhado ao estado atual:

```env
# Email SMTP padrao (admin)
GMAIL_USER=
GMAIL_APP_PASSWORD=
EMAIL_FROM_NAME=Manshot

# SMS ativo (Vonage)
VONAGE_API_KEY=
VONAGE_API_SECRET=
VONAGE_PHONE_FROM=Manshot

# Telegram
TELEGRAM_BOT_TOKEN=

# Redis
REDIS_URL=redis://localhost:xxxx/x

# Upload
IMGBB_API_KEY=

# Auth
ADMIN_EMAIL=admin@xxxx.xxxx
ADMIN_PASSWORD=xxxxx
JWT_SECRET_KEY=change-this-secret-key
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60

# Google OAuth
google_client_id=
google_client_secret=
```

## Rodando localmente

## 1) API

```bash
cd /home/manshot
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
alembic upgrade head
uvicorn api.main:app --reload
```

- API: `http://127.0.0.1:8000`
- Docs: `http://127.0.0.1:8000/docs`

## 2) Worker

```bash
cd /home/manshot
source .venv/bin/activate
celery -A api.tasks.celery_app worker --loglevel=info
```

## 3) Dashboard

```bash
cd /home/manshot/dashboard
npm install
npm run dev
```

- Dashboard: `http://localhost:5173`

## Docker (guia rapido)

O projeto já possui containerização para os serviços principais:

- `api` (FastAPI)
- `worker` (Celery)
- `redis` (broker/backend)
- `dashboard` (Vite)

Arquivos usados:

- `docker-compose.yml`
- `Dockerfile.backend`
- `dashboard/Dockerfile`

## Subir com Docker

```bash
cd /home/manshot
docker compose up --build
```

Servicos e portas:

- API: `http://127.0.0.1:8000`
- Docs: `http://127.0.0.1:8000/docs`
- Dashboard: `http://localhost:5173`
- Redis: `localhost:6379`

## Rodar em background

```bash
docker compose up -d --build
```

## Deploy com Systemd

Se você quer que a API, o worker, o dashboard e o túnel subam sozinhos no boot, use os units prontos em `deploy/systemd/`.

Arquivos disponíveis:

- `deploy/systemd/manshot-api.service`
- `deploy/systemd/manshot-worker.service`
- `deploy/systemd/manshot-dashboard.service`
- `deploy/systemd/manshot-cloudflared.service`

Instalação sugerida:

```bash
cd /home/mandre/manshot/dashboard
npm install
npm run build

sudo cp deploy/systemd/manshot-api.service /etc/systemd/system/
sudo cp deploy/systemd/manshot-worker.service /etc/systemd/system/
sudo cp deploy/systemd/manshot-dashboard.service /etc/systemd/system/
sudo cp deploy/systemd/manshot-cloudflared.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable manshot-api manshot-worker manshot-dashboard manshot-cloudflared
sudo systemctl start manshot-api manshot-worker manshot-dashboard manshot-cloudflared
```

Verificação:

```bash
systemctl status manshot-api
systemctl status manshot-worker
systemctl status manshot-dashboard
systemctl status manshot-cloudflared
journalctl -u manshot-api -f
journalctl -u manshot-worker -f
journalctl -u manshot-dashboard -f
journalctl -u manshot-cloudflared -f
```

Observações:

- Os serviços usam o venv do projeto em `/home/mandre/manshot/.venv`.
- O `manshot-dashboard.service` usa o build estático em `dashboard/dist` via `vite preview`.
- Se o usuário do Linux não for `mandre`, ajuste `User=` e `Group=` nos units.
- O `cloudflared` expõe o dashboard na internet sem precisar manter terminal aberto.
- Se você quiser expor a API separadamente, crie outro tunnel apontando para `http://127.0.0.1:8000`.

## Parar tudo

```bash
docker compose down
```

## Ver logs

```bash
docker compose logs -f api
docker compose logs -f worker
docker compose logs -f dashboard
```

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

## Contribuição

Contribuicoes sao bem-vindas.

Fluxo sugerido:

1. Crie uma branch: `git checkout -b feat/minha-feature`
2. Rode o projeto localmente e valide mudancas.
3. Garanta commits pequenos e descritivos.
4. Abra PR com:
   - contexto do problema
   - o que foi alterado
   - evidencias (prints/logs/testes)

Padrões recomendados:

- não commitar `.env` ou segredos
- manter compatibilidade com SQLite local
- descrever impactos de migrations em PR

## Licença

Atualmente este repositório está marcado como `Internal` (uso interno/equipe).

Se o projeto for abrir para comunidade, recomenda-se adicionar um arquivo `LICENSE` (ex.: MIT).

## Boas práticas operacionais

- Não versionar dados reais no `manshot.db`.
- Não commitar tokens, app passwords ou credenciais.
- Em falhas de disparo, priorizar logs do worker Celery.

---

<p align="center"><strong>Manshot</strong> - Disparo inteligente com identidade visual laranja.</p>
