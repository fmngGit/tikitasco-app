# System Requirements Specification (SRS) - TikiTasco

Este documento lista de forma exaustiva todos os requisitos **Funcionais (FR)** e **Não-Funcionais (NFR)** necessários para o desenvolvimento e lançamento comercial da plataforma TikiTasco.

---

## 1. Requisitos Funcionais (Functional Requirements - FR)

Os requisitos funcionais definem *o que* o sistema deve fazer. Estão divididos por módulos lógicos da aplicação.

### Módulo 1: Autenticação e Gestão de Conta (Auth)
*   **FR-1.01:** O sistema deve permitir o registo e login de utilizadores via Email/Password (Magic Link suportado).
*   **FR-1.02:** O sistema deve permitir o registo e login via Google OAuth. 
    > **Status:** [IN PROGRESS] - Transição para o Supabase Auth (mantendo a paridade com as contas Google atuais).
*   **FR-1.03:** O sistema deve permitir o registo e login via Apple Sign-In (obrigatório para compliance com App Stores).
*   **FR-1.04:** O utilizador deve poder editar o seu perfil (Nome, Posição Preferida em campo, Fotografia/Avatar).
*   **FR-1.05:** O utilizador deve poder solicitar a eliminação total e irreversível da sua conta (Direito ao Esquecimento - RGPD), anonimizando o seu histórico em vez de o apagar em cascata.

### Módulo 2: Gestão de Grupos (Multi-Tenancy)
*   **FR-2.01:** Um utilizador deve poder criar um ou mais Grupos, tornando-se o `Owner` (Administrador) do mesmo.
*   **FR-2.02:** O Administrador deve poder gerar um "Invite Link" ou "Código de Convite" único para o grupo.
*   **FR-2.03:** Um utilizador deve poder juntar-se a um grupo existente através de um Invite Link.
*   **FR-2.04:** O Administrador deve poder promover outros membros a `Admin` ou `Treasury Admin` (funcionalidade restrita ao plano Premium).
*   **FR-2.05:** O Administrador deve poder expulsar membros do grupo.

### Módulo 3: Votações e Gestão de Eventos (Polls & Games)
*   **FR-3.01:** O Administrador deve poder criar uma "Votação Semanal" sugerindo Dias, Horas e Campos.
*   **FR-3.02:** Os membros do grupo devem poder votar na sua disponibilidade para os horários propostos.
*   **FR-3.03:** O sistema deve validar automaticamente se a votação atinge o quórum/capacidade mínima baseada no campo (ex: 10 pessoas para futebol 5).
*   **FR-3.04:** O sistema deve gerar uma mensagem pré-formatada para partilha rápida via WhatsApp.
*   **FR-3.05:** O Administrador deve poder encerrar a votação e converter o resultado num `Game` com os estados `Marcado`, `Cancelado` ou `Realizado`.

### Módulo 4: Campos e Localizações (Locations)
*   **FR-4.01:** O sistema deve possuir uma base de dados global de campos de futebol.
*   **FR-4.02:** Os utilizadores devem poder visualizar os detalhes globais de um campo (Morada, Preço, Piso).
*   **FR-4.03:** Qualquer utilizador deve poder sugerir a adição de um campo novo ou reportar a alteração de preço de um campo existente (Crowdsourcing).
*   **FR-4.04:** O Administrador do grupo deve poder selecionar quais os campos globais que aparecem como "Disponíveis" para votação na sua equipa.

### Módulo 5: Balneário e Gamificação (Locker Room)
*   **FR-5.01:** O sistema deve gerar equipas equilibradas (Team Generator) utilizando as notas de rating individuais dos jogadores.
*   **FR-5.02:** Após um jogo `Realizado`, os utilizadores devem poder submeter a sua nota de performance e eleger o MVP.
*   **FR-5.03:** O sistema deve calcular um "Leaderboard" e histórico de estatísticas.
*   **FR-5.04 (Premium):** O Administrador deve poder fazer upload direto de ficheiros de vídeo (Highlights) associados a um jogo específico.

### Módulo 6: Tesouraria (Treasury)
*   **FR-6.01:** O Administrador deve poder registar uma despesa associada a um jogo (ex: 50€ aluguer do campo).
*   **FR-6.02:** O sistema deve dividir o custo da despesa pelos jogadores que marcaram presença.
*   **FR-6.03:** O Administrador deve poder marcar o estado de pagamento de um jogador (Pago / Em Dívida).
*   **FR-6.04 (Premium):** O Administrador deve poder exportar o balanço da tesouraria em formato CSV/Excel ou PDF.

### Módulo 7: Portal de Gestão de Campos (Marketplace B2B) - Backlog
*   **FR-7.01:** Os Donos dos Campos (B2B) devem ter um portal web próprio para gerir e bloquear *slots* horários dos seus campos em tempo real.
*   **FR-7.02:** O utilizador administrador (B2C) deve poder reservar e pagar um slot diretamente pela app.
*   **FR-7.03:** O sistema deve executar um split de pagamento via Stripe Connect (enviando X% da comissão para o TikiTasco e o restante para o recinto).
*   **FR-7.04:** O sistema deve ter salvaguardas (Timeouts) para o pagamento, evitando duplo *booking* no mesmo slot durante a janela de pagamento.

---

## 2. Requisitos Não-Funcionais (Non-Functional Requirements - NFR)

Os requisitos não-funcionais definem *como* o sistema deve operar (Qualidade, Performance, Segurança e Legalidade).

### NFR 1: Performance e Escalabilidade
*   **NFR-1.01 (Web Vitals):** O tempo de carregamento da página principal (Largest Contentful Paint - LCP) deve ser inferior a 2.5 segundos.
*   **NFR-1.02 (Latência):** O tempo de resposta das APIs para a listagem de jogos não deve exceder os 500ms.
*   **NFR-1.03 (Escalabilidade):** A base de dados (Supabase) deve suportar até 5.000 DAU (Daily Active Users) sem degradação do tempo de resposta.

### NFR 2: Segurança e Compliance (RGPD & Legal)
*   **NFR-2.01 (Residência de Dados):** Todos os dados persistentes (Supabase PostgreSQL) e assets estáticos (Vercel) devem ser alojados fisicamente em datacenters da União Europeia.
*   **NFR-2.02 (RLS):** A base de dados deve implementar "Row Level Security". Um utilizador nunca deve conseguir ler via API direta dados de um Grupo ao qual não pertence.
*   **NFR-2.03 (Segredos):** Chaves de API (Supabase, Stripe) nunca devem estar expostas no código fonte (frontend), mas sim geridas por variáveis de ambiente seguras (`.env`).
*   **NFR-2.04 (Termos):** O sistema não executa transações bancárias, e isso deve estar explicito legalmente para isenção do PSD2.

### NFR 3: Usabilidade e Acessibilidade (UX/UI)
*   **NFR-3.01 (Mobile First):** O design deve ser 100% responsivo, com foco primário em ecrãs móveis (PWA), visto que 90%+ do uso será no telemóvel via WhatsApp.
*   **NFR-3.02 (Offline Tolerant):** A PWA deve ter Service Workers configurados para fazer cache do "shell" da app, permitindo uma transição fluida mesmo em redes lentas (ex: num campo de futebol com mau sinal).
*   **NFR-3.03 (Frictionless Onboarding):** O processo desde receber um invite-link até votar não deve demorar mais de 30 segundos para um utilizador novo.

### NFR 4: DevOps e Infraestrutura
*   **NFR-4.01 (IaC):** O provisionamento de ambientes (ACCP e PROD) deve ser automatizado com Terraform (ou análogo).
*   **NFR-4.02 (Quality Gates):** Todos os Pull Requests devem passar com sucesso no pipeline de Linting (ESLint), formatação (Prettier) e Unit Tests (Vitest) antes do merge.
*   **NFR-4.03 (Zero-Downtime):** Deployments para o ambiente de Produção não podem causar interrupção do serviço para os utilizadores ativos.
