# Análise de Custos, Infraestrutura e Rentabilização (TikiTasco SaaS)

Esta análise detalha os custos projetados e as estimativas reais de faturação para operar a plataforma em três fases de escala. Os cálculos de receita baseiam-se em médias da indústria para aplicações desportivas (eCPM de Anúncios e Taxa de Conversão Freemium de ~3% a 5%).

---

## 1. Fase 1: MVP Público e Early Adopters
**Métrica Alvo:** 1 a 10 Grupos (~150 Utilizadores Registados / ~50 Utilizadores Ativos Diários - DAU)
**Objetivo:** Validação do mercado sem gastar dinheiro. Apenas formato PWA (Web).

### 1.1 Custos (Infraestrutura Gerida Free Tier)
*   **Hosting (Vercel):** 0€/mês (Plano Hobby suporta facilmente milhares de acessos mensais).
*   **Base de Dados & Auth (Supabase):** 0€/mês (Plano Free suporta até 50.000 utilizadores ativos).
*   **Domínio Próprio:** ~15€/ano (ex: `tikitasco.com`).
*   **Total de Custos:** **~1.25€ / mês** (amortização do domínio).

### 1.2 Projeção de Faturação e Ads Iniciais
*   **Anúncios Não-Intrusivos:** Mesmo na Fase 1, a aplicação apresentará anúncios integrados no design (ex: banners nativos entre as listas de votação) para educar os utilizadores desde o dia zero de que a plataforma tem uma vertente comercial.
*   **Targeting e Patrocínios Próprios:**
    *   Via AdMob: Configurar os filtros para bloquear anúncios sensíveis ou genéricos, forçando o algoritmo a mostrar material desportivo (Futebol, Apostas Desportivas se legal/aceitável, Material Desportivo).
    *   Via Patrocínio Direto: A plataforma deve suportar banners inseridos manualmente pelo Administrador (ex: Uma loja de desporto local paga X€ por mês para o banner deles rodar na app). O lucro de um patrocínio próprio é sempre de 100%, sem intermediários.
*   **Faturação Total Esperada:** Variável consoante patrocínios (ex: 20€/mês do patrocinador local + pequenos cêntimos do AdMob).
*   **Lucro Líquido:** Margem já positiva devido aos baixos custos.

---

## 2. Fase 2: Tração e Lançamento nas App Stores
**Métrica Alvo:** 50 Grupos (~750 Utilizadores / ~300 DAU)
**Objetivo:** Publicar nas lojas nativas (iOS/Android), começar a monetizar para cobrir custos de servidor que inevitavelmente vão surgir.

### 2.1 Custos
*   **Supabase (Pro):** ~23€/mês (Obrigatório nesta fase para ter backups diários automáticos e evitar perder dados reais de grupos).
*   **Licença Google Play Store:** ~23€ (Pagamento único vitalício).
*   **Licença Apple App Store:** ~90€/ano (Custo anual obrigatório).
*   **Total de Custos:** **~30€ / mês** (amortizando a Apple e Servidores).

### 2.2 Projeção de Faturação
*   **Anúncios (AdMob):** 300 DAU (com 4 page views/dia) = ~1200 impressões/dia. Com um eCPM médio de 1€ a 2€, gera cerca de **~15€ a 25€ / mês**.
*   **Plano Premium (SaaS):** Criar um plano "TikiTasco Pro" a **2.99€/mês** por grupo (desbloqueia histórico infinito e stats avançadas). Com uma taxa de conversão conservadora de 5% (2.5 grupos), gera **~7.50€ / mês**.
*   **Faturação Total Esperada:** **~25€ a 30€ / mês**.
*   **Lucro Líquido:** **~0€ / mês** (Break-even alcançado. A app paga-se a si própria).

---

## 3. Fase 3: Escala Comercial
**Métrica Alvo:** 1.000 Grupos (~15.000 Utilizadores / ~5.000 DAU)
**Objetivo:** O projeto torna-se lucrativo e requer alguma escalabilidade na arquitetura.

### 3.1 Custos Tecnológicos e Operacionais
Com 5.000 pessoas a usar a app diariamente, os recursos computacionais deixam o plano base:
*   **Supabase (Pay as you Go):** ~23€ base + ~10€ uso extra (storage/bandwidth). Total: ~33€/mês.
*   **Emails Transacionais (ex: SendGrid):** Para avisos de votação. ~15€/mês.
*   **Hosting Vercel Pro:** ~20€/mês (Para ter Service Level Agreements e colaboração na equipa).
*   **Push Notifications Móveis (Firebase):** 0€ (Push notifications nativas costumam ser gratuitas ilimitadamente no Firebase).
*   **Subtotal Tecnológico:** **~75€ / mês**.

### 3.2 Custos Burocráticos e Legais (Fase Empresa / ENI)
Existem duas vias para faturar legalmente. Para evitar o custo elevado de um contabilista, a melhor alternativa para pequenos negócios de software (SaaS) é a Via 1:

**Via 1: Empresário em Nome Individual (Regime Simplificado)**
*   A faturação fica em nome de um dos fundadores (abertura de atividade nas Finanças). 
*   Enquanto não faturarem mais de ~15.000€/ano, **não precisam de Contabilista Certificado** (TOC) nem de abrir empresa.
*   **Custos Via 1:** Apenas o Software de Faturação (Moloni/InvoiceXpress) ~15€/mês. Custo zero de criação.

**Via 2: Sociedade por Quotas (Lda)** *(Apenas quando a faturação for massiva ou quiserem vender a empresa)*
*   **Criação de Empresa:** ~360€ (Custo Único).
*   **Contabilista (TOC):** ~150€/mês (Obrigatório por lei para empresas Lda).
*   **Software de Faturação:** ~15€/mês.

*(Assumindo a Via 1, o subtotal burocrático é de apenas **~15€ / mês**).*

### 3.3 Projeção de Faturação e Lucro Líquido (Escala Global)
*Atenção à métrica de utilizadores:* É verdade que 15.000 jogadores é uma fatia muito grande do futebol amador em Portugal. No entanto, uma Web App não tem fronteiras. Países como o **Brasil** têm milhões de jogadores de futebol de fim-de-semana (as chamadas "peladas"), onde este modelo é altamente escalável sem custo extra.

*   **Anúncios (AdMob):** 5.000 DAU geram cerca de 20.000 impressões/dia. Num mês, isso são ~600.000 impressões. A um eCPM de 1.50€, gera cerca de **~300€ / mês**.
*   **Plano Premium (SaaS):** Com 1.000 grupos, uma taxa de conversão de 5% significa 50 grupos pagantes a 2.99€ = **~150€ / mês**.
*   **Faturação Total Esperada:** **~450€ / mês**.
*   **Custo Mensal Total:** ~90€ / mês (75€ Tech + 15€ Burocrático da Via ENI).
*   **Lucro Líquido Esperado:** **~360€ / mês**. *(Ao remover o custo do contabilista, a margem de lucro fica espetacular).*

---

## 4. Fase 4: O Marketplace (Escala Unicórnio)
Nesta fase (ver `4_business_model.md`), o TikiTasco intermédia reservas de campos retendo comissões, superando largamente a rentabilidade do Freemium.

### 4.1 Projeção (Marketplace)
*   Se 20% dos 1.000 grupos agendarem **1 jogo por semana** através da plataforma: são 200 jogos semanais (800/mês).
*   Assumindo o preço médio de um campo a 40€ e o TikiTasco retendo **10% de comissão** = 4€ de lucro por jogo.
*   Faturação Marketplace: 800 jogos * 4€ = **~3.200€ limpos / mês**.
*   *Nota de Risco:* O custo com o Stripe Connect aumenta (processamento de pagamentos tripartidos), mas a margem esmaga qualquer outra fonte de receita.

---

## Resumo Estratégico para Maximizar o Lucro

### O Problema da Taxa Apple/Google ("Apple Tax")
Se o Plano "TikiTasco Pro" de 2.99€ for cobrado dentro da App Móvel usando os sistemas de In-App Purchases (IAP), a Apple e a Google retêm **15% a 30%** desse valor.
*   *Solução do Mundo Real (Exemplo: Netflix ou Spotify):* A subscrição **não** pode ser feita dentro da aplicação móvel. O criador do grupo deve ir a `app.tikitasco.com` (no browser), fazer o upgrade utilizando o **Stripe**. 
*   O Stripe retém apenas `~2.9% + 0.30€`. Na App móvel, as funcionalidades premium simplesmente "desbloqueiam" magicamente assim que o sistema detetar que o grupo é Pro, contornando totalmente a comissão das App Stores de forma 100% legal.
