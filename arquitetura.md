# 🏗️ ARQUITETURA DO SISTEMA

## Planilha Inteligente — Gestão de Gastos

> **Status:** Proposta Inicial
> **Natureza:** Documento Arquitetural
> **Governado por:** CONTRATO_DO_SISTEMA.md

---

## 1. PAPEL DESTE DOCUMENTO

Este documento descreve **como** o sistema será estruturado tecnicamente, **sem jamais violar** o que está definido no **CONTRATO_DO_SISTEMA.md**.

Ele existe para:

- Definir a arquitetura base do projeto
- Estabelecer responsabilidades claras entre camadas
- Guiar decisões técnicas e tecnológicas
- Servir como referência para auditoria arquitetural contínua

> Se houver conflito entre este documento e o contrato, **o contrato vence**.

---

## 2. VISÃO ARQUITETURAL GERAL

Arquitetura orientada a **domínio**, **estado explícito** e **derivação determinística**.

Camadas principais:

```
UI (Interface)
  ↓
Store (Estado)
  ↓
Domain (Regras puras)
  ↓
Infra (Persistência / IO)
```

Fluxo **obrigatório**:

```
UI → Store → Domain → Store → UI
```

Nenhuma camada pode pular a outra.

---

## 3. SEPARAÇÃO DE CAMADAS

### 3.1 UI (Interface do Usuário)

Responsável apenas por:

- Captura de intenção do usuário
- Renderização de estado
- Disparo de eventos

**Proibido:**

- Regra de negócio
- Cálculo financeiro
- Decisão de fluxo

Tecnologias candidatas:

- HTML + CSS (base)
- Framework reativo (futuro)

---

### 3.2 Store (Estado)

Responsável por:

- Manter o estado atual da aplicação
- Orquestrar chamadas ao domínio
- Garantir previsibilidade de mutações

Características:

- Estado explícito
- Mutação apenas via eventos
- Sem regra de negócio

---

### 3.3 Domain (Domínio)

O **coração do sistema**.

Responsável por:

- Regras de negócio
- Validações
- Geração de lançamentos
- Cálculos determinísticos

Características obrigatórias:

- Funções puras
- Sem dependência de UI
- Sem dependência de Infra

---

### 3.4 Infra (Infraestrutura)

Responsável por:

- Persistência (local ou remota)
- Leitura e escrita de arquivos
- Integração externa

Características:

- Adaptadores
- Nenhuma regra de domínio

---

## 4. TECNOLOGIAS E LINGUAGENS

### 4.1 Linguagem Principal

**TypeScript**

Justificativa:

- Continuidade natural do protótipo em JS
- Tipagem forte para domínio crítico
- Melhor auditabilidade
- Redução de erros silenciosos

> JavaScript puro é permitido apenas em protótipos isolados.

---

### 4.2 Frontend

Fase inicial:

- HTML
- CSS
- TypeScript puro (sem framework)

Fase de evolução (quando estabilizar domínio):

- Framework reativo (ex: React ou equivalente)

Critério de adoção:

- O domínio já estar sólido
- Nenhuma regra migrada para UI

---

### 4.3 Backend (futuro)

Opcional, não obrigatório na fase atual.

Candidatos:

- Node.js + TypeScript
- API orientada a eventos

O sistema **não depende** de backend para existir.

---

### 4.4 Persistência

Inicial:

- LocalStorage / IndexedDB (via adaptador)

Evolução:

- Banco relacional ou documental

Regra fixa:

- Infra apenas persiste lançamentos
- Nenhum dado derivado é salvo

### 4.5 Fechamento de períodos

Existem dois níveis de fechamento:

- **Planilha:** arquiva um intervalo específico em PDF e transporta apenas o saldo ou débito daquela planilha para o dia seguinte.
- **Geral:** fecha todas as planilhas no mesmo intervalo, gera um PDF consolidado e transporta um saldo de abertura separado para cada planilha.

Transferências internas são mantidas como movimentação entre planilhas e não podem duplicar o resultado geral.

O fechamento não apaga o histórico técnico: os dados do período permanecem referenciados no registro do fechamento e no PDF arquivado.

### 4.6 Importação de Excel e CSV

O formato oficial está em `FORMATO_IMPORTACAO.md`.

A importação deve aceitar `.xlsx` e `.csv`, validar as colunas obrigatórias e rejeitar linhas inválidas com relatório. A coluna `tipo` define entrada ou saída; `valor` permanece sempre positivo. Transferências usam `transferencia_id` para evitar duplicidade no consolidado.

---

## 5. ESTRUTURA DE PASTAS (PROPOSTA)

financeiro-pro/
│
├── docs/
│ ├── CONTRATO_DO_SISTEMA.md
│ ├── arquitetura.md
│ ├── decisoes-tecnicas.md
│ └── roadmap.md
│
├── index.html # Entrada do Vite (limpo, sem lógica)
├── public/ # Assets estáticos
│
├── src/
│ │
│ ├── domain/ # REGRA DE NEGÓCIO (núcleo)
│ │ ├── entities/
│ │ │ ├── Tabela.ts
│ │ │ ├── Lancamento.ts
│ │ │ └── Categoria.ts
│ │ │
│ │ ├── services/
│ │ │ ├── tabela.service.ts
│ │ │ ├── lancamento.service.ts
│ │ │ └── dashboard.service.ts
│ │ │
│ │ ├── validators/
│ │ │ └── lancamento.validator.ts
│ │ │
│ │ └── index.ts # Facade do domínio
│ │
│ ├── store/ # ESTADO GLOBAL
│ │ ├── store.ts
│ │ ├── actions.ts
│ │ ├── reducers.ts
│ │ └── selectors.ts
│ │
│ ├── ui/ # INTERFACE
│ │ ├── pages/
│ │ ├── components/
│ │ ├── renderers/
│ │ └── events/
│ │
│ ├── infra/ # IO / ADAPTADORES
│ │ ├── storage/
│ │ │ ├── localStorage.adapter.ts
│ │ │ └── indexedDB.adapter.ts
│ │ │
│ │ ├── export/
│ │ │ └── export.xlsx.ts
│ │ │
│ │ └── index.ts
│ │
│ ├── shared/ # UTILITÁRIOS PUROS
│ │ ├── money.ts
│ │ ├── dates.ts
│ │ └── ids.ts
│ │
│ └── main.ts # Bootstrap e composição da UI atual
│
├── tests/
│ ├── domain/
│ ├── store/
│ └── infra/
│
├── package.json
├── tsconfig.json
└── README.md

---

## 6. AUDITORIA ARQUITETURAL

Todo código deve ser auditável contra:

- CONTRATO_DO_SISTEMA.md
- Este documento

Pergunta obrigatória ao revisar qualquer arquivo:

> **Este código pertence mesmo a esta camada?**

Se a resposta não for óbvia, o código está no lugar errado.

---

## 7. EVOLUÇÃO

Este documento evolui quando:

- Uma decisão arquitetural se consolida
- Uma tecnologia é oficialmente adotada
- Um limite entre camadas é refinado

Refatorar este arquivo **é refatorar a arquitetura**.

---

## 8. DECLARAÇÃO FINAL

Este sistema prioriza:

- Clareza sobre velocidade
- Verdade sobre conveniência
- Estrutura sobre improviso

A arquitetura sustenta o contrato.
O contrato governa o sistema.
