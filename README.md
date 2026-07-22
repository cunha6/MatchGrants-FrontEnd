# MatchGrants — Front-end

Front-end web da aplicação **MatchGrants**, que consome a API JSON em Django
(`http://localhost:8000`). Reúne três áreas de dados e cruza-as:

- **Avisos** — avisos de financiamento público (Portugal 2030, Compete 2030, PRR).
- **Anúncios** — anúncios de contratação pública (base.gov.pt).
- **Match** — dado o NIF de uma entidade, devolve os avisos elegíveis ordenados
  por relevância.
- **Utilizadores** — gestão de contas com papéis (roles).

Construído em **React + Vite + TypeScript**, com **React Router** e um
**AuthContext** para a sessão. Todas as respostas da API estão tipadas.

---

## Como correr

Pré-requisito: a API Django a correr em `http://localhost:8000`.

```bash
npm install
npm run dev       # arranca o Vite em http://localhost:5173
```

Outros comandos:

```bash
npm run build     # verificação de tipos (tsc) + build de produção (vite)
npm run preview   # serve o build de produção localmente
npm run lint      # ESLint
```

---

## Proxy de desenvolvimento e cookies (importante)

A autenticação da API é feita por **cookie de sessão** (não há JWT; os endpoints
são `csrf_exempt`, por isso não é enviado token CSRF). Em desenvolvimento o React
(`:5173`) e o Django (`:8000`) seriam **origens diferentes**, e o cookie de
sessão não passaria de forma fiável entre elas.

A solução é um **proxy de desenvolvimento no Vite**: todas as chamadas à API são
feitas para o prefixo **`/api`** e o proxy reencaminha-as para o Django,
mantendo o browser numa **única origem** (`localhost:5173`) para o cookie
funcionar sem CORS.

```
fetch('/api/avisos/list/')  ──►  http://localhost:8000/avisos/list/
```

Configuração em [`vite.config.ts`](vite.config.ts):

```ts
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:8000',
      changeOrigin: true,
      rewrite: (path) => path.replace(/^\/api/, ''),
    },
  },
}
```

**Porquê o prefixo `/api` e não `/avisos`, `/anuncios`, …?**
A aplicação tem rotas de cliente (SPA) nesses mesmos caminhos (por exemplo, a
página `/avisos/:id/edit` vs. o endpoint `/avisos/:id/edit/`). Se o proxy
apanhasse os prefixos diretamente, um _reload_ do browser numa rota da SPA seria
enviado para o Django em vez de servir a aplicação. O prefixo `/api` separa
limpamente as rotas da app das rotas da API, mantendo tudo _same-origin_.

Todas as chamadas passam por [`src/api/client.ts`](src/api/client.ts), que
usa sempre `credentials: 'include'` e normaliza os erros (`{ "error": ... }`,
`details`, `missing_fields`) num único `ApiError`. **Nenhum componente faz
`fetch` diretamente** — cada funcionalidade tem o seu `api.ts` que reutiliza
este cliente.

### Em produção

Servir o _build_ estático (`dist/`) **na mesma origem** do back-end e
reencaminhar `/api` para o Django (reverse proxy). É exatamente isto que a
imagem Docker faz (ver abaixo). Em alternativa, o back-end teria de ativar
**CORS com credenciais** e permitir a origem do front-end.

---

## Docker

A imagem é _multi-stage_: **Node** faz o _build_ da SPA e o **nginx** serve o
`dist/`, reencaminhando `/api` para o Django (mesma origem → o cookie de sessão
funciona, tal como o proxy do Vite em desenvolvimento).

```bash
docker compose up --build          # → http://localhost:8080
```

Ou sem compose:

```bash
docker build -t matchgrants_front .
docker run -p 8080:80 \
  -e BACKEND_ORIGIN=http://host.docker.internal:8000 \
  --add-host host.docker.internal:host-gateway \
  matchgrants_front
```

**`BACKEND_ORIGIN`** é o endereço da API visto de _dentro_ do contentor
(substituído no template do nginx no arranque):

- `http://host.docker.internal:8000` — Django a correr na máquina anfitriã;
- `http://backend:8000` — um serviço Django na mesma rede do compose.

Configure a porta e o `BACKEND_ORIGIN` num `.env` (ver [`.env.example`](.env.example)).

Ficheiros: [`Dockerfile`](Dockerfile), [`nginx.default.conf.template`](nginx.default.conf.template),
[`docker-compose.yml`](docker-compose.yml), [`.dockerignore`](.dockerignore).
O `nginx` faz _fallback_ das rotas da SPA para `index.html`, aplica _cache_ aos
_assets_ com _hash_ e mantém `/api` com _timeout_ alargado (scrape/import/match
são lentos).

---

## Onde mudar as cores (theming)

Todo o sistema de design (cores, tipografia, espaçamentos, raios, sombras,
_breakpoints_) está centralizado num único ficheiro:

> **[`src/shared/styles/tokens.css`](src/shared/styles/tokens.css)**

Para re-tematizar a aplicação inteira **basta editar as variáveis CSS nesse
ficheiro** — mais nada. Nenhum componente tem cores, tamanhos ou espaçamentos
_hardcoded_: todo o restante CSS usa `var(--…)`. Não há estilos _inline_ com
valores fixos nem CSS-in-JS com valores fixos; os componentes usam **CSS
Modules** (`*.module.css`).

Os tokens foram extraídos das duas maquetas de referência (paleta _ink_/azul,
acento _ember_, verde de sucesso, tipos Space Grotesk / Inter / IBM Plex Mono).

---

## Organização por funcionalidades

```
src/
  api/client.ts              # cliente fetch central (credentials:'include' + ApiError)
  App.tsx  main.tsx

  features/                  # cada área com o seu api.ts, types.ts, pages/, components/
    auth/       AuthContext.tsx · api.ts · pages/ (Login, Register)
    avisos/     api.ts · types.ts · filters.ts · pages/ · components/
    anuncios/   api.ts · types.ts · filters.ts · pages/ · components/
    match/      api.ts · types.ts · pages/ (MatchEvaluate, Promote) · components/
    users/      api.ts · types.ts · filters.ts · pages/ · components/
    ingestion/  pages/ (scraping + importação)

  shared/                    # reutilizável em toda a app
    components/              # Button, Card, DataTable, Badge, FormField, Input,
                            #   Select, Textarea, Modal, Tag, Spinner, Alert,
                            #   Pagination, Section, DetailHero, Deadline, …
    hooks/                   # useApiQuery, useMediaQuery, useDebouncedValue
    utils/                   # format, collections, cx, apiErrors
    constants/               # domain (roles/tipos/dimensões), breakpoints
    styles/                  # tokens.css (ÚNICO sítio dos tokens) · global.css

  layout/                    # NavBar · Drawer · UserMenu · Layout
  routes/                    # AppRoutes · ProtectedRoute · StatusPages
```

Regras seguidas: componentes reutilizáveis, _hooks_ e utilitários vivem **apenas
em `shared/`**; cada funcionalidade contém os seus próprios componentes, páginas,
_hooks_ e acesso à API; tratamento consistente de **loading / erro / vazio** em
todos os ecrãs.

---

## Autenticação e papéis

- A sessão é restaurada no arranque via `GET /users/me/`.
- **Login** (`POST /users/login/`) guarda o utilizador (com `role`) no
  `AuthContext`; **logout** em `POST /users/logout/`.
- Um **401** em qualquer chamada limpa a sessão globalmente; rotas protegidas
  redirecionam para `/login`. Um **403** mostra o ecrã de acesso negado.
- O menu e as ações mudam conforme o papel (`admin`, `commercial`, `composer`,
  `client`, `viewer`). Áreas restritas: **Editar aviso**, **Utilizadores**,
  **Promover** e **Scrape** (admin / commercial).

---

## Responsividade

Abordagem _mobile-first_, testada em ~360 px, ~768 px e ≥1024 px:

- Navegação horizontal em _desktop_; **menu hambúrguer + _drawer_** em mobile.
- As **listas** (avisos, anúncios, utilizadores) são **tabela** em _desktop_ e
  **cartões empilhados** em mobile (componente `DataTable`) — sem _scroll_
  horizontal.
- **Filtros** num painel; em mobile ficam num painel colapsável (`FilterPanel`).
- Formulários numa coluna em mobile e multi-coluna em _desktop_; áreas de toque
  confortáveis. Detalhes em cartões que refluem para uma coluna.

---

## Notas

- As operações de _scraping_ (avisos) e importação (anúncios) e o _match_ podem
  demorar **minutos**; a interface mostra um aviso não-bloqueante com _spinner_.
- No fluxo de _match_, uma resposta **422** (`needs_more_info`) faz a interface
  pedir os `missing_fields` e reenviar o pedido.
