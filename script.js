let textoPDF = "";
let colaboradoresPDF = [];
let colaboradoresCSV = [];
let listaEPIs = [];

fetch("listanomes.csv")
  .then(response => response.text())
  .then(texto => {
    const linhas = texto.split("\n").map(l => l.trim()).filter(l => l);
    colaboradoresCSV = linhas.slice(3).map(linha => {
      const [matricula, nome, cdc, funcao] = linha.split(";").map(v => v.trim());
      return { matricula, nome, cdc, funcao };
    });
    console.log("Colaboradores CSV carregados:", (colaboradoresCSV))
  })
  .catch(err => {
    console.error("Erro ao carregar listanomes.csv:", err);
  });


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
    const regexUnica = /(\d{7,}) - ([A-Z\sÇÃÕÂÊÁÉÍÓÚà-ú\-']+)\s+([-\d:]+)\s+([-\d:]+)\s+([-\d:]+)\s+([-\d:]+)|(\d{12,}) - ([A-Z\sÇÃÕÂÊÁÉÍÓÚà-ú\']+)/g;

    let match;
    let dadosSetor = { cdc: "Não Identificado", setor: "Não Identificado" };
    colaboradoresPDF = [];

    function formatarCDC(cdc) {
      if (cdc.startsWith("60006005000")) {
        return cdc.slice(11);
      }
      return cdc;
    }

    function formatarMatricula(matricula) {
      if (matricula.startsWith("6005") || matricula.startsWith("2009")) {
        return matricula.slice(4);
      }
      return matricula;
    }

    while ((match = regexUnica.exec(textoPDF)) !== null) {
      // 1. Identificação do Setor (Header do grupo no PDF)
      if (match[7]) {
        dadosSetor = {
          cdc: match[7].trim(),
          setor: match[8].trim()
        };
      }

      // 2. Identificação do Colaborador
      else if (match[1]) {
        const matriculaLimpa = formatarMatricula(match[1].trim());

        // BUSCA A FUNÇÃO NO CSV:
        // Procuramos no array colaboradoresCSV alguém que tenha a mesma matrícula
        const dadosNoCSV = colaboradoresCSV.find(c => formatarMatricula(c.matricula) === matriculaLimpa);

        colaboradoresPDF.push({
          cdc: formatarCDC(dadosSetor.cdc),
          setor: dadosSetor.setor,
          matricula: matriculaLimpa,
          nome: match[2].trim(),
          // Se achar no CSV, usa a função de lá. Se não, usa um texto padrão.
          funcao: dadosNoCSV ? dadosNoCSV.funcao : "Função não encontrada",
          saldoAnterior: match[3].trim(),
          horasCredito: match[4].trim(),
          horasDebito: match[5].trim(),
          saldoAtual: match[6].trim()
        });
      }
    }

    console.log(colaboradoresPDF);

    document.getElementById("resultado").innerHTML = "<p>PDF carregado com sucesso. Digite uma matrícula para buscar.</p>";
  })
  .catch(err => {
    document.getElementById("resultado").innerHTML = `<p class="negativo">Erro ao carregar o PDF.</p>`;
    console.error(err);
  });







function mostrarSecao(secaoId) {
  document.querySelectorAll(".secao").forEach(div => div.style.display = "none");
  document.getElementById(secaoId).style.display = "flex";
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
    console.log("EPIs carregados:", listaEPIs);
  });

function corHora(valor) {
  if (!valor || valor === "00:00") return "neutro";
  if (valor.startsWith("-")) return "negativo";
  return "positivo";
}

function descreverCDC(cdc) {

  let setor = ''
  switch (cdc) {
    case '76512':
      setor = 'ALMOXARIFADO MP'
      break
    case '76532':
      setor = 'APOIO E MOV'
      break
    case '76540':
      setor = 'OPERAÇÃO CUSTOMIZAÇÃO'
      break
    case '76590':
      setor = 'ENVASE COLORAÇÃO WELLA'
      break
    case '76591':
      setor = 'ENVASE PROFESSIONAL WELLA'
      break
    case '76582':
      setor = 'ENVASE ESMALTES'
      break
    case '76581':
      setor = 'ENVASE COLORAÇÃO '
      break
    case '76585':
      setor = 'ENVASE LINHAS RÁPIDAS'
      break
    case '76587':
      setor = 'ENVASE AEROSÓIS'
      break
    default:
      setor = 'INDEFINIDO'
  }
  return setor;
}

function sugerirEPIs(inputId = "epiInput", sugestoesId = "sugestoesEPI") {
  const input = document.getElementById(inputId);
  const sugestoesDiv = document.getElementById(sugestoesId);
  if (!input || !sugestoesDiv) return;

  const termo = input.value.toLowerCase().trim();
  sugestoesDiv.innerHTML = "";
  sugestoesDiv.style.display = "none";

  if (!termo || termo.length < 2) return;

  const encontrados = listaEPIs.filter(epi =>
    (epi.descricao || "").toLowerCase().includes(termo) ||
    (epi.codigo || "").toLowerCase().includes(termo)
  );

  if (encontrados.length === 0) return;

  sugestoesDiv.style.display = "block";

  encontrados.forEach(epi => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = `${epi.codigo} - ${epi.descricao}`;
    btn.onclick = () => {
      if (inputId === "epiInput") {
        adicionarItemEPI(epi);
      } else {
        const requisicaoId = inputId.replace("novoItem-", "");
        adicionarItemComValor(requisicaoId, `${epi.codigo} - ${epi.descricao}`);
      }

      input.value = "";
      sugestoesDiv.innerHTML = "";
      sugestoesDiv.style.display = "none";
    };
    sugestoesDiv.appendChild(btn);
  });
}

function adicionarItemEPI(epi) {
  const lista = document.getElementById("itensRequisicao");
  const li = document.createElement("li");
  console.log(epi);
  li.innerHTML = `<label>${epi.codigo} - ${epi.descricao}`;
  lista.appendChild(li);
}

function criarRequisicao() {
  const entrada = document.getElementById("buscaRequisicao").value.trim().toLowerCase();
  const todos = [...colaboradoresCSV, ...colaboradoresPDF];
  let colaborador = null;

  if (/^\d+$/.test(entrada)) {
    colaborador = todos.find(c => c.matricula.includes(entrada));
  } else {
    colaborador = todos.find(c => c.nome.toLowerCase() === entrada);
  }

  if (!colaborador) {
    alert("Colaborador não encontrado.");
    return;
  }


  const titulo = `${colaborador.nome} - ${colaborador.matricula}`;
  const id = `req-${Date.now()}`;
  const itens = Array.from(document.querySelectorAll("#itensRequisicao li")).map(li => li.textContent);
  const editar = `<span class="spanButton" onclick="toggleEditor('${id}')">✏️</span>`;
  const apagar = `<span class="spanButton" onclick="removerRequisicao('${id}')">🧼</span>`;

  const html = `
  <div id="${id}" class="tarefa">
    <h3>${titulo} ${editar} ${apagar} </h3>
    <ul id="itens-${id}">
      ${itens.map(item => `<li><label>${item}</label></li>`).join("")}
    </ul>
    <div id="editor-${id}" style="display:none;">
      <input type="text" id="novoItem-${id}" placeholder="Adicionar novo item" oninput="sugerirEPIs('novoItem-${id}','sugestoes-${id}')">
      <div id="sugestoes-${id}" class="sugestoes" style="display:none;"></div>
      <button onclick="adicionarItem('${id}')">Adicionar</button>
      <ul id="remover-${id}">
        ${itens.map((item, index) => `
          <li>
            <label>${item}</label>
            <span class="spanButton" onclick="removerItem('${id}', ${index})">🗑️</span>
          </li>
        `).join("")}
      </ul>
    </div>
    
    
  </div>
`;

  document.getElementById("listaRequisicoes").innerHTML += html;
  salvarRequisicaoLocal(id, titulo, itens);
  document.getElementById("itensRequisicao").innerHTML = "";
  document.getElementById("buscaRequisicao").value = "";
}


function toggleEditor(id) {
  const editor = document.getElementById(`editor-${id}`);
  editor.style.display = editor.style.display === "none" ? "block" : "none";
}

function removerItem(requisicaoId, index) {
  const listaVisual = document.getElementById(`itens-${requisicaoId}`);
  const listaRemover = document.getElementById(`remover-${requisicaoId}`);

  const itens = Array.from(listaVisual.querySelectorAll("li"));
  const itensRemover = Array.from(listaRemover.querySelectorAll("li"));

  if (itens[index]) itens[index].remove();
  if (itensRemover[index]) itensRemover[index].remove();

  const requisicoes = JSON.parse(localStorage.getItem("requisicoes") || "[]");
  const atualizadas = requisicoes.map(req => {
    if (req.id === requisicaoId) {
      req.itens.splice(index, 1);
    }
    return req;
  });

  localStorage.setItem("requisicoes", JSON.stringify(atualizadas));
}

function adicionarItemComValor(requisicaoId, valor) {
  const v = (valor || "").trim();
  if (!v) return;

  const listaVisual = document.getElementById(`itens-${requisicaoId}`);
  const listaRemover = document.getElementById(`remover-${requisicaoId}`);
  if (!listaVisual || !listaRemover) return;

  const index = listaVisual.querySelectorAll("li").length;

  const liVisual = document.createElement("li");
  liVisual.innerHTML = `<label>${v}</label>`;
  listaVisual.appendChild(liVisual);

  const liRemover = document.createElement("li");
  liRemover.innerHTML = `<label>${v}</label> <span class="spanButton" onclick="removerItem('${requisicaoId}', ${index})">🗑️</span>`;
  listaRemover.appendChild(liRemover);

  const requisicoes = JSON.parse(localStorage.getItem("requisicoes") || "[]");
  const atualizadas = requisicoes.map(req => {
    if (req.id === requisicaoId) {
      req.itens.push(v);
    }
    return req;
  });

  localStorage.setItem("requisicoes", JSON.stringify(atualizadas));
}

function adicionarItem(requisicaoId) {
  const input = document.getElementById(`novoItem-${requisicaoId}`);
  if (!input) return;

  const valor = input.value.trim();
  if (!valor) return;

  adicionarItemComValor(requisicaoId, valor);

  input.value = "";
  const sugestoesDiv = document.getElementById(`sugestoes-${requisicaoId}`);
  if (sugestoesDiv) {
    sugestoesDiv.innerHTML = "";
    sugestoesDiv.style.display = "none";
  }
}




function sugerirColaboradorUnificado(inputId, sugestaoId) {
  const termo = document.getElementById(inputId).value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const sugestoesDiv = document.getElementById(sugestaoId);
  sugestoesDiv.innerHTML = "";
  sugestoesDiv.style.display = "none";

  if (termo.length < 3) return;

  const encontradosPDF = colaboradoresPDF.filter(c => {
    const nome = c.nome.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    return nome.includes(termo) || c.matricula.includes(termo);
  });

  let encontrados = encontradosPDF;

  if (encontrados.length === 0) {
    encontrados = colaboradoresCSV.filter(c => {
      const nome = c.nome.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      return nome.includes(termo) || c.matricula.includes(termo) || c.funcao.includes(termo);
    });
  }

  if (encontrados.length === 0) return;

  sugestoesDiv.style.display = "block";
  encontrados.forEach(c => {
    const btn = document.createElement("button");
    btn.type = "button";

    btn.innerHTML = `${c.nome} - ${c.matricula} <br> ${c.funcao} - ${descreverCDC(c.cdc)}`;
    btn.onclick = () => {
      document.getElementById(inputId).value = c.nome;
      sugestoesDiv.innerHTML = "";
      sugestoesDiv.style.display = "none";
    };
    sugestoesDiv.appendChild(btn);
  });
}


function buscarBancoHoras() {
  const entrada = document.getElementById("buscaColaborador").value.trim().toLowerCase();
  const resultadoDiv = document.getElementById("resultado");
  resultadoDiv.innerHTML = "";




  const todos = [...colaboradoresPDF];
  let colaborador = null;

  if (/^\d+$/.test(entrada)) {
    colaborador = todos.find(c => c.matricula.includes(entrada));
  } else {
    colaborador = todos.find(c => c.nome.toLowerCase() === entrada);
  }


  if (!colaborador) {
    resultadoDiv.innerHTML = `<p class="negativo">Colaborador não encontrado.</p>`;
    return;
  }


  resultadoDiv.innerHTML = `
    <table>
      <tr><td><strong>Colaborador:</strong></td> <td>${colaborador.nome}</td></tr>
      <tr><td><strong>Setor:</strong></td><td>${descreverCDC(colaborador.cdc) || "Local"}</td></tr>
      <tr><td><strong>Função:</strong></td> <td>${colaborador.funcao || "Cargo"}</td></tr>
      <tr><td><strong>Matrícula:</strong> </td> <td>${colaborador.matricula}</td></tr>
      <tr><td><strong>Saldo Atual:</strong> </td> <td><span class="${corHora(colaborador.saldoAtual)}">${colaborador.saldoAtual}</span></td></tr>
      <tr><td><strong>Saldo Anterior:</strong> </td> <td><span class="${corHora(colaborador.saldoAnterior)}">${colaborador.saldoAnterior}</span></td></tr>
      <tr><td><strong>Horas Crédito:</strong> </td> <td><span class="${corHora(colaborador.horasCredito)}">${colaborador.horasCredito}</span></td></tr>
      <tr><td><strong>Horas Débito:</strong> </td> <td><span class="debito">${colaborador.horasDebito}</span></td></tr>
    </table>
  `;
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
  console.log("Executando carregarRequisicoes()");
  const requisicoes = JSON.parse(localStorage.getItem("requisicoes") || "[]");
  const container = document.getElementById("listaRequisicoes");
  requisicoes.forEach(req => {
    console.log("Renderizando:", req);
    const html = `
      <div id="${req.id}" class="tarefa">
        <h3>${req.titulo}</h3>
        <ul id="itens-${req.id}">
          ${req.itens.map(item => `<li><label>${item}</label></li>`).join("")}
        </ul>
        <div id="editor-${req.id}" style="display:none;">
          <input type="text" id="novoItem-${req.id}" placeholder="Adicionar novo item" oninput="sugerirEPIs('novoItem-${req.id}','sugestoes-${req.id}')">
          <div id="sugestoes-${req.id}" class="sugestoes" style="display:none;"></div>
          <button onclick="adicionarItem('${req.id}')">Adicionar</button>
          <ul id="remover-${req.id}">
            ${req.itens.map((item, index) => `
              <li>
                <button onclick="removerItem('${req.id}', ${index})">🗑️</button>
                <label>${item}</label>
              </li>
            `).join("")}
          </ul>
        </div>
        <button onclick="toggleEditor('${req.id}')">Editar</button>
        <button onclick="removerRequisicao('${req.id}')">Remover</button>
      </div>
    `;
    container.insertAdjacentHTML("beforeend", html);
  });
}

// parte do QR Code/Código de barras e Câmera

const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const resultado = document.getElementById("resultado");
const btnCapturar = document.getElementById("btnCapturar");

// Acesso à câmera
navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
  .then(stream => {
    video.srcObject = stream;
    video.setAttribute("playsinline", true); // iOS
    video.play();
    video.onloadedmetadata = () => {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      btnCapturar.disabled = false; // só habilita quando vídeo estiver pronto
    };
  })
  .catch(err => console.error("Erro ao acessar câmera:", err));

// Função para capturar e processar QR Code e Código de Barras
btnCapturar.addEventListener("click", () => {
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

  // --- Processar QR Code ---
  const qrCode = jsQR(imageData.data, canvas.width, canvas.height);
  if (qrCode) {
    resultado.textContent = "QR Code: " + qrCode.data;
    return;
  }

  // --- Processar Código de Barras com QuaggaJS ---
  Quagga.decodeSingle({
    src: canvas.toDataURL("image/png"), // imagem capturada
    numOfWorkers: 0,
    decoder: {
      readers: ["code_128_reader", "ean_reader", "ean_8_reader", "upc_reader"]
    }
  }, result => {
    if (result && result.codeResult) {
      resultado.textContent = "Código de Barras: " + result.codeResult.code;
    } else {
      resultado.textContent = "Nenhum código detectado.";
    }
  });
});


window.onload = () => {
  mostrarSecao('requisicoes');
  carregarRequisicoes();
  console.log("Requisições carregadas:", localStorage.getItem("requisicoes"));
};

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("sw.js").then(() => {
    console.log("Service Worker registrado com sucesso.");
  });
}