# 🚀 Guia de Atualizações & Deploy (Como Colocar Alterações Online)

Este guia explica exatamente o que fazer sempre que fizeres alterações ao código e quiseres colocá-las no ar para todos os jogadores do grupo usarem.

---

## 📌 Resumo Rápido: O que mudaste?

| Tipo de Alteração | O que precisas de fazer | Tempo estimado |
| :--- | :--- | :---: |
| **Apenas Frontend** (Design, novas páginas, textos, botões, CSS) | Correr `npm run build && npm run deploy` | 1 minuto |
| **Apenas Backend** (Regras em `backend.gs`, cálculos, novas colunas) | Atualizar a implementação no Apps Script para **"Nova versão"** | 2 minutos |
| **Ambos** (Nova funcionalidade completa com Frontend + Backend) | Atualizar o Apps Script primeiro, depois fazer deploy do Frontend | 3 minutos |

---

## 1. Como Colocar Atualizações do Frontend Online (GitHub Pages)

Sempre que alterares ficheiros dentro de `src/`, `index.html` ou estilos:

### Passo 1: Testar Localmente (Opcional)
No terminal do teu projeto, corre:
```bash
npm run dev
```
Abre `http://localhost:5173` no browser para confirmar que tudo funciona como esperado. Para parar o servidor de teste, prime `Ctrl + C`.

### Passo 2: Compilar e Publicar no GitHub Pages
Quando estiveres pronto para enviar para o ar:
```bash
npm run build
npm run deploy
```
> O comando `npm run deploy` pega na versão otimizada gerada na pasta `dist` e envia-a automaticamente para o ramo `gh-pages` do teu GitHub. Em cerca de 1 a 2 minutos, o site publicado (`https://o-teu-username.github.io/tikitasco-app/`) fica atualizado!

### Passo 3: Guardar as Alterações no Git
Para manter o teu histórico de código guardado no GitHub:
```bash
git add .
git commit -m "Descreve aqui as alterações feitas (ex: novo modal de jogador)"
git push origin main
```

> [!TIP]
> **O site não mostra as alterações no telemóvel?**  
> Os browsers dos telemóveis (especialmente Safari e Chrome) guardam cópias em cache do site. Se acederes e parecer que não mudou nada, faz um **recarregamento forçado** (desliza o ecrã para baixo no telemóvel para atualizar, ou abre uma janela anónima para confirmar).

---

## 2. Como Colocar Atualizações do Backend Online (Google Apps Script)

> [!WARNING]
> **Atenção — O erro mais comum:**  
> No Google Apps Script, **gravar o ficheiro (💾) NÃO coloca o novo código no ar!**  
> O URL público da tua API continua a correr a versão anterior até criares expressamente uma **"Nova versão"** na implementação.

Sempre que o ficheiro `docs/backend.gs` for modificado:

### Passo 1: Copiar o Código Atualizado
1. Abre o ficheiro `docs/backend.gs` no teu editor de código.
2. Seleciona todo o conteúdo (`Ctrl + A`) e copia (`Ctrl + C`).

### Passo 2: Colar no Google Sheets
1. Abre a folha de cálculo Google Sheets do grupo ("TikiTasco DB").
2. No menu superior, vai a **"Extensões" > "Apps Script"**.
3. Apaga todo o código existente no editor do Apps Script e cola o código novo (`Ctrl + V`).
4. Grava clicando no ícone de disquete 💾 (ou `Ctrl + S`).

### Passo 3: Executar Migrações (se aplicável)
Se a atualização introduziu novas colunas nas tabelas (por exemplo, suporte para convidados ou vídeos):
1. No topo da janela do Apps Script, no seletor de funções, escolhe **`setupSheets`**.
2. Clica no botão **"Executar"**.
3. Confirma no registo de execução que concluiu com sucesso (a função é inteligente e apenas adiciona as colunas novas, mantendo intactos todos os teus dados e linhas existentes).

### Passo 4: Publicar a "Nova Versão" (Crucial)
1. No canto superior direito da janela do Apps Script, clica no botão azul **"Implementar" (Deploy)**.
2. Seleciona **"Gerir implementações"**.
3. Na janela que abre, clica no ícone de **lápis ✏️ (Editar)** no canto superior direito.
4. No campo pendente **"Versão"**, clica e escolhe obrigatoriamente **"Nova versão"**!
5. *(Opcional)* Podes escrever uma pequena descrição (ex: "Atualização de vídeos e convidados").
6. Clica no botão azul **"Implementar"**.
7. Clica em **"Concluído"**.

🎉 **Pronto!** O URL da API mantém-se exatamente o mesmo, mas a partir deste segundo já está a responder com a lógica nova.

---

## 3. O que fazer se mudares variáveis de ambiente (`.env`)

Se alguma vez alterares:
- O teu `VITE_GOOGLE_CLIENT_ID` (novo ID do Google Cloud Console)
- Ou o teu `VITE_GAS_URL` (novo URL da aplicação web Apps Script)

Deves:
1. Abrir o ficheiro `.env` no teu computador e colar o novo valor.
2. Voltar a correr no terminal:
   ```bash
   npm run build
   npm run deploy
   ```
*(Porque as variáveis que começam com `VITE_` são embutidas no código estático durante o `build`)*.

---

## 4. Checklist Rápida de Verificação Pós-Atualização

- [ ] Executei `setupSheets` no Apps Script se houve novas colunas?
- [ ] Criei uma **"Nova versão"** em *Implementar > Gerir implementações* no Apps Script?
- [ ] O comando `npm run build` terminou sem erros de TypeScript?
- [ ] O comando `npm run deploy` terminou com `Published`?
- [ ] Fiz `git push origin main` para não perder código local?
- [ ] Abri o site no telemóvel e confirmei que as novas funcionalidades aparecem?
