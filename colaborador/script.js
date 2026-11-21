const { createClient } = supabase;
const db = createClient(
  'https://vrzdgwzzqxdinnijydhg.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZyemRnd3p6cXhkaW5uaWp5ZGhnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYzMDE1OTAsImV4cCI6MjA5MTg3NzU5MH0.64kRIoCtJDtT8svA9lsXBCSHs_PQEcNRNTEe8EbVGmc'
);



let textoPDF = "";
let colaboradoresPDF = [];
let colaboradoresCSV = [];
let listaEPIs = [];

let deferredPrompt;

// Escuta o evento do navegador que diz que o app pode ser instalado
window.addEventListener('beforeinstallprompt', (e) => {
  // Impede o prompt automático do navegador
  e.preventDefault();
  // Armazena o evento
  deferredPrompt = e;

  // Mostra o banner imediatamente (já que é para o colaborador ver na entrada)
  const banner = document.getElementById('pwa-install-banner');
  if (banner) {
    banner.style.display = 'block';
  }
});

// Lógica do botão de instalação
document.addEventListener('DOMContentLoaded', () => {
  const btnInstalar = document.getElementById('btn-instalar-pwa');

  if (btnInstalar) {
    btnInstalar.addEventListener('click', async () => {
      if (!deferredPrompt) {
        alert("O app já está instalado ou seu navegador não suporta a instalação direta.");
        return;
      }

      // Mostra a pergunta oficial do sistema (Android/iOS/Chrome)
      deferredPrompt.prompt();

      // Verifica se o usuário aceitou ou cancelou
      const { outcome } = await deferredPrompt.userChoice;

      // Limpa o prompt para não ser usado de novo
      deferredPrompt = null;

      // Esconde o banner
      document.getElementById('pwa-install-banner').style.display = 'none';
    });
  }
});

// Esconde o banner se o app for instalado por outros meios (ex: menu do Chrome)
window.addEventListener('appinstalled', () => {
  const banner = document.getElementById('pwa-install-banner');
  if (banner) banner.style.display = 'none';
  deferredPrompt = null;
});

fetch("../listanomes.csv")
  .then(response => response.text())
  .then(texto => {
    const linhas = texto.split("\n").map(l => l.trim()).filter(l => l);
    colaboradoresCSV = linhas.slice(3).map(linha => {
      const [matricula, nome, cdc, funcao] = linha.split(";").map(v => v.trim());
      return { matricula, nome, cdc, funcao }; 
    });
  })
  .catch(err => {
    console.error("Erro ao carregar listanomes.csv:", err);
  });

fetch("../bancodehoras.pdf")
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

fetch("../bancodehoras.pdf")
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
        const nomeCurto = match[2].trim().split(" ")[0]+" "+match[2].trim().split(" ").reverse()[0];

        colaboradoresPDF.push({
          cdc: formatarCDC(dadosSetor.cdc),
          setor: dadosSetor.setor,
          matricula: matriculaLimpa,
          nome: nomeCurto,
          // Se achar no CSV, usa a função de lá. Se não, usa um texto padrão.
          funcao: dadosNoCSV ? dadosNoCSV.funcao : "Função não encontrada",
          saldoAnterior: match[3].trim(),
          horasCredito: match[4].trim(),
          horasDebito: match[5].trim(),
          saldoAtual: match[6].trim()
        });
      }
    }

    

    document.getElementById("resultado").innerHTML = "<p>PDF carregado com sucesso. Digite uma matrícula para buscar.</p>";
  })
  .catch(err => {
    document.getElementById("resultado").innerHTML = `<p class="negativo">Erro ao carregar o PDF.</p>`;
    console.error(err);
  });


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
    case '76526': setor = 'ADM PESSOAL'
      break
    case '76521': setor = 'ALMOX. NÃO PRODUTIVO - SVY'
      break
    case '76512': setor = 'ALMOXARIFADO MP/EM - SVY'
      break
    case '76532': setor = 'APOIO E MOV. LINHAS-COSMET. - SVY'
      break
    case '76536': setor = 'CALDEIRA - SVY'
      break
    case '76506': setor = 'CONTROLADORIA - SVY'
      break
    case '76511': setor = 'CONTROLE DE QUALIDADE - SVY'
      break
    case '76507': setor = 'DIR. INDUSTRIAL - SVY'
      break
    case '76504': setor = 'DIRETORIA MANUFATURA'
      break
    case '76514': setor = 'ENGENHARIA - SVY'
      break
    case '76528': setor = 'ENGENHARIA DE PROCESSO - SVY'
      break
    case '76554': setor = 'ENTUFAMENTO/MONT.TAMPA ESM-SVY'
      break
    case '76587': setor = 'ENVASE AEROSÓIS - SVY'
      break
    case '76581': setor = 'ENVASE COLORAÇÃO - SVY'
      break
    case '76590': setor = 'ENVASE COLORACAO WELLA - SVY'
      break
    case '76582': setor = 'ENVASE ESMALTES - SVY'
      break
    case '76585': setor = 'ENVASE LINHAS RÁPIDAS - SVY'
      break
    case '76591': setor = 'ENVASE PROFESSIONAL WELLA - SNC'
      break
    case '76505': setor = 'EXCELENCIA OPERACIONAL'
      break
    case '76573': setor = 'FABRICAÇÃO ALCOOLICOS - SVY'
      break
    case '76571': setor = 'FABRICAÇÃO COLORAÇÃO - SVY'
      break
    case '76570': setor = 'FABRICACAO COLORACAO WELLA - SVY'
      break
    case '76574': setor = 'FABRICAÇÃO COSMÉTICOS - SVY'
      break
    case '76572': setor = 'FABRICAÇÃO ESMALTES - SVY'
      break
    case '76560': setor = 'GER. EMBALAGENS PLÁSTICAS - SVY'
      break
    case '76510': setor = 'GERÊNCIA COSMÉTICO - SVY'
      break
    case '76518': setor = 'GERÊNCIA DE UTILIDADES - SVY'
      break
    case '76509': setor = 'GERÊNCIA LOGÍSTICA - SVY'
      break
    case '76564': setor = 'INJEÇÃO TAMPAS - SVY'
      break
    case '76530': setor = 'INSPECAO DE QUALIDADE - SNC'
      break
    case '76565': setor = 'MANUT. INDUST. EMB PLÁSTICAS - SVY'
      break
    case '76520': setor = 'MANUT. INDUSTRIAL COSMÉTICO - SVY'
      break
    case '76592': setor = 'MANUTENCAO HAIR COLOR - SNC'
      break
    case '76537': setor = 'MANUTENÇÃO UTILIDADES - SVY'
      break
    case '76517': setor = 'MEIO AMBIENTE - SVY'
      break
    case '76540': setor = 'OPERACAO CUSTOMIZACAO - SNC'
      break
    case '76531': setor = 'PATIO DE INFLAMAVEIS - SNC'
      break
    case '76523': setor = 'PCP COSMÉTICO - SNC'
      break
    case '76524': setor = 'PESAGEM COSMÉTICOS - SVY'
      break
    case '76525': setor = 'PESAGEM SOPRO/INJEÇÃO - SVY'
      break
    case '76589': setor = 'PROJETOS ESTRATEGICOS SNC'
      break
    case '76515': setor = 'RECEBIMENTO FISCAL FABRIL'
      break
    case '76527': setor = 'RH - SEN CANEDO'
      break
    case '76538': setor = 'SEGURANÇA DO TRABALHO - SNC'
      break
    case '76563': setor = 'SERIGRAFIA FRASCOS - SVY'
      break
    case '76513': setor = 'SERVIÇOS ADMINISTRATIVOS - SVY'
      break
    case '76562': setor = 'SOPRO - SNC - SVY'
      break

    default:
      setor = 'INDEFINIDO'
  }
  return setor;
}

function buscarBancoHoras() {
  const entrada = document.getElementById("buscaColaborador").value.trim().toLowerCase();
  const resultadoDiv = document.getElementById("resultado");
  resultadoDiv.innerHTML = "";




  const todos = [...colaboradoresPDF];
  let colaborador = localStorage.getItem('nomeColaborador') ? null : null;

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
      <tr><td><strong>Matrícula:</strong> </td> <td>${colaborador.matricula}</td></tr>
      <tr><td><strong>Saldo Anterior:</strong> </td> <td><span class="${corHora(colaborador.saldoAnterior)}">${colaborador.saldoAnterior}</span></td></tr>
      <tr><td><strong>Horas Crédito:</strong> </td> <td><span class="${corHora(colaborador.horasCredito)}">${colaborador.horasCredito}</span></td></tr>
      <tr><td><strong>Horas Débito:</strong> </td> <td><span class="${corDebito(colaborador.horasDebito)}">${colaborador.horasDebito}</span></td></tr>
      <tr class="${corHora(colaborador.saldoAtual)}" style="background-color: ${corSaldo(colaborador.saldoAtual)};"><td><strong>Saldo Atual:</strong> </td> <td><span class="${corHora(colaborador.saldoAtual)}">${colaborador.saldoAtual}</span></td></tr>
      </table>
  `;
}


function sugerirEPIs(inputId = "epiInput", sugestoesId = "sugestoesEPI") {
  const input = document.getElementById(inputId);
  const sugestoesDiv = document.getElementById(sugestoesId);
  const qtd = document.getElementById("quantidade").value;
  const desc = document.getElementById("descricao").value || "TROCA/DESGASTE";


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
    const qtdCode = `<input type="number" id="quantidade" onfocus="this.value='';" class="quantidade" placeholder="Quantidade"
                min="1" value="1">`;
    const descCode = `<select id="descricao" name="descricao" class="descricao">
                <option value="TROCA/DESGASTE NATURAL" class="desc">Troca/Desgaste Natural</option>
                <option value="NECESSIDADE" class="desc necessidade">Necessidade</option>
                <option value="PERDA" class="desc perda">Perda</option>
                <option value="USO COLETIVO" class="desc coletivo">Uso Coletivo</option>
            </select>`;


    btn.type = "button";
    btn.textContent = `${qtd} ${epi.codigo} - ${epi.descricao} #${desc}`;
    btn.onclick = () => {
      if (inputId === "epiInput") {
        adicionarItemEPI(epi);
      } else {
        const requisicaoId = inputId.replace("novoItem-", "");
        adicionarItemComValor(requisicaoId, `${qtd} ${epi.codigo} - ${epi.descricao} #${desc}`);
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
  const qtd = document.getElementById("quantidade").value || "1";
  const desc = document.getElementById("descricao").value || "TROCA/DESGASTE";
  

  switch (desc) {
    case "TROCA/DESGASTE":
      li.innerHTML = `<label class="new-item"><span class="item-quantidade">${qtd}</span> ${epi.codigo} - ${epi.descricao} <span class="desc">${desc}</span></label>`;
      break;
    case "PERDA":
      li.innerHTML = `<label class="new-item"><span class="item-quantidade">${qtd}</span> ${epi.codigo} - ${epi.descricao} <span class="desc perda">${desc}</span></label>`;
      break;
    case "NECESSIDADE":
      li.innerHTML = `<label class="new-item"><span class="item-quantidade">${qtd}</span> ${epi.codigo} - ${epi.descricao} <span class="desc necessidade">${desc}</span></label>`;
      break;
    case "USO COLETIVO":
      li.innerHTML = `<label class="new-item"><span class="item-quantidade">${qtd}</span> ${epi.codigo} - ${epi.descricao} <span class="desc coletivo">${desc}</span></label>`;
      break;
    default:
      li.innerHTML = `<label class="new-item"><span class="item-quantidade">${qtd}</span> ${epi.codigo} - ${epi.descricao} <span class="desc">${desc}</span></label>`;
  }
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
    colaborador = todos.find(c => c.nome?.toLowerCase() === entrada?.toLowerCase());
  }


  if (!colaborador) {
    alert("Colaborador não encontrado.");
    return;
  }


  const titulo = ` ${colaborador.matricula} - ${colaborador.nome}`;
  const id = `req-${colaborador.matricula}`;
  const itens = Array.from(document.querySelectorAll("#itensRequisicao li")).map(li => li.outerHTML);
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



function removerItem(requisicaoId, index) {
  const listaVisual = document.getElementById(`itens-${requisicaoId}`);


  const itens = Array.from(listaVisual.querySelectorAll("li"));


  if (itens[index]) itens[index].remove();


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


  const requisicoes = JSON.parse(localStorage.getItem("requisicoes") || "[]");
  const atualizadas = requisicoes.map(req => {
    if (req.id === requisicaoId) {
      req.itens.push(v);
    }
    return req;
  });

  localStorage.setItem("requisicoes", JSON.stringify(atualizadas));
}

async function adicionarItem(reqId) {
  const input = document.getElementById(`novoItem-${reqId}`);
  const novoItem = input.value.trim();
  if (!novoItem) return;

  // Busca os itens atuais do banco
  const { data, error } = await db
    .from('requisicoes')
    .select('itens')
    .eq('id', reqId)
    .single();

  if (error) { console.error(error); return; }

  const itensAtualizados = [...data.itens, novoItem];

  // Atualiza no banco
  await db.from('requisicoes').update({ itens: itensAtualizados }).eq('id', reqId);

  // Atualiza o DOM (comportamento original)
  const ul = document.getElementById(`itens-${reqId}`);
  ul.insertAdjacentHTML('beforeend', `<li><label>${novoItem}</label></li>`);
  input.value = '';
}




function sugerirColaboradorUnificado(inputId, sugestaoId) {
  // Verificar se as variáveis existem
  if (typeof colaboradoresPDF === 'undefined' || typeof colaboradoresCSV === 'undefined') {
    console.error('Listas de colaboradores não carregadas');
    return;
  }

  const input = document.getElementById(inputId);
  const sugestoesDiv = document.getElementById(sugestaoId);
  
  if (!input || !sugestoesDiv) {
    console.error('Elementos não encontrados:', inputId, sugestaoId);
    return;
  }

  const termo = input.value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  sugestoesDiv.innerHTML = "";
  sugestoesDiv.style.display = "none";

  if (termo.length < 3) return;

  const encontradosPDF = colaboradoresPDF.filter(c => {
    const nome = c.nome?.normalize("NFD").replace(/[\u0300-\u036f]/g, "") || '';
    return nome.includes(termo) || c.matricula?.includes(termo) || false;
  });

  let encontrados = encontradosPDF;

  if (encontrados.length === 0) {
    encontrados = colaboradoresCSV.filter(c => {
      const nome = c.nome?.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") || '';
      return nome.includes(termo) || c.matricula?.includes(termo) || c.funcao?.includes(termo) || false;
    });
  }

  if (encontrados.length === 0) return;

  sugestoesDiv.style.display = "block";
  encontrados.forEach(c => {
    const btn = document.createElement("button");
    btn.type = "button";

    
    const cdcDesc = c.cdc ? descreverCDC(c.cdc) : 'CDC não definido';
    
    btn.innerHTML = `${c.nome} - ${c.matricula || 'Sem matrícula'} <br> ${cdcDesc}`;
    
    btn.onclick = () => {
      input.value = c.nome || '';
      sugestoesDiv.innerHTML = "";
      sugestoesDiv.style.display = "none";
    };
    sugestoesDiv.appendChild(btn);
  });
}



// ─── Salvar requisição no banco ───────────────────────────────────────────────
async function salvarRequisicaoLocal(id, titulo, itens) {
  const { error } = await db.rpc('salvar_ou_concatenar_requisicao' , {
    p_id: id,
    p_titulo: titulo,
    p_novos_itens: itens
  });

  if (error) {
    console.error('Erro ao salvar requisição:', error.message);
    alert('Não foi possível salvar a requisição. Verifique a conexão.');
  
  }

}

// ─── Remover requisição do banco ──────────────────────────────────────────────
async function removerRequisicao(id) {
  const div = document.getElementById(id);

  if (div) {
    if (!confirm('Tem certeza que deseja remover esta requisição?')) return;
    div.remove();
  }

  const { error } = await db
    .from('requisicoes')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Erro ao remover requisição:', error.message);
  }
}

// ─── Pesquisar requisições (sem alteração, mantém comportamento original) ─────
function pesquisarRequisicoes() {
  const pesquisaDiv = document.getElementById('pesquisaReq');
  const exibirDiv = document.getElementById('exibePesqReq');

  exibirDiv.style.display = 'none';
  pesquisaDiv.style.display = 'flex';
}

// ─── Carregar requisições do banco ────────────────────────────────────────────
async function carregarRequisicoes() {

  const { data: requisicoes, error } = await db
    .from('requisicoes')
    .select('*')
    .order('criado_em', { ascending: true });

  if (error) {
    console.error('Erro ao carregar requisições:', error.message);
    return;
  }

  const container = document.getElementById('listaRequisicoes');

  requisicoes.forEach(req => {

    // itens vem como array do JSONB — garante compatibilidade
    const itens = Array.isArray(req.itens) ? req.itens : JSON.parse(req.itens || '[]');
    const dataCriacao = req.criado_em.split('T')[0]; // Formata a data para YYYY-MM-DD
    const dataFormatada = dataCriacao.split('-').reverse().join('/'); // Converte para DD/MM/YYYY

    const html = `
      <div id="${req.id}" class="tarefa">
        <h3>${req.titulo} - <span class="data-criacao">${dataFormatada}</span></h3>
        <ul id="itens-${req.id}">
          ${itens.map(item => `<li><label>${item}</label></li>`).join('')}
        </ul>
      </div>`;

    container.insertAdjacentHTML('beforeend', html);
  });
}




function secao(secaoId) {
  // 1. Esconde todas as seções
  document.querySelectorAll(".secao").forEach(div => div.style.display = "none");
  
  // 2. Mostra a seção desejada
  const secaoAlvo = document.getElementById(secaoId);
  if (secaoAlvo) {
      secaoAlvo.style.display = "flex";
  }

  // 3. Remove a classe ativa de todos os botões
  document.querySelectorAll(".button-bottom").forEach(btn => btn.classList.remove("button-active"));
  
  // 4. Descobre qual botão foi clicado usando o event do navegador
  if (window.event && window.event.currentTarget) {
      window.event.currentTarget.classList.add("button-active");
  }
}


// ============================================================
// CHATBOT DE ATENDIMENTO AO COLABORADOR
// ============================================================

const Chatbot = (() => {
  const estado = { passo: 'idle', dados: {} };
  let form, input, messages;

  function init() {
    form     = document.getElementById('chat-form');
    input    = document.getElementById('chat-input');
    messages = document.getElementById('chat-messages');

    if (!form || !input || !messages) {
      console.warn('Chatbot: elementos não encontrados.');
      return;
    }

    // ✅ BLOQUEIA O RELOAD DO FORMULÁRIO
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      e.stopPropagation();
      enviarMensagem();
      return false;
    });

    // ✅ TAMBÉM BLOQUEIA O ENTER DO TECLADO
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        e.stopPropagation();
        enviarMensagem();
      }
    });

    // Saudação personalizada
    const nome = localStorage.getItem('nomeColaborador');
    if (nome) {
      addMsg(`Olá, <strong>${nome.split(' ')[0]}</strong>! Como posso te ajudar?`);
    }

    console.log('Chatbot inicializado ✅');
  }

  function enviarMensagem() {
    const texto = input.value.trim();
    if (!texto) return;
    input.value = '';
    responder(texto);
  }

  function addMsg(html, tipo = 'bot') {
    const div = document.createElement('div');
    div.className = `msg ${tipo}`;
    div.innerHTML = html;
    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
  }

  // ─── Detecta a intenção do usuário ────────────────────────
  function detectarIntencao(texto) {
    const t = texto.toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    // Se estamos no meio de um fluxo, respeita o passo
    if (estado.passo === 'aguardando_matricula') return 'fornecer_matricula';
    if (estado.passo === 'aguardando_epi')       return 'fornecer_epi';
    if (estado.passo === 'aguardando_confirmacao') return 'fornecer_confirmacao';

    // Comandos básicos
    if (t.match(/^(ajuda|help|\?|menu)/))              return 'ajuda';
    if (t.match(/^(oi|ola|bom dia|boa tarde|boa noite|olá)/)) return 'saudacao';
    if (t.match(/^(cancelar|sair|voltar|limpar)/))       return 'cancelar';

    // Banco de horas
    if (t.match(/banco de horas|horas|saldo|ponto|espelho|banco|bh|hora/)) return 'banco_horas';

    // Requisição de EPI
    if (t.match(/epi|requisicao|requisitar|solicitar|pedir|requisição|requisições/)) return 'requisicao';

    // Consultar setor / matrícula
    if (t.match(/setor|matricula|meu cdc|onde eu trabalho|cdc/)) return 'consultar_setor';

    // Listar requisições
    if (t.match(/minhas requisicoes|lista|historico|requisições|requisicoes/))        return 'listar_requisicoes';

    // Se digitou só números, provavelmente é matrícula
    if (/^\d{3,}$/.test(texto.trim())) return 'fornecer_matricula';

    return 'desconhecido';
  }

  // ─── Função principal ─────────────────────────────────────
  async function responder(texto) {
    addMsg(texto, 'user');
    const intencao = detectarIntencao(texto);

    // Se for matrícula no meio do fluxo, avança
    if (intencao === 'fornecer_matricula') {
      return await passoMatricula(texto);
    }
    if (intencao === 'fornecer_epi') {
      return await passoEPI(texto);
    }
    if (intencao === 'fornecer_confirmacao') {
      return await passoConfirmacao(texto);
    }

    // Senão, roteia pelo intent
    switch (intencao) {
      case 'ajuda':       return ajuda();
      case 'saudacao':    return addMsg(`Olá! Como posso te ajudar? Digite <em>ajuda</em> para ver o que faço.`);
      case 'cancelar':    return cancelar();
      case 'banco_horas': return fluxoBancoHoras();
      case 'requisicao':  return fluxoRequisicao();
      case 'consultar_setor': return fluxoSetor();
      case 'listar_requisicoes': return fluxoListarRequisicoes();
      default:
        return addMsg(`Não entendi 🤔. Digite <em>ajuda</em> para ver o que posso fazer.`);
    }
  }

  // ─── Ajuda ────────────────────────────────────────────────
  function ajuda() {
    addMsg(`
      <strong>O que posso fazer:</strong>
      <ul>
        <li>📊 <em>"banco de horas"</em> — consultar seu saldo</li>
        <li>📦 <em>"pedir epi"</em> — abrir requisição</li>
        <li>📄 <em>"minhas requisições"</em> — listar abertas</li>
      </ul>
      Você também pode digitar direto sua matrícula.
    `);
  }

  function cancelar() {
    estado.passo = 'idle';
    estado.dados = {};
    addMsg('Tudo bem, cancelei. Digite <em>ajuda</em> para começar de novo.');
  }

  // ─── Fluxo: Banco de Horas ────────────────────────────────
  function fluxoBancoHoras() {
    // Se o colaborador já está logado no app (localStorage), usa direto
    const matriculaLogada = localStorage.getItem('matriculaColaborador');
    if (matriculaLogada) {
      return mostrarBancoHoras(matriculaLogada);
    }

    estado.passo = 'aguardando_matricula';
    estado.dados.fluxo = 'banco_horas';
    addMsg('Claro! Qual é a sua <strong>matrícula</strong>?');
  }

  async function passoMatricula(texto) {
    const matricula = texto.trim();

    if (!/^\d+$/.test(matricula)) {
      return addMsg('Matrícula inválida. Digite apenas números.');
    }

    if (estado.dados.fluxo === 'banco_horas') {
      estado.passo = 'idle';
      return mostrarBancoHoras(matricula);
    }

    // fallback: consultar setor
    estado.passo = 'idle';
    return mostrarSetor(matricula);
  }

  function mostrarBancoHoras(matricula) {
    // Reaproveita a lógica de buscarBancoHoras
    const todos = [...colaboradoresPDF];
    const colaborador = todos.find(c => c.matricula === matricula);

    if (!colaborador) {
      return addMsg(`Não encontrei a matrícula <strong>${matricula}</strong> no banco de horas. Confira se digitou certo.`);
    }

    addMsg(`
      <strong>${colaborador.nome}</strong><br>
      Matrícula: ${colaborador.matricula}<br>
      Setor: ${descreverCDC(colaborador.cdc)}<br>
      <hr style="border-color:var(--purple3)">
      Saldo anterior: <span class="${corHora(colaborador.saldoAnterior)}">${colaborador.saldoAnterior}</span><br>
      Créditos: <span class="${corHora(colaborador.horasCredito)}">${colaborador.horasCredito}</span><br>
      Débitos: <span class="${corDebito(colaborador.horasDebito)}">${colaborador.horasDebito}</span><br>
      <strong>Saldo atual: <span class="${corHora(colaborador.saldoAtual)}">${colaborador.saldoAtual}</span></strong>
    `);
  }

  // ─── Fluxo: Requisição de EPI ─────────────────────────────
  function fluxoRequisicao() {
    const matriculaLogada = localStorage.getItem('matriculaColaborador');
    if (matriculaLogada) {
      estado.dados = { fluxo: 'requisicao', matricula: matriculaLogada, itens: [] };
      estado.passo = 'aguardando_epi';
      return addMsg(`Beleza! Vamos abrir uma requisição para <strong>${localStorage.getItem('nomeColaborador') || matriculaLogada}</strong>.<br><br>Digite o <strong>nome ou código do EPI</strong> (ex: "luva", "óculos"). Digite <em>fim</em> para concluir.`);
    }

    estado.dados = { fluxo: 'requisicao', itens: [] };
    estado.passo = 'aguardando_matricula';
    addMsg('Claro! Primeiro, qual é a sua <strong>matrícula</strong>?');
  }

  async function passoEPI(texto) {
    const t = texto.trim();
    if (t.toLowerCase() === 'fim') {
      return finalizarRequisicao();
    }

    // Busca EPIs pela descrição ou código
    const termo = t.toLowerCase();
    const encontrados = listaEPIs.filter(epi =>
      (epi.descricao || '').toLowerCase().includes(termo) ||
      (epi.codigo || '').toLowerCase().includes(termo)
    ).slice(0, 5);

    if (!encontrados.length) {
      return addMsg(`Não encontrei EPI com "<em>${t}</em>". Tente outro termo ou digite <em>fim</em> para concluir.`);
    }

    // Mostra opções clicáveis
    const botoes = encontrados.map((epi, i) =>
      `<button type="button" class="chat-opcao" data-idx="${i}">
        ${epi.codigo} - ${epi.descricao}
      </button>`
    ).join('');

    addMsg(`Encontrei estes EPIs. Clique em um para adicionar:<br>${botoes}`);

    // Delega clique para adicionar
    setTimeout(() => {
      document.querySelectorAll('.chat-opcao').forEach(btn => {
        btn.addEventListener('click', () => {
          const epi = encontrados[parseInt(btn.dataset.idx, 10)];
          estado.dados.itens.push({
            codigo: epi.codigo,
            descricao: epi.descricao,
            quantidade: 1,
          });
          addMsg(`✅ Adicionado: <strong>${epi.codigo} - ${epi.descricao}</strong> (1 unidade)<br>Digite outro EPI ou <em>fim</em> para concluir.`, 'bot');
        });
      });
    }, 0);
  }

  async function finalizarRequisicao() {
    const { matricula, itens } = estado.dados;

    if (!itens.length) {
      estado.passo = 'idle';
      return addMsg('Nenhum item foi adicionado. Requisição cancelada.');
    }

    // Encontra o colaborador para montar o título
    const todos = [...colaboradoresCSV, ...colaboradoresPDF];
    const colab = todos.find(c => c.matricula === matricula);
    if (!colab) {
      estado.passo = 'idle';
      return addMsg('Não encontrei esse colaborador. Requisição cancelada.');
    }

    const titulo = `${matricula} - ${colab.nome}`;
    const id = `req-${matricula}-${Date.now()}`;

    // Monta os itens no mesmo formato do HTML original
    const itensHTML = itens.map(it =>
      `<li><label class="new-item"><span class="item-quantidade">${it.quantidade}</span> ${it.codigo} - ${it.descricao} <span class="desc">TROCA/DESGASTE</span></label></li>`
    );

    // Salva no Supabase
    try {
      const { error } = await db
        .from('requisicoes')
        .insert({ id, titulo, itens: itensHTML });
      if (error) throw error;
    } catch (err) {
      console.error('Erro ao salvar requisição via chat:', err);
      return addMsg('❌ Não foi possível salvar a requisição. Tente novamente mais tarde.');
    }

    // Feedback final
    addMsg(`✅ Requisição criada com sucesso!<br><strong>ID:</strong> ${id}<br><strong>Itens:</strong> <ul>${itensHTML.join('')}</ul>`);
    estado.passo = 'idle';
    estado.dados = {};

    // Se a lista de requisições estiver na tela, recarrega
    if (typeof carregarRequisicoes === 'function') {
      const container = document.getElementById('listaRequisicoes');
      if (container) {
        container.innerHTML = '';
        await carregarRequisicoes();
      }
    }
  }

  // ─── Fluxo: Consultar setor ───────────────────────────────
  function fluxoSetor() {
    const matriculaLogada = localStorage.getItem('matriculaColaborador');
    if (matriculaLogada) {
      return mostrarSetor(matriculaLogada);
    }
    estado.passo = 'aguardando_matricula';
    estado.dados.fluxo = 'setor';
    addMsg('Qual é a sua <strong>matrícula</strong>?');
  }

  function mostrarSetor(matricula) {
    const todos = [...colaboradoresCSV, ...colaboradoresPDF];
    const colab = todos.find(c => c.matricula === matricula);
    if (!colab) return addMsg(`Matrícula <strong>${matricula}</strong> não encontrada.`);
    addMsg(`
      <strong>🏭 ${colab.nome}</strong><br>
      Setor: ${descreverCDC(colab.cdc)}<br>
      Função: ${colab.funcao || '—'}
    `);
  }

  // ─── Fluxo: Listar requisições ────────────────────────────
  async function fluxoListarRequisicoes() {
    const matricula = localStorage.getItem('matriculaColaborador');
    if (!matricula) {
      return addMsg('Faça login no app primeiro para eu conseguir listar suas requisições.');
    }
    const { data, error } = await db
      .from('requisicoes')
      .select('*')
      .like('id', `req-${matricula}%`)
      .order('criado_em', { ascending: false })
      .limit(5);

    if (error || !data?.length) {
      return addMsg('Você não tem requisições abertas.');
    }

    const linhas = data.map(r =>
      `<li><strong>${r.titulo}</strong> — ${new Date(r.criado_em).toLocaleDateString('pt-BR')}</li>`
    ).join('');
    addMsg(`<strong>📄 Suas últimas requisições:</strong><ul>${linhas}</ul>`);
  }

  // ─── API pública ──────────────────────────────────────────
  return { init };
})();

// Inicializa apenas quando o chat estiver VISÍVEL
document.addEventListener('DOMContentLoaded', () => {
  const chatWindow = document.getElementById('chat-window');
  if (chatWindow && !chatWindow.classList.contains('hidden')) {
    Chatbot.init();
  }
});




window.onload = async () => {
  await carregarRequisicoes();
  const loader = document.getElementById('loader');
  if (loader) loader.classList.add('hidden');
};
