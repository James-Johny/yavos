const xadrez = '../xadrez.pdf';

const esmalte = { //  x y width height
    quadro: "483, 30, 65, 156",
    seg: "925, 30, 290, 156",
    ter: "1224, 30, 290, 156",
    qua: "1530, 30, 290, 156",
    qui: "1834, 30, 290, 156",
    sex: "2131, 30, 290, 156",
    sab: "2433, 30, 290, 156"
};

const wEsmalte = 290;
const hEsmalte = 122;


const xQuadro = 106;

const yEsmalte = 64;
const yRapidas = 958;
const yLineares = 624;
const yCustomizacao = 1394;
const yAerosol = 362;

const xSeg = 1720;
const xTer = 1986;
const xQua = 2245;
const xQui = 1724;
const xSex = null;
const xSab = null;


const aerosol = {
    quadro: "483, 320, 65, 156",
    seg: "925, 320, 290, 156",
    ter: "1224, 320, 290, 156",
    qua: "1530, 320, 290, 156",
    qui: "1834, 320, 290, 156",
    sex: "2131, 320, 290, 156",
    sab: "2433, 320, 290, 156"
};
const lineares = {
    size: "380, 160",
    position: "170, 624",
    quadro: "483, 580, 65, 220",
    seg: "925, 580, 290, 220",
    ter: "1224, 580, 290, 220",
    qua: "1530, 580, 290, 220",
    qui: "1834, 580, 290, 220",
    sex: "2131, 580, 290, 220",
    sab: "2433, 580, 290, 220"
};
const rapidas = {
    size: "380, 200",
    position: "170, 958",
    quadro: "483, 913, 65, 260",
    seg: "925, 913, 290, 260",
    ter: "1224, 913, 290, 260",
    qua: "1530, 913, 290, 260",
    qui: "1834, 913, 290, 260",
    sex: "2131, 913, 290, 260",
    sab: "2433, 913, 290, 260"
};
const customizacao = {
    size: "380, 102",
    position: "170, 1394",
    quadro: "288, 102",
    seg: "625, 1394",
    ter: "925, 1394",
    qua: "1225, 1394",
    qui: "1524, 1394",
    sex: "1824, 1394",
    sab: "2132, 1394"
};


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
                const setorNome = document.getElementById('setorSelect').value;
                const dia = diaC; //document.getElementById('diaSelect').value;
                let setor;

                switch (setorNome) {
                    case 'esmalte':
                        setor = esmalte;
                        break;
                    case 'aerosol':
                        setor = aerosol;
                        break;
                    case 'lineares':
                        setor = lineares;
                        break;
                    case 'rapidas':
                        setor = rapidas;
                        break;
                    case 'customizacao':
                        setor = customizacao;
                        break;
                    default:
                        setor = rapidas;
                }





                const hora = 5; //new Date().getHours();
                const day = new Date().getDay();
                let dia;
                let turno;

                if (hora > 7 && hora < 15) {
                    turno = "A";
                } else if (hora > 15 && hora < 23) {
                    turno = "B";
                } else {
                    turno = "C";
                }


                if (turno === "C") {
                    if (day === 0) {
                        diaC = "sab";
                    } else if (day === 2) {
                        diaC = "seg";
                    } else if (day === 3) {
                        diaC = "ter";
                    } else if (day === 4) {
                        diaC = "qua";
                    } else if (day === 5) {
                        diaC = "qui";
                    } else if (day === 6) {
                        diaC = "sex";
                    }
                }
                console.log('Turno:', turno + ' - Dia:', diaC);




                const [x, y, width, height] = setor[dia].split(',').map(Number);
                const [x2, y2, width2, height2] = setor.quadro.split(',').map(Number);
                const [xRecEsmalte, yRecEsmalte, wRecEsmalte, hRecEsmalte] = esmalte.quadro.split(',').map(Number);
                const [xEsmalte, yEsmalte, wEsmalte, hEsmalte] = esmalte[dia].split(',').map(Number);
                const [xRapidas, yRapidas, wRapidas, hRapidas] = rapidas[dia].split(',').map(Number);



                const recEsmalte = document.createElement('canvas');
                recEsmalte.width = wRecEsmalte;
                recEsmalte.height = hRecEsmalte;
                recEsmalte.getContext('2d').drawImage(canvas, xRecEsmalte, yRecEsmalte, wRecEsmalte, hRecEsmalte, 0, 0, wRecEsmalte, hRecEsmalte);

                const linhasEsmalte = document.createElement('canvas');
                linhasEsmalte.width = width2;
                linhasEsmalte.height = height2;
                linhasEsmalte.getContext('2d').drawImage(canvas, xEsmalte, yEsmalte, wEsmalte, hEsmalte, 0, 0, wEsmalte, hEsmalte);

                const linhasRapidas = document.createElement('canvas');
                linhasRapidas.width = wRapidas;
                linhasRapidas.height = hRapidas;
                linhasRapidas.getContext('2d').drawImage(canvas, xRapidas, yRapidas, wRapidas, hRapidas, 0, 0, wRapidas, hRapidas);


                const linhasLineares = document.createElement('canvas');

                const newCanvas = document.createElement('canvas');
                newCanvas.width = (wRecEsmalte + wEsmalte) * 2;
                newCanvas.height = Math.max(hRecEsmalte, hEsmalte) * 2;

                const newCtx = newCanvas.getContext('2d');


                const newScale = 2.0;
                newCtx.scale(newScale, newScale);
                newCtx.drawImage(recEsmalte, 0, 0);
                newCtx.drawImage(linhasEsmalte, wEsmalte, 0);

                const canva = document.getElementById('canva');
                canva.querySelectorAll('canvas:not(#xlsx #pdf-canvas)').forEach(c => c.remove());
                canva.appendChild(newCanvas);
            };


            trocarSetor();
            document.getElementById('setorSelect').addEventListener('change', trocarSetor);
            document.getElementById('diaSelect').addEventListener('change', trocarSetor);
        });
    });
});