/* p4.89 (plano 160, s23120, 05/11/2026): caixa de e-mail de obra no painel, SEM IA e SOMENTE LEITURA.
   Este arquivo so classifica e desenha. Nao fala com o Gmail, nao marca lido, nao altera nada la: a leitura real entra
   quando o Igor autorizar o Gmail (plano 135) e alimentar CAIXA.emails. Enquanto isso a folha mostra 10 e-mails de
   EXEMPLO, rotulados como tal. Repo publico: todo dado aqui e ficticio (dominios .example). */
(function(){
  const sa=s=>String(s||"").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"");
  const EQUIPE_DOMINIOS=["equipe-obra.example"];
  const FILTROS=[
    {k:"orgao",rot:"Órgão",dom:/(\.gov\.br|prefeitura|secretaria|crea|sinduscon)/,txt:/\b(prefeitura|secretaria municipal|alvara|habite-se|crea)\b/},
    {k:"supervisora",rot:"Supervisora",dom:/(supervis|fiscaliza)/,txt:/\b(supervisora|supervisao|fiscalizacao|fiscal da obra)\b/},
    {k:"assinatura",rot:"Assinatura eletrônica",dom:/(clicksign|d4sign|docusign|assinatura)/,txt:/\b(assinatura eletronica|para assinar|assine o documento|aguardando sua assinatura)\b/},
    {k:"equipe",rot:"Equipe",dom:null,txt:null}
  ];
  const ASSUNTOS=[
    {k:"medicao",rot:"Medição",txt:/\b(medicao|medicoes|boletim de medicao)\b/},
    {k:"notificacao",rot:"Notificação",txt:/\b(notificacao|notificado|intimacao|multa|embargo)\b/},
    {k:"pagamento",rot:"Pagamento",txt:/\b(pagamento|boleto|nota fiscal|nf-?e|fatura|vencimento|pix)\b/},
    {k:"rh",rot:"RH",txt:/\b(rh|ferias|admissao|demissao|atestado|folha de pagamento|cartao de ponto|registro de ponto|fgts|esocial)\b/}
  ];
  function dominio(de){ const m=String(de||"").toLowerCase().match(/@([a-z0-9.-]+)/); return m?m[1]:""; }
  function classificar(e){
    const dom=dominio(e.de), tx=sa((e.assunto||"")+" "+(e.trecho||"")+" "+(e.de||""));
    const filtros=[];
    for(const f of FILTROS){
      const ok=f.k==="equipe"?EQUIPE_DOMINIOS.includes(dom):((f.dom&&f.dom.test(dom))||(f.txt&&f.txt.test(tx)));
      if(ok)filtros.push(f.k);
    }
    const assuntos=ASSUNTOS.filter(a=>a.txt.test(tx)).map(a=>a.k);
    return {filtros,assuntos,trabalho:filtros.length>0};
  }
  const EXEMPLOS=[
    {id:"x1",de:"Setor de Obras <obras@prefeitura-exemplo.gov.br>",assunto:"Notificação de embargo parcial da obra",trecho:"Fica notificado o responsável técnico.",data:"2026-11-03"},
    {id:"x2",de:"Supervisora <fiscal@supervisora-exemplo.example>",assunto:"Boletim de medição 07 para conferência",trecho:"Segue a medição do mês com os quantitativos.",data:"2026-11-03"},
    {id:"x3",de:"ClickSign <nao-responda@clicksign.example>",assunto:"Aguardando sua assinatura: aditivo contratual",trecho:"Assine o documento até sexta.",data:"2026-11-02"},
    {id:"x4",de:"Mestre de obras <mestre@equipe-obra.example>",assunto:"Atestado do ajudante e férias de dezembro",trecho:"Mandei o atestado e o pedido de férias.",data:"2026-11-02"},
    {id:"x5",de:"Fornecedor <cobranca@concreto-exemplo.example>",assunto:"Boleto e nota fiscal 1234 com vencimento 10/11",trecho:"Segue a fatura do concreto.",data:"2026-11-01"},
    {id:"x6",de:"Secretaria Municipal <habite-se@secretaria-exemplo.gov.br>",assunto:"Pagamento da taxa de alvará",trecho:"Guia de pagamento em anexo.",data:"2026-10-31"},
    {id:"x7",de:"Newsletter <oi@loja-exemplo.example>",assunto:"Promoção de ferramentas",trecho:"Descontos de até 40%.",data:"2026-10-31"},
    {id:"x8",de:"Amigo <amigo@pessoal-exemplo.example>",assunto:"Churrasco no sábado",trecho:"Vai dar para vir?",data:"2026-10-30"},
    {id:"x9",de:"Engenheiro <eng@equipe-obra.example>",assunto:"Medição da fundação e nota fiscal da armação",trecho:"Fechei a medição; a nf-e vai amanhã.",data:"2026-10-30"},
    {id:"x10",de:"Fiscalização <fiscal@supervisora-exemplo.example>",assunto:"Notificação: ponto de concretagem sem laudo",trecho:"A supervisão pede o laudo antes da próxima concretagem.",data:"2026-10-29"}
  ];
  const C={classificar,EXEMPLOS,FILTROS,ASSUNTOS,emails:null,estado:{filtro:"todos",assunto:"todos"}};
  const rotF=k=>(FILTROS.find(f=>f.k===k)||{}).rot||k, rotA=k=>(ASSUNTOS.find(a=>a.k===k)||{}).rot||k;
  const e_=s=>String(s==null?"":s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  C.lista=function(){
    const base=(C.emails||EXEMPLOS).map(e=>Object.assign({},e,classificar(e)));
    const {filtro,assunto}=C.estado;
    return base.filter(e=>(filtro==="todos"?true:filtro==="fora"?!e.trabalho:e.filtros.includes(filtro))&&(assunto==="todos"||e.assuntos.includes(assunto)));
  };
  C.tituloCard=function(e){ return ("Responder: "+String(e.assunto||"").replace(/\s+/g," ").trim()).slice(0,70); };
  C.html=function(){
    const real=!!C.emails, l=C.lista(), st=C.estado;
    const chip=(acao,k,rot,on)=>`<button class="${on?"sug":""}" data-acao="${acao}" data-a1="${e_(k)}" aria-pressed="${on}">${e_(rot)}</button>`;
    return `<h3 id="folhaTit">Caixa de obra</h3>
      <p class="mut">${real?"Somente leitura: nada aqui marca lido nem altera o Gmail.":"E-mails de exemplo: o Gmail ainda não está conectado. Somente leitura, sem IA."}</p>
      <div class="campo"><span class="mut">De quem</span><div class="datas">${chip("caixaFiltro","todos","Todos",st.filtro==="todos")}${FILTROS.map(f=>chip("caixaFiltro",f.k,f.rot,st.filtro===f.k)).join("")}${chip("caixaFiltro","fora","Fora do trabalho",st.filtro==="fora")}</div></div>
      <div class="campo"><span class="mut">Assunto</span><div class="datas">${chip("caixaAssunto","todos","Todos",st.assunto==="todos")}${ASSUNTOS.map(a=>chip("caixaAssunto",a.k,a.rot,st.assunto===a.k)).join("")}</div></div>
      <ul class="caixa-lista" aria-live="polite">${l.length?l.map(e=>`<li class="caixa-item"><b>${e_(e.assunto)}</b><div class="mut">${e_(e.de.replace(/\s*<.*$/,""))} · ${e_(e.data)}</div>
        <div class="mut">${e.filtros.map(rotF).concat(e.assuntos.map(rotA)).map(e_).join(" · ")||"sem etiqueta"}</div>
        <button class="sec" data-acao="caixaVira" data-a1="${e_(e.id)}">Vira card</button></li>`).join(""):`<li class="mut">Nenhum e-mail neste filtro.</li>`}</ul>
      <button class="sec" data-acao="fecharFolha">Fechar</button>`;
  };
  C.abrir=function(){ C.estado={filtro:"todos",assunto:"todos"}; mostrarFolha(C.html()); };
  C.refazer=function(){ mostrarFolha(C.html()); };
  C.vira=function(id){ const e=(C.emails||EXEMPLOS).find(x=>x.id===id); if(e)abrirNova(C.tituloCard(e)); };
  window.CAIXA=C;
})();
