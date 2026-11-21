/* vendas.js · o528 (21/11/2026, s53930) · tela da lista diaria de vendas da Dabli (card 20539).
   Le dabli_vendas_hoje(p_dia) e marca cada contato por dabli_vendas_marcar(p_item, p_marca) com 3 botoes:
   feito, sem resposta e fora. Marcar nao se desfaz (o banco recusa a segunda marca e, em feito e sem resposta,
   grava o toque no CRM), por isso cada botao pede um segundo toque de confirmacao. "Dia fora" chama
   dabli_vendas_dia_fora(p_dia, p_motivo) e exige motivo, como o banco.
   Sessao: a mesma do presidente.html (mesma origem, mesmo armazenamento do supabase-js). Sem sessao, ou com
   o segundo fator pendente, a tela manda entrar pelo painel e nao chama o banco.
   ?demo=1 roda com dados inventados e nenhum acesso ao banco; ?dia=AAAA-MM-DD abre outro dia. */
(function(){
"use strict";
var URL_="https://kssvzrnjiqfgtvoifboj.supabase.co";
var KEY_="sb_publishable_6z7d0j-YzMugoZS_NYUEUw_-LVLWxE5";
var ROTULO={feito:"Feito",sem_resposta:"Sem resposta",fora:"Fora"};
var MARCADO={feito:"Feito: toque registrado",sem_resposta:"Sem resposta: toque registrado",fora:"Fora: sem toque"};
var CONFIRMA_MS=5000;

function q(){ try{ return new URLSearchParams(location.search); }catch(e){ return new URLSearchParams(""); } }
var params=q();
var DEMO=params.get("demo")==="1";

function hojeCuiaba(){
  /* en-CA formata AAAA-MM-DD; a hora vem do fuso de Cuiaba (UTC-4 fixo), nao do aparelho */
  return new Intl.DateTimeFormat("en-CA",{timeZone:"America/Cuiaba",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date());
}
var diaParam=params.get("dia");
var DIA=(diaParam&&/^\d{4}-\d{2}-\d{2}$/.test(diaParam))?diaParam:hojeCuiaba();

function demoCliente(){
  var itens=[
    {item_id:1,ordem:1,conta:"Construtora Exemplo",motivo:"alvo novo",texto:"Ola! Aqui e o Igor, da Dabli Tech. Texto de exemplo.",link:"https://wa.me/?text=exemplo",marca:null},
    {item_id:2,ordem:2,conta:"Pavimentadora Modelo",motivo:"follow-up",texto:"Passando para retomar nossa conversa.",link:"https://wa.me/?text=exemplo",marca:null},
    {item_id:3,ordem:3,conta:"Obras Ficticias",motivo:"proposta",texto:"Conseguiu ver a proposta?",link:"https://wa.me/?text=exemplo",marca:null}];
  function ok(d){ return Promise.resolve({data:d,error:null}); }
  return {
    demo:true,
    auth:{getSession:function(){ return ok({session:{user:{id:"demo"}}}); },
          mfa:{getAuthenticatorAssuranceLevel:function(){ return ok({currentLevel:"aal1",nextLevel:"aal1"}); }}},
    rpc:function(nome,args){
      if(nome==="dabli_vendas_hoje") return ok(itens.map(function(i){ return Object.assign({},i); }));
      if(nome==="dabli_vendas_marcar"){
        var it=itens.filter(function(i){ return i.item_id===args.p_item; })[0];
        if(!it) return Promise.resolve({data:null,error:{message:"item nao existe"}});
        if(it.marca) return ok({ok:false,motivo:"item ja marcado",marca:it.marca});
        it.marca=args.p_marca; return ok({ok:true,marca:args.p_marca});
      }
      if(nome==="dabli_vendas_dia_fora") return ok({ok:true,dia:args.p_dia,fora:true});
      return Promise.resolve({data:null,error:{message:"funcao desconhecida"}});
    }
  };
}

var el={};
function estado(txt,erro){ el.estado.textContent=txt; el.estado.className=erro?"erro":""; }
function fmtDia(d){ var p=d.split("-"); return p[2]+"/"+p[1]+"/"+p[0]; }
function linkSeguro(u){ return (typeof u==="string"&&/^https:\/\/wa\.me\//.test(u))?u:null; }

function desenhar(sb,itens){
  el.lista.textContent="";
  if(!itens.length){
    var v=document.createElement("p"); v.className="vazio";
    v.textContent="Nenhum contato na lista deste dia."; el.lista.appendChild(v);
  }
  itens.forEach(function(it){ el.lista.appendChild(cartao(sb,it)); });
  var marcados=itens.filter(function(i){ return i.marca; }).length;
  estado(itens.length?(marcados+" de "+itens.length+" marcados"):"Lista vazia");
}

function cartao(sb,it){
  var c=document.createElement("article"); c.className="item"; c.dataset.item=String(it.item_id);
  var cab=document.createElement("div"); cab.className="cab";
  var nome=document.createElement("span"); nome.className="conta"; nome.textContent=it.ordem+". "+it.conta;
  var mot=document.createElement("span"); mot.className="motivo"; mot.textContent=it.motivo||"";
  cab.appendChild(nome); cab.appendChild(mot); c.appendChild(cab);
  if(it.texto){ var t=document.createElement("p"); t.className="texto"; t.textContent=it.texto; c.appendChild(t); }
  var l=linkSeguro(it.link);
  if(l){ var a=document.createElement("a"); a.className="zap"; a.href=l; a.target="_blank"; a.rel="noopener noreferrer";
    a.textContent="Abrir no WhatsApp"; c.appendChild(a); }
  var bx=document.createElement("div"); bx.className="botoes";
  var info=document.createElement("p"); info.className="marca"; info.hidden=true;
  ["feito","sem_resposta","fora"].forEach(function(m){
    var b=document.createElement("button"); b.type="button"; b.dataset.marca=m; b.textContent=ROTULO[m];
    b.addEventListener("click",function(){ tocar(sb,it,b,bx,info,c); });
    bx.appendChild(b);
  });
  c.appendChild(bx); c.appendChild(info);
  if(it.marca) aplicarMarca(it,it.marca,bx,info,c);
  return c;
}

function aplicarMarca(it,marca,bx,info,c){
  it.marca=marca;
  [].forEach.call(bx.querySelectorAll("button"),function(b){ b.disabled=true; b.classList.remove("confirmar"); b.textContent=ROTULO[b.dataset.marca]; });
  info.textContent=MARCADO[marca]||("Marcado: "+marca); info.hidden=false;
  c.classList.add("marcado"); c.dataset.marca=marca;
}

function voltar(b){ b.classList.remove("confirmar"); b.textContent=ROTULO[b.dataset.marca]; if(b._t){ clearTimeout(b._t); b._t=null; } }

function tocar(sb,it,b,bx,info,c){
  if(it.marca) return;
  if(!b.classList.contains("confirmar")){
    [].forEach.call(bx.querySelectorAll("button.confirmar"),voltar);
    b.classList.add("confirmar"); b.textContent="Confirmar "+ROTULO[b.dataset.marca].toLowerCase();
    b._t=setTimeout(function(){ voltar(b); },CONFIRMA_MS);
    estado("Toque de novo para confirmar. Marcar não se desfaz.");
    return;
  }
  voltar(b);
  var botoes=bx.querySelectorAll("button");
  [].forEach.call(botoes,function(x){ x.disabled=true; });
  estado("Gravando…");
  sb.rpc("dabli_vendas_marcar",{p_item:it.item_id,p_marca:b.dataset.marca}).then(function(r){
    if(r.error) throw r.error;
    var d=r.data||{};
    if(d.ok===false&&d.marca){ aplicarMarca(it,d.marca,bx,info,c); estado("Este contato já estava marcado como "+ROTULO[d.marca]+"."); return; }
    if(d.ok!==true) throw new Error(d.motivo||"o banco não confirmou a marca");
    aplicarMarca(it,d.marca||b.dataset.marca,bx,info,c);
    var todos=el.lista.querySelectorAll(".item"), feitos=el.lista.querySelectorAll(".item.marcado");
    estado(feitos.length+" de "+todos.length+" marcados");
  }).catch(function(e){
    [].forEach.call(botoes,function(x){ x.disabled=false; });
    estado("Não gravou: "+((e&&e.message)||"erro desconhecido")+". Tente de novo.",true);
  });
}

function diaFora(sb){
  var m=(el.motivo.value||"").trim();
  if(!m){ estado("Escreva o motivo do dia fora antes de gravar.",true); el.motivo.focus(); return; }
  el.btnFora.disabled=true; estado("Gravando…");
  sb.rpc("dabli_vendas_dia_fora",{p_dia:DIA,p_motivo:m}).then(function(r){
    if(r.error) throw r.error;
    if(!r.data||r.data.ok!==true) throw new Error("o banco não confirmou");
    estado("Dia "+fmtDia(DIA)+" marcado como fora: "+m);
  }).catch(function(e){
    el.btnFora.disabled=false;
    estado("Não gravou: "+((e&&e.message)||"erro desconhecido")+". Tente de novo.",true);
  });
}

function semAcesso(txt){
  estado(txt,true);
  var p=document.createElement("p"); p.className="vazio";
  var a=document.createElement("a"); a.href="presidente.html"; a.textContent="Entrar pelo painel";
  p.appendChild(a); el.lista.appendChild(p);
}

function iniciar(){
  el.estado=document.getElementById("estado"); el.lista=document.getElementById("lista");
  el.motivo=document.getElementById("motivo-fora"); el.btnFora=document.getElementById("btn-fora");
  document.getElementById("dia").textContent=fmtDia(DIA)+(DEMO?" · demonstração, nada vai ao banco":"");
  var sb;
  if(DEMO) sb=demoCliente();
  else if(window.supabase&&typeof window.supabase.createClient==="function") sb=window.supabase.createClient(URL_,KEY_);
  else { estado("Não carregou a biblioteca do banco. Verifique a internet e recarregue.",true); return; }
  sb.auth.getSession().then(function(r){
    var s=r&&r.data&&r.data.session;
    if(!s){ semAcesso("Sem sessão neste aparelho."); return null; }
    var mfa=sb.auth.mfa&&sb.auth.mfa.getAuthenticatorAssuranceLevel;
    return (mfa?sb.auth.mfa.getAuthenticatorAssuranceLevel():Promise.resolve({data:null})).then(function(a){
      var d=a&&a.data;
      if(d&&d.nextLevel==="aal2"&&d.currentLevel!=="aal2"){ semAcesso("Falta o código do segundo fator."); return null; }
      return sb.rpc("dabli_vendas_hoje",{p_dia:DIA});
    });
  }).then(function(r){
    if(!r) return;
    if(r.error) throw r.error;
    desenhar(sb,r.data||[]);
    document.getElementById("sec-fora").hidden=false;
    el.btnFora.addEventListener("click",function(){ diaFora(sb); });
  }).catch(function(e){
    estado("Não carregou a lista: "+((e&&e.message)||"erro desconhecido"),true);
  });
}

if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",iniciar); else iniciar();
})();
