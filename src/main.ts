import "./style.css";
import {
  calculatePendingTotals,
  calculateTotals,
  statusLabels,
  validateEntry,
  type Entry,
  type EntryStatus,
  type EntryType,
} from "./domain";
import { formatarMoeda as formatCurrency } from "./shared/money";
import { store } from "./store";
import {
  downloadLedgerXlsx,
  downloadPeriodPdf,
  parseLedgerXlsx,
} from "./infra";
const app = document.querySelector<HTMLDivElement>("#app")!;
let view: "overview" | "ledger" = "overview";
let search = "";
let statusFilter: EntryStatus | "all" = "all";
let typeFilter: EntryType | "all" = "all";
let displayMode: "list" | "table" = "list";
const hiddenHistoryEntries = new Set<string>();
const today = new Date().toISOString().slice(0, 10);
const activeLedger = () =>
  store
    .getState()
    .ledgers.find((ledger) => ledger.id === store.getState().activeLedgerId)!;
const icon = (value: string) =>
  `<span class="icon" aria-hidden="true">${value}</span>`;
store.subscribe(render);
function render() {
  const state = store.getState();
  const entries = state.ledgers.flatMap((ledger) => ledger.entries);
  const totals = calculateTotals(entries, { incluirTransferencias: false });
  app.innerHTML = `<div class="shell"><aside class="sidebar"><div class="brand">${icon("↗")} <span>fluxo<span class="accent">.</span></span></div><p class="eyebrow">Organização financeira</p><nav><button class="nav-link ${view === "overview" ? "active" : ""}" data-action="overview">${icon("◌")} Visão geral</button><p class="eyebrow nav-label">Minhas planilhas</p>${state.ledgers.map((ledger) => `<button class="nav-link ${view === "ledger" && ledger.id === state.activeLedgerId ? "active" : ""}" data-ledger="${ledger.id}"><i class="dot ${ledger.color}"></i>${ledger.name}<span class="nav-count">${ledger.entries.length}</span></button>`).join("")}</nav><button class="new-ledger" data-action="new-ledger">${icon("+")} Nova planilha</button><button class="new-ledger import-ledger" data-action="import-xlsx">${icon("↑")} Importar planilha</button><input id="xlsx-input" class="file-input-hidden" type="file" accept=".xlsx,.xls,.csv"/><div class="sidebar-footer"><span class="avatar">FT</span><div><strong>Família Torres</strong><small>Espaço de trabalho</small></div></div></aside><main class="main-content"><header class="topbar"><div><p class="eyebrow">${view === "overview" ? "Panorama" : "Planilha ativa"}</p><h1>${view === "overview" ? "Visão geral" : activeLedger().name}</h1></div><div class="topbar-actions">${view === "ledger" ? `<button class="secondary-button" data-action="close-period">${icon("↓")} Fechar período</button><button class="secondary-button" data-action="export-xlsx">${icon("↓")} Baixar XLSX</button><button class="secondary-button" data-edit-ledger="${activeLedger().id}">${icon("✎")} Editar planilha</button><button class="danger-outline" data-delete-ledger="${activeLedger().id}">${icon("⌫")} Excluir planilha</button>` : ""}<button class="primary" data-action="new-entry">${icon("+")} Novo lançamento</button></div></header>${view === "overview" ? renderOverview(totals, entries) : renderLedger()}</main></div><div id="modal-root"></div>`;
  bindEvents();
}
function renderOverview(
  totals: ReturnType<typeof calculateTotals>,
  entries: Entry[],
) {
  const month = calculateTotals(
    entries.filter((entry) => entry.date.slice(0, 7) === today.slice(0, 7)),
    { incluirTransferencias: false },
  );
  return `<section class="hero"><div><span class="hero-kicker">${new Date().toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}</span><h2>Seu dinheiro,<br><em>em movimento.</em></h2></div><p>Acompanhe entradas, gastos e decisões de todas as suas planilhas em um só lugar.</p></section><section class="metrics"><article><span>Saldo consolidado</span><strong class="balance">${formatCurrency(totals.balance)}</strong><small>de todas as planilhas</small></article><article><span>Entradas no mês</span><strong>${formatCurrency(month.income)}</strong><small class="positive">Receitas confirmadas e pagas</small></article><article><span>Gastos no mês</span><strong>${formatCurrency(month.expense)}</strong><small class="negative">Despesas confirmadas e pagas</small></article><article><span>Planilhas ativas</span><strong>${stateCount()}</strong><small>cada uma com seu contexto</small></article></section><section class="section-heading"><div><p class="eyebrow">Acesso rápido</p><h2>Suas planilhas</h2></div><button class="text-button" data-action="new-ledger">Criar planilha ${icon("→")}</button></section><div class="ledger-grid">${store.getState().ledgers.map(renderLedgerCard).join("")}</div>${renderRecent(entries)}`;
}
function stateCount() {
  return store.getState().ledgers.length;
}
function renderLedgerCard(ledger: ReturnType<typeof activeLedger>) {
  const totals = calculateTotals(ledger.entries);
  return `<article class="ledger-card" data-ledger="${ledger.id}" tabindex="0"><div class="card-top"><i class="dot ${ledger.color}"></i><span>${ledger.entries.length} lançamentos</span><button class="card-delete" title="Excluir ${ledger.name}" data-delete-ledger="${ledger.id}">×</button></div><h3>${ledger.name}</h3><p>${ledger.description || "Sem descrição"}</p><strong>${formatCurrency(totals.balance)}</strong><small>saldo atual</small></article>`;
}
function renderRecent(entries: Entry[]) {
  const recent = [...entries]
    .filter((entry) => !hiddenHistoryEntries.has(entry.id))
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 5);
  return `<section class="recent"><div class="section-heading"><div><p class="eyebrow">Atividade</p><h2>Últimos lançamentos</h2></div></div>${recent.length ? recent.map(renderEntryRow).join("") : '<div class="empty">Nenhum lançamento ainda. Comece registrando uma entrada ou um gasto.</div>'}</section>`;
}
function renderLedger() {
  const ledger = activeLedger();
  const totals = calculateTotals(ledger.entries);
  const pending = ledger.entries.filter((entry) => entry.status === "planned");
  const pendingTotals = calculatePendingTotals(ledger.entries);
  const filtered = ledger.entries
    .filter(
      (entry) =>
        !hiddenHistoryEntries.has(entry.id) &&
        entry.description.toLowerCase().includes(search.toLowerCase()) &&
        (statusFilter === "all" || entry.status === statusFilter) &&
        (typeFilter === "all" || entry.type === typeFilter),
    )
    .sort((a, b) => b.date.localeCompare(a.date));
  const statusOptions = Object.entries(statusLabels)
    .map(
      ([value, label]) =>
        `<option value="${value}" ${statusFilter === value ? "selected" : ""}>${label}</option>`,
    )
    .join("");
  const content = filtered.length
    ? displayMode === "table"
      ? renderEntryTable(filtered)
      : filtered.map(renderEntryRow).join("")
    : '<div class="empty">Nenhum lançamento corresponde aos filtros.</div>';
  const showHiddenButton = hiddenHistoryEntries.size
    ? `<button class="history-toggle" data-action="show-hidden">Mostrar ocultos (${hiddenHistoryEntries.size})</button>`
    : "";
  const canceledEntries = ledger.entries.filter(
    (entry) =>
      entry.status === "canceled" && !hiddenHistoryEntries.has(entry.id),
  );
  const hideCanceledButton = canceledEntries.length
    ? `<button class="history-toggle" data-action="hide-canceled">Ocultar cancelados (${canceledEntries.length})</button>`
    : "";
  return `<section class="ledger-summary"><div><span class="eyebrow">Saldo da planilha</span><strong>${formatCurrency(totals.balance)}</strong></div><div><span>Entradas</span><b class="positive">${formatCurrency(totals.income)}</b></div><div><span>Gastos</span><b class="negative">${formatCurrency(totals.expense)}</b></div></section>${renderPendingPanel(pending, pendingTotals)}<div class="toolbar"><input id="search" value="${search}" placeholder="Buscar lançamento..."/><select id="status-filter"><option value="all">Todos os status</option>${statusOptions}</select><select id="type-filter"><option value="all" ${typeFilter === "all" ? "selected" : ""}>Todos os tipos</option><option value="income" ${typeFilter === "income" ? "selected" : ""}>Entradas</option><option value="expense" ${typeFilter === "expense" ? "selected" : ""}>Saídas</option></select><div class="view-toggle" aria-label="Modo de visualização"><button class="${displayMode === "list" ? "active" : ""}" data-view-mode="list">Lista</button><button class="${displayMode === "table" ? "active" : ""}" data-view-mode="table">Tabela</button></div>${hideCanceledButton}${showHiddenButton}</div><section class="entries">${content}</section>`;
}
function renderPendingPanel(
  pending: Entry[],
  totals: ReturnType<typeof calculatePendingTotals>,
) {
  const content = pending.length
    ? `<div class="pending-list">${pending.map((entry) => `<div class="pending-item"><div><strong>${entry.description}</strong><small>${entry.category} · ${formatCurrency(entry.amount)}</small></div><button class="confirm-button" data-confirm-entry="${entry.id}">Confirmar</button></div>`).join("")}</div>`
    : `<p class="pending-empty">Nenhum lançamento aguardando confirmação.</p>`;
  return `<section class="pending-panel"><div class="pending-heading"><div><p class="eyebrow">Aguardando confirmação</p><h2>${totals.count} lançamento${totals.count === 1 ? "" : "s"} previsto${totals.count === 1 ? "" : "s"}</h2></div><span class="pending-total">${formatCurrency(totals.income - totals.expense)} previsto</span></div><div class="pending-metrics"><span class="positive">Entradas: ${formatCurrency(totals.income)}</span><span class="negative">Gastos: ${formatCurrency(totals.expense)}</span></div>${content}</section>`;
}
function renderEntryTable(entries: Entry[]) {
  return `<div class="table-scroll"><table class="entry-table"><thead><tr><th>Data</th><th>Descrição</th><th>Observação</th><th>Categoria</th><th>Tipo</th><th>Valor</th><th>Status</th><th>Ações</th></tr></thead><tbody>${entries.map((entry) => `<tr><td>${new Date(`${entry.date}T12:00:00`).toLocaleDateString("pt-BR")}</td><td><strong>${entry.description}</strong></td><td class="entry-notes">${entry.notes ? entry.notes : '<span class="muted-cell">Sem observação</span>'}</td><td>${entry.category}</td><td>${entry.type === "income" ? "Entrada" : "Gasto"}</td><td class="entry-value ${entry.type}">${entry.type === "income" ? "+" : "−"} ${formatCurrency(entry.amount)}</td><td><span class="status ${entry.status}">${statusLabels[entry.status]}</span></td><td class="table-actions">${entry.status !== "paid" && entry.status !== "canceled" ? `<button class="icon-button" title="Marcar como pago" data-pay="${entry.id}">✓</button>` : ""}${entry.status !== "canceled" ? `<button class="icon-button" title="Editar lançamento" data-edit-entry="${entry.id}">✎</button><button class="icon-button delete-entry" title="Excluir lançamento" data-delete-entry="${entry.id}">⌫</button>` : `<button class="icon-button" title="Ocultar do histórico" data-hide-entry="${entry.id}">×</button>`}</td></tr>`).join("")}</tbody></table></div>`;
}
function renderEntryRow(entry: Entry) {
  return `<div class="entry-row"><div class="entry-mark ${entry.type}">${entry.type === "income" ? "+" : "−"}</div><div class="entry-main"><strong>${entry.description}</strong><span>${entry.category} · ${new Date(`${entry.date}T12:00:00`).toLocaleDateString("pt-BR")}</span>${entry.notes ? `<small class="entry-note-list">Observação: ${entry.notes}</small>` : ""}</div><span class="status ${entry.status}">${statusLabels[entry.status]}</span><strong class="entry-value ${entry.type}">${entry.type === "income" ? "+" : "−"} ${formatCurrency(entry.amount)}</strong>${entry.status !== "paid" && entry.status !== "canceled" ? `<button class="icon-button" title="Marcar como pago" data-pay="${entry.id}">✓</button>` : ""}${entry.status !== "canceled" ? `<button class="icon-button" title="Editar lançamento" data-edit-entry="${entry.id}">✎</button><button class="icon-button delete-entry" title="Excluir lançamento" data-delete-entry="${entry.id}">⌫</button>` : `<button class="icon-button" title="Ocultar do histórico" data-hide-entry="${entry.id}">×</button>`}</div>`;
}
function renderLedgerForm(ledger?: ReturnType<typeof activeLedger>) {
  if (ledger) {
    return `<div class="modal"><button class="close" data-action="close-modal">×</button><p class="eyebrow">Configuração</p><h2>Editar planilha</h2><form id="ledger-form" data-editing-ledger="${ledger.id}"><label>Nome<input name="name" required value="${ledger.name}"/></label><label>Descrição<input name="description" value="${ledger.description}"/></label><p class="form-error" id="ledger-form-error"></p><button class="primary" type="submit">Salvar alterações ${icon("→")}</button></form></div>`;
  }
  const ledgers = store.getState().ledgers;
  const sourceOptions = ledgers
    .map((ledger) => `<option value="${ledger.id}">${ledger.name}</option>`)
    .join("");
  return `<div class="modal"><button class="close" data-action="close-modal">×</button><p class="eyebrow">Nova estrutura</p><h2>Nova planilha</h2><form id="ledger-form"><label>Nome<input name="name" required placeholder="Ex.: Igreja, MEI, Casa"/></label><label>Descrição<input name="description" placeholder="Para que essa planilha será usada?"/></label><label>Origem dos valores<select name="fundingMode"><option value="new">Nova entrada</option><option value="shared">Compartilhar saldo existente</option></select></label><p class="form-help">Nova entrada cria dinheiro novo no consolidado. Saldo compartilhado apenas redistribui um valor já existente entre planilhas.</p><div class="shared-fields"><label>Planilha de origem<select name="sourceLedger">${sourceOptions}</select></label><label>Valor compartilhado<input name="sharedAmount" type="number" min="0.01" step="0.01" placeholder="0,00"/></label></div><p class="form-error" id="ledger-form-error"></p><button class="primary" type="submit">Criar planilha ${icon("→")}</button></form></div>`;
}
function renderClosureForm() {
  const firstDay = new Date();
  firstDay.setDate(1);
  return `<div class="modal"><button class="close" data-action="close-modal">×</button><p class="eyebrow">Arquivo e transporte</p><h2>Fechar período</h2><p class="form-help">Os lançamentos do intervalo serão baixados em PDF. Depois, apenas o saldo ou débito efetivo será transportado para o próximo período.</p><form id="closure-form"><div class="form-grid"><label>Data inicial<input name="startDate" type="date" value="${firstDay.toISOString().slice(0, 10)}" required/></label><label>Data final<input name="endDate" type="date" value="${today}" required/></label></div><p class="form-error" id="closure-form-error"></p><button class="primary" type="submit">Baixar PDF e fechar ${icon("→")}</button></form></div>`;
}
function showModal(
  kind: "entry" | "ledger" | "closure",
  entry?: Entry,
  ledger?: ReturnType<typeof activeLedger>,
) {
  const content =
    kind === "closure"
      ? renderClosureForm()
      : kind === "ledger"
        ? renderLedgerForm(ledger)
        : `<div class="modal"><button class="close" data-action="close-modal">×</button><p class="eyebrow">${entry ? "Correção de histórico" : "Novo registro"}</p><h2>${entry ? "Editar lançamento" : "Adicionar lançamento"}</h2><form id="entry-form" data-correction-entry="${entry?.id ?? ""}"><div class="type-switch"><label><input type="radio" name="type" value="income" ${entry?.type !== "expense" ? "checked" : ""}/> Entrada</label><label><input type="radio" name="type" value="expense" ${entry?.type === "expense" ? "checked" : ""}/> Gasto</label></div><label>Descrição<input name="description" required value="${entry?.description ?? ""}" placeholder="Ex.: Mensalidade, fornecedor, oferta"/></label><div class="form-grid"><label>Valor<input name="amount" type="number" min="0.01" step="0.01" required value="${entry?.amount ?? ""}" placeholder="0,00"/></label><label>Data<input name="date" type="date" value="${entry?.date ?? today}" required/></label></div><label>Categoria<input name="category" required value="${entry?.category ?? ""}" placeholder="Ex.: Vendas, pessoal, manutenção"/></label><label>Status<select name="status"><option value="confirmed" ${entry?.status === "confirmed" || !entry ? "selected" : ""}>Confirmado</option><option value="planned" ${entry?.status === "planned" ? "selected" : ""}>A confirmar</option><option value="pending" ${entry?.status === "pending" ? "selected" : ""}>Pendente</option><option value="overdue" ${entry?.status === "overdue" ? "selected" : ""}>Atrasado</option><option value="important" ${entry?.status === "important" ? "selected" : ""}>Importante</option><option value="dueSoon" ${entry?.status === "dueSoon" ? "selected" : ""}>Próximo de vencer</option><option value="paid" ${entry?.status === "paid" ? "selected" : ""}>Pago</option><option value="canceled" ${entry?.status === "canceled" ? "selected" : ""}>Cancelado</option></select></label><label>Observação (opcional)<textarea name="notes" rows="2">${entry?.notes ?? ""}</textarea></label><p class="form-error" id="form-error"></p><button class="primary" type="submit">${entry ? "Salvar correção" : "Salvar lançamento"} ${icon("→")}</button></form></div>`;
  document.querySelector<HTMLDivElement>("#modal-root")!.innerHTML =
    `<div class="modal-backdrop">${content}</div>`;
  bindEvents();
}
function bindEvents() {
  document
    .querySelectorAll<HTMLElement>('[data-action="overview"]')
    .forEach((el) =>
      el.addEventListener("click", () => {
        view = "overview";
        render();
      }),
    );
  document
    .querySelectorAll<HTMLElement>('[data-action="new-entry"]')
    .forEach((el) => el.addEventListener("click", () => showModal("entry")));
  document
    .querySelectorAll<HTMLElement>('[data-action="new-ledger"]')
    .forEach((el) => el.addEventListener("click", () => showModal("ledger")));
  document
    .querySelectorAll<HTMLElement>('[data-action="import-xlsx"]')
    .forEach((el) =>
      el.addEventListener("click", () =>
        document.querySelector<HTMLInputElement>("#xlsx-input")?.click(),
      ),
    );
  document
    .querySelector<HTMLInputElement>("#xlsx-input")
    ?.addEventListener("change", async (event) => {
      const input = event.target as HTMLInputElement;
      const file = input.files?.[0];
      if (!file) return;
      try {
        const entries = await parseLedgerXlsx(file);
        store.addEntries(entries);
        window.alert(
          `${entries.length} lançamento(s) importado(s) para a planilha ativa.`,
        );
        render();
      } catch (error) {
        window.alert(
          error instanceof Error
            ? error.message
            : "Não foi possível importar a planilha.",
        );
      } finally {
        input.value = "";
      }
    });
  document
    .querySelectorAll<HTMLElement>('[data-action="close-period"]')
    .forEach((el) => el.addEventListener("click", () => showModal("closure")));
  document
    .querySelectorAll<HTMLElement>('[data-action="export-xlsx"]')
    .forEach((el) =>
      el.addEventListener("click", () => downloadLedgerXlsx(activeLedger())),
    );
  document.querySelectorAll<HTMLElement>("[data-edit-ledger]").forEach((el) =>
    el.addEventListener("click", (event) => {
      event.stopPropagation();
      const ledger = store
        .getState()
        .ledgers.find((item) => item.id === el.dataset.editLedger);
      if (ledger) showModal("ledger", undefined, ledger);
    }),
  );
  document
    .querySelectorAll<HTMLElement>('[data-action="close-modal"]')
    .forEach((el) =>
      el.addEventListener("click", () => {
        document.querySelector("#modal-root")!.innerHTML = "";
      }),
    );
  document
    .querySelector<HTMLSelectElement>('[name="fundingMode"]')
    ?.addEventListener("change", (event) => {
      const shared = (event.target as HTMLSelectElement).value === "shared";
      document
        .querySelector<HTMLElement>(".shared-fields")
        ?.classList.toggle("visible", shared);
    });
  document.querySelectorAll<HTMLElement>("[data-ledger]").forEach((el) =>
    el.addEventListener("click", () => {
      store.setActiveLedger(el.dataset.ledger!);
      view = "ledger";
      search = "";
      statusFilter = "all";
      typeFilter = "all";
      render();
    }),
  );
  document.querySelectorAll<HTMLElement>("[data-pay]").forEach((el) =>
    el.addEventListener("click", () => {
      store.updateEntryStatus(el.dataset.pay!, "paid");
      render();
    }),
  );
  document.querySelectorAll<HTMLElement>("[data-confirm-entry]").forEach((el) =>
    el.addEventListener("click", () => {
      store.updateEntryStatus(el.dataset.confirmEntry!, "confirmed");
      render();
    }),
  );
  document.querySelectorAll<HTMLElement>("[data-delete-entry]").forEach((el) =>
    el.addEventListener("click", (event) => {
      event.stopPropagation();
      const entryId = el.dataset.deleteEntry!;
      const entry = store
        .getState()
        .ledgers.flatMap((ledger) => ledger.entries)
        .find((item) => item.id === entryId);
      if (
        !entry ||
        !window.confirm(`Excluir o lançamento "${entry.description}"?`)
      )
        return;
      store.updateEntryStatus(entryId, "canceled");
      render();
    }),
  );
  document.querySelectorAll<HTMLElement>("[data-hide-entry]").forEach((el) =>
    el.addEventListener("click", (event) => {
      event.stopPropagation();
      hiddenHistoryEntries.add(el.dataset.hideEntry!);
      render();
    }),
  );
  document.querySelectorAll<HTMLElement>("[data-edit-entry]").forEach((el) =>
    el.addEventListener("click", (event) => {
      event.stopPropagation();
      const entry = store
        .getState()
        .ledgers.flatMap((ledger) => ledger.entries)
        .find((item) => item.id === el.dataset.editEntry);
      if (entry) showModal("entry", entry);
    }),
  );
  document.querySelectorAll<HTMLElement>("[data-delete-ledger]").forEach((el) =>
    el.addEventListener("click", (event) => {
      event.stopPropagation();
      const ledgerId = el.dataset.deleteLedger!;
      const ledger = store
        .getState()
        .ledgers.find((item) => item.id === ledgerId);
      if (
        !ledger ||
        !window.confirm(
          `Excluir a planilha "${ledger.name}" e seus lançamentos?`,
        )
      )
        return;
      try {
        store.deleteLedger(ledgerId);
        view = "overview";
        search = "";
        statusFilter = "all";
        render();
      } catch (error) {
        window.alert(
          error instanceof Error
            ? error.message
            : "Não foi possível excluir a planilha.",
        );
      }
    }),
  );
  document.querySelectorAll<HTMLElement>("[data-view-mode]").forEach((el) =>
    el.addEventListener("click", () => {
      displayMode = el.dataset.viewMode as "list" | "table";
      render();
    }),
  );
  document
    .querySelectorAll<HTMLElement>('[data-action="show-hidden"]')
    .forEach((el) =>
      el.addEventListener("click", () => {
        hiddenHistoryEntries.clear();
        render();
      }),
    );
  document
    .querySelectorAll<HTMLElement>('[data-action="hide-canceled"]')
    .forEach((el) =>
      el.addEventListener("click", () => {
        const canceledIds = activeLedger()
          .entries.filter((entry) => entry.status === "canceled")
          .map((entry) => entry.id);
        canceledIds.forEach((id) => hiddenHistoryEntries.add(id));
        render();
      }),
    );
  document
    .querySelector<HTMLFormElement>("#ledger-form")
    ?.addEventListener("submit", (event) => {
      event.preventDefault();
      const data = new FormData(event.target as HTMLFormElement);
      try {
        const editLedgerId = (event.target as HTMLFormElement).dataset
          .editingLedger;
        if (editLedgerId) {
          store.updateLedger(
            editLedgerId,
            String(data.get("name")),
            String(data.get("description")),
          );
        } else {
          const shared = String(data.get("fundingMode")) === "shared";
          store.addLedger(
            String(data.get("name")),
            String(data.get("description")),
            shared
              ? {
                  ledgerId: String(data.get("sourceLedger")),
                  amount: Number(data.get("sharedAmount")),
                }
              : undefined,
          );
        }
        view = "ledger";
        render();
      } catch (error) {
        document.querySelector("#ledger-form-error")!.textContent =
          error instanceof Error
            ? error.message
            : "Não foi possível criar a planilha.";
      }
    });
  document
    .querySelector<HTMLFormElement>("#entry-form")
    ?.addEventListener("submit", (event) => {
      event.preventDefault();
      const data = new FormData(event.target as HTMLFormElement);
      const entry = {
        description: String(data.get("description")),
        type: String(data.get("type")) as EntryType,
        amount: Number(data.get("amount")),
        category: String(data.get("category")),
        date: String(data.get("date")),
        status: String(data.get("status")) as EntryStatus,
        notes: String(data.get("notes")),
      };
      try {
        validateEntry(entry);
        const editEntryId = (event.target as HTMLFormElement).dataset
          .correctionEntry;
        if (editEntryId) {
          store.correctEntry(editEntryId, entry);
        } else {
          store.addEntry(entry);
        }
        view = "ledger";
        render();
      } catch (error) {
        document.querySelector("#form-error")!.textContent =
          error instanceof Error ? error.message : "Não foi possível salvar.";
      }
    });
  document
    .querySelector<HTMLFormElement>("#closure-form")
    ?.addEventListener("submit", (event) => {
      event.preventDefault();
      const data = new FormData(event.target as HTMLFormElement);
      const startDate = String(data.get("startDate"));
      const endDate = String(data.get("endDate"));
      const ledger = activeLedger();
      const periodEntries = ledger.entries.filter(
        (entry) => entry.date >= startDate && entry.date <= endDate,
      );
      try {
        if (!periodEntries.length)
          throw new Error("Não existem lançamentos neste período.");
        const effective = periodEntries.filter(
          (entry) => entry.status === "confirmed" || entry.status === "paid",
        );
        const income = effective
          .filter((entry) => entry.type === "income")
          .reduce((total, entry) => total + entry.amount, 0);
        const expense = effective
          .filter((entry) => entry.type === "expense")
          .reduce((total, entry) => total + entry.amount, 0);
        const pdfFileName = downloadPeriodPdf(
          ledger,
          periodEntries,
          startDate,
          endDate,
          {
            income,
            expense,
            balance: income - expense,
          },
        );
        store.closePeriod(ledger.id, startDate, endDate, pdfFileName);
        render();
      } catch (error) {
        document.querySelector("#closure-form-error")!.textContent =
          error instanceof Error
            ? error.message
            : "Não foi possível fechar o período.";
      }
    });
  document
    .querySelector<HTMLInputElement>("#search")
    ?.addEventListener("input", (event) => {
      search = (event.target as HTMLInputElement).value;
      render();
    });
  document
    .querySelector<HTMLSelectElement>("#status-filter")
    ?.addEventListener("change", (event) => {
      statusFilter = (event.target as HTMLSelectElement).value as
        | EntryStatus
        | "all";
      render();
    });
  document
    .querySelector<HTMLSelectElement>("#type-filter")
    ?.addEventListener("change", (event) => {
      typeFilter = (event.target as HTMLSelectElement).value as
        | EntryType
        | "all";
      render();
    });
}
render();
