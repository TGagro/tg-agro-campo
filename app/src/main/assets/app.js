const SUPABASE_URL='https://olekhksinesqosfmtdjf.supabase.co';
const SUPABASE_KEY='sb_publishable_b_SgzfAoxE2Cs3KahdwLJw_hobIA1wd';
const state={session:null,produtores:[],propriedades:[],talhoes:[],safras:[],adubacoes:[],aplicacoes:[],colheitas:[]};
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const uid=()=>state.session?.user?.id;
function headers(auth=true){const h={'apikey':SUPABASE_KEY,'Content-Type':'application/json','Prefer':'return=representation'};if(auth&&state.session?.access_token)h.Authorization='Bearer '+state.session.access_token;return h}
async function api(path,opts={}){const res=await fetch(SUPABASE_URL+path,{...opts,headers:{...headers(opts.auth!==false),...(opts.headers||{})}});if(!res.ok){let t=await res.text();throw new Error(t||`HTTP ${res.status}`)}if(res.status===204)return null;const text=await res.text();return text?JSON.parse(text):null}
function saveSession(s){state.session=s;localStorage.setItem('tg_session',JSON.stringify(s||null))}
async function refreshSession(){const s=JSON.parse(localStorage.getItem('tg_session')||'null');if(!s?.refresh_token)return false;try{const n=await api('/auth/v1/token?grant_type=refresh_token',{method:'POST',auth:false,body:JSON.stringify({refresh_token:s.refresh_token})});saveSession(n);state.session=n;return true}catch{return false}}
async function login(email,password){return api('/auth/v1/token?grant_type=password',{method:'POST',auth:false,body:JSON.stringify({email,password})})}
function esc(v=''){return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]))}
function dateBR(d){if(!d)return '—';return new Date(d+'T12:00:00').toLocaleDateString('pt-BR')}
function ageDays(d){if(!d)return null;return Math.max(0,Math.floor((Date.now()-new Date(d+'T12:00:00'))/86400000))}
function toast(msg){const t=$('#toast');t.textContent=msg;t.classList.remove('hidden');setTimeout(()=>t.classList.add('hidden'),2600)}
function cacheData(){localStorage.setItem('tg_cache',JSON.stringify({produtores:state.produtores,propriedades:state.propriedades,talhoes:state.talhoes,safras:state.safras,adubacoes:state.adubacoes,aplicacoes:state.aplicacoes,colheitas:state.colheitas}))}
function loadCache(){try{Object.assign(state,JSON.parse(localStorage.getItem('tg_cache')||'{}'))}catch{}}
async function loadTable(t){const rows=await api(`/rest/v1/${t}?select=*&order=created_at.desc`);state[t]=rows||[]}
async function loadAll(){if(!navigator.onLine){loadCache();renderAll();return}try{await Promise.all(['produtores','propriedades','talhoes','safras','adubacoes','aplicacoes','colheitas'].map(loadTable));cacheData();renderAll()}catch(e){console.error(e);loadCache();renderAll();toast('Usando dados salvos no aparelho')}}
function nameBy(arr,id,key='nome'){return arr.find(x=>x.id===id)?.[key]||'—'}
function propOfTalhao(tid){const t=state.talhoes.find(x=>x.id===tid);return t?state.propriedades.find(p=>p.id===t.propriedade_id):null}
function talhaoOfSafra(s){return state.talhoes.find(t=>t.id===s.talhao_id)}
function prodTotal(sid){return state.colheitas.filter(c=>c.safra_id===sid).reduce((a,c)=>a+Number(c.peso_kg||0),0)}
function produtividade(s){const t=talhaoOfSafra(s),kg=prodTotal(s.id),ha=Number(t?.area_ha||0);return ha?kg/ha/1000:0}
function renderAll(){
 $('#sProd').textContent=state.produtores.length;$('#sProp').textContent=state.propriedades.length;$('#sTal').textContent=state.talhoes.length;$('#sSaf').textContent=state.safras.filter(s=>s.status!=='encerrada').length;
 renderProdutores();renderPropriedades();renderTalhoes();renderSafras();renderDash();
}
function renderDash(){const el=$('#dashSafras');const rows=state.safras.slice(0,4);el.innerHTML=rows.length?rows.map(s=>safraCard(s,true)).join(''):'<div class="empty">Cadastre sua primeira lavoura para começar.</div>'}
function renderProdutores(){const el=$('#produtoresList');el.innerHTML=state.produtores.length?state.produtores.map(p=>`<div class="card card-click" data-edit-produtor="${p.id}"><div class="card-row"><div><h4>${esc(p.nome)}</h4><div class="meta">${esc(p.municipio||'Município não informado')} • ${esc(p.estado||'')}</div><div class="meta">${esc(p.telefone||'Sem telefone')}</div><div class="meta">CPF/CNPJ: ${esc(p.cpf_cnpj||'Não informado')}</div></div><span class="pill">${state.propriedades.filter(x=>x.produtor_id===p.id).length} prop.</span></div><div class="edit-hint">Toque para abrir e editar</div></div>`).join(''):'<div class="empty">Nenhum produtor cadastrado.</div>'}
function renderPropriedades(){const el=$('#propriedadesList');el.innerHTML=state.propriedades.length?state.propriedades.map(p=>`<div class="card card-click" data-edit-propriedade="${p.id}"><div class="card-row"><div><h4>${esc(p.nome)}</h4><div class="meta">Produtor: ${esc(nameBy(state.produtores,p.produtor_id))}</div><div class="meta">${esc(p.municipio||'')} • ${Number(p.area_total_ha||0).toLocaleString('pt-BR')} ha</div><div class="meta">Protocolo: ${esc(p.protocolo||'automático')}</div></div><span class="pill gold">${state.talhoes.filter(t=>t.propriedade_id===p.id).length} talhões</span></div><div class="edit-hint">Toque para abrir e editar</div></div>`).join(''):'<div class="empty">Nenhuma propriedade cadastrada.</div>'}
function renderTalhoes(){const el=$('#talhoesList');el.innerHTML=state.talhoes.length?state.talhoes.map(t=>`<div class="card card-click" data-edit-talhao="${t.id}"><div class="card-row"><div><h4>${esc(t.nome)}</h4><div class="meta">${esc(nameBy(state.propriedades,t.propriedade_id))}</div><div class="meta">Área: ${Number(t.area_ha||0).toLocaleString('pt-BR')} ha</div></div><span class="pill">${state.safras.filter(s=>s.talhao_id===t.id).length} safra(s)</span></div><div class="edit-hint">Toque para abrir e editar</div></div>`).join(''):'<div class="empty">Nenhum talhão cadastrado.</div>'}
function safraCard(s,compact=false){const t=talhaoOfSafra(s),p=t?state.propriedades.find(x=>x.id===t.propriedade_id):null,age=ageDays(s.data_plantio),kg=prodTotal(s.id),prod=produtividade(s);return `<div class="card"><div class="card-row card-click" data-edit-safra="${s.id}"><div><h4>${esc(s.cultura)} ${s.variedade?`• ${esc(s.variedade)}`:''}</h4><div class="meta">${esc(p?.nome||'')} • ${esc(t?.nome||'')}</div><div class="kpi-line"><span class="pill">${age===null?'idade —':age+' dias'}</span><span class="pill gold">${kg.toLocaleString('pt-BR')} kg</span><span class="pill">${prod.toFixed(2).replace('.',',')} t/ha</span></div><div class="edit-hint">Toque para abrir e editar</div></div><span class="pill ${s.status==='encerrada'?'red':''}">${esc(s.status||'ativa')}</span></div>${compact?'':`<div class="actions"><button class="mini-btn" data-action="adubacao" data-sid="${s.id}">+ Adubação</button><button class="mini-btn" data-action="aplicacao" data-sid="${s.id}">+ Aplicação</button><button class="mini-btn" data-action="colheita" data-sid="${s.id}">+ Colheita</button></div>`}</div>`}
function renderSafras(){const el=$('#safrasList');el.innerHTML=state.safras.length?state.safras.map(s=>safraCard(s)).join(''):'<div class="empty">Nenhuma lavoura cadastrada.</div>'}
function opts(arr,value='id',label='nome'){return arr.map(x=>`<option value="${x[value]}">${esc(x[label])}</option>`).join('')}
function optsSelected(arr,selected,value='id',label='nome'){return arr.map(x=>`<option value="${x[value]}" ${String(x[value])===String(selected)?'selected':''}>${esc(x[label])}</option>`).join('')}
function modal(title,body,onSubmit){const w=$('#modalWrap');w.className='modal-backdrop';w.innerHTML=`<div class="modal"><div class="modal-head"><h3>${title}</h3><button class="close" id="closeModal">×</button></div><form id="modalForm">${body}<button class="btn btn-primary btn-block" type="submit">SALVAR</button></form></div>`;$('#closeModal').onclick=closeModal;$('#modalForm').onsubmit=onSubmit}
function closeModal(){$('#modalWrap').className='hidden';$('#modalWrap').innerHTML=''}
async function updateRow(table,id,row){
 row.user_id=uid();
 return await api(`/rest/v1/${table}?id=eq.${encodeURIComponent(id)}`,{
   method:'PATCH',
   body:JSON.stringify(row)
 });
}
async function deleteRow(table,id){
 return await api(`/rest/v1/${table}?id=eq.${encodeURIComponent(id)}`,{
   method:'DELETE'
 });
}
function viewProdutor(id){
  const p=state.produtores.find(x=>String(x.id)===String(id));
  if(!p)return;

  const props=state.propriedades.filter(
    x=>String(x.produtor_id)===String(id)
  );

  const talhoes=state.talhoes.filter(
    t=>props.some(pr=>String(pr.id)===String(t.propriedade_id))
  );

  const safras=state.safras.filter(
    s=>talhoes.some(t=>String(t.id)===String(s.talhao_id))
  );
const hoje=new Date().toISOString().slice(0,10);

const safraIds=new Set(
  safras.map(s=>String(s.id))
);

const adubacoesProd=state.adubacoes
  .filter(a=>safraIds.has(String(a.safra_id)))
  .sort((a,b)=>
    (b.data_aplicacao||'')
      .localeCompare(a.data_aplicacao||'')
  );

const aplicacoesProd=state.aplicacoes
  .filter(a=>safraIds.has(String(a.safra_id)))
  .sort((a,b)=>
    (b.data_aplicacao||'')
      .localeCompare(a.data_aplicacao||'')
  );

function itensAdubFicha(a){
  try{
    const j=JSON.parse(a.produto||'');

    if(Array.isArray(j)){
      return j.map(x=>({
        produto:x.produto||'',
        dose:x.dose??'',
        unidade:x.unidade||x.unidade_dose||''
      })).filter(x=>x.produto);
    }
  }catch(_){}

  return a.produto?[{
    produto:a.produto,
    dose:a.dose??'',
    unidade:a.unidade_dose||''
  }]:[];
}

function itensAplicFicha(a){
  try{
    const j=JSON.parse(a.produto_comercial||'');

    if(Array.isArray(j)){
      return j.map(x=>({
        categoria:x.categoria||'Produto',
        produto:x.produto||'',
        dose:x.dose??'',
        unidade:x.unidade||x.unidade_dose||''
      })).filter(x=>x.produto);
    }
  }catch(_){}

  return a.produto_comercial?[{
    categoria:a.finalidade||'Aplicação',
    produto:a.produto_comercial,
    dose:a.dose??'',
    unidade:a.unidade_dose||''
  }]:[];
}

function statusManejo(a){
  return a.status||
    ((a.data_aplicacao||'')>hoje
      ?'programada'
      :'realizada');
}

const proximasAdubacoes=adubacoesProd.filter(
  a=>statusManejo(a)==='programada'
);

const proximasAplicacoes=aplicacoesProd.filter(
  a=>statusManejo(a)==='programada'
);

const adubacoesRealizadas=adubacoesProd.filter(
  a=>statusManejo(a)==='realizada'
);

const aplicacoesRealizadas=aplicacoesProd.filter(
  a=>statusManejo(a)==='realizada'
);

  const w=$('#modalWrap');
  w.className='modal-backdrop';

  w.innerHTML=`
  <div class="modal">

    <div class="modal-head">
      <h3>Ficha do produtor</h3>
      <button class="close" id="closeModal">×</button>
    </div>

    <div class="card">
      <h4>${esc(p.nome||'Produtor')}</h4>

      <div class="meta">
        ${esc(p.municipio||'')}
        ${p.estado?' • '+esc(p.estado):''}
      </div>

      <div class="meta">${esc(p.telefone||'Sem telefone')}</div>

      <div class="meta">
        CPF/CNPJ: ${esc(p.cpf_cnpj||'Não informado')}
      </div>

      ${p.observacoes
        ?`<div class="meta" style="margin-top:8px">
            ${esc(p.observacoes)}
          </div>`
        :''
      }
    </div>

    <div class="card">
      <h4>Resumo</h4>
      <div class="meta">Propriedades: ${props.length}</div>
      <div class="meta">Talhões: ${talhoes.length}</div>
      <div class="meta">Lavouras: ${safras.length}</div>
    </div>

    <h3>Propriedades e lavouras</h3>

    ${
      props.length
      ?props.map(pr=>{

        const ts=talhoes.filter(
          t=>String(t.propriedade_id)===String(pr.id)
        );

        const ss=safras.filter(
          s=>ts.some(t=>String(t.id)===String(s.talhao_id))
        );

        return `
        <div class="card">

          <h4>${esc(pr.nome||'Propriedade')}</h4>

          <div class="meta">
            ${esc(pr.municipio||'')}
            ${pr.area_total_ha
              ?' • '+Number(pr.area_total_ha).toLocaleString('pt-BR')+' ha'
              :''
            }
          </div>

          ${
            ss.length
            ?ss.map(s=>`
              <div class="meta" style="margin-top:6px">
                • ${esc(s.cultura||'Lavoura')}
                ${s.variedade?' — '+esc(s.variedade):''}
              </div>
            `).join('')
            :'<div class="meta">Nenhuma lavoura cadastrada.</div>'
          }

        </div>
        `;
      }).join('')
      :'<div class="empty">Nenhuma propriedade cadastrada.</div>'
    }
    <h3>Protocolo de Adubação</h3>

    ${
      adubacoesProd.length
      ?adubacoesProd.map(a=>{
        const itens=itensAdubFicha(a);
        const sf=safras.find(
          s=>String(s.id)===String(a.safra_id)
        );

        return `
          <div class="card">
            <div class="card-row">
              <div>
                <h4>
                  ${esc(
                    a.tipo_adubacao||
                    a.tipo||
                    a.finalidade||
                    'Adubação'
                  )}
                </h4>

                ${
                  sf
                  ?`<div class="meta">
                      ${esc(sf.cultura||'Lavoura')}
                      ${sf.variedade?' — '+esc(sf.variedade):''}
                    </div>`
                  :''
                }

                ${itens.map(i=>`
                  <div class="meta">
                    • ${esc(i.produto)}
                    — ${esc(i.dose||'-')} ${esc(i.unidade||'')}
                  </div>
                `).join('')}

                <div class="meta">
                  Data: ${dateBR(a.data_aplicacao)}
                </div>
              </div>

              <span class="pill ${(a.data_aplicacao||'')>hoje?'gold':''}">
                ${(a.data_aplicacao||'')>hoje?'Programada':'Realizada'}
              </span>
            </div>
          </div>
        `;
      }).join('')
      :'<div class="empty">Nenhuma adubação cadastrada.</div>'
    }


    <h3>Protocolo de Borrifação / Coquetéis</h3>

    ${
      aplicacoesProd.length
      ?aplicacoesProd.map(a=>{
        const itens=itensAplicFicha(a);

        const sf=safras.find(
          s=>String(s.id)===String(a.safra_id)
        );

        return `
          <div class="card">
            <div class="card-row">
              <div>
                <h4>
                  ${itens.length>1
                    ?'Coquetel'
                    :esc(a.finalidade||'Aplicação')}
                </h4>

                ${
                  sf
                  ?`<div class="meta">
                      ${esc(sf.cultura||'Lavoura')}
                      ${sf.variedade?' — '+esc(sf.variedade):''}
                    </div>`
                  :''
                }

                ${itens.map(i=>`
                  <div class="meta">
                    • <strong>${esc(i.categoria)}:</strong>
                    ${esc(i.produto)}
                    — ${esc(i.dose||'-')} ${esc(i.unidade||'')}
                  </div>
                `).join('')}

                ${
                  a.alvo
                  ?`<div class="meta">
                      Alvo: ${esc(a.alvo)}
                    </div>`
                  :''
                }

                <div class="meta">
                  Data: ${dateBR(a.data_aplicacao)}
                </div>
              </div>

              <span class="pill ${(a.data_aplicacao||'')>hoje?'gold':''}">
                ${(a.data_aplicacao||'')>hoje?'Programada':'Realizada'}
              </span>
            </div>
          </div>
        `;
      }).join('')
      :'<div class="empty">Nenhuma borrifação cadastrada.</div>'
    }


    <h3>Próximos manejos</h3>

    ${
      proximasAdubacoes.length || proximasAplicacoes.length
      ?`
        ${proximasAdubacoes.map(a=>`
          <div class="card">
            <h4>🌱 Adubação programada</h4>
            <div class="meta">
              ${esc(
                a.tipo_adubacao||
                a.tipo||
                a.finalidade||
                'Adubação'
              )}
            </div>
            <div class="meta">
              Data: ${dateBR(a.data_aplicacao)}
            </div>
            <button
  type="button"
  class="btn btn-primary btn-block concluir-ficha-adub"
  data-id="${esc(a.id)}"
  style="margin-top:10px;">
  ✓ Atividade cumprida
</button>
          </div>
        `).join('')}

        ${proximasAplicacoes.map(a=>`
          <div class="card">
            <h4>💧 Borrifação programada</h4>
            <div class="meta">
              ${itensAplicFicha(a).length>1
                ?'Coquetel'
                :esc(a.finalidade||'Aplicação')}
            </div>
            <div class="meta">
              Data: ${dateBR(a.data_aplicacao)}
            </div>
            <button
  type="button"
  class="btn btn-primary btn-block concluir-ficha-aplic"
  data-id="${esc(a.id)}"
  style="margin-top:10px;">
  ✓ Atividade cumprida
</button>
          </div>
        `).join('')}
      `
      :'<div class="empty">Nenhum manejo programado.</div>'
    }


    <h3>Histórico realizado</h3>

    <div class="card">
      <div class="meta">
        Adubações realizadas: <strong>${adubacoesRealizadas.length}</strong>
      </div>

      <div class="meta">
        Borrifações realizadas: <strong>${aplicacoesRealizadas.length}</strong>
      </div>
    </div>
    <button
      class="btn btn-primary btn-block"
      type="button"
      id="editarDadosProdutor">
      EDITAR DADOS
    </button>

  </div>`;

  $('#closeModal').onclick=closeModal;

  $('#editarDadosProdutor').onclick=()=>{
    closeModal();
    editProdutor(id);
  }; 
 document.querySelectorAll('.concluir-ficha-adub').forEach(btn=>{
  btn.onclick=async()=>{
    const adubId=btn.dataset.id;

    if(!confirm('Marcar esta atividade como cumprida?'))return;

    try{
      await updateRow('adubacoes',adubId,{
        status:'realizada',
        data_realizacao:hoje
      });

      await loadAll();
      viewProdutor(id);
      toast('✓ Atividade cumprida');
    }catch(err){
      console.error(err);
      toast('Erro ao concluir atividade');
    }
  };
});
 document.querySelectorAll('.concluir-ficha-aplic').forEach(btn=>{
  btn.onclick=async()=>{
    const aplicId=btn.dataset.id;

    if(!confirm('Marcar esta borrifação como cumprida?'))return;

    try{
      await updateRow('aplicacoes',aplicId,{
        status:'realizada',
        data_realizacao:hoje
      });

      await loadAll();
      viewProdutor(id);
      toast('✓ Atividade cumprida');
    }catch(err){
      console.error(err);
      toast('Erro ao concluir borrifação');
    }
  };
});
}
function editProdutor(id){
 const p=state.produtores.find(x=>x.id===id);
 if(!p)return;
 modal('Editar produtor',`
 <div class="field"><label>Nome</label><input name="nome" required value="${esc(p.nome||'')}"></div>
 <div class="row2">
   <div class="field"><label>Telefone</label><input name="telefone" value="${esc(p.telefone||'')}"></div>
   <div class="field"><label>CPF/CNPJ</label><input name="cpf_cnpj" value="${esc(p.cpf_cnpj||'')}"></div>
 </div>
 <div class="row2">
   <div class="field"><label>Município</label><input name="municipio" value="${esc(p.municipio||'')}"></div>
   <div class="field"><label>Estado</label><input name="estado" value="${esc(p.estado||'AM')}"></div>
 </div>
 <div class="field"><label>Observações</label><textarea name="observacoes">${esc(p.observacoes||'')}</textarea></div>
 <button class="btn btn-danger btn-block" type="button" id="deleteProdutor">EXCLUIR PRODUTOR</button>
 `,async e=>{
   e.preventDefault();
   const btn=e.submitter;
   if(btn)btn.disabled=true;
   try{
     await updateRow('produtores',id,formObj(e.currentTarget));
     closeModal();
     await loadAll();
     toast('Produtor atualizado');
   }catch(err){
     console.error(err);
     toast('Erro ao atualizar produtor');
   }finally{
     if(btn)btn.disabled=false;
   }
 });
 setTimeout(()=>{
   const del=$('#deleteProdutor');
   if(del)del.onclick=async()=>{
     const props=state.propriedades.filter(x=>x.produtor_id===id).length;
     if(props){
       toast('Exclua primeiro as propriedades deste produtor');
       return;
     }
     if(!confirm('Excluir este produtor?'))return;
     try{
       await deleteRow('produtores',id);
       closeModal();
       await loadAll();
       toast('Produtor excluído');
     }catch(err){
       console.error(err);
       toast('Não foi possível excluir');
     }
   };
 },0);
}


function editPropriedade(id){
 const p=state.propriedades.find(x=>x.id===id);if(!p)return;
 modal('Editar propriedade',`
 <div class="field"><label>Produtor</label><select name="produtor_id" required><option value="">Selecione</option>${optsSelected(state.produtores,p.produtor_id)}</select></div>
 <div class="field"><label>Nome da propriedade</label><input name="nome" required value="${esc(p.nome||'')}"></div>
 <div class="row2"><div class="field"><label>Município</label><input name="municipio" value="${esc(p.municipio||'')}"></div><div class="field"><label>Área total (ha)</label><input name="area_total_ha" type="number" step="0.01" value="${p.area_total_ha??''}"></div></div>
 <div class="field"><label>Comunidade</label><input name="comunidade" value="${esc(p.comunidade||'')}"></div>
 <button class="btn btn-danger btn-block" type="button" id="deletePropriedade">EXCLUIR PROPRIEDADE</button>
 `,async e=>{e.preventDefault();const btn=e.submitter;if(btn)btn.disabled=true;try{await updateRow('propriedades',id,formObj(e.currentTarget));closeModal();await loadAll();toast('Propriedade atualizada')}catch(err){console.error(err);toast('Erro ao atualizar propriedade')}finally{if(btn)btn.disabled=false}});
 setTimeout(()=>{const del=$('#deletePropriedade');if(del)del.onclick=async()=>{if(state.talhoes.some(t=>t.propriedade_id===id)){toast('Exclua primeiro os talhões desta propriedade');return}if(!confirm('Excluir esta propriedade?'))return;try{await deleteRow('propriedades',id);closeModal();await loadAll();toast('Propriedade excluída')}catch(err){console.error(err);toast('Não foi possível excluir')}}},0);
}

function editTalhao(id){
 const t=state.talhoes.find(x=>x.id===id);if(!t)return;
 modal('Editar talhão',`
 <div class="field"><label>Propriedade</label><select name="propriedade_id" required><option value="">Selecione</option>${optsSelected(state.propriedades,t.propriedade_id)}</select></div>
 <div class="row2"><div class="field"><label>Nome</label><input name="nome" required value="${esc(t.nome||'')}"></div><div class="field"><label>Área (ha)</label><input name="area_ha" type="number" step="0.01" value="${t.area_ha??''}"></div></div>
 <div class="field"><label>Observações</label><textarea name="observacoes">${esc(t.observacoes||'')}</textarea></div>
 <button class="btn btn-danger btn-block" type="button" id="deleteTalhao">EXCLUIR TALHÃO</button>
 `,async e=>{e.preventDefault();const btn=e.submitter;if(btn)btn.disabled=true;try{await updateRow('talhoes',id,formObj(e.currentTarget));closeModal();await loadAll();toast('Talhão atualizado')}catch(err){console.error(err);toast('Erro ao atualizar talhão')}finally{if(btn)btn.disabled=false}});
 setTimeout(()=>{const del=$('#deleteTalhao');if(del)del.onclick=async()=>{if(state.safras.some(s=>s.talhao_id===id)){toast('Exclua primeiro as lavouras deste talhão');return}if(!confirm('Excluir este talhão?'))return;try{await deleteRow('talhoes',id);closeModal();await loadAll();toast('Talhão excluído')}catch(err){console.error(err);toast('Não foi possível excluir')}}},0);
}

function editSafra(id){
 const s=state.safras.find(x=>x.id===id);if(!s)return;
 modal('Editar lavoura',`
 <div class="field"><label>Talhão</label><select name="talhao_id" required><option value="">Selecione</option>${state.talhoes.map(t=>`<option value="${t.id}" ${String(t.id)===String(s.talhao_id)?'selected':''}>${esc(nameBy(state.propriedades,t.propriedade_id))} • ${esc(t.nome)}</option>`).join('')}</select></div>
 <div class="row2"><div class="field"><label>Cultura</label><input name="cultura" required value="${esc(s.cultura||'')}"></div><div class="field"><label>Variedade</label><input name="variedade" value="${esc(s.variedade||'')}"></div></div>
 <div class="row2"><div class="field"><label>Data de plantio</label><input name="data_plantio" type="date" value="${esc(s.data_plantio||'')}"></div><div class="field"><label>Nº de plantas</label><input name="numero_plantas" type="number" value="${s.numero_plantas??''}"></div></div>
 <div class="row2"><div class="field"><label>Espaçamento linhas (m)</label><input name="espacamento_linhas_m" type="number" step="0.01" value="${s.espacamento_linhas_m??''}"></div><div class="field"><label>Espaçamento plantas (m)</label><input name="espacamento_plantas_m" type="number" step="0.01" value="${s.espacamento_plantas_m??''}"></div></div>
 <div class="field"><label>Status</label><select name="status"><option value="ativa" ${s.status!=='encerrada'?'selected':''}>Ativa</option><option value="encerrada" ${s.status==='encerrada'?'selected':''}>Encerrada</option></select></div>
 <button class="btn btn-danger btn-block" type="button" id="deleteSafra">EXCLUIR LAVOURA</button>
 `,async e=>{e.preventDefault();const btn=e.submitter;if(btn)btn.disabled=true;try{await updateRow('safras',id,formObj(e.currentTarget));closeModal();await loadAll();toast('Lavoura atualizada')}catch(err){console.error(err);toast('Erro ao atualizar lavoura')}finally{if(btn)btn.disabled=false}});
 setTimeout(()=>{const del=$('#deleteSafra');if(del)del.onclick=async()=>{const temReg=state.adubacoes.some(x=>x.safra_id===id)||state.aplicacoes.some(x=>x.safra_id===id)||state.colheitas.some(x=>x.safra_id===id);if(temReg){toast('Esta lavoura possui registros. Exclua-os primeiro.');return}if(!confirm('Excluir esta lavoura?'))return;try{await deleteRow('safras',id);closeModal();await loadAll();toast('Lavoura excluída')}catch(err){console.error(err);toast('Não foi possível excluir')}}},0);
}

async function insertRow(table,row){row.user_id=uid();if(!navigator.onLine){queueOp(table,row);toast('Salvo offline. Sincroniza quando houver internet.');return [row]}try{return await api(`/rest/v1/${table}`,{method:'POST',body:JSON.stringify(row)})}catch(e){if(e.message.includes('Failed to fetch')){queueOp(table,row);toast('Salvo offline. Sincroniza depois.');return [row]}throw e}}
function queueOp(table,row){const q=JSON.parse(localStorage.getItem('tg_queue')||'[]');q.push({table,row});localStorage.setItem('tg_queue',JSON.stringify(q))}
async function syncQueue(){if(!navigator.onLine||!state.session)return;let q=JSON.parse(localStorage.getItem('tg_queue')||'[]');if(!q.length)return;const left=[];for(const op of q){try{await api(`/rest/v1/${op.table}`,{method:'POST',body:JSON.stringify(op.row)})}catch{left.push(op)}}localStorage.setItem('tg_queue',JSON.stringify(left));if(!left.length){toast('Registros offline sincronizados');await loadAll()}}

function openAdubacao(sid){
  const hoje=new Date().toISOString().slice(0,10);

  function itensAdub(a){
    try{
      const j=JSON.parse(a.produto||'');
      if(Array.isArray(j)){
        return j.map(x=>({
          produto:x.produto||'',
          dose:x.dose??'',
          unidade:x.unidade||x.unidade_dose||''
        })).filter(x=>x.produto);
      }
    }catch(_){}

    return a.produto?[{
      produto:a.produto,
      dose:a.dose??'',
      unidade:a.unidade_dose||''
    }]:[];
  }

  const registros=state.adubacoes
    .filter(a=>a.safra_id===sid)
    .sort((a,b)=>(b.data_aplicacao||'').localeCompare(a.data_aplicacao||''));

  const produtos=[...new Set(
    state.adubacoes
      .flatMap(a=>itensAdub(a).map(i=>i.produto))
      .filter(Boolean)
  )].sort();

  const historico=registros.length
    ?registros.map(a=>{
      const programada=
  (a.status||
    ((a.data_aplicacao||'')>hoje?'programada':'realizada')
  )!=='realizada';
      const itens=itensAdub(a);

      return `
        <div class="card">
          <div class="card-row">
            <div>
              <h4>${esc(a.tipo||'Adubação')}</h4>

              ${itens.map(i=>`
                <div class="meta">
                  • ${esc(i.produto)} — ${esc(i.dose||'-')} ${esc(i.unidade||'')}
                </div>
              `).join('')}

              <div class="meta">
                Data: ${dateBR(a.data_aplicacao)}
              </div>

              ${a.observacoes
                ?`<div class="meta">${esc(a.observacoes)}</div>`
                :''
              }
            </div>
<div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap">

  ${programada?`
    <button
      type="button"
      class="btn concluir-adub"
      data-id="${esc(a.id)}">
      ✓ Marcar como realizado
    </button>
  `:''}

  <button
    type="button"
    class="btn edit-adub"
    data-id="${esc(a.id)}">
    Editar
  </button>

  <button
    type="button"
    class="btn btn-danger delete-adub"
    data-id="${esc(a.id)}">
    Excluir
  </button>

</div>
</div>
</div>
      `;
    }).join('')
    :'<div class="empty">Nenhuma adubação registrada</div>';

  const linhaProduto=()=>`
    <div class="adub-prod-row"
         style="border:1px solid #ddd;border-radius:10px;padding:10px;margin-bottom:10px">

      <div class="field">
        <label>Produto / ingrediente</label>
        <input
          class="adub-produto"
          list="produtosAdubacao"
          placeholder="Ex.: MAP, KCl, esterco"
          required>
      </div>

      <div class="row2">
        <div class="field">
          <label>Dose</label>
          <input
            class="adub-dose"
            type="number"
            step="any"
            min="0"
            required>
        </div>

        <div class="field">
          <label>Unidade</label>
          <input
            class="adub-unidade"
            placeholder="Ex.: g/planta, kg/ha"
            required>
        </div>
      </div>

      <button
        type="button"
        class="btn remove-adub-prod">
        Remover produto
      </button>
    </div>
  `;

  modal('Adubação da lavoura',`

    <input
      type="hidden"
      name="safra_id"
      value="${esc(sid)}">

    <div class="row2">

      <div class="field">
        <label>Data da aplicação</label>
        <input
          name="data_aplicacao"
          type="date"
          value="${hoje}"
          required>
      </div>

      <div class="field">
        <label>Tipo</label>

        <select name="tipo" required>
          <option>Plantio</option>
          <option>Cobertura</option>
          <option>Foliar</option>
          <option>Fertirrigação</option>
        </select>

      </div>
    </div>

    <div class="field">

      <label>Produtos / ingredientes</label>

      <div id="adubProdutos">
        ${linhaProduto()}
      </div>

      <button
        type="button"
        id="addAdubProduto"
        class="btn">
        + Adicionar produto
      </button>

    </div>

    <datalist id="produtosAdubacao">
      ${produtos.map(p=>`
        <option value="${esc(p)}"></option>
      `).join('')}
    </datalist>

    <div class="field">
      <label>Observações</label>

      <textarea
        name="observacoes"
        placeholder="Forma de aplicação, detalhes, etc.">
      </textarea>
    </div>

    <h3>Histórico e programação</h3>

    ${historico}

  `,async e=>{

    e.preventDefault();

    const form=e.currentTarget;

    const itens=[
      ...form.querySelectorAll('.adub-prod-row')
    ].map(r=>({

      produto:
        r.querySelector('.adub-produto')
        .value.trim(),

      dose:
        r.querySelector('.adub-dose')
        .value.trim(),

      unidade:
        r.querySelector('.adub-unidade')
        .value.trim()

    })).filter(i=>i.produto);

    if(!itens.length){
      toast('Adicione pelo menos um produto');
      return;
    }

    const fd=new FormData(form);

    const row={

      safra_id:sid,

      data_aplicacao:
        fd.get('data_aplicacao'),
status:
  fd.get('data_aplicacao')>hoje
    ?'programada'
    :'realizada',

data_realizacao:
  fd.get('data_aplicacao')>hoje
    ?null
    :fd.get('data_aplicacao'),
      tipo:
        fd.get('tipo'),

      produto:
        JSON.stringify(itens),

      dose:
        Number(itens[0].dose),

      unidade_dose:
        itens[0].unidade,

      observacoes:
        fd.get('observacoes')||null
    };

    const btn=
      form.querySelector(
        'button[type="submit"]'
      );

    if(btn)btn.disabled=true;

    try{

      const editId=form.dataset.editId;

if(editId){
  await updateRow('adubacoes',editId,row);
}else{
  await insertRow('adubacoes',row);
}

      closeModal();

      await loadAll();

      toast(editId ? 'Adubação atualizada' : 'Adubação salva');

    }catch(err){

      console.error(err);

      toast(
        'Erro ao salvar adubação'
      );

    }finally{

      if(btn)btn.disabled=false;

    }
  });

  setTimeout(()=>{

    const wrap=
      $('#adubProdutos');

    const add=
      $('#addAdubProduto');

    if(add&&wrap){

      add.onclick=()=>{

        wrap.insertAdjacentHTML(
          'beforeend',
          linhaProduto()
        );

      };
    }

    if(wrap){

      wrap.onclick=e=>{

        const b=
          e.target.closest(
            '.remove-adub-prod'
          );

        if(!b)return;

        const rows=
          wrap.querySelectorAll(
            '.adub-prod-row'
          );

        if(rows.length>1){

          b.closest(
            '.adub-prod-row'
          ).remove();

        }else{

          b.closest(
            '.adub-prod-row'
          )
          .querySelectorAll('input')
          .forEach(i=>i.value='');

        }
      };
    }
  document.querySelectorAll('.concluir-adub').forEach(btn=>{
  btn.onclick=async()=>{
    const id=btn.dataset.id;

    if(!confirm('Marcar esta adubação como realizada?'))return;

    try{
      await updateRow('adubacoes',id,{
        status:'realizada',
        data_realizacao:hoje
      });

      closeModal();
      await loadAll();

      toast('Adubação marcada como realizada');

    }catch(err){
      console.error(err);
      toast('Erro ao concluir adubação');
    }
  };
});
   document.querySelectorAll('.delete-adub').forEach(btn=>{
    btn.onclick=async()=>{
      const id=btn.dataset.id;

      if(!confirm('Excluir esta adubação?'))return;

      try{
        await deleteRow('adubacoes',id);
        closeModal();
        await loadAll();
        toast('Adubação excluída');
      }catch(err){
        console.error(err);
        toast('Erro ao excluir adubação');
      }
    };
  });

  document.querySelectorAll('.edit-adub').forEach(btn=>{
    btn.onclick=()=>{
      const a=state.adubacoes.find(
        x=>String(x.id)===String(btn.dataset.id)
      );

      if(!a)return;

      const form=btn.closest('form');
      if(!form)return;

      form.dataset.editId=a.id;

      form.querySelector('[name="data_aplicacao"]').value=
        a.data_aplicacao||'';

      form.querySelector('[name="tipo"]').value=
        a.tipo||'Plantio';

      form.querySelector('[name="observacoes"]').value=
        a.observacoes||'';

      const itens=itensAdub(a);

      wrap.innerHTML=
        itens.length
          ?itens.map(()=>linhaProduto()).join('')
          :linhaProduto();

      [...wrap.querySelectorAll('.adub-prod-row')]
        .forEach((r,i)=>{
          const item=itens[i]||{};

          r.querySelector('.adub-produto').value=
            item.produto||'';

          r.querySelector('.adub-dose').value=
            item.dose??'';

          r.querySelector('.adub-unidade').value=
            item.unidade||'';
        });

      const salvar=form.querySelector('button[type="submit"]');

      if(salvar){
        salvar.textContent='Salvar alterações';
      }

      form.querySelector('[name="data_aplicacao"]')
        .scrollIntoView({
          behavior:'smooth',
          block:'center'
        });
    };
  });
  },0);
}
function openAplicacao(sid){
  const hoje=new Date().toISOString().slice(0,10);

  function itensAplic(a){
    try{
      const j=JSON.parse(a.produto_comercial||'');
      if(Array.isArray(j)){
        return j.map(x=>({
          categoria:x.categoria||'',
          produto:x.produto||'',
          dose:x.dose??'',
          unidade:x.unidade||x.unidade_dose||''
        })).filter(x=>x.produto);
      }
    }catch(_){}

    return a.produto_comercial?[{
      categoria:a.finalidade||'Aplicação',
      produto:a.produto_comercial,
      dose:a.dose??'',
      unidade:a.unidade_dose||''
    }]:[];
  }

  const registros=state.aplicacoes
    .filter(a=>String(a.safra_id)===String(sid))
    .sort((a,b)=>(b.data_aplicacao||'')
      .localeCompare(a.data_aplicacao||''));

  const produtos=[...new Set(
    state.aplicacoes
      .flatMap(a=>itensAplic(a).map(i=>i.produto))
      .filter(Boolean)
  )].sort();

  const historico=registros.length
    ?registros.map(a=>{
      const programada=(a.data_aplicacao||'')>hoje;
      const itens=itensAplic(a);

      return `
        <div class="card">
          <div class="card-row">
            <div>

              <h4>
                ${itens.length>1
                  ?'Coquetel'
                  :esc(a.finalidade||'Aplicação')}
              </h4>

              ${itens.map(i=>`
                <div class="meta">
                  • <strong>${esc(i.categoria||'Produto')}:</strong>
                  ${esc(i.produto)}
                  — ${esc(i.dose||'-')} ${esc(i.unidade||'')}
                </div>
              `).join('')}

              ${a.alvo
                ?`<div class="meta">Alvo: ${esc(a.alvo)}</div>`
                :''
              }

              <div class="meta">
                Data: ${dateBR(a.data_aplicacao)}
              </div>

            </div>

            <span class="pill ${programada?'gold':''}">
              ${programada?'Programada':'Realizada'}
            </span>
          </div>

          <div style="display:flex;gap:8px;margin-top:10px">

            <button
              type="button"
              class="btn edit-aplic"
              data-id="${esc(a.id)}">
              Editar
            </button>

            <button
              type="button"
              class="btn btn-danger delete-aplic"
              data-id="${esc(a.id)}">
              Excluir
            </button>

          </div>
        </div>
      `;
    }).join('')
    :'<div class="empty">Nenhuma aplicação registrada nesta lavoura.</div>';

  const blocoProduto=categoria=>`
    <div
      class="aplic-prod-row"
      data-categoria="${categoria}"
      style="border:1px solid #ddd;border-radius:10px;padding:10px;margin-bottom:10px">

      <h4>${categoria}</h4>

      <div class="field">
        <label>Produto</label>

        <input
          class="aplic-produto"
          list="produtosAplicacao"
          placeholder="Nome do produto"
          required>
      </div>

      <div class="row2">

        <div class="field">
          <label>Dose</label>

          <input
            class="aplic-dose"
            type="number"
            step="any"
            min="0"
            required>
        </div>

        <div class="field">
          <label>Unidade</label>

          <input
            class="aplic-unidade"
            placeholder="Ex.: mL/20 L, mL/100 L, L/ha"
            required>
        </div>

      </div>
    </div>
  `;

  modal('Borrifação / Coquetel',`

    <input
      type="hidden"
      name="safra_id"
      value="${esc(sid)}">

    <div class="field">
      <label>Data da aplicação</label>

      <input
        name="data_aplicacao"
        type="date"
        value="${hoje}"
        required>
    </div>

    <h3>Produtos do coquetel</h3>

    ${blocoProduto('Fungicida')}

    ${blocoProduto('Acaricida')}

    ${blocoProduto('Inseticida')}

    <datalist id="produtosAplicacao">
      ${produtos.map(p=>`
        <option value="${esc(p)}"></option>
      `).join('')}
    </datalist>

    <div class="field">
      <label>Alvo / observação</label>

      <input
        name="alvo"
        placeholder="Ex.: antracnose, ácaro, lagartas">
    </div>

    <h3>Histórico e programação</h3>

    ${historico}

  `,async e=>{

    e.preventDefault();

    const form=e.currentTarget;

    const itens=[
      ...form.querySelectorAll('.aplic-prod-row')
    ].map(r=>({

      categoria:r.dataset.categoria,

      produto:
        r.querySelector('.aplic-produto')
        .value.trim(),

      dose:
        r.querySelector('.aplic-dose')
        .value.trim(),

      unidade:
        r.querySelector('.aplic-unidade')
        .value.trim()

    }));

    const fd=new FormData(form);

    const row={

      safra_id:sid,

      data_aplicacao:
        fd.get('data_aplicacao'),

      finalidade:'Coquetel',

      produto_comercial:
        JSON.stringify(itens),

      dose:
        Number(itens[0].dose),

      unidade_dose:
        itens[0].unidade,

      alvo:
        fd.get('alvo')||null
    };

    const btn=
      form.querySelector(
        'button[type="submit"]'
      );

    if(btn)btn.disabled=true;

    try{

      const editId=
        form.dataset.editId;

      if(editId){

        await updateRow(
          'aplicacoes',
          editId,
          row
        );

      }else{

        await insertRow(
          'aplicacoes',
          row
        );
      }

      closeModal();

      await loadAll();

      toast(
        editId
          ?'Coquetel atualizado'
          :'Coquetel salvo'
      );

    }catch(err){

      console.error(err);

      toast(
        'Erro ao salvar coquetel'
      );

    }finally{

      if(btn)btn.disabled=false;
    }
  });

  setTimeout(()=>{

    document
      .querySelectorAll('.delete-aplic')
      .forEach(btn=>{

        btn.onclick=async()=>{

          const id=btn.dataset.id;

          if(!confirm(
            'Excluir este coquetel/aplicação?'
          ))return;

          try{

            await deleteRow(
              'aplicacoes',
              id
            );

            closeModal();

            await loadAll();

            toast(
              'Aplicação excluída'
            );

          }catch(err){

            console.error(err);

            toast(
              'Erro ao excluir aplicação'
            );
          }
        };
      });

    document
      .querySelectorAll('.edit-aplic')
      .forEach(btn=>{

        btn.onclick=()=>{

          const a=
            state.aplicacoes.find(
              x=>String(x.id)===
                 String(btn.dataset.id)
            );

          if(!a)return;

          const form=
            btn.closest('form');

          if(!form)return;

          form.dataset.editId=a.id;

          form
            .querySelector(
              '[name="data_aplicacao"]'
            ).value=
              a.data_aplicacao||'';

          form
            .querySelector(
              '[name="alvo"]'
            ).value=
              a.alvo||'';

          const itens=
            itensAplic(a);

          [
            ...form.querySelectorAll(
              '.aplic-prod-row'
            )
          ].forEach(r=>{

            const categoria=
              r.dataset.categoria;

            const item=
              itens.find(i=>
                String(i.categoria)
                  .toLowerCase()===
                String(categoria)
                  .toLowerCase()
              )||{};

            r.querySelector(
              '.aplic-produto'
            ).value=
              item.produto||'';

            r.querySelector(
              '.aplic-dose'
            ).value=
              item.dose??'';

            r.querySelector(
              '.aplic-unidade'
            ).value=
              item.unidade||'';
          });

          const salvar=
            form.querySelector(
              'button[type="submit"]'
            );

          if(salvar){
            salvar.textContent=
              'Salvar alterações';
          }

          form
            .querySelector(
              '[name="data_aplicacao"]'
            )
            .scrollIntoView({
              behavior:'smooth',
              block:'center'
            });
        };
      });

  },0);
        }

function openColheita(sid){
  const hoje=new Date().toISOString().slice(0,10);
  const s=state.safras.find(x=>x.id===sid);
  const t=s?talhaoOfSafra(s):null;

  const registros=state.colheitas
    .filter(c=>c.safra_id===sid)
    .sort((a,b)=>(b.data_colheita||'').localeCompare(a.data_colheita||''));

  const totalKg=registros.reduce((n,c)=>n+Number(c.peso_kg||0),0);
  const plantas=Number(s?.numero_plantas||0);
  const area=Number(t?.area_ha||0);

  const historico=registros.length
    ?registros.map(c=>`
      <div class="card">
        <h4>${Number(c.peso_kg||0).toLocaleString('pt-BR')} kg</h4>
        <div class="meta">Data: ${dateBR(c.data_colheita)}</div>
        ${c.quantidade_frutos
          ?`<div class="meta">Frutos: ${Number(c.quantidade_frutos).toLocaleString('pt-BR')}</div>`
          :''
        }
        ${c.observacoes
          ?`<div class="meta">${esc(c.observacoes)}</div>`
          :''
        }
      </div>
    `).join('')
    :'<div class="empty">Nenhuma colheita registrada nesta lavoura.</div>';

 modal('Nova Colheita',`
    <input type="hidden" name="safra_id" value="${sid}">

    <div class="field">
      <label>Talhão</label>
      <input value="${esc(t?.nome||'—')}" disabled>
    </div>

    <div class="row2">
      <div class="field">
        <label>Data da colheita</label>
        <input name="data_colheita" type="date" value="${hoje}" required>
      </div>

      <div class="field">
        <label>Peso colhido (kg)</label>
        <input id="pesoColheita" name="peso_kg"
               type="number" step="0.001" required>
      </div>
    </div>

    <div class="field">
      <label>Quantidade de frutos (opcional)</label>
      <input id="frutosColheita" name="quantidade_frutos" type="number">
    </div>

    <div class="field">
      <label>Observações</label>
      <textarea name="observacoes"></textarea>
    </div>

    <div class="card">
      <h4>Produtividade calculada</h4>
      <div id="calcColheita" class="meta">
        Informe o peso da colheita.
      </div>
    </div>

    <h3>Resumo</h3>
    <div class="meta">Total já colhido: ${totalKg.toLocaleString('pt-BR')} kg</div>
    <div class="meta">Número de colheitas: ${registros.length}</div>

    <h3>Histórico de colheitas</h3>
    ${historico}
  `,submitSimple('colheitas'));

  setTimeout(()=>{
    const peso=$('#pesoColheita');
    const frutos=$('#frutosColheita');
    const calc=$('#calcColheita');

    function atualizar(){
      const kg=Number(peso?.value||0);
      const qtd=Number(frutos?.value||0);
      const porPlanta=plantas?kg/plantas:0;
      const tha=area?kg/area/1000:0;
      const pesoMedio=qtd?kg/qtd:0;

      calc.innerHTML=
        `${plantas?porPlanta.toFixed(3).replace('.',',')+' kg/planta<br>':''}`+
        `${area?tha.toFixed(2).replace('.',',')+' t/ha<br>':''}`+
        `${qtd?'Peso médio: '+pesoMedio.toFixed(3).replace('.',',')+' kg/fruto':''}`;
    }

    if(peso)peso.oninput=atualizar;
    if(frutos)frutos.oninput=atualizar;
  },0);
}
function openForm(type,sid){
 if(type==='produtor')return modal('Novo produtor',`<div class="field"><label>Nome</label><input name="nome" required></div><div class="row2"><div class="field"><label>Telefone</label><input name="telefone"></div><div class="field"><label>CPF/CNPJ</label><input name="cpf_cnpj"></div></div><div class="row2"><div class="field"><label>Município</label><input name="municipio"></div><div class="field"><label>Estado</label><input name="estado" value="AM"></div></div><div class="field"><label>Observações</label><textarea name="observacoes"></textarea></div>`,submitSimple('produtores'));
 if(type==='propriedade')return modal('Nova propriedade',`<div class="field"><label>Produtor</label><select name="produtor_id" required><option value="">Selecione</option>${opts(state.produtores)}</select></div><div class="field"><label>Nome da propriedade</label><input name="nome" required></div><div class="row2"><div class="field"><label>Município</label><input name="municipio"></div><div class="field"><label>Área total (ha)</label><input name="area_total_ha" type="number" step="0.01"></div></div><div class="field"><label>Comunidade</label><input name="comunidade"></div>`,submitSimple('propriedades'));
 if(type==='talhao')return modal('Novo talhão',`<div class="field"><label>Propriedade</label><select name="propriedade_id" required><option value="">Selecione</option>${opts(state.propriedades)}</select></div><div class="row2"><div class="field"><label>Nome</label><input name="nome" required placeholder="Talhão 01"></div><div class="field"><label>Área (ha)</label><input name="area_ha" type="number" step="0.01"></div></div><div class="field"><label>Observações</label><textarea name="observacoes"></textarea></div>`,submitSimple('talhoes'));
 if(type==='safra')return modal('Nova lavoura',`<div class="field"><label>Talhão</label><select name="talhao_id" required><option value="">Selecione</option>${state.talhoes.map(t=>`<option value="${t.id}">${esc(nameBy(state.propriedades,t.propriedade_id))} • ${esc(t.nome)}</option>`).join('')}</select></div><div class="row2"><div class="field"><label>Cultura</label><input name="cultura" required placeholder="Maracujá"></div><div class="field"><label>Variedade</label><input name="variedade"></div></div><div class="row2"><div class="field"><label>Data de plantio</label><input name="data_plantio" type="date"></div><div class="field"><label>Nº de plantas</label><input name="numero_plantas" type="number"></div></div><div class="row2"><div class="field"><label>Espaçamento linhas (m)</label><input name="espacamento_linhas_m" type="number" step="0.01"></div><div class="field"><label>Espaçamento plantas (m)</label><input name="espacamento_plantas_m" type="number" step="0.01"></div></div>`,submitSimple('safras'));
 if(type==='adubacao')return openAdubacao(sid);
 if(type==='adubacao')return modal('Registrar adubação',`<input type="hidden" name="safra_id" value="${sid}"><div class="row2"><div class="field"><label>Data</label><input name="data_aplicacao" type="date" value="${new Date().toISOString().slice(0,10)}" required></div><div class="field"><label>Tipo</label><select name="tipo"><option>Cobertura</option><option>Foliar</option><option>Plantio</option><option>Fertirrigação</option></select></div></div><div class="field"><label>Produto</label><input name="produto" required></div><div class="row2"><div class="field"><label>Dose</label><input name="dose" type="number" step="0.001"></div><div class="field"><label>Unidade</label><input name="unidade_dose" placeholder="g/planta, kg/ha"></div></div><div class="field"><label>Observações</label><textarea name="observacoes"></textarea></div>`,submitSimple('adubacoes'));
 if(type==='aplicacao')return openAplicacao(sid);
 if(type==='aplicacao')return modal('Registrar aplicação',`<input type="hidden" name="safra_id" value="${sid}"><div class="row2"><div class="field"><label>Data</label><input name="data_aplicacao" type="date" value="${new Date().toISOString().slice(0,10)}" required></div><div class="field"><label>Finalidade</label><select name="finalidade"><option>Inseticida</option><option>Fungicida</option><option>Acaricida</option><option>Bactericida</option><option>Herbicida</option><option>Biológico</option><option>Outro</option></select></div></div><div class="field"><label>Produto comercial</label><input name="produto_comercial" required></div><div class="field"><label>Ingrediente ativo</label><input name="ingrediente_ativo"></div><div class="row2"><div class="field"><label>Sistema</label><select name="sistema_grupo"><option value="">—</option><option>IRAC</option><option>FRAC</option><option>HRAC</option></select></div><div class="field"><label>Grupo MoA</label><input name="grupo_moa" placeholder="Ex.: 11, 3A"></div></div><div class="row2"><div class="field"><label>Dose</label><input name="dose" type="number" step="0.001"></div><div class="field"><label>Unidade</label><input name="unidade_dose" placeholder="mL/100 L"></div></div><div class="field"><label>Alvo</label><input name="alvo" placeholder="Lagarta, antracnose..."></div>`,submitSimple('aplicacoes'));
 if(type==='colheita')return openColheita(sid);
 if(type==='colheita')return modal('Registrar colheita',`<input type="hidden" name="safra_id" value="${sid}"><div class="row2"><div class="field"><label>Data</label><input name="data_colheita" type="date" value="${new Date().toISOString().slice(0,10)}" required></div><div class="field"><label>Peso (kg)</label><input name="peso_kg" type="number" step="0.001" required></div></div><div class="row2"><div class="field"><label>Quantidade de frutos</label><input name="quantidade_frutos" type="number"></div><div class="field"><label>Preço/kg (R$)</label><input name="preco_kg" type="number" step="0.01"></div></div><div class="field"><label>Observações</label><textarea name="observacoes"></textarea></div>`,submitSimple('colheitas'));
}
function formObj(form){const o={};for(const [k,v] of new FormData(form)){if(v!=='')o[k]=v}['area_total_ha','area_ha','espacamento_linhas_m','espacamento_plantas_m','dose','peso_kg','preco_kg','numero_plantas','quantidade_frutos'].forEach(k=>{if(o[k]!==undefined)o[k]=Number(o[k])});return o}
function submitSimple(table){return async e=>{e.preventDefault();const btn=e.submitter;btn.disabled=true;try{await insertRow(table,formObj(e.currentTarget));closeModal();await loadAll();toast('Salvo com sucesso')}catch(err){console.error(err);toast('Erro ao salvar. Confira os dados.')}finally{btn.disabled=false}}}
function go(page){$$('.page').forEach(p=>p.classList.toggle('active',p.id==='page-'+page));$$('.nav-btn').forEach(b=>b.classList.toggle('active',b.dataset.page===page));scrollTo({top:0,behavior:'smooth'})}
async function boot(){
  let s=JSON.parse(localStorage.getItem('tg_session')||'null');

  if(!s){
    showLogin();
    return;
  }

  state.session=s;

  if(!navigator.onLine){
    loadCache();
    renderAll();
    showApp();
    return;
  }

  if(await refreshSession()){
    await loadAll();
    showApp();
  }else{
    saveSession(null);
    state.session=null;
    showLogin();
  }
}
function showLogin(){$('#loginView').classList.remove('hidden');$('#app').classList.add('hidden')}
function showApp(){$('#loginView').classList.add('hidden');$('#app').classList.remove('hidden');$('#userLabel').textContent=state.session?.user?.email||'Gestão rural';loadAll();syncQueue()}
$('#loginForm').addEventListener('submit',async e=>{e.preventDefault();const m=$('#loginMsg');m.textContent='Entrando...';try{const s=await login($('#email').value.trim(),$('#password').value);state.session=s;saveSession(s);m.textContent='';showApp()}catch(err){console.error(err);m.textContent='Não foi possível entrar. Confira e-mail e senha.'}})
$('#logoutBtn').addEventListener('click',()=>{saveSession(null);state.session=null;showLogin()});
document.addEventListener('click',e=>{
 const p=e.target.closest('[data-page]');if(p)go(p.dataset.page);
 const g=e.target.closest('[data-go]');if(g)go(g.dataset.go);
 const o=e.target.closest('[data-open]');if(o)openForm(o.dataset.open);
 const a=e.target.closest('[data-action]');if(a)openForm(a.dataset.action,a.dataset.sid);
 const ep=e.target.closest('[data-edit-produtor]');if(ep)return viewProdutor(ep.dataset.editProdutor);
 const epr=e.target.closest('[data-edit-propriedade]');if(epr)return editPropriedade(epr.dataset.editPropriedade);
 const et=e.target.closest('[data-edit-talhao]');if(et)return editTalhao(et.dataset.editTalhao);
 const es=e.target.closest('[data-edit-safra]');if(es)return editSafra(es.dataset.editSafra);
});
function netBadge(){$('#offlineBadge').classList.toggle('hidden',navigator.onLine)}window.addEventListener('online',()=>{netBadge();syncQueue()});window.addEventListener('offline',netBadge);netBadge();
document.addEventListener('focusin', e => {
  if (e.target.matches('input, textarea, select')) {
    setTimeout(() => {
      e.target.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }, 350);
  }
});
if('serviceWorker'in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));
boot();
