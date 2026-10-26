# Guia de Configuração Técnica (Supabase & GitHub Pages)

Bem-vindo ao TikiTasco! A aplicação funciona com uma infraestrutura 100% gratuita utilizando **Supabase** (PostgreSQL na cloud, Auth e Storage) e alojamento estático no **GitHub Pages**.

---

## 1. Configurar o Projeto no Supabase

1. Acede a [supabase.com](https://supabase.com) e cria uma conta gratuita (ou inicia sessão).
2. Clica em **"New Project"** e escolhe um nome (ex: `tikitasco-db`), uma password para a base de dados e a região mais próxima (ex: Central EU / Frankfurt).
3. Aguarda cerca de 1 a 2 minutos enquanto o Supabase prepara a tua instância.

---

## 2. Criar a Estrutura da Base de Dados (Tabelas, RLS e Triggers)

1. No menu lateral esquerdo do teu painel Supabase, vai a **SQL Editor**.
2. Clica em **"New query"**.
3. Abre o ficheiro [supabase_schema.sql](../supabase_schema.sql) deste repositório, copia todo o conteúdo e cola-o no editor SQL do Supabase.
4. Clica no botão **"Run"** (no canto inferior direito do editor).
5. Este script cria automaticamente:
   - Todas as tabelas da aplicação (`users`, `group_members`, `games`, `votes`, `expenses`, `polls`, `global_locations`);
   - A view calculada `player_stats` para o Leaderboard dinâmico;
   - As políticas de segurança (**Row Level Security - RLS**) para leitura e escrita autenticada;
   - O trigger automático **`on_auth_user_created`** que sincroniza novos utilizadores de `auth.users` diretamente para `public.users` e associa ao grupo padrão.

---

## 3. Configurar o Armazenamento (Storage)

1. No menu lateral esquerdo, clica em **Storage**.
2. Se o bucket `tikitasco-storage` ainda não tiver sido criado automaticamente pelo script SQL:
   - Clica em **"New bucket"**.
   - Nome do bucket: `tikitasco-storage`.
   - Marca a opção **Public bucket** (para que as fotos de campos e recibos possam ser lidas pelos utilizadores).
   - Clica em **"Save"**.

---

## 4. Configurar Autenticação Google OAuth

Para permitir o login dos membros com as respetivas contas Google:

1. No Supabase, vai a **Authentication > Providers** e clica em **Google**.
2. Copia o **Callback URL (for OAuth)** fornecido pelo Supabase (algo como `https://<ref>.supabase.co/auth/v1/callback`).
3. Acede à [Google Cloud Console](https://console.cloud.google.com/):
   - Vai a **APIs & Services > Credentials**.
   - Cria um **OAuth 2.0 Client ID** do tipo **Web application**.
   - Em **Authorized redirect URIs**, adiciona o Callback URL que copiaste do Supabase no passo 2.
   - Em **Authorized JavaScript origins**, adiciona o teu domínio do GitHub Pages (ex: `https://o-teu-username.github.io`) e `http://localhost:5173` para testes locais.
   - Guarda e copia o **Client ID** e o **Client Secret**.
4. Regressa ao painel do Supabase, cola o **Client ID** e o **Client Secret** nas definições do Google Provider e ativa o interruptor (**Enable Provider**). Clica em **Save**.

---

## 5. Configurar o Ambiente Local (`.env.local`)

Na raiz do projeto no teu computador:

1. Cria (ou edita) o ficheiro `.env.local`:
   ```env
   VITE_SUPABASE_URL="https://o-teu-projeto.supabase.co"
   VITE_SUPABASE_ANON_KEY="a-tua-chave-anon-publica"
   ```
2. Podes encontrar estes valores no Supabase em **Project Settings > API**.

---

## 6. Testar e Publicar no GitHub Pages

1. **Testar localmente:**
   ```bash
   npm run dev
   ```
   Abre `http://localhost:5173` no browser e confirma o login e funcionamento.

2. **Publicar no GitHub Pages:**
   ```bash
   npm run deploy
   ```
   *(O comando compila o código com as tuas variáveis de ambiente e faz deploy automático para o ramo `gh-pages`).*

---

## 7. Atualizações Futuras

Para saberes como colocar novas atualizações online sem complicações, consulta o guia:
📖 **[docs/ATUALIZACOES.md](./ATUALIZACOES.md)**
