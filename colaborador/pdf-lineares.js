let lineares = {};

fetch('lineares.pdf')
    .then(response => response.arrayBuffer())
    .then(data => pdfjsLib.getDocument({ data }).promise)
    .then(pdfLineares => {
        const totalLineares = pdfLineares.numPages;
        const promisesLineares = [];
        for (let i = 1; i <= totalLineares; i++) {
            promisesLineares.push(pdfLineares.getPage(i).then(page =>
                page.getTextContent().then(content =>
                    content.items.map(item => item.str).join(' ')
                )
            ));
        }
        return Promise.all(promisesLineares);
    })
    .then(paginasLineares => {
        // 1. Junta o texto, remove barras verticais e limpa espaços extras
        let textoCompleto = paginasLineares.join(' ').replace(/\|/g, ' ').replace(/\s+/g, ' ');

        // 2. Regex para capturar os blocos de cada linha
        const regexLinha = /((?:Linha|LINHA)\s+\d{1,2}(?:\s*-\s*[A-ZÃÇÁÉÓÔÚa-z\s\/&]+)?)/g;
        let blocos = [];
        let match;

        while ((match = regexLinha.exec(textoCompleto)) !== null) {
            blocos.push({
                nome: match[1].trim(),
                index: match.index
            });
        }

        // 3. Processa cada bloco de linha encontrado
        for (let i = 0; i < blocos.length; i++) {
            const inicio = blocos[i].index;
            const fim = (blocos[i + 1]) ? blocos[i + 1].index : textoCompleto.length;

            let conteudoBloco = textoCompleto.substring(inicio, fim);
            let nomeLinha = blocos[i].nome;

            lineares[nomeLinha] = [];

            // 4. REGEX ULTRA-ROBUSTA:
            // (\d{3,6}(?:\s*-\s*\d)?) -> Grupo 1: Código (ex: 770-5, 8476-4, 467111)
            // ((?:(?!(?:\d{3,6}(?:\s*-\s*\d)?)\s+).)+?) -> Grupo 2: Descrição (Para de ler se houver outro código na frente)
            // (\d{7})                 -> Grupo 3: Ordem de 7 dígitos
            // (?:\s+([\d\.,]+))?      -> Grupo 4: Caixas (Opcional)
            // \s+([\d\.,]+)           -> Grupo 5: Unidades (Obrigatório)
            const regexProdutos = /(\d{3,6}(?:\s*-\s*\d)?)\s+((?:(?!(?:\d{3,6}(?:\s*-\s*\d)?)\s+).)+?)\s+(\d{7})(?:\s+([\d\.,]+))?\s+([\d\.,]+)/g;
            let matchProduto;

            while ((matchProduto = regexProdutos.exec(conteudoBloco)) !== null) {
                const codigoLimpo = matchProduto[1].replace(/\s+/g, '');
                const descricaoLimpa = matchProduto[2].trim();
                const ordemLimpa = matchProduto[3].trim();
                
                let qtdCx = '-';
                let qtdUn = matchProduto[5].trim();

                // Se capturou o grupo 4, significa que temos os dois valores de quantidade informados
                if (matchProduto[4]) {
                    qtdCx = matchProduto[4].trim();
                }

                // Proteção extra: se a descrição capturada contiver palavras de cabeçalho, nós ignoramos
                if (descricaoLimpa.includes("CÓDIGO") || descricaoLimpa.includes("DESCRIÇÃO")) {
                    continue;
                }

                lineares[nomeLinha].push({
                    'ORDEM': ordemLimpa,
                    'CÓDIGO': codigoLimpo,
                    'DESCRIÇÃO': descricaoLimpa,
                    'QTD_CX': qtdCx,
                    'QTD_UN': qtdUn
                });
            }

            // Remove chaves vazias do objeto
            if (lineares[nomeLinha].length === 0) {
                delete lineares[nomeLinha];
            }
        }

        // Exibe o resultado final estruturado e correto
        console.log("--- JSON LINEARES GERADO COM SUCESSO ---");
        console.log(JSON.stringify(lineares, null, 4));

        // 5. Renderização na Tabela HTML
        const programacaoContainer = document.getElementById('programacao-container');
        if (programacaoContainer) {
            programacaoContainer.innerHTML += `
                ${Object.entries(lineares).map(([nomeDaLinha, produtos]) => `
                    <table class="tabela-programacao" style="margin-bottom: 20px; width: 100%;">
                        <thead>
                            <tr>
                                <th colspan="4" style="background-color: #070157; color: white; text-align: center; font-size: 1.5em; padding: 8px;">${nomeDaLinha}</th>
                            </tr>
                            <tr>
                                <th style="text-align: center; background-color: #1661c4; color: white; padding: 6px;">ORDEM</th>
                                <th style="text-align: center; background-color: #1661c4; color: white; padding: 6px;">CÓDIGO</th>
                                <th style="text-align: left; background-color: #1661c4; color: white; padding: 6px;">DESCRIÇÃO</th>
                                <th style="text-align: center; background-color: #1661c4; color: white; padding: 6px;">QTD (CX)</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${produtos.map(produto => `
                                <tr>
                                    <td style="text-align: center; padding: 6px; border: 1px solid #ddd;">${produto['ORDEM'] || ''}</td>
                                    <td style="text-align: center; padding: 6px; border: 1px solid #ddd;">${produto['CÓDIGO'] || ''}</td>
                                    <td style="padding: 6px; border: 1px solid #ddd;">${produto['DESCRIÇÃO'] || ''}</td>
                                    <td style="text-align: center; padding: 6px; border: 1px solid #ddd;">${produto['QTD_CX'] || '-'}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                `).join('')}
            `;
        }

    })
    .catch(error => console.error("Erro crítico no processamento de Lineares:", error));