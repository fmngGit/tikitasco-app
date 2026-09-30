# Ferramentas de Colaboração e Operações (Tech Stack Interna)

Para garantir que a equipa fundadora (50% Informáticos / 50% Não-Técnicos) comunica de forma eficaz e avança ao mesmo ritmo sem custos excessivos, estabeleceu-se uma "Stack de Operações" focada em ferramentas **100% Gratuitas** (ou com Free Tiers extremamente generosos) adequadas a Startups em fase inicial.

---

## 1. Gestão de Tarefas (Task Tracking & Sprints)
**Ferramenta Recomendada:** **GitHub Projects** (Grátis)
*   **Porquê:** O código já vai estar alojado no GitHub. O GitHub Projects permite criar quadros ao estilo Kanban (To Do, In Progress, Done) que ligam automaticamente aos "Commits" dos programadores.
*   **Fluxo de Trabalho:**
    1.  O lado não-técnico (Apoio ao Cliente) recebe queixas de um utilizador ("O botão X não funciona").
    2.  O membro não-técnico vai ao GitHub Projects e cria um cartão (Issue) com o título "Bug no Botão X".
    3.  A equipa técnica arrasta o cartão para "In Progress", resolve no código, e quando faz o deploy o cartão move-se magicamente para "Done" sem esforço humano.

*(Alternativa grátis: Trello, caso o GitHub Projects pareça demasiado técnico à primeira vista).*

---

## 2. Base de Conhecimento (Wiki & Planeamento)
**Ferramenta Recomendada:** **Notion** (Plano Free)
*   **Porquê:** É o standard de mercado para documentação ágil. Permite colaboração em tempo real e é extremamente intuitivo para pessoas de todas as áreas.
*   **Casos de Uso no TikiTasco:**
    *   **Equipa Técnica:** Guardar registos de arquitetura, manuais de deployment, e links importantes (como este SaaS Blueprint).
    *   **Equipa Não-Técnica:** Criar planos de Marketing, registos de contactos de patrocinadores, scripts para chamadas com campos de futebol, e respostas pré-feitas para o Apoio ao Cliente.

---

## 3. Comunicação Assíncrona e Síncrona
**Ferramenta Recomendada:** **Discord** (Grátis)
*   **Porquê o Discord e não o Slack?** O Slack (no seu plano grátis) esconde todas as mensagens e ficheiros antigos após 90 dias, o que destrói o histórico da empresa. O Discord permite criar um servidor privado para a equipa, com histórico infinito gratuito.
*   **Canais Sugeridos:**
    *   `#geral`: Discussões sobre o rumo da empresa.
    *   `#bugs-urgentes`: Onde o lado não-técnico pode dar o "alerta vermelho" aos informáticos se a app for abaixo.
    *   `#github-logs`: Um canal robô onde cai uma mensagem automática sempre que um dev atualiza a aplicação (útil para os não-técnicos saberem que podem testar a nova versão).
    *   `#vendas-e-patrocinios`: Onde se celebram as novas lojas/patrocínios adquiridos.

---

## 4. UI/UX Design e Prototipagem
**Ferramenta Recomendada:** **Figma** (Plano Free)
*   **Porquê:** O código é caro de se produzir (custa tempo dos developers). É imperativo que novas funcionalidades não sejam programadas "às cegas".
*   **Fluxo de Trabalho:**
    1.  Antes de criar um novo ecrã (ex: O Painel de Tesouraria Premium), desenha-se o ecrã no Figma.
    2.  Ambas as partes (Técnicos e Não-Técnicos) deixam comentários no design: "Falta aqui o botão Voltar", "Onde é que entra a comissão do patrocinador?".
    3.  Só após aprovação visual de todos no Figma é que a equipa de informática avança com a escrita de código.
