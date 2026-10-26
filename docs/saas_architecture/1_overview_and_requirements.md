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
    > **Status:** [COMPLETED] - A migração do backend e base de dados do Google Sheets para o Supabase está 100% concluída, operando já em produção com PostgreSQL, Supabase Auth e Supabase Storage.
*   **Hosting Web:** Vercel (ideal para pipelines de CI/CD automatizadas com diferentes ambientes). *(Atualmente: GitHub Pages)*
*   **Empacotamento Mobile:** CapacitorJS (futuro).

### 2.2 Arquitetura de Dados (Modelo Multi-Tenancy)
Para assegurar o isolamento dos dados de cada equipa:

1.  **`users`**: Registo global da plataforma.
    *   `id` (UUID), `email`, `nome`, `avatar_url`.
2.  **`groups`**: O espaço privado de cada equipa ("tenant").
    *   `id` (UUID), `name`, `invite_code`, `created_at`, `plan_tier` ('free' | 'premium').
    *   *Regra de Propriedade:* A subscrição Premium é associada ao **Grupo** e não ao utilizador individual. Apenas o Administrador do grupo pode efetuar o upgrade. Um utilizador pode ser Administrador de no máximo **1 Grupo Free**, mas de múltiplos (*n*) **Grupos Premium**.
3.  **`group_members`**: Tabela de associação (N:M).
    *   `user_id`, `group_id`, `role` (`owner`, `admin`, `member`).
    *   *Hierarquia de Papéis e Permissões:*
        *   **`Owner` (Dono do Grupo):** Criador do grupo com autoridade total, incluindo gestão de subscrição/planos, nomeação ou revogação de Administradores (`Co-Admins`) e `Treasury Admins`, e parametrização geral do grupo.
        *   **`Admin` (Administrador):** Nomeado pelo Dono do grupo. Partilha as permissões de gestão desportiva: edição de datas e slots horários abertos para votação, curadoria e seleção dos campos disponíveis para o grupo a partir da lista global (`global_locations`), e gestão/registo de jogos.
        *   **`Member` (Membro Regular):** Jogador do grupo. Vota na agenda semanal dentro do leque restrito de opções configuradas pela administração, avalia colegas no balneário e consulta estatísticas.
    *   *Múltiplos Grupos:* Cada utilizador pode pertencer a múltiplos grupos simultaneamente. A interface disponibiliza um **Seletor de Grupo Ativo** para alternar de contexto, bem como a opção de **Sair do Grupo** (Leave Group) a qualquer momento.
4.  **Gestão de Campos (Locations - Global vs Local)**:
    *   **`global_locations`**: Base de dados partilhada de recintos desportivos a nível global (id, nome, morada, preço, horários de abertura/fecho por dia da semana e dias de encerramento). 
    *   **`group_locations`**: Tabela de associação (`group_id`, `location_id`) que define quais campos globais estão ativados para um grupo específico. **Apenas o Dono (`Owner`) e os Administradores nomeados por este têm autorização para selecionar os campos disponíveis para o grupo a partir da lista global de campos.**
    *   *Crowdsourcing:* Qualquer utilizador pode visualizar campos globais e sugerir novos campos ou **reportar erros** (ex: preço desatualizado). Administradores da plataforma validam estas alterações. (Estratégia: Manter esta feature grátis para acelerar o crescimento inicial da base de dados de campos de futebol a nível nacional).
5.  **Recursos Específicos (Tenant-scoped)**:
    *   Tabelas como `polls`, `games` e `treasury` terão obrigatoriamente uma coluna `group_id` (Foreign Key). 
    *   Implementação de Row Level Security (RLS) no Supabase para garantir que um utilizador apenas consegue ler/escrever dados onde o `group_id` coincide com um grupo ao qual pertence.

---

## 3. Funcionalidades e Casos de Uso (v0.1 e Futuro)

Para garantir uma visão unificada, listam-se abaixo todas as funcionalidades (incluindo as já existentes no MVP v0.1 e as planeadas para a arquitetura SaaS):

### 3.1 Gestão de Utilizadores, Grupos e Convidados
*   **Autenticação e Onboarding:** Login nativo com Google OAuth (Supabase Auth), com suporte arquitetural planeado para Email/Password (Magic Links) e Apple Sign-In. Implementa fluxo de Onboarding Obrigatório (`needsSetup`), exigindo a configuração de Nome e Fotografia na primeira sessão antes de libertar o acesso.
*   **Edição de Perfil e Otimização de Fotografia:** O utilizador pode atualizar Nome e Avatar a qualquer momento. O upload de fotografia executa recorte centrado e compressão no cliente via HTML5 Canvas (150x150 px JPEG em base64), eliminando overhead de servidor e acelerando a renderização.
*   **Cartão FIFA, Gráfico Radar e Modal do Jogador:** Visualização de Cartão de Jogador com nota OVR geral (média ponderada dos 6 atributos: Ataque, Defesa, Físico, Passe, Guarda-Redes e Fairplay na escala 1-99), gráfico radar poligonal SVG (0 a 100) e estatísticas acumuladas (Jogos, Vitórias, Empates, Derrotas, % de Sucesso). Ao clicar num jogador em qualquer ponto da aplicação, abre o `PlayerModal` com estatísticas detalhadas e histórico completo de jogos.
*   **Jogadores Convidados (Guest Players):** Criação rápida de convidados (`is_guest: true`) com email `guest_<uuid>@convidado.tikitasco` diretamente a partir do registo de jogos ou do gerador de equipas, com suporte a edição de nome por administradores.
*   **Reivindicação de Perfil Fantasma (Claim Ghost Player):** Ao criar conta Google real, o utilizador pode associar-se ao seu perfil anterior de convidado, fundindo todo o histórico de presenças em jogos (tabela `games`), votos recebidos (tabela `votes`), limpando conflitos e apagando o perfil temporário.
*   **Eliminação de Conta (RGPD):** Desassociação das credenciais Google, transformando o registo em jogador convidado e salvaguardando a coerência das estatísticas dos restantes jogadores.
*   **Instalação PWA:** Modal com instruções detalhadas para adicionar ao ecrã inicial em dispositivos iOS (Safari) e Android.
*   **Multi-Tenancy e Gestão de Múltiplos Grupos:**
    *   Um utilizador pode pertencer a múltiplos grupos simultaneamente;
    *   **Seletor de Grupo Ativo:** Menu suspenso no cabeçalho para alternar instantaneamente entre equipas;
    *   **Sair de Grupo:** Opção para o membro abandonar voluntariamente qualquer grupo a que pertença;
    *   Criação de grupos privados com Invite Code e Invite Link direto para partilha no WhatsApp.

### 3.2 Votações e Agenda Semanal (Organizar Próximo Jogo)
*   **Controlo e Edição Exclusivos pelo Dono e Administradores:**
    *   **Edição de Datas e Dias Abertos:** O Dono do grupo (`Owner`) e os Administradores nomeados por este definem e editam quais as datas específicas ou dias da semana abertos a votação (ex: de Segunda a Quinta, fins de semana, ou datas pontuais);
    *   **Edição de Slots Horários:** O Dono e Administradores definem e editam os *slots* horários disponíveis para escolha dos membros (ex: 18h, 19h, 20h, 21h, 22h, ou outros horários flexíveis);
    *   **Curadoria de Campos Disponíveis para Votação:** O Dono e Administradores selecionam, a partir da lista global de recintos existentes (`global_locations`), quais os campos que ficam elegíveis para os membros votarem no grupo (`group_locations`);
    *   **Janela Temporal de Votação:** O Dono e Administradores controlam a data/hora de **abertura** e de **fecho** oficial da votação (bloqueando a submissão ou alteração de votos após o encerramento).
*   **Restrição de Membros Regulares:** Os membros comuns (`Members`) têm acesso restrito à votação, podendo apenas assinalar disponibilidade dentro do leque de datas, horas e campos pré-selecionados e autorizados pela administração.
*   **Agenda Semanal Multi-Slot:** Votação para os dias e horários configurados com seleção de múltiplos horários e escolha explícita de recintos aceitáveis.
*   **Cálculo Automático da Semana-Alvo:** Se a consulta for feita à sexta-feira, sábado ou domingo, a aplicação calcula automaticamente a segunda-feira da próxima semana; de segunda a quinta-feira fixa-se na semana atual.
*   **Bloqueio de Dias Passados:** Desativação visual e bloqueio de cliques nos dias da semana que já tenham passado (`isDayInPast`).
*   **Opção "Não Poderei Ir":** Botão explícito para limpar marcações e sinalizar indisponibilidade total na semana.
*   **Motor de Sugestões e Quórum Dinâmico:** Algoritmo que calcula o dia e hora ideais, adapta o quórum mínimo necessário à modalidade de cada campo (6 jogadores para futebol indefinido, 14 para 7v7, 18 para 9v9 e 22 para 11v11), destaca o campo mais votado ("IDEAL"), sinaliza quando faltam jogadores ("FALTAM X") e apresenta acordeão clicável com avatares e nomes individuais dos votantes em cada campo.
*   **Painel de Auditoria de Votações em 3 Colunas:** Monitorização em tempo real dividida entre:
    *   *Disponíveis:* lista com avatares dos jogadores que marcaram presença;
    *   *Não podem:* lista dos jogadores indisponíveis (foto a preto-e-branco e nome rasurado);
    *   *Faltam Votar:* lista nominal dos membros do grupo (excluindo convidados) que ainda não responderam à convocatória.
*   **Voto com Convidados por Dia/Slot (+1 / +2 Amigos):**
    *   O utilizador pode assinalar disponibilidade indicando que traz amigos adicionais para um dia ou horário específico (ex: `+1 amigo`, `+2 amigos`), fazendo o seu voto valer por múltiplas presenças nesse slot concreto;
    *   **Isolamento de Slots:** A seleção de amigos é estritamente vinculada ao dia/slot específico e não se propaga para os restantes horários da semana marcados pelo jogador;
    *   **Contabilização no Quórum:** O motor de sugestões calcula a presença real ponderada (`Total = 1 + N convidados`), atualizando de imediato os alertas "FALTAM X" ou "QUÓRUM ATINGIDO";
    *   **Destaque Visual:** O avatar do votante no painel de disponíveis apresenta um badge numérico identificativo (ex: `João Silva (+1)`);
    *   **Conversão Automática em Folha de Jogo:** Ao converter a votação em jogo oficial, as vagas extras são pré-preenchidas como jogadores convidados temporários (`Convidado 1 (João Silva)`), permitindo renomear mais tarde e garantindo que o rateio de custos e taxas por presença seja rigorosamente exato.
*   **Partilha Rápida no WhatsApp:** Geração automática e partilha de mensagem com o intervalo de datas da semana e link direto `#/agenda`.
*   **Ciclo de Estados do Jogo e Calendário:** O Administrador converte a votação num `Game` com transição entre estados:
    *   🟡 `Marcado`: Confirmação formal do dia, hora e local da partida. Ativa para todos os utilizadores o botão **"Adicionar ao Calendário"** (geração de ficheiro `.ics` ou integração direta com Google Calendar, Apple Calendar e Outlook com dia, hora e morada do campo).
    *   🔴 `Cancelado`: Em caso de intempéries, indisponibilidade de recinto ou falta de quórum.
    *   🟢 `Realizado`: A colocação do jogo no estado `Realizado` converte diretamente o evento no **registo oficial do jogo** (Módulo de Registo de Jogos). Este fluxo abre o formulário com a data, recinto e convocados pré-preenchidos, solicitando ao Administrador o resultado final (Res A vs Res B), equipas definitivas, modalidade disputada e custos/taxas por presença, atualizando de imediato todas as vitórias, empates, derrotas, pontos e OVR no Leaderboard, bem como as taxas arrecadadas na Tesouraria (exclusivo Premium).

### 3.3 Balneário, Ratings FIFA e Gerador de Equipas (Exclusivo Premium)
*   **Avaliação 360º de Atributos:** Votação mútua entre jogadores nos 6 atributos essenciais (Ataque, Defesa, Físico, Passe, Guarda-Redes e Fairplay, de 1 a 99), gerando o OVR ponderado automático de cada jogador.
*   **Ordenação Flexível e Votação Rápida em Série:** Tabela de balneário ordenável por qualquer atributo ou por Estado (Votado / Pendente). Modo de "Votação Rápida em Série" (Batch Voting) que enfileira todos os jogadores pendentes para avaliação sequencial com indicador de progresso e opção de saltar.
*   **Leaderboard Completo e Destaque:** 
    *   Card de destaque com o "Último Jogo" disputado (resultado, data e escalações);
    *   Pódio dos "Top 3 Jogadores" com Cartões FUT FIFA destacados (1º, 2º e 3º lugar);
    *   Tabela geral com ordenação oficial por Pontos (V=3, E=1), Vitórias, Menor número de jogos e OVR, com indicação visual para Convidados e abertura de PlayerModal ao clicar.
*   **Team Generator Inteligente:** 
    *   Seleção de jogadores com atalhos "Selecionar Todos" e "Limpar";
    *   Suporte para 2 Equipas (Standard) e 3 Equipas (Rei da Pista);
    *   Algoritmo combinatório de 500 iterações que isola os melhores Guarda-Redes (atributo `Guarda_Redes`) para garantir 1 por equipa e minimiza a diferença média de OVR entre equipas;
    *   Exportação direta para o Registo de Jogo ("Transferir para Registo de Jogo") ou cópia para área de transferência / WhatsApp.

### 3.4 Registo de Jogos e Histórico de Sessões
*   **Três Modalidades Suportadas:**
    1.  **Jogo Padrão (Standard):** 1 jogo único com resultado, equipas A e B (toggle rápido), seleção de recinto, custo do campo e taxa por jogador, com cálculo em tempo real do custo por presença: `(CustoCampo / TotalJogadores) + TaxaJogador`.
    2.  **Rei da Pista:** 3 equipas (A, B, C) com múltiplos mini-jogos sequenciais em rondas, onde o vencedor assume a posição de Rei no jogo seguinte, o derrotado descansa e a terceira equipa entra como desafiante (em caso de empate, o Rei mantém-se).
    3.  **Rotação Dinâmica:** Sessões multi-ronda com pool de jogadores (mínimo 4), divisão entre Equipa A, Equipa B e Banco de suplentes, com movimentação interativa de jogadores entre equipas e banco ronda a ronda.
*   **Integração com Team Generator e Convidados Rápidos:** Pré-preenchimento automático ao vir do Team Generator e criação rápida de convidados inline auto-atribuídos à equipa com menos elementos.
*   **Gestão de Vídeos e Highlights (30 Dias):** Upload direto para o Storage seguro (`videos/`) [exclusivo Premium] ou inserção de link externo de streaming (YouTube, Drive, etc.), com contagem decrescente de retenção no Histórico e alerta de expiração.
*   **Histórico Interativo:** Linha temporal com separadores de "Votação / Agenda" e "Histórico de Jogos", filtros por campo e jogador, ordenação por data, agrupamento por `SessionID` para Rei da Pista e Rotação Dinâmica com acordeão expansível, e suporte a edição (`?edit=UUID`) ou eliminação com recálculo consistente de todo o Leaderboard. (Limitado a 15 jogos ou 3 meses no Plano Free; vitalício no Plano Premium).

### 3.5 Ficha Técnica e Gestão de Campos (Locations)
*   **Base de Dados Centralizada:** Repositório de recintos desportivos com barra de pesquisa e filtros em tempo real.
*   **Ficha Técnica Detalhada:** 
    *   Nome oficial, morada física, direções e navegação no Google Maps;
    *   **Horário de Funcionamento:** Registo dos horários de abertura e fecho por dia da semana e dias de encerramento total (ex: domingos ou feriados);
    *   **Validação de Horários de Votação:** O sistema impede a criação de votações para horários ou dias em que o campo se encontre encerrado;
    *   Tabela de preços (preço base/hora, aluguer de bola e coletes com indicação de valor ou grátis);
    *   Tipo de piso com tags coloridas (Sintético, Taco, Cimento, Relva Natural), modalidade (5, 7, 9, 11), cobertura (Indoor/Outdoor), balneários (disponíveis ou não);
    *   Galeria de fotos reais com ImageLightbox;
    *   Secção expansível "Contactos e Notas" com telefone direto (`tel:`), email direto (`mailto:`) e notas de acesso.
*   **Modal de Registo/Edição com Mapa Interativo (Leaflet):** Integração do MapPicker para seleção de localização via pesquisa de morada ou colocação de pin direto no mapa com coordenadas GPS.
*   **Crowdsourcing:** Registo e edição de novos campos com upload de fotos diretamente para o Storage.
*   **Curadoria e Ativação por Grupo (`group_locations`):** O Dono (`Owner`) e Administradores nomeados selecionam, a partir da lista global de campos (`global_locations`), quais os recintos que ficam disponíveis para a votação semanal da sua equipa.

### 3.6 Tesouraria e Caixa do Grupo (100% Exclusivo Premium)
*   **Gestão Exclusiva de Caixa Comum:** Controlo do fundo de maneio / saldo coletivo acumulado ("Caixinha") alimentado pelas taxas fixas recolhidas por jogo a cada participante. Não se destina ao pagamento de jogos em si, mas sim ao saldo coletivo do grupo.
*   **Dashboard Financeiro em Tempo Real:** 3 indicadores principais: Saldo Disponível (com destaque verde/vermelho), Total Arrecadado (taxas de jogos) e Total de Despesas.
*   **Despesas Coletivas do Grupo:** Registo de despesas associadas (compra de bolas, coletes, água, farmácia/primeiros socorros, lanches) com anexação de faturas/recibos fotográficos via upload seguro (`receipts/`) e visualização via ImageLightbox.
*   **Despesas Mistas e Contribuições Diretas:** Suporte a despesas financiadas pela Caixinha (`ValorCaixa`) e/ou contribuições diretas voluntárias repartidas por jogadores específicos.
*   **Ranking de Contribuições por Jogador:** Listagem ordenada por ordem decrescente do valor total contribuído por cada membro (taxas de presença em jogos + contribuições diretas em compras coletivas).
*   **Auditoria, Edição e Exportação:** Edição de despesas existentes e exportação do balanço financeiro em PDF/Excel.

### 3.7 Desafios e Jogos Inter-Grupos (Amigáveis & Confrontos Diretos)
*   **Desafio Direto entre Equipas:** O capitão ou Administrador do Grupo A pode emitir um "Desafio Amigável" a outro grupo (via pesquisa de nome ou partilha de link/código de convite de desafio no WhatsApp). O Grupo B aceita o convite na sua interface.
*   **Mural / Lobby de Desafios ("Procura-se Adversário"):** Mural regional onde equipas podem assinalar disponibilidade para amigáveis indicando zona geográfica (distrito/concelho), modalidade pretendida (5v5, 7v7), dias e horários preferenciais e nível desportivo.
*   **Folha de Jogo Partilhada (Confronto Real):** O jogo é registado como uma partida oficial entre dois grupos distintos (jogadores convocados do Grupo A vs jogadores do Grupo B), em vez do sorteio interno.
*   **Validação Bilateral de Resultados:** O resultado final (golos, marcadores) inserido por um administrador requer confirmação rápida do administrador adversário.
*   **Histórico e Estatísticas *Head-to-Head*:** Registo vitalício do histórico de confrontos diretos entre os dois grupos rivais (ex: jogos disputados, vitórias de cada equipa, golos marcados e saldo histórico).
*   **Divisão Automática de Custos:** O custo de aluguer do recinto é repartido automaticamente 50/50 entre a Caixinha/Tesouraria do Grupo A e do Grupo B.
*   **Growth Loop Viral:** Mecanismo primordial de aquisição orgânica: para o Grupo B aceitar o desafio e participar na votação do Homem do Jogo (MVP), o grupo cria a sua conta no TikiTasco, trazendo 10 a 14 novos utilizadores ativos para a plataforma a custo zero.

### 3.8 Ligas Regionais, Torneios Oficiais e Competições Sazonais (Roadmap Super-Admin)
*   **Criação de Competições pelos Super-Admins:** Os fundadores e administradores globais da plataforma podem criar Ligas e Torneios estruturados por:
    *   *Zonas Geográficas:* Filtragem por distrito, concelho ou cidade (ex: Lisboa, Porto, Coimbra, etc.);
    *   *Temporadas (Seasons):* Competições sazonais com calendário formal (ex: Temporada de Inverno, Taça de Primavera, Torneio Relâmpago de Fim de Semana).
*   **Tabelas Classificativas Automáticas:** Atualização instantânea com Pontos (3 por vitória, 1 por empate), Jogos, Vitórias, Empates, Derrotas, Golos Marcados, Sofridos e Diferença de Golos (*Goal Average*).
*   **Fases de Eliminatórias (Playoffs):** Suporte arquitetural para fases de grupos seguidas de eliminatórias (Quartos, Meias-Finais e Final da Taça).
*   **Gamificação Oficial da Liga:** 
    *   *Bota de Ouro da Liga:* Tabela geral dos melhores marcadores de todas as equipas inscritas;
    *   *Luva de Ouro:* Guarda-redes com melhor rácio de defesas / jogos sem sofrer golos;
    *   *Troféu Fairplay:* Reconhecimento da equipa com melhor índice disciplinar.
*   **Gestão de Taxas de Inscrição e Prémios:**
    *   Inscrição da equipa na Liga através do saldo da Tesouraria do grupo via Stripe;
    *   Atribuição de taças oficiais TikiTasco, medalhas e vouchers de parceiros patrocinadores aos vencedores.

### 3.9 Comunicação Interna e "Mural do Balneário" (Chat Contextual)
*   **Posicionamento Focado (Sem concorrência com o WhatsApp):** O chat da aplicação não se destina a conversa genérica do dia-a-dia, mas sim à comunicação estritamente **contextual do jogo e do balneário**.
*   **Mural do Próximo Jogo (Agenda / Convocatória):** Feed rápido associado à votação da semana para alinhamento logístico em tempo real:
    *   Gestão de material desportivo (*"Quem leva as bolas e os coletes?"*);
    *   Avisos de atrasos de trânsito ou imprevistos de última hora;
    *   Apelos de quórum (*"Falta 1 para os 10, convidem alguém!"*).
*   **Picardia e Reações Pós-Jogo (Ficha de Jogo & Ratings):** Espaço de comentários pós-partida onde os membros discutem o resultado, comentam lances marcantes e debatem os atributos e nota OVR do Homem do Jogo (MVP).
*   **Avisos Fixados pelo Administrador (*Pinned Announcements*):** O Dono ou Administrador pode fixar no topo do mural uma mensagem de alta prioridade (ex: alteração de pavilhão, instruções de acesso ou lembrete de pagamento via MBWay) com destaque visual permanente.
*   **Reações Rápidas com Emojis Temáticos:** Micro-interações instantâneas com 1 clique (⚽, 🍺, 🔥, 😂, 🧤) para manter a comunidade ativa sem fricção de digitação.
*   **Infraestrutura Supabase Realtime:** Suporte nativo a WebSockets via Supabase Realtime com sincronização instantânea de mensagens entre dispositivos e custo zero de infraestrutura adicional.

---

## 4. Planos, Subscrições e Modelo de Monetização

A aplicação opera através de um ecossistema equilibrado que combina subscrições recorrentes de grupo, pacotes multi-equipa com desconto, passes de customização individual e monetização de competições desportivas:

### ⚽ Plano Amador (100% Grátis)
Desenhado para grupos informais que necessitam apenas da organização essencial das convocatórias e marcação de campos:
*   **Funcionalidades Incluídas:** As **únicas funcionalidades disponíveis** no Plano Free são a **Agenda Semanal (Votações)** e a **Consulta de Campos**.
*   **Limite de Membros:** Máximo de **15 pessoas** ativas por grupo.
*   **Histórico de Jogos:** Limitado a um teto máximo de **15 jogos** ou **3 meses** de histórico (o que for atingido primeiro).
*   **Publicidade:** Exibição de anúncios **não-intrusivos** e estritamente contextuais relacionados com **Desporto** (banners estáticos de parceiros desportivos locais, marcas ou material desportivo).
*   **Regra de Administrador:** Cada utilizador só pode ser Administrador/Owner de **1 Grupo Free** (podendo pertencer como jogador comum a outros grupos).

### 🏆 Subscrições de Grupo (TikiTasco Pro & Packs Multi-Grupo)
Subscrições contratadas pelo Administrador do Grupo via Stripe Web, desbloqueando a experiência integral para todos os membros da equipa:
*   **Benefícios Coletivos Desbloqueados:**
    *   **Sem Anúncios:** Experiência 100% limpa e focada (Ad-Free) para todos os elementos do grupo;
    *   **Membros Ilimitados:** Sem restrição de 15 pessoas (perfeito para grupos alargados e rotativos);
    *   **Balneário, Gamification e Leaderboard:** Avaliação 360º de atributos FIFA, pódio FUT FIFA, histórico estatístico e radar de cada jogador;
    *   **Team Generator Inteligente:** Balanceamento automático de 2 e 3 equipas com distribuição de guarda-redes e transferência direta para a folha de jogo;
    *   **Histórico Vitalício e Registo Multi-Modalidade:** Registo nas 3 modalidades (Standard, Rei da Pista e Rotação Dinâmica) sem limites de jogos ou datas;
    *   **Módulo de Tesouraria Completo:** Gestão da Caixinha do grupo, taxas por presença, despesas coletivas com anexação fotográfica de faturas e exportação contabilística (PDF/Excel);
    *   **Multimédia Avançada:** Upload direto de ficheiros de vídeo e highlights para o Storage seguro com janela de retenção;
    *   **Permissões Avançadas:** Nomeação de múltiplos Co-Admins e Tesoureiros no grupo.
*   **Opções de Subscrição:**
    *   **Plano Solo (1 Grupo):** **2.99€ / mês** ou **24.99€ / ano** (2 meses grátis).
    *   **Pack Capitão (3 Grupos):** **6.49€ / mês** ou **59.99€ / ano** (~2.16€ por grupo/mês). Ideal para utilizadores que gerem várias equipas (ex: amigos, trabalho, universidade).
    *   **Pack Clube / Liga (5 Grupos):** **9.99€ / mês** ou **89.99€ / ano** (~2.00€ por grupo/mês). Desenhado para empresas, pequenas associações ou academias desportivas.
    *   *Gestão por Slots Premium:* O utilizador gere uma quota de vagas Premium no seu perfil, podendo atribuir, desvincular ou transferir vagas livremente entre os grupos que administra.

### 🌟 Player Pass / VIP (Individual B2C - Compra Única Vitalícia)
Opção autónoma de baixo atrito voltada para o jogador individual vaidoso que pretende personalização estética (ex: **3.99€ ou 4.99€** compra única vitalícia):
*   **Ad-Free Pessoal:** Isenção total de anúncios na conta pessoal, independentemente de os grupos onde joga serem Free ou Pro;
*   **Cartões FIFA Exclusivos:** Desbloqueio de temas visuais raros para o Cartão de Jogador (Ouro Raro, In-Form/TOTW preto, Edição Retro 90s);
*   **Estatísticas Avançadas Pessoais:** Gráficos interativos de evolução temporal de OVR e atributos, histórico comparativo com adversários e distintivos de mérito (*Badges*) visíveis no perfil.

### 🏅 Ligas e Torneios Oficiais (Monetização de Eventos)
*   **Taxas de Inscrição por Competição (*Entry Fees*):** Pagamento por equipa (ex: **60€ a 120€**) para inscrição em ligas sazonais de 2 a 3 meses ou torneios relâmpago, pago diretamente via Caixinha do grupo;
*   **Patrocínios e Naming Rights:** Parcerias com patrocinadores oficiais da competição (marcas de bebidas, recintos desportivos, lojas de equipamento);
*   **Margem em Aluguer de Pavilhões:** Negociação de horas de jogo em bloco a preços de revenda reduzidos.

---

## 5. Análise Legal e Compliance

Dada a complexidade e rigor exigido para lançamento público (RGPD, isenções financeiras, e regras rígidas das App Stores), todo o enquadramento legal, estruturação fiscal e obrigações da plataforma encontram-se detalhadamente mapeados no documento autónomo: **[6_legal_and_compliance.md](./6_legal_and_compliance.md)**.
