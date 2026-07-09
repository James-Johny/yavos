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
document.addEventListener('DOMContentLoaded', function() {
    const matricula = localStorage.getItem('matriculaColaborador');
    const nome = localStorage.getItem('nomeColaborador');
    
    if (matricula && nome) {
        // Usuário está logado
        mostrarConteudoProtegido();
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
    
    // Redireciona para a página principal
    window.location.href = 'index.html';
}

function logout() {
    localStorage.removeItem('nomeColaborador');
    localStorage.removeItem('matriculaColaborador');
    window.location.href = 'login.html';
}

// ===== FUNÇÕES DE EXIBIÇÃO =====

function mostrarConteudoProtegido() {
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
    const nome = localStorage.getItem('nomeColaborador').split(' ')[0];
    const matricula = localStorage.getItem('matriculaColaborador');
    
    const colabName = document.getElementById('userName');
    const colabMatricula = document.getElementById('userMatricula');
    
    if (colabName) {
        colabName.textContent = nome || 'Nome do Colaborador';
    }
    
    if (colabMatricula) {
        colabMatricula.textContent = matricula || 'Matrícula do Colaborador';
    }
}

// ===== VERIFICAÇÃO RÁPIDA (para usar em qualquer lugar) =====

function isLogado() {
    return localStorage.getItem('nomeColaborador') !== null && 
           localStorage.getItem('matriculaColaborador') !== null;
}

// Exemplo de uso:
// if (isLogado()) {
//     // Faz algo para usuário logado
// } else {
//     // Redireciona para login
//     window.location.href = 'login.html';
// }


// Função para gerar um ID único universal (UUID)
function gerarIdentificadorDispositivo() {
    return 'dev-' + Math.random().toString(36).substr(2, 9) + '-' + Date.now();
}

function obterIdentificadorCelular() {
    // 1. Tenta buscar o ID já salvo no navegador do celular
    let dispositivoId = localStorage.getItem('dispositivo_mac_fake');

    if (!dispositivoId) {
        // 2. Se for o primeiro acesso, gera um ID inédito
        dispositivoId = gerarIdentificadorDispositivo();
        localStorage.setItem('dispositivo_mac_fake', dispositivoId);

        console.log("Primeiro acesso deste celular. ID gerado:", dispositivoId);
        // Aqui você faria um fetch para salvar esse ID no seu banco de dados
        // associado ao usuário (ex: "Dispositivo Autorizado do João")
    } else {
        console.log("Celular já conhecido. ID do dispositivo:", dispositivoId);
    }

    return dispositivoId;
}



// Executa ao carregar a página web no celular
const idDoCelular = obterIdentificadorCelular();