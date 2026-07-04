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
