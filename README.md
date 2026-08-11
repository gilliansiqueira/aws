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
4. Suba o servidor:
   ```bash
   npm run dev
   ```

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
Produtos, Preços) e Configurações (Empresa/Usuários).

Módulos em construção: Pedidos (wizard), Espelho do Pedido + envio WhatsApp, Amostras, Dashboard,
Mapa de Vendas, Relatórios.
