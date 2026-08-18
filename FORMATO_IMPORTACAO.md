# Formato oficial de importação

O sistema poderá importar arquivos `.xlsx` e `.csv`. A primeira linha deve conter exatamente os nomes das colunas abaixo.

Cada planilha também pode ser exportada pelo botão **Baixar XLSX**. O arquivo gerado usa a aba `lancamentos` e as mesmas colunas deste documento, ficando pronto para uma futura importação sem ajustes manuais.

## Colunas obrigatórias

| Coluna      | Formato              | Exemplo       | Regra                         |
| ----------- | -------------------- | ------------- | ----------------------------- |
| `data`      | `AAAA-MM-DD`         | `2026-08-18`  | Data do lançamento            |
| `descricao` | Texto                | `Mensalidade` | Identificação do lançamento   |
| `tipo`      | `entrada` ou `saida` | `entrada`     | Define receita ou gasto       |
| `valor`     | Número positivo      | `8500.00`     | Nunca usar sinal negativo     |
| `categoria` | Texto                | `Vendas`      | Classificação financeira      |
| `status`    | Status aceito        | `confirmado`  | Define o estado do lançamento |

## Colunas opcionais

| Coluna             | Formato | Exemplo    | Regra                                             |
| ------------------ | ------- | ---------- | ------------------------------------------------- |
| `observacao`       | Texto   | `Lucimar`  | Informação complementar                           |
| `planilha`         | Texto   | `Operação` | Nome da planilha de destino                       |
| `transferencia_id` | Texto   | `TRF-001`  | Liga saída e entrada de uma transferência interna |
| `ajuste_de`        | Texto   | `LAN-001`  | Referência de um lançamento corrigido             |

## Status aceitos

- `a confirmar`
- `pendente`
- `atrasado`
- `importante`
- `proximo de vencer`
- `confirmado`
- `pago`
- `cancelado`

## Exemplo CSV

```csv
data,descricao,tipo,valor,categoria,status,observacao,planilha,transferencia_id
2026-08-18,Receita de contrato,entrada,8500.00,Contratos,confirmado,Contrato 2026,Operação,
2026-08-18,Compra de material,saida,1300.00,Material,pago,Nota fiscal 245,Operação,
2026-08-19,Saldo compartilhado,entrada,500.00,Transferência interna,confirmado,Origem Operação,Projetos,TRF-001
2026-08-19,Transferência para Projetos,saida,500.00,Transferência interna,confirmado,Destino Projetos,Operação,TRF-001
```

## Regras da importação

- Valores devem ser positivos; o campo `tipo` define o sentido.
- Datas devem usar `AAAA-MM-DD` para não inverter dia e mês.
- Linhas inválidas devem ser rejeitadas com relatório; não devem ser adaptadas silenciosamente.
- Entradas com `transferencia_id` não devem duplicar o resultado consolidado.
- O arquivo original nunca deve ser alterado.
- A importação deve permitir escolher a planilha de destino quando a coluna `planilha` não existir.

## Excel

Uma planilha Excel pode ter várias abas. Recomendação: uma aba `lancamentos` com o formato acima. Abas auxiliares, como `categorias` e `contas`, podem ser adicionadas depois sem mudar o contrato dos lançamentos.
