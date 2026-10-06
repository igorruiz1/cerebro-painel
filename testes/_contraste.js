/* p4.10: contraste WCAG medido no que a tela pinta, nao na classe. Sobe na arvore ate achar fundo opaco
   (mistura as camadas translucidas) e compara com a cor do texto. Roda dentro da pagina (page.evaluate). */
function contrasteDos(sel){
  const rgb=s=>{const m=s.match(/[0-9.]+/g)||[0,0,0,0];return {r:+m[0],g:+m[1],b:+m[2],a:m[3]===undefined?1:+m[3]};};
  const lum=c=>{const f=v=>{v/=255;return v<=0.03928?v/12.92:Math.pow((v+0.055)/1.055,2.4);};return 0.2126*f(c.r)+0.7152*f(c.g)+0.0722*f(c.b);};
  const fundo=el=>{const camadas=[];for(let e=el;e;e=e.parentElement){const c=rgb(getComputedStyle(e).backgroundColor);if(c.a>0){camadas.push(c);if(c.a>=1)break;}}
    let base={r:255,g:255,b:255};for(const c of camadas.reverse()){base={r:c.r*c.a+base.r*(1-c.a),g:c.g*c.a+base.g*(1-c.a),b:c.b*c.a+base.b*(1-c.a)};}return base;};
  return [...document.querySelectorAll(sel)].filter(e=>e.offsetParent&&[...e.childNodes].some(n=>n.nodeType===3&&n.textContent.trim()))
    .map(e=>{const cs=getComputedStyle(e);const t=rgb(cs.color),b=fundo(e);const tt={r:t.r*t.a+b.r*(1-t.a),g:t.g*t.a+b.g*(1-t.a),b:t.b*t.a+b.b*(1-t.a)};
      const L1=lum(tt),L2=lum(b);const op=+cs.opacity;return {txt:e.textContent.trim().slice(0,40),razao:+(((Math.max(L1,L2)+.05)/(Math.min(L1,L2)+.05))*(op<1?op:1)).toFixed(2)};});
}
module.exports={contrasteDos};
