const xadrez = '../xadrez.pdf';


const h1 = document.getElementById('h1-xadrez');
h1.style.textAlign = 'center';
h1.textContent = `Xadrez do dia`
h1.style.color = 'var(--purple3)';


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
            const exibeXadrez = () => {

                // 
                const q = 200;
                const x = [2100, 650, 937, 1226, 1518, 1809, 2100];
                const y = [43, 526, 588, 892, 1440];
                const w = [74, 277];
                const h = [140, 145, 480, 275, 243];



        


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


                console.log("Hora: ", hora, "Turno: ", turno, "Dia: ", dia);






                //* ===== QUADROS 
                const xQuadro0 = q;
                const yQuadro0 = y[0];
                const wQuadro0 = w[0];
                const hQuadro0 = h[0];

                const xQuadro2 = q;
                const yQuadro2 = y[2];
                const wQuadro2 = w[0];
                const hQuadro2 = h[2];

                const xQuadro3 = q;
                const yQuadro3 = y[3];
                const wQuadro3 = w[0];
                const hQuadro3 = h[3];



                // 

                const xEsmalte = x[dia];
                const yEsmalte = y[0];
                const wEsmalte = w[1];
                const hEsmalte = h[0];

                const xLineares = x[dia];
                const yLineares = y[2];
                const wLineares = w[1];
                const hLineares = h[2];

                const xRapidas = x[dia];
                const yRapidas = y[3];
                const wRapidas = w[1];
                const hRapidas = h[3];


                const quadro0 = document.createElement('canvas');
                quadro0.width = wQuadro0;
                quadro0.height = hQuadro0;
                quadro0.getContext('2d').drawImage(canvas, xQuadro0, yQuadro0, wQuadro0, hQuadro0, 0, 0, wQuadro0, hQuadro0);

                const quadro2 = document.createElement('canvas');
                quadro2.width = wQuadro2;
                quadro2.height = hQuadro2;
                quadro2.getContext('2d').drawImage(canvas, xQuadro2, yQuadro2, wQuadro2, hQuadro2, 0, 0, wQuadro2, hQuadro2);

                const quadro3 = document.createElement('canvas');
                quadro3.width = wQuadro3;
                quadro3.height = hQuadro3;
                quadro3.getContext('2d').drawImage(canvas, xQuadro3, yQuadro3, wQuadro3, hQuadro3, 0, 0, wQuadro3, hQuadro3);

              



                const esmalte = document.createElement('canvas');
                esmalte.width = wEsmalte;
                esmalte.height = hEsmalte;
                esmalte.getContext('2d').drawImage(canvas, xEsmalte, yEsmalte, wEsmalte, hEsmalte, 0, 0, wEsmalte, hEsmalte);

                const lineares = document.createElement('canvas');
                lineares.width = wLineares;
                lineares.height = hLineares;
                lineares.getContext('2d').drawImage(canvas, xLineares, yLineares, wLineares, hLineares, 0, 0, wLineares, hLineares);

                const rapidas = document.createElement('canvas');
                rapidas.width = wRapidas;
                rapidas.height = hRapidas;
                rapidas.getContext('2d').drawImage(canvas, xRapidas, yRapidas, wRapidas, hRapidas, 0, 0, wRapidas, hRapidas);






                const alturaTotal = Math.max(
                    hQuadro3 + hQuadro2 + hQuadro0,
                    hRapidas + hLineares + hEsmalte
                );


                const newCanvas = document.createElement('canvas');
                newCanvas.width = (wQuadro3 + wRapidas) * 2.5;
                newCanvas.height = (hRapidas + hLineares + hEsmalte) * 1.73;

                const newCtx = newCanvas.getContext('2d');


                const newScale = 2.5;
                newCtx.scale(newScale, newScale);

                // RAPIDAS
                newCtx.drawImage(quadro3, 0, 0);
                newCtx.drawImage(rapidas, wQuadro3, 0);


                // LINEARES
                newCtx.drawImage(quadro2, 0, hQuadro3);
                newCtx.drawImage(lineares, wQuadro2, hRapidas);

                // ESMALTE
                newCtx.drawImage(quadro0, 0, hQuadro2);
                newCtx.drawImage(esmalte, wQuadro0, hLineares);
                
              

                

                const canva = document.getElementById('canva');
                canva.querySelectorAll('canvas:not(#pdf-canvas)').forEach(c => c.remove());
                canva.appendChild(newCanvas);
            };


            exibeXadrez();
            
        });
    });
});