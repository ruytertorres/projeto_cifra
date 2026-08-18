// ========== SISTEMA DE TEMA ==========
function alternarTema() {
  const currentTheme = localStorage.getItem("theme") || "light";
  const newTheme = currentTheme === "light" ? "dark" : "light";
  mudarTema(newTheme);
}

function mudarTema(tema) {
  localStorage.setItem("theme", tema);
  document.documentElement.setAttribute("data-theme", tema);
  atualizarIconeTema(tema);
}

function atualizarIconeTema(tema) {
  const icon = document.getElementById("theme-icon");
  icon.className = tema === "dark" ? "bi bi-sun" : "bi bi-moon";
}

// Inicializar tema
const savedTheme = localStorage.getItem("theme") || "light";
mudarTema(savedTheme);

// ========== SISTEMA DE TABELAS ==========
let tabelas = JSON.parse(localStorage.getItem("tabelasFinanceiras")) || [
  {
    id: 1,
    nome: "MEI",
    descricao: "Controle financeiro do MEI",
    cor: "mei",
    moeda: "BRL",
    criadoEm: new Date().toISOString(),
    lancamentos: [
      {
        id: 1,
        tipo: "DESPESA",
        descricao: "DAS Mensal",
        valor: 67.9,
        categoria: "FIXO",
        data: "2024-01-10",
        status: "PENDENTE",
        prioridade: "ALTA",
      },
      {
        id: 2,
        tipo: "RECEITA",
        descricao: "Venda Produto",
        valor: 1500,
        categoria: "RECEITA",
        data: "2024-01-05",
        status: "PAGO",
        prioridade: "ALTA",
      },
      {
        id: 3,
        tipo: "DESPESA",
        descricao: "Material Escritório",
        valor: 89.5,
        categoria: "VARIAVEL",
        data: "2024-01-03",
        status: "PAGO",
        prioridade: "MEDIA",
      },
    ],
  },
  {
    id: 2,
    nome: "Pessoal",
    descricao: "Gastos pessoais e familiares",
    cor: "pessoal",
    moeda: "BRL",
    criadoEm: new Date().toISOString(),
    lancamentos: [
      {
        id: 1,
        tipo: "DESPESA",
        descricao: "Supermercado",
        valor: 450.8,
        categoria: "VARIAVEL",
        data: "2024-01-08",
        status: "PAGO",
        prioridade: "ALTA",
      },
      {
        id: 2,
        tipo: "DESPESA",
        descricao: "Aluguel",
        valor: 1200,
        categoria: "FIXO",
        data: "2024-01-05",
        status: "PENDENTE",
        prioridade: "URGENTE",
      },
      {
        id: 3,
        tipo: "RECEITA",
        descricao: "Salário",
        valor: 3500,
        categoria: "RECEITA",
        data: "2024-01-05",
        status: "PAGO",
        prioridade: "ALTA",
      },
    ],
  },
  {
    id: 3,
    nome: "Compras Semanais",
    descricao: "Controle de compras semanais",
    cor: "compras",
    moeda: "BRL",
    criadoEm: new Date().toISOString(),
    lancamentos: [
      {
        id: 1,
        tipo: "DESPESA",
        descricao: "Feira Semanal",
        valor: 180.3,
        categoria: "VARIAVEL",
        data: "2024-01-09",
        status: "PAGO",
        prioridade: "MEDIA",
      },
      {
        id: 2,
        tipo: "DESPESA",
        descricao: "Farmácia",
        valor: 65.9,
        categoria: "SAUDE",
        data: "2024-01-07",
        status: "PAGO",
        prioridade: "ALTA",
      },
    ],
  },
];

let tabelaAtual = null;
let corSelecionada = "mei";

// ========== DROPDOWN COM NAVBAR FLEXÍVEL ==========
function toggleSistemaMenu(event) {
  event.stopPropagation();
  const dropdown = event.currentTarget.closest(".nav-dropdown");
  const submenu = document.getElementById("submenu-sistema");
  const section = document.getElementById("section-sistema");

  const isOpen = dropdown.classList.contains("open");

  // Fechar todos os dropdowns primeiro
  document.querySelectorAll(".nav-dropdown.open").forEach((item) => {
    if (item !== dropdown) {
      item.classList.remove("open");
      const otherSubmenu = item.nextElementSibling;
      if (otherSubmenu && otherSubmenu.classList.contains("nav-submenu")) {
        otherSubmenu.classList.remove("open");
      }
      const otherSection = item.closest(".nav-section");
      if (otherSection) {
        otherSection.classList.remove("expanding");
      }
    }
  });

  // Alternar estado atual
  dropdown.classList.toggle("open");
  submenu.classList.toggle("open");
  section.classList.toggle("expanding");

  // Scroll automático para mostrar o dropdown expandido
  if (!isOpen) {
    setTimeout(() => {
      const navContainer = document.getElementById("navScrollContainer");
      if (navContainer && submenu) {
        // Calcular a posição do submenu
        const submenuRect = submenu.getBoundingClientRect();
        const containerRect = navContainer.getBoundingClientRect();

        // Se o submenu está parcialmente fora da viewport
        if (submenuRect.bottom > containerRect.bottom) {
          const scrollAmount = submenuRect.bottom - containerRect.bottom + 20;
          navContainer.scrollBy({
            top: scrollAmount,
            behavior: "smooth",
          });
        }
      }
    }, 300); // Delay para esperar a animação do dropdown
  }
}

// Fechar dropdown ao clicar fora
document.addEventListener("click", function (event) {
  if (
    !event.target.closest(".nav-dropdown") &&
    !event.target.closest(".nav-submenu")
  ) {
    const dropdown = document.querySelector(".nav-dropdown.open");
    if (dropdown) {
      dropdown.classList.remove("open");
      const submenu = dropdown.nextElementSibling;
      if (submenu && submenu.classList.contains("nav-submenu")) {
        submenu.classList.remove("open");
      }
      const section = dropdown.closest(".nav-section");
      if (section) {
        section.classList.remove("expanding");
      }
    }
  }
});

// ========== FUNÇÕES DE NAVEGAÇÃO ==========
function abrirVisaoGeral() {
  document.title = "Planilha Inteligente | Visão Geral";
  document.getElementById("page-main-title").textContent = "Visão Geral";
  document.getElementById("page-subtitle").textContent =
    "Panorama completo de todas as suas finanças";
  document.getElementById("btn-novo-lancamento").style.display = "flex";

  const conteudo = document.getElementById("conteudo-dinamico");
  const template = document
    .getElementById("template-visao-geral")
    .content.cloneNode(true);
  conteudo.innerHTML = "";
  conteudo.appendChild(template);

  atualizarVisaoGeral();
  atualizarNavegacaoAtiva("visao-geral");

  // Fechar dropdown se estiver aberto
  fecharDropdownSistema();
}

function abrirTabela(id) {
  tabelaAtual = tabelas.find((t) => t.id === id);
  if (!tabelaAtual) return;

  document.title = `Planilha Inteligente | ${tabelaAtual.nome}`;
  document.getElementById("page-main-title").textContent = tabelaAtual.nome;
  document.getElementById("page-subtitle").textContent = tabelaAtual.descricao;
  document.getElementById("btn-novo-lancamento").style.display = "flex";

  const conteudo = document.getElementById("conteudo-dinamico");
  const template = document
    .getElementById("template-tabela-individual")
    .content.cloneNode(true);
  conteudo.innerHTML = "";
  conteudo.appendChild(template);

  // Configurar a tabela
  document.getElementById("tabela-nome").textContent = tabelaAtual.nome;
  document.getElementById("tabela-descricao").textContent =
    tabelaAtual.descricao;
  document.getElementById(
    "tabela-avatar"
  ).className = `tabela-avatar ${tabelaAtual.cor}`;
  document.getElementById(
    "tabela-avatar"
  ).innerHTML = `<i class="bi bi-table"></i>`;

  renderLancamentosTabela();
  atualizarNavegacaoAtiva("tabela-" + id);

  // Fechar dropdown se estiver aberto
  fecharDropdownSistema();
}

function abrirTodasTabelas() {
  document.title = "Planilha Inteligente | Todas as Tabelas";
  document.getElementById("page-main-title").textContent = "Todas as Tabelas";
  document.getElementById("page-subtitle").textContent =
    "Gerencie todas as suas planilhas financeiras";
  document.getElementById("btn-novo-lancamento").style.display = "none";

  const conteudo = document.getElementById("conteudo-dinamico");
  const template = document
    .getElementById("template-todas-tabelas")
    .content.cloneNode(true);
  conteudo.innerHTML = "";
  conteudo.appendChild(template);

  renderTodasTabelas();
  atualizarNavegacaoAtiva("todas-tabelas");

  // Fechar dropdown se estiver aberto
  fecharDropdownSistema();
}

function fecharDropdownSistema() {
  const dropdown = document.querySelector(".nav-dropdown.open");
  if (dropdown) {
    dropdown.classList.remove("open");
    const submenu = dropdown.nextElementSibling;
    if (submenu && submenu.classList.contains("nav-submenu")) {
      submenu.classList.remove("open");
    }
    const section = dropdown.closest(".nav-section");
    if (section) {
      section.classList.remove("expanding");
    }
  }
}

function atualizarNavegacaoAtiva(ativa) {
  // Remover active de todos
  document.querySelectorAll(".nav-item").forEach((item) => {
    item.classList.remove("active");
  });

  // Adicionar active ao item correto
  if (ativa === "visao-geral") {
    document
      .querySelector('.nav-item[onclick="abrirVisaoGeral()"]')
      .classList.add("active");
  } else if (ativa === "todas-tabelas") {
    document
      .querySelector('.nav-item[onclick="abrirTodasTabelas()"]')
      .classList.add("active");
  } else if (ativa.startsWith("tabela-")) {
    const tabelaId = parseInt(ativa.split("-")[1]);
    const item = document.querySelector(
      `.nav-item[onclick="abrirTabela(${tabelaId})"]`
    );
    if (item) item.classList.add("active");
  }
}

// ========== FUNÇÕES DE TABELAS ==========
function selecionarCor(cor) {
  corSelecionada = cor;
  document.querySelectorAll(".color-option").forEach((opt) => {
    opt.classList.remove("selected");
  });
  event.target.classList.add("selected");
}

function abrirModalNovaTabela() {
  document.getElementById("modal-nova-tabela").style.display = "flex";
}

function fecharModalNovaTabela() {
  document.getElementById("modal-nova-tabela").style.display = "none";
}

function criarNovaTabela() {
  const nome = document.getElementById("nome-nova-tabela").value.trim();
  const descricao = document
    .getElementById("descricao-nova-tabela")
    .value.trim();
  const moeda = document.getElementById("moeda-nova-tabela").value;

  if (!nome) {
    alert("Digite um nome para a tabela");
    return;
  }

  const novaTabela = {
    id: tabelas.length > 0 ? Math.max(...tabelas.map((t) => t.id)) + 1 : 1,
    nome,
    descricao,
    cor: corSelecionada,
    moeda,
    criadoEm: new Date().toISOString(),
    lancamentos: [],
  };

  tabelas.push(novaTabela);
  salvarTabelas();
  atualizarListaTabelasNav();
  fecharModalNovaTabela();

  // Limpar formulário
  document.getElementById("nome-nova-tabela").value = "";
  document.getElementById("descricao-nova-tabela").value = "";

  // Se estiver na view de todas as tabelas, atualizar
  if (
    document.getElementById("page-main-title").textContent ===
    "Todas as Tabelas"
  ) {
    renderTodasTabelas();
  }

  abrirTabela(novaTabela.id);
}

function excluirTabela(id, event) {
  event.stopPropagation();

  if (
    !confirm(
      "Tem certeza que deseja excluir esta tabela? Todos os lançamentos serão perdidos."
    )
  ) {
    return;
  }

  tabelas = tabelas.filter((t) => t.id !== id);
  salvarTabelas();
  atualizarListaTabelasNav();

  // Se estava na tabela excluída, voltar para visão geral
  if (tabelaAtual && tabelaAtual.id === id) {
    abrirVisaoGeral();
  } else if (
    document.getElementById("page-main-title").textContent ===
    "Todas as Tabelas"
  ) {
    renderTodasTabelas();
  }
}

// ========== FUNÇÕES DE LANÇAMENTOS ==========
function abrirNovoLancamento() {
  if (!tabelaAtual) {
    // Se não tem tabela selecionada, criar um lançamento genérico
    alert("Selecione uma tabela primeiro ou crie uma nova tabela.");
    return;
  }

  abrirNovoLancamentoNaTabela();
}

function abrirNovoLancamentoNaTabela() {
  // Aqui você implementaria o formulário de novo lançamento
  // Por enquanto, vamos criar um lançamento de exemplo
  const novoLancamento = {
    id:
      tabelaAtual.lancamentos.length > 0
        ? Math.max(...tabelaAtual.lancamentos.map((l) => l.id)) + 1
        : 1,
    tipo: "DESPESA",
    descricao: "Nova Despesa",
    valor: 100,
    categoria: "VARIAVEL",
    data: new Date().toISOString().split("T")[0],
    status: "PENDENTE",
    prioridade: "MEDIA",
  };

  tabelaAtual.lancamentos.push(novoLancamento);
  salvarTabelas();
  renderLancamentosTabela();

  alert("Novo lançamento adicionado! Implemente o formulário completo aqui.");
}

function renderLancamentosTabela() {
  if (!tabelaAtual) return;

  const tbody = document.getElementById("lancamentos-tabela");
  tbody.innerHTML = "";

  let totalReceitas = 0;
  let totalDespesas = 0;

  tabelaAtual.lancamentos.forEach((lanc) => {
    const row = document.createElement("tr");

    // Cálculos totais
    if (lanc.tipo === "RECEITA") {
      totalReceitas += lanc.valor;
    } else {
      totalDespesas += lanc.valor;
    }

    row.innerHTML = `
            <td><input type="checkbox" class="select-lancamento" data-id="${
              lanc.id
            }"></td>
            <td>${formatarData(lanc.data)}</td>
            <td>
                <div class="fw-bold">${lanc.descricao}</div>
                <small class="text-muted">${lanc.categoria}</small>
            </td>
            <td>
                <span class="badge bg-secondary">${lanc.categoria}</span>
            </td>
            <td class="${
              lanc.tipo === "RECEITA" ? "text-success" : "text-danger"
            } fw-bold">
                ${lanc.tipo === "RECEITA" ? "+" : "-"} R$ ${lanc.valor
      .toFixed(2)
      .replace(".", ",")}
            </td>
            <td>-</td>
            <td>
                <span class="badge ${
                  lanc.status === "PAGO"
                    ? "bg-success"
                    : lanc.status === "PENDENTE"
                    ? "bg-warning"
                    : "bg-danger"
                }">
                    ${lanc.status}
                </span>
            </td>
            <td>
                <span class="badge ${
                  lanc.prioridade === "ALTA" || lanc.prioridade === "URGENTE"
                    ? "bg-danger"
                    : "bg-warning"
                }">
                    ${lanc.prioridade}
                </span>
            </td>
            <td>
                <div class="d-flex gap-1">
                    <button onclick="editarLancamento(${
                      lanc.id
                    })" class="btn btn-sm btn-primary">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button onclick="excluirLancamento(${
                      lanc.id
                    })" class="btn btn-sm btn-danger">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            </td>
        `;
    tbody.appendChild(row);
  });

  const saldo = totalReceitas - totalDespesas;
  document.getElementById("total-tabela-atual").textContent = `R$ ${(
    totalReceitas + totalDespesas
  )
    .toFixed(2)
    .replace(".", ",")}`;
  document.getElementById("contagem-lancamentos").textContent =
    tabelaAtual.lancamentos.length;
  document.getElementById("saldo-tabela-atual").textContent = `Saldo: R$ ${saldo
    .toFixed(2)
    .replace(".", ",")}`;
  document.getElementById("saldo-tabela-atual").className =
    saldo >= 0 ? "fw-bold text-success" : "fw-bold text-danger";
}

function editarLancamento(id) {
  alert("Funcionalidade de edição será implementada aqui.");
}

function excluirLancamento(id) {
  if (!confirm("Excluir este lançamento?")) return;

  tabelaAtual.lancamentos = tabelaAtual.lancamentos.filter((l) => l.id !== id);
  salvarTabelas();
  renderLancamentosTabela();
}

// ========== VISÃO GERAL ==========
function atualizarVisaoGeral() {
  // Calcular totais consolidados
  let totalReceitas = 0;
  let totalDespesas = 0;
  let todosLancamentos = [];

  tabelas.forEach((tabela) => {
    tabela.lancamentos.forEach((lanc) => {
      todosLancamentos.push({
        ...lanc,
        tabela: tabela.nome,
        tabelaCor: tabela.cor,
      });

      if (lanc.tipo === "RECEITA") {
        totalReceitas += lanc.valor;
      } else {
        totalDespesas += lanc.valor;
      }
    });
  });

  const saldoTotal = totalReceitas - totalDespesas;

  // Atualizar cards
  document.getElementById("saldo-total").textContent = `R$ ${saldoTotal
    .toFixed(2)
    .replace(".", ",")}`;
  document.getElementById("saldo-total").className =
    saldoTotal >= 0 ? "card-value positive" : "card-value negative";

  document.getElementById("total-tabelas").textContent = tabelas.length;
  document.getElementById("receitas-mes").textContent = `R$ ${totalReceitas
    .toFixed(2)
    .replace(".", ",")}`;
  document.getElementById("despesas-mes").textContent = `R$ ${totalDespesas
    .toFixed(2)
    .replace(".", ",")}`;

  // Atualizar tabelas em destaque
  renderTabelasDestaque();

  // Atualizar últimos lançamentos
  renderUltimosLancamentos(todosLancamentos);
}

function renderTabelasDestaque() {
  const container = document.querySelector("#conteudo-dinamico .tabelas-grid");
  if (!container) return;

  container.innerHTML = "";

  // Ordenar tabelas por número de lançamentos (mais ativas primeiro)
  const tabelasOrdenadas = [...tabelas]
    .sort((a, b) => b.lancamentos.length - a.lancamentos.length)
    .slice(0, 6);

  tabelasOrdenadas.forEach((tabela) => {
    let totalReceitas = 0;
    let totalDespesas = 0;

    tabela.lancamentos.forEach((lanc) => {
      if (lanc.tipo === "RECEITA") {
        totalReceitas += lanc.valor;
      } else {
        totalDespesas += lanc.valor;
      }
    });

    const saldo = totalReceitas - totalDespesas;

    const card = document.createElement("div");
    card.className = "tabela-card";
    card.onclick = () => abrirTabela(tabela.id);

    card.innerHTML = `
            <div class="tabela-card-header">
                <div class="tabela-card-icon ${tabela.cor}">
                    ${tabela.nome.charAt(0).toUpperCase()}
                </div>
                <div class="tabela-card-stats">
                    <div class="stat-item">
                        <i class="bi bi-arrow-down-circle" style="color: var(--verde-secundario);"></i>
                        <span>${
                          tabela.lancamentos.filter((l) => l.tipo === "RECEITA")
                            .length
                        }</span>
                    </div>
                    <div class="stat-item">
                        <i class="bi bi-arrow-up-circle" style="color: var(--vermelho);"></i>
                        <span>${
                          tabela.lancamentos.filter((l) => l.tipo === "DESPESA")
                            .length
                        }</span>
                    </div>
                </div>
            </div>
            <div class="tabela-card-body">
                <h3>${tabela.nome}</h3>
                <p>${tabela.descricao}</p>
            </div>
            <div class="tabela-card-footer">
                <div>
                    <small class="text-muted">${
                      tabela.lancamentos.length
                    } lançamentos</small>
                </div>
                <div class="tabela-card-total ${
                  saldo >= 0 ? "positive" : "negative"
                }">
                    R$ ${Math.abs(saldo).toFixed(0)}
                </div>
            </div>
        `;

    container.appendChild(card);
  });
}

function renderUltimosLancamentos(todosLancamentos) {
  const tbody = document.getElementById("ultimos-lancamentos");
  if (!tbody) return;

  tbody.innerHTML = "";

  // Ordenar por data (mais recente primeiro)
  const lancamentosOrdenados = todosLancamentos
    .sort((a, b) => new Date(b.data) - new Date(a.data))
    .slice(0, 10);

  lancamentosOrdenados.forEach((lanc) => {
    const row = document.createElement("tr");
    row.innerHTML = `
            <td>${formatarData(lanc.data)}</td>
            <td>${lanc.descricao}</td>
            <td>
                <span class="badge" style="background: var(--${
                  lanc.tabelaCor
                });">
                    ${lanc.tabela}
                </span>
            </td>
            <td>${lanc.categoria}</td>
            <td class="${
              lanc.tipo === "RECEITA" ? "text-success" : "text-danger"
            } fw-bold">
                ${lanc.tipo === "RECEITA" ? "+" : "-"} R$ ${lanc.valor
      .toFixed(2)
      .replace(".", ",")}
            </td>
            <td>
                <span class="badge ${
                  lanc.status === "PAGO" ? "bg-success" : "bg-warning"
                }">
                    ${lanc.status}
                </span>
            </td>
        `;
    tbody.appendChild(row);
  });
}

// ========== TODAS AS TABELAS ==========
function renderTodasTabelas() {
  const container = document.querySelector("#conteudo-dinamico .tabelas-grid");
  if (!container) return;

  container.innerHTML = "";

  tabelas.forEach((tabela) => {
    let totalReceitas = 0;
    let totalDespesas = 0;

    tabela.lancamentos.forEach((lanc) => {
      if (lanc.tipo === "RECEITA") {
        totalReceitas += lanc.valor;
      } else {
        totalDespesas += lanc.valor;
      }
    });

    const saldo = totalReceitas - totalDespesas;
    const totalLancamentos = tabela.lancamentos.length;

    const card = document.createElement("div");
    card.className = "tabela-card";
    card.onclick = () => abrirTabela(tabela.id);

    card.innerHTML = `
            <div class="tabela-card-header">
                <div class="tabela-card-icon ${tabela.cor}">
                    ${tabela.nome.charAt(0).toUpperCase()}
                </div>
                <div class="tabela-card-stats">
                    <div class="stat-item" title="Receitas">
                        <i class="bi bi-arrow-down-circle" style="color: var(--verde-secundario);"></i>
                        <span>${
                          tabela.lancamentos.filter((l) => l.tipo === "RECEITA")
                            .length
                        }</span>
                    </div>
                    <div class="stat-item" title="Despesas">
                        <i class="bi bi-arrow-up-circle" style="color: var(--vermelho);"></i>
                        <span>${
                          tabela.lancamentos.filter((l) => l.tipo === "DESPESA")
                            .length
                        }</span>
                    </div>
                    <button class="btn-excluir-tabela" onclick="excluirTabela(${
                      tabela.id
                    }, event)">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            </div>
            <div class="tabela-card-body">
                <h3>${tabela.nome}</h3>
                <p>${tabela.descricao}</p>
                <div class="mt-2">
                    <small class="text-muted">Criada em ${formatarData(
                      tabela.criadoEm
                    )}</small>
                </div>
            </div>
            <div class="tabela-card-footer">
                <div>
                    <small class="text-muted">${totalLancamentos} lançamentos</small>
                </div>
                <div class="tabela-card-total ${
                  saldo >= 0 ? "positive" : "negative"
                }">
                    ${saldo >= 0 ? "+" : ""}R$ ${saldo
      .toFixed(2)
      .replace(".", ",")}
                </div>
            </div>
        `;

    container.appendChild(card);
  });
}

// ========== FUNÇÕES DE CONFIGURAÇÃO (placeholders) ==========
function abrirConfiguracoes() {
  alert("Configurações serão implementadas aqui.");
  fecharDropdownSistema();
}

function openTab(tabName) {
  alert(`Abrindo ${tabName} - funcionalidade em desenvolvimento.`);
  fecharDropdownSistema();
}

// ========== FUNÇÕES AUXILIARES ==========
function formatarData(dataString) {
  const data = new Date(dataString);
  return data.toLocaleDateString("pt-BR");
}

function salvarTabelas() {
  localStorage.setItem("tabelasFinanceiras", JSON.stringify(tabelas));
}

function atualizarListaTabelasNav() {
  const container = document.getElementById("lista-tabelas-nav");
  if (!container) return;

  container.innerHTML = "";

  tabelas.forEach((tabela) => {
    const receitas = tabela.lancamentos.filter(
      (l) => l.tipo === "RECEITA"
    ).length;
    const despesas = tabela.lancamentos.filter(
      (l) => l.tipo === "DESPESA"
    ).length;
    const pendentes = tabela.lancamentos.filter(
      (l) => l.status === "PENDENTE"
    ).length;

    const item = document.createElement("a");
    item.className = "nav-item";
    item.onclick = () => abrirTabela(tabela.id);

    item.innerHTML = `
            <div class="nav-item-content">
                <i class="bi bi-table"></i>
                <span>${tabela.nome}</span>
            </div>
            <div class="tabela-indicadores">
                ${
                  receitas > 0
                    ? `<span class="indicador-receita" title="${receitas} receitas">${receitas}</span>`
                    : ""
                }
                ${
                  despesas > 0
                    ? `<span class="indicador-despesa" title="${despesas} despesas">${despesas}</span>`
                    : ""
                }
                ${
                  pendentes > 0
                    ? `<span class="indicador-pendente" title="${pendentes} pendentes">${pendentes}</span>`
                    : ""
                }
            </div>
            <button class="btn-excluir-tabela" onclick="excluirTabela(${
              tabela.id
            }, event)">
                <i class="bi bi-x"></i>
            </button>
        `;

    container.appendChild(item);
  });
}

// ========== INICIALIZAÇÃO ==========
document.addEventListener("DOMContentLoaded", function () {
  // Inicializar tema
  mudarTema(savedTheme);

  // Atualizar lista de tabelas na navegação
  atualizarListaTabelasNav();

  // Abrir visão geral por padrão
  abrirVisaoGeral();

  // Configurar evento para fechar modal ao clicar fora
  document
    .getElementById("modal-nova-tabela")
    .addEventListener("click", function (e) {
      if (e.target === this) {
        fecharModalNovaTabela();
      }
    });
});
