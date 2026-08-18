import "./style.css";
import {
  calculateTotals,
  statusLabels,
  validateEntry,
  type Entry,
  type EntryStatus,
  type EntryType,
} from "./domain";
import { formatarMoeda as formatCurrency } from "./shared/money";
import { store } from "./store";
const app = document.querySelector<HTMLDivElement>("#app")!;
let view: "overview" | "ledger" = "overview";
let search = "";
let statusFilter: EntryStatus | "all" = "all";
const today = new Date().toISOString().slice(0, 10);
const activeLedger = () =>
  store
    .getState()
    .ledgers.find((ledger) => ledger.id === store.getState().activeLedgerId)!;
const icon = (value: string) =>
  `<span class="icon" aria-hidden="true">${value}</span>`;
function render() {
  const state = store.getState();
  const entries = state.ledgers.flatMap((ledger) => ledger.entries);
  const totals = calculateTotals(entries);
  app.innerHTML = `<div class="shell"><aside class="sidebar"><div class="brand">${icon("↗")} <span>fluxo<span class="accent">.</span></span></div><p class="eyebrow">Organização financeira</p><nav><button class="nav-link ${view === "overview" ? "active" : ""}" data-action="overview">${icon("◌")} Visão geral</button><p class="eyebrow nav-label">Minhas planilhas</p>${state.ledgers.map((ledger) => `<button class="nav-link ${view === "ledger" && ledger.id === state.activeLedgerId ? "active" : ""}" data-ledger="${ledger.id}"><i class="dot ${ledger.color}"></i>${ledger.name}<span class="nav-count">${ledger.entries.length}</span></button>`).join("")}</nav><button class="new-ledger" data-action="new-ledger">${icon("+")} Nova planilha</button><div class="sidebar-footer"><span class="avatar">FT</span><div><strong>Família Torres</strong><small>Espaço de trabalho</small></div></div></aside><main class="main-content"><header class="topbar"><div><p class="eyebrow">${view === "overview" ? "Panorama" : "Planilha ativa"}</p><h1>${view === "overview" ? "Visão geral" : activeLedger().name}</h1></div><div class="topbar-actions">${view === "ledger" ? `<button class="danger-outline" data-delete-ledger="${activeLedger().id}">${icon("⌫")} Excluir planilha</button>` : ""}<button class="primary" data-action="new-entry">${icon("+")} Novo lançamento</button></div></header>${view === "overview" ? renderOverview(totals, entries) : renderLedger()}</main></div><div id="modal-root"></div>`;
  bindEvents();
}
function renderOverview(
  totals: ReturnType<typeof calculateTotals>,
  entries: Entry[],
) {
  const month = calculateTotals(
    entries.filter((entry) => entry.date.slice(0, 7) === today.slice(0, 7)),
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
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 5);
  return `<section class="recent"><div class="section-heading"><div><p class="eyebrow">Atividade</p><h2>Últimos lançamentos</h2></div></div>${recent.length ? recent.map(renderEntryRow).join("") : '<div class="empty">Nenhum lançamento ainda. Comece registrando uma entrada ou um gasto.</div>'}</section>`;
}
function renderLedger() {
  const ledger = activeLedger();
  const totals = calculateTotals(ledger.entries);
  const filtered = ledger.entries
    .filter(
      (entry) =>
        entry.description.toLowerCase().includes(search.toLowerCase()) &&
        (statusFilter === "all" || entry.status === statusFilter),
    )
    .sort((a, b) => b.date.localeCompare(a.date));
  return `<section class="ledger-summary"><div><span class="eyebrow">Saldo da planilha</span><strong>${formatCurrency(totals.balance)}</strong></div><div><span>Entradas</span><b class="positive">${formatCurrency(totals.income)}</b></div><div><span>Gastos</span><b class="negative">${formatCurrency(totals.expense)}</b></div></section><div class="toolbar"><input id="search" value="${search}" placeholder="Buscar lançamento..."/><select id="status-filter"><option value="all">Todos os status</option>${Object.entries(
    statusLabels,
  )
    .map(
      ([value, label]) =>
        `<option value="${value}" ${statusFilter === value ? "selected" : ""}>${label}</option>`,
    )
    .join(
      "",
    )}</select></div><section class="entries">${filtered.length ? filtered.map(renderEntryRow).join("") : '<div class="empty">Nenhum lançamento corresponde aos filtros.</div>'}</section>`;
}
function renderEntryRow(entry: Entry) {
  return `<div class="entry-row"><div class="entry-mark ${entry.type}">${entry.type === "income" ? "+" : "−"}</div><div class="entry-main"><strong>${entry.description}</strong><span>${entry.category} · ${new Date(`${entry.date}T12:00:00`).toLocaleDateString("pt-BR")}</span></div><span class="status ${entry.status}">${statusLabels[entry.status]}</span><strong class="entry-value ${entry.type}">${entry.type === "income" ? "+" : "−"} ${formatCurrency(entry.amount)}</strong>${entry.status !== "paid" && entry.status !== "canceled" ? `<button class="icon-button" title="Marcar como pago" data-pay="${entry.id}">✓</button>` : ""}</div>`;
}
function showModal(kind: "entry" | "ledger") {
  const content =
    kind === "ledger"
      ? `<div class="modal"><button class="close" data-action="close-modal">×</button><p class="eyebrow">Nova estrutura</p><h2>Nova planilha</h2><form id="ledger-form"><label>Nome<input name="name" required placeholder="Ex.: Igreja, MEI, Casa"/></label><label>Descrição<input name="description" placeholder="Para que essa planilha será usada?"/></label><button class="primary" type="submit">Criar planilha ${icon("→")}</button></form></div>`
      : `<div class="modal"><button class="close" data-action="close-modal">×</button><p class="eyebrow">Novo registro</p><h2>Adicionar lançamento</h2><form id="entry-form"><div class="type-switch"><label><input type="radio" name="type" value="income" checked/> Entrada</label><label><input type="radio" name="type" value="expense"/> Gasto</label></div><label>Descrição<input name="description" required placeholder="Ex.: Mensalidade, fornecedor, oferta"/></label><div class="form-grid"><label>Valor<input name="amount" type="number" min="0.01" step="0.01" required placeholder="0,00"/></label><label>Data<input name="date" type="date" value="${today}" required/></label></div><label>Categoria<input name="category" required placeholder="Ex.: Vendas, pessoal, manutenção"/></label><label>Status<select name="status"><option value="planned">Planejado</option><option value="confirmed">Confirmado</option><option value="paid">Pago</option></select></label><label>Observação (opcional)<textarea name="notes" rows="2"></textarea></label><p class="form-error" id="form-error"></p><button class="primary" type="submit">Salvar lançamento ${icon("→")}</button></form></div>`;
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
    .querySelectorAll<HTMLElement>('[data-action="close-modal"]')
    .forEach((el) =>
      el.addEventListener("click", () => {
        document.querySelector("#modal-root")!.innerHTML = "";
      }),
    );
  document.querySelectorAll<HTMLElement>("[data-ledger]").forEach((el) =>
    el.addEventListener("click", () => {
      store.setActiveLedger(el.dataset.ledger!);
      view = "ledger";
      search = "";
      statusFilter = "all";
      render();
    }),
  );
  document.querySelectorAll<HTMLElement>("[data-pay]").forEach((el) =>
    el.addEventListener("click", () => {
      store.updateEntryStatus(el.dataset.pay!, "paid");
      render();
    }),
  );
  document
    .querySelector<HTMLFormElement>("#ledger-form")
    ?.addEventListener("submit", (event) => {
      event.preventDefault();
      const data = new FormData(event.target as HTMLFormElement);
      store.addLedger(
        String(data.get("name")),
        String(data.get("description")),
      );
      view = "ledger";
      render();
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
        store.addEntry(entry);
        view = "ledger";
        render();
      } catch (error) {
        document.querySelector("#form-error")!.textContent =
          error instanceof Error ? error.message : "Não foi possível salvar.";
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
}
render();
