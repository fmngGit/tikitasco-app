# TikiTasco SaaS - Overview e Requisitos

## 1. Visão Geral do Produto
O **TikiTasco** começou como um MVP focado num único grupo de futebol amador (arquitetura single-tenant suportada por Google Sheets). O objetivo desta fase é escalar a plataforma para um modelo **SaaS (Software as a Service) Multi-grupo**. 

Esta transição permite que múltiplos grupos de futebol se registem, criem os seus "balneários virtuais" isolados, convidem jogadores e giram as suas votações, orçamentos e jogos de forma autónoma.

A aplicação será servida inicialmente como uma **PWA (Progressive Web App)** para validação do mercado, estando a arquitetura preparada de raiz para um futuro empacotamento nativo (iOS e Android) via Capacitor ou React Native.

---

## 2. Requisitos Técnicos e Arquitetura

### 2.1 Stack Tecnológica
*   **Frontend:** React + TypeScript (Vite). Reutilização dos componentes UI da v0.1.
*   **Backend & Base de Dados:** **Supabase** (PostgreSQL). A escolha de uma base de dados relacional (SQL) é fundamental para a gestão de entidades interligadas (ex: um utilizador pertencer a múltiplos grupos, grupos terem múltiplos eventos).
    > **Status:** [IN PROGRESS] - A migração dos dados do Google Sheets para Supabase está a decorrer, implementando de raiz a estrutura multi-tenant.
*   **Hosting Web:** Vercel (ideal para pipelines de CI/CD automatizadas com diferentes ambientes). *(Atualmente: GitHub Pages)*
*   **Empacotamento Mobile:** CapacitorJS (futuro).

### 2.2 Arquitetura de Dados (Modelo Multi-Tenancy)
Para assegurar o isolamento dos dados de cada equipa:

1.  **`users`**: Registo global da plataforma.
    *   `id` (UUID), `email`, `nome`, `avatar_url`.
2.  **`groups`**: O espaço privado ("tenant").
    *   `id` (UUID), `name`, `invite_code`, `created_at`.
3.  **`group_members`**: Tabela de associação (N:M).
    *   `user_id`, `group_id`, `role` (owner, admin, member).
4.  **Gestão de Campos (Locations - Global vs Local)**:
    *   **`global_locations`**: Base de dados partilhada de campos (id, nome, morada, preço). 
    *   **`group_locations`**: Tabela de associação (`group_id`, `location_id`) que define quais campos globais estão ativados para um grupo específico.
    *   *Crowdsourcing:* Qualquer utilizador pode visualizar campos globais e sugerir novos campos ou **reportar erros** (ex: preço desatualizado). Administradores da plataforma (ou do grupo) validam estas alterações. (Estratégia: Manter esta feature grátis para acelerar o crescimento inicial da base de dados de campos de futebol a nível nacional).
5.  **Recursos Específicos (Tenant-scoped)**:
    *   Tabelas como `polls`, `games` e `treasury` terão obrigatoriamente uma coluna `group_id` (Foreign Key). 
    *   Implementação de Row Level Security (RLS) no Supabase para garantir que um utilizador apenas consegue ler/escrever dados onde o `group_id` coincide com um grupo ao qual pertence.

---

## 3. Funcionalidades e Casos de Uso (v0.1 e Futuro)

Para garantir uma visão unificada, listam-se abaixo todas as funcionalidades (incluindo as já existentes no MVP v0.1 e as planeadas para a arquitetura SaaS):

### 3.1 Gestão de Utilizadores e Grupos
*   **Autenticação:** Login suportado com qualquer Email (Password ou Magic Link), além de integrações diretas com contas Google e Apple (Apple Sign-In).
*   **Perfis de Jogador:** Gestão de Avatar, Posição em Campo, e Nome.
*   **Onboarding de Grupos (Futuro):** Criação de múltiplos grupos privados. Entrada no balneário via "Invite Link" ou código partilhado (ex: WhatsApp).

### 3.2 Votações e Gestão de Jogos
*   **Criação de Votações:** Admins lançam votações semanais de disponibilidade (Dias da semana, Horas, Campos).
*   **Respostas e Quórum:** Os utilizadores indicam disponibilidade. A plataforma indica o estado em tempo real (Disponíveis, Não Podem, Faltam Votar) e valida se há jogadores suficientes (capacidade do campo).
*   **Partilha Rápida:** Integração nativa para gerar mensagens automáticas e partilhar a votação no grupo de WhatsApp.
*   **Marcação e Estado do Jogo (Futuro):** Após a votação, o Admin "tranca" um resultado vencedor e converte a votação num `Game`. O jogo transita entre estados:
    *   🟡 `Marcado` (Os jogadores recebem confirmação do dia, hora e local).
    *   🔴 `Cancelado` (Se chover ou faltar pessoal à última da hora).
    *   🟢 `Realizado` (Ativa a inserção de resultados e ratings).

### 3.3 Balneário e Gamificação
*   **Team Generator:** Algoritmo de geração automática de equipas equilibradas (com base nos ratings dos jogadores).
*   **Leaderboard e Estatísticas:** Rankings baseados nas classificações pós-jogo (MVP, Golos, Ratings "estilo FIFA").
*   **Histórico e Multimédia (Agenda):** Registo de jogos passados e futuros. Possibilidade de fazer **upload de vídeos/highlights** dos lances e golos (funcionalidade Premium).

### 3.4 Gestão de Campos (Locations)
*   **Base de Dados Global (Futuro):** Repositório partilhado de campos de futebol. 
*   **Crowdsourcing (Futuro):** Qualquer utilizador pode sugerir campos novos ou reportar erros (preço desatualizado). O Admin do grupo escolhe quais os campos disponíveis para a sua equipa.

### 3.5 Tesouraria
*   **Controlo Financeiro:** Registo de despesas (aluguer de campo, bolas) e controlo individual de quotas (quem já pagou vs quem tem dívidas).

---

## 4. Planos e Funcionalidades (Freemium vs Premium)

A aplicação adotará um modelo de negócio Freemium. Para incentivar o upgrade sem prejudicar a usabilidade base, a divisão de funcionalidades será a seguinte:

### ⚽ Plano Amador (100% Grátis)
*   Acesso a todas as funcionalidades de Votação, Team Generator e Tesouraria.
*   **Publicidade:** Anúncios não-intrusivos ativados (Banners AdMob direcionados a Desporto ou de Patrocinadores Locais B2B).
*   **Limites:**
    *   Máximo de **15 jogadores** ativos por grupo.
    *   Histórico e Estatísticas guardados apenas durante **3 meses**.
    *   Criação limitada a 1 Grupo como Administrador (pode pertencer a vários como jogador).

### 🏆 Plano TikiTasco Pro (Ex: 2.99€ / Mês por Grupo)
Pago pelo Administrador do Grupo via Web (Stripe) para isentar taxas das App Stores.
*   **Sem Anúncios:** Experiência 100% limpa (Ad-Free).
*   **Limites Removidos:** 
    *   Jogadores ilimitados no grupo.
    *   Histórico, Agenda e Estatísticas mantidos para **sempre**.
*   **Multimédia:** Capacidade de fazer **upload de vídeos/highlights** dos jogos diretamente para a plataforma (os utilizadores gratuitos só podem partilhar links externos).
*   **Exportação Financeira:** Possibilidade de exportar a folha de Tesouraria em PDF/Excel.
*   **Permissões Avançadas:** Possibilidade de nomear múltiplos Co-Admins ou Tesoureiros no grupo.

---

## 5. Análise Legal e Compliance

Dada a complexidade e rigor exigido para lançamento público (RGPD, isenções financeiras, e regras rígidas das App Stores), todo o enquadramento legal, estruturação fiscal e obrigações da plataforma encontram-se detalhadamente mapeados no documento autónomo: **[6_legal_and_compliance.md](./6_legal_and_compliance.md)**.
