# AWS — Gestão Comercial

Sistema de gestão comercial da AWS Distribuidora: cadastros, pedidos, espelho de pedido,
envio via WhatsApp, amostras, dashboard e mapa de vendas.

## Stack

- **Next.js 16** (App Router, Turbopack) + React 19 + TypeScript
- **Tailwind CSS v4**
- **PostgreSQL** + **Prisma 7** (com driver adapter `@prisma/adapter-pg`)
- **NextAuth v5** (Credentials) para autenticação

> Next.js 16 e Prisma 7 têm mudanças importantes em relação a versões anteriores:
> `middleware.ts` virou `proxy.ts`, `params`/`searchParams` são `Promise`, e o Prisma Client
> agora exige um *driver adapter* explícito (`PrismaPg`) em vez de `datasource.url` no schema.

## Configuração local

1. Instale as dependências:
   ```bash
   npm install
   ```
2. Configure o `.env` (copie de `.env.example` se preferir) com a URL do Postgres:
   ```
   DATABASE_URL="postgresql://usuario:senha@localhost:5432/aws_comercial?schema=public"
   AUTH_SECRET="uma-string-aleatoria-longa"
   NEXTAUTH_URL="http://localhost:3000"
   ```
3. Rode as migrações e o seed inicial:
   ```bash
   npx prisma migrate dev
   npx prisma db seed
   ```
   Por padrão o seed só cria os 2 usuários, os dados da empresa (placeholder) e as formas de
   pagamento padrão. Para também popular marca/indústria/cliente/produto de exemplo (útil para
   testar o sistema), rode com `SEED_DEMO_DATA=true npx prisma db seed`.
4. Suba o servidor:
   ```bash
   npm run dev
   ```

## Deploy na Vercel

1. Crie um banco Postgres gratuito (ex: [Neon](https://neon.tech)) e copie a connection string.
2. Importe este repositório na [Vercel](https://vercel.com) ("Add New" → "Project").
3. Configure as variáveis de ambiente do projeto na Vercel:
   ```
   DATABASE_URL=<connection string do Neon/Postgres>
   AUTH_SECRET=<string aleatória longa — gere com `openssl rand -base64 32`>
   ```
   `NEXTAUTH_URL` não é necessário (o NextAuth está configurado com `trustHost: true`, detecta a
   URL automaticamente a partir da requisição).
4. Clique em Deploy. O projeto já tem um script `vercel-build` (`prisma migrate deploy && prisma
   db seed && next build`) que roda as migrações e o seed essencial automaticamente a cada deploy
   — é seguro rodar repetidas vezes (usa `upsert`, não duplica nem sobrescreve dados existentes).
5. Acesse a URL gerada pela Vercel e faça login com os usuários da tabela abaixo. **Troque as
   senhas em produção assim que possível** (a troca de senha pela interface ainda não existe —
   por enquanto, gere um novo hash com bcrypt e atualize direto no banco, ou peça para eu
   adicionar essa tela).

## Usuários iniciais (criados pelo seed)

| E-mail | Senha | Papel |
| --- | --- | --- |
| admin@aws.com.br | admin123 | ADMIN |
| vendedor@aws.com.br | vendedor123 | VENDEDOR |

**Troque essas senhas antes de usar em produção.**

## Estrutura do banco (visão geral)

- `Marca`, `Industria`, `Transportadora`, `FormaPagamento`, `Cliente`, `Produto` — cadastros base.
- `Pedido` / `ItemPedido` / `Parcela` — pedidos, com **snapshot** de dados do cliente, indústria,
  transportadora, forma de pagamento, empresa (AWS) e de cada produto no momento da criação do
  pedido. Alterações posteriores nos cadastros **não afetam** pedidos já criados.
- `Amostra` — controle de amostras enviadas a clientes, com possibilidade de vínculo posterior a
  um `Pedido`.
- `EmpresaConfig` — dados da AWS usados no cabeçalho do espelho (registro único).
- `User` — usuários do sistema (`ADMIN` / `VENDEDOR`), pronto para múltiplos usuários no futuro.

## Status do projeto

Módulos prontos: Cadastros (Marcas, Indústrias, Transportadoras, Formas de Pagamento, Clientes,
Produtos, Preços), Configurações (Empresa/Usuários), Pedidos (wizard de 5 passos, numeração,
duplicação) e Espelho do Pedido + envio via WhatsApp.

Módulos em construção: Amostras, Dashboard, Mapa de Vendas, Relatórios.
