const linkBos = 'https://forms.office.com/pages/responsepage.aspx?id=PK7qOeaHzkiKJsbGa6eA1gV77x91mqBLmOGwcxQgcg1UM1o5TDk5TVRNTzRUQ0xLRVUzMUUzQ1dVSyQlQCN0PWcu&route=shorturl';
const linkQuimicos = 'https://forms.office.com/Pages/ResponsePage.aspx?id=PK7qOeaHzkiKJsbGa6eA1o_55B86hohAt7OU0LY97N9UQjlUSzI0SjJKM1hNVUtMU1lUMEtEVkpaSSQlQCN0PWcu';
const linkInflamaveis = 'https://forms.office.com/pages/responsepage.aspx?id=PK7qOeaHzkiKJsbGa6eA1o_55B86hohAt7OU0LY97N9UNDE0S1VGQUxPRzA0MElXOTJBQVo3TU9YSiQlQCN0PWcu&route=shorturl';
const linkNR12 = 'https://forms.office.com/pages/responsepage.aspx?id=PK7qOeaHzkiKJsbGa6eA1o_55B86hohAt7OU0LY97N9UMTRBNlVJTDhZVVg0VjZVU1pKMjBKS1MzRiQlQCN0PWcu&route=shorturl';
const linkLOTO = 'https://forms.office.com/pages/responsepage.aspx?id=PK7qOeaHzkiKJsbGa6eA1o_55B86hohAt7OU0LY97N9UNVJBTEpYVUpJODIzRDBPWkFKUTFRQUFCNyQlQCN0PWcu&route=shorturl';

const lista = document.getElementById('menu-colab');
lista.innerHTML = `
<ul class="links-colab" style="display: none;">
    <li><a target="_blank" href="${linkBos}">BOS Tour</a></li>
    <li><a target="_blank" href="${linkQuimicos}">Quimícos</a></li>
    <li><a target="_blank" href="${linkInflamaveis}">Inflamáveis</a></li>
    <li><a target="_blank" href="${linkNR12}">NR-12</a></li>
    <li><a target="_blank" href="${linkLOTO}">LOTO</a></li>
    </ul>
`;