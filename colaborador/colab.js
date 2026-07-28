const linkBos = 'https://forms.office.com/pages/responsepage.aspx?id=PK7qOeaHzkiKJsbGa6eA1gV77x91mqBLmOGwcxQgcg1UM1o5TDk5TVRNTzRUQ0xLRVUzMUUzQ1dVSyQlQCN0PWcu&route=shorturl';
const linkQuimicos = 'https://forms.office.com/Pages/ResponsePage.aspx?id=PK7qOeaHzkiKJsbGa6eA1o_55B86hohAt7OU0LY97N9UQjlUSzI0SjJKM1hNVUtMU1lUMEtEVkpaSSQlQCN0PWcu';
const linkInflamaveis = 'https://forms.office.com/pages/responsepage.aspx?id=PK7qOeaHzkiKJsbGa6eA1o_55B86hohAt7OU0LY97N9UNDE0S1VGQUxPRzA0MElXOTJBQVo3TU9YSiQlQCN0PWcu&route=shorturl';
const linkNR12 = 'https://forms.office.com/pages/responsepage.aspx?id=PK7qOeaHzkiKJsbGa6eA1o_55B86hohAt7OU0LY97N9UMTRBNlVJTDhZVVg0VjZVU1pKMjBKS1MzRiQlQCN0PWcu&route=shorturl';
const linkLOTO = 'https://forms.office.com/pages/responsepage.aspx?id=PK7qOeaHzkiKJsbGa6eA1o_55B86hohAt7OU0LY97N9UNVJBTEpYVUpJODIzRDBPWkFKUTFRQUFCNyQlQCN0PWcu&route=shorturl';
const linkApp = 'https://bit.ly/4eHnpDk';

const lista = document.getElementById('menu-treinamentos');
const menuLinks = `<ul class="links-colab" style="display: flex;">
    <li><a target="_blank" href="${linkBos}">BOS Tour</a></li>
    <li><a target="_blank" href="${linkQuimicos}">Quimícos</a></li>
    <li><a target="_blank" href="${linkInflamaveis}">Inflamáveis</a></li>
    <li><a target="_blank" href="${linkNR12}">NR-12</a></li>
    <li><a target="_blank" href="${linkLOTO}">LOTO</a></li>
    </ul>`;

lista.insertAdjacentHTML('beforeend', menuLinks);


// ===== CONTROLE DE LOGIN =====

// Verifica se o usuário está logado ao carregar a página
document.addEventListener('DOMContentLoaded', async function () {
    const matricula = localStorage.getItem('matriculaColaborador');
    const nome = localStorage.getItem('nomeColaborador');

    if (matricula && nome) {
        // Usuário está logado
        await mostrarConteudoProtegido(); // AJUSTADO: await adicionado
        atualizarInfoUsuario();
    } else {
        // Usuário não está logado
        esconderConteudoProtegido();
    }
});

function login() {
    const matriculaColab = document.getElementById('matricula').value.trim();

    // Valida se o campo não está vazio
    if (!matriculaColab) {
        document.getElementById('mensagemErro').textContent = 'Por favor, insira sua matrícula.';
        return;
    }

    // Busca o colaborador
    const colabsFilter = colaboradoresCSV.filter(colab => colab.matricula === matriculaColab);

    if (colabsFilter.length === 0) {
        document.getElementById('mensagemErro').textContent = 'Matrícula não encontrada. Tente novamente.';
        return;
    }

    // Salva os dados do colaborador
    const colab = colabsFilter[0];
    localStorage.setItem('nomeColaborador', colab.nome);
    localStorage.setItem('matriculaColaborador', colab.matricula);
    localStorage.setItem('setorColaborador', descreverCDC(colab.cdc).split(" - ")[0].split(' ').slice(-1)[0]);

    // Redireciona para a página principal
    window.location.href = 'index.html';
}

function logout() {
    localStorage.removeItem('nomeColaborador');
    localStorage.removeItem('matriculaColaborador');
    localStorage.removeItem('setorColaborador'); // Boa prática: limpa o setor também
    window.location.href = 'index.html';
}

// ===== FUNÇÕES DE EXIBIÇÃO =====

// AJUSTADO: adicionado 'async' aqui para suportar o 'await'
async function mostrarConteudoProtegido() {
    const idDoCelular = await obterIdentificadorCelular();
    const conteudo = document.getElementById('conteudo-protegido');
    const login = document.getElementById('login');

    if (conteudo) conteudo.style.display = 'block';
    if (login) login.style.display = 'none';
}

function esconderConteudoProtegido() {
    const conteudo = document.getElementById('conteudo-protegido');
    const login = document.getElementById('login');

    if (conteudo) conteudo.style.display = 'none';
    if (login) login.style.display = 'block';
}

function atualizarInfoUsuario() {
    const nomeSalvo = localStorage.getItem('nomeColaborador') || '';
    const partesNome = nomeSalvo.trim().split(' ');
    
    // AJUSTADO: Trata o nome para não exibir 'undefined' caso o usuário só tenha 1 nome cadastrado
    const primeiroNome = partesNome[0] || '';
    const sobrenome = partesNome[3] ? ` ${partesNome[2]}` : '';
    const nomeExibicao = `${primeiroNome}${sobrenome}`;

    const matricula = localStorage.getItem('matriculaColaborador');
    const setor = localStorage.getItem('setorColaborador');

    const colabName = document.getElementById('userName');
    const colabMatricula = document.getElementById('userMatricula');
    const colabSetor = document.getElementById('userSetor');

    if (colabName) {
        colabName.textContent = nomeExibicao || 'Nome do Colaborador';
    }

    if (colabMatricula) {
        colabMatricula.textContent = matricula || 'Matrícula do Colaborador';
    }

    if (colabSetor) {
        colabSetor.textContent = setor || 'Setor não identificado';
    }
}

// ===== VERIFICAÇÃO RÁPIDA (para usar em qualquer lugar) =====

function isLogado() {
    return localStorage.getItem('nomeColaborador') !== null &&
        localStorage.getItem('matriculaColaborador') !== null;
}

// Função para gerar um ID único universal
function gerarIdentificadorDispositivo() {
    const colabMatricula = localStorage.getItem('matriculaColaborador') || 'anon';
    return 'colab-' + colabMatricula + '-' + Date.now();
}

async function obterIdentificadorCelular() {
    // Evita 'null' caso algum item não esteja salvo ainda
    const matricula = localStorage.getItem('matriculaColaborador') || '';
    const setor = localStorage.getItem('setorColaborador') || '';
    const nome = localStorage.getItem('nomeColaborador') || 'Colaborador';

    const colabID = `${matricula}${setor}`;
    const primeiroNome = nome.trim().split(' ')[0];
    const deviceName = `${primeiroNome}-${Date.now()}`;

    // 1. Tenta buscar o ID já salvo no navegador do celular
    let dispositivoId = localStorage.getItem('identificador_dispositivo');

    if (!dispositivoId) {
        // 2. Se for o primeiro acesso, gera um ID inédito
        dispositivoId = gerarIdentificadorDispositivo();
        localStorage.setItem('identificador_dispositivo', dispositivoId);

        console.log("Primeiro acesso deste celular. ID gerado:", dispositivoId);

        try {
            const { data, error } = await supabase
                .from('colaboradores')
                .insert([
                    {
                        user_id: colabID,
                        dispositivo_id: dispositivoId,
                        nome_dispositivo: deviceName
                    }
                ]);

            if (error) {
                console.error("Erro ao registrar dispositivo no Supabase:", error.message);
            } else {
                console.log("Dispositivo salvo no banco de dados com sucesso!", data);
            }
        } catch (err) {
            console.error("Exceção ao tentar salvar no Supabase:", err);
        }

    } else {
        console.log("Celular já conhecido. ID do dispositivo:", dispositivoId);
    }

    return dispositivoId;
}