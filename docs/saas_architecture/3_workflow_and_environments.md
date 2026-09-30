# Workflow e Ambientes de Desenvolvimento (CI/CD)

Ao passarmos de um projeto de hobby para uma plataforma SaaS (Software as a Service) com múltiplos clientes (grupos de futebol), introduzir bugs diretamente em produção torna-se inaceitável.

Esta secção documenta o fluxo de trabalho obrigatório e a estratégia de ambientes (Environments) a adotar.

---

## 1. Ambientes (Environments)

O projeto passará a operar com três ambientes distintos, suportados tanto no Frontend (ex: Vercel) como no Backend (Supabase Projects separados).

### 1.1 Development (DEV)
*   **Propósito:** Ambiente local dos developers e testes isolados das novas funcionalidades.
*   **Acesso:** `localhost:5173`
*   **Base de Dados:** Base de dados local do Supabase (via Supabase CLI) ligada a dados completamente fictícios e gerados aleatoriamente (seed data).
*   **Estratégia Branch:** Todas as `feature/branches` e trabalho individual. Nenhuma dependência externa deve apontar para produção.

### 1.2 Acceptance / Staging (ACCP)
*   **Propósito:** Réplica exata do ambiente de produção usada para testes finais, QA (Quality Assurance), e partilha com um grupo restrito de Beta Testers (ex: o grupo original do TikiTasco).
*   **Acesso:** `accp.tikitasco.com` ou URL de preview automático do Vercel (ex: `tikitasco-accp-xyz.vercel.app`).
*   **Base de Dados:** Um projeto Supabase separado (Projeto Staging). Contém dados anónimos que mimetizam a volumetria de produção.
*   **Estratégia Branch:** Código a correr na branch `develop`. Todos os Pull Requests de features são feitos contra esta branch e testados aqui.

### 1.3 Production (PROD)
*   **Propósito:** O ambiente real utilizado pelos clientes, altamente monitorizado.
*   **Acesso:** `app.tikitasco.com` (e ficheiros binários na App Store/Google Play apontando para as APIs de produção).
*   **Base de Dados:** O projeto Supabase principal. Backups diários (Point-in-Time Recovery). Row Level Security rigoroso ativado.
*   **Estratégia Branch:** Código a correr na branch `main`. Apenas os commits/tags que foram extensivamente validados na ACCP transitam para aqui via Merge.

---

## 2. CI/CD Workflow (Integração e Entrega Contínuas)

Para que a gestão seja ágil e sem falhas humanas no processo de *deploy*, sugere-se a automação do fluxo no GitHub Actions acoplado ao Vercel.

### Passo-a-Passo de uma Nova Feature:
1.  **Desenvolvimento:**
    *   O developer puxa a branch `develop`.
    *   Cria uma branch `feature/novo-rating`.
    *   Trabalha localmente (`npm run dev`) contra a BD local.
2.  **Pull Request (PR) e Quality Gates (ACCP):**
    *   O dev abre um PR da `feature/novo-rating` para a `develop`.
    *   O GitHub Actions desencadeia um Pipeline de Controlo de Qualidade rigoroso:
        *   **Linting e Code Formatting:** Verificação automática de sintaxe via `ESLint` e `Prettier`.
        *   **Security Scans:** Auditoria a dependências (ex: `npm audit`, Snyk, SonarQube) para evitar vulnerabilidades.
        *   **Testes Unitários:** Execução do `Vitest` em módulos de código isolados.
        *   **Testes Funcionais/E2E:** `Playwright` ou `Cypress` simulam o comportamento real do utilizador (ex: clicar no botão de login, votar na segunda-feira, validar que o painel atualiza).
        *   **Performance Tests:** Avaliação automática com o Lighthouse CI para garantir métricas Core Web Vitals (ex: LCP < 2.5s).
    *   O Vercel automaticamente deteta o PR, constrói a aplicação e gera um URL temporário (Preview Deployment).
    *   Sendo aprovado (testes verdes e code review), faz-se o "Merge". O ambiente `accp.tikitasco.com` é atualizado instantaneamente.
3.  **Deploy para Produção (PROD):**
    *   Após validação em ACCP, faz-se Merge da `develop` para a `main`.
    *   O Vercel implanta automaticamente em produção no domínio oficial, com Zero-Downtime.

---

## 3. Automação de Infraestrutura (Infrastructure as Code - IaC)

Nenhum ambiente de produção deve ser gerido manualmente através de cliques em painéis web (ex: Vercel Dashboard ou Supabase Studio).

*   **Ferramenta Sugerida:** **Terraform** ou **Pulumi**.
*   **Implementação:** Os recursos da Vercel (projetos, domínios, variáveis de ambiente) e do Supabase (buckets, bases de dados, regras de autenticação RLS) serão definidos em código.
*   **Benefício:** Se o ambiente de Produção colapsar por completo, o pipeline de IaC consegue reerguer a infraestrutura inteira exatamente como estava em poucos minutos.

---

## 4. Gestão de Segredos (.env)

O repositório **nunca** deve conter chaves reais. 
Os ficheiros `.env` devem seguir esta estrutura (o `.env.example` fica no git):

*   `.env.local` -> Chaves da BD local (usado apenas em DEV).
*   Variáveis no Vercel (Staging) -> Chaves do Supabase Staging.
*   Variáveis no Vercel (Production) -> Chaves do Supabase Produção.

Exemplo das variáveis obrigatórias futuras:
`VITE_SUPABASE_URL`
`VITE_SUPABASE_ANON_KEY`
