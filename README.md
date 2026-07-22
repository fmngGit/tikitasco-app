# ⚽ TikiTasco

Web App de gestão para os jogos semanais de futebol/futsal do grupo TikiTasco. 
A infraestrutura foi desenhada para ser **100% gratuita** e totalmente **segura**, sem exposição de chaves da base de dados e com um backend fechado e inviolável.

## 🛠️ Stack Tecnológico

- **Frontend:** React + TypeScript + Vite (Alojado gratuitamente no GitHub Pages)
- **Base de Dados:** Google Sheets
- **Backend / API Segura:** Google Apps Script (Funciona como middleware seguro e valida todas as identidades)
- **Autenticação:** Google Identity Services (Login Seguro com o Google)
- **Design:** CSS Vanilla + UI Moderna / Glassmorphism + Micro-animações / **Otimização Total Mobile**

## ✅ O que já foi feito (Funcionalidades Atuais)

1. **Autenticação Segura:** Login via Google (Identity Services). O frontend envia apenas o JWT (Token) para o backend, onde a identidade do utilizador é validada criptograficamente antes de permitir a escrita.
2. **Base de Dados via Google Sheets:** Backend configurado para processar automaticamente e armazenar os dados de forma segura sem chaves públicas no Frontend.
3. **Controlo de Concorrência (LockService):** O backend tem um serviço de espera ativo que previne colisões e sobreposições de dados caso dezenas de utilizadores submetam jogos ou votos no exato mesmo segundo.
4. **Sistema de Classificação (Leaderboard):** Tabela dinâmica que apresenta o OVR, vitórias, empates, derrotas e pontos. Os jogadores são ordenados primeiro pelos Pontos.
5. **Sistema de Avaliação (Votação):** Cada jogador pode avaliar os atributos dos colegas usando sliders de 0-100 nas seguintes categorias:
   - Ataque (ATQ)
   - Defesa (DEF)
   - Físico (FIS)
   - Passe (PAS)
   - Guarda-Redes (GR)
   - Fairplay (FP)
6. **Carregamento Inteligente de Votos:** O sistema lembra-se das pontuações antigas! Ao acederes à página de votação e escolheres um colega de equipa, os *sliders* são automaticamente preenchidos com os valores do teu último voto para que possas ajustá-los de forma fácil e intuitiva.
7. **Cartões de Jogador:** O OVR (*Overall*) e as pontuações médias individuais de cada jogador (baseadas nas 6 estatísticas) são dinamicamente calculadas pelo backend e exibidas numa UI de cartão apelativo, ordenado pelo escalão (Bronze, Silver, Gold). Regra de segurança ativa: ninguém pode votar em si próprio.
8. **Histórico de Jogos:** Registo detalhado, incluindo quem jogou em que equipa e o Último Jogo destacado logo na página principal.
9. **Pronto a Hospedar (GitHub Pages):** Sistema inteiramente passado para `HashRouter` para compatibilidade estática em modo de produção.

## 🚀 Próximos Passos (O que falta fazer / Ideias Futuras)

1. **Jogos a 3 Equipas (Triangular):** Expandir a UI da página de Registo de Jogos para suportar dinâmicas de 3 equipas ("rei da pista" ou mini-torneio) numa só submissão, sem o utilizador ter de fazer 3 registos manuais.
2. **Perfis Detalhados & Estatísticas:** Criar uma janela (modal) ou página onde se possa clicar no jogador e ver o seu gráfico em teia (radar chart) de atributos e o histórico de evolução do seu OVR.
3. **Criação de Equipas "Justas" Automáticas:** Uma nova página onde podes selecionar quem vai jogar na semana, e um algoritmo calcula de forma imediata quais são as equipas mais equilibradas com base no OVR dinâmico atual dos utilizadores.
4. **Filtros e Rankings:** Capacidade de ordenar a Classificação por Golos Marcados (caso venha a ser implementado), Melhor Atacante, Melhor Guarda-Redes, etc.

## 📖 Como Hospedar e Configurar

Para saberes como ligar a App à tua conta Google Cloud, configurar a base de dados (Google Sheets) e publicar gratuitamente no GitHub Pages, por favor lê a documentação completa em [docs/SETUP.md](./docs/SETUP.md).

---
*Construído para o grupo TikiTasco.*
