let textoPDF = "";
let colaboradoresPDF = [];

fetch("bancodehoras.pdf")
    .then(res => res.arrayBuffer())
    .then(data => pdfjsLib.getDocument({ data }).promise)
    .then(pdf => {
        const total = pdf.numPages;
        const promises = [];

        for (let i = 1; i <= total; i++) {
            promises.push(
                pdf.getPage(i).then(page =>
                    page.getTextContent().then(content =>
                        content.items.map(item => item.str).join(" ")
                    )
                )
            );
        }

        return Promise.all(promises);
    })
    .then(paginas => {
        textoPDF = paginas.join("\n");

        // Extrai colaboradores
        const regex = /(\d{7,}) - ([A-Z\sÇÃÕÂÊÁÉÍÓÚà-ú\-']+)\s+([-\d:]+)\s+([-\d:]+)\s+([-\d:]+)\s+([-\d:]+)/g;
        let match;
        while ((match = regex.exec(textoPDF)) !== null) {
            colaboradoresPDF.push({
                matricula: match[1].trim(),
                nome: match[2].trim(),
                saldoAtual: match[3].trim(),
                saldoAnterior: match[4].trim(),
                horasCredito: match[5].trim(),
                horasDebito: match[6].trim()
            });
        }

        document.getElementById("resultado").innerHTML = "<p>PDF carregado com sucesso. Digite uma matrícula para buscar.</p>";
    })
    .catch(err => {
        document.getElementById("resultado").innerHTML = `<p class="negativo">Erro ao carregar o PDF.</p>`;
        console.error(err);
    });

function mostrarSecao(secaoId) {
    document.querySelectorAll(".secao").forEach(div => div.style.display = "none");
    document.getElementById(secaoId).style.display = "block";
}

// Carrega CSV de EPIs
fetch("listaepis.csv")
    .then(response => response.text())
    .then(texto => {
        const linhas = texto.split("\n").map(l => l.trim());
        listaEPIs = linhas.slice(1).map(linha => {
            const partes = linha.split(";");
            return { codigo: partes[0]?.trim(), descricao: partes[1]?.trim() };
        });
    });

function corHora(valor) {
    if (!valor || valor === "00:00") return "neutro";
    if (valor.startsWith("-")) return "negativo";
    return "positivo";
}

function buscarPorMatricula() {
    const termo = document.getElementById("matricula").value.trim();
    const resultadoDiv = document.getElementById("resultado");
    resultadoDiv.innerHTML = "";

    const colaborador = colaboradoresPDF.find(c =>
        c.matricula.includes(termo)
    );

    if (colaborador) {
        resultadoDiv.innerHTML = `
      <h2>Resultado:</h2>
      <ul>
        <li><strong>Colaborador:</strong> ${colaborador.nome}</li>
        <li><strong>Matrícula:</strong> ${colaborador.matricula}</li>
        <li><strong>Saldo Atual:</strong> <span class="${corHora(colaborador.saldoAtual)}">${colaborador.saldoAtual}</span></li>
        <li><strong>Saldo Anterior:</strong> <span class="${corHora(colaborador.saldoAnterior)}">${colaborador.saldoAnterior}</span></li>
        <li><strong>Horas Crédito:</strong> <span class="${corHora(colaborador.horasCredito)}">${colaborador.horasCredito}</span></li>
        <li><strong>Horas Débito:</strong> <span class="${corHora(colaborador.horasDebito)}">${colaborador.horasDebito}</span></li>
      </ul>
    `;
    } else {
        resultadoDiv.innerHTML = `<p class="negativo">Matrícula não encontrada.</p>`;
    }
}

function sugerirColaboradores() {
    const termo = document.getElementById("nomeColaborador").value.toLowerCase();
    const sugestoesDiv = document.getElementById("sugestoesColaborador");
    sugestoesDiv.innerHTML = "";
    sugestoesDiv.style.display = "none";

    if (termo.length < 4) return;

    sugestoesDiv.style.display = "block";

    colaboradoresPDF.forEach(c => {
        const nome = c.nome.toLowerCase();
        const matricula = c.matricula;
        if (nome.includes(termo) || matricula.includes(termo)) {
            const btn = document.createElement("button");
            btn.textContent = `${c.nome} - ${formatarMatricula(c.matricula)}`;
            btn.onclick = () => {
                document.getElementById("nomeColaborador").value = c.nome;
                sugestoesDiv.innerHTML = "";
                sugestoesDiv.style.display = "none";
            };
            sugestoesDiv.appendChild(btn);
        }
    });
}

function sugerirEPIs() {
    const termo = document.getElementById("epiInput").value.toLowerCase();
    const sugestoesDiv = document.getElementById("sugestoesEPI");
    sugestoesDiv.innerHTML = "";
    sugestoesDiv.style.display = "none";

    const termosSeparados = termo.split(" ").filter(p => p.length > 0);
    if (termosSeparados.length === 0) return;

    sugestoesDiv.style.display = "block";

    for (let i = 0; i < listaEPIs.length; i++) {
        const epi = listaEPIs[i];
        const descricao = epi.descricao.toLowerCase();
        const corresponde = termosSeparados.every(palavra => descricao.includes(palavra));
        if (corresponde) {
            const btn = document.createElement("button");
            btn.textContent = `${epi.codigo} - ${epi.descricao}`;
            btn.onclick = () => {
                adicionarItemEPI(epi);
                document.getElementById("epiInput").value = "";
                sugestoesDiv.innerHTML = "";
                sugestoesDiv.style.display = "none";
            };
            sugestoesDiv.appendChild(btn);
        }
    }
}

function adicionarItemEPI(epi) {
    const lista = document.getElementById("itensRequisicao");
    const li = document.createElement("li");
    li.innerHTML = `<label><input type="checkbox"> [${epi.codigo}] - ${epi.descricao}</label>`;
    lista.appendChild(li);
}

function criarRequisicao() {
    const entrada = document.getElementById("nomeColaborador").value.trim().toLowerCase();
    let colaborador = null;

    if (/^\d+$/.test(entrada)) {
        // entrada é matrícula
        colaborador = colaboradoresPDF.find(c => c.matricula.includes(entrada));
    } else {
        // entrada é nome
        colaborador = colaboradoresPDF.find(c => c.nome.toLowerCase() === entrada);
    }

    if (!colaborador) {
        alert("Colaborador não encontrado.");
        return;
    }

    const titulo = `${colaborador.nome} - ${formatarMatricula(colaborador.matricula)}`;
    const id = `req-${Date.now()}`;
    const itens = Array.from(document.querySelectorAll("#itensRequisicao li")).map(li => li.textContent);

    const html = `
    <div id="${id}" class="tarefa">
      <h3>${titulo}</h3>
      <ul>${itens.map(item => `<li><label>${item}</label></li>`).join("")}</ul>
    <button onclick="removerRequisicao('${id}')">Remover</button>
    </div>
  `;

    document.getElementById("listaRequisicoes").innerHTML += html;
    salvarRequisicaoLocal(id, titulo, itens);
    document.getElementById("itensRequisicao").innerHTML = "";
}

function formatarMatricula(matricula) {
    return matricula.startsWith("6005") ? matricula.slice(4) : matricula;
}

function salvarRequisicaoLocal(id, titulo, itens) {
    const requisicoes = JSON.parse(localStorage.getItem("requisicoes") || "[]");
    requisicoes.push({ id, titulo, itens });
    localStorage.setItem("requisicoes", JSON.stringify(requisicoes));
}

function removerRequisicao(id) {
    const div = document.getElementById(id);
    if (div) div.remove();

    const requisicoes = JSON.parse(localStorage.getItem("requisicoes") || "[]");
    const atualizadas = requisicoes.filter(req => req.id !== id);
    localStorage.setItem("requisicoes", JSON.stringify(atualizadas));
}

function carregarRequisicoes() {
    const requisicoes = JSON.parse(localStorage.getItem("requisicoes") || "[]");
    const container = document.getElementById("listaRequisicoes");
    requisicoes.forEach(req => {
        const html = `
  <div id="${req.id}" class="tarefa">
    <h3>${req.titulo}</h3>
    <ul>${req.itens.map(item => `<li><label>${item}</label></li>`).join("")}</ul>
    <button onclick="removerRequisicao('${req.id}')">Remover</button>
  </div>
`;

        container.innerHTML += html;
    });
}

window.onload = carregarRequisicoes;

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("sw.js").then(() => {
    console.log("Service Worker registrado com sucesso.");
  });
}