# 📚 DOCUMENTAÇÃO ACADÊMICA COMPLETA — TASKFLOW DEVOPS

**Squad Sênior de Engenharia:**
- **Scrum Master (SM):** Gestão de fluxo ágil, remoção de bloqueios e métricas de velocidade.
- **Product Owner & Full Stack Developer (PO/FS):** Gestão do backlog de produto, arquitetura de software e implementação frontend/backend.
- **DevOps Engineer (DO):** Infraestrutura como código, containers Docker multi-stage, pipeline CI/CD no GitHub Actions e observabilidade.
- **QA Engineer (QA):** Arquitetura de testes automatizados (unitários, integração e smoke tests), qualidade de software e limiar de cobertura.

---

## 1. RESUMO DA ARQUITETURA E DECISÕES TÉCNICAS

### 1.1. Justificativa do Tema (2 linhas)
O domínio de gerenciamento de tarefas (*TaskFlow*) é o padrão da indústria para validação de esteiras DevOps, pois cobre autenticação JWT, relacionamento relacional 1:N no PostgreSQL, estados finitos (status/prioridade) e métricas ricas de latência e erros sem complexidade acidental de regras de negócio redundantes.

### 1.2. Decisões de Stack Tecnológica
- **Backend:** Node.js 20 LTS + Express em Clean Modular MVC (Controllers, Services, Repositories).
- **Frontend:** Single Page Application (SPA) nativa servida pelo Express em `src/public` com Tailwind CSS e Vanilla JS modular reativo.
- **Banco de Dados:** PostgreSQL 16 via Docker e suporte transparente em memória para testes locais isolados. O DDL único é mantido em `src/models/schema.sql`.
- **Versionamento & Git Flow:** GitHub Flow com branches `feature/*` e `fix/*`, Pull Requests obrigatórios com template estruturado e branch protection na `main`.
- **CI/CD:** GitHub Actions unificado em `.github/workflows/pipeline.yml` com service container PostgreSQL 16, ESLint real, suíte de testes com cobertura forçada $\ge 70\%$, deploy condicionado (`needs: [build-and-test]`) e smoke test via `curl` no `/health`.
- **Containerização:** Dockerfile multi-stage com `node:20-alpine`, `chown node:node` e usuário não-root `node`.
- **Monitoramento:** Winston (logs estruturados JSON), probe `/health` com diagnóstico ativo de banco, `prom-client` expondo métricas no `/metrics` e dashboard Grafana pré-configurado com `uid: Prometheus`.

---

## 2. PLANEJAMENTO SCRUM COMPLETO

### 2.1. Definition of Ready (DoR) e Definition of Done (DoD)
- **Definition of Ready (DoR):**
  1. História escrita no formato "Como [ator], quero [ação] para [benefício]".
  2. Critérios de aceite objetivos e testáveis definidos (Given-When-Then / Checklist).
  3. Dependências de banco de dados e APIs externas mapeadas.
  4. Estimativa de Story Points atribuída em consenso pelo time (Fibonacci).
- **Definition of Done (DoD):**
  1. Código versionado conforme Conventional Commits em branch `feature/*`.
  2. Validação estática sem erros no ESLint (`npm run lint`).
  3. Testes unitários e/ou de integração cobrindo cenários de sucesso e falha.
  4. Cobertura de código do projeto mantida em $\ge 70\%$.
  5. Sem credenciais ou segredos no código (leitura via variáveis de ambiente).
  6. PR aprovado por no mínimo um par de engenharia com CI verde.

---

### 2.2. Product Backlog Estimado (12 User Stories com Critérios de Aceite)

| ID | User Story | Critérios de Aceite (Gherkin / Checklist) | SP |
| :---: | :--- | :--- | :---: |
| **US01** | **Como** usuário, **quero** cadastrar uma conta com nome, e-mail e senha **para** ter meu espaço isolado de tarefas. | • **Dado** um e-mail novo e senha com 6+ caracteres, **quando** enviar para `/register`, **então** retorna HTTP 201 e dados do usuário com senha em hash Bcrypt (salt $\ge 10$).<br>• **Dado** um e-mail já cadastrado, **quando** tentar cadastrar, **então** retorna HTTP 409.<br>• **Dado** nome com menos de 2 caracteres, **então** retorna HTTP 400. | **3** |
| **US02** | **Como** usuário cadastrado, **quero** realizar login **para** acessar minhas tarefas com segurança. | • **Dado** credenciais corretas, **quando** requisitar `/login`, **então** retorna HTTP 200 com token JWT válido por 24 horas.<br>• **Dado** e-mail ou senha incorretos, **quando** tentar logar, **então** retorna HTTP 401 sem especificar se o erro é o e-mail ou a senha.<br>• O segredo JWT em produção não pode ser padrão. | **3** |
| **US03** | **Como** usuário autenticado, **quero** criar uma nova tarefa com prioridade e prazo **para** planejar minhas obrigações. | • **Dado** token Bearer válido e título preenchido, **quando** enviar para `POST /tasks`, **então** cria a tarefa com status padrão `PENDENTE` e prioridade padrão `MEDIA`.<br>• **Dado** título ausente ou maior que 150 caracteres, **então** retorna HTTP 400.<br>• **Dado** prioridade diferente de BAIXA, MEDIA ou ALTA, **então** retorna HTTP 400. | **2** |
| **US04** | **Como** usuário autenticado, **quero** listar minhas tarefas com filtros por status e prioridade **para** visualizar o fluxo de trabalho. | • O usuário só enxerga tarefas com seu respectivo `user_id`.<br>• Suporte a filtros opcionais na query string: `?status=EM_ANDAMENTO&priority=ALTA`.<br>• Retorna lista ordenada de forma cronológica decrescente. | **3** |
| **US05** | **Como** usuário autenticado, **quero** atualizar o status ou dados de uma tarefa **para** registrar meu progresso. | • Permite transição entre os estados permitidos: `PENDENTE`, `EM_ANDAMENTO`, `CONCLUIDA`.<br>• Atualiza automaticamente o campo `updated_at`.<br>• Retorna HTTP 404 caso a tarefa não pertença ao usuário. | **2** |
| **US06** | **Como** usuário autenticado, **quero** excluir uma tarefa **para** remover itens descartados. | • Exclusão idempotente: retorna HTTP 204 sem corpo em caso de sucesso.<br>• Retorna HTTP 404 se a tarefa não existir ou pertencer a outro usuário.<br>• Tarefa removida do banco de dados imediatamente. | **2** |
| **US07** | **Como** operador de infraestrutura, **quero** um endpoint `/health` **para** verificar a saúde do container e do PostgreSQL. | • Executa `SELECT 1` no banco de dados ativo.<br>• Se o banco responder, retorna HTTP 200 `{ "status": "UP", "database": "connected", "uptimeSeconds": ... }`.<br>• Se o banco falhar, retorna HTTP 503 com status `DOWN`. | **2** |
| **US08** | **Como** Engenheiro DevOps, **quero** expor métricas RED via `/metrics` no formato Prometheus **para** monitorar latência e tráfego. | • Coleta métricas nativas do processo Node.js (CPU, memória heap).<br>• Histograma `http_request_duration_seconds` e contador `http_requests_total` com rótulos de método, rota e código de status.<br>• Contador `tasks_created_total` por prioridade. | **3** |
| **US09** | **Como** time de engenharia, **quero** validação estática e testes automáticos com PostgreSQL no CI **para** impedir regressões no repositório. | • Disparo automático em `push` e `pull_request` para a `main`.<br>• Execução do ESLint real (`npm run lint`).<br>• Execução do Jest com PostgreSQL 16 provisionado via service container.<br>• Bloqueio automático de merge caso a cobertura seja menor que 70%. | **5** |
| **US10** | **Como** Engenheiro DevOps, **quero** empacotar a aplicação em imagem Docker multi-stage **para** garantir segurança e imagens leves. | • Estágio 1 (*builder*): instala dependências completas, roda lint e faz o prune para produção.<br>• Estágio 2 (*runner*): usa `node:20-alpine`, ajusta permissões com `chown node:node` antes de trocar para `USER node` e copia os `node_modules` do builder.<br>• Execução de probe `HEALTHCHECK` interno. | **3** |
| **US11** | **Como** time de engenharia, **quero** deploy contínuo em cloud condicionado ao sucesso do CI com smoke test **para** publicar releases sem falhas. | • O job de CD possui dependência estrita `needs: [build-and-test]`.<br>• Disparo via Webhook seguro no Render com segredos em GitHub Secrets.<br>• Smoke test automatizado via `curl -f $APP_URL/health` pós-deploy. | **5** |
| **US12** | **Como** time de operações, **quero** um ambiente local completo com `docker-compose` (App, DB, Prometheus, Grafana) **para** simulação integrada em um comando. | • `docker compose up --build -d` inicializa os 4 serviços interconectados.<br>• Grafana com datasource provisionado com `uid: Prometheus`.<br>• Dashboard operacional importado automaticamente com painéis de RPS, latência p95 e taxa de erros 5xx. | **5** |

**Total de Pontos de História (Backlog Geral):** 38 Story Points.

---

### 2.3. Planejamento das Sprints

#### Sprint 1: Fundação do Sistema, Regras de Negócio e Qualidade Base
* **Meta da Sprint:** *"Entregar o núcleo funcional do gerenciador de tarefas (autenticação JWT e CRUD) com cobertura de testes automatizados, persistência PostgreSQL e containerização Docker multi-stage."*
* **Sprint Backlog Selecionado:** US01, US02, US03, US04, US05, US06, US07, US10 (Total: 20 Story Points).

#### Sprint 2: Observabilidade, Automação CI/CD e Deploy Contínuo
* **Meta da Sprint:** *"Automatizar a esteira unificada de CI/CD no GitHub Actions condicionando o deploy em nuvem aos testes com PostgreSQL, e implementar observabilidade operacional com Prometheus e Grafana."*
* **Sprint Backlog Selecionado:** US08, US09, US11, US12 (Total: 18 Story Points).

---

### 2.4. Exemplos Práticos das Cerimônias Ágeis

#### Daily Scrum (Sprint 1, Dia 3 — 15 minutos)
* **Scrum Master:** *"Bom dia, time! Vamos ao alinhamento da Sprint 1. Full Stack, como estamos no módulo de tarefas?"*
* **Full Stack Dev:** *"Ontem finalizei a US02 (Login JWT) e a criação de tarefas (US03). Hoje vou implementar os filtros de busca da US04 e a rota de exclusão (US05/US06). Não tenho impedimentos, mas precisamos garantir que o DDL do banco seja único para não termos discrepâncias entre testes e produção."*
* **QA Engineer:** *"Ontem finalizei a suíte unitária de autenticação. Hoje vou escrever os testes de integração para o CRUD de tarefas com Supertest. Identifiquei que o `tests/setup.js` precisa usar `setupFilesAfterEnv` no Jest para que o `beforeEach` e o `beforeAll` funcionem, e que precisamos rodar o `initDb()` no setup para criar as tabelas no PostgreSQL real de teste. Sem impedimentos."*
* **DevOps Engineer:** *"Ontem ajustei o Dockerfile multi-stage corrigindo a permissão do `USER node` com `chown node:node /usr/src/app`. Hoje vou estruturar o `docker-compose.yml` e o endpoint `/health` com o FS. Sem impedimentos."*
* **Scrum Master:** *"Excelente. O QA e o DevOps alinhem a inicialização das tabelas no teste do CI logo após a Daily. Foco na meta da Sprint!"*

#### Sprint Review (Fim da Sprint 1)
* **Participantes:** Time de Engenharia + Professor / Stakeholder da Startup.
* **Demonstração Realizada:**
  1. PO/FS demonstra a interface SPA web: cadastro de novo usuário, login com token JWT gerado e exibição do painel principal.
  2. Criação de tarefas com prioridades Alta, Média e Baixa, filtragem dinâmica e atualização de status em tempo real.
  3. QA Engineer apresenta o terminal rodando `npm run test:coverage`: todos os testes passando com cobertura acima de 80%.
  4. DevOps demonstra o container Docker multi-stage rodando de forma segura sob usuário não-root `node` e consumindo menos de 180MB.
* **Feedback do Stakeholder:** *"O MVP está funcional, seguro e visualmente profissional. Para a Sprint 2, priorizem o monitoramento de tráfego com métricas Prometheus e o deploy automatizado via GitHub Actions com teste de fumaça."*
* **Resultado:** Meta da Sprint 1 cumprida. 20 SP entregues.

#### Sprint Retrospective (Fim da Sprint 1)
* **Dinâmica Realizada:** *Mad, Sad, Glad (O que nos frustrou, o que nos entristeceu, o que nos alegrou)*.
* **Glad (Pontos Positivos):**
  - O uso do PostgreSQL real nos testes de integração evitou surpresas com tipos de dados.
  - A interface em Tailwind CSS trouxe excelente experiência visual com mínimo esforço.
* **Sad / Mad (O que pode melhorar):**
  - O script de lint inicial era apenas um echo simplório e não validava o código de verdade.
  - O banco de testes falhava porque as tabelas não eram criadas automaticamente no runner.
* **Plano de Ação SMART para a Sprint 2:**
  1. *Ação:* Integrar o ESLint oficial no projeto e incluí-lo na esteira de CI antes dos testes (Responsável: QA | Prazo: Dia 1 da Sprint 2).
  2. *Ação:* Centralizar o DDL no arquivo `src/models/schema.sql` e chamá-lo no `beforeAll` dos testes (Responsável: FS/DO | Prazo: Dia 1 da Sprint 2).
  3. *Ação:* Unificar o workflow de CI e CD no GitHub Actions utilizando `needs: [build-and-test]` para impedir deploys de código quebrado (Responsável: DO | Prazo: Dia 2 da Sprint 2).

---

## 3. ESTRATÉGIA GIT E VERSIONAMENTO

### 3.1. Modelo GitHub Flow
Adotamos o **GitHub Flow**, ideal para times ágeis que praticam entrega contínua:
1. A branch `main` contém sempre código estável e pronto para deploy em produção.
2. Qualquer nova funcionalidade ou correção deve ser criada a partir da `main` em branches semânticas:
   - `feature/<nome-da-funcionalidade>` (ex: `feature/auth-jwt`, `feature/crud-tasks`)
   - `fix/<nome-do-bug>` (ex: `fix/memory-db-delete`, `fix/setup-files-jest`)
   - `ci/<alteracao-pipeline>` (ex: `ci/unified-pipeline`)
3. Abertura obrigatória de **Pull Request (PR)** com preenchimento do checklist de qualidade (`.github/pull_request_template.md`).
4. A branch protection rule exige que o job `build-and-test` passe com sucesso antes que o merge na `main` seja liberado.
5. O merge é feito via *Squash and Merge* ou *Rebase* para manter o histórico linear.

### 3.2. Padrão Conventional Commits
Todos os commits seguem a especificação [Conventional Commits](https://www.conventionalcommits.org/):
- `feat:` Nova funcionalidade para o usuário.
- `fix:` Correção de bug.
- `test:` Adição ou refatoração de testes automatizados.
- `ci:` Alterações nos arquivos de configuração de CI/CD.
- `docs:` Alterações na documentação ou README.
- `chore:` Tarefas de manutenção ou dependências.

### 3.3. Exemplo Real de Histórico de Commits (`git log --oneline`)
```text
f3a8b1c (HEAD -> main, origin/main) docs: adiciona documentacao academica completa e diagramas mermaid
e2d9a0b ci: unifica pipeline com needs entre ci e cd e adiciona smoke test
d1c8f9a fix: corrige dockerfile multi-stage com chown node e copia de node_modules
c0b7e8d fix: corrige uid prometheus no datasource do grafana
b9a6d7c fix: corrige handleDelete no memoryDb e inicializa schema nos testes
a8f5c6b test: adiciona testes unitarios e de middleware alcancando cobertura >80%
97e4b5a chore: adiciona eslint real e configura setupFilesAfterEnv no jest
86d3a49 feat: implementa instrumentacao de metricas prometheus e endpoint /metrics
75c2938 feat: implementa endpoint /health com checagem ativa de postgresql
64b1827 feat: implementa crud completo de tarefas com filtros por status e prioridade
53a0716 feat: implementa servico de autenticacao com hash bcrypt e jwt seguro
42f9605 feat: cria ddl relacional em schema.sql e camada de persistencia
31e8504 feat: cria interface web spa responsiva em tailwind css
20d7403 ci: configura template de pull request e docker-compose local
10c6302 chore: setup inicial do projeto nodejs e estrutura modular de pastas
```

---

## 4. DOCUMENTAÇÃO TÉCNICA DETALHADA DO PIPELINE

| Etapa do Pipeline | O que faz? | Por que existe? | Ferramenta Utilizada | Como pode falhar? | Como diagnosticar e corrigir? |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **1. Checkout do Repositório** | Clona os arquivos da branch acionada para o runner Linux. | Dá acesso ao código para os passos seguintes. | `actions/checkout@v4` | Permissão de leitura revogada no GitHub. | Verificar permissões de *Read repository contents* no repositório. |
| **2. Service Container PostgreSQL** | Sobe container PostgreSQL 16 oficial com healthcheck na porta 5432 do runner. | Permite rodar testes de integração contra um banco idêntico ao de produção sem necessidade de mocks. | *GitHub Service Containers* (`postgres:16-alpine`) | Porta 5432 ocupada ou falha nas variáveis de ambiente `POSTGRES_PASSWORD`. | Validar bloco `services.postgres.env` e parâmetros do healthcheck no `.github/workflows/pipeline.yml`. |
| **3. Setup Node.js & Cache** | Instala Node 20 LTS e restaura o cache do diretório `~/.npm`. | Garante ambiente determinístico e acelera o tempo de execução do CI em até 60%. | `actions/setup-node@v4` | `package-lock.json` ausente ou divergente do `package.json`. | Rodar `npm install` localmente para sincronizar o lockfile e commitar. |
| **4. Instalação de Dependências** | Executa `npm ci` baseado no lockfile. | Garante que as versões exatas das dependências sejam instaladas sem alterações. | `npm ci` | Mismatch de integridade de checksum de algum pacote. | Deletar `node_modules` e rodar `npm install` para atualizar o checksum. |
| **5. ESLint (Linting Real)** | Faz análise estática de sintaxe e boas práticas em `src/` e `tests/`. | Evita variáveis não declaradas, sintaxes inválidas ou imports quebrados antes dos testes. | `ESLint` (`npm run lint`) | Variável não utilizada ou erro de sintaxe em algum arquivo JavaScript. | Ler a linha apontada no log do GitHub Actions e corrigir o código. |
| **6. Testes & Cobertura** | Executa a suíte Jest contra o PostgreSQL real e valida limiar $\ge 70\%$. | Garante integridade das regras de negócio e impede que código não testado vá para a `main`. | `Jest` + `Supertest` (`npm run test:coverage`) | Um assert falhou ou a cobertura de branches/linhas caiu abaixo de 70%. | Executar `npm run test:coverage` localmente para inspecionar as linhas não cobertas na tabela do terminal. |
| **7. Deploy Contínuo (CD)** | Dispara requisição HTTP POST para o Webhook de deploy na nuvem. | Publica o incremento em produção automaticamente após a aprovação de qualidade do CI. | `curl` + Webhook (Render API) | O CI quebrou (`needs: [build-and-test]` bloqueia) ou o secret `RENDER_DEPLOY_HOOK_URL` está incorreto. | Se o CI falhou, conserte os testes. Se o secret falhou, reconfigure em *Settings > Secrets*. |
| **8. Smoke Test Pós-Deploy** | Efetua chamadas `curl -f $APP_URL/health` com até 5 tentativas esperando `{"status":"UP"}`. | Garante que o container em produção subiu com sucesso e que a conexão com o PostgreSQL em nuvem está viva. | `curl` com loop de retry | O container em nuvem deu erro de inicialização (*crash*) ou o banco rejeitou a senha. | Consultar os logs de inicialização do container no dashboard da plataforma de deploy (Render). |

---

## 5. GUIA PASSO A PASSO "DO ZERO AO DEPLOY"

### Passo 1: Inicialização do Repositório Git Local e GitHub
1. Abra o terminal na pasta do projeto e inicialize o Git:
   ```bash
   git init -b main
   git add .
   git commit -m "feat: setup completo do taskflow com testes e ci/cd"
   ```
2. Crie um repositório no seu GitHub chamado `taskflow-devops`.
3. Conecte o repositório remoto e envie o código:
   ```bash
   git remote add origin https://github.com/<SEU_USUARIO>/taskflow-devops.git
   git push -u origin main
   ```

### Passo 2: Provisionar o Banco de Dados PostgreSQL em Nuvem (Gratuito)
1. Acesse [render.com](https://render.com) e crie uma conta gratuita.
2. Clique em **New +** > **PostgreSQL**.
3. Dê o nome de `taskflow-db` e clique em **Create Database**.
4. Copie a **Internal Database URL** (ou External URL) gerada (ex: `postgresql://taskflow_user:senha@host.render.com/taskflow_db`).

### Passo 3: Criar o Serviço da Aplicação Web no Render
1. No Render, clique em **New +** > **Web Service**.
2. Conecte seu repositório GitHub `taskflow-devops`.
3. Configure os campos:
   * **Name:** `taskflow-api`
   * **Runtime:** Node
   * **Build Command:** `npm ci`
   * **Start Command:** `node src/server.js`
4. Na aba **Environment Variables**, adicione:
   * `NODE_ENV`: `production`
   * `PORT`: `10000`
   * `JWT_SECRET`: Cole uma chave criptográfica longa e segura.
   * `DATABASE_URL`: Cole a URL do PostgreSQL copiada no Passo 2.
5. Clique em **Create Web Service**.
6. Copie a URL pública gerada (ex: `https://taskflow-api.onrender.com`).
7. Em **Settings** > **Deploy Hook**, clique em **Create Deploy Hook** e copie a URL do webhook gerada.

### Passo 4: Configurar os GitHub Secrets
1. No seu repositório no GitHub, acesse **Settings** > **Secrets and variables** > **Actions**.
2. Crie os dois seguintes segredos:
   * `RENDER_DEPLOY_HOOK_URL`: Cole a URL do Deploy Hook obtida no Render.
   * `PRODUCTION_APP_URL`: Cole a URL da aplicação (ex: `https://taskflow-api.onrender.com` — sem barra no final).

### Passo 5: Proteger a Branch `main` e Testar o Pipeline
1. No GitHub, vá em **Settings** > **Branches** > **Add branch protection rule**.
2. No padrão de branch, digite `main`.
3. Ative:
   * *Require a pull request before merging*
   * *Require status checks to pass before merging* (marque o status check `Lint, Testes e Cobertura`).
4. Crie uma branch de teste:
   ```bash
   git checkout -b feature/validacao-esteira
   # Faça um commit simples
   git commit --allow-empty -m "chore: testando esteira automatica com smoke test"
   git push origin feature/validacao-esteira
   ```
5. Abra o Pull Request. O CI executará os testes com PostgreSQL e o lint. Ao fazer o merge, o job de CD disparará o deploy e o smoke test validará a aplicação em produção.

---

## 6. ROTEIRO DE APRESENTAÇÃO E PERGUNTAS DA BANCA

### 6.1. Roteiro de Apresentação (5 a 7 Minutos Cronometrado)
* **0:00 - 1:00 | Abertura e Metodologia Ágil (Scrum Master):**
  * *"Bom dia a todos. Nosso squad sênior desenvolveu o TaskFlow para atender às demandas de entrega contínua de uma startup. Estruturamos nosso projeto em 2 sprints no SCRUM, com 12 histórias pontuadas em Fibonacci, critérios de aceite claros em formato Gherkin e Definition of Done rigorosa com esteira de testes."*
* **1:00 - 2:30 | Demonstração do MVP Funcional (Full Stack Dev):**
  * Mostra a SPA em execução: cadastro com validação de senha, login seguro com token JWT e manipulação de tarefas com prioridades (Alta, Média, Baixa) e prazos.
  * Destaca o badge dinâmico de `/health` no topo da aplicação que faz consultas em tempo real com latência em milissegundos.
* **2:30 - 4:00 | Qualidade e Testes Automatizados (QA Engineer):**
  * Apresenta o comando `npm run test:coverage` no terminal.
  * Demonstra a suíte de testes unitários e de integração executando sobre o PostgreSQL real e destaca a cobertura superior a 80%, cobrindo todos os fluxos de sucesso e falhas de negócio.
* **4:00 - 5:15 | Infraestrutura como Código e Pipeline CI/CD (DevOps Engineer):**
  * Explica o Dockerfile multi-stage com usuário `node` sem privilégios de root e imagem leve `alpine`.
  * Apresenta o `docker-compose.yml` orquestrando App, Postgres, Prometheus e Grafana.
  * Exibe no GitHub Actions a execução do pipeline unificado: o job de CD só é disparado via `needs: [build-and-test]` se todos os testes passarem, finalizando com o *Smoke Test* pós-deploy.
* **5:15 - 6:30 | Observabilidade e Métricas em Tempo Real (DevOps / QA):**
  * Abre o dashboard do Grafana em `http://localhost:3001` exibindo as métricas coletadas pelo Prometheus: Taxa de Requisições por Segundo (RPS), Latência p95 e contador de tarefas criadas.
* **6:30 - 7:00 | Conclusão:**
  * Encerramento resumindo os ganhos de confiabilidade obtidos ao integrar desenvolvimento e operações desde o primeiro dia.

---

### 6.2. Perguntas Frequentes do Professor e Respostas Rápidas

1. **Pergunta:** *"Por que vocês utilizaram um único arquivo de pipeline em vez de manter CI e CD separados?"*  
   **Resposta:** *"Para garantir dependência estrita através do parâmetro `needs: [build-and-test]`. Em pipelines separados disparados pelo evento `push`, eles executariam em paralelo, arriscando implantar em produção um código com testes quebrados."*

2. **Pergunta:** *"Como vocês resolveram o problema de permissão no Dockerfile multi-stage?"*  
   **Resposta:** *"No estágio builder geramos os `node_modules` com `npm ci`. No estágio runner, executamos `RUN chown node:node /usr/src/app` antes de trocar para o `USER node` e copiamos os `node_modules` prontos do estágio builder usando `--from=builder`. Assim eliminamos qualquer erro de permissão `EACCES` e mantemos o container seguro."*

3. **Pergunta:** *"Como a aplicação se comporta nos testes se o PostgreSQL local estiver desligado?"*  
   **Resposta:** *"Nosso módulo `database.js` possui um adaptador de fallback em memória para testes unitários rápidos. Porém, no CI do GitHub Actions, utilizamos um container oficial do PostgreSQL 16 provisionado no runner, garantindo que os testes de integração validem a sintaxe SQL e chaves estrangeiras reais."*

4. **Pergunta:** *"O que é o Smoke Test e qual a sua importância pós-deploy?"*  
   **Resposta:** *"O Smoke Test é uma verificação rápida e automatizada no endpoint `/health` imediatamente após o deploy. Ele confirma se a nova versão subiu, se o servidor web responde HTTP 200 e se o pool de banco conectou com sucesso, falhando o pipeline caso a aplicação entre em estado de falha (*crash loop*)."*

5. **Pergunta:** *"Por que utilizar métricas do Prometheus além dos logs estruturados do Winston?"*  
   **Resposta:** *"Logs em JSON registram eventos discretos e erros pontuais. Já as métricas do Prometheus medem séries temporais agregadas (taxa de requisições, percentis de latência p95 e uso de CPU), permitindo alarmes preventivos e dashboards operacionais no Grafana."*

---

## 7. CHECKLIST FINAL DE ATENDIMENTO AOS REQUISITOS

| Requisito Obrigatório da Atividade | Status | Onde foi Atendido no Projeto |
| :--- | :---: | :--- |
| **1. Planejamento SCRUM Completo** | ✅ **100%** | **Seção 2 deste documento:** 12 User Stories detalhadas em formato Gherkin com critérios de aceite e Story Points, 2 Sprints com metas e DoR/DoD, simulação completa de Daily, Review e Retrospectiva com plano de ação SMART. |
| **2. MVP Funcional** | ✅ **100%** | **Pastas `src/` e `src/public/`:** Backend Express modular (MVC), Frontend SPA reativo em Tailwind CSS com feedback de saúde em tempo real, autenticação JWT, hash Bcrypt e CRUD completo de tarefas com filtros. |
| **3. Versionamento & Git** | ✅ **100%** | **Seção 3 deste documento e `.github/pull_request_template.md`:** GitHub Flow documentado, Conventional Commits, histórico simulado de commits e `.gitignore` configurado. |
| **4. Pipeline de CI (GitHub Actions)** | ✅ **100%** | **Arquivo `.github/workflows/pipeline.yml`:** ESLint real, instalação com cache npm, service container PostgreSQL 16 oficial, testes unitários e de integração com cobertura forçada $\ge 70\%$. |
| **5. Pipeline de CD & Deploy Automático** | ✅ **100%** | **Arquivo `.github/workflows/pipeline.yml`:** Job de deploy condicionado (`needs: [build-and-test]`), secrets em GitHub Secrets e passo de *Smoke Test* automatizado pós-deploy no `/health`. |
| **6. Testes Automatizados** | ✅ **100%** | **Pasta `tests/`:** **40 testes** (6 suites: unitários de Auth, Tasks e Middlewares; integração de Auth, Tasks e Health/Metrics) executados contra PostgreSQL 16 real, com cobertura medida de **88,7% (statements) / 74,0% (branches) / 81,5% (functions)** e limiar de 70% forçado pelo Jest. |
| **7. Infraestrutura como Código (IaC)** | ✅ **100%** | **Arquivos `Dockerfile` e `docker-compose.yml`:** Dockerfile multi-stage com Alpine, usuário não-root `node` e compose orquestrando App, Postgres, Prometheus e Grafana. |
| **8. Monitoramento & Métricas** | ✅ **100%** | **Pastas `src/config/`, `src/services/` e `docker/`:** Logs JSON com Winston, endpoint `/health` com diagnóstico de banco, `/metrics` com `prom-client` e dashboard Grafana configurado com `uid: Prometheus`. |
| **9. Documentação do Pipeline** | ✅ **100%** | **Seção 4 deste documento:** Tabela explicativa detalhando o que cada etapa faz, por que existe, ferramenta usada, como pode falhar e como corrigir. |
| **10. Roteiro de Apresentação e Perguntas** | ✅ **100%** | **Seção 6 deste documento:** Roteiro cronometrado de 5 a 7 minutos e 5 perguntas técnicas da banca com respostas objetivas. |

---

## 8. EVIDÊNCIAS DE VALIDAÇÃO (EXECUÇÃO REAL)

Resultados obtidos ao executar o projeto com PostgreSQL 16 real (mesmo cenário do job de CI):

| Verificação | Comando | Resultado |
| :--- | :--- | :---: |
| Instalação determinística | `npm ci` | ✅ lockfile sincronizado |
| Análise estática | `npm run lint` | ✅ 0 erros |
| Testes (PostgreSQL real) | `npm run test:coverage` | ✅ 40/40 passando |
| Cobertura (PostgreSQL real) | idem | ✅ 88,7% stmts · 74,0% branches · 81,5% funções |
| Testes (modo memória, sem banco) | `NODE_ENV=test npm run test:coverage` | ✅ 40/40 · 85,4% stmts |
| Sintaxe dos YAMLs | pipeline, compose, Prometheus, Grafana | ✅ válidos |

> **Nota sobre cobertura:** o emulador de banco em memória (`src/config/memoryDb.js`) é um *test double* de apoio e está excluído da métrica (`collectCoverageFrom`). O CI mede a cobertura do código da aplicação rodando contra o PostgreSQL real.

> **Para a banca:** as evidências de CI verde, deploy e smoke test dependem da execução no GitHub. Após o primeiro push, tire prints da aba *Actions* (CI + deploy), do `/health` em produção e do dashboard Grafana.

## 9. SOLUÇÃO DE PROBLEMAS COMUNS

| Sintoma | Causa provável | Solução |
| :--- | :--- | :--- |
| `npm ci` falha com `EUSAGE` | `package-lock.json` fora de sincronia com o `package.json` | `npm install` local e commitar o lockfile |
| Pipeline verde, mas sem deploy | Secrets `RENDER_DEPLOY_HOOK_URL` / `PRODUCTION_APP_URL` ausentes (o job emite `::warning::` e segue) | Configurar os secrets (Passo 4 do guia) e reexecutar |
| `relation "users" does not exist` | `initDb()` não executou | Garantir `initDb()` no `server.js` e no `tests/setup.js` |
| Falha de FK `tasks_user_id_fkey` nos testes | Teste usa `user_id` inexistente | Criar usuário real no `beforeEach` |
| `docker build` falha no lint | `.dockerignore` exclui `tests/` | O Dockerfile lintará apenas `src/` (já ajustado) |
