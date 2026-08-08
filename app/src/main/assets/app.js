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
function renderPropriedades(){const el=$('#propriedadesList');el.innerHTML=state.propriedades.length?state.propriedades.map(p=>`<div class="card"><div class="card-row"><div><h4>${esc(p.nome)}</h4><div class="meta">Produtor: ${esc(nameBy(state.produtores,p.produtor_id))}</div><div class="meta">${esc(p.municipio||'')} • ${Number(p.area_total_ha||0).toLocaleString('pt-BR')} ha</div><div class="meta">Protocolo: ${esc(p.protocolo||'automático')}</div></div><span class="pill gold">${state.talhoes.filter(t=>t.propriedade_id===p.id).length} talhões</span></div></div>`).join(''):'<div class="empty">Nenhuma propriedade cadastrada.</div>'}
function renderTalhoes(){const el=$('#talhoesList');el.innerHTML=state.talhoes.length?state.talhoes.map(t=>`<div class="card"><div class="card-row"><div><h4>${esc(t.nome)}</h4><div class="meta">${esc(nameBy(state.propriedades,t.propriedade_id))}</div><div class="meta">Área: ${Number(t.area_ha||0).toLocaleString('pt-BR')} ha</div></div><span class="pill">${state.safras.filter(s=>s.talhao_id===t.id).length} safra(s)</span></div></div>`).join(''):'<div class="empty">Nenhum talhão cadastrado.</div>'}
function safraCard(s,compact=false){const t=talhaoOfSafra(s),p=t?state.propriedades.find(x=>x.id===t.propriedade_id):null,age=ageDays(s.data_plantio),kg=prodTotal(s.id),prod=produtividade(s);return `<div class="card"><div class="card-row"><div><h4>${esc(s.cultura)} ${s.variedade?`• ${esc(s.variedade)}`:''}</h4><div class="meta">${esc(p?.nome||'')} • ${esc(t?.nome||'')}</div><div class="kpi-line"><span class="pill">${age===null?'idade —':age+' dias'}</span><span class="pill gold">${kg.toLocaleString('pt-BR')} kg</span><span class="pill">${prod.toFixed(2).replace('.',',')} t/ha</span></div></div><span class="pill ${s.status==='encerrada'?'red':''}">${esc(s.status||'ativa')}</span></div>${compact?'':`<div class="actions"><button class="mini-btn" data-action="adubacao" data-sid="${s.id}">+ Adubação</button><button class="mini-btn" data-action="aplicacao" data-sid="${s.id}">+ Aplicação</button><button class="mini-btn" data-action="colheita" data-sid="${s.id}">+ Colheita</button></div>`}</div>`}
function renderSafras(){const el=$('#safrasList');el.innerHTML=state.safras.length?state.safras.map(s=>safraCard(s)).join(''):'<div class="empty">Nenhuma lavoura cadastrada.</div>'}
function opts(arr,value='id',label='nome'){return arr.map(x=>`<option value="${x[value]}">${esc(x[label])}</option>`).join('')}
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

async function insertRow(table,row){row.user_id=uid();if(!navigator.onLine){queueOp(table,row);toast('Salvo offline. Sincroniza quando houver internet.');return [row]}try{return await api(`/rest/v1/${table}`,{method:'POST',body:JSON.stringify(row)})}catch(e){if(e.message.includes('Failed to fetch')){queueOp(table,row);toast('Salvo offline. Sincroniza depois.');return [row]}throw e}}
function queueOp(table,row){const q=JSON.parse(localStorage.getItem('tg_queue')||'[]');q.push({table,row});localStorage.setItem('tg_queue',JSON.stringify(q))}
async function syncQueue(){if(!navigator.onLine||!state.session)return;let q=JSON.parse(localStorage.getItem('tg_queue')||'[]');if(!q.length)return;const left=[];for(const op of q){try{await api(`/rest/v1/${op.table}`,{method:'POST',body:JSON.stringify(op.row)})}catch{left.push(op)}}localStorage.setItem('tg_queue',JSON.stringify(left));if(!left.length){toast('Registros offline sincronizados');await loadAll()}}
function openForm(type,sid){
 if(type==='produtor')return modal('Novo produtor',`<div class="field"><label>Nome</label><input name="nome" required></div><div class="row2"><div class="field"><label>Telefone</label><input name="telefone"></div><div class="field"><label>CPF/CNPJ</label><input name="cpf_cnpj"></div></div><div class="row2"><div class="field"><label>Município</label><input name="municipio"></div><div class="field"><label>Estado</label><input name="estado" value="AM"></div></div><div class="field"><label>Observações</label><textarea name="observacoes"></textarea></div>`,submitSimple('produtores'));
 if(type==='propriedade')return modal('Nova propriedade',`<div class="field"><label>Produtor</label><select name="produtor_id" required><option value="">Selecione</option>${opts(state.produtores)}</select></div><div class="field"><label>Nome da propriedade</label><input name="nome" required></div><div class="row2"><div class="field"><label>Município</label><input name="municipio"></div><div class="field"><label>Área total (ha)</label><input name="area_total_ha" type="number" step="0.01"></div></div><div class="field"><label>Comunidade</label><input name="comunidade"></div>`,submitSimple('propriedades'));
 if(type==='talhao')return modal('Novo talhão',`<div class="field"><label>Propriedade</label><select name="propriedade_id" required><option value="">Selecione</option>${opts(state.propriedades)}</select></div><div class="row2"><div class="field"><label>Nome</label><input name="nome" required placeholder="Talhão 01"></div><div class="field"><label>Área (ha)</label><input name="area_ha" type="number" step="0.01"></div></div><div class="field"><label>Observações</label><textarea name="observacoes"></textarea></div>`,submitSimple('talhoes'));
 if(type==='safra')return modal('Nova lavoura',`<div class="field"><label>Talhão</label><select name="talhao_id" required><option value="">Selecione</option>${state.talhoes.map(t=>`<option value="${t.id}">${esc(nameBy(state.propriedades,t.propriedade_id))} • ${esc(t.nome)}</option>`).join('')}</select></div><div class="row2"><div class="field"><label>Cultura</label><input name="cultura" required placeholder="Maracujá"></div><div class="field"><label>Variedade</label><input name="variedade"></div></div><div class="row2"><div class="field"><label>Data de plantio</label><input name="data_plantio" type="date"></div><div class="field"><label>Nº de plantas</label><input name="numero_plantas" type="number"></div></div><div class="row2"><div class="field"><label>Espaçamento linhas (m)</label><input name="espacamento_linhas_m" type="number" step="0.01"></div><div class="field"><label>Espaçamento plantas (m)</label><input name="espacamento_plantas_m" type="number" step="0.01"></div></div>`,submitSimple('safras'));
 if(type==='adubacao')return modal('Registrar adubação',`<input type="hidden" name="safra_id" value="${sid}"><div class="row2"><div class="field"><label>Data</label><input name="data_aplicacao" type="date" value="${new Date().toISOString().slice(0,10)}" required></div><div class="field"><label>Tipo</label><select name="tipo"><option>Cobertura</option><option>Foliar</option><option>Plantio</option><option>Fertirrigação</option></select></div></div><div class="field"><label>Produto</label><input name="produto" required></div><div class="row2"><div class="field"><label>Dose</label><input name="dose" type="number" step="0.001"></div><div class="field"><label>Unidade</label><input name="unidade_dose" placeholder="g/planta, kg/ha"></div></div><div class="field"><label>Observações</label><textarea name="observacoes"></textarea></div>`,submitSimple('adubacoes'));
 if(type==='aplicacao')return modal('Registrar aplicação',`<input type="hidden" name="safra_id" value="${sid}"><div class="row2"><div class="field"><label>Data</label><input name="data_aplicacao" type="date" value="${new Date().toISOString().slice(0,10)}" required></div><div class="field"><label>Finalidade</label><select name="finalidade"><option>Inseticida</option><option>Fungicida</option><option>Acaricida</option><option>Bactericida</option><option>Herbicida</option><option>Biológico</option><option>Outro</option></select></div></div><div class="field"><label>Produto comercial</label><input name="produto_comercial" required></div><div class="field"><label>Ingrediente ativo</label><input name="ingrediente_ativo"></div><div class="row2"><div class="field"><label>Sistema</label><select name="sistema_grupo"><option value="">—</option><option>IRAC</option><option>FRAC</option><option>HRAC</option></select></div><div class="field"><label>Grupo MoA</label><input name="grupo_moa" placeholder="Ex.: 11, 3A"></div></div><div class="row2"><div class="field"><label>Dose</label><input name="dose" type="number" step="0.001"></div><div class="field"><label>Unidade</label><input name="unidade_dose" placeholder="mL/100 L"></div></div><div class="field"><label>Alvo</label><input name="alvo" placeholder="Lagarta, antracnose..."></div>`,submitSimple('aplicacoes'));
 if(type==='colheita')return modal('Registrar colheita',`<input type="hidden" name="safra_id" value="${sid}"><div class="row2"><div class="field"><label>Data</label><input name="data_colheita" type="date" value="${new Date().toISOString().slice(0,10)}" required></div><div class="field"><label>Peso (kg)</label><input name="peso_kg" type="number" step="0.001" required></div></div><div class="row2"><div class="field"><label>Quantidade de frutos</label><input name="quantidade_frutos" type="number"></div><div class="field"><label>Preço/kg (R$)</label><input name="preco_kg" type="number" step="0.01"></div></div><div class="field"><label>Observações</label><textarea name="observacoes"></textarea></div>`,submitSimple('colheitas'));
}
function formObj(form){const o={};for(const [k,v] of new FormData(form)){if(v!=='')o[k]=v}['area_total_ha','area_ha','espacamento_linhas_m','espacamento_plantas_m','dose','peso_kg','preco_kg','numero_plantas','quantidade_frutos'].forEach(k=>{if(o[k]!==undefined)o[k]=Number(o[k])});return o}
function submitSimple(table){return async e=>{e.preventDefault();const btn=e.submitter;btn.disabled=true;try{await insertRow(table,formObj(e.currentTarget));closeModal();await loadAll();toast('Salvo com sucesso')}catch(err){console.error(err);toast('Erro ao salvar. Confira os dados.')}finally{btn.disabled=false}}}
function go(page){$$('.page').forEach(p=>p.classList.toggle('active',p.id==='page-'+page));$$('.nav-btn').forEach(b=>b.classList.toggle('active',b.dataset.page===page));scrollTo({top:0,behavior:'smooth'})}
async function boot(){let s=JSON.parse(localStorage.getItem('tg_session')||'null');if(s){state.session=s;if(!await refreshSession()){saveSession(null);state.session=null}else showApp()}else showLogin()}
function showLogin(){$('#loginView').classList.remove('hidden');$('#app').classList.add('hidden')}
function showApp(){$('#loginView').classList.add('hidden');$('#app').classList.remove('hidden');$('#userLabel').textContent=state.session?.user?.email||'Gestão rural';loadAll();syncQueue()}
$('#loginForm').addEventListener('submit',async e=>{e.preventDefault();const m=$('#loginMsg');m.textContent='Entrando...';try{const s=await login($('#email').value.trim(),$('#password').value);state.session=s;saveSession(s);m.textContent='';showApp()}catch(err){console.error(err);m.textContent='Não foi possível entrar. Confira e-mail e senha.'}})
$('#logoutBtn').addEventListener('click',()=>{saveSession(null);state.session=null;showLogin()});
document.addEventListener('click',e=>{
 const p=e.target.closest('[data-page]');if(p)go(p.dataset.page);
 const g=e.target.closest('[data-go]');if(g)go(g.dataset.go);
 const o=e.target.closest('[data-open]');if(o)openForm(o.dataset.open);
 const a=e.target.closest('[data-action]');if(a)openForm(a.dataset.action,a.dataset.sid);
 const ep=e.target.closest('[data-edit-produtor]');if(ep)editProdutor(ep.dataset.editProdutor);
});
function netBadge(){$('#offlineBadge').classList.toggle('hidden',navigator.onLine)}window.addEventListener('online',()=>{netBadge();syncQueue()});window.addEventListener('offline',netBadge);netBadge();
if('serviceWorker'in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));
boot();
