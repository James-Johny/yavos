let rapidas = {};

        function evaluateExpression(value) {
            if (typeof value !== 'string') return value;
            const trimmed = value.trim();
            
            if (trimmed.startsWith('=')) {
                const expression = trimmed.substring(1);
                try {
                    if (/^[\d\s\+\-\*\/\(\)]+$/.test(expression)) {
                        const result = Function('"use strict";return (' + expression + ')')();
                        return Number(result);
                    }
                } catch(e) {
                    console.warn(`Não foi possível avaliar: ${expression}`);
                }
            }
            
            if (!isNaN(trimmed) && trimmed !== '') {
                return Number(trimmed);
            }
            return value;
        }

        function processExcelData(workbook) {
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "" });
            
            const rapidasTemp = {};
            let currentLine = null;
            let headers = null;
            
            for (let i = 0; i < jsonData.length; i++) {
                const row = jsonData[i];
                const firstCell = row[0] ? String(row[0]).trim() : '';
                
                if (firstCell.toUpperCase().startsWith('LINHA')) {
                    currentLine = firstCell;
                    rapidasTemp[currentLine] = [];
                    headers = null;
                    continue;
                }
                
                if (firstCell === 'CÓDIGO P.A.') {
                    headers = true;
                    continue;
                }
                
                if (currentLine && headers && row.length >= 5) {
                    const codigoPA = row[0] ? String(row[0]).trim() : '';
                    const descricaoPA = row[1] ? String(row[1]).trim() : '';
                    const numeroOrdem = row[2] ? String(row[2]).trim() : '';
                    const qtdCXS = row[3] ? evaluateExpression(row[3]) : '';
                    const qtdUND = row[4] ? evaluateExpression(row[4]) : '';
                    
                    if (codigoPA === '' && descricaoPA === '' && numeroOrdem === '' && 
                        qtdCXS === '' && qtdUND === '') {
                        continue;
                    }
                    
                    if (codigoPA === '' && descricaoPA !== '') {
                        continue;
                    }
                    
                    if (codigoPA !== '') {
                        rapidasTemp[currentLine].push({
                            "CÓDIGO P.A.": codigoPA,
                            "DESCRIÇÃO P.A.": descricaoPA,
                            "Nº ORDEM": numeroOrdem,
                            "QTD (CXS)": typeof qtdCXS === 'number' ? qtdCXS : qtdCXS,
                            "QTD (UND)": typeof qtdUND === 'number' ? qtdUND : qtdUND
                        });
                    }
                }
            }
            
            for (const line in rapidasTemp) {
                if (rapidasTemp[line].length === 0) {
                    delete rapidasTemp[line];
                }
            }
            
            return rapidasTemp;
        }

        function displayStats() {
            const statsDiv = document.getElementById('stats');
            const lines = Object.keys(rapidas);
            const totalItems = lines.reduce((sum, line) => sum + rapidas[line].length, 0);
            const totalUnd = lines.reduce((sum, line) => {
                return sum + rapidas[line].reduce((s, item) => {
                    const und = typeof item["QTD (UND)"] === 'number' ? item["QTD (UND)"] : 0;
                    return s + und;
                }, 0);
            }, 0);
            
            statsDiv.style.display = 'grid';
            statsDiv.innerHTML = `
                <div class="stat-card">
                    <h3>Total de Linhas</h3>
                    <div class="number">${lines.length}</div>
                </div>
                <div class="stat-card">
                    <h3>Total de Produtos</h3>
                    <div class="number">${totalItems}</div>
                </div>
                <div class="stat-card">
                    <h3>Total em Unidades</h3>
                    <div class="number">${totalUnd.toLocaleString()}</div>
                </div>
            `;
        }

        function displayTabs() {
            const tabsDiv = document.getElementById('tabs');
            const contentDiv = document.getElementById('content');
            const lines = Object.keys(rapidas);
            
            if (lines.length === 0) {
                contentDiv.innerHTML = '<div style="text-align: center; padding: 50px; background: white; border-radius: 15px;">Nenhum dado encontrado na planilha</div>';
                return;
            }
            
            tabsDiv.style.display = 'flex';
            
            tabsDiv.innerHTML = lines.map((line, index) => `
                <button class="tab-btn ${index === 0 ? 'active' : ''}" onclick="showTab('tab-${index}')">
                    📁 ${line}
                </button>
            `).join('');
            
            contentDiv.innerHTML = lines.map((line, index) => `
                <div id="tab-${index}" class="tab-content ${index === 0 ? 'active' : ''}">
                    <h3 style="margin-bottom: 20px; color: #667eea;">${line}</h3>
                    ${createTable(rapidas[line])}
                </div>
            `).join('');
        }

        function createTable(data) {
            if (data.length === 0) return '<p>Nenhum dado disponível</p>';
            
            const headers = Object.keys(data[0]);
            return `
                <table>
                    <thead>
                        <tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>
                    </thead>
                    <tbody>
                        ${data.map(row => `
                            <tr>
                                ${headers.map(h => `<td>${formatValue(row[h])}</td>`).join('')}
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
        }

        function formatValue(value) {
            if (value === '' || value === undefined || value === null) return '-';
            if (typeof value === 'number') return value.toLocaleString();
            return value;
        }

        window.showTab = function(tabId) {
            document.querySelectorAll('.tab-content').forEach(tab => {
                tab.classList.remove('active');
            });
            document.querySelectorAll('.tab-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            
            document.getElementById(tabId).classList.add('active');
            event.target.classList.add('active');
        };

        window.processFile = function() {
            const fileInput = document.getElementById('fileInput');
            const file = fileInput.files[0];
            const statusDiv = document.getElementById('status');
            
            if (!file) {
                statusDiv.innerHTML = '<div class="status error">❌ Por favor, selecione um arquivo Excel primeiro!</div>';
                return;
            }
            
            statusDiv.innerHTML = '<div class="status">⏳ Processando arquivo...</div>';
            
            const reader = new FileReader();
            reader.onload = function(e) {
                try {
                    const data = new Uint8Array(e.target.result);
                    const workbook = XLSX.read(data, { type: 'array' });
                    rapidas = processExcelData(workbook);
                    
                    statusDiv.innerHTML = '<div class="status success">✅ Arquivo processado com sucesso!</div>';
                    
                    displayStats();
                    displayTabs();
                    
                    console.log('Dados processados:', rapidas);
                    
                } catch (error) {
                    statusDiv.innerHTML = `<div class="status error">❌ Erro ao processar: ${error.message}</div>`;
                    console.error('Erro:', error);
                }
            };
            
            reader.onerror = function() {
                statusDiv.innerHTML = '<div class="status error">❌ Erro ao ler o arquivo!</div>';
            };
            
            reader.readAsArrayBuffer(file);
        };