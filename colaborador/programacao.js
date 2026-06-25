async function carregarEExibirPlanilha(url) {
    const statusDiv = document.getElementById('status');
    statusDiv.textContent = "Buscando arquivo...";
    statusDiv.style.display = 'block';
    statusDiv.style.opacity = '1';

    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Status HTTP: ${response.status}`);

        const arrayBuffer = await response.arrayBuffer();
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(arrayBuffer);
        const worksheet = workbook.worksheets[0];

        const table = document.createElement('table');
        table.className = 'excel-table';

        // 1. Mapeamento de Células Mescladas (Merge Cells) - Método Corrigido
        const colunasMescladas = {};
        if (worksheet.model && worksheet.model.merges) {
            worksheet.model.merges.forEach(rangeStr => {
                const [topLeftRef, bottomRightRef] = rangeStr.split(':');
                const topLeftCell = worksheet.getCell(topLeftRef);
                const bottomRightCell = worksheet.getCell(bottomRightRef);

                const top = topLeftCell.row;
                const left = topLeftCell.col;
                const bottom = bottomRightCell.row;
                const right = bottomRightCell.col;

                for (let r = top; r <= bottom; r++) {
                    for (let c = left; c <= right; c++) {
                        if (r === top && c === left) {
                            colunasMescladas[`${r}_${c}`] = {
                                isMaster: true,
                                rowspan: (bottom - top) + 1,
                                colspan: (right - left) + 1
                            };
                        } else {
                            colunasMescladas[`${r}_${c}`] = {
                                isSlave: true
                            };
                        }
                    }
                }
            });
        }

        // 2. Construção da tabela respeitando ocultações
        worksheet.eachRow({
            includeEmpty: true
        }, (row, rowNumber) => {
            const tr = document.createElement('tr');

            // VERIFICAÇÃO: Se a linha inteira estiver oculta no Excel
            if (row.hidden) {
                tr.style.display = 'none';
            }

            row.eachCell({
                includeEmpty: true
            }, (cell, colNumber) => {
                // VERIFICAÇÃO: Se a coluna atual estiver oculta no Excel
                const columnModel = worksheet.getColumn(colNumber);
                if (columnModel && columnModel.hidden) {
                    return; // Ignora e não renderiza esta célula (coluna oculta)
                }

                const cellKey = `${rowNumber}_${colNumber}`;
                const mergeInfo = colunasMescladas[cellKey];

                // Pula células escravas de mesclagem
                if (mergeInfo && mergeInfo.isSlave) return;

                const td = document.createElement('td');

                // Aplica rowspan/colspan
                if (mergeInfo && mergeInfo.isMaster) {
                    if (mergeInfo.rowspan > 1) td.setAttribute('rowspan', mergeInfo.rowspan);
                    if (mergeInfo.colspan > 1) td.setAttribute('colspan', mergeInfo.colspan);
                }

                // Conteúdo da célula
                if (cell.value && typeof cell.value === 'object') {
                    if (cell.value.result !== undefined) {
                        const num = Number(cell.value.result);
                        td.textContent = !isNaN(num) ? Math.floor(num) : cell.value.result;
                    } else if (cell.value.richText) {
                        const texto = cell.value.richText.map(t => t.text).join('');
                        const num = Number(texto);
                        td.textContent = !isNaN(num) ? Math.floor(num) : texto;
                    } else {
                        td.textContent = '';
                    }
                } else {
                    const num = Number(cell.value);
                    td.textContent = (cell.value !== null && cell.value !== undefined) 
                        ? (!isNaN(num) ? Math.floor(num) : cell.value) 
                        : '';
                }

                // --- Estilos de Formatação ---
                // Cor de fundo
                if (cell.fill && cell.fill.type === 'pattern' && cell.fill.fgColor && cell.fill.fgColor.argb) {
                    const argb = cell.fill.fgColor.argb;
                    td.style.backgroundColor = '#' + (argb.length === 8 ? argb.substring(2) : argb);
                }

                // Fonte
                if (cell.font) {
                    if (cell.font.bold) td.style.fontWeight = 'bold';
                    if (cell.font.italic) td.style.fontStyle = 'italic';
                    if (cell.font.size) td.style.fontSize = `32pt`;
                    if (cell.font.color && cell.font.color.argb) {
                        const cColor = cell.font.color.argb;
                        td.style.color = '#' + (cColor.length === 8 ? cColor.substring(2) : cColor);
                    }
                }

                // Alinhamento
                if (cell.alignment) {
                    if (cell.alignment.horizontal) td.style.textAlign = cell.alignment.horizontal;
                    if (cell.alignment.vertical) td.style.verticalAlign = cell.alignment.vertical === 'middle' ? 'middle' : cell.alignment.vertical;
                }

                tr.appendChild(td);
            });

            table.appendChild(tr);
        });

        const container = document.getElementById('planilha-container');
        container.innerHTML = '';
        container.appendChild(table);

        statusDiv.style.backgroundColor = '#dcfce7';
        statusDiv.style.color = '#15803d';
        statusDiv.textContent = "Planilha carregada com sucesso!";
        statusDiv.style.position = 'fixed';

        setTimeout(() => {
            statusDiv.style.opacity = '0';
            setTimeout(() => {
                statusDiv.style.display = 'none';
            }, 500);
        }, 3000);

    } catch (error) {
        statusDiv.style.backgroundColor = '#fee2e2';
        statusDiv.style.color = '#b91c1c';
        statusDiv.textContent = `Erro: ${error.message}`;
        console.error(error);

        setTimeout(() => {
            statusDiv.style.opacity = '0';
            setTimeout(() => {
                statusDiv.style.display = 'none';
            }, 500);
        }, 3000);
    }
}

// CORREÇÃO PRINCIPAL: Configurar o event listener corretamente
function configurarEventListeners() {
    const setorSelect = document.getElementById("setorSelect");
    
    // Carregar a planilha inicial (primeira opção)
    const setorInicial = setorSelect.value;
    if (setorInicial) {
        const NOME_DO_ARQUIVO = `${setorInicial}.xlsx`;
        carregarEExibirPlanilha(NOME_DO_ARQUIVO);
    }

    // Event listener para quando o select mudar
    setorSelect.addEventListener('change', function() {
        const setorNome = this.value;
        
        if (!setorNome) return;
        
        const NOME_DO_ARQUIVO = `${setorNome}.xlsx`;
        console.log("Alterando para o arquivo: ", NOME_DO_ARQUIVO);
        carregarEExibirPlanilha(NOME_DO_ARQUIVO);
    });
}

// Inicializar quando a página carregar
document.addEventListener('DOMContentLoaded', configurarEventListeners);