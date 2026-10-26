# System Requirements Specification (SRS) - TikiTasco

Este documento lista de forma exaustiva todos os requisitos **Funcionais (FR)** e **Não-Funcionais (NFR)** necessários para o desenvolvimento e lançamento comercial da plataforma TikiTasco.

---

## 1. Requisitos Funcionais (Functional Requirements - FR)

Os requisitos funcionais definem *o que* o sistema deve fazer. Estão divididos pelos módulos lógicos da aplicação, cobrindo tanto as funcionalidades já operacionais em produção como as evoluções planeadas para a arquitetura SaaS comercial.

### Módulo 1: Autenticação, Perfis e Convidados (Auth & Players)
*   **FR-1.01:** O sistema deve permitir o registo e autenticação de utilizadores via Google OAuth (Supabase Auth).
*   **FR-1.02:** O sistema deve suportar autenticação por Email/Password e Magic Link como métodos alternativos de acesso.
*   **FR-1.03:** O sistema deve suportar Apple Sign-In (obrigatório para compliance com as diretrizes da Apple App Store).
*   **FR-1.04:** O sistema deve implementar um fluxo de Onboarding / Setup Obrigatório (`needsSetup`): ao autenticar-se pela primeira vez via Google OAuth, o utilizador é reencaminhado obrigatoriamente para a configuração inicial do seu Nome e Fotografia/Avatar antes de poder navegar nas restantes secções da aplicação.
*   **FR-1.05:** O utilizador deve poder editar o seu perfil a qualquer momento (Nome, Fotografia/Avatar e Posição preferida). O upload de fotografia deve executar recorte quadrado centrado e compressão no cliente via HTML5 Canvas (150x150 px, JPEG 0.65 em base64) para garantir carregamento instantâneo e poupança de armazenamento.
*   **FR-1.06:** O perfil de cada jogador deve apresentar o seu Cartão estilo FIFA personalizado, exibindo o OVR (Overall Rating), gráfico radar com os 6 atributos essenciais (0 a 100) e o histórico estatístico acumulado (Total de Jogos, Vitórias, Empates, Derrotas e Percentagem de Sucesso).
*   **FR-1.07:** O sistema deve disponibilizar um Modal de Detalhes do Jogador (Player Modal) acessível ao clicar em qualquer jogador no Leaderboard ou Perfil, exibindo o seu Cartão FIFA, gráfico radar e a lista cronológica completa de todos os jogos em que participou.
*   **FR-1.08:** O sistema deve permitir a criação rápida de Jogadores Convidados (`is_guest: true`) com geração automática de identificador (`guest_<uuid>@convidado.tikitasco`), para inclusão imediata em convocatórias e jogos sem necessidade de registo prévio de conta.
*   **FR-1.09:** O Administrador deve poder editar e corrigir o nome atribuído a qualquer jogador convidado.
*   **FR-1.10:** O sistema deve disponibilizar um mecanismo de Reivindicação de Perfil Fantasma (Claim Ghost Player). Quando um jogador convidado se regista com a sua conta Google real, pode associar-se ao seu histórico anterior, transferindo e fundindo automaticamente todas as presenças em jogos (tabela `games`), votos recebidos (tabela `votes`), eliminando conflitos de voto e removendo o perfil provisório.
*   **FR-1.11:** O utilizador deve poder solicitar a eliminação irreversível da sua conta (Direito ao Esquecimento - RGPD), desassociando a sua identidade Google e convertendo o histórico em jogador convidado, sem quebrar a integridade contabilística ou desportiva dos restantes participantes.
*   **FR-1.12:** A aplicação PWA deve disponibilizar um modal e instruções de instalação no ecrã inicial para utilizadores iOS (Safari "Partilhar > Adicionar ao ecrã principal") e utilizadores Android.

### Módulo 2: Gestão de Grupos e Multi-Tenancy
*   **FR-2.01:** O sistema deve permitir que um utilizador pertença a múltiplos Grupos em simultâneo (relação N:M), com papéis independentes em cada um (Owner, Admin, Member).
*   **FR-2.02:** A interface deve disponibilizar um **Seletor de Grupo Ativo** acessível na barra de navegação/cabeçalho, permitindo ao utilizador alternar instantaneamente o contexto de dados da aplicação entre os diferentes grupos a que pertence.
*   **FR-2.03:** Qualquer membro deve poder **Sair de um Grupo** (Leave Group) voluntariamente a qualquer momento, revogando o seu acesso ao grupo e libertando a respetiva vaga.
*   **FR-2.04:** Um utilizador pode criar grupos tornando-se o seu `Owner` (Administrador). É permitido a cada utilizador ser Administrador de no máximo **1 Grupo Gratuito (Free)**, podendo no entanto ser Administrador de múltiplos (*n*) **Grupos Premium**.
*   **FR-2.05:** A subscrição do Plano Premium deve estar **associada ao Grupo** (Tenant) e não ao utilizador individual. Apenas o Administrador/Owner do grupo possui permissão para realizar o upgrade do grupo para o plano Premium.
*   **FR-2.06:** O Administrador deve poder gerar um "Invite Link" ou "Código de Convite" único para partilhar com os membros da equipa.
*   **FR-2.07:** Um utilizador deve poder juntar-se a um grupo existente de forma imediata através do Invite Link ou código de convite.
*   **FR-2.08:** O Administrador deve poder promover membros a `Co-Admin` ou `Treasury Admin` (funcionalidade exclusiva do plano Premium).
*   **FR-2.09:** O Administrador deve poder expulsar membros do grupo.

### Módulo 3: Votações e Agenda Semanal (Polls & Schedule)
*   **FR-3.01:** O Administrador do grupo é o responsável pela configuração e parametrização da votação semanal:
    *   Seleciona quais os dias da semana abertos a votação;
    *   Define os *slots* horários disponíveis para os membros votarem;
    *   Define a lista de recintos desportivos aceitáveis para essa semana;
    *   Define a janela temporal de votação, controlando formalmente quando a votação **abre** e quando **fecha** (bloqueando novos votos).
*   **FR-3.02:** O sistema deve calcular automaticamente a semana-alvo da votação: se a consulta ocorrer a uma sexta-feira, sábado ou domingo, calcula a segunda-feira da próxima semana; de segunda a quinta-feira calcula a segunda-feira da semana em curso.
*   **FR-3.03:** O sistema deve desativar visualmente e bloquear a seleção dos dias da semana que já se encontrem no passado em relação à data atual (`isDayInPast`).
*   **FR-3.04:** Os membros do grupo devem poder submeter a sua disponibilidade horária marcando os horários em que podem jogar e selecionando os recintos desportivos aceitáveis a partir dos campos autorizados pelo Administrador.
*   **FR-3.05:** O sistema deve disponibilizar um botão explícito "Não posso jogar esta semana / Não poderei ir a nenhum jogo", permitindo limpar escolhas de horário e registar a indisponibilidade total na semana.
*   **FR-3.06:** O motor de sugestões deve processar os votos em tempo real, agrupando por dia e hora, e destacando:
    *   O dia e horário ideal com maior quórum de confirmações;
    *   O quórum adaptativo baseado no `TipoFutebol` do campo (mínimo de 6 jogadores para futebol indefinido/futsal, 14 para Futebol 7, 18 para Futebol 9 e 22 para Futebol 11);
    *   A marcação visual "IDEAL" com destaque verde para o campo mais viável e votado no melhor slot;
    *   O badge visual "FALTAM X" caso o número de jogadores não atinja o quórum mínimo necessário para o campo;
    *   A listagem nominal dos jogadores disponíveis para cada hora.
*   **FR-3.07:** Cada campo dentro do bloco de dia/hora deve possuir um acordeão expansível que, ao ser clicado, lista os nomes e mini-avatares dos jogadores específicos que votaram favoravelmente a esse campo nesse horário.
*   **FR-3.08:** O sistema deve disponibilizar um painel em 3 colunas para monitorização do Estado das Votações do grupo:
    *   "Disponíveis (N)": lista nominal com avatares dos jogadores com horários selecionados;
    *   "Não podem (N)": lista dos jogadores que marcaram indisponibilidade (foto a preto-e-branco e nome rasurado);
    *   "Faltam Votar (N)": lista nominal dos membros regulares do grupo (excluindo convidados) que ainda não submeteram voto.
*   **FR-3.09:** O sistema deve gerar automaticamente uma mensagem formatada com o resumo da semana e link direto `#/agenda` para partilha rápida no grupo de WhatsApp.
*   **FR-3.10:** O Administrador deve poder gerir o ciclo de vida do jogo através dos estados `Marcado`, `Cancelado` ou `Realizado`:
    *   🟡 **`Marcado`**: Confirmação oficial do dia, horário e campo selecionados para a partida.
    *   🔴 **`Cancelado`**: Anulação da convocatória (por intempérie, indisponibilidade de campo ou falta de quórum).
    *   🟢 **`Realizado`**: A marcação de um jogo como `Realizado` converte diretamente o evento no **registo formal do jogo** (integrado no Módulo 4). Este fluxo abre o formulário de registo pré-preenchendo a data, o recinto e a lista de jogadores confirmados, solicitando ao Administrador a inserção do resultado final (Res A vs Res B), escalações definitivas das equipas, modalidade disputada, custos do campo e taxas por presença. A gravação atualiza imediatamente e de forma atómica todas as estatísticas dos jogadores no Leaderboard (jogos, vitórias, empates, derrotas, pontos e OVR) e regista as respetivas entradas financeiras de taxas na Tesouraria.
*   **FR-3.11:** Quando um jogo é colocado no estado `Marcado`, cada utilizador deve ter disponível um botão **"Adicionar ao Calendário"** que gera e descarrega um ficheiro `.ics` ou integração direta (Google Calendar, Apple Calendar, Outlook) com o dia, horário de início/fim, nome do recinto e morada física.

### Módulo 4: Registo de Jogos e Histórico de Sessões (Games & Match History)
*   **FR-4.01:** O sistema deve permitir o registo de jogos em 3 modalidades reais e especializadas:
    1.  **Jogo Padrão (Standard):** 1 jogo único com resultado (Res A vs Res B), seleção interativa de jogadores entre Equipa A e Equipa B (toggle), seleção de campo, custo total do campo e taxa por jogador, com cálculo automático em tempo real do custo individual a pagar por presença: `(CustoCampo / TotalJogadores) + TaxaJogador`.
    2.  **Rei da Pista (King of the Court):** Sessão com 3 equipas (A, B, C) organizadas em múltiplos mini-jogos sequenciais; lógica de encadeamento automático onde a equipa vencedora assume a posição de "Rei" (Equipa A) no mini-jogo seguinte, a derrotada descansa e a terceira equipa (C) entra como desafiante; em caso de empate, mantém-se a equipa detentora do título.
    3.  **Rotação Dinâmica:** Sessão multi-ronda com definição de um pool de jogadores (mínimo 4), divisão inicial entre Equipa A, Equipa B e Banco de suplentes, permitindo adicionar rondas consecutivas e mover/trocar jogadores individualmente entre equipas e banco ronda a ronda.
*   **FR-4.02:** O formulário de registo de jogo deve aceitar pré-preenchimento automático via navegação (`prefilledTeams`) vinda do Gerador de Equipas para modo Standard (2 equipas) ou Rei da Pista (3 equipas).
*   **FR-4.03:** O formulário de registo de jogo deve permitir criar rapidamente um Jogador Convidado inline sem sair do ecrã, auto-atribuindo-o imediatamente à equipa com menos elementos.
*   **FR-4.04:** O sistema deve suportar gestão de vídeos e melhores momentos (Highlights): upload de ficheiro de vídeo para o Storage seguro (`videos/`) OU colagem de link externo de streaming (YouTube, Google Drive, etc.), associando data de retenção de 30 dias.
*   **FR-4.05:** O Histórico de Jogos deve apresentar a contagem decrescente dos dias de retenção do vídeo ("Vídeo disponível (X dias)") ou indicação de "Vídeo expirado (30 dias)", com botão de reprodução/download.
*   **FR-4.06:** O ecrã de Histórico deve incluir separadores "Votação / Agenda" e "Histórico de Jogos", com opções de filtragem avançada por Recinto/Campo, por Jogador participante e ordenação cronológica por Data (ascendente ou descendente).
*   **FR-4.07:** O Histórico deve agrupar sessões de Rei da Pista e Rotação Dinâmica sob o mesmo `SessionID`, disponibilizando acordeão expansível para visualização de cada mini-jogo ou ronda.
*   **FR-4.08:** O Administrador deve poder editar o resultado, equipas, data, recinto, custos e vídeo de qualquer jogo existente (`?edit=UUID`).
*   **FR-4.09:** O Administrador deve poder apagar registos de jogos, recalculando automaticamente e de forma consistente todas as estatísticas, vitórias, empates, derrotas, golos e pontos do Leaderboard.

### Módulo 5: Balneário, Ratings FIFA e Gerador de Equipas (Locker Room & Gamification)
*   **FR-5.01:** O sistema deve disponibilizar um módulo de Votação Mútua 360º no Balneário, onde cada jogador avalia os seus colegas nos 6 atributos fundamentais: Ataque, Defesa, Físico, Passe, Guarda-Redes e Fairplay (numa escala de 1 a 99).
*   **FR-5.02:** O sistema deve permitir ordenar a tabela de votação do balneário por qualquer coluna: Nome, OVR, ATQ, DEF, FIS, PAS, GR, FP ou pelo Estado (Votado / Pendente).
*   **FR-5.03:** O sistema deve disponibilizar o modo de "Votação Rápida em Série" (Batch Voting): enfileira automaticamente todos os jogadores pendentes para avaliação contínua em sucessão, com indicador de progresso ("X de Y pendentes") e botão de "Saltar".
*   **FR-5.04:** O sistema deve calcular automaticamente o OVR de cada jogador com base na média dos votos recebidos da comunidade.
*   **FR-5.05:** O Leaderboard deve exibir no topo o destaque do "Último Jogo" disputado (data, resultado e escalações completas) e o Pódio dos "Top 3 Jogadores" renderizado com Cartões FUT FIFA de alta fidelidade visual (insígnias de 1º, 2º e 3º lugar, OVR, foto e atributos).
*   **FR-5.06:** A tabela de Classificação Geral deve implementar os critérios de desempate oficiais: 1º Pontos Totais (V=3, E=1), 2º Maior número de Vitórias, 3º Menor número de Jogos Jogados (maior aproveitamento), 4º OVR. Deve apresentar Nome, Avatar, Pts, V, E, D, Jogos, OVR e distintivo "Convidado" para contas provisórias.
*   **FR-5.07:** O Gerador de Equipas (Team Generator) deve permitir selecionar jogadores livremente (com opções "Selecionar Todos" e "Limpar Seleção"), alternar entre 2 Equipas ou 3 Equipas (Rei da Pista) e executar um algoritmo de equilíbrio combinatório de 500 iterações:
    *   Identifica os melhores Guarda-Redes (pelo atributo específico `Guarda_Redes`) e distribui equitativamente 1 por cada equipa;
    *   Baralha e distribui os restantes jogadores minimizando a variância e diferença de OVR médio entre equipas;
    *   Apresenta os cartões comparativos das equipas geradas com a média global de OVR e lista de jogadores;
    *   Permite a exportação direta da formação gerada para o Registo de Jogo ("Transferir para Registo de Jogo") ou cópia para WhatsApp/área de transferência.

### Módulo 6: Campos e Localizações (Locations)
*   **FR-6.01:** O sistema deve possuir uma base de dados centralizada de campos e recintos desportivos de futebol, com barra de pesquisa e filtragem em tempo real.
*   **FR-6.02:** Os utilizadores devem poder visualizar a ficha técnica e detalhes completos de cada campo:
    *   **Identificação e Localização:** Nome oficial do recinto, morada física formatada e botão de navegação / direções diretas no Google Maps.
    *   **Horário de Funcionamento:** Horário de abertura e fecho para cada dia da semana, bem como a sinalização explícita de dias de encerramento total (ex: domingos ou feriados).
    *   **Tabela de Preços e Alugueres:** Preço base por hora do campo (€/h), custo de aluguer de bola (valor em € ou "Grátis") e custo de aluguer de coletes (valor em € ou "Grátis").
    *   **Características Técnicas do Terreno:** Tipo de piso com tags coloridas (Relvado Sintético, Piso Rápido / Taco, Cimento, Relva Natural) e Modalidade de futebol suportada (Futebol 5, Futebol 7, Futebol 9, Futebol 11).
    *   **Infraestruturas e Comodidades:** Cobertura do recinto (Coberto / Indoor vs. Descoberto / Outdoor) e presença de Balneários funcionais (com sinalização de check ativo ou rasurado).
    *   **Multimédia e Visualização:** Galeria de fotografias reais do campo em grelha horizontal com clique para ampliação e navegação via ImageLightbox.
    *   **Contactos Diretos e Notas:** Secção expansível "Contactos e Notas" com telefone direto clicável (`tel:...`), endereço de email direto clicável (`mailto:...`) e notas adicionais / referências de acesso.
*   **FR-6.03:** **Restrição de Horário em Votações:** O sistema deve validar os horários de funcionamento do campo e impossibilitar a criação de votações ou seleção de slots horários para esse campo nas horas ou dias em que o recinto se encontra encerrado.
*   **FR-6.04:** O sistema deve disponibilizar um modal de registo e edição de campos (AddLocationModal) integrando um mapa interativo Leaflet / OpenStreetMap (MapPicker) para localização por pesquisa de morada ou clique no mapa para colocação de pin com coordenadas geográficas.
*   **FR-6.05:** Qualquer utilizador autenticado deve poder registar novos recintos ou editar dados existentes (Crowdsourcing), incluindo upload de fotografias reais para o Storage seguro.
*   **FR-6.06:** O Administrador do grupo deve poder selecionar quais os campos da base global que ficam marcados como "Campos Aceitáveis" para a agenda e votação semanal da sua equipa.

### Módulo 7: Tesouraria e Caixa do Grupo (Treasury) - [Exclusivo Plano Premium]
*   **FR-7.01 (Premium):** O Módulo de Tesouraria deve ser uma funcionalidade **100% exclusiva** para grupos subscritores do plano Premium (TikiTasco Pro).
*   **FR-7.02 (Premium):** O módulo destina-se exclusivamente à gestão do **fundo de maneio / caixa comum ("Caixinha") e despesas associadas do grupo**, não devendo ser utilizado para o processamento de pagamentos diretos de presenças em jogos (cujo valor individual é calculado e cobrado por jogo no Módulo de Jogos).
*   **FR-7.03 (Premium):** O painel principal de Tesouraria deve apresentar 3 indicadores de resumo financeiro em tempo real:
    *   **Saldo Disponível:** saldo líquido atual (`currentBalance = totalIncome - totalExpenses`), com destaque visual dinâmico (verde se positivo, vermelho se negativo);
    *   **Total Arrecadado:** soma acumulada das receitas geradas pelas taxas fixas cobradas por jogo aos participantes (ex: 0.50€ ou 1.00€ por presença);
    *   **Total de Despesas:** soma acumulada das despesas suportadas pela caixa do grupo.
*   **FR-7.04 (Premium):** O Administrador deve poder registar despesas e compras coletivas do grupo (ex: aquisição de novas bolas, conjuntos de coletes, material de primeiros socorros/farmácia, garrafões de água ou convívios/lanches).
*   **FR-7.05 (Premium):** O sistema deve permitir anexar o comprovativo fotográfico (fatura ou talão de compra) a cada despesa registada, com upload seguro para o Supabase Storage (`receipts/`) e visualização ampliada via ImageLightbox.
*   **FR-7.06 (Premium):** O sistema deve suportar **despesas mistas**: registo do valor total da despesa, definição do montante suportado pela Caixinha (`ValorCaixa`) e discriminação de contribuições diretas suplementares pagas diretamente por jogadores específicos (`ContribuicoesDiretas`).
*   **FR-7.07 (Premium):** O sistema deve disponibilizar uma Tabela de Ranking de Contribuição por Jogador, calculando a soma do valor total contribuído por cada membro (taxas de jogos realizados + contribuições diretas em despesas), ordenado por ordem decrescente de contribuição com numeração ordinal (#1, #2, ...).
*   **FR-7.08 (Premium):** O Administrador deve poder editar e auditar qualquer despesa registada no histórico.
*   **FR-7.09 (Premium):** O Administrador deve poder exportar o balanço financeiro e histórico de tesouraria em formato CSV/Excel ou PDF.

### Módulo 8: Portal de Gestão de Campos (Marketplace B2B) - Backlog
*   **FR-8.01:** Os Donos dos Campos (B2B) devem ter um portal web próprio para gerir e bloquear *slots* horários dos seus campos em tempo real.
*   **FR-8.02:** O utilizador administrador (B2C) deve poder reservar e pagar um slot diretamente pela app.
*   **FR-8.03:** O sistema deve executar um split de pagamento via Stripe Connect (enviando X% da comissão para o TikiTasco e o restante para o recinto).
*   **FR-8.04:** O sistema deve ter salvaguardas (Timeouts) para o pagamento, evitando duplo *booking* no mesmo slot durante a janela de pagamento.

### Módulo 9: Gestão de Planos e Regras de Negócio (Freemium vs Premium)
*   **FR-9.01 (Plano Free):**
    *   Um grupo no Plano Free permite um limite máximo de **15 pessoas** (jogadores ativos).
    *   As **únicas funcionalidades disponíveis** no Plano Free são a **Agenda (Votações)** e a **Consulta de Campos**.
    *   O Histórico de Jogos no Plano Free é limitado a um teto de **15 jogos** ou **3 meses** (o critério que for atingido primeiro).
    *   A interface do Plano Free apresenta **anúncios não-intrusivos** e estritamente relacionados com desporto (banners de parceiros locais ou redes de anúncios desportivas).
    *   Cada utilizador só pode ser Administrador/Owner de **1 Grupo Free** (podendo pertencer como jogador a múltiplos grupos).
*   **FR-9.02 (Plano Premium):**
    *   A subscrição Premium é associada ao **Grupo** e não ao utilizador individual.
    *   Apenas o Administrador/Owner do grupo possui permissão para subscrever ou gerir o upgrade do grupo para Premium via Stripe.
    *   Um utilizador pode ser Administrador de múltiplos (*n*) **Grupos Premium**.
    *   O Plano Premium desbloqueia para todos os membros do grupo:
        *   Membros ilimitados no grupo;
        *   Módulo de Balneário e Avaliação Mútua 360º de atributos FIFA;
        *   Leaderboard completo com pódio FUT FIFA e estatísticas vitalícias;
        *   Gerador de Equipas inteligente (2 e 3 equipas com balanceamento de guarda-redes);
        *   Registo de jogos nas 3 modalidades e Histórico vitalício ilimitado (sem limite de 15 jogos / 3 meses);
        *   Módulo completo de Tesouraria / Caixinha (taxas, despesas, faturas, exportação);
        *   Upload direto de vídeos e melhores momentos para o Supabase Storage;
        *   Remoção total de anúncios (experiência 100% Ad-Free);
        *   Nomeação de múltiplos Co-Admins ou Tesoureiros.

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
