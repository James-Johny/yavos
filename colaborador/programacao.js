let rapidas = {};

fetch('rapidas.pdf')
    .then(response => response.arrayBuffer())
    .then(data => pdfjsLib.getDocument({ data }).promise)
    .then(pdfRapidas => {
        const totalRapidas = pdfRapidas.numPages;
        const promisesRapidas = [];
        for (let i = 1; i <= totalRapidas; i++) {
            promisesRapidas.push(pdfRapidas.getPage(i).then(page =>
                page.getTextContent().then(content =>
                    content.items.map(item => item.str).join(' ')
                )
            ));
        }
        return Promise.all(promisesRapidas);
    })
    .then(paginasRapidas => {
        // 1. Junta o texto e normaliza múltiplos espaços em branco
        let textoCompleto = paginasRapidas.join(' ').replace(/\s+/g, ' ');

        // 2. Encontra todas as ocorrências de "LINHA XX" para mapear os blocos de categoria
        const regexLinha = /(LINHA\s+\d{1,2})/g;
        let blocos = [];
        let match;

        while ((match = regexLinha.exec(textoCompleto)) !== null) {
            blocos.push({
                nome: match[1],
                index: match.index
            });
        }

        // 3. Processa cada bloco individualmente
        for (let i = 0; i < blocos.length; i++) {
            const inicio = blocos[i].index;
            const fim = (blocos[i + 1]) ? blocos[i + 1].index : textoCompleto.length;

            let conteudoBloco = textoCompleto.substring(inicio, fim);
            let nomeLinha = blocos[i].nome;

            rapidas[nomeLinha] = [];

            // 4. REGEX AJUSTADA: 
            // (\d{5}\s*-\s*\d) -> Captura o código mesmo se tiver espaços como "23484 - 0"
            // (.+?)            -> Pega a descrição do produto
            // (\d{7})          -> Captura o Nº de Ordem com 7 dígitos
            // ([\d\.,]+)       -> Quantidade de Caixas
            // ([\d\.,]+)       -> Quantidade de Unidades
            const regexProdutos = /(\d{5}\s*-\s*\d)\s+(.+?)\s+(\d{7})\s+([\d\.,]+)\s+([\d\.,]+)/g;
            let matchProduto;

            while ((matchProduto = regexProdutos.exec(conteudoBloco)) !== null) {
                // Remove espaços extras que possam ter ficado dentro do código P.A. extraído
                const codigoLimpo = matchProduto[1].replace(/\s+/g, '');

                rapidas[nomeLinha].push({
                    'ORDEM': matchProduto[3].trim(),
                    'CÓDIGO': codigoLimpo,
                    'DESCRIÇÃO': matchProduto[2].trim(),
                    'QTD': matchProduto[4].trim(),
                    'QTD': matchProduto[5].trim()

                });
            }

            // Se a linha não tiver produtos mapeados (ex: LINHA 08), remove do JSON para não poluir
            if (rapidas[nomeLinha].length === 0) {
                delete rapidas[nomeLinha];
            }
        }

        // Retorna o JSON formatado e pronto para uso
        console.log("--- JSON GERADO COM SUCESSO ---");
        console.log(JSON.stringify(rapidas, null, 4));

        const programacaoContainer = document.getElementById('programacao-container');

        programacaoContainer.innerHTML = `
    ${Object.entries(rapidas).map(([nomeDaLinha, produtos]) => `
        <table class="tabela-programacao" style="margin-bottom: 20px; width: 100%;">
            <thead>
                <tr>
                    <th colspan="4" style="text-align: left; background-color: #070157; color: white; text-align: center; font-size: 1.5em;">${nomeDaLinha}</th>
                </tr>
                <tr>
                    <th style="text-align: center; background-color: #1661c4; color: white;">ORDEM</th>
                    <th style="text-align: center; background-color: #1661c4; color: white;">CÓDIGO</th>
                    <th style="text-align: center; background-color: #1661c4; color: white;">DESCRIÇÃO</th>
                    <th style="text-align: center; background-color: #1661c4; color: white;">QTD</th>
                </tr>
            </thead>
            <tbody>
                ${produtos.map(produto => `
                    <tr>
                        <td>${produto['ORDEM'] || ''}</td>
                        <td>${produto['CÓDIGO'] || ''}</td>
                        <td style="overflow: auto;">${produto['DESCRIÇÃO'] || ''}</td>
                        <td>${produto['QTD'] || ''}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `).join('')}
`;

    })
    .catch(error => console.error("Erro crítico no processamento:", error));


 function configurarEventListeners() {
    const setorSelect = document.getElementById("setorSelect");
    
    // Carregar a planilha inicial (primeira opção)
    const setorInicial = setorSelect.value;
    if (setorInicial) {
        const NOME_DO_ARQUIVO = `${setorInicial}.pdf`;
        carregarEExibirPlanilha(NOME_DO_ARQUIVO);
    }

    // Event listener para quando o select mudar
    setorSelect.addEventListener('change', function() {
        const setorNome = this.value;
        
        if (!setorNome) return;
        
        const NOME_DO_ARQUIVO = `${setorNome}.pdf`;
        console.log("Alterando para o arquivo: ", NOME_DO_ARQUIVO);
        carregarEExibirPlanilha(NOME_DO_ARQUIVO);
    });
}