# My Better Anime List

Aplicação web para explorar e descobrir animes, consumindo a [Jikan API](https://jikan.moe/) (API não-oficial do MyAnimeList).

## Funcionalidades

- **Busca de animes** com debounce
- **Ordenação** por score, popularidade, rank, título, episódios e favoritos
- **Infinite scroll** para carregamento contínuo
- **Alternância de exibição** entre grid (thumbnails) e lista
- **Página de detalhes** com sinopse, gêneros, estúdio, episódios, etc.
- **Tema claro/escuro**
- **Internacionalização** (Português e Inglês)

## Tech Stack

- **React 19** + **TypeScript**
- **Vite** — bundler
- **TanStack Router** — roteamento file-based
- **TanStack React Query** — gerenciamento de estado do servidor
- **shadcn/ui** (com **Base UI**) — componentes de UI
- **Tailwind CSS 4** — estilização
- **react-i18next** — internacionalização
- **Lucide React** — ícones
- **standard-version** — versionamento semântico automático

## Como rodar

```bash
# Instalar dependências
pnpm install

# Rodar em desenvolvimento
pnpm dev

# Build de produção
pnpm build

# Preview do build
pnpm preview
```

## Releases

O projeto usa [Conventional Commits](https://www.conventionalcommits.org/) e [standard-version](https://github.com/conventional-changelog/standard-version) para versionamento automático.

```bash
# Criar uma nova release (analisa commits e bumpa a versão)
pnpm release

# Enviar com tags
git push --follow-tags origin main
```

| Tipo de commit | Bump de versão |
|---|---|
| `fix:` | patch (0.0.x) |
| `feat:` | minor (0.x.0) |
| `BREAKING CHANGE:` | major (x.0.0) |

## API

Dados fornecidos pela [Jikan API v4](https://docs.api.jikan.moe/), uma API REST gratuita e open-source para o MyAnimeList.
