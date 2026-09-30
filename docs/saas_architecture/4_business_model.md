# Modelo de Negócio e Estrutura da Equipa (TikiTasco SaaS)

Este documento define as diretrizes estratégicas para a fundação da startup por trás da aplicação TikiTasco, dividindo claramente o modelo de negócio e as responsabilidades entre os fundadores técnicos e não-técnicos (distribuição 50/50).

---

## 1. Estrutura Societária e Distribuição de Responsabilidades

Uma startup funcional requer que todos os fundadores tenham responsabilidades claras para evitar atritos. Com uma equipa dividida em 50% pessoal de informática e 50% pessoal não-técnico, a divisão deve ser a seguinte:

### 1.1 O Lado Técnico (Informáticos) - "Product & Engineering"
*   **Responsabilidades:**
    *   Desenvolvimento de Novas Funcionalidades (Web, Mobile, Backend).
    *   Gestão da Infraestrutura Cloud (IaC via Terraform, Vercel, Supabase).
    *   Segurança de Dados e cumprimento de RGPD no código.
    *   Manutenção do pipeline CI/CD (Garantir que a app não vai abaixo).
    *   Resolução de Bugs técnicos reportados pelos utilizadores.

### 1.2 O Lado Não-Técnico - "Growth, Sales & Operations"
*   **Responsabilidades:**
    *   **Aquisição de Clientes:** Falar com organizadores de grupos amadores de futebol (amigos, torneios locais, clubes), fazer demonstrações da app e trazê-los para a plataforma.
    *   **Patrocínios Diretos:** Contactar lojas de desporto locais, marcas de equipamentos ou campos de futebol para lhes vender os "Banners" publicitários da Fase 1, cobrando uma mensalidade fixa.
    *   **Gestão da Base de Dados de Campos (Crowdsourcing) e Vendas B2B:** O lado técnico cria o sistema; o lado não-técnico *valida* os campos sugeridos. Para a futura Fase 4 (Marketplace), esta equipa baterá à porta dos pavilhões e campos para lhes vender/oferecer o portal B2B do TikiTasco, convencendo-os a abandonar o Excel ou a AirCourts.
    *   **Marketing e Redes Sociais:** Criar conteúdo (ex: memes de futebol de domingo no Instagram/TikTok) para gerar tração orgânica.
    *   **Apoio ao Cliente:** Responder a emails de dúvidas e encaminhar verdadeiros bugs para a equipa técnica.

---

## 2. O Modelo de Negócio (Monetização)

O TikiTasco deve gerar receita passiva através de duas frentes: **Publicidade** e **Subscrições Freemium**.

### 2.1 Fase 1: Monetização de Tração (B2B Local & AdMob)
*   **Anúncios In-App:** 
    *   Ativos desde o dia 1 para educar o mercado, mas de forma muito subtil (ex: um pequeno banner nativo no ecrã de votação). 
    *   *Filtragem AdMob:* Apenas mostrar anúncios da categoria "Desporto e Fitness".
*   **Patrocínios Diretos (B2B):**
    *   A equipa não-técnica pode fechar acordos de 50€/mês com negócios locais (ex: o Bar do Pavilhão, a loja de equipamentos da cidade). O banner desse patrocinador roda na app em 100% das vezes num determinado distrito (via GPS/região). O lucro é direto e isento de taxas do Google.

### 2.2 Fase 2 e 3: O Plano Freemium (SaaS)
A verdadeira escalabilidade da empresa atinge-se através de subscrições recorrentes pagas pelos organizadores dos grupos (B2C/B2B).

*   **TikiTasco (Plano Grátis):**
    *   Limites: Histórico guardado apenas 3 meses. Máximo de 15 utilizadores por grupo. Limitado a criar 1 grupo. Ads ativados.
*   **TikiTasco Pro (Ex: 2.99€ / Mês por Grupo):**
    *   Funcionalidades Desbloqueadas: 
        *   Sem anúncios.
        *   Histórico e finanças ilimitados.
        *   Exportação de dados para PDF/Excel.
        *   Tamanho do grupo ilimitado.
    *   **Estratégia de Venda (Contornar "Apple Tax"):** As vendas não devem ocorrer dentro das Apps móveis para evitar dar 30% de comissão à Apple/Google. O checkout deve ser feito exclusivamente em `app.tikitasco.com` (via Stripe) num browser. A App Móvel é um "leitor" desse estatuto Pro.

### 2.3 Fase 4: O "Endgame" (Marketplace B2B2C)
Quando a plataforma possuir um volume crítico de grupos reféns do sistema (ex: milhares de jogadores ativos), o TikiTasco lançará o seu modelo de rentabilidade máxima: um Marketplace de Reservas.
*   **O Portal de Campos:** O TikiTasco oferecerá um portal de gestão gratuito aos Donos dos Campos desportivos (B2B), substituindo os seus ficheiros Excel.
*   **Modelo de Comissão:** Quando um grupo votar e decidir jogar num campo, a reserva e o pagamento podem ser feitos instantaneamente na app. O TikiTasco retém uma comissão (ex: 5% a 15% ou valor fixo alto para auto-inscrições) e transfere o restante para o recinto via *Stripe Connect*.
*   **A "Alavanca" Comercial:** Os donos de campos serão convencidos a aderir porque o TikiTasco já detém a base de clientes. Se não aderirem, os grupos irão ver outros campos disponíveis para reserva fácil na app e a concorrência ganha o negócio.

---

## 3. Road to Market (Estratégia de Lançamento)

1.  **Alpha Test (Nós):** O próprio grupo dos fundadores usa a v0.1 por 2 semanas para limar os piores bugs.
2.  **Beta Fechado:** Cada fundador (técnico ou não) convida **um** outro grupo de futebol que conheça. Monitoriza-se como o servidor (e o grupo beta) se comporta.
3.  **Lançamento Público (Fase 1 Web):** Anúncio nas redes sociais. A equipa não-técnica inicia prospeção de patrocínios enquanto a equipa técnica estabiliza a infraestrutura.
4.  **Lançamento App Stores:** Assim que houver receita orgânica para justificar a anuidade da Apple (90€) e se provar retenção de grupos por >2 meses.
