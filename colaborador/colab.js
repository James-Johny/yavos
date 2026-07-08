const linkBos = 'https://forms.office.com/pages/responsepage.aspx?id=PK7qOeaHzkiKJsbGa6eA1gV77x91mqBLmOGwcxQgcg1UM1o5TDk5TVRNTzRUQ0xLRVUzMUUzQ1dVSyQlQCN0PWcu&route=shorturl';
const linkQuimicos = 'https://forms.office.com/Pages/ResponsePage.aspx?id=PK7qOeaHzkiKJsbGa6eA1o_55B86hohAt7OU0LY97N9UQjlUSzI0SjJKM1hNVUtMU1lUMEtEVkpaSSQlQCN0PWcu';
const linkInflamaveis = 'https://forms.office.com/pages/responsepage.aspx?id=PK7qOeaHzkiKJsbGa6eA1o_55B86hohAt7OU0LY97N9UNDE0S1VGQUxPRzA0MElXOTJBQVo3TU9YSiQlQCN0PWcu&route=shorturl';
const linkNR12 = 'https://forms.office.com/pages/responsepage.aspx?id=PK7qOeaHzkiKJsbGa6eA1o_55B86hohAt7OU0LY97N9UMTRBNlVJTDhZVVg0VjZVU1pKMjBKS1MzRiQlQCN0PWcu&route=shorturl';
const linkLOTO = 'https://forms.office.com/pages/responsepage.aspx?id=PK7qOeaHzkiKJsbGa6eA1o_55B86hohAt7OU0LY97N9UNVJBTEpYVUpJODIzRDBPWkFKUTFRQUFCNyQlQCN0PWcu&route=shorturl';
const linkApp = 'https://bit.ly/4eHnpDk';

const lista = document.getElementById('menu-treinamentos');
const menuLinks= `<ul class="links-colab" style="display: flex;">
    <li><a target="_blank" href="${linkBos}">BOS Tour</a></li>
    <li><a target="_blank" href="${linkQuimicos}">Quimícos</a></li>
    <li><a target="_blank" href="${linkInflamaveis}">Inflamáveis</a></li>
    <li><a target="_blank" href="${linkNR12}">NR-12</a></li>
    <li><a target="_blank" href="${linkLOTO}">LOTO</a></li>
    </ul>`;

    lista.insertAdjacentHTML('beforeend', menuLinks);





    
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