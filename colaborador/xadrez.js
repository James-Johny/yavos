const xadrez = '../xadrez.pdf';

const esmalte = { //  x y width height
    quadro: "483, 30, 290, 156",
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
    quadro: "483, 320, 290, 156",
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
    quadro: "483, 580, 340, 220",
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
    quadro: "483, 913, 340, 260",
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