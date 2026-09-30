# Análise Legal e Compliance (TikiTasco SaaS)

Lançar uma plataforma B2B/B2C exige fundações legais sólidas. Este documento divide as responsabilidades legais em três eixos principais: Proteção de Dados (App), Funcionamento do Negócio (Empresa e Fiscalidade) e Regras das App Stores.

---

## 1. Proteção de Dados e Plataforma (RGPD)

Como a app vai operar na Europa (e armazenar emails, nomes e fotografias), o Regulamento Geral de Proteção de Dados (RGPD) aplica-se estritamente.

*   **Alojamento de Servidores (Data Residency):** Ao criar a base de dados no Supabase e o alojamento no Vercel, a região escolhida **tem de ser na Europa** (ex: Frankfurt, Paris ou Londres). Armazenar dados de cidadãos europeus nos EUA exige burocracias pesadas (Data Privacy Framework).
*   **Consentimento (Cookies & Tracking):** O site deve ter um aviso claro. Se utilizarem Google Analytics ou ferramentas de tracking de anúncios, o utilizador tem de clicar em "Aceitar". (Dica: Usar alternativas como *Plausible* ou *Vercel Analytics* dispensa banners chatos de cookies pois são anonimizados).
*   **Direito ao Esquecimento vs Integridade de Dados:** 
    *   **O Problema:** Se um utilizador apagar a conta, os jogos onde ele participou não podem simplesmente desaparecer, pois corrompe a tesouraria e o histórico do resto do grupo.
    *   **A Solução Legal:** Quando o utilizador clica em "Apagar Conta", o sistema apaga o email, nome e foto (os chamados *PII - Personally Identifiable Information*). No entanto, o registo na base de dados passa para "Utilizador Anónimo" ou "Jogador Removido", mantendo os números do jogo intactos mas cumprindo a lei.
*   **Política de Privacidade:** Deve estar acessível no rodapé do site e dentro das definições da app, explicando quais os dados recolhidos, porquê (para facilitar o jogo), e quem contactar (`privacy@tikitasco.com`).

---

## 2. Termos e Condições (ToS) e Isenções de Responsabilidade

Os Termos de Serviço servem como um "contrato" invisível para proteger a equipa fundadora de processos judiciais ou dores de cabeça. Devem focar-se em 3 vertentes:

1.  **Isenção Financeira (O módulo Tesouraria):**
    *   A app tem de declarar explicitamente: *"O TikiTasco é um organizador visual e não processa pagamentos bancários reais, nem retém fundos. Não somos uma instituição de pagamento."* 
    *   Isto é **crítico** para não caírem na alçada do Banco de Portugal ou das diretivas financeiras europeias (PSD2).
2.  **Isenção de Lesões e Responsabilidade Civil:**
    *   Deve estar escrito que a plataforma apenas facilita encontros. Se o utilizador X partir a perna no campo Y, ou houver pancadaria num jogo, a plataforma não tem qualquer responsabilidade civil ou criminal sobre o sucedido fora da internet.
3.  **Conteúdo Gerado pelo Utilizador (UGC):**
    *   Com a introdução de *Upload de Vídeos* (Premium), vocês tornam-se hospedeiros de conteúdo. Os Termos têm de proibir o upload de nudez, violência extrema ou violação de direitos de autor, reservando o vosso direito de banir o grupo inteiro e apagar os ficheiros sem direito a reembolso.
4.  **Marketplace e Responsabilidade de Overbooking:**
    *   Para a *Fase 4* (Reservas de Campos), o sistema fará a divisão financeira através do **Stripe Connect** (única forma legal de lidarem com dinheiro de terceiros sem serem um banco). O contrato B2B com os Donos dos Campos deve ter uma cláusula que proteja o TikiTasco contra duplas marcações (Overbooking): a responsabilidade legal de reembolsar o jogador por um campo fechado recai inteiramente sobre o dono do campo que não atualizou o sistema.

---

## 3. Estruturação do Negócio, Fiscalidade e Vendas

Para começarem a cobrar subscrições ou faturar a patrocinadores locais, precisam de enquadramento legal.

*   **Fase de Testes (Sem Empresa Formal):** Até começarem a gerar lucro real, as primeiras subscrições do Stripe podem cair na conta de um dos fundadores que tenha a atividade aberta como Trabalhador Independente (ENI) para emitir recibos verdes, dividindo os custos informalmente.
*   **Fase de Negócio (Criação de LDA):** 
    *   Assim que a tração justificar (ex: atingem >150€ mensais), devem constituir uma Sociedade por Quotas (LDA), dividindo as percentagens pelos fundadores. O programa "Empresa na Hora" em Portugal custa cerca de 360€.
    *   **Faturação Certificada (Obrigatório em Portugal):** O Stripe cobra o dinheiro ao cliente automaticamente, mas em Portugal a lei exige faturas certificadas pela Autoridade Tributária. A solução tecnológica é ligar o Stripe a um software como o **Moloni** ou **InvoiceXpress** via API, que gera a fatura e envia por email automaticamente para o cliente.
*   **Direitos do Consumidor B2C:** Em transações na internet, o consumidor tem 14 dias para se arrepender (Direito de Livre Resolução). No entanto, em produtos de "software como serviço" (SaaS) que arrancam de imediato, uma cláusula nos vossos termos pode anular este direito após o uso inicial da funcionalidade.

---

## 4. Regras das App Stores (Apple e Google)

Se o TikiTasco violar uma destas regras, é sumariamente expulso e banido das lojas.

*   **Pagamentos (A Regra de Ouro da Apple):** É proibido colocar links dentro da App nativa (iOS) a dizer "Subscreve o Premium aqui" se esse link atirar para fora da app (ex: para o vosso site com o Stripe). Para evitar os 30% da Apple, a App Móvel simplesmente **não tem secção de compras**. O administrador tem de saber por fora (boca a boca ou pelo vosso site web) que é no browser do PC que se paga.
*   **O Botão Delete:** É a causa número 1 de rejeição atual na Apple. A app tem obrigatoriamente de ter um botão "Apagar a minha conta" nas definições do telemóvel, acessível em menos de 3 cliques.
*   **Apple Sign-In:** A regra é estrita: se a app oferecer qualquer tipo de social login de terceiros (neste caso, "Login via Google"), é forçado a ter um botão de "Sign in with Apple" ao lado, com as mesmas dimensões.
*   **Geração de Conteúdo UGC:** Se a App permite partilha de vídeos e criação de equipas/nomes públicos, a Apple exige que exista dentro da app um botão de "Reportar Utilizador" ou "Bloquear Conteúdo" para prevenir bullying.
