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

### 2.2 Fase 2 e 3: O Plano Freemium (SaaS) & Packs Multi-Grupo
A verdadeira escalabilidade da empresa atinge-se através de subscrições recorrentes pagas pelos organizadores dos grupos (B2C/B2B) e passes individuais:

*   **TikiTasco (Plano Grátis):**
    *   *Funcionalidades:* Agenda semanal (votações), consulta de campos e histórico de 3 meses.
    *   *Limites:* Máximo de 15 utilizadores por grupo. Limitado a criar 1 grupo. Ads/patrocínios discretos ativados.
*   **Subscrições de Grupo (TikiTasco Pro & Packs):**
    *   *Desbloqueio Coletivo:* Zero anúncios para todos os membros do grupo, Team Generator inteligente, Balneário & Ratings FIFA, Tesouraria coletiva com faturas, upload de vídeos de melhores momentos e histórico vitalício.
    *   **Plano Solo (1 Grupo):** **2.99€ / mês** ou **24.99€ / ano** (ideal para um grupo autónomo; pago pelo Admin ou Caixinha).
    *   **Pack Capitão (3 Grupos):** **6.49€ / mês** ou **59.99€ / ano** (~2.16€/grupo). Ideal para o organizador multi-equipa (amigos, trabalho, faculdade).
    *   **Pack Clube / Liga (5 Grupos):** **9.99€ / mês** ou **89.99€ / ano** (~2.00€/grupo). Desenhado para empresas com múltiplos escalões, clubes amadores ou pequenas associações.
    *   *Mecanismo de "Slots Premium":* O comprador recebe uma quota de vagas Premium que pode atribuir, revogar ou transferir entre os seus grupos a qualquer momento.
*   **Player Pass / VIP (Individual B2C - Pagamento Único Vitalício):**
    *   *Público-Alvo:* Jogadores individuais que pretendem diferenciação estética e ausência de anúncios (ex: **3.99€ ou 4.99€** compra única).
    *   *Benefícios:* Navegação 100% livre de anúncios em qualquer grupo em que jogue (mesmo grupos Free), designs exclusivos de Cartão FIFA (Ouro Raro, TOTW, Retro 90s), badges de perfil no balneário e acesso a gráficos pessoais de evolução de atributos e desempenho ao longo do ano.
*   **Estratégia de Venda (Isenção de "Apple Tax"):** O checkout e faturação de subscrições e packs decorre exclusivamente via web em `app.tikitasco.com` (processamento seguro Stripe), contornando as taxas de 30% das App Stores móveis.

### 2.3 Desafios Inter-Grupos como Motor de Crescimento Viral (Growth Loop)
*   **Amigáveis entre Equipas Distintas:** Funcionalidade que permite ao capitão do Grupo A gerar um "Link de Desafio" para defrontar o Grupo B.
*   **Aquisição Orgânica a Custo Zero:** Para aceitar o desafio e aceder à folha de jogo e votação do Homem do Jogo (MVP), o Grupo B regista-se no TikiTasco, trazendo instantaneamente 10 a 14 novos utilizadores ativos para a plataforma de forma viral e orgânica.
*   **Divisão de Custos:** Custos do recinto repartidos automaticamente 50/50 entre as caixas/tesourarias dos dois grupos.
*   **Confronto Direto (*Head-to-Head*):** Histórico partilhado de vitórias, empates e golos entre grupos rivais.

### 2.4 Ligas Regionais, Torneios Oficiais e Monetização de Eventos (High-Ticket)
Enquanto as subscrições mensais garantem receita recorrente estável (MRR), os Torneios e Ligas sazonais geram picos avultados de faturação direta:
*   **Ligas Oficiais por Zonas Geográficas e Temporadas (Seasons):**
    *   Criadas e administradas pelos **Super-Admins da plataforma** (ex: *"Liga Futsal Grande Lisboa - Temporada Inverno"*, *"Taça Amadora do Grande Porto - Futebol 7"*).
    *   Tabelas classificativas automáticas (Pontos, V, E, D, Golos Marcados/Sofridos e Diferença de Golos).
    *   Gamificação oficial: Bota de Ouro da Liga (melhor marcador), Luva de Ouro (melhor guarda-redes) e Taça Fairplay.
*   **Taxas de Inscrição por Equipa (*Entry Fees*):**
    *   Inscrição paga diretamente pela Caixinha/Admin da equipa via Stripe (ex: **60€ a 120€ por equipa** para uma liga sazonal de 2 a 3 meses). Uma liga com 16 equipas a 80€ gera **1.280€** brutos por evento.
*   **Monetização Adicional de Torneios:**
    *   *Margens em Aluguer de Campos em Bloco:* Negociação de tarifas de revenda com pavilhões parceiros em horários de torneio (gerando 15€ a 25€ de margem por cada hora de jogo).
    *   *Patrocínios Oficiais ("Naming Rights"):* Venda dos direitos de nome da competição a marcas de desporto, bebidas/cervejeiras ou cadeias de restauração locais (ex: 500€ a 2.500€ por época desportiva).
    *   *Prémios e Merchandising:* Parcerias com fabricantes de troféus e lojas de desporto para atribuição de taças oficiais TikiTasco, medalhas e vouchers de consumo aos vencedores.

### 2.5 Fase 5: O "Endgame" (Marketplace B2B2C de Reservas)
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
