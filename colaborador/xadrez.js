const xadrez = '../xadrez.pdf';




const canvas = document.getElementById('pdf-canvas');
const ctx = canvas.getContext('2d');





pdfjsLib.getDocument(xadrez).promise.then(pdf => {
    pdf.getPage(1).then(page => {
        const viewport = page.getViewport({
            scale: 3.0
        });
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        const renderContext = {
            canvasContext: ctx,
            viewport: viewport
        };
        page.render(renderContext).promise.then(() => {
            const trocarSetor = () => {

                const q = 383;
                const x = [1700, 200, 500, 852, 1158, 1463, 1768];
                const y = [22, 330, 588, 932, 1375];
                const w = [65, 300];
                const h = [161, 161, 225, 265, 243];



                const setorNome = document.getElementById('setorSelect').value;
                
                let setor;

                switch (setorNome) {
                    case 'esmalte':
                        setor = 0;
                        break;
                    case 'aerosol':
                        setor = 1;
                        break;
                    case 'lineares':
                        setor = 2;
                        break;
                    case 'rapidas':
                        setor = 3;
                        break;
                    case 'customizacao':
                        setor = 4;
                        break;
                    default:
                        setor = 3;
                }





                const hora = new Date().getHours();
                const day = new Date().getDay();
                let turno;
                let dia = day;
                let diaC;

                if (hora > 7 && hora < 15) {
                    turno = "A";
                } else if (hora > 15 && hora < 23) {
                    turno = "B";
                } else {
                    turno = "C";
                }
                console.log(`O dia é ${day}`);
                if (turno === "C") {
                    if (day === 0) {
                        diaC = [6, "Sábado"];
                    } else if (day === 2) {
                        diaC = [1, "Segunda"];
                    } else if (day === 3) {
                        diaC = [2, "Terça"];
                    } else if (day === 4) {
                        diaC = [3, "Quarta"];
                    } else if (day === 5) {
                        diaC = [4, "Quinta"];
                    } else if (day === 6) {
                        diaC = [5, "Sexta"];
                    }

                    dia = diaC[0];
                }




                console.log("O dia hoje é: ", diaC[1])


                const xQuadro = q;
                const yQuadro = y[setor];
                const wQuadro = w[0];
                const hQuadro = h[setor];

                const xLinha = x[dia];
                const yLinha = y[setor];
                const wLinha = w[1];
                const hLinha = h[setor];


                console.log('Setor:', setor);
                console.log('Linhas:', xLinha, yLinha, wLinha, hLinha);

                const quadro = document.createElement('canvas');
                quadro.width = wQuadro;
                quadro.height = hQuadro;
                quadro.getContext('2d').drawImage(canvas, xQuadro, yQuadro, wQuadro, hQuadro, 0, 0, wQuadro, hQuadro);

                const linhas = document.createElement('canvas');
                linhas.width = wLinha;
                linhas.height = hLinha;
                linhas.getContext('2d').drawImage(canvas, xLinha, yLinha, wLinha, hLinha, 0, 0, wLinha, hLinha);





                const newCanvas = document.createElement('canvas');
                newCanvas.width = (wQuadro + wLinha) * 2;
                newCanvas.height = Math.max(hLinha, hQuadro) * 2;

                const newCtx = newCanvas.getContext('2d');


                const newScale = 2.0;
                newCtx.scale(newScale, newScale);
                newCtx.drawImage(quadro, 0, 0);
                newCtx.drawImage(linhas, wQuadro, 0);

                const canva = document.getElementById('canva');
                canva.querySelectorAll('canvas:not(#pdf-canvas)').forEach(c => c.remove());
                canva.appendChild(newCanvas);
            };


            trocarSetor();
            document.getElementById('setorSelect').addEventListener('change', trocarSetor);
        });
    });
});