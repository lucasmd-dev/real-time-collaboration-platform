# Real-Time Collaboration Platform

Aplicação full stack para edição colaborativa de documentos em tempo real. O projeto foi construído como peça de portfólio técnica: o foco está em sincronização confiável, autorização clara, persistência consistente e uma base de código pequena o suficiente para ser lida e explicada com facilidade.

## Visão rápida

- Frontend em React 18 + TypeScript com Tiptap, Yjs, Zustand e Socket.IO Client.
- Backend em Node.js + Express + TypeScript com API REST, autenticação JWT e gateway WebSocket.
- PostgreSQL para persistência de usuários, documentos e tokens.
- Redis para presença e propagação de eventos entre instâncias.
- Fluxo completo de cadastro, login, criação, compartilhamento, edição simultânea, reconexão e revogação de acesso.

## O que vale avaliar neste projeto

- Separação clara entre responsabilidades de frontend, backend e infraestrutura.
- Uso de CRDT com Yjs para edição concorrente sem conflito manual.
- Persistência do estado colaborativo com recuperação após reconexão.
- Controle de acesso entre dono e colaborador, incluindo revogação de sessão ativa.
- Escopo enxuto, sem features periféricas que distraiam da demonstração técnica principal.

## Stack

| Camada | Tecnologias |
|---|---|
| Frontend | React 18, TypeScript, Tiptap v2, Yjs, Socket.IO Client, Zustand, Tailwind CSS |
| Backend | Node.js, Express, TypeScript, Socket.IO, Yjs, Zod |
| Banco de dados | PostgreSQL 16 |
| Cache e pub/sub | Redis 7 |
| Infra local | Docker Compose |
| Testes | Jest no backend, Vitest no frontend |

## Escopo entregue

- Cadastro, login, refresh token e logout.
- Dashboard com documentos próprios e compartilhados.
- Criação, renomeação e exclusão restritas ao dono do documento.
- Compartilhamento por e-mail com usuários já cadastrados.
- Edição simultânea com presença em tempo real.
- Persistência automática do `Y.Doc` no PostgreSQL.
- Reconexão com diff incremental.
- Suporte offline básico no cliente via IndexedDB.

## Decisões de escopo

- O compartilhamento foi mantido por e-mail para priorizar autorização e rastreabilidade.
- Convites públicos por link não entram neste recorte para não diluir a demonstração principal.
- A gestão de colaboradores permanece concentrada no dono do documento.
- O dashboard foi mantido simples para reforçar o fluxo central de colaboração, e não um produto de produtividade completo.

## Arquitetura

```text
Browser
  └─ React + Tiptap + Yjs
      ├─ REST (/api/v1) ───────────────► Express API ───────────────► PostgreSQL
      └─ WebSocket (Socket.IO) ───────► Collaboration Gateway
                                          ├─ Y.Doc em memória
                                          └─ Redis Pub/Sub ────────► outras instâncias
```

### Como a sincronização funciona

1. O cliente entra no documento via `document:join`.
2. O backend carrega ou reutiliza o `Y.Doc` em memória.
3. As alterações locais são enviadas por WebSocket como updates CRDT.
4. O Redis distribui os eventos para outras instâncias sem prender o documento a um único processo.
5. O estado do `Y.Doc` é persistido no PostgreSQL pouco depois da última edição.
6. Em reconexões, o cliente pede apenas o diff necessário com `document:sync_request`.

## Estrutura do repositório

| Caminho | Responsabilidade |
|---|---|
| `frontend/` | Interface, autenticação, dashboard, editor colaborativo e testes do cliente |
| `backend/` | API REST, autenticação, gateway de colaboração, persistência e testes do servidor |
| `infra/postgres/` | Bootstrap local do PostgreSQL |
| `.github/workflows/ci.yml` | Pipeline de validação com teste e build em Node 20 |

## Pré-requisitos

- Node.js 20+
- npm 10+
- Docker Desktop ou Docker Engine + Docker Compose

> O projeto está configurado e validado para Node 20. O frontend usa Vite 5, então versões anteriores do Node podem falhar no `build` e nos testes.

## Como rodar localmente

### 1. Clonar o repositório e preparar o ambiente

```bash
git clone <repo-url>
cd "Real-Time Collaboration Platform"
cp .env.example backend/.env
```

### 2. Subir PostgreSQL e Redis

```bash
docker compose up -d
```

Se houver volume antigo do PostgreSQL com configuração incompatível:

```bash
docker compose down -v
docker compose up -d
```

### 3. Instalar dependências do backend e rodar migrations

```bash
cd backend
npm ci
npm run migrate
```

### 4. Iniciar o backend

```bash
npm run dev
```

Servidor disponível em `http://localhost:3001`.

### 5. Iniciar o frontend em outro terminal

```bash
cd frontend
npm ci
npm run dev
```

Aplicação disponível em `http://localhost:5173`.

## Scripts disponíveis

### Backend

| Script | Descrição |
|---|---|
| `npm run dev` | Inicia o servidor com hot reload |
| `npm run build` | Compila o TypeScript para `dist/` |
| `npm run migrate` | Executa as migrations pendentes |
| `npm test` | Roda a suíte Jest |
| `npm run test:watch` | Roda os testes em modo watch |

### Frontend

| Script | Descrição |
|---|---|
| `npm run dev` | Inicia o Vite em modo desenvolvimento |
| `npm run build` | Gera o build de produção |
| `npm run preview` | Serve o build localmente |
| `npm test` | Roda a suíte Vitest |
| `npm run test:watch` | Roda os testes em modo watch |

## Variáveis de ambiente

As variáveis de ambiente ficam em `backend/.env`. O template base está em `.env.example`.

| Variável | Valor padrão | Descrição |
|---|---|---|
| `PORT` | `3001` | Porta HTTP do backend |
| `DATABASE_URL` | `postgresql://rtcp:rtcp_dev@localhost:5432/rtcp` | String de conexão do PostgreSQL |
| `REDIS_URL` | `redis://localhost:6379` | Endereço do Redis |
| `JWT_SECRET` | `change-this-to-a-long-random-secret-in-production` | Segredo para assinatura dos tokens |
| `JWT_EXPIRES_IN` | `15m` | Duração do access token |
| `JWT_REFRESH_EXPIRES_IN` | `7d` | Duração do refresh token |
| `CORS_ORIGIN` | `http://localhost:5173` | Origem permitida pelo CORS |

## Endpoints principais

```text
POST   /api/v1/auth/register
POST   /api/v1/auth/login
POST   /api/v1/auth/refresh
POST   /api/v1/auth/logout

GET    /api/v1/documents
POST   /api/v1/documents
GET    /api/v1/documents/:id
PATCH  /api/v1/documents/:id
DELETE /api/v1/documents/:id
GET    /api/v1/documents/:id/collaborators
POST   /api/v1/documents/:id/collaborators
DELETE /api/v1/documents/:id/collaborators/:userId

GET    /health
```

## Eventos WebSocket

| Direção | Evento | Função |
|---|---|---|
| Cliente → servidor | `document:join` | Entra em um documento |
| Cliente → servidor | `document:operation` | Envia update CRDT |
| Cliente → servidor | `document:sync_request` | Solicita diff após reconexão |
| Cliente → servidor | `presence:update` | Atualiza cursor e presença |
| Cliente → servidor | `presence:heartbeat` | Mantém a sessão ativa |
| Cliente → servidor | `document:leave` | Encerra a sessão no documento |
| Servidor → cliente | `document:joined` | Retorna estado inicial e usuários online |
| Servidor → cliente | `document:operation` | Propaga alteração de outro usuário |
| Servidor → cliente | `document:sync_response` | Retorna diff incremental |
| Servidor → cliente | `user:joined` / `user:left` | Notifica entrada e saída de usuários |
| Servidor → cliente | `document:access_revoked` | Encerra a sessão quando o acesso é removido |

## Qualidade do projeto

- TypeScript em modo `strict` no frontend e no backend.
- `noUnusedLocals` e `noUnusedParameters` ativos nas duas aplicações.
- Testes automatizados cobrindo backend e frontend.
- Pipeline de CI em GitHub Actions com `test` e `build` em Node 20.
- Documentação alinhada ao comportamento real do projeto.

## Próximos passos naturais

- Convites por link com aceite explícito.
- Busca e paginação no dashboard.
- Indicadores mais ricos de conexão e presença.
- Cobertura E2E no navegador.
