

// ===== RENDERIZAÇÃO DO MENU DE TREINAMENTOS =====

const linkBos = 'https://forms.office.com/pages/responsepage.aspx?id=PK7qOeaHzkiKJsbGa6eA1gV77x91mqBLmOGwcxQgcg1UM1o5TDk5TVRNTzRUQ0xLRVUzMUUzQ1dVSyQlQCN0PWcu&route=shorturl';
const linkQuimicos = 'https://forms.office.com/Pages/ResponsePage.aspx?id=PK7qOeaHzkiKJsbGa6eA1o_55B86hohAt7OU0LY97N9UQjlUSzI0SjJKM1hNVUtMU1lUMEtEVkpaSSQlQCN0PWcu';
const linkInflamaveis = 'https://forms.office.com/pages/responsepage.aspx?id=PK7qOeaHzkiKJsbGa6eA1o_55B86hohAt7OU0LY97N9UNDE0S1VGQUxPRzA0MElXOTJBQVo3TU9YSiQlQCN0PWcu&route=shorturl';
const linkNR12 = 'https://forms.office.com/pages/responsepage.aspx?id=PK7qOeaHzkiKJsbGa6eA1o_55B86hohAt7OU0LY97N9UMTRBNlVJTDhZVVg0VjZVU1pKMjBKS1MzRiQlQCN0PWcu&route=shorturl';
const linkLOTO = 'https://forms.office.com/pages/responsepage.aspx?id=PK7qOeaHzkiKJsbGa6eA1o_55B86hohAt7OU0LY97N9UNVJBTEpYVUpJODIzRDBPWkFKUTFRQUFCNyQlQCN0PWcu&route=shorturl';
const linkApp = 'https://bit.ly/4eHnpDk';

const lista = document.getElementById('menu-treinamentos');
if (lista) {
  const menuLinks = `<ul class="links-colab" style="display: flex;">
    <li><a target="_blank" href="${linkBos}">BOS Tour</a></li>
    <li><a target="_blank" href="${linkQuimicos}">Quimícos</a></li>
    <li><a target="_blank" href="${linkInflamaveis}">Inflamáveis</a></li>
    <li><a target="_blank" href="${linkNR12}">NR-12</a></li>
    <li><a target="_blank" href="${linkLOTO}">LOTO</a></li>
  </ul>`;

  lista.insertAdjacentHTML('beforeend', menuLinks);
}

// ===== CONTROLE DE INICIALIZAÇÃO =====

document.addEventListener('DOMContentLoaded', async function () {
  const matricula = localStorage.getItem('matriculaColaborador');
  const nome = localStorage.getItem('nomeColaborador');

  if (matricula && nome) {
    // Tenta autenticar o dispositivo antes de exibir a área logada
    const dispositivoValido = await mostrarConteudoProtegido();
    if (dispositivoValido) {
      atualizarInfoUsuario();
    }
  } else {
    esconderConteudoProtegido();
  }
});

// ===== FUNÇÕES DE AUTENTICAÇÃO E LOGIN =====

function login() {
  const matriculaColab = document.getElementById('matricula')?.value.trim();

  if (!matriculaColab) {
    const msgErro = document.getElementById('mensagemErro');
    if (msgErro) msgErro.textContent = 'Por favor, insira sua matrícula.';
    return;
  }

  const colabsFilter = colaboradoresCSV.filter(colab => colab.matricula === matriculaColab);

  if (colabsFilter.length === 0) {
    const msgErro = document.getElementById('mensagemErro');
    if (msgErro) msgErro.textContent = 'Matrícula não encontrada. Tente novamente.';
    return;
  }

  const colab = colabsFilter[0];
  localStorage.setItem('nomeColaborador', colab.nome);
  localStorage.setItem('matriculaColaborador', colab.matricula);
  localStorage.setItem('setorColaborador', descreverCDC(colab.cdc).split(" - ")[0].split(' ').slice(-1)[0]);

  window.location.href = 'index.html';
}

function logout() {
  localStorage.removeItem('nomeColaborador');
  localStorage.removeItem('matriculaColaborador');
  localStorage.removeItem('setorColaborador');
  localStorage.removeItem('identificador_dispositivo');
  window.location.href = 'index.html';
}

function isLogado() {
  return localStorage.getItem('nomeColaborador') !== null &&
         localStorage.getItem('matriculaColaborador') !== null;
}

// ===== FUNÇÕES DE EXIBIÇÃO =====

async function mostrarConteudoProtegido() {
  const idDoCelular = await obterIdentificadorCelular();
  
  // Se não foi retornado um ID de dispositivo válido, cancela a exibição
  if (!idDoCelular) {
    esconderConteudoProtegido();
    return false;
  }

  const conteudo = document.getElementById('conteudo-protegido');
  const loginElem = document.getElementById('login');

  if (conteudo) conteudo.style.display = 'block';
  if (loginElem) loginElem.style.display = 'none';

  return true;
}

function esconderConteudoProtegido() {
  const conteudo = document.getElementById('conteudo-protegido');
  const loginElem = document.getElementById('login');

  if (conteudo) conteudo.style.display = 'none';
  if (loginElem) loginElem.style.display = 'block';
}

function atualizarInfoUsuario() {
  const nomeSalvo = localStorage.getItem('nomeColaborador') || '';
  const partesNome = nomeSalvo.trim().split(' ');
  
  const primeiroNome = partesNome[0] || '';
  const sobrenome = partesNome.length > 1 ? ` ${partesNome[partesNome.length - 1]}` : '';
  const nomeExibicao = `${primeiroNome}${sobrenome}`;

  const matricula = localStorage.getItem('matriculaColaborador');
  const setor = localStorage.getItem('setorColaborador');

  const colabName = document.getElementById('userName');
  const colabMatricula = document.getElementById('userMatricula');
  const colabSetor = document.getElementById('userSetor');

  if (colabName) colabName.textContent = nomeExibicao || 'Nome do Colaborador';
  if (colabMatricula) colabMatricula.textContent = matricula || 'Matrícula do Colaborador';
  if (colabSetor) colabSetor.textContent = setor || 'Setor não identificado';
}

// ===== GERENCIAMENTO E CONSULTA DE DISPOSITIVOS =====

function gerarIdentificadorDispositivo() {
  const colabMatricula = localStorage.getItem('matriculaColaborador') || 'anon';
  return 'colab-' + colabMatricula + '-' + Date.now();
}

/**
 * Realiza a consulta no Supabase para validar se o dispositivo está cadastrado
 */
async function validarDispositivoNoBanco(dispositivoId, colabID) {
  try {
    const { data, error } = await db
      .from('colaboradores')
      .select('*')
      .eq('dispositivo_id', dispositivoId)
      .eq('user_id', colabID);

    if (error) {
      console.error("Erro ao consultar dispositivo no Supabase:", error.message);
      return false;
    }

    return data && data.length > 0;
  } catch (err) {
    console.error("Exceção ao verificar o dispositivo:", err);
    return false;
  }
}

/**
 * Obtém ou registra o identificador do celular, efetuando o cadastro ou a consulta no Supabase
 */
async function obterIdentificadorCelular() {
  const matricula = localStorage.getItem('matriculaColaborador') || '';
  const setor = localStorage.getItem('setorColaborador') || '';
  const nome = localStorage.getItem('nomeColaborador') || 'Colaborador';

  const colabID = `${matricula}${setor}`;
  const primeiroNome = nome.trim().split(' ')[0];
  const deviceName = `${primeiroNome}-${Date.now()}`;

  let dispositivoId = localStorage.getItem('identificador_dispositivo');

  if (!dispositivoId) {
    // 1. PRIMEIRO ACESSO: Gera o ID e realiza o registro no banco
    dispositivoId = gerarIdentificadorDispositivo();
    console.log("Primeiro acesso neste aparelho. Cadastrando no banco:", dispositivoId);

    try {
      const { data, error } = await db
        .from('colaboradores')
        .insert([
          {
            user_id: colabID,
            dispositivo_id: dispositivoId,
            nome_dispositivo: deviceName
          }
        ]);

      if (error) {
        console.error("Erro ao cadastrar dispositivo no Supabase:", error.message);
        return null;
      }

      localStorage.setItem('identificador_dispositivo', dispositivoId);
      console.log("Dispositivo cadastrado com sucesso!");
      return dispositivoId;

    } catch (err) {
      console.error("Exceção ao inserir no Supabase:", err);
      return null;
    }

  } else {
    // 2. DISPOSITIVO JÁ REGISTRADO NO NAVEGADOR: Valida no Supabase
    console.log("Validando dispositivo no banco de dados...");
    
    const ehValido = await validarDispositivoNoBanco(dispositivoId, colabID);

    if (ehValido) {
      console.log("Dispositivo autenticado com sucesso!");
      return dispositivoId;
    } else {
      console.warn("Dispositivo não encontrado no banco de dados. Encerrando sessão.");
      
      const msgErro = document.getElementById('mensagemErro');
      if (msgErro) {
        msgErro.textContent = 'Aparelho não reconhecido. Faça login novamente.';
      }

      logout();
      return null;
    }
  }
}