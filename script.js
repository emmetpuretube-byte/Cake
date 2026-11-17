/* =========================================================
   Prata Doce — carrinho, pesquisa e formulário de contato
   ========================================================= */
(() => {
  "use strict";

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  const brl = (v) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const normalizar = (s) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

  function el(tag, classe, texto) {
    const e = document.createElement(tag);
    if (classe) e.className = classe;
    if (texto !== undefined) e.textContent = texto;
    return e;
  }

  /* ---------- Estado do carrinho ---------- */
  const CHAVE = "prata-doce-carrinho";
  let carrinho = [];

  try {
    const salvo = JSON.parse(localStorage.getItem(CHAVE));
    if (Array.isArray(salvo)) {
      carrinho = salvo.filter(
        (i) =>
          i && typeof i.id === "string" && typeof i.nome === "string" &&
          typeof i.opcao === "string" && typeof i.imagem === "string" &&
          Number.isFinite(i.preco) && Number.isInteger(i.qtd) && i.qtd > 0
      );
    }
  } catch (e) { carrinho = []; }

  function salvar() {
    try { localStorage.setItem(CHAVE, JSON.stringify(carrinho)); } catch (e) { /* sem armazenamento */ }
  }

  /* ---------- Elementos ---------- */
  const gaveta = $("#carrinho");
  const cobertura = $("#cobertura");
  const btnAbrir = $("#abrir-carrinho");
  const btnFechar = $("#fechar-carrinho");
  const lista = $("#itens");
  const vazio = $("#carrinho-vazio");
  const rodapeGaveta = $("#gaveta-rodape");
  const subtotalEl = $("#subtotal");
  const contador = $("#contador");
  const confirmacao = $("#confirmacao");
  const aviso = $("#aviso-flutuante");

  /* ---------- Aviso rápido ---------- */
  let temporizadorAviso;
  function mostrarAviso(texto) {
    aviso.textContent = texto;
    aviso.classList.add("visivel");
    clearTimeout(temporizadorAviso);
    temporizadorAviso = setTimeout(() => aviso.classList.remove("visivel"), 2200);
  }

  /* ---------- Gaveta do carrinho ---------- */
  function abrirCarrinho() {
    gaveta.classList.add("aberta");
    cobertura.classList.add("aberta");
    gaveta.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    btnFechar.focus();
  }

  function fecharCarrinho() {
    gaveta.classList.remove("aberta");
    cobertura.classList.remove("aberta");
    gaveta.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    btnAbrir.focus();
  }

  btnAbrir.addEventListener("click", abrirCarrinho);
  btnFechar.addEventListener("click", fecharCarrinho);
  cobertura.addEventListener("click", fecharCarrinho);
  $("#ver-bolos").addEventListener("click", fecharCarrinho);

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && gaveta.classList.contains("aberta")) fecharCarrinho();
  });

  /* ---------- Desenho do carrinho ---------- */
  function renderizar() {
    lista.replaceChildren();
    let total = 0;
    let quantidade = 0;

    carrinho.forEach((item, indice) => {
      total += item.preco * item.qtd;
      quantidade += item.qtd;

      const li = el("li", "item");
      li.dataset.indice = indice;

      const img = el("img");
      img.src = item.imagem;
      img.alt = "";
      img.width = 68;
      img.height = 68;

      const info = el("div", "item-info");
      info.append(el("p", "item-nome", item.nome), el("p", "item-opcao", item.opcao));

      const controles = el("div", "item-controles");
      const qtd = el("div", "qtd");
      const menos = el("button", "", "−");
      menos.type = "button";
      menos.dataset.acao = "menos";
      menos.setAttribute("aria-label", `Diminuir quantidade de ${item.nome}, ${item.opcao}`);
      const numero = el("span", "", String(item.qtd));
      const mais = el("button", "", "+");
      mais.type = "button";
      mais.dataset.acao = "mais";
      mais.setAttribute("aria-label", `Aumentar quantidade de ${item.nome}, ${item.opcao}`);
      qtd.append(menos, numero, mais);
      controles.append(qtd);
      info.append(controles);

      const lado = el("div", "item-lado");
      const remover = el("button", "remover", "Remover");
      remover.type = "button";
      remover.dataset.acao = "remover";
      remover.setAttribute("aria-label", `Remover ${item.nome}, ${item.opcao}, do carrinho`);
      lado.append(el("p", "item-total", brl(item.preco * item.qtd)), remover);

      li.append(img, info, lado);
      lista.append(li);
    });

    const temItens = carrinho.length > 0;
    const emConfirmacao = !confirmacao.hidden;

    vazio.hidden = temItens || emConfirmacao;
    lista.hidden = !temItens;
    rodapeGaveta.hidden = !temItens;
    subtotalEl.textContent = brl(total);

    contador.textContent = String(quantidade);
    btnAbrir.setAttribute(
      "aria-label",
      `Abrir carrinho, ${quantidade} ${quantidade === 1 ? "item" : "itens"}`
    );
  }

  lista.addEventListener("click", (e) => {
    const botao = e.target.closest("button[data-acao]");
    if (!botao) return;
    const indice = Number(botao.closest(".item").dataset.indice);
    const item = carrinho[indice];
    if (!item) return;

    if (botao.dataset.acao === "mais") item.qtd += 1;
    if (botao.dataset.acao === "menos") item.qtd -= 1;
    if (botao.dataset.acao === "remover" || item.qtd <= 0) carrinho.splice(indice, 1);

    salvar();
    renderizar();
  });

  $("#limpar-carrinho").addEventListener("click", () => {
    carrinho = [];
    salvar();
    renderizar();
  });

  /* ---------- Finalizar pedido (demonstração, sem pagamento) ---------- */
  $("#finalizar").addEventListener("click", () => {
    if (!carrinho.length) return;
    const total = carrinho.reduce((s, i) => s + i.preco * i.qtd, 0);
    const numero = String(Date.now()).slice(-6);

    $("#confirmacao-texto").textContent =
      `Pedido nº ${numero} no valor de ${brl(total)}. Entraremos em contato para combinar entrega e pagamento. ` +
      `Esta é uma versão de demonstração: nenhum pagamento foi feito.`;

    carrinho = [];
    salvar();
    confirmacao.hidden = false;
    renderizar();
  });

  $("#confirmacao-ok").addEventListener("click", () => {
    confirmacao.hidden = true;
    renderizar();
    fecharCarrinho();
    location.hash = "#bolos";
  });

  /* ---------- Cards de produto ---------- */
  $$(".produto").forEach((card) => {
    const select = $(".opcao", card);
    const precoEl = $(".preco-atual", card);

    const precoSelecionado = () => Number(select.selectedOptions[0].dataset.preco);

    select.addEventListener("change", () => {
      precoEl.textContent = brl(precoSelecionado());
    });

    $(".adicionar", card).addEventListener("click", () => {
      const opcao = select.selectedOptions[0].textContent.split(" — ")[0];
      const preco = precoSelecionado();
      const existente = carrinho.find((i) => i.id === card.dataset.id && i.opcao === opcao);

      if (existente) {
        existente.qtd += 1;
      } else {
        carrinho.push({
          id: card.dataset.id,
          nome: card.dataset.nome,
          opcao,
          preco,
          qtd: 1,
          imagem: card.dataset.imagem,
        });
      }

      confirmacao.hidden = true;
      salvar();
      renderizar();
      mostrarAviso(`${card.dataset.nome} (${opcao}) adicionado`);
    });
  });

  /* ---------- Pesquisa ---------- */
  const campoBusca = $("#busca");
  const resultado = $("#resultado-busca");
  const semResultado = $("#sem-resultado");
  const cards = $$(".produto");

  function filtrar() {
    const termo = normalizar(campoBusca.value);
    let visiveis = 0;

    cards.forEach((card) => {
      const texto = normalizar(`${card.dataset.nome} ${card.dataset.busca} ${card.textContent}`);
      const combina = !termo || termo.split(/\s+/).every((p) => texto.includes(p));
      card.hidden = !combina;
      if (combina) visiveis += 1;
    });

    semResultado.hidden = visiveis !== 0;

    if (!termo) {
      resultado.textContent = `${cards.length} bolos disponíveis`;
    } else if (visiveis === 0) {
      resultado.textContent = "Nenhum resultado";
    } else {
      resultado.textContent = `${visiveis} ${visiveis === 1 ? "bolo encontrado" : "bolos encontrados"} para “${campoBusca.value.trim()}”`;
    }
  }

  campoBusca.addEventListener("input", filtrar);

  $("#form-busca").addEventListener("submit", (e) => {
    e.preventDefault();
    filtrar();
    $("#bolos").scrollIntoView();
  });

  $("#limpar-busca").addEventListener("click", () => {
    campoBusca.value = "";
    filtrar();
    campoBusca.focus();
  });

  /* ---------- Fale conosco ---------- */
  const form = $("#form-contato");
  const sucesso = $("#sucesso-contato");

  function mensagemErro(campo) {
    if (campo.validity.valueMissing) {
      if (campo.id === "c-nome") return "Informe seu nome.";
      if (campo.id === "c-email") return "Informe seu e-mail.";
      return "Escreva sua mensagem.";
    }
    if (campo.validity.typeMismatch) return "Use um e-mail válido, como nome@exemplo.com.";
    return "";
  }

  function validarCampo(campo) {
    const msg = mensagemErro(campo);
    const saida = $(`[data-erro-para="${campo.id}"]`, form);
    campo.setAttribute("aria-invalid", msg ? "true" : "false");
    if (saida) saida.textContent = msg;
    return !msg;
  }

  $$("input[required], textarea[required]", form).forEach((campo) => {
    campo.addEventListener("blur", () => validarCampo(campo));
    campo.addEventListener("input", () => {
      if (campo.getAttribute("aria-invalid") === "true") validarCampo(campo);
    });
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    sucesso.textContent = "";

    const campos = $$("input[required], textarea[required]", form);
    const resultados = campos.map(validarCampo);
    const primeiroInvalido = campos[resultados.indexOf(false)];

    if (primeiroInvalido) {
      primeiroInvalido.focus();
      return;
    }

    const nome = $("#c-nome").value.trim().split(" ")[0];
    form.reset();
    campos.forEach((c) => c.setAttribute("aria-invalid", "false"));
    sucesso.textContent = `Obrigado, ${nome}. Recebemos sua mensagem e respondemos em até 1 dia útil.`;
  });

  /* ---------- Início ---------- */
  renderizar();
})();
