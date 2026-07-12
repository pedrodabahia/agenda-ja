# AgendaFlow — base Tier 1 (grátis) — versão Vite

Mesma ideia da versão Next.js, mas em Vite: SPA puro em React, sem rotas de
API. O form e a página pública escrevem **direto no Supabase** pelo
navegador — quem garante a segurança é o RLS (regras do banco), não um
backend no meio.

## Diferença importante em relação à versão Next.js

| | Next.js | Vite |
|---|---|---|
| Onde a escrita acontece | rota `/api/*` no servidor | direto no browser |
| Quem valida permissão | `service_role` key (secreta) | RLS público (`anon` key) |
| Dá pra esconder lógica sensível? | sim | não — tudo que roda no browser é visível |

Pra esse produto (Tier 1, sem dado sensível de verdade — só nome, WhatsApp
e horário), isso é uma troca aceitável. Se um dia precisar esconder alguma
regra de negócio, dá pra migrar só aquela parte pra uma **Supabase Edge
Function**, sem precisar trocar o front de novo.

## O que já funciona

- `/` — form de cadastro do negócio
- `/:slug` — página pública do negócio (rota client-side via react-router)
- Clicar num horário reserva o slot no banco (trava via constraint UNIQUE)
  e abre o WhatsApp com a mensagem pronta

## Passo a passo pra colocar no ar

### 1. Supabase
1. Crie um projeto em [supabase.com](https://supabase.com)
2. Rode `supabase/schema.sql` no SQL Editor
3. Em **Project Settings > API**, copie a `Project URL` e a chave `anon public`

### 2. Rodar localmente
```bash
cp .env.example .env.local
# edita .env.local com suas chaves reais
npm install
npm run dev
```
Abre `http://localhost:5173`.

### 3. GitHub
```bash
git init
git add .
git commit -m "AgendaFlow base (Vite)"
git remote add origin SEU_REPO_GIT
git push -u origin main
```

### 4. Deploy (Vercel, Netlify ou qualquer host estático)
**Vercel**: "Add New Project" → importa o repo → Framework Preset detecta
"Vite" sozinho → adiciona as env vars `VITE_SUPABASE_URL` e
`VITE_SUPABASE_ANON_KEY` → Deploy. O `vercel.json` já incluído garante que
`/nome-do-negocio` funcione mesmo dando F5 direto nele.

**Netlify**: mesma coisa, mas o redirect de SPA vai num `_redirects` com
`/* /index.html 200` dentro de `public/` (crie esse arquivo se for essa a
rota escolhida).

### 5. Testar o funil
1. Cadastra um negócio de teste em `/`
2. Abre o link gerado em aba anônima
3. Clica num horário, confere se o WhatsApp abre certo
4. Tenta clicar no mesmo horário em duas abas — só a primeira deve passar

## Próximo passo (Tier 2)
Adicionar Supabase Auth (email+senha) pro dono do negócio, e políticas de
RLS de `update`/`delete` que só liberam edição quando
`auth.uid()` bate com o dono daquele registro. O cliente final continua
sem nunca precisar de login.
