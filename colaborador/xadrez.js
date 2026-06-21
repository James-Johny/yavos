const xadrez = '../xadrez.pdf';




const canvas = document.getElementById('pdf-canvas');
const ctx = canvas.getContext('2d');





pdfjsLib.getDocument(xadrez).promise.then(pdf => {
    pdf.getPage(1).then(page => {
        const viewport = page.getViewport({
            scale: 3.5
        });
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        const renderContext = {
            canvasContext: ctx,
            viewport: viewport
        };
        page.render(renderContext).promise.then(() => {
            const trocarSetor = () => {

                // 
                const q = 120;
                const x = [470, 1320, 570, 470, 170, 170, 170];
                const y = [258, 526, 740, 1055, 1440];
                const w = [60, 260];
                const h = [145, 145, 220, 265, 243];



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
                let dia;
                let diaC;


                if (hora > 7 & hora < 15) {
                    turno = "A";
                } else if (hora > 15 & hora < 23) {
                    turno = "B";
                } else {
                    turno = "C";
                }




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
                } else {
                    dia = day;
                }


                dia = 1;
                console.log("Hora: ", hora, "Turno: ", turno, "Dia: ", dia);






                const xQuadro = q;
                const yQuadro = y[setor];
                const wQuadro = w[0];
                const hQuadro = h[setor];

                const xLinha = x[dia];
                const yLinha = y[setor];
                const wLinha = w[1];
                const hLinha = h[setor];


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
                newCanvas.width = (wQuadro + wLinha) * 2.5;
                newCanvas.height = Math.max(hLinha, hQuadro) * 2.5;

                const newCtx = newCanvas.getContext('2d');


                const newScale = 2.5;
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