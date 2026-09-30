# 🚀 Guia de Atualizações & Deploy (Como Colocar Alterações Online)

Este guia explica exatamente o que fazer sempre que fizeres alterações ao código e quiseres colocá-las no ar para todos os jogadores do grupo usarem.

---

## 📌 Resumo Rápido: O que mudaste?

| Tipo de Alteração | O que precisas de fazer | Tempo estimado |
| :--- | :--- | :---: |
| **Frontend** (Design, novas páginas, textos, botões, CSS) | Correr `npm run build && npm run deploy` | 1 minuto |
| **Backend / Base de Dados** (Novas colunas, regras de segurança, tabelas) | Atualizar as tabelas/regras diretamente no painel do Supabase | Imediato |

---

## 1. Como Colocar Atualizações do Frontend Online (GitHub Pages)

Sempre que alterares ficheiros dentro de `src/`, `index.html` ou estilos:

### Passo 1: Testar Localmente (Opcional mas recomendado)
No terminal do teu projeto, corre:
```bash
npm run dev
```
Abre `http://localhost:5173` no browser para confirmar que tudo funciona como esperado. Para parar o servidor de teste, prime `Ctrl + C`.

### Passo 2: Compilar e Publicar no GitHub Pages
Quando estiveres pronto para enviar para o ar, corre no terminal:
```bash
npm run build
npm run deploy
```
> O comando `npm run deploy` pega na versão otimizada gerada na pasta `dist` (incluindo as tuas variáveis do `.env.local` que configuraste para o Supabase) e envia-a automaticamente para o ramo `gh-pages` do teu GitHub. Em cerca de 1 a 2 minutos, o site publicado (`https://o-teu-username.github.io/tikitasco-app/`) fica atualizado!

### Passo 3: Guardar as Alterações no Git
Para manter o teu histórico de código guardado no GitHub, certifica-te de que fazes os commits na branch principal (`main`):
```bash
git add .
git commit -m "Descreve aqui as alterações feitas (ex: novo modal de jogador)"
git push origin main
```

> [!TIP]
> **O site não mostra as alterações no telemóvel?**  
> Os browsers dos telemóveis (especialmente Safari e Chrome) guardam cópias em cache do site (PWA). Se acederes e parecer que não mudou nada, faz um **recarregamento forçado** (desliza o ecrã para baixo no telemóvel para atualizar, ou fecha a app e abre de novo).

---

## 2. Como Colocar Atualizações do Backend Online (Supabase)

> [!NOTE]
> **Adeus Google Apps Script!**  
> A base de dados agora é gerida 100% pelo **Supabase**. Não precisas de publicar versões nem de colar código.

Sempre que quiseres adicionar uma coluna nova (ex: uma nova estatística de jogador) ou criar uma tabela nova:
1. Abre o painel do [Supabase](https://supabase.com).
2. Vai ao **Table Editor**.
3. Altera as colunas visualmente ou através do SQL Editor.
4. As tuas alterações refletem-se **instantaneamente** na API que o teu frontend usa.

---

## 3. O que fazer se mudares variáveis de ambiente (`.env.local`)

Se alguma vez alterares:
- O teu `VITE_SUPABASE_URL`
- Ou o teu `VITE_SUPABASE_ANON_KEY`

Deves:
1. Abrir o ficheiro `.env.local` no teu computador e atualizar os valores.
2. Voltar a correr no terminal:
   ```bash
   npm run build
   npm run deploy
   ```
*(Porque as variáveis que começam com `VITE_` são embutidas e escondidas no código estático gerado durante o `build`)*.

---

## 4. Checklist Rápida de Verificação Pós-Atualização

- [ ] A base de dados no Supabase tem as tabelas necessárias para esta atualização?
- [ ] O comando `npm run build` terminou sem erros de TypeScript?
- [ ] O comando `npm run deploy` terminou com `Published`?
- [ ] Fiz `git push origin main` para não perder código local na cloud?
- [ ] Abri o site no telemóvel e confirmei que as novas funcionalidades aparecem?
