# Guia de Configuração Técnica (Backend & Google Cloud)

Bem-vindo ao TikiTasco! Para que tudo funcione de forma gratuita e no teu controlo total, terás de seguir 3 passos principais na tua conta Google. Demorará cerca de 5-10 minutos.

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
5. No menu superior da janela do Apps Script, seleciona a função **`setupSheets`** e clica em **"Executar"**. (Irá pedir autorizações na tua conta Google. Aceita os avisos de segurança carregando em "Avançado" -> "Ir para TikiTasco (não seguro)"). **Isto vai criar os separadores "Users", "Votes" e "Games" na tua folha.**
6. Por fim, vamos publicar a API:
   - Clica no botão azul no topo superior direito **"Implementar" (Deploy)** > **"Nova implementação"**.
   - Clica na engrenagem ao lado de "Selecionar tipo" e escolhe **"Aplicação Web"**.
   - Executar como: **"Eu"** (o teu email).
   - Quem tem acesso: **"Qualquer pessoa"**.
   - Clica em **"Implementar"**.
7. Vai ser gerado um URL (do tipo `https://script.google.com/macros/s/.../exec`). **Copia este URL**. Vais colá-lo no ficheiro `.env` do frontend!

🎉 **Feito!** O teu backend e base de dados estão operacionais. O resto do trabalho é feito no site (frontend)!

---

## 4. Hospedar o Site Gratuitamente (GitHub Pages)

A nossa infraestrutura permite alojar o site a custo zero no GitHub Pages. Segue estes passos:

1. **Criar Repositório:** Vai ao [GitHub](https://github.com/) e cria um novo repositório chamado `tikitasco-app`.
2. **Preparar o Vite (`vite.config.ts`):** 
   Se o teu repositório não for na raiz do utilizador, abre o ficheiro `vite.config.ts` e adiciona a propriedade `base` com o nome do teu repositório. Deve ficar parecido a isto:
   ```ts
   export default defineConfig({
     plugins: [react()],
     base: '/tikitasco-app/', // IMPORTANTE: O nome do teu repositório no GitHub
   })
   ```
3. **Enviar o Código:**
   No teu terminal, dentro da pasta do projeto, corre:
   ```bash
   git init
   git add .
   git commit -m "First commit"
   git branch -M main
   git remote add origin https://github.com/O-TEU-USERNAME/tikitasco-app.git
   git push -u origin main
   ```
4. **Publicar:**
   - Para publicar de forma simples e direta, instala o pacote `gh-pages` correndo no terminal: `npm install gh-pages --save-dev`
   - Abre o `package.json` e, dentro de `"scripts"`, adiciona: `"deploy": "gh-pages -d dist"`
   - Para enviar o site para o ar basta agora correres: 
     `npm run build` seguido de `npm run deploy`
   - (No GitHub, vai a **Settings > Pages** e verifica se a Source está definida para a branch `gh-pages`).

5. **Aviso de Segurança Crítico (Google Login):**
   Assim que o site estiver online, **tens de ir ao Google Cloud Console** (ver Passo 1) e adicionar o teu novo domínio às **Origens de JavaScript autorizadas**.
   - **Atenção:** O Google apenas aceita o domínio base, ou seja, deves colocar apenas `https://o-teu-username.github.io` (sem o `/tikitasco-app` e sem a barra final `/`). Se te esqueceres deste passo, o botão de login da Google vai dar erro quando acederes pelo site publicado!
