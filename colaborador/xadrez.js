const xadrez = '../xadrez.pdf';

const esmalte = { //  x y width height
    size: "380, 102",
    position: "170, 64",
    quadro: "483, 30, 290, 156",
    quadro2: "260, 106",
    seg: "625, 64",
    ter: "925, 64",
    qua: "1225, 64",
    qui: "1524, 64",
    sex: "1824, 64",
    sab: "2132, 64",
    seg2: "925, 30, 290, 156",
    ter2: "1986, 147, 260, 138",
    qua2: "2245, 147, 260, 138",
    qui2: "1724, 147, 260, 138",
    sex2: "1924, 147, 260, 138",
    sab2: "2232, 147, 260, 138"
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
    size: "380, 102",
    position: "170, 362",
    quadro: "160, 418, 260, 106",
    seg: "625, 362",
    ter: "925, 362",
    qua: "1225, 362",
    qui: "1524, 362",
    sex: "1824, 362",
    sab: "2132, 362",
    seg2: "939, 161, 260, 106",
    ter2: "1200, 161, 260, 106",
    qua2: "1475, 161, 260, 106",
    qui2: "1724, 161, 260, 106",
    sex2: "1924, 161, 260, 106",
    sab2: "2232, 161, 260, 106"
};
const lineares = {
    size: "380, 160",
    position: "170, 624",
    quadro: "288, 160",
    seg: "625, 624",
    ter: "925, 624",
    qua: "1225, 624",
    qui: "1524, 624",
    sex: "1824, 624",
    sab: "2132, 624"
};
const rapidas = {
    size: "380, 200",
    position: "170, 958",
    quadro: "288, 200",
    seg: "625, 958",
    ter: "925, 958",
    qua: "1225, 958",
    qui: "1524, 958",
    sex: "1824, 958",
    sab: "2132, 958"
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
                const dia = document.getElementById('diaSelect').value;
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

                const [x, y, width, height] = setor[dia].split(',').map(Number);
                const [x2, y2, width2, height2] = setor.quadro.split(',').map(Number);

                const recorteCanvas = document.createElement('canvas');
                recorteCanvas.width = width;
                recorteCanvas.height = height;
                recorteCanvas.getContext('2d').drawImage(canvas, x, y, width, height, 0, 0, width, height);

                const quadroCanvas = document.createElement('canvas');
                quadroCanvas.width = width2;
                quadroCanvas.height = height2;
                quadroCanvas.getContext('2d').drawImage(canvas, x2, y2, width2, height2, 0, 0, width2, height2);
                              

                const newCanvas = document.createElement('canvas');
                newCanvas.width = (width + width2) * 1.5;
                newCanvas.height = Math.max(height, height2) * 1.5;

                const newCtx = newCanvas.getContext('2d');


                const newScale = 1.5;
                newCtx.scale(newScale, newScale);
                newCtx.drawImage(quadroCanvas, 0, 0);
                newCtx.drawImage(recorteCanvas, width2, 0);

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