const { createClient } = supabase;
const db = createClient(
  'https://vrzdgwzzqxdinnijydhg.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZyemRnd3p6cXhkaW5uaWp5ZGhnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYzMDE1OTAsImV4cCI6MjA5MTg3NzU5MH0.64kRIoCtJDtT8svA9lsXBCSHs_PQEcNRNTEe8EbVGmc'
);


let textoPDF = "";
let colaboradoresPDF = [];
let colaboradoresCSV = [];
let listaEPIs = [];



fetch("../listanomes.csv")
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


// Carrega CSV de EPIs
fetch("../listaepis.csv")
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
    case '76526':      setor = 'ADM PESSOAL'
      break
case '76521':      setor = 'ALMOX. NÃO PRODUTIVO - SVY'
      break
case '76512':      setor = 'ALMOXARIFADO MP/EM - SVY'
      break
case '76532':      setor = 'APOIO E MOV. LINHAS-COSMET. - SVY'
      break
case '76536':      setor = 'CALDEIRA - SVY'
      break
case '76506':      setor = 'CONTROLADORIA - SVY'
      break
case '76511':      setor = 'CONTROLE DE QUALIDADE - SVY'
      break
case '76507':      setor = 'DIR. INDUSTRIAL - SVY'
      break
case '76504':      setor = 'DIRETORIA MANUFATURA'
      break
case '76514':      setor = 'ENGENHARIA - SVY'
      break
case '76528':      setor = 'ENGENHARIA DE PROCESSO - SVY'
      break
case '76554':      setor = 'ENTUFAMENTO/MONT.TAMPA ESM-SVY'
      break
case '76587':      setor = 'ENVASE AEROSÓIS - SVY'
      break
case '76581':      setor = 'ENVASE COLORAÇÃO - SVY'
      break
case '76590':      setor = 'ENVASE COLORACAO WELLA - SVY'
      break
case '76582':      setor = 'ENVASE ESMALTES - SVY'
      break
case '76585':      setor = 'ENVASE LINHAS RÁPIDAS - SVY'
      break
case '76591':      setor = 'ENVASE PROFESSIONAL WELLA - SNC'
      break
case '76505':      setor = 'EXCELENCIA OPERACIONAL'
      break
case '76573':      setor = 'FABRICAÇÃO ALCOOLICOS - SVY'
      break
case '76571':      setor = 'FABRICAÇÃO COLORAÇÃO - SVY'
      break
case '76570':      setor = 'FABRICACAO COLORACAO WELLA - SVY'
      break
case '76574':      setor = 'FABRICAÇÃO COSMÉTICOS - SVY'
      break
case '76572':      setor = 'FABRICAÇÃO ESMALTES - SVY'
      break
case '76560':      setor = 'GER. EMBALAGENS PLÁSTICAS - SVY'
      break
case '76510':      setor = 'GERÊNCIA COSMÉTICO - SVY'
      break
case '76518':      setor = 'GERÊNCIA DE UTILIDADES - SVY'
      break
case '76509':      setor = 'GERÊNCIA LOGÍSTICA - SVY'
      break
case '76564':      setor = 'INJEÇÃO TAMPAS - SVY'
      break
case '76530':      setor = 'INSPECAO DE QUALIDADE - SNC'
      break
case '76565':      setor = 'MANUT. INDUST. EMB PLÁSTICAS - SVY'
      break
case '76520':      setor = 'MANUT. INDUSTRIAL COSMÉTICO - SVY'
      break
case '76592':      setor = 'MANUTENCAO HAIR COLOR - SNC'
      break
case '76537':      setor = 'MANUTENÇÃO UTILIDADES - SVY'
      break
case '76517':      setor = 'MEIO AMBIENTE - SVY'
      break
case '76540':      setor = 'OPERACAO CUSTOMIZACAO - SNC'
      break
case '76531':      setor = 'PATIO DE INFLAMAVEIS - SNC'
      break
case '76523':      setor = 'PCP COSMÉTICO - SNC'
      break
case '76524':      setor = 'PESAGEM COSMÉTICOS - SVY'
      break
case '76525':      setor = 'PESAGEM SOPRO/INJEÇÃO - SVY'
      break
case '76589':      setor = 'PROJETOS ESTRATEGICOS SNC'
      break
case '76515':      setor = 'RECEBIMENTO FISCAL FABRIL'
      break
case '76527':      setor = 'RH - SEN CANEDO'
      break
case '76538':      setor = 'SEGURANÇA DO TRABALHO - SNC'
      break
case '76563':      setor = 'SERIGRAFIA FRASCOS - SVY'
      break
case '76513':      setor = 'SERVIÇOS ADMINISTRATIVOS - SVY'
      break
case '76562':      setor = 'SOPRO - SNC - SVY'
      break

    default:
      setor = 'INDEFINIDO'
  }
  return setor;
}

function sugerirEPIs(inputId = "epiInput", sugestoesId = "sugestoesEPI") {
  const input = document.getElementById(inputId);
  const sugestoesDiv = document.getElementById(sugestoesId);
  const qtd = document.getElementById("quantidade").value;
  const desc = document.getElementById("descricao").value || "TROCA/DESGASTE NATURAL";


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
    btn.textContent = `[ ${qtd} ] ${epi.codigo} - ${epi.descricao} #${desc}`;
    btn.onclick = () => {
      if (inputId === "epiInput") {
        adicionarItemEPI(epi);
      } else {
        const requisicaoId = inputId.replace("novoItem-", "");
        adicionarItemComValor(requisicaoId, `[ ${qtd} ] ${epi.codigo} - ${epi.descricao} #${desc}`);
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
  const desc = document.getElementById("descricao").value  || "TROCA/DESGASTE NATURAL";
  console.log(epi);

  switch (desc) {
    case "TROCA/DESGASTE NATURAL":
      li.innerHTML = `<label class="new-item"><span class="item-quantidade">[ ${qtd} ]</span> ${epi.codigo} - ${epi.descricao} <span class="desc">${desc}</span></label>`;
      break;
    case "PERDA":
      li.innerHTML = `<label class="new-item"><span class="item-quantidade">[ ${qtd} ]</span> ${epi.codigo} - ${epi.descricao} <span class="desc perda">${desc}</span></label>`;
      break;
    case "NECESSIDADE":
      li.innerHTML = `<label class="new-item"><span class="item-quantidade">[ ${qtd} ]</span> ${epi.codigo} - ${epi.descricao} <span class="desc necessidade">${desc}</span></label>`;
      break;
    case "USO COLETIVO":
      li.innerHTML = `<label class="new-item"><span class="item-quantidade">[ ${qtd} ]</span> ${epi.codigo} - ${epi.descricao} <span class="desc coletivo">${desc}</span></label>`;
      break;
    default:
      li.innerHTML = `<label class="new-item"><span class="item-quantidade">[ ${qtd} ]</span> ${epi.codigo} - ${epi.descricao} <span class="desc">${desc}</span></label>`;
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



// ─── Salvar requisição no banco ───────────────────────────────────────────────
async function salvarRequisicaoLocal(id, titulo, itens) {
  const { error } = await db
    .from('requisicoes')
    .insert({ id, titulo, itens });

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
  const exibirDiv  = document.getElementById('exibePesqReq');

  exibirDiv.style.display = 'none';
  pesquisaDiv.style.display = 'flex';
}

// ─── Carregar requisições do banco ────────────────────────────────────────────
async function carregarRequisicoes() {
  console.log('Executando carregarRequisicoes()');

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
    console.log('Renderizando:', req);

    // itens vem como array do JSONB — garante compatibilidade
    const itens = Array.isArray(req.itens) ? req.itens : JSON.parse(req.itens || '[]');

    const html = `
      <div id="${req.id}" class="tarefa">
        <h3>${req.titulo}</h3>
        <ul id="itens-${req.id}">
          ${itens.map(item => `<li><label>${item}</label></li>`).join('')}
        </ul>
      </div>`;

    container.insertAdjacentHTML('beforeend', html);
  });
}















window.onload = async () => {
    await carregarRequisicoes();
    const loader = document.getElementById('loader');
    if (loader) loader.classList.add('hidden');
};