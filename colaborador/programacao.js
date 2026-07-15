// Configuração centralizada de cada setor, mapeando Regex, Colunas e Arquivos específicos
const CONFIG_SETORES = {
    'rapidas': {
        arquivo: 'rapidas.pdf',
        regexLinha: /(LINHA\s+\d{1,2})/g,
        // Impede que a descrição engula o início de um novo código de produto (\d{5}\s*-\s*\d)
        regexProdutos: /(\d{5}\s*-\s*\d)\s+((?:(?!\d{5}\s*-\s*\d).)+?)\s+(\d{7})\s+([\d\.,]+)\s+([\d\.,]+)/g,
        colunas: ['ORDEM', 'CÓDIGO', 'DESCRIÇÃO', 'QTD'],
        processarMatch: (match) => ({
            'ORDEM': match[3].trim(),
            'CÓDIGO': match[1].replace(/\s+/g, ''),
            'DESCRIÇÃO': match[2].trim(),
            'QTD': match[4].trim() // Mantém a extração conforme o seu código original 1
        })
    },
    'esmalte': {
        arquivo: 'esmalte.pdf',
        regexLinha: /(Ordens de PA Linha \d{1,2})/g,
        // Código (4-5 dig) - Descrição - Ordem (7 dig) - Qtd
        regexProdutos: /(\d{4,5}\s*-\s*\d)\s+(.+?)\s+(\d{7})\s+([\d\.,]+)/g,
        colunas: ['ORDEM', 'CÓDIGO', 'DESCRIÇÃO', 'QTD'],
        processarMatch: (match) => ({
            'ORDEM': match[3].trim(),
            'CÓDIGO': match[1].replace(/\s+/g, ''),
            'DESCRIÇÃO': match[2].trim(),
            'QTD': match[4].trim()
        })
    },
    'lineares': {
        arquivo: 'lineares.pdf',
        regexLinha: /((?:Linha|LINHA)\s+\d{1,2}(?:\s*-\s*[A-ZÃÇÁÉÓÔÚa-z\s\/&]+)?)/g,
        // Código - Descrição (Lookahead anti-quebra) - Ordem (7 dig) - Caixas (Opcional) - Unidades
        regexProdutos: /(\d{3,6}(?:\s*-\s*\d)?)\s+((?:(?!(?:\d{3,6}(?:\s*-\s*\d)?)\s+).)+?)\s+(\d{7})(?:\s+([\d\.,]+))?\s+([\d\.,]+)/g,
        colunas: ['ORDEM', 'CÓDIGO', 'DESCRIÇÃO', 'QTD_CX'],
        processarMatch: (match) => {
            const descricaoLimpa = match[2].trim();
            if (descricaoLimpa.includes("CÓDIGO") || descricaoLimpa.includes("DESCRIÇÃO")) {
                return null; // Filtra cabeçalhos fantasmas do PDF
            }
            return {
                'ORDEM': match[3].trim(),
                'CÓDIGO': match[1].replace(/\s+/g, ''),
                'DESCRIÇÃO': descricaoLimpa,
                'QTD_CX': match[4] ? match[4].trim() : '-'
            };
        }
    }
};

// Gerenciador do Elemento Select (Alternador de Setor)
function configurarEventListeners() {
    const setorSelect = document.getElementById("setorSelect");
    if (!setorSelect) {
        console.error("Elemento 'setorSelect' não foi encontrado na árvore do DOM.");
        return;
    }

    // Carrega o PDF do setor inicial selecionado por padrão no HTML
    const setorInicial = setorSelect.value;
    if (setorInicial) {
        carregarEProcessarPDF(setorInicial);
    }

    // Monitora a mudança do seletor para rodar a extração correta
    setorSelect.addEventListener('change', function () {
        const setorNome = this.value;
        if (!setorNome) return;


        carregarEProcessarPDF(setorNome);
    });
}

// Motor único de extração assíncrona de PDF
function carregarEProcessarPDF(setorKey) {
    const config = CONFIG_SETORES[setorKey];
    if (!config) {
        console.error(`O setor "${setorKey}" não possui mapeamento configurado.`);
        return;
    }

    let dadosSetor = {};

    fetch(config.arquivo)
        .then(response => response.arrayBuffer())
        .then(data => pdfjsLib.getDocument({ data }).promise)
        .then(pdf => {
            const totalPaginas = pdf.numPages;
            const promises = [];
            for (let i = 1; i <= totalPaginas; i++) {
                promises.push(pdf.getPage(i).then(page =>
                    page.getTextContent().then(content =>
                        content.items.map(item => item.str).join(' ')
                    )
                ));
            }
            return Promise.all(promises);
        })
        .then(paginasTexto => {
            // Limpeza inicial do texto bruto contido nas páginas
            let textoCompleto = paginasTexto.join(' ').replace(/\|/g, ' ').replace(/\s+/g, ' ');

            // 1. Identificação dos blocos de Linha por Index
            let blocos = [];
            let matchLinha;
            config.regexLinha.lastIndex = 0; // Força reinício do ponteiro global

            while ((matchLinha = config.regexLinha.exec(textoCompleto)) !== null) {
                blocos.push({
                    nome: matchLinha[1].trim(),
                    index: matchLinha.index
                });
            }

            // 2. Extração dos produtos contidos dentro de cada bloco delimitado
            for (let i = 0; i < blocos.length; i++) {
                const inicio = blocos[i].index;
                const fim = (blocos[i + 1]) ? blocos[i + 1].index : textoCompleto.length;

                let conteudoBloco = textoCompleto.substring(inicio, fim);
                let nomeLinha = blocos[i].nome;

                dadosSetor[nomeLinha] = [];

                let matchProduto;
                config.regexProdutos.lastIndex = 0; // Força reinício do ponteiro global

                while ((matchProduto = config.regexProdutos.exec(conteudoBloco)) !== null) {
                    const objetoProduto = config.processarMatch(matchProduto);
                    if (objetoProduto) {
                        dadosSetor[nomeLinha].push(objetoProduto);
                    }
                }

                // Remove chaves de linhas vazias para evitar poluição visual
                if (dadosSetor[nomeLinha].length === 0) {
                    delete dadosSetor[nomeLinha];
                }
            }



            // Envia para a função de renderização dinamicamente passando a estrutura de colunas do setor ativo
            renderizarTabelasHTML(dadosSetor, config.colunas);
        })
        .catch(error => console.error(`Erro crítico no processamento do arquivo de ${setorKey}:`, error));
}

// Renderizador Dinâmico de Tabelas no Layout Adaptável
function renderizarTabelasHTML(dados, colunas) {
    const programacaoContainer = document.getElementById('programacao-container');
    if (!programacaoContainer) return;

    // Diferente do método original, esse limpa "=" o container para que dados de setores anteriores não fiquem acumulados embaixo
    programacaoContainer.innerHTML = Object.entries(dados).map(([nomeDaLinha, produtos]) => `
        <table class="tabela-programacao" style="margin-bottom: 20px; width: 100%; border-collapse: collapse;">
            <thead>
                <tr>
                    <th colspan="${colunas.length}" style="background-color: #070157; color: white; text-align: center; font-size: 1.5em; padding: 8px;">
                        ${nomeDaLinha}
                    </th>
                </tr>
                <tr>
                    ${colunas.map(col => `
                        <th style="background-color: #1661c4; color: white; padding: 6px; text-align: ${col === 'DESCRIÇÃO' ? 'left' : 'center'};">
                            ${col.replace('_', ' ')}
                        </th>
                    `).join('')}
                </tr>
            </thead>
            <tbody>
                ${produtos.map(produto => `
                    <tr>
                        ${colunas.map(col => {
        let customStyle = "text-align: center;";

        // Ajustes finos de alinhamento e pesos visuais baseados na coluna mapeada
        if (col === 'DESCRIÇÃO') customStyle = "text-align: left;";
        if (col === 'QTD_UN' || col === 'QTD') customStyle += " font-weight: bold;";

        return `<td style="${customStyle} padding: 6px; border: 1px solid #ddd;">${produto[col] || ''}</td>`;
    }).join('')}
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `).join('');
}

// Inicializa os listeners assim que o DOM carregar completamente
document.addEventListener("DOMContentLoaded", configurarEventListeners);