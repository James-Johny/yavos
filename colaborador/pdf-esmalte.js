let esmalte = {};

fetch('esmalte.pdf')
    .then(response => response.arrayBuffer())
    .then(data => pdfjsLib.getDocument({ data }).promise)
    .then(pdfEsmalte => {
        const totalEsmalte = pdfEsmalte.numPages;
        const promisesEsmalte = [];
        for (let i = 1; i <= totalEsmalte; i++) {
            promisesEsmalte.push(pdfEsmalte.getPage(i).then(page =>
                page.getTextContent().then(content =>
                    content.items.map(item => item.str).join(' ')
                )
            ));
        }
        return Promise.all(promisesEsmalte);
    })
    .then(paginasEsmalte => {
        // 1. Junta o texto, remove as barras verticais e normaliza os espaços
        let textoCompleto = paginasEsmalte.join(' ').replace(/\|/g, ' ').replace(/\s+/g, ' ');

        // 2. Mapeia os blocos de cada linha ("Ordens de PA Linha XX")
        const regexLinha = /(Ordens de PA Linha \d{1,2})/g;
        let blocos = [];
        let match;

        while ((match = regexLinha.exec(textoCompleto)) !== null) {
            blocos.push({
                nome: match[1],
                index: match.index
            });
        }

        // 3. Processa cada bloco
        for (let i = 0; i < blocos.length; i++) {
            const inicio = blocos[i].index;
            const fim = (blocos[i + 1]) ? blocos[i + 1].index : textoCompleto.length;

            let conteudoBloco = textoCompleto.substring(inicio, fim);
            let nomeLinha = blocos[i].nome;

            esmalte[nomeLinha] = [];

            // 4. REGEX CORRIGIDA:
            // (\d{4,5}\s*-\s*\d) -> Aceita 4 ou 5 dígitos E tolera espaços ao redor do hífen (ex: "8827 - 4")
            // (.+?)              -> Descrição do produto
            // (\d{7})            -> Nº de Ordem (7 dígitos)
            // ([\d\.,]+)         -> Quantidade (UND)
            const regexProdutos = /(\d{4,5}\s*-\s*\d)\s+(.+?)\s+(\d{7})\s+([\d\.,]+)/g;
            let matchProduto;

            while ((matchProduto = regexProdutos.exec(conteudoBloco)) !== null) {
                // Garante a remoção de espaços internos do código caso existam
                const codigoLimpo = matchProduto[1].replace(/\s+/g, '');

                esmalte[nomeLinha].push({
                    'ORDEM': matchProduto[3].trim(),
                    'CÓDIGO': codigoLimpo,
                    'DESCRIÇÃO': matchProduto[2].trim(),
                    'QTD': matchProduto[4].trim()
                });
            }

            // Remove chaves vazias do objeto final
            if (esmalte[nomeLinha].length === 0) {
                delete esmalte[nomeLinha];
            }
        }

        // Exibe o JSON gerado no console
        console.log("--- JSON GERADO COM SUCESSO ---");
        console.log(JSON.stringify(esmalte, null, 4));

        // Renderiza na tela
        const programacaoContainer = document.getElementById('programacao-container');
        if (programacaoContainer) {
            programacaoContainer.innerHTML += `
                ${Object.entries(esmalte).map(([nomeDaLinha, produtos]) => `
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
                                    <td style="text-align: center;">${produto['ORDEM'] || ''}</td>
                                    <td style="text-align: center;">${produto['CÓDIGO'] || ''}</td>
                                    <td>${produto['DESCRIÇÃO'] || ''}</td>
                                    <td style="text-align: center;">${produto['QTD'] || ''}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                `).join('')}
            `;
        }

    })
    .catch(error => console.error("Erro crítico no processamento:", error));