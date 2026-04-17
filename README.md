# Manshot

Plataforma de disparo em massa multicanal com foco em produtividade para campanhas de Email, SMS e Telegram.

## Visão Geral

O Manshot permite:

- cadastrar e organizar contatos;
- criar campanhas com mensagem, anexos e configurações por canal;
- disparar campanhas de forma assíncrona (sem travar a API);
- acompanhar status de execução (`pending`, `running`, `done`, `failed`);
- usar credenciais de remetente por usuário para Email/SMS/Telegram.

## Tecnologias Utilizadas

## Backend (Python)

- FastAPI: API HTTP.
- SQLAlchemy: ORM e acesso ao banco.
- Alembic: versionamento e migrações de schema.
- Celery: execução assíncrona de disparos.
- Redis: broker e backend do Celery.
- Pydantic Settings + python-dotenv: configuração via `.env`.
- python-jose: JWT para autenticação.
- httpx: chamadas HTTP externas (ImgBB, Telegram e arquivos remotos).
- vonage + vonage-sms: canal SMS atual.
- twilio: dependência presente no projeto (legado/alternativa).

## Frontend (Dashboard)

- React 19.
- Vite 8.
- React Router DOM.
- Axios.
- Lucide React (ícones).
- @react-oauth/google (login/importação com Google).
- Tiptap (editor rico de mensagens).
- Recharts (visualizações).
- XLSX (importação de contatos por planilha).
- TailwindCSS (dependência disponível no dashboard).

## Infra e Dados

- SQLite local (`manshot.db`) para desenvolvimento.
- Upload híbrido:
  - imagens via ImgBB;
  - demais anexos em armazenamento local (`uploads/`).

## Arquitetura do Projeto

```text
manshot/
  api/
    routes/        # Endpoints (auth, contacts, campaigns)
    models/        # Modelos SQLAlchemy
    schemas/       # Schemas Pydantic
    tasks.py       # Worker Celery (disparo assíncrono)
    main.py        # Inicialização da API
    upload.py      # Upload de arquivos
  core/
    auth.py        # JWT + hash de senha
    email.py       # Canal Email (SMTP)
    sms.py         # Canal SMS (Vonage)
    telegram.py    # Canal Telegram Bot API
    config.py      # Configurações via .env
  dashboard/
    src/           # UI React
  migrations/
    versions/      # Migrações Alembic
  uploads/         # Arquivos locais enviados
  manshot.db       # Banco SQLite local
```

## Como o Sistema Funciona

## 1) Autenticação

- Login local por email/senha.
- Login Google OAuth.
- API emite JWT e protege rotas com Bearer Token.

## 2) Contatos

- CRUD de contatos por usuário logado.
- Importação por planilha (`.xlsx`) e Google Contacts.
- Campo `pinned` para priorização visual.

## 3) Campanhas

- Criação com:
  - mensagem;
  - seleção de canais (Email, SMS, Telegram);
  - assunto de email;
  - remetente SMS;
  - assinatura Telegram;
  - anexos/imagem.
- Estado de campanha atualizado no banco durante execução.

## 4) Disparo Assíncrono

- Endpoint de envio enfileira task no Celery.
- Worker processa contato a contato.
- Métricas gravadas: `total`, `success`, `failed`.
- Logs por canal ajudam no diagnóstico de erros.

## 5) Credenciais por Usuário

- Cada usuário pode salvar suas próprias credenciais de envio.
- Conta admin usa credenciais do servidor (`.env`).
- Credenciais sensíveis retornam mascaradas no frontend.

## Banco de Dados

## Banco atual

- SQLite local em `manshot.db`.
- URL de conexão usada pela API: `sqlite:///./manshot.db`.

## Migrações

- Alembic gerencia evolução de schema.
- O projeto inclui migrações com proteções para cenários de coluna já existente (idempotência em casos críticos).

## Variáveis de Ambiente

Crie um arquivo `.env` na raiz com os campos necessários para seu ambiente. Exemplo mínimo:

```env
# Email SMTP padrão (admin)
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

## Como Rodar Localmente

## Pré-requisitos

- Python 3.11+ (recomendado).
- Node.js 18+.
- Redis ativo localmente ou remoto.

## 1) Backend API

```bash
cd /home/mandre/manshot
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
alembic upgrade head
uvicorn api.main:app --reload
```

API disponível em `http://127.0.0.1:8000`.
Docs automáticas em `http://127.0.0.1:8000/docs`.

## 2) Worker Celery

Em outro terminal:

```bash
cd /home/mandre/manshot
source .venv/bin/activate
celery -A api.tasks.celery_app worker --loglevel=info
```

## 3) Dashboard React

Em outro terminal:

```bash
cd /home/mandre/manshot/dashboard
npm install
npm run dev
```

Dashboard em `http://localhost:5173`.

## Fluxo de Uso (Resumo)

1. Faça login (local ou Google).
2. Cadastre contatos.
3. Configure credenciais de remetente em Credenciais.
4. Crie campanha e selecione os canais.
5. Dispare campanha.
6. Acompanhe status e resultados.

## Canais de Envio

## Email

- SMTP com credenciais do usuário ou fallback do servidor (admin).
- Suporte a HTML e anexos.
- Para Gmail, use App Password.

## SMS

- Envio via Vonage.
- Normalização de telefone para formato internacional.
- Personalização de remetente com regras de gateway.

## Telegram

- Envio via Bot API.
- O destinatário deve iniciar o bot (`/start`) antes do primeiro envio.
- Suporte a imagem, documento e texto com formatação.

## Endpoints Principais

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

## Observações Operacionais

- Em ambiente local, o arquivo `manshot.db` muda com frequência (evite versionar dados sensíveis).
- Segredos não devem ser commitados (`.env`, tokens, senhas de app password).
- Se o envio falhar, verifique logs do worker Celery para identificar o canal e o erro exato.

## Roadmap Sugerido

- Padronizar `.env.example` com as variáveis atualmente usadas no código.
- Opcional: migrar para PostgreSQL em produção.
- Cobertura de testes automatizados (API + tarefas assíncronas).
- Pipeline CI para lint/build/test.

---

Projeto Manshot.
