<!--
CONTRATO_DO_SISTEMA.md — Contrato Arquitetural e de Regras de Negócio
Versão: 1.0.0
Aplicação: Planilha Inteligente — Gestão de Gastos

Autor: Ruyter Torres
GitHub: https://github.com/ruytertorres
LinkedIn: https://www.linkedin.com/in/ruytertorres
Email: ruytertorres.gmail.com

RESPONSABILIDADE:
- Definir as regras absolutas do sistema
- Governar decisões arquiteturais e de domínio
- Estabelecer limites claros entre UI, domínio e infraestrutura
- Servir como fonte única de verdade conceitual do produto

NÃO É RESPONSABILIDADE DESTE ARQUIVO:
- Implementar código
- Decidir detalhes visuais
- Definir tecnologias específicas
- Resolver casos de uso pontuais

PRINCÍPIOS / CONTRATOS:
- A tabela é a alma do sistema
- Fonte única da verdade
- Imutabilidade de lançamentos
- UI como reflexo, nunca motor
- Clareza > automação
-->

# 🧠 CONTRATO DO SISTEMA  
## Planilha Inteligente — Gestão de Gastos

> **Status:** Ativo  
> **Natureza:** Contrato governante  
> **Escopo:** Domínio • Estado • UI • Infraestrutura  

---

## 1. PRINCÍPIO FUNDAMENTAL — A ALMA

> **A tabela é a fonte única da verdade.**

Nada existe no sistema sem se materializar como um **lançamento persistente**.

- Não existe saldo salvo  
- Não existe resumo salvo  
- Não existe gráfico salvo  

Tudo é **derivado**, **reprocessável** e **determinístico**.

---

## 2. ENTIDADE CENTRAL — LANÇAMENTO (ENTRY)

### Definição

Um lançamento é:
- atômico  
- imutável em valor  
- autoexplicativo  
- auditável  

### Regras

- Alterações **não modificam** lançamentos existentes  
- Correções geram **novos lançamentos de ajuste**  
- Histórico nunca é perdido  

> O sistema não edita o passado. Ele adiciona verdade.

---

## 3. STATUS E GOVERNANÇA TEMPORAL

### Estados permitidos

planned → confirmed → paid
↘ canceled


### Regras

- `canceled` ≠ deletado  
- Apenas `confirmed` e `paid` impactam cálculos  
- Status controla **impacto**, não existência  

---

## 4. DATA, PERÍODO E QUINZENA

> **Nenhum período é manual.**

- Quinzena, mês e ano são **sempre derivados da data**
- Alterar a data altera automaticamente o contexto
- Nunca existe duplicidade temporal

---

## 5. PARCELAMENTO

### Princípio

Parcelamento **gera lançamentos**, não divide valores.

### Regras

- Existe um lançamento pai (referência)
- Existem N lançamentos filhos
- Apenas filhos impactam cálculos
- Soma das parcelas = valor total

O lançamento pai **nunca** entra em totais financeiros.

---

## 6. RECORRÊNCIA

> **Recorrência não cria futuro infinito.**

### Funcionamento

- Existe apenas o lançamento atual
- Ao ser pago → o próximo é gerado
- Cancelamento interrompe a cadeia

---

## 7. CATEGORIAS E CONTAS

- Categorias **classificam**, não decidem  
- Contas **agrupam**, não calculam  

Saldo de qualquer entidade é **sempre derivado da tabela**.

---

## 8. CÁLCULOS

> **Cálculo nunca escreve dados.**

- Recebem dados
- Retornam resultados
- Nunca persistem estado

Cálculos são funções puras e determinísticas.

---

## 9. CONTRATO DA UI

### A interface PODE

- informar  
- perguntar  
- exibir estado  

### A interface NÃO PODE

- calcular regras  
- decidir fluxo de negócio  
- interpretar domínio  

> **UI é reflexo. Nunca motor.**

Fluxo obrigatório:

UI → Store → Domain → Store → UI


---

## 10. CONTRATO DE IMPLEMENTAÇÃO

É **obrigatório**:

- Nenhuma regra de domínio na UI  
- Nenhuma lógica duplicada  
- Nenhuma adaptação silenciosa  
- Nenhum reset ambíguo  
- Nenhum cálculo persistente  
- Nenhuma mutação sem evento explícito  
- Nenhuma lógica temporal fora de `geradorDatas.ts`  

**Toda violação exige refatoração imediata.**

---

## 11. CABEÇALHOS E COMENTÁRIOS  
### Contrato Arquitetural de Código

### 11.1 Cabeçalho obrigatório

Todo arquivo de **domínio, serviço ou orquestração**  
DEVE iniciar com:

```ts
/*
nomeDoArquivo.ts — Papel claro e inequívoco
Versão: X.Y.Z
Aplicação: Planilha Inteligente

Autor: Ruyter Torres
GitHub: https://github.com/ruytertorres
LinkedIn: https://www.linkedin.com/in/ruytertorres
Email: ruytertorres.gmail.com

RESPONSABILIDADE:
- O que ESTE arquivo faz
- O que ELE é dono
- O que ELE garante

NÃO É RESPONSABILIDADE DESTE ARQUIVO:
- O que explicitamente NÃO pode fazer
- Onde essa responsabilidade vive

PRINCÍPIOS / CONTRATOS:
- Regras arquiteturais obedecidas
- Dependências permitidas
- Dependências proibidas
*/
Se algo não cabe nesse cabeçalho, o arquivo viola responsabilidade única.

11.2 Blocos de seção
Usados apenas para organização conceitual:

/*
NOME DA SEÇÃO
*/
Indicados para:

Tipos

Constantes

API pública

Regras de negócio

Fluxos de controle

Separação estética é proibida.

11.3 Sub-blocos
Usados para decisões não triviais:

/*
VALIDAÇÕES ESTRUTURAIS
*/
11.4 Comentários de função
/**
 * O que o método garante
 *
 * @param tipo nome - Regra do parâmetro
 * @returns tipo - Garantia de retorno
 * @throws Quando falha e por quê
 */
Comentário explica o quê, nunca como.

11.5 Comentários internos
Permitidos apenas para decisões não triviais:

// MÉTODO BULLETPROOF: criar data ao meio-dia para evitar fuso
11.6 Regra-mãe
Comentário existe para declarar:

intenção

contrato

limite arquitetural

Comentário correto continua válido mesmo se o código mudar.

12. EVOLUÇÃO DO DOCUMENTO
Este documento é vivo, porém controlado.

Ele evolui quando:

regras são consolidadas

contratos são descobertos

ambiguidades são eliminadas

Refatorar este documento é refatorar o sistema inteiro.

13. DECLARAÇÃO FINAL
Este sistema é orientado por:

verdade temporal

clareza de decisão

continuidade honesta

O código muda.
O contrato governa.