# Sistema de Pedidos Imperial

Aplicação web para gerenciamento de pedidos em tempo real da A.A.A Imperial.

O projeto tem:

- Backend em Django, Django REST Framework e Django Channels.
- Frontend em Angular, TypeScript, HTML e SCSS.
- Banco PostgreSQL.
- Autenticação por Token para áreas internas.
- Área pública mobile-first para consulta via QR Code.

## Estrutura

```txt
backend/
  imperial_api/        Configuração Django, ASGI e rotas principais
  pedidos/             Models, serializers, views, permissões e WebSocket
frontend/
  src/app/             Rotas, telas, guards, services e componentes Angular
docker-compose.yml     PostgreSQL local
```

## Backend

### 1. Criar ambiente e instalar dependências

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
```

No Linux/macOS, ative o ambiente com:

```bash
source .venv/bin/activate
```

### 2. Subir PostgreSQL

Na raiz do projeto:

```bash
docker compose up -d postgres
```

O `.env.example` já combina com o banco do `docker-compose.yml`.

### 3. Migrar e criar o primeiro ADMIN

```bash
cd backend
python manage.py migrate
python manage.py criar_admin_imperial --username admin --password admin12345
```

Depois, acesse `/admin/` do Django para criar usuários de CAIXA e PRODUÇÃO e vincular cada um a um `PerfilUsuario`.

### 4. Rodar o backend

Para usar no computador:

```bash
python manage.py runserver 8000
```

Para usar em celulares na mesma rede:

```bash
python manage.py runserver 0.0.0.0:8000
```

Inclua o IP do computador no `.env`:

```env
ALLOWED_HOSTS=localhost,127.0.0.1,IP_DO_COMPUTADOR
CORS_ALLOWED_ORIGINS=http://localhost:4200,http://IP_DO_COMPUTADOR:4200
```

## Frontend

```bash
cd frontend
npm install
npm start
```

No computador, acesse:

```txt
http://localhost:4200
```

No celular, conectado à mesma rede Wi-Fi, acesse:

```txt
http://IP_DO_COMPUTADOR:4200
```

O frontend detecta automaticamente esse IP e chama a API em `http://IP_DO_COMPUTADOR:8000/api`.

## Rotas

- Cliente público: `/cliente` ou `/consultar-pedido`
- Login interno: `/login` ou `/interno`
- Admin: `/admin`
- Caixa: `/caixa`
- Produção: `/producao`
- Configurações: `/configuracoes`
- QR Codes: `/qrcodes`

## QR Codes

Entre como ADMIN ou CAIXA autorizado e acesse:

```txt
/qrcodes
```

A tela gera:

- QR Code do Cliente apontando para `/cliente`.
- QR Code Interno apontando para `/login`.
- Download em PNG.
- Impressão direta.

## Fluxo de uso

1. Caixa faz login e cria o pedido em `/caixa`.
2. O sistema gera o número sequencial e bloqueia a ficha.
3. Produção recebe o pedido em tempo real em `/producao`.
4. Cliente consulta o andamento em `/cliente`.
5. Produção marca como pronto.
6. Cliente retira o pedido no balcão.
7. Produção marca como entregue.
8. A ficha é liberada para outro pedido.

## Regras importantes

- Cliente não faz login e só consulta um pedido pelo número.
- Cliente não cria, cancela, lista ou altera pedidos.
- Caixa e ADMIN criam pedidos.
- Produção, Caixa e ADMIN alteram status.
- A ficha fica ocupada enquanto o pedido estiver `pendente`, `em_producao` ou `pronto`.
- A ficha só libera em `entregue` ou `cancelado`.
- A quantidade de fichas é configurável e não pode ser reduzida abaixo de fichas ocupadas.
- O WebSocket interno fica em `/ws/pedidos/` e exige token.

## Publicação gratuita com GitHub

O GitHub Pages publica somente o frontend Angular. O backend Django, o PostgreSQL e o WebSocket precisam ficar em outro serviço de hospedagem conectado ao repositório do GitHub.

### 1. Publicar o backend

Hospede o backend em um serviço que suporte Python/ASGI, PostgreSQL e WebSocket.

Comandos de produção esperados:

```bash
python manage.py migrate
python manage.py collectstatic --noinput
daphne imperial_api.asgi:application --bind 0.0.0.0 --port $PORT
```

Variáveis de ambiente mínimas do backend:

```env
DEBUG=False
SECRET_KEY=troque-por-uma-chave-segura
ALLOWED_HOSTS=URL_DO_BACKEND_SEM_HTTPS
CORS_ALLOWED_ORIGINS=https://USUARIO.github.io
CSRF_TRUSTED_ORIGINS=https://URL_DO_BACKEND,https://USUARIO.github.io
POSTGRES_DB=...
POSTGRES_USER=...
POSTGRES_PASSWORD=...
POSTGRES_HOST=...
POSTGRES_PORT=5432
```

Se o frontend ficar em um repositório de projeto, use a origem completa:

```env
CORS_ALLOWED_ORIGINS=https://USUARIO.github.io/NOME_DO_REPOSITORIO
```

### 2. Configurar os secrets do GitHub

No repositório do GitHub, abra:

```txt
Settings > Secrets and variables > Actions > New repository secret
```

Crie:

```txt
API_BASE_URL=https://URL_DO_BACKEND/api
WS_BASE_URL=wss://URL_DO_BACKEND
```

### 3. Ativar GitHub Pages

No repositório do GitHub, abra:

```txt
Settings > Pages
```

Em `Build and deployment`, selecione:

```txt
Source: GitHub Actions
```

Depois faça push para `main` ou `master`. O workflow `.github/workflows/deploy-frontend.yml` vai instalar, compilar e publicar o Angular automaticamente.
