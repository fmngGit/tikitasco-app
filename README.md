# ⚽ TikiTasco

Web App de gestão para os jogos semanais de futebol/futsal do grupo TikiTasco. 
A infraestrutura foi desenhada para ser **100% gratuita** e totalmente **segura**, sem exposição de chaves da base de dados e com um backend fechado e inviolável.

## 🛠️ Stack Tecnológico

- **Frontend:** React 19 + TypeScript + Vite (Alojado gratuitamente no GitHub Pages)
- **Base de Dados:** Google Sheets
- **Backend / API Segura:** Google Apps Script (Funciona como middleware seguro e valida todas as identidades)
- **Armazenamento de Vídeo:** Google Drive (Upload direto de telemóvel com ciclo de vida de 30 dias e auto-eliminação)
- **Autenticação:** Google Identity Services (Login Seguro com o Google)
- **Design:** CSS Vanilla + UI Moderna / Glassmorphism + Micro-animações / **Otimização Total Mobile**

## ✅ Funcionalidades Principais

1. **Autenticação Segura:** Login via Google (Identity Services). O frontend envia apenas o JWT (Token) para o backend, onde a identidade do utilizador é validada criptograficamente antes de permitir a escrita.
2. **Base de Dados via Google Sheets:** Backend configurado para processar automaticamente e armazenar os dados de forma segura sem chaves públicas no Frontend, com suporte a batch writes (`setValues`) de alta performance.
3. **Controlo de Concorrência (LockService):** O backend tem um serviço de espera ativo que previne colisões e sobreposições de dados caso múltiplos utilizadores submetam jogos ou votos no mesmo segundo.
4. **Modalidades de Jogo Adaptadas ao Grupo:**
   - **⚽ Jogo Padrão (2 Equipas Fixas):** Para partidas normais de 5v5 ou 6v6.
   - **👑 Rei da Pista (3 Equipas):** A equipa vencedora mantém-se em campo como Rei, a perdedora sai e a que estava de fora entra. Interface interativa para registar a sequência inteira de mini-jogos da noite.
   - **🔄 Rotação Dinâmica de Jogadores:** Para quando vão 11 ou 12 jogadores e os elementos em campo e suplentes vão trocando de equipa entre períodos/rondas. As vitórias, empates e derrotas são creditadas com rigor estritamente nas rondas em que o jogador esteve em campo naquela equipa!
5. **Gravação & Upload de Vídeos de Jogo (Google Drive):**
   - Upload direto do telemóvel para a Google Drive do administrador via Resumable Upload (sem limites de 50MB e com barra de progresso em tempo real 0-100%).
   - Todos os colegas podem fazer download/visualizar o vídeo no Histórico durante **30 dias**.
   - **Limpeza Automática:** Após 30 dias, o script move os vídeos expirados para o lixo da Drive, mantendo o teu espaço livre.
6. **Jogadores Convidado / Fantasma ("Ghost Players") & Fusão de Contas:**
   - Adiciona facilmente amigos que ainda não têm conta na app diretamente ao criar um jogo ou equipas.
   - Quando esse amigo entrar na app com a sua conta Google real, pode clicar em **"Reivindicar Perfil"**: todos os jogos, vitórias, derrotas, pontos e votos do perfil fantasma transitam de imediato para a sua conta oficial!
7. **Perfis Detalhados & Radar de Atributos (Hexagonal SVG):**
   - Modal completo ao carregar em qualquer jogador ou cartão:
   - Gráfico de Teia/Radar dinâmico com os 6 atributos: Ataque (ATQ), Defesa (DEF), Físico (FIS), Passe (PAS), Guarda-Redes (GR) e Fairplay (FP).
   - Taxa de vitória (% Winrate) e mini-histórico pessoal de jogos.
8. **Gerador de Equipas "Justas" Automático (`/teams`):**
   - Algoritmo que distribui os jogadores presentes de forma equilibrada por OVR e balanceia os guarda-redes para 2 ou 3 equipas.
   - Botão para enviar as equipas diretamente para o registo de jogo.
9. **Histórico Agrupado por Sessão:**
   - Apresenta as rondas e mini-jogos da mesma noite organizados num único cartão de sessão expansível com o vídeo correspondente.
10. **Sistema de Avaliação & Votação Inteligente:**
    - Carregamento automático dos últimos votos para ajuste rápido em sliders de 1-99.
    - Prevenção ativa de auto-votação tanto no frontend como no backend.

## 📖 Como Hospedar e Configurar

Para saberes como ligar a App à tua conta Google Cloud, configurar a base de dados (Google Sheets) e publicar gratuitamente no GitHub Pages, por favor lê a documentação completa em [docs/SETUP.md](./docs/SETUP.md).

Para saberes o procedimento de como colocar novas atualizações online, consulta o guia de deploy em [docs/ATUALIZACOES.md](./docs/ATUALIZACOES.md).

---
*Construído para o grupo TikiTasco.*
