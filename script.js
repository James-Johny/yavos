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
    version = paginas.join("\n");
    const regexVersion = /\s*(\d{2}\/\d{2}\/\d{4})/;
    const matchVersion = version.match(regexVersion);
    if (matchVersion) {
      const dataExtraida = matchVersion[1];
      document.getElementById("versao").textContent = `Última atualização: ${dataExtraida}`;
    } else {
      document.getElementById("versao").textContent = "Data de atualização não encontrada";
    }
  })

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



const menuCheckbox = document.getElementById('menuCheckbox');
const menuLinks = document.querySelectorAll('#menu a');



// Fecha menu ao clicar em uma opção
menuLinks.forEach(link => {
  link.addEventListener('click', () => {
    menuCheckbox.checked = false;
  });
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
  if (!valor || valor === "0:00") return "neutro";
  if (valor.startsWith("-")) return "negativo";
  return "positivo";
}
function corSaldo(valor) {
  if (!valor || valor === "0:00") return "#a0a0a0";
  if (valor.startsWith("-")) return "#fff19b";
  return "#a2d492";
}
function corDebito(valor) {
  if (!valor || valor === "0:00") return "neutro";
  return "negativo";
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
  li.innerHTML = `<label class="new-item">${epi.codigo} - ${epi.descricao}`;
  lista.appendChild(li);
}

function criarRequisicao() {
  const entrada = document.getElementById("buscaRequisicao").value.trim().toLowerCase();
  const todos = [...colaboradoresCSV, ...colaboradoresPDF];
  let colaborador = null;
  let colaboradorManual = entrada.toUpperCase().split(",").map(item => item.trim());

  if (colaboradorManual.length === 2) {
    const [nome, matricula] = colaboradorManual;
    colaborador = { nome, matricula };
  } else {
    colaborador = todos.find(c => c.nome.toLowerCase() === entrada);
  }


  /* if (/^\d+$/.test(entrada)) {
     colaborador = todos.find(c => c.nome.toLowerCase() == entrada /*|| c.matricula.includes(entrada) );
   } else {
     colaboradorManual = entrada.toUpperCase().split(",").map(item => item.trim());
     const [nome, matricula, cdc] = colaboradorManual;
     colaborador = { nome, matricula, cdc };
         console.log("MATRICULA: ", colaborador.matricula);
     colaborador = todos.find(c => c.nome.toLowerCase() === entrada);
   }
*/
  if (!colaborador) {
    alert("Colaborador não encontrado.");
    return;
  }


  const titulo = ` ${colaborador.matricula} - ${colaborador.nome}`;
  const id = `req-${Date.now()}`;
  const itens = Array.from(document.querySelectorAll("#itensRequisicao li")).map(li => li.textContent);
  const editar = `<button onclick="toggleEditor('${id}')">Editar</button>`;
  const apagar = `<button onclick="removerRequisicao('${id}')">Remover</button>`;

  const html = `
  <div id="${id}" class="tarefa">
    <h3>${titulo}</h3>
    <ul id="itens-${id}">
    ${itens.map(item => `<li><label>${item}</label></li>`).join("")}
    </ul>
    <p class="editar">${editar} ${apagar}</p>
    <div id="editor-${id}" style="display:none;">
      <input type="text" id="novoItem-${id}" placeholder="Adicionar novo item" oninput="sugerirEPIs('novoItem-${id}','sugestoes-${id}')">
      <div id="sugestoes-${id}" class="sugestoes" style="display:none;"></div>
      <button onclick="adicionarItem('${id}')">Adicionar</button>
      <ul id="remover-${id}">
        ${itens.map((item, index) => `
          <li>
            <label>${item}</label>
            <span class="spanButton" onclick="removerItem('${id}', ${index})">🗑️ Excluir</span>
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

function buscarRequisicoes() {
  const entrada = document.getElementById("buscaRequisicao2").value.trim().toLowerCase();
  const resultadoDiv = document.getElementById("resultadoBusca");
  const pesquisaDiv = document.getElementById('pesquisaReq');
  const buscaDiv = document.getElementById('exibePesqReq');

  pesquisaDiv.style.display = "none";
  buscaDiv.style.display = "flex";

  resultadoDiv.innerHTML = "";
  const requisicoes = JSON.parse(localStorage.getItem("requisicoes") || "[]");
  const filtradas = requisicoes.filter(req => req.titulo.toLowerCase().includes(entrada));
  if (filtradas.length === 0) {
    resultadoDiv.innerHTML = `<p class="negativo" style="justify-items: left; font-size: 2.3rem;">Nenhuma requisição encontrada para <span style="color: var(--cor-neutro)">"${entrada}"</span>.</p>`;
    return;
  }
  filtradas.forEach(req => {
    const html = `<a href="#${req.id}" style="justify-content: left; text-decoration: none; display:block; margin-bottom:10px; margin-top: 10px; color: var(--purple1); font-size: 2.3rem;">${req.titulo}</a>`;
    resultadoDiv.innerHTML += html;
  });
}

function toggleEditor(id) {
  const editor = document.getElementById(`editor-${id}`);
  const btnEdt = document.getElementById(`btnEditar-${id}`); 

  editor.style.display = editor.style.display === "none" ? "block" : "none";

  if (editor.style.display === "none") {
    btnEdt.innerText = "Editar";
    btnEdt.style.backgroundColor = "var(--primary)";
  }
  if (editor.style.display === "block") {
    btnEdt.innerText = "Salvar";
    btnEdt.style.backgroundColor = "var(--verde1)";
    btnEdt.blur();
  }
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
      document.getElementById(inputId).value = `${c.nome}`;
      sugestoesDiv.innerHTML = "";
      sugestoesDiv.style.display = "none";
    };
    sugestoesDiv.appendChild(btn);
  });
}
function fecharDetalhesColaborador() {
  const detalhesDiv = document.getElementById("detalhesColaborador");
  detalhesDiv.style.display = "none";

}

function detalharColaborador(matricula) {
  const colaborador = colaboradoresPDF.find(c => c.matricula === matricula);
  const detalherDiv = document.getElementById("detalhesColaborador");
  detalherDiv.style.display = "block";
  if (!colaborador) return;
  
  detalherDiv.innerHTML = `
  <span  id="botaoFecharDetalhes" onclick="fecharDetalhesColaborador()"> &times;</span>
    <h3>Detalhes do Colaborador</h3>
    <p><strong style="color: var(--white2);">Nome:</strong> ${colaborador.nome}</p>
    <p><strong style="color: var(--white2);">Matrícula:</strong> ${colaborador.matricula}</p>
    <p><strong style="color: var(--white2);">Setor:</strong> ${descreverCDC(colaborador.cdc)}</p>
    <p><strong style="color: var(--white2);">Função:</strong> ${colaborador.funcao}</p>
  `;
}


function listarCDC() {  
  const cdcInput = document.querySelector("#cdc input");
  const cdcValor = cdcInput.value.trim();
  const resultadoDiv = document.getElementById("resultadoCDC");
  resultadoDiv.innerHTML = "";
  if (!cdcValor) {
    resultadoDiv.innerHTML = `<p class="negativo">Por favor, insira um CDC para buscar.</p>`;
    return;
  }
  const colaboradoresFiltrados = colaboradoresPDF.filter(c => c.cdc === cdcValor);
  if (colaboradoresFiltrados.length === 0) {
    resultadoDiv.innerHTML = `<p class="negativo">Nenhum colaborador encontrado para o CDC ${cdcValor}.</p>`;
    return;
  }
 resultadoDiv.innerHTML = `
  <div class="container-scroll">
    <table class="tabela-cdc">
      <thead>
        <tr>
          <th>Matrícula</th>
          <th>Colaborador</th>
        </tr>
      </thead>
      <tbody>
        ${colaboradoresFiltrados.map(c => `
          <tr onclick="detalharColaborador('${c.matricula}')">
            <td>${c.matricula}</td>
            <td>${c.nome}</td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  </div>
`;
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
      <tr><td><strong>Saldo Anterior:</strong> </td> <td><span class="${corHora(colaborador.saldoAnterior)}">${colaborador.saldoAnterior}</span></td></tr>
      <tr><td><strong>Horas Crédito:</strong> </td> <td><span class="${corHora(colaborador.horasCredito)}">${colaborador.horasCredito}</span></td></tr>
      <tr><td><strong>Horas Débito:</strong> </td> <td><span class="${corDebito(colaborador.horasDebito)}">${colaborador.horasDebito}</span></td></tr>
      <tr class="${corHora(colaborador.saldoAtual)}" style="background-color: ${corSaldo(colaborador.saldoAtual)};"><td><strong>Saldo Atual:</strong> </td> <td><span class="${corHora(colaborador.saldoAtual)}">${colaborador.saldoAtual}</span></td></tr>
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

function pesquisarRequisicoes() {
  const pesquisaDiv = document.getElementById('pesquisaReq');
  const exibirDiv =  document.getElementById('exibePesqReq');

  exibirDiv.style.display = "none";
  pesquisaDiv.style.display = "flex";
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
          <input class="adicionar" type="text" id="novoItem-${req.id}" placeholder="Adicionar novo item" oninput="sugerirEPIs('novoItem-${req.id}','sugestoes-${req.id}')">
          <div id="sugestoes-${req.id}" class="sugestoes" style="display:none;"></div>
          <button class="adicionar" onclick="adicionarItem('${req.id}')">Adicionar</button>
          <ul id="remover-${req.id}">
            ${req.itens.map((item, index) => `
              <li>
                <label>${item}</label>
                <span onclick="removerItem('${req.id}', ${index})" style="cursor: pointer; color: var(--cor-negativo);">🗑️ Remover</span>
              </li>
            `).join("")}
          </ul>
        </div><div class="editar">
        <button style="background-color: var(--primary); color: var(--white1);" onclick="toggleEditor('${req.id}')" id="btnEditar-${req.id}">Editar</button>
        <button style="background-color: var(--danger); color: var(--white1);" onclick="removerRequisicao('${req.id}')">Remover</button></div>
      </div>`;
    container.insertAdjacentHTML("beforeend", html);
  });
}

// ==============  parte do QR Code/Código de barras e Câmera








const output = document.getElementById("output");
let html5QrCode;

/////////////////////////////////////////////////////////////////




const FORMATOS = {
  // ETIQUETA UD
  ETIQUETA_UD: {
    check: (partes) => partes.length === 6,
    formatar: (partes) => {
      const qtd = Number(partes[4].slice(1, -3)).toString();
      return `PALLET: ${partes[0].slice(-10)}\n` +
             `SKU: ${partes[1].slice(2)}\n` +
             `Lote: ${partes[2].slice(2)}\n` +
             `Validade: ${partes[3].slice(2)}\n` +
             `Qtd: ${qtd}\n` +
             `Ordem: ${partes[5].slice(7)}`;
    }
  },
  // ETIQUETA DE EMBARQUE
  ETIQUETA_EMBARQUE: {
    check: (partes) => partes.length === 4,
    formatar: (partes) => {
      const v = partes[1].slice(2, -2);
      const vf = v.replace(/(\d{4})(\d{2})/, "$2.$1")
      return `LOTE: ${partes[0].slice(2)}\n` +
             `VALIDADE: ${vf}\n` +
             `VOLUME: ${partes[2].slice(2)}\n` +
             `SKU: ${partes[3].slice(2)}`;
    }
  },
  // ETIQUETA DE IDENTIFICAÇÃO
  ETIQUETA_IDENTIFICACAO: {
    check: (partes) => partes.length === 5,
    formatar: (partes) => {
      const v = partes[3].slice(2);
      const vf = v.replace(/(\d{2})(\d{2})(\d{4})/, "$1.$2.$3")
      return `PALLET: ${Number(partes[0].slice(2))}\n` +
             `PRODUTO: ${partes[1].slice(2)}\n` +
             `LOTE SAP: ${partes[2].slice(2)}\n` +
             `VALIDADE: ${vf}\n` +
             `QUANTIDADE: ${Number(partes[4].slice(1, -3))}`;
    }
  },
  // ORDEM DE PRODUÇAO
  ORDEM_PRODUCAO: {
    check: (partes) => partes.length === 8,
    formatar: (partes) => {
      const val = partes[3].slice(2);
      const v = val.split("/");
      const vf = v[1] + "." + v[0];
      const di = partes[7].slice(2);
      const dif = di.replace(/(\d{4})(\d{2})(\d{2})/, "$3.$2.$1")
      return `SKU: ${partes[0].slice(-10)}\n` +
             `PRODUTO: ${partes[1].slice(2)}\n` +
             `LOTE: ${partes[2].slice(2)}\n` +
             `VALIDADE: ${vf}\n` +
             `UN: ${partes[4].slice(2)}\n` +
             `CX: ${partes[5].slice(2)}\n` +
             `QUANTIDADE/CAIXA: ${partes[6].slice(2)}\n` +
             `DATA DE IMPRESSÃO: ${dif}`;
    }
  },
  // ORDEM PRODUÇAO ESMALTE
  ORDEM_ESMALTE: {
    cleck: (partes) => partes.length === 10,
    formatar: (partes) => {
      const v = partes[3].slice(2);
      const va = v.split("/");
      const vf = va[1].va[0];
      const di = partes[8].slice(2);
      const dif = di.replace(/(\d{4})(\d{2})(\d{2})/, "$3.$2.$1");
      return `SKU: ${partes[0].slice(2)}\n` +
              `PRODUTO: ${partes[1].slice(2)}\n` +
              `LOTE: ${partes[2].slice(2)}\n` +
              `VALIDADE: ${vf}\n` +
              `UN: ${partes[4].slice(2)}\n` +
              `ZUI: ${partes[5].slice(2)}\n` +
              `CX: ${partes[6].slice(2)}\n` +
              `QTD/CAIXA: ${partes[7].slice(2)}\n` +
              `DATA DE IMPRESSÃO: ${dif}\n` +
              `DESCRIÇÃO: ${partes[9].slice(2)}\n`;
    }
  }
};
function processarDados(decodedText) {
  if (!decodedText.includes("]")) return "Código: " + decodedText;

  const partes = decodedText.split("]");
  
  // Procura no mapa qual formato satisfaz a condição (check)
  const formatoEncontrado = Object.values(FORMATOS).find(f => f.check(partes));

  if (formatoEncontrado) {
    try {
      return formatoEncontrado.formatar(partes);
    } catch (e) {
      return "Erro ao formatar padrão conhecido: " + e.message;
    }
  }

  return "Padrão desconhecido: " + decodedText;
  
}




/////////////////////////////////////////////////////////////////

async function iniciarScanner() {
  html5QrCode = new Html5Qrcode("reader");

  const config = {
    fps: 15,
    qrbox: { width: 250, height: 250 },
    aspectRatio: 1.0
  };

  try {
    await html5QrCode.start(
      { facingMode: "environment" },
      config,
      (decodedText) => {
        output.textContent = "LIDO COM SUCESSO:\n" + processarDados(decodedText);
        console.log(decodedText);
        pararScanner();
        if (navigator.vibrate) navigator.vibrate(200);
      }
    );
    output.textContent = "Escaneando... Aponte para o código.";
  } catch (err) {
    output.textContent = "Erro ao iniciar: " + err;
  }
}

function pararScanner() {
  if (html5QrCode) {
    html5QrCode.stop().then(() => {
      output.textContent += "\nCâmera encerrada.";
    }).catch(err => console.error("Erro ao parar:", err));
  }
}

document.getElementById("btnAcessar").onclick = iniciarScanner;
document.getElementById("btnFechar").onclick = pararScanner;




// ************ PARTE DO CÓDIGO PARA IMAGENS DO HORA-A-HORA ************* //


let dbImagens;
let streamAtivo = null;

// 1. Inicializa Banco de Dados
const reqDB = indexedDB.open("InspecaoTecnica_DB", 3);
reqDB.onupgradeneeded = e => {
  const db = e.target.result;
  if (!db.objectStoreNames.contains("fotos")) {
    db.createObjectStore("fotos", { keyPath: "chave" });
  }
};
reqDB.onsuccess = e => {
  dbImagens = e.target.result;
  renderizarEstruturaEFotos(); // Só mostra o que tem foto ao carregar
};

// 2. Controle da Câmera (Melhor Resolução)
async function iniciarCamera() {
  const video = document.getElementById('video');
  try {
    streamAtivo = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: "environment" }, width: { ideal: 1920 }, height: { ideal: 1080 } }
    });
    video.srcObject = streamAtivo;
    document.getElementById('area-camera').style.display = 'block';
    document.getElementById('btnAbrir').style.display = 'none';
    document.getElementById('btnFecharCam').style.display = 'block';
  } catch (err) { alert("Câmera não disponível: " + err); }
}

function pararCamera() {
  if (streamAtivo) { streamAtivo.getTracks().forEach(t => t.stop()); streamAtivo = null; }
  document.getElementById('area-camera').style.display = 'none';
  document.getElementById('btnAbrir').style.display = 'block';
  document.getElementById('btnFecharCam').style.display = 'none';
}

// 3. Captura e Processamento
function tirarFoto() {
  const video = document.getElementById('video');
  const canvas = document.getElementById('canvas');
  const linha = document.querySelector('input[name="linha"]:checked').value;
  const tipo = document.querySelector('input[name="tipo"]:checked').value;

  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  canvas.getContext('2d').drawImage(video, 0, 0);

  canvas.toBlob(blob => {
    const chave = (tipo === 'os') ? `${linha}-os-${Date.now()}` : `${linha}-${tipo}`;
    const tx = dbImagens.transaction("fotos", "readwrite");
    tx.objectStore("fotos").put({ chave, linha, tipo, data: blob });
    tx.oncomplete = () => renderizarEstruturaEFotos();
  }, 'image/jpeg', 0.85);
}

// 4. Renderização Dinâmica (Só exibe linhas com foto)
function renderizarEstruturaEFotos() {
  const container = document.getElementById('container-linhas');
  container.innerHTML = "";

  const store = dbImagens.transaction("fotos", "readonly").objectStore("fotos");
  const fotosMap = new Map();

  store.openCursor().onsuccess = e => {
    const cursor = e.target.result;
    if (cursor) {
      const foto = cursor.value;
      if (!fotosMap.has(foto.linha)) fotosMap.set(foto.linha, []);
      fotosMap.get(foto.linha).push(foto);
      cursor.continue();
    } else {
      // Desenha apenas as linhas que possuem fotos no banco
      Array.from(fotosMap.keys()).sort().forEach(linhaKey => {
        const card = criarCardHTML(linhaKey);
        container.appendChild(card);

        fotosMap.get(linhaKey).forEach(foto => {
          exibirFotoNoCard(foto);
        });
      });
    }
  };
}

function criarCardHTML(l) {
  const sec = document.createElement('section');
  sec.className = 'linha-card';
  sec.innerHTML = `
        <h2>${l.replace('L', 'LINHA ')}</h2>
        <div class="sub-secao">
            <div class="box" id="box-${l}-caderno"><h4>CADERNO</h4></div>
            <div class="box" id="box-${l}-quadro"><h4>QUADRO</h4></div>
        </div>
        <div id="grid-${l}-os" style="display:grid; grid-template-columns: 1fr 1fr 1fr; justify-content:center; gap:5px; margin-top:15px;"></div>
    `;
  return sec;
}

function exibirFotoNoCard(foto) {
  const url = URL.createObjectURL(foto.data);
  const btn = `<button class="btn-del" onclick="apagarFoto('${foto.chave}')">🗑️</button>`;
  const imgHtml = `${btn}<img src="${url}" onclick="abrirZoom('${url}')" style="width:100%; height:100%; object-fit:cover; cursor:pointer;">`;

  if (foto.tipo === 'os') {
    const div = document.createElement('div');
    div.className = 'box'; div.style.width = '180px'; div.style.height = '180px';
    div.innerHTML = imgHtml;
    document.getElementById(`grid-${foto.linha}-os`).appendChild(div);
  } else {
    const box = document.getElementById(`box-${foto.linha}-${foto.tipo}`);
    if (box) box.innerHTML = imgHtml;
  }
}

// 5. Funções de Apoio
function apagarFoto(chave) {
  const tx = dbImagens.transaction("fotos", "readwrite");
  tx.objectStore("fotos").delete(chave);
  tx.oncomplete = () => renderizarEstruturaEFotos();

}

function abrirZoom(url) {
  document.getElementById('imgZoom').src = url;
  document.getElementById('modalZoom').style.display = "flex";
}

function mostrarSecao(id) {
  document.querySelectorAll('.secao').forEach(s => s.style.display = 'none');
  document.getElementById(id).style.display = 'flex';
  if (id !== 'hora-a-hora') pararCamera();
  if (id === 'hora-a-hora') renderizarEstruturaEFotos();
}



// ****************** CARREGA REQUISIÇOES *************** //

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
