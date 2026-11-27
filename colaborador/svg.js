const req = document.getElementById('requisicao');
const bh = document.getElementById('bancodehoras');
const xdz = document.getElementById('xadrez-btn');
const prg = document.getElementById('programacao');
const trn = document.getElementById('treinamento');
const cb = document.getElementById('chatbot-svg');

const svgReq = `
    <svg xmlns="http://www.w3.org/2000/svg" class="button-bottom" viewBox="0 0 24 24" width="64" height="64" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">
  <!-- Corpo da prancheta -->
  <rect x="5" y="4" width="14" height="16" rx="2" ry="2" />
  
  <!-- Mola/presa superior -->
  <rect x="8" y="2" width="8" height="3" rx="1" />
  
  <!-- Páginas/linhas de texto -->
  <line x1="8" y1="9" x2="16" y2="9" />
  <line x1="8" y1="13" x2="16" y2="13" />
  <line x1="8" y1="17" x2="12" y2="17" />
</svg>Requisições
`;

const svgBh = `
    <svg xmlns="http://www.w3.org/2000/svg" class="button-bottom" viewBox="0 0 24 24" width="64" height="64" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">
  <!-- Mostrador do relógio -->
  <circle cx="12" cy="12" r="10" />
  
  <!-- Marcadores das horas (12, 3, 6, 9) -->
  <line x1="12" y1="3" x2="12" y2="6" />
  <line x1="21" y1="12" x2="18" y2="12" />
  <line x1="12" y1="21" x2="12" y2="18" />
  <line x1="3" y1="12" x2="6" y2="12" />
  
  <!-- Ponteiro das horas (apontando para ~10h) -->
  <line x1="12" y1="12" x2="9" y2="8" stroke-width="1" />
  
  <!-- Ponteiro dos minutos (apontando para ~2h) -->
  <line x1="12" y1="12" x2="15.5" y2="8.5" stroke-width="0.5" />
  
  <!-- Centro do relógio -->
  <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
</svg>Banco
`;

const svgVel = `
    <svg xmlns="http://www.w3.org/2000/svg" class="button-bottom" viewBox="0 0 24 24" width="64" height="64" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">
  <!-- Fundo do velocímetro -->
  <circle cx="12" cy="12" r="10" />
  
  <!-- Marcações da escala -->
  <line x1="12" y1="4" x2="12" y2="7" />
  <line x1="18.5" y1="5.5" x2="16.5" y2="8" />
  <line x1="20" y1="12" x2="17" y2="12" />
  <line x1="18.5" y1="18.5" x2="16.5" y2="16" />
  <line x1="5.5" y1="5.5" x2="8" y2="8" />
  <line x1="4" y1="12" x2="7" y2="12" />
  
  <!-- Zona vermelha (alta rotação) -->
  <path d="M 17 12 A 5 5 0 0 1 12 17" stroke="currentColor" fill="none" />
  
  <!-- Ponteiro -->
  <line x1="12" y1="12" x2="14" y2="8" stroke-width="1.5" />
  
  <!-- Centro do ponteiro -->
  <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" />
</svg>Velocidade
`;

const svgPrg = `
    <svg xmlns="http://www.w3.org/2000/svg" class="button-bottom" viewBox="0 0 24 24" width="64" height="64" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">
  <!-- Retângulo principal do calendário -->
  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
  
  <!-- Linha do cabeçalho -->
  <line x1="3" y1="9" x2="21" y2="9"></line>
  
  <!-- Linhas horizontais dos dias -->
  <line x1="3" y1="13" x2="21" y2="13"></line>
  <line x1="3" y1="17" x2="21" y2="17"></line>
  
  <!-- Linhas verticais (começando APENAS depois do cabeçalho) -->
  <line x1="8" y1="9" x2="8" y2="22"></line>
  <line x1="13" y1="9" x2="13" y2="22"></line>
  <line x1="18" y1="9" x2="18" y2="22"></line>
  
  <!-- Argolas superiores -->
  <circle cx="8" cy="4" r="1.5" fill="none" stroke="currentColor"></circle>
  <circle cx="12" cy="4" r="1.5" fill="none" stroke="currentColor"></circle>
  <circle cx="16" cy="4" r="1.5" fill="none" stroke="currentColor"></circle>
</svg>Programação
`;


const svgXad = `<svg xmlns="http://www.w3.org/2000/svg" class="button-bottom" viewBox="0 0 24 24" width="64" height="64" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">
  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
  
  <line x1="3" y1="8" x2="21" y2="8"></line>
  
  <line x1="3" y1="12" x2="21" y2="12"></line>
  <line x1="3" y1="16" x2="21" y2="16"></line>
  
  <line x1="9" y1="3" x2="9" y2="21"></line>
  <line x1="15" y1="3" x2="15" y2="21"></line>
</svg>Xadrez
`;

const svgTrn = `<svg xmlns="http://www.w3.org/2000/svg" class="button-bottom" viewBox="0 0 24 24" width="64" height="64" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">
  <!-- Base do livro -->
  <path d="M3 4h8a2 2 0 0 1 2 2v14a2 2 0 0 0-2-2H3z"></path>
  <path d="M21 4h-8a2 2 0 0 0-2 2v14a2 2 0 0 1 2-2h8z"></path>
  
  <!-- Linha central (divisão das páginas) -->
  <line x1="12" y1="6" x2="12" y2="20"></line>
  
  <!-- Linhas horizontais simulando texto -->
  <line x1="5" y1="8" x2="10" y2="8"></line>
  <line x1="5" y1="11" x2="10" y2="11"></line>
  <line x1="5" y1="14" x2="10" y2="14"></line>
  
  <line x1="14" y1="8" x2="19" y2="8"></line>
  <line x1="14" y1="11" x2="19" y2="11"></line>
  <line x1="14" y1="14" x2="19" y2="14"></line>
</svg>
Treinamentos
`;

const svgCB = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="50 20 400 400" width="120" height="140" fill="none" stroke="#ffffff" stroke-width="8.5">
  
  <path d="M 160 190 C 132 222, 130 280, 148 312 C 166 330, 192 325, 206 312 M 306 312 C 320 325, 346 330, 364 312 C 382 280, 380 222, 352 190" />
  <path d="M 265 102 C 195 100, 165 155, 160 225 M 265 102 C 325 105, 355 160, 355 230" />

  
  <path d="M 184 195 C 184 140, 328 140, 328 195 C 328 258, 296 302, 256 302 C 216 302, 184 258, 184 195" />
  <path d="M 232 292 L 232 355 M 280 292 L 280 355" />

  
  <path d="M 135 460 C 138 395, 150 365, 185 352 L 222 338 L 256 460 L 290 338 L 327 352 C 362 365, 374 395, 377 460" />
  <path d="M 222 338 L 204 378 L 256 460 M 290 338 L 308 378 L 256 460" />

  
  <path d="M 295 385 C 293 381, 285 381, 283 385 C 281 389, 285 391, 290 392 C 295 393, 298 396, 296 400 C 294 404, 285 404, 282 400" stroke-width="2" />

  
  <path d="M 205 196 Q 222 189 238 195 M 274 195 Q 290 189 307 196" />
  <circle cx="222" cy="218" r="6" />
  <circle cx="290" cy="218" r="6" />

  
  <path d="M 253 241 Q 256 244 259 241" stroke-width="2" />
  <path d="M 240 264 Q 256 273 272 264" />

  
  <path d="M 326 226 L 334 226 L 334 246 L 326 246" stroke-width="2" />
  <path d="M 329 246 C 326 265, 312 274, 295 276" stroke-width="2" />
</svg>
Chat
`;

req.innerHTML = svgReq;
bh.innerHTML = svgBh;
prg.innerHTML = svgPrg;
xdz.innerHTML = svgXad;
trn.innerHTML = svgTrn;
cb.innerHTML = svgCB;




const navButton = (obj) => {

  const color = '#05125e';
  const blur = 'blur(1px)';
  const cursor = 'pointer';

  const activateStyle = () => {
    obj.style.color = color;
    obj.style.cursor = cursor;
    obj.style.filter = blur;
  }

  const resetStyle = () => {
    obj.style.color = 'currentColor';
    obj.style.cursor = 'default';
    obj.style.filter = 'none';
  }

  obj.addEventListener('mouseover', activateStyle);
  obj.addEventListener('touchstart', activateStyle);

  obj.addEventListener('mouseout', resetStyle);
  obj.addEventListener('touchend', resetStyle);



}
navButton(req);
navButton(cb);
navButton(trn);
navButton(bh);
navButton(xdz);
navButton(prg);



const spans = document.querySelectorAll('.button-bottom');

spans.forEach(span => {
  span.addEventListener('click', () => {
    spans.forEach(s => s.classList.remove('button-active'));
    span.classList.add('button-active');
  });
});