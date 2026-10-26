# ⚽ TikiTasco

Web App moderna de gestão para os jogos semanais de futebol/futsal do grupo TikiTasco. 
A infraestrutura foi desenhada para ser **100% gratuita**, altamente performante e totalmente **segura**, utilizando **Supabase** como backend serverless e base de dados relacional (PostgreSQL) com regras rigorosas de Row Level Security (RLS).

---

## 🛠️ Stack Tecnológico

- **Frontend:** React 19 + TypeScript + Vite (Alojado gratuitamente no GitHub Pages)
- **Base de Dados & Backend:** Supabase (PostgreSQL na cloud com triggers automáticos e RLS)
- **Autenticação:** Supabase Auth (Login Seguro com Google OAuth)
- **Armazenamento de Multimédia:** Supabase Storage (Bucket seguro `tikitasco-storage` para fotos de recintos e faturas/recibos de tesouraria)
- **Design & UI:** CSS Vanilla modular + UI Moderna / Glassmorphism + Micro-animações + **Otimização Total Mobile / PWA**

---

## ✅ Funcionalidades Principais

1. **Autenticação Segura & Auto-Provisionamento:**
   - Login via Google através do Supabase Auth.
   - Trigger automático no PostgreSQL (`handle_new_user`) que cria e sincroniza de imediato a conta do utilizador em `public.users` e associa ao grupo padrão.
2. **Agenda & Votação Semanal Inteligente (`/agenda`):**
   - Votação interativa na disponibilidade horária (Segunda a Quinta-feira, 19h às 22h) e campos aceitáveis para a semana.
   - **Validação Obrigatória:** Impede a submissão de votos sem horários ou sem campos aceitáveis selecionados (com botão dedicado para *"Não posso jogar esta semana"*).
   - **Resultados e Sugestões em Tempo Real:** Algoritmo que calcula automaticamente o dia, hora e recinto com maior viabilidade e número de jogadores disponíveis.
   - **Prevenção de Duplicações & Feedback Imediato:** Confirmação visual clara de gravação e consulta ordenada por recência.
3. **Modalidades de Jogo Adaptadas ao Grupo:**
   - **⚽ Jogo Padrão (2 Equipas Fixas):** Para partidas normais de 5v5 ou 6v6.
   - **👑 Rei da Pista (3 Equipas):** A equipa vencedora mantém-se em campo como Rei, a perdedora sai e a suplente entra. Registo da sequência inteira de mini-jogos da noite.
   - **🔄 Rotação Dinâmica de Jogadores:** Para jogos com 11 ou 12 jogadores, onde os elementos de campo e suplentes vão rodando entre períodos. Vitórias, empates e derrotas são creditados estritamente com base nas rondas em que cada jogador esteve em campo!
4. **Leaderboard & Perfis de Jogador:**
   - Classificação vitalícia por pontos, vitórias, empates, derrotas e winrate.
   - Ficha técnica completa de jogador com **Radar Hexagonal SVG** dos 6 atributos FIFA: Ataque (ATQ), Defesa (DEF), Físico (FIS), Passe (PAS), Guarda-Redes (GR) e Fairplay (FP).
5. **Sistema de Avaliação Mútua 360º:**
   - Votação confidencial entre colegas com ajuste em sliders de 1 a 99.
   - Prevenção ativa de auto-votação e agregação em tempo real.
6. **Gerador Automático de Equipas Equilibradas (`/teams`):**
   - Distribuição inteligente dos jogadores presentes para minimizar a diferença de OVR médio entre equipas e balancear guarda-redes.
   - Exportação direta da formação gerada para o Registo de Jogo ou cópia rápida para o WhatsApp.
7. **Jogadores Convidados ("Guest Players") & Fusão de Contas:**
   - Criação de jogadores temporários para amigos pontuais.
   - Mecanismo de reivindicação de perfil para associar os jogos e estatísticas do perfil fantasma quando o amigo criar a sua conta Google oficial.
8. **Gestão de Campos & Recintos Desportivos (`/campos`):**
   - Base de dados centralizada com moradas, mapas diretos, tipologia de piso, preçários e galeria de fotos.
9. **Tesouraria & Caixa do Grupo:**
   - Registo de despesas coletivas (bolas, coletes, material), acompanhamento do saldo da caixa comum e upload seguro de faturas/recibos.
10. **Suporte a PWA (Instalação no Telemóvel):**
    - Manifesto configurado para execução em ecrã inteiro (*standalone*).
    - Cache local inteligente para arranque ultrarrápido em Android e iOS (Safari).

---

## 📖 Como Hospedar e Configurar

* Para configurar a base de dados no Supabase e publicar o projeto no GitHub Pages, consulta o [docs/SETUP.md](./docs/SETUP.md).
* Para o procedimento de deploy de novas atualizações, consulta o guia em [docs/ATUALIZACOES.md](./docs/ATUALIZACOES.md).

---

*Construído com paixão para o grupo TikiTasco.*
