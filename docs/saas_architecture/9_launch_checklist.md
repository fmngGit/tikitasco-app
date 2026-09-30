# Launch Checklist (Go-to-Market Strategy)

Este documento serve de guia final ("Roadmap") para os fundadores do TikiTasco. Só após todas as caixas estarem confirmadas é que a versão SaaS pública deve ser oficialmente lançada no mercado.

---

## 1. Operações Burocráticas e Legais (Semana -4)

- [ ] **Data Residency:** Confirmar que a infraestrutura no Supabase e na Vercel está alojada na região `eu-central-1` (ex: Frankfurt).
- [ ] **Documentos Legais Redigidos:** Escrever a Política de Privacidade e os Termos de Serviço (ToS).
- [ ] **Isenção Financeira Ativada:** Garantir que o ToS contém a isenção legal de processamento bancário relativamente ao módulo de "Tesouraria".
- [ ] **Contacto de Privacidade:** Criar um email institucional (ex: `privacy@tikitasco.com`) exclusivo para pedidos do RGPD (Direito ao Esquecimento).
- [ ] **Abertura de Atividade (ENI):** Um dos fundadores (ou a própria "Empresa Lda" caso já existam lucros) tem a conta bancária/NIF preparada para abrir a conta de Stripe.
- [ ] **Aprovação Stripe:** Submeter o site para aprovação no portal Stripe e obter as chaves de API "Live".

## 2. Garantia de Qualidade e Segurança Técnica (Semana -2)

- [ ] **Ambientes Isolados:** Garantir a existência real de três ambientes separados: `dev`, `accp` (aceitação/teste), e `prod` (produção real com dados de clientes).
- [ ] **Row Level Security (RLS) Testado:** Tentar extrair dados (hackear) via API pública do Supabase para garantir que as tabelas estão bloqueadas pelo RLS a não-membros do grupo.
- [ ] **Testes E2E (Playwright):** O fluxo principal completo (Login -> Criar Grupo -> Criar Votação -> Votar -> Partilhar no WhatsApp) tem cobertura de testes automatizados.
- [ ] **Botão "Delete Account" Validado:** Testar se apagar uma conta não destrói os saldos bancários dos outros membros (o PII desaparece, mas o histórico contabilístico fica órfão/anónimo).
- [ ] **Performance Mobile:** Atingir um score mínimo de 85+ no "Google Lighthouse" para a categoria *Performance* num dispositivo Mobile simulado.

## 3. Estratégia de Onboarding e Usabilidade (Semana -1)

- [ ] **Integração Google e Apple Sign-In:** Testar o login sem passwords nos dois maiores fornecedores (evitar rejeição da App Store pela ausência da Apple).
- [ ] **PWA (Progressive Web App):** Confirmar que o manifest.json e os ícones estão configurados para que os utilizadores possam "Instalar no ecrã inicial" com a experiência idêntica a uma app nativa.
- [ ] **Team Generator Testado:** Garantir que a lógica de "Ratings" dos jogadores gera de facto equipas relativamente justas.
- [ ] **Base de Dados Semanal Povoada:** Inserir antecipadamente pelo menos 5 a 10 campos de futebol reais conhecidos na Base de Dados Global, para não apresentar um ecrã vazio aos primeiros clientes.

## 4. Lançamento e Modelo de Negócio (Dia 0 e em Diante)

- [ ] **Plano Freemium Ativado:** Ativar os banners da AdMob na versão grátis (Limitados à categoria "Desporto e Saúde").
- [ ] **"Paywall" Pronta:** Garantir que limites de 15 utilizadores por grupo funcionam e convidam ativamente o administrador a fazer o upgrade para o "TikiTasco Pro".
- [ ] **Marketing B2B (Patrocínios):** A equipa não-técnica iniciou contacto telefónico/presencial com lojistas locais para vendar espaços de banner direto hiper-localizados nas respetivas cidades da app.
- [ ] **Estratégia "Bottom-Up":** Distribuir o "Invite Link" de grupos-piloto no WhatsApp dos amigos próximos para testar o stress do servidor (Soft Launch).

---
*Assim que todos estes itens estiverem garantidos, a transição da v0.1 (Prova de Conceito) para a v0.2 (SaaS Rentável) estará finalizada com sucesso!*
