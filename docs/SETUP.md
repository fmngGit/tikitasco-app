# Guia de Configuração Técnica (Backend & Google Cloud)

Bem-vindo ao TikiTasco! Para que tudo funcione de forma gratuita e no teu controlo total, terás de seguir os passos na tua conta Google.

---

## 1. Criar o Projeto na Google Cloud (Para o Google Login)

Para que os utilizadores possam fazer login, precisamos de um Client ID.

1. Acede a: [Google Cloud Console](https://console.cloud.google.com/)
2. Cria um novo projeto (ex: `tiki-tasco-app`).
3. Vai a **"APIs e Serviços" > "Ecrã de Consentimento OAuth"**.
   - Tipo de utilizador: **Externo**.
   - Preenche o nome da app (TikiTasco), o teu email, etc.
   - Podes ignorar os *Scopes* (basta os campos de email/perfil default).
   - Adiciona os utilizadores de teste (os emails dos teus amigos que vão testar). Quando estiver pronto, podes "Publicar" a App.
4. Vai a **"Credenciais" > "Criar Credenciais" > "ID de Cliente OAuth"**.
   - Tipo de aplicação: **Aplicação Web**.
   - Origens de JavaScript autorizadas: Adiciona `http://localhost:5173` (para desenvolvimento) e o URL final do teu GitHub Pages (ex: `https://o-teu-github.github.io`).
5. **Copia o Client ID** gerado. Vais colar este ID no ficheiro `.env` do frontend.

---

## 2. Criar a Base de Dados (Google Sheets)

1. Vai ao teu Google Drive e cria um novo **Google Sheets** (Folha de Cálculo) com o nome "TikiTasco DB".
2. Copia o ID da folha de cálculo através do URL.
   *Exemplo: `https://docs.google.com/spreadsheets/d/AQUI-ESTA-O-ID/edit`* -> Copia apenas a parte `AQUI-ESTA-O-ID`.

---

## 3. Configurar a API Segura (Google Apps Script)

1. Na folha de cálculo que criaste, vai ao menu superior: **"Extensões" > "Apps Script"**.
2. Irá abrir uma nova janela. Apaga tudo o que lá estiver e **cola o código que fornecemos no ficheiro `backend.gs`** (dentro da pasta `docs`).
3. No início do código, altera a variável `SPREADSHEET_ID` para o ID que copiaste no passo anterior.
4. Grava (botão de disquete 💾).
5. No menu superior da janela do Apps Script, seleciona a função **`setupSheets`** e clica em **"Executar"**. (Irá pedir autorizações na tua conta Google, incluindo acesso ao Google Drive para gerir os vídeos dos jogos. Aceita os avisos carregando em "Avançado" -> "Ir para TikiTasco (não seguro)").
   - **Nota:** A função `setupSheets()` é inteligente e aditiva: se já tiveres dados antigos, ela apenas adiciona as novas colunas necessárias sem apagar nada!
6. **Publicar ou Atualizar a API:**
   - **Se for a primeira vez:**
     - Clica no botão azul no topo superior direito **"Implementar" (Deploy)** > **"Nova implementação"**.
     - Clica na engrenagem ao lado de "Selecionar tipo" e escolhe **"Aplicação Web"**.
     - Executar como: **"Eu"** (o teu email).
     - Quem tem acesso: **"Qualquer pessoa"**.
     - Clica em **"Implementar"** e copia o URL gerado para o teu ficheiro `.env`.
   - **Se já tinhas a API publicada e estás a atualizar o código:**
     - Clica em **"Implementar"** > **"Gerir implementações"**.
     - Clica no ícone de lápis ✏️ (Editar).
     - No campo "Versão", escolhe obrigatoriamente **"Nova versão"**!
     - Clica em **"Implementar"**.
7. **(Opcional mas Recomendado) Agendar Limpeza Automática dos Vídeos a 30 Dias:**
   - Na barra lateral esquerda do Apps Script, clica no ícone de relógio ⏰ (**"Acionadores" / Triggers**).
   - Clica em **"+ Adicionar acionador"** no canto inferior direito.
   - Escolhe a função: **`cleanupExpiredVideos`**.
   - Selecionar a origem do evento: **Baseado no tempo**.
   - Tipo de acionador baseado no tempo: **Temporizador diário**.
   - Hora do dia: Por exemplo, entre a meia-noite e a 1h.
   - Grava! Agora, todos os dias à noite, o script verifica se algum jogo tem vídeo com mais de 30 dias e envia-o para o lixo da tua Google Drive para manter o teu espaço livre.

---

## 4. Hospedar o Site Gratuitamente (GitHub Pages)

1. **Configurar o Vite (`vite.config.ts`):**
   Verifica se a propriedade `base` contém o nome do teu repositório:
   ```ts
   export default defineConfig({
     plugins: [react()],
     base: '/tikitasco-app/',
   })
   ```
2. **Publicar no GitHub Pages:**
   ```bash
   npm run build
   npm run deploy
   ```
3. **Origens de JavaScript Autorizadas (Google Login):**
   Não te esqueças de colocar `https://o-teu-username.github.io` nas Origens de JavaScript autorizadas na Google Cloud Console para o botão de login funcionar no site publicado.

---

## 5. Como Fazer Atualizações Futuras

Para saberes o passo a passo exato sempre que quiseres colocar novas alterações online (seja no código da interface ou no Google Apps Script), consulta o guia dedicado em:
📖 **[docs/ATUALIZACOES.md](./ATUALIZACOES.md)**
