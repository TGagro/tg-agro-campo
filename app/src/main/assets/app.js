const SUPABASE_URL='https://olekhksinesqosfmtdjf.supabase.co';
const SUPABASE_KEY='sb_publishable_b_SgzfAoxE2Cs3KahdwLJw_hobIA1wd';
const state={
  session:null,
  perfilUsuario:null,
  loginTipo:'tecnico',

  produtores:[],
  propriedades:[],
  talhoes:[],
  safras:[],
  adubacoes:[],
  aplicacoes:[],
  colheitas:[],
  pagamentos_produtores:[]
};
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const uid=()=>state.session?.user?.id;
async function loadPerfilUsuario(){
  const rows=await api(
    `/rest/v1/perfis_usuarios?user_id=eq.${uid()}&select=user_id,tipo_usuario,produtor_id`
  );

  state.perfilUsuario=
    Array.isArray(rows) && rows.length
      ? rows[0]
      : null;

  return state.perfilUsuario;
}
function isProdutor(){
  return state.perfilUsuario?.tipo_usuario === 'produtor';
}
function isTecnico(){
  return !isProdutor();
}

function selecionarTipoAcesso(tipo){
  state.loginTipo=tipo;

  const btTecnico=$('#loginTipoTecnico');
  const btProdutor=$('#loginTipoProdutor');

  if(btTecnico){
    btTecnico.classList.toggle(
      'btn-primary',
      tipo==='tecnico'
    );
  }

  if(btProdutor){
    btProdutor.classList.toggle(
      'btn-primary',
      tipo==='produtor'
    );
  }

  const titulo=$('#loginTipoTitulo');

  if(titulo){
    titulo.textContent=
      tipo==='produtor'
        ?'Acesso do Produtor'
        :'Acesso Técnico';
  }
}

function montarEscolhaLogin(){
  const form=$('#loginForm');

  if(!form || $('#tipoAcessoWrap'))return;

  form.insertAdjacentHTML(
    'afterbegin',
    `
    <div id="tipoAcessoWrap" style="margin-bottom:18px">

      <div
        style="
          text-align:center;
          font-weight:700;
          margin-bottom:10px;
          font-size:16px;
        ">
        Como deseja entrar?
      </div>

      <div
        style="
          display:grid;
          grid-template-columns:1fr 1fr;
          gap:10px;
          margin-bottom:14px;
        ">

        <button
          type="button"
          id="loginTipoTecnico"
          class="btn btn-primary">
          👨‍🌾 TÉCNICO
        </button>

        <button
          type="button"
          id="loginTipoProdutor"
          class="btn">
          🌱 PRODUTOR
        </button>

      </div>

      <div
        id="loginTipoTitulo"
        style="
          text-align:center;
          font-weight:700;
          margin-bottom:14px;
        ">
        Acesso Técnico
      </div>

    </div>
    `
  );

  $('#loginTipoTecnico').onclick=()=>{
    selecionarTipoAcesso('tecnico');
  };

  $('#loginTipoProdutor').onclick=()=>{
    selecionarTipoAcesso('produtor');
  };

  selecionarTipoAcesso(
    state.loginTipo||'tecnico'
  );
    if(!$('#esqueciSenha')){

    const entrar=
      form.querySelector(
        'button[type="submit"]'
      );

    if(entrar){

      entrar.insertAdjacentHTML(
        'afterend',
        `
        <button
          type="button"
          id="esqueciSenha"
          style="
            width:100%;
            border:none;
            background:transparent;
            color:#356b4c;
            font-weight:700;
            margin-top:14px;
            padding:10px;
            cursor:pointer;
          ">
          Esqueci minha senha
        </button>
        `
      );

    }
  }

  const recuperar=$('#esqueciSenha');

  if(recuperar){

    recuperar.onclick=async()=>{

      const campoEmail=$('#email');

      const email=
        campoEmail?.value
          .trim()
          .toLowerCase();

      if(!email){

        toast(
          'Digite seu e-mail primeiro'
        );

        campoEmail?.focus();

        return;
      }

      try{

        recuperar.disabled=true;
        recuperar.textContent=
          'Enviando...';

        await recuperarSenha(email);

        toast(
          'Link de recuperação enviado para o e-mail'
        );

     }catch(err){

  console.error('ERRO RECUPERAÇÃO:',err);

  let mensagem=
    err?.message ||
    'Não foi possível enviar a recuperação';

  try{
    const j=JSON.parse(mensagem);

    mensagem=
      j.msg ||
      j.message ||
      j.error_description ||
      j.error ||
      mensagem;
  }catch(_){}

  toast(mensagem);
}
      finally{

        recuperar.disabled=false;
        recuperar.textContent=
          'Esqueci minha senha';
      }
    };
  }
}
function filtrarDadosProdutor(){
  const pid=String(state.perfilUsuario?.produtor_id||'');
  if(!pid)return;

  state.produtores=state.produtores.filter(
    p=>String(p.id)===pid
  );

  state.propriedades=state.propriedades.filter(
    p=>String(p.produtor_id)===pid
  );

  const propIds=new Set(
    state.propriedades.map(p=>String(p.id))
  );

  state.talhoes=state.talhoes.filter(
    t=>propIds.has(String(t.propriedade_id))
  );

  const talhaoIds=new Set(
    state.talhoes.map(t=>String(t.id))
  );

  state.safras=state.safras.filter(
    s=>talhaoIds.has(String(s.talhao_id))
  );

  const safraIds=new Set(
    state.safras.map(s=>String(s.id))
  );

  state.adubacoes=state.adubacoes.filter(
    a=>safraIds.has(String(a.safra_id))
  );

  state.aplicacoes=state.aplicacoes.filter(
    a=>safraIds.has(String(a.safra_id))
  );

  state.colheitas=state.colheitas.filter(
    c=>safraIds.has(String(c.safra_id))
  );
}
function headers(auth=true){const h={'apikey':SUPABASE_KEY,'Content-Type':'application/json','Prefer':'return=representation'};if(auth&&state.session?.access_token)h.Authorization='Bearer '+state.session.access_token;return h}
async function api(path,opts={}){const res=await fetch(SUPABASE_URL+path,{...opts,headers:{...headers(opts.auth!==false),...(opts.headers||{})}});if(!res.ok){let t=await res.text();throw new Error(t||`HTTP ${res.status}`)}if(res.status===204)return null;const text=await res.text();return text?JSON.parse(text):null}
function saveSession(s){state.session=s;localStorage.setItem('tg_session',JSON.stringify(s||null))}
async function refreshSession(){const s=JSON.parse(localStorage.getItem('tg_session')||'null');if(!s?.refresh_token)return false;try{const n=await api('/auth/v1/token?grant_type=refresh_token',{method:'POST',auth:false,body:JSON.stringify({refresh_token:s.refresh_token})});saveSession(n);state.session=n;return true}catch{return false}}
async function login(email,password){return api('/auth/v1/token?grant_type=password',{method:'POST',auth:false,body:JSON.stringify({email,password})})}
let recuperarSenhaPendente=null;

window.onLocalizacaoTG=
function(ok,latitude,longitude,mensagem){

  const gpsBtn=
  $('#capturarLocalizacaoPropriedade') ||
  $('#capturarLocalizacaoProdutor');

const statusGps=
  $('#statusLocalizacaoPropriedade') ||
  $('#statusLocalizacaoProdutor');

const campoLatitude=
  $('#novaPropLatitude') ||
  $('#novoProdLatitude');

const campoLongitude=
  $('#novaPropLongitude') ||
  $('#novoProdLongitude');


  if(ok){

    if(campoLatitude){
      campoLatitude.value=latitude;
    }

    if(campoLongitude){
      campoLongitude.value=longitude;
    }

    if(statusGps){
      statusGps.innerHTML=
        `✅ Localização registrada<br>`+
        `${Number(latitude).toFixed(6)}, `+
        `${Number(longitude).toFixed(6)}`;
    }

    if(gpsBtn){
      gpsBtn.disabled=false;
      gpsBtn.textContent=
        '✅ LOCALIZAÇÃO CAPTURADA';
    }

    toast('Localização registrada');

  }else{

    if(statusGps){
      statusGps.textContent=
        mensagem ||
        'Não foi possível obter a localização';
    }

    if(gpsBtn){
      gpsBtn.disabled=false;
      gpsBtn.textContent=
        '📍 TENTAR NOVAMENTE';
    }

    toast(
      mensagem ||
      'Não foi possível acessar o GPS'
    );
  }
};
window.onRecuperarSenhaResult=
function(ok,resposta){

  if(!recuperarSenhaPendente)return;

  const p=
    recuperarSenhaPendente;

  recuperarSenhaPendente=null;

  if(ok){
    p.resolve(resposta);
  }else{
    p.reject(
      new Error(
        resposta ||
        'Erro ao recuperar senha'
      )
    );
  }
};

async function recuperarSenha(email){

  if(
    window.AndroidTG &&
    typeof AndroidTG.recuperarSenha==='function'
  ){

    return new Promise(
      (resolve,reject)=>{

        recuperarSenhaPendente={
          resolve,
          reject
        };

        AndroidTG.recuperarSenha(email);
      }
    );
  }

  throw new Error(
    'Comunicação com o Android indisponível'
  );
}
function esc(v=''){return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]))}
function dateBR(d){if(!d)return '—';return new Date(d+'T12:00:00').toLocaleDateString('pt-BR')}
function ageDays(d){if(!d)return null;return Math.max(0,Math.floor((Date.now()-new Date(d+'T12:00:00'))/86400000))}
const PARAMETROS_CULTURAS={
  maracuja:{
    nome:'Maracujá',
    acompanhamento:'Semanal e mensal',
    periodoMeta:'ano',
    metaTha:35,
    cicloDias:null,
    indicador:'kg/planta e t/ha'
  },

  banana:{
    nome:'Banana',
    acompanhamento:'Por colheita e por ciclo',
    periodoMeta:'ciclo',
    metaTha:25,
    cicloDias:330,
    indicador:'kg/cacho e t/ha'
  },

  melancia:{
    nome:'Melancia',
    acompanhamento:'Por colheita e por ciclo',
    periodoMeta:'ciclo',
    metaTha:30,
    cicloDias:90,
    indicador:'kg/planta, kg/fruto e t/ha'
  },

  abacaxi:{
    nome:'Abacaxi',
    acompanhamento:'Por colheita e por ciclo',
    periodoMeta:'ciclo',
    metaTha:35,
    cicloDias:420,
    indicador:'kg/fruto e t/ha'
  },

  pimentao:{
    nome:'Pimentão',
    acompanhamento:'Semanal e mensal',
    periodoMeta:'ciclo',
    metaTha:40,
    cicloDias:180,
    indicador:'kg/planta e t/ha'
  }
};

function normalizarTexto(v=''){
  return String(v)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g,'')
    .trim()
    .toLowerCase();
}

function parametroCultura(cultura=''){
  const c=normalizarTexto(cultura);

  if(c.includes('maracuja')){
    return PARAMETROS_CULTURAS.maracuja;
  }

  if(c.includes('banana')){
    return PARAMETROS_CULTURAS.banana;
  }

  if(c.includes('melancia')){
    return PARAMETROS_CULTURAS.melancia;
  }

  if(c.includes('abacaxi')){
    return PARAMETROS_CULTURAS.abacaxi;
  }

  if(c.includes('pimentao')){
    return PARAMETROS_CULTURAS.pimentao;
  }

  return {
    nome:cultura||'Cultura',
    acompanhamento:'Por colheita',
    periodoMeta:'ciclo',
    metaTha:null,
    cicloDias:null,
    indicador:'t/ha'
  };
}

function plantasHaTeoricas(safra){
  const linhas=Number(
    safra?.espacamento_linhas_m||0
  );

  const plantas=Number(
    safra?.espacamento_plantas_m||0
  );

  if(!linhas || !plantas)return 0;

  return 10000/(linhas*plantas);
}

function plantasHaReais(safra){
  const talhao=talhaoOfSafra(safra);

  const area=Number(
    talhao?.area_ha||0
  );

  const plantas=Number(
    safra?.numero_plantas||0
  );

  if(!area || !plantas)return 0;

  return plantas/area;
}

function resumoTecnicoSafra(safra){
  const param=parametroCultura(
    safra?.cultura
  );

  const talhao=talhaoOfSafra(safra);

  const area=Number(
    talhao?.area_ha||0
  );

  const totalKg=prodTotal(
    safra.id
  );

  const tha=
    area
      ?totalKg/area/1000
      :0;

  const plantas=Number(
    safra?.numero_plantas||0
  );

  const kgPlanta=
    plantas
      ?totalKg/plantas
      :0;

  const teorica=
    plantasHaTeoricas(safra);

  const real=
    plantasHaReais(safra);

  const meta=
    Number(param.metaTha||0);

  const atingimento=
    meta
      ?(tha/meta)*100
      :0;

  return {
    param,
    area,
    totalKg,
    tha,
    plantas,
    kgPlanta,
    teorica,
    real,
    meta,
    atingimento
  };
}
function hojeLocalISO(){
  const d=new Date();

  const y=d.getFullYear();
  const m=String(d.getMonth()+1).padStart(2,'0');
  const dia=String(d.getDate()).padStart(2,'0');

  return `${y}-${m}-${dia}`;
}

function statusManejoTG(item){
  const status=String(
    item?.status||''
  ).toLowerCase();

  if(
    status==='realizado' ||
    status==='realizada'
  ){
    return 'realizado';
  }

  const hoje=hojeLocalISO();
  const data=item?.data_aplicacao||'';

  if(!data){
    return 'programado';
  }

  if(data<hoje){
    return 'atrasado';
  }

  if(data===hoje){
    return 'hoje';
  }

  return 'programado';
}

function contextoSafra(safraId){

  const safra=state.safras.find(
    s=>String(s.id)===String(safraId)
  );

  if(!safra){
    return {
      safra:null,
      talhao:null,
      propriedade:null,
      produtor:null
    };
  }

  const talhao=state.talhoes.find(
    t=>String(t.id)===String(safra.talhao_id)
  );

  const propriedade=talhao
    ?state.propriedades.find(
      p=>String(p.id)===String(talhao.propriedade_id)
    )
    :null;

  const produtor=propriedade
    ?state.produtores.find(
      p=>String(p.id)===String(propriedade.produtor_id)
    )
    :null;

  return {
    safra,
    talhao,
    propriedade,
    produtor
  };
}
function toast(msg){const t=$('#toast');t.textContent=msg;t.classList.remove('hidden');setTimeout(()=>t.classList.add('hidden'),2600)}
function cacheData(){localStorage.setItem('tg_cache',JSON.stringify({perfilUsuario:state.perfilUsuario,produtores:state.produtores,propriedades:state.propriedades,talhoes:state.talhoes,safras:state.safras,adubacoes:state.adubacoes,aplicacoes:state.aplicacoes,colheitas:state.colheitas}))}
function loadCache(){try{Object.assign(state,JSON.parse(localStorage.getItem('tg_cache')||'{}'))}catch{}}
async function loadTable(t){const rows=await api(`/rest/v1/${t}?select=*&order=created_at.desc`);state[t]=rows||[]}
async function loadAll(){if(!navigator.onLine){loadCache();if(isProdutor())filtrarDadosProdutor();renderAll();return}try{await Promise.all(['produtores','propriedades','talhoes','safras','adubacoes','aplicacoes','colheitas','pagamentos_produtores'].map(loadTable));if(isProdutor())filtrarDadosProdutor();cacheData();renderAll()}catch(e){console.error(e);loadCache();renderAll();toast('Usando dados salvos no aparelho')}}
function nameBy(arr,id,key='nome'){return arr.find(x=>x.id===id)?.[key]||'—'}
function propOfTalhao(tid){const t=state.talhoes.find(x=>x.id===tid);return t?state.propriedades.find(p=>p.id===t.propriedade_id):null}
function talhaoOfSafra(s){return state.talhoes.find(t=>t.id===s.talhao_id)}
function prodTotal(sid){return state.colheitas.filter(c=>c.safra_id===sid).reduce((a,c)=>a+Number(c.peso_kg||0),0)}
function produtividade(s){const t=talhaoOfSafra(s),kg=prodTotal(s.id),ha=Number(t?.area_ha||0);return ha?kg/ha/1000:0}
async function excluirProducaoProdutor(id){

  const registro =
    state.colheitas.find(
      c=>String(c.id)===String(id)
    );

  if(!registro){
    toast('Produção não encontrada');
    return;
  }


  const confirmar =
    confirm(
      'Deseja realmente excluir este lançamento de produção?\n\n' +
      `${dateBR(registro.data_colheita)} • ` +
      `${Number(registro.peso_kg || 0).toLocaleString('pt-BR')} kg`
    );

  if(!confirmar) return;


  try{

    await deleteRow(
      'colheitas',
      id
    );

    toast(
      '✓ Produção excluída'
    );

    await loadAll();

  }catch(err){

    console.error(
      'Erro ao excluir produção:',
      err
    );

    toast(
      'Não foi possível excluir a produção'
    );
  }
}



function editarProducaoProdutor(id){

  const registro =
    state.colheitas.find(
      c=>String(c.id)===String(id)
    );

  if(!registro){

    toast(
      'Produção não encontrada'
    );

    return;
  }


  const safra =
    state.safras.find(
      s=>
        String(s.id)===
        String(registro.safra_id)
    );

  if(!safra){

    toast(
      'Lavoura não encontrada'
    );

    return;
  }


  const cultura =
    normalizarTexto(
      safra.cultura || ''
    );


  let camposExtras='';


  // =========================
  // BANANA
  // =========================

  if(cultura.includes('banana')){

    camposExtras=`

      <div class="field">

        <label>
          🍌 Quantidade de cachos
        </label>

        <input
          type="number"
          id="editarProducaoQuantidadeUnidades"
          min="0"
          step="1"
          value="${
            registro.quantidade_unidades ??
            ''
          }">

      </div>


      <div class="field">

        <label>
          Ciclo da produção
        </label>

        <select id="editarProducaoCiclo">

          <option
            value="1"
            ${
              Number(
                registro.ciclo_numero || 1
              )===1
                ? 'selected'
                : ''
            }>
            1º ciclo
          </option>

          <option
            value="2"
            ${
              Number(
                registro.ciclo_numero
              )===2
                ? 'selected'
                : ''
            }>
            2º ciclo
          </option>

          <option
            value="3"
            ${
              Number(
                registro.ciclo_numero
              )===3
                ? 'selected'
                : ''
            }>
            3º ciclo
          </option>

        </select>

      </div>


      <div class="field">

        <label>
          Geração
        </label>

        <select id="editarProducaoGeracao">

          <option
            value="mae"
            ${
              registro.geracao_banana==='mae'
                ? 'selected'
                : ''
            }>
            Mãe
          </option>

          <option
            value="filha"
            ${
              registro.geracao_banana==='filha'
                ? 'selected'
                : ''
            }>
            Filha
          </option>

          <option
            value="neta"
            ${
              registro.geracao_banana==='neta'
                ? 'selected'
                : ''
            }>
            Neta
          </option>

        </select>

      </div>

    `;
  }


  // =========================
  // MELANCIA / ABACAXI /
  // MARACUJÁ
  // =========================

  else if(
    cultura.includes('melancia') ||
    cultura.includes('abacaxi') ||
    cultura.includes('maracuja')
  ){

    camposExtras=`

      <div class="field">

        <label>
          Quantidade de frutos
        </label>

        <input
          type="number"
          id="editarProducaoQuantidadeFrutos"
          min="0"
          step="1"
          value="${
            registro.quantidade_frutos ??
            ''
          }">

      </div>

    `;
  }


  // =========================
  // MILHO
  // =========================

  else if(cultura.includes('milho')){

    camposExtras=`

      <div class="field">

        <label>
          🌽 Quantidade de sacas
        </label>

        <input
          type="number"
          id="editarProducaoQuantidadeUnidades"
          min="0"
          step="0.01"
          value="${
            registro.quantidade_unidades ??
            ''
          }">

      </div>

    `;
  }


  modal(

    '✏️ Editar produção',

    `

      <div class="card">

        <strong>
          🌱 ${esc(
            safra.cultura ||
            'Lavoura'
          )}
        </strong>

        ${
          safra.variedade
            ? `
              <div
                class="meta"
                style="margin-top:5px;">

                ${esc(
                  safra.variedade
                )}

              </div>
            `
            : ''
        }

      </div>


      <div class="field">

        <label>
          Data da produção / colheita
        </label>

        <input
          type="date"
          id="editarProducaoData"
          value="${
            registro.data_colheita || ''
          }"
          required>

      </div>


      <div class="field">

        <label>
          Peso produzido (kg)
        </label>

        <input
          type="number"
          id="editarProducaoPeso"
          min="0.01"
          step="0.01"
          value="${
            registro.peso_kg || ''
          }"
          required>

      </div>


      ${camposExtras}


      <div class="field">

        <label>
          Observações
        </label>

        <textarea
          id="editarProducaoObservacoes"
        >${esc(
          registro.observacoes || ''
        )}</textarea>

      </div>

    `,


    async e=>{

      e.preventDefault();


      const btn =
        e.currentTarget.querySelector(
          'button[type="submit"]'
        );


      const data =
        $('#editarProducaoData')
          .value;


      const peso =
        Number(
          $('#editarProducaoPeso')
            .value
        );


      if(!data || !peso){

        toast(
          'Informe a data e o peso'
        );

        return;
      }


      const alteracoes={

        data_colheita:data,

        peso_kg:peso,

        observacoes:
          $('#editarProducaoObservacoes')
            .value
            .trim() || null

      };


      const campoFrutos =
        $('#editarProducaoQuantidadeFrutos');

      if(campoFrutos){

        alteracoes.quantidade_frutos =
          Number(
            campoFrutos.value || 0
          ) || null;
      }


      const campoUnidades =
        $('#editarProducaoQuantidadeUnidades');

      if(campoUnidades){

        alteracoes.quantidade_unidades =
          Number(
            campoUnidades.value || 0
          ) || null;
      }


      const campoCiclo =
        $('#editarProducaoCiclo');

      if(campoCiclo){

        alteracoes.ciclo_numero =
          Number(
            campoCiclo.value
          );
      }


      const campoGeracao =
        $('#editarProducaoGeracao');

      if(campoGeracao){

        alteracoes.geracao_banana =
          campoGeracao.value;
      }


      try{

        btn.disabled=true;

        btn.textContent=
          'SALVANDO...';


        await api(
          '/rest/v1/colheitas' +
          '?id=eq.' +
          encodeURIComponent(id),
          {
            method:'PATCH',

            body:JSON.stringify(
              alteracoes
            )
          }
        );


        closeModal();


        toast(
          '✓ Produção atualizada'
        );


        await loadAll();


      }catch(err){

        console.error(
          'Erro ao editar produção:',
          err
        );

        toast(
          'Não foi possível atualizar a produção'
        );

        btn.disabled=false;

        btn.textContent=
          'SALVAR';
      }

    }
  );
}
function adicionarAcoesHistoricoProducao(
  historico,
  colheitas
){

  if(!historico || !colheitas?.length){
    return;
  }


  const cards =
    historico.querySelectorAll('.card');


  cards.forEach((card,index)=>{

    const registro =
      colheitas[index];

    if(!registro) return;


    const acoes =
      document.createElement('div');


    acoes.style.cssText = `
      display:grid;
      grid-template-columns:1fr 1fr;
      gap:8px;
      margin-top:14px;
      padding-top:12px;
      border-top:1px solid #e7ebe8;
    `;


    acoes.innerHTML = `

      <button
        type="button"
        class="btn"
        data-editar-producao="${registro.id}">
        ✏️ EDITAR
      </button>


      <button
        type="button"
        class="btn"
        data-excluir-producao="${registro.id}"
        style="
          color:#b63b32;
          border-color:#f0c9c6;
        ">
        🗑️ EXCLUIR
      </button>

    `;


    card.appendChild(acoes);

  });


  historico
    .querySelectorAll(
      '[data-editar-producao]'
    )
    .forEach(btn=>{

      btn.onclick=()=>{

        editarProducaoProdutor(
          btn.dataset.editarProducao
        );

      };

    });


  historico
    .querySelectorAll(
      '[data-excluir-producao]'
    )
    .forEach(btn=>{

      btn.onclick=()=>{

        excluirProducaoProdutor(
          btn.dataset.excluirProducao
        );

      };

    });
}
function atualizarResumoProducaoProdutor(safraId){

  const resumo =
    $('#producaoResumo');

  const historico =
    $('#historicoProducaoProdutor');

  if(!resumo || !historico) return;

  if(!safraId){

    resumo.innerHTML = `
      <div class="empty">
        Selecione uma lavoura para visualizar a produção.
      </div>
    `;

    historico.innerHTML = `
      <div class="empty">
        Nenhuma produção registrada ainda.
      </div>
    `;

    return;
  }


  const safra =
    state.safras.find(
      s=>String(s.id)===String(safraId)
    );

  if(!safra) return;


  const talhao =
    state.talhoes.find(
      t=>String(t.id)===
         String(safra.talhao_id)
    );


  const colheitas =
    state.colheitas
      .filter(
        c=>String(c.safra_id)===
           String(safraId)
      )
      .sort(
        (a,b)=>
          String(b.data_colheita||'')
            .localeCompare(
              String(a.data_colheita||'')
            )
      );


  const producao =
    producaoPeriodosTG(colheitas);


  const area =
    Number(talhao?.area_ha || 0);


  const produtividadeHa =
    area
      ? producao.anual / area / 1000
      : 0;


  const kg = valor =>
    Number(valor || 0)
      .toLocaleString(
        'pt-BR',
        {
          maximumFractionDigits:2
        }
      );
const culturaNormalizada =
  String(safra.cultura || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g,'');


// ========================================
// PAINEL ESPECÍFICO PARA BANANA
// ========================================

if(culturaNormalizada.includes('banana')){

  const ultimaColheita =
    colheitas[0] || null;


  const cicloAtual =
    Number(
      ultimaColheita?.ciclo_numero || 1
    );


  const geracaoAtual =
    ultimaColheita?.geracao_banana || null;


  const colheitasCiclo =
    colheitas.filter(c=>
      Number(c.ciclo_numero || 1) ===
      cicloAtual
    );


  const producaoCicloKg =
    colheitasCiclo.reduce(
      (total,c)=>
        total + Number(c.peso_kg || 0),
      0
    );


  const cachosCiclo =
    colheitasCiclo.reduce(
      (total,c)=>
        total +
        Number(c.quantidade_unidades || 0),
      0
    );


  const pesoMedioCacho =
    cachosCiclo
      ? producaoCicloKg / cachosCiclo
      : 0;


  const produtividadeCiclo =
    area
      ? producaoCicloKg / area / 1000
      : 0;


  const hoje12 =
    new Date();

  const inicio12 =
    new Date();

  inicio12.setFullYear(
    inicio12.getFullYear() - 1
  );


  const producao12Meses =
    colheitas.reduce(
      (total,c)=>{

        if(!c.data_colheita){
          return total;
        }

        const data =
          new Date(
            c.data_colheita + 'T00:00:00'
          );

        if(
          data >= inicio12 &&
          data <= hoje12
        ){
          return total +
            Number(c.peso_kg || 0);
        }

        return total;
      },
      0
    );


  const nomeGeracao = {
    mae:'Mãe',
    filha:'Filha',
    neta:'Neta'
  };


  resumo.innerHTML = `

    <div class="card">

      <h3 style="margin-top:0;">
        🍌 ${esc(safra.cultura || 'Banana')}
      </h3>

      <div class="meta">
        ${esc(talhao?.nome || '')}
        ${area ? ` • ${kg(area)} ha` : ''}
      </div>


      <div
        style="
          display:flex;
          gap:8px;
          flex-wrap:wrap;
          margin-top:14px;
        ">

        <span class="pill">
          Ciclo ${cicloAtual}
        </span>

        ${
          geracaoAtual
            ? `
              <span class="pill">
                ${nomeGeracao[geracaoAtual] || geracaoAtual}
              </span>
            `
            : ''
        }

      </div>


      <div
        style="
          display:grid;
          grid-template-columns:1fr 1fr;
          gap:18px;
          margin-top:22px;
        ">

        <div>
          <div class="meta">
            PRODUÇÃO DO CICLO
          </div>

          <strong style="font-size:22px;">
            ${kg(producaoCicloKg)} kg
          </strong>
        </div>


        <div>
          <div class="meta">
            CACHOS COLHIDOS
          </div>

          <strong style="font-size:22px;">
            ${kg(cachosCiclo)}
          </strong>
        </div>


        <div>
          <div class="meta">
            PESO MÉDIO / CACHO
          </div>

          <strong style="font-size:22px;">
            ${kg(pesoMedioCacho)} kg
          </strong>
        </div>


        <div>
          <div class="meta">
            PRODUTIVIDADE
          </div>

          <strong style="font-size:22px;">
            ${kg(produtividadeCiclo)} t/ha
          </strong>
        </div>

      </div>


      <div
        style="
          margin-top:20px;
          padding-top:16px;
          border-top:1px solid #ddd;
        ">

        <div class="meta">
          PRODUÇÃO NOS ÚLTIMOS 12 MESES
        </div>

        <strong style="font-size:22px;">
          ${kg(producao12Meses)} kg
        </strong>

      </div>

    </div>
  `;


  if(!colheitas.length){

    historico.innerHTML = `
      <div class="empty">
        Nenhuma produção registrada ainda.
      </div>
    `;

    return;
  }


  historico.innerHTML = `

    <div class="meta" style="margin-bottom:10px;">
      🍌 <strong>HISTÓRICO DA BANANA</strong>
    </div>

    ${colheitas.map(c=>`

      <div class="card">

        <div class="card-row">

          <div>

            <strong>
              ${
                c.data_colheita
                  ? c.data_colheita
                      .split('-')
                      .reverse()
                      .join('/')
                  : '-'
              }
            </strong>

            <div class="meta" style="margin-top:5px;">

              Ciclo ${c.ciclo_numero || 1}

              ${
                c.geracao_banana
                  ? ` • ${
                      nomeGeracao[
                        c.geracao_banana
                      ] ||
                      c.geracao_banana
                    }`
                  : ''
              }

            </div>

          </div>


          <div style="text-align:right;">

            <strong>
              ${kg(c.peso_kg)} kg
            </strong>

            ${
              c.quantidade_unidades
                ? `
                  <div class="meta">
                    ${kg(c.quantidade_unidades)}
                    cachos
                  </div>
                `
                : ''
            }

          </div>

        </div>

      </div>

    `).join('')}
  `;
adicionarAcoesHistoricoProducao(
  historico,
  colheitas
);

  return;
}
// ========================================
// MELANCIA
// ========================================

if(culturaNormalizada.includes('melancia')){

  const producaoCiclo =
    colheitas.reduce(
      (total,c)=>
        total + Number(c.peso_kg || 0),
      0
    );

  const frutos =
    colheitas.reduce(
      (total,c)=>
        total + Number(c.quantidade_frutos || 0),
      0
    );

  const pesoMedio =
    frutos
      ? producaoCiclo / frutos
      : 0;

  const produtividade =
    area
      ? producaoCiclo / area / 1000
      : 0;


  resumo.innerHTML = `

    <div class="card">

      <h3 style="margin-top:0;">
        🍉 ${esc(safra.cultura || 'Melancia')}
      </h3>

      <div class="meta">
        ${esc(talhao?.nome || '')}
        ${area ? ` • ${kg(area)} ha` : ''}
      </div>


      <div
        style="
          display:grid;
          grid-template-columns:1fr 1fr;
          gap:18px;
          margin-top:22px;
        ">

        <div>
          <div class="meta">
            PRODUÇÃO DO CICLO
          </div>

          <strong style="font-size:22px;">
            ${kg(producaoCiclo)} kg
          </strong>
        </div>


        <div>
          <div class="meta">
            FRUTOS COLHIDOS
          </div>

          <strong style="font-size:22px;">
            ${kg(frutos)}
          </strong>
        </div>


        <div>
          <div class="meta">
            PESO MÉDIO / FRUTO
          </div>

          <strong style="font-size:22px;">
            ${kg(pesoMedio)} kg
          </strong>
        </div>


        <div>
          <div class="meta">
            PRODUTIVIDADE
          </div>

          <strong style="font-size:22px;">
            ${kg(produtividade)} t/ha
          </strong>
        </div>

      </div>

    </div>
  `;


  historico.innerHTML = colheitas.length
    ? `

      <div class="meta" style="margin-bottom:10px;">
        🍉 <strong>HISTÓRICO DA COLHEITA</strong>
      </div>

      ${colheitas.map(c=>`

        <div class="card">

          <div class="card-row">

            <div>

              <strong>
                ${
                  c.data_colheita
                    ? c.data_colheita
                        .split('-')
                        .reverse()
                        .join('/')
                    : '-'
                }
              </strong>

              ${
                c.quantidade_frutos
                  ? `
                    <div class="meta">
                      ${kg(c.quantidade_frutos)}
                      frutos
                    </div>
                  `
                  : ''
              }

            </div>

            <strong>
              ${kg(c.peso_kg)} kg
            </strong>

          </div>

        </div>

      `).join('')}

    `
    : `
      <div class="empty">
        Nenhuma produção registrada ainda.
      </div>
    `;
adicionarAcoesHistoricoProducao(
  historico,
  colheitas
);
  return;
}



// ========================================
// MILHO
// ========================================

if(culturaNormalizada.includes('milho')){

  const producaoCiclo =
    colheitas.reduce(
      (total,c)=>
        total + Number(c.peso_kg || 0),
      0
    );


  const sacasRegistradas =
    colheitas.reduce(
      (total,c)=>
        total +
        Number(c.quantidade_unidades || 0),
      0
    );


  // Se não informou sacas,
  // estima usando saco de 60 kg.
  const sacas =
    sacasRegistradas ||
    (
      producaoCiclo
        ? producaoCiclo / 60
        : 0
    );


  const kgHa =
    area
      ? producaoCiclo / area
      : 0;


  const sacasHa =
    area
      ? sacas / area
      : 0;


  resumo.innerHTML = `

    <div class="card">

      <h3 style="margin-top:0;">
        🌽 ${esc(safra.cultura || 'Milho')}
      </h3>

      <div class="meta">
        ${esc(talhao?.nome || '')}
        ${area ? ` • ${kg(area)} ha` : ''}
      </div>


      <div
        style="
          display:grid;
          grid-template-columns:1fr 1fr;
          gap:18px;
          margin-top:22px;
        ">

        <div>
          <div class="meta">
            PRODUÇÃO DO CICLO
          </div>

          <strong style="font-size:22px;">
            ${kg(producaoCiclo)} kg
          </strong>
        </div>


        <div>
          <div class="meta">
            SACAS
          </div>

          <strong style="font-size:22px;">
            ${kg(sacas)}
          </strong>
        </div>


        <div>
          <div class="meta">
            KG / HA
          </div>

          <strong style="font-size:22px;">
            ${kg(kgHa)}
          </strong>
        </div>


        <div>
          <div class="meta">
            SACAS / HA
          </div>

          <strong style="font-size:22px;">
            ${kg(sacasHa)}
          </strong>
        </div>

      </div>

    </div>
  `;


  historico.innerHTML = colheitas.length
    ? `

      <div class="meta" style="margin-bottom:10px;">
        🌽 <strong>HISTÓRICO DA PRODUÇÃO</strong>
      </div>

      ${colheitas.map(c=>`

        <div class="card">

          <div class="card-row">

            <strong>
              ${
                c.data_colheita
                  ? c.data_colheita
                      .split('-')
                      .reverse()
                      .join('/')
                  : '-'
              }
            </strong>

            <div style="text-align:right;">

              <strong>
                ${kg(c.peso_kg)} kg
              </strong>

              ${
                c.quantidade_unidades
                  ? `
                    <div class="meta">
                      ${kg(c.quantidade_unidades)}
                      sacas
                    </div>
                  `
                  : ''
              }

            </div>

          </div>

        </div>

      `).join('')}

    `
    : `
      <div class="empty">
        Nenhuma produção registrada ainda.
      </div>
    `;
  adicionarAcoesHistoricoProducao(
  historico,
  colheitas
);

  return;
}



// ========================================
// ABACAXI
// ========================================

if(culturaNormalizada.includes('abacaxi')){

  const producaoCiclo =
    colheitas.reduce(
      (total,c)=>
        total + Number(c.peso_kg || 0),
      0
    );

  const frutos =
    colheitas.reduce(
      (total,c)=>
        total + Number(c.quantidade_frutos || 0),
      0
    );

  const pesoMedio =
    frutos
      ? producaoCiclo / frutos
      : 0;

  const produtividade =
    area
      ? producaoCiclo / area / 1000
      : 0;


  resumo.innerHTML = `

    <div class="card">

      <h3 style="margin-top:0;">
        🍍 ${esc(safra.cultura || 'Abacaxi')}
      </h3>

      <div class="meta">
        ${esc(talhao?.nome || '')}
        ${area ? ` • ${kg(area)} ha` : ''}
      </div>


      <div
        style="
          display:grid;
          grid-template-columns:1fr 1fr;
          gap:18px;
          margin-top:22px;
        ">

        <div>
          <div class="meta">
            PRODUÇÃO DO CICLO
          </div>

          <strong style="font-size:22px;">
            ${kg(producaoCiclo)} kg
          </strong>
        </div>


        <div>
          <div class="meta">
            FRUTOS COLHIDOS
          </div>

          <strong style="font-size:22px;">
            ${kg(frutos)}
          </strong>
        </div>


        <div>
          <div class="meta">
            PESO MÉDIO / FRUTO
          </div>

          <strong style="font-size:22px;">
            ${kg(pesoMedio)} kg
          </strong>
        </div>


        <div>
          <div class="meta">
            PRODUTIVIDADE
          </div>

          <strong style="font-size:22px;">
            ${kg(produtividade)} t/ha
          </strong>
        </div>

      </div>

    </div>
  `;


  historico.innerHTML = colheitas.length
    ? `

      <div class="meta" style="margin-bottom:10px;">
        🍍 <strong>HISTÓRICO DA COLHEITA</strong>
      </div>

      ${colheitas.map(c=>`

        <div class="card">

          <div class="card-row">

            <div>

              <strong>
                ${
                  c.data_colheita
                    ? c.data_colheita
                        .split('-')
                        .reverse()
                        .join('/')
                    : '-'
                }
              </strong>

              ${
                c.quantidade_frutos
                  ? `
                    <div class="meta">
                      ${kg(c.quantidade_frutos)}
                      frutos
                    </div>
                  `
                  : ''
              }

            </div>

            <strong>
              ${kg(c.peso_kg)} kg
            </strong>

          </div>

        </div>

      `).join('')}

    `
    : `
      <div class="empty">
        Nenhuma produção registrada ainda.
      </div>
    `;
  adicionarAcoesHistoricoProducao(
  historico,
  colheitas
);

  return;
}
  resumo.innerHTML = `

    <div class="card">

      <h3 style="margin-top:0;">
        🌱 ${esc(safra.cultura || 'Lavoura')}
      </h3>

      <div class="meta">
        ${esc(talhao?.nome || '')}
        ${area ? ` • ${kg(area)} ha` : ''}
      </div>

      <div
        style="
          display:grid;
          grid-template-columns:1fr 1fr;
          gap:12px;
          margin-top:18px;
        ">

        <div>
          <div class="meta">
            ESTA SEMANA
          </div>

          <strong style="font-size:22px;">
            ${kg(producao.semana)} kg
          </strong>
        </div>


        <div>
          <div class="meta">
            ESTE MÊS
          </div>

          <strong style="font-size:22px;">
            ${kg(producao.mensal)} kg
          </strong>
        </div>


        <div>
          <div class="meta">
            ESTE ANO
          </div>

          <strong style="font-size:22px;">
            ${kg(producao.anual)} kg
          </strong>
        </div>


        <div>
          <div class="meta">
            PRODUTIVIDADE
          </div>

          <strong style="font-size:22px;">
            ${kg(produtividadeHa)} t/ha
          </strong>
        </div>

      </div>

    </div>
  `;


  if(!colheitas.length){

    historico.innerHTML = `
      <div class="empty">
        Nenhuma produção registrada ainda.
      </div>
    `;

    return;
  }


  historico.innerHTML = `

    <div class="meta" style="margin-bottom:10px;">
      🧺 <strong>HISTÓRICO DE PRODUÇÃO</strong>
    </div>

    ${colheitas.map(c=>`

      <div class="card">

        <div class="card-row">

          <strong>
            ${c.data_colheita
              ? c.data_colheita
                  .split('-')
                  .reverse()
                  .join('/')
              : '-'}
          </strong>

          <strong>
            ${kg(c.peso_kg)} kg
          </strong>

        </div>

      </div>

    `).join('')}
  `;
  adicionarAcoesHistoricoProducao(
  historico,
  colheitas
);
}
function abrirRegistroProducaoProdutor(safraId){

  const safra =
    state.safras.find(
      s=>String(s.id)===String(safraId)
    );

  if(!safra){
    toast('Lavoura não encontrada');
    return;
  }


  const cultura =
    String(safra.cultura || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g,'');


  const hoje = new Date();

  const dataHoje =
    hoje.getFullYear() + '-' +
    String(hoje.getMonth()+1).padStart(2,'0') + '-' +
    String(hoje.getDate()).padStart(2,'0');


  let camposEspecificos = '';

  let unidade = 'kg';

  let tipoRegistro = 'semanal';


  // =============================
  // BANANA
  // =============================

  if(cultura.includes('banana')){

    unidade = 'cachos';
    tipoRegistro = 'colheita';

    camposEspecificos = `

      <div class="field">
        <label>🍌 Quantidade de cachos</label>

        <input
          type="number"
          id="producaoQuantidadeUnidades"
          min="0"
          step="1"
          placeholder="Ex.: 120">
      </div>


      <div class="field">
        <label>Ciclo da produção</label>

        <select id="producaoCiclo">

          <option value="1">
            1º ciclo
          </option>

          <option value="2">
            2º ciclo
          </option>

          <option value="3">
            3º ciclo
          </option>

        </select>
      </div>


      <div class="field">
        <label>Geração</label>

        <select id="producaoGeracaoBanana">

          <option value="mae">
            Mãe
          </option>

          <option value="filha">
            Filha
          </option>

          <option value="neta">
            Neta
          </option>

        </select>
      </div>

    `;
  }


  // =============================
  // MELANCIA
  // =============================

  else if(cultura.includes('melancia')){

    unidade = 'frutos';
    tipoRegistro = 'colheita';

    camposEspecificos = `

      <div class="field">
        <label>🍉 Quantidade de frutos</label>

        <input
          type="number"
          id="producaoQuantidadeFrutos"
          min="0"
          step="1"
          placeholder="Ex.: 180">
      </div>

    `;
  }


  // =============================
  // MARACUJÁ
  // =============================

  else if(cultura.includes('maracuja')){

    unidade = 'kg';
    tipoRegistro = 'semanal';

    camposEspecificos = `

      <div class="field">
        <label>🍈 Quantidade de frutos (opcional)</label>

        <input
          type="number"
          id="producaoQuantidadeFrutos"
          min="0"
          step="1"
          placeholder="Opcional">
      </div>

    `;
  }


  // =============================
  // MILHO
  // =============================

  else if(cultura.includes('milho')){

    unidade = 'sacas';
    tipoRegistro = 'colheita';

    camposEspecificos = `

      <div class="field">
        <label>🌽 Quantidade de sacas</label>

        <input
          type="number"
          id="producaoQuantidadeUnidades"
          min="0"
          step="0.01"
          placeholder="Ex.: 60">
      </div>

    `;
  }


  // =============================
  // ABACAXI
  // =============================

  else if(cultura.includes('abacaxi')){

    unidade = 'frutos';
    tipoRegistro = 'colheita';

    camposEspecificos = `

      <div class="field">
        <label>🍍 Quantidade de frutos</label>

        <input
          type="number"
          id="producaoQuantidadeFrutos"
          min="0"
          step="1"
          placeholder="Ex.: 4200">
      </div>

    `;
  }


  modal(

    '📊 Registrar produção',

    `

    <div class="card">

      <strong>
        🌱 ${esc(safra.cultura || 'Lavoura')}
      </strong>

      ${
        safra.variedade
          ? `
            <div class="meta" style="margin-top:5px;">
              ${esc(safra.variedade)}
            </div>
          `
          : ''
      }

    </div>


    <div class="field">

      <label>Data da produção / colheita</label>

      <input
        type="date"
        id="producaoData"
        value="${dataHoje}"
        required>

    </div>


    <div class="field">

      <label>Peso produzido (kg)</label>

      <input
        type="number"
        id="producaoPeso"
        min="0.01"
        step="0.01"
        placeholder="Ex.: 850"
        required>

    </div>


    ${camposEspecificos}


    <div class="field">

      <label>Observações</label>

      <textarea
        id="producaoObservacoes"
        placeholder="Opcional"></textarea>

    </div>

    `,

    async e=>{

      e.preventDefault();

      const btn =
        e.currentTarget.querySelector(
          'button[type="submit"]'
        );

      const peso =
        Number($('#producaoPeso').value);

      const data =
        $('#producaoData').value;

      if(!peso || !data){

        toast(
          'Informe a data e o peso produzido'
        );

        return;
      }


      btn.disabled=true;
      btn.textContent='SALVANDO...';


      try{

        const quantidadeFrutos =
          $('#producaoQuantidadeFrutos')
            ? Number(
                $('#producaoQuantidadeFrutos').value || 0
              )
            : null;


        const quantidadeUnidades =
          $('#producaoQuantidadeUnidades')
            ? Number(
                $('#producaoQuantidadeUnidades').value || 0
              )
            : null;


        const ciclo =
          $('#producaoCiclo')
            ? Number($('#producaoCiclo').value)
            : null;


        const geracao =
          $('#producaoGeracaoBanana')
            ? $('#producaoGeracaoBanana').value
            : null;


        const observacoes =
          $('#producaoObservacoes')
            .value
            .trim();


        await api(
          '/rest/v1/colheitas',
          {
            method:'POST',

            body:JSON.stringify({

              user_id:uid(),

              safra_id:safraId,

              data_colheita:data,

              peso_kg:peso,

              quantidade_frutos:
                quantidadeFrutos || null,

              tipo_registro:
                tipoRegistro,

              unidade:
                unidade,

              quantidade_unidades:
                quantidadeUnidades || null,

              ciclo_numero:
                ciclo,

              geracao_banana:
                geracao,

              observacoes:
                observacoes || null

            })
          }
        );


        toast(
          '✓ Produção registrada'
        );


        await loadAll();


      }catch(err){

        console.error(err);

        toast(
          'Não foi possível registrar a produção'
        );

        btn.disabled=false;
        btn.textContent='SALVAR';
      }

    }
  );
}
function renderProdutorProducao(){

  if(!isProdutor()) return;

  const select =
    $('#producaoSafraSelect');

  if(!select) return;

  const valorAtual =
    select.value;

  const safras =
    state.safras || [];

  select.innerHTML = `
    <option value="">
      Selecione uma lavoura
    </option>
  ` +
  safras.map(s=>{

    const talhao =
      state.talhoes.find(
        t=>String(t.id)===
           String(s.talhao_id)
      );

    const propriedade =
      talhao
        ? state.propriedades.find(
            p=>String(p.id)===
               String(talhao.propriedade_id)
          )
        : null;

    const cultura =
      s.cultura || 'Lavoura';

    const variedade =
      s.variedade
        ? ` • ${s.variedade}`
        : '';

    const nomeTalhao =
      talhao?.nome
        ? ` • ${talhao.nome}`
        : '';

    const nomePropriedade =
      propriedade?.nome
        ? ` • ${propriedade.nome}`
        : '';

    const encerrada =
      s.status === 'encerrada'
        ? ' • Encerrada'
        : '';

    return `
      <option value="${s.id}">
        ${esc(cultura)}
        ${esc(variedade)}
        ${esc(nomeTalhao)}
        ${esc(nomePropriedade)}
        ${encerrada}
      </option>
    `;

  }).join('');


  if(
    valorAtual &&
    safras.some(
      s=>String(s.id)===
         String(valorAtual)
    )
  ){
    select.value=valorAtual;
  }
  select.onchange=()=>{

  atualizarResumoProducaoProdutor(
    select.value
  );

};

  const btnRegistrarProducao =
  $('#registrarProducaoProdutor');

if(btnRegistrarProducao){

  btnRegistrarProducao.onclick=()=>{

    const safraId =
      select.value;

    if(!safraId){

      toast(
        'Selecione uma lavoura'
      );

      return;
    }

    abrirRegistroProducaoProdutor(
      safraId
    );
  };

}


if(!select.value && safras.length){

  select.value =
    safras[0].id;

}


atualizarResumoProducaoProdutor(
  select.value
);
}
function renderFinanceiroTecnico(){

  if(isProdutor()) return;


  const recebidoEl =
    $('#financeiroRecebidoMes');

  const receberEl =
    $('#financeiroAReceber');

  const atrasoEl =
    $('#financeiroEmAtraso');

  const listaEl =
    $('#financeiroMensalidadesLista');


  if(
    !recebidoEl ||
    !receberEl ||
    !atrasoEl ||
    !listaEl
  ){
    return;
  }


  const pagamentos =
    state.pagamentos_produtores || [];

  const produtores =
    state.produtores || [];


  const hoje =
    new Date();

  hoje.setHours(0,0,0,0);


  const mesAtual =
    hoje.getMonth() + 1;

  const anoAtual =
    hoje.getFullYear();


  const nomesMeses = [
    '',
    'Janeiro',
    'Fevereiro',
    'Março',
    'Abril',
    'Maio',
    'Junho',
    'Julho',
    'Agosto',
    'Setembro',
    'Outubro',
    'Novembro',
    'Dezembro'
  ];


  const dinheiro =
    valor =>
      Number(valor || 0)
        .toLocaleString(
          'pt-BR',
          {
            style:'currency',
            currency:'BRL'
          }
        );


  // =====================================
  // VALOR DA MENSALIDADE
  // =====================================

  function valorMensalidade(produtorId){

    const historico =
      pagamentos
        .filter(
          p =>
            String(p.produtor_id) ===
            String(produtorId)
        )
        .sort((a,b)=>{

          const ca =
            Number(a.competencia_ano || 0) *
            100 +
            Number(a.competencia_mes || 0);

          const cb =
            Number(b.competencia_ano || 0) *
            100 +
            Number(b.competencia_mes || 0);

          return cb - ca;
        });


    return Number(
      historico[0]?.valor || 400
    );
  }


  // =====================================
  // PAGAMENTOS DO MÊS
  // =====================================

  const pagamentosMes =
    pagamentos.filter(
      p =>
        Number(p.competencia_mes) ===
          mesAtual &&
        Number(p.competencia_ano) ===
          anoAtual &&
        String(p.status || '')
          .toLowerCase() === 'pago'
    );
const pagamentosRecebidosMes =
  pagamentos.filter(p=>{

    if(
      String(p.status || '')
        .toLowerCase() !== 'pago'
    ){
      return false;
    }

    if(!p.data_pagamento){
      return false;
    }

    const partes =
      String(p.data_pagamento)
        .split('-');

    return (
      Number(partes[0]) === anoAtual &&
      Number(partes[1]) === mesAtual
    );
  });

  const recebidoMes =
    pagamentosRecebidosMes.reduce(
      (total,p)=>
        total + Number(p.valor || 0),
      0
    );


  // vencimento 28 + 5 dias de prazo

  const limitePagamento =
    new Date(
      anoAtual,
      mesAtual - 1,
      28
    );

  limitePagamento.setDate(
    limitePagamento.getDate() + 5
  );

  limitePagamento.setHours(
    23,59,59,999
  );


  let totalReceber = 0;
  let totalAtraso = 0;


  const mensalidades =
    produtores.map(produtor=>{

      const pagamento =
        pagamentosMes.find(
          p =>
            String(p.produtor_id) ===
            String(produtor.id)
        );


      const valor =
        pagamento
          ? Number(pagamento.valor || 0)
          : valorMensalidade(
              produtor.id
            );


      let status =
        'receber';


      if(pagamento){

        status =
          'pago';

      }else if(
        hoje > limitePagamento
      ){

        status =
          'atraso';

        totalAtraso += valor;

      }else{

        totalReceber += valor;
      }


      return {
        produtor,
        pagamento,
        valor,
        status
      };

    });


  recebidoEl.textContent =
    dinheiro(recebidoMes);

  receberEl.textContent =
    dinheiro(totalReceber);

  atrasoEl.textContent =
    dinheiro(totalAtraso);


  // =====================================
  // LISTA
  // =====================================

  if(!mensalidades.length){

    listaEl.innerHTML = `
      <div class="empty">
        Nenhum produtor cadastrado.
      </div>
    `;

    return;
  }


  const ordemStatus = {
    atraso:0,
    receber:1,
    pago:2
  };


  mensalidades.sort(
    (a,b)=>
      ordemStatus[a.status] -
      ordemStatus[b.status]
  );


  listaEl.innerHTML =

    mensalidades
      .map(item=>{

        let texto =
          '🟡 A RECEBER';

        let fundo =
          '#fff7dc';

        let cor =
          '#806514';


        if(item.status === 'pago'){

          texto =
            '✅ PAGO';

          fundo =
            '#eaf6ee';

          cor =
            '#287147';
        }


        if(item.status === 'atraso'){

          texto =
            '🔴 EM ATRASO';

          fundo =
            '#fff0ef';

          cor =
            '#b63b32';
        }


        return `

         <div
  class="card card-click"
  data-financeiro-produtor="${
    esc(item.produtor.id)
  }">

            <div class="card-row">

              <div>

                <h4 style="margin:0;">
                  👨‍🌾 ${
                    esc(
                      item.produtor.nome ||
                      'Produtor'
                    )
                  }
                </h4>

                <div
                  class="meta"
                  style="margin-top:5px;">

                  ${
                    nomesMeses[mesAtual]
                  }/${anoAtual}

                </div>

                ${
                  item.pagamento?.data_pagamento
                    ? `
                      <div class="meta">
                        Pago em:
                        ${dateBR(
                          item.pagamento
                            .data_pagamento
                        )}
                      </div>
                    `
                    : `
                      <div class="meta">
                        Vencimento:
                        28/${String(
                          mesAtual
                        ).padStart(2,'0')}/${anoAtual}
                      </div>
                    `
                }

              </div>


              <div
                style="
                  text-align:right;
                ">

                <strong
                  style="
                    font-size:18px;
                  ">
                  ${dinheiro(
                    item.valor
                  )}
                </strong>

                <div
                  style="
                    margin-top:7px;
                    padding:6px 9px;
                    border-radius:20px;
                    font-size:11px;
                    font-weight:800;
                    background:${fundo};
                    color:${cor};
                    white-space:nowrap;
                  ">
                  ${texto}
                </div>

              </div>

            </div>

            <div class="edit-hint">
              Toque para abrir o produtor
            </div>

          </div>
        `;

      })
      .join('');
}
function renderAll(){
 $('#sProd').textContent=state.produtores.length;$('#sProp').textContent=state.propriedades.length;$('#sTal').textContent=state.talhoes.length;$('#sSaf').textContent=state.safras.filter(s=>s.status!=='encerrada').length;
 renderProdutores();renderPropriedades();renderTalhoes();renderSafras();renderCadastroCampo();renderAtividadesTG();if(isProdutor()){renderProdutorLavoura();renderProdutorManejos();renderProdutorProtocolo();renderProdutorHistorico();renderProdutorFicha();renderProdutorInicio();}renderDash();
renderFinanceiroTecnico();renderProdutorFinanceiro();renderProdutorProducao();atualizarStatusFinanceiro();
}
// =====================================================
// DADOS DO NOVO PAINEL INICIAL
// =====================================================

function manejosDashboardTG(){

  const lista=[];

  state.adubacoes.forEach(a=>{
    lista.push({
      ...a,
      origem:'adubacao',
      tipo:'Adubação'
    });
  });

  state.aplicacoes.forEach(a=>{
    lista.push({
      ...a,
      origem:'aplicacao',
      tipo:'Borrifação'
    });
  });

  return lista;
}


function estruturaProdutorTG(produtorId){

  const propriedades=
    state.propriedades.filter(
      p=>String(p.produtor_id)===
         String(produtorId)
    );

  const propIds=
    new Set(
      propriedades.map(
        p=>String(p.id)
      )
    );

  const talhoes=
    state.talhoes.filter(
      t=>propIds.has(
        String(t.propriedade_id)
      )
    );

  const talhaoIds=
    new Set(
      talhoes.map(
        t=>String(t.id)
      )
    );

  const safras=
    state.safras.filter(
      s=>talhaoIds.has(
        String(s.talhao_id)
      )
    );

  const safraIds=
    new Set(
      safras.map(
        s=>String(s.id)
      )
    );

  const colheitas=
    state.colheitas.filter(
      c=>safraIds.has(
        String(c.safra_id)
      )
    );

  const manejos=
    manejosDashboardTG().filter(
      m=>safraIds.has(
        String(m.safra_id)
      )
    );

  return {
    propriedades,
    talhoes,
    safras,
    safraIds,
    colheitas,
    manejos
  };
}


function producaoPeriodosTG(colheitas){

  const hoje=hojeLocalISO();

  const agora=
    new Date();

  const diaSemana=
    agora.getDay()||7;

  const inicioSemana=
    new Date(agora);

  inicioSemana.setDate(
    agora.getDate()-diaSemana+1
  );


  function isoLocal(d){

    return [
      d.getFullYear(),
      String(
        d.getMonth()+1
      ).padStart(2,'0'),
      String(
        d.getDate()
      ).padStart(2,'0')
    ].join('-');
  }


  const iniSemana=
    isoLocal(inicioSemana);

  const mes=
    hoje.slice(0,7);

  const ano=
    hoje.slice(0,4);


  let semana=0;
  let mensal=0;
  let anual=0;
  let acumulado=0;


  colheitas.forEach(c=>{

    const data=
      c.data_colheita||'';

    const kg=
      Number(c.peso_kg||0);

    acumulado+=kg;


    if(
      data>=iniSemana &&
      data<=hoje
    ){
      semana+=kg;
    }


    if(
      data.startsWith(mes)
    ){
      mensal+=kg;
    }


    if(
      data.startsWith(ano)
    ){
      anual+=kg;
    }
  });


  return {
    semana,
    mensal,
    anual,
    acumulado
  };
}


function produtoManejoDashboardTG(m){

  try{

    const bruto=
      m.origem==='adubacao'
        ?m.produto
        :m.produto_comercial;

    const itens=
      JSON.parse(bruto||'');

    if(Array.isArray(itens)){

      const nomes=
        itens
          .filter(x=>x.produto)
          .map(x=>x.produto);

      if(nomes.length){
        return nomes.join(' + ');
      }
    }

  }catch(_){}


  if(m.origem==='adubacao'){
    return m.produto||'Adubação';
  }

  return (
    m.produto_comercial ||
    m.finalidade ||
    'Borrifação'
  );
}


// =====================================================
// RELATÓRIO TÉCNICO DO PRODUTOR
// =====================================================

function viewRelatorioProdutorTG(id){

  const produtor=
    state.produtores.find(
      p=>String(p.id)===String(id)
    );

  if(!produtor){

    toast(
      'Produtor não encontrado'
    );

    return;
  }


  const dados=
    estruturaProdutorTG(id);

  const producao=
    producaoPeriodosTG(
      dados.colheitas
    );


  const safrasAtivas=
    dados.safras.filter(
      s=>String(
        s.status||'ativa'
      ).toLowerCase()!=='encerrada'
    );


  const atividadesPendentes=
    dados.manejos
      .filter(
        m=>statusManejoTG(m)!==
           'realizado'
      )
      .sort((a,b)=>
        (a.data_aplicacao||'')
          .localeCompare(
            b.data_aplicacao||''
          )
      );


  const areaTotal=
    dados.propriedades.reduce(
      (n,p)=>
        n+
        Number(
          p.area_total_ha||0
        ),
      0
    );


  const w=
    $('#modalWrap');

  w.className=
    'modal-backdrop';


  w.innerHTML=`

    <div class="modal">

      <div class="modal-head">

        <h3>
          Relatório técnico
        </h3>

        <button
          class="close"
          id="closeModal">
          ×
        </button>

      </div>


      <!-- PRODUTOR -->

      <div class="card">

        <h2 style="margin-top:0;">
          👨‍🌾 ${esc(produtor.nome)}
        </h2>

        <div class="meta">
          ${
            esc(
              produtor.municipio||
              'Município não informado'
            )
          }
          •
          ${esc(produtor.estado||'AM')}
        </div>

        ${
          produtor.localidade
          ?`
            <div class="meta">
              📍 ${esc(produtor.localidade)}
            </div>
          `
          :''
        }

      </div>


      <!-- RESUMO -->

      <div
        style="
          display:grid;
          grid-template-columns:1fr 1fr;
          gap:10px;
        ">

        <div
          class="card"
          style="margin:0;">

          <div class="meta">
            Propriedades
          </div>

          <h2 style="margin:5px 0;">
            ${dados.propriedades.length}
          </h2>

        </div>


        <div
          class="card"
          style="margin:0;">

          <div class="meta">
            Talhões
          </div>

          <h2 style="margin:5px 0;">
            ${dados.talhoes.length}
          </h2>

        </div>


        <div
          class="card"
          style="margin:0;">

          <div class="meta">
            Lavouras ativas
          </div>

          <h2 style="margin:5px 0;">
            ${safrasAtivas.length}
          </h2>

        </div>


        <div
          class="card"
          style="margin:0;">

          <div class="meta">
            Área cadastrada
          </div>

          <h2 style="margin:5px 0;">
            ${
              areaTotal.toLocaleString(
                'pt-BR',
                {
                  maximumFractionDigits:2
                }
              )
            } ha
          </h2>

        </div>

      </div>


      <!-- PROPRIEDADES -->

      <h3 style="margin-top:22px;">
        🏡 Propriedades
      </h3>

      ${
        dados.propriedades.length
        ?dados.propriedades.map(p=>`

          <div class="card">

            <h4>
              ${esc(p.nome)}
            </h4>

            <div class="meta">

              ${esc(
                p.municipio||
                ''
              )}

              ${
                p.comunidade
                  ?' • '+esc(p.comunidade)
                  :''
              }

            </div>

            <div class="meta">

              Área:
              ${
                Number(
                  p.area_total_ha||0
                )
                .toLocaleString(
                  'pt-BR'
                )
              } ha

            </div>

          </div>

        `).join('')
        :`
          <div class="empty">
            Nenhuma propriedade cadastrada.
          </div>
        `
      }


      <!-- TALHÕES -->

      <h3>
        🌱 Talhões
      </h3>

      ${
        dados.talhoes.length
        ?dados.talhoes.map(t=>{

          const prop=
            state.propriedades.find(
              p=>String(p.id)===
                 String(t.propriedade_id)
            );

          return `

            <div class="card">

              <h4>
                ${esc(t.nome)}
              </h4>

              <div class="meta">
                ${esc(
                  prop?.nome||
                  'Propriedade'
                )}
              </div>

              <div class="meta">

                Área:
                ${
                  Number(
                    t.area_ha||0
                  )
                  .toLocaleString(
                    'pt-BR'
                  )
                } ha

              </div>

            </div>
          `;

        }).join('')
        :`
          <div class="empty">
            Nenhum talhão cadastrado.
          </div>
        `
      }


      <!-- LAVOURAS -->

      <h3>
        🌾 Lavouras
      </h3>

      ${
        safrasAtivas.length
        ?safrasAtivas.map(s=>{

          const t=
            talhaoOfSafra(s);

          const prop=
            t
            ?state.propriedades.find(
              p=>String(p.id)===
                 String(t.propriedade_id)
            )
            :null;

          const r=
            resumoTecnicoSafra(s);

          return `

            <div class="card">

              <div class="card-row">

                <div>

                  <h4>
                    ${esc(s.cultura)}
                    ${
                      s.variedade
                        ?' • '+esc(s.variedade)
                        :''
                    }
                  </h4>

                  <div class="meta">

                    ${esc(
                      prop?.nome||
                      ''
                    )}

                    ${
                      t?.nome
                        ?' • '+esc(t.nome)
                        :''
                    }

                  </div>

                  <div class="meta">
                    Plantio:
                    ${dateBR(
                      s.data_plantio
                    )}
                  </div>

                </div>

                <span class="pill">
                  ativa
                </span>

              </div>


              <div
                class="kpi-line"
                style="margin-top:10px;">

                <span class="pill gold">

                  ${
                    Number(
                      r.totalKg||0
                    ).toLocaleString(
                      'pt-BR',
                      {
                        maximumFractionDigits:1
                      }
                    )
                  } kg

                </span>

                <span class="pill">

                  ${
                    Number(
                      r.tha||0
                    )
                    .toFixed(2)
                    .replace('.',',')
                  } t/ha

                </span>

              </div>

            </div>
          `;

        }).join('')
        :`
          <div class="empty">
            Nenhuma lavoura ativa.
          </div>
        `
      }


      <!-- ATIVIDADES -->

      <h3>
        📋 Atividades pendentes
      </h3>

      ${
        atividadesPendentes.length
        ?atividadesPendentes
          .slice(0,8)
          .map(m=>{

            const ctx=
              contextoSafra(
                m.safra_id
              );

            const status=
              statusManejoTG(m);

            let texto='Programada';
            let classe='gold';

            if(status==='hoje'){
              texto='Hoje';
            }

            if(status==='atrasado'){
              texto='Atrasada';
              classe='red';
            }

            return `

              <div class="card">

                <div class="card-row">

                  <div>

                    <h4>
                      ${esc(m.tipo)}
                    </h4>

                    <div class="meta">
                      ${
                        esc(
                          ctx.safra?.cultura||
                          'Lavoura'
                        )
                      }
                    </div>

                    <div class="meta">

                      ${
                        esc(
                          ctx.propriedade?.nome||
                          ''
                        )
                      }

                      ${
                        ctx.talhao?.nome
                          ?' • '+
                           esc(ctx.talhao.nome)
                          :''
                      }

                    </div>

                    <div class="meta">
                      ${
                        esc(
                          produtoManejoDashboardTG(m)
                        )
                      }
                    </div>

                    <div class="meta">
                      ${dateBR(
                        m.data_aplicacao
                      )}
                    </div>

                  </div>

                  <span
                    class="pill ${classe}">
                    ${texto}
                  </span>

                </div>

              </div>
            `;

          }).join('')
        :`
          <div class="empty">
            Nenhuma atividade pendente.
          </div>
        `
      }


      <!-- PRODUÇÃO -->

      <h3>
        📊 Produção
      </h3>

      <div
        style="
          display:grid;
          grid-template-columns:1fr 1fr;
          gap:10px;
        ">

        <div
          class="card"
          style="margin:0;">

          <div class="meta">
            Esta semana
          </div>

          <h3>
            ${
              producao.semana
                .toLocaleString(
                  'pt-BR',
                  {
                    maximumFractionDigits:1
                  }
                )
            } kg
          </h3>

        </div>


        <div
          class="card"
          style="margin:0;">

          <div class="meta">
            Este mês
          </div>

          <h3>
            ${
              producao.mensal
                .toLocaleString(
                  'pt-BR',
                  {
                    maximumFractionDigits:1
                  }
                )
            } kg
          </h3>

        </div>


        <div
          class="card"
          style="margin:0;">

          <div class="meta">
            Este ano
          </div>

          <h3>
            ${
              producao.anual
                .toLocaleString(
                  'pt-BR',
                  {
                    maximumFractionDigits:1
                  }
                )
            } kg
          </h3>

        </div>


        <div
          class="card"
          style="margin:0;">

          <div class="meta">
            Acumulado
          </div>

          <h3>
            ${
              producao.acumulado
                .toLocaleString(
                  'pt-BR',
                  {
                    maximumFractionDigits:1
                  }
                )
            } kg
          </h3>

        </div>

      </div>

    </div>
  `;


  $('#closeModal').onclick=
    closeModal;
}


// =====================================================
// NOVA TELA INICIAL
// =====================================================

function renderDash(){

  const produtoresEl=
    $('#dashboardProdutoresLista');

  const atividadesEl=
    $('#dashboardAtividadesLista');

  const produtividadeEl=
    $('#dashboardProdutividadeLista');


  if(
    !produtoresEl ||
    !atividadesEl ||
    !produtividadeEl
  ){
    return;
  }


  const manejos=
    manejosDashboardTG();


  const pendentes=
    manejos.filter(
      m=>statusManejoTG(m)!==
         'realizado'
    );


  // =========================
  // CONTADORES DO TOPO
  // =========================

  const sProd=
    $('#sProd');

  if(sProd){
    sProd.textContent=
      state.produtores.length;
  }


  const atividadesTotal=
    $('#dashboardAtividadesTotal');

  if(atividadesTotal){

    atividadesTotal.textContent=
      pendentes.length;
  }


  // =========================
  // PRODUÇÃO TOTAL
  // =========================

  const producaoGeral=
    producaoPeriodosTG(
      state.colheitas
    );


  const semanaEl=
    $('#dashboardProducaoSemana');

  const mesEl=
    $('#dashboardProducaoMes');

  const anoEl=
    $('#dashboardProducaoAno');


  if(semanaEl){

    semanaEl.textContent=
      producaoGeral.semana
        .toLocaleString(
          'pt-BR',
          {
            maximumFractionDigits:1
          }
        )+' kg';
  }


  if(mesEl){

    mesEl.textContent=
      producaoGeral.mensal
        .toLocaleString(
          'pt-BR',
          {
            maximumFractionDigits:1
          }
        )+' kg';
  }


  if(anoEl){

    anoEl.textContent=
      producaoGeral.anual
        .toLocaleString(
          'pt-BR',
          {
            maximumFractionDigits:1
          }
        )+' kg';
  }


  // =========================
  // PRODUTORES E FICHAS
  // =========================

  if(!state.produtores.length){

    produtoresEl.innerHTML=`
      <div class="empty">
        Nenhum produtor cadastrado.
      </div>
    `;

  }else{

    produtoresEl.innerHTML=
      state.produtores
        .slice(0,4)
        .map(p=>{

          const dados=
            estruturaProdutorTG(
              p.id
            );


          const ativas=
            dados.safras.filter(
              s=>String(
                s.status||'ativa'
              ).toLowerCase()!==
                'encerrada'
            );


          const pend=
            dados.manejos.filter(
              m=>statusManejoTG(m)!==
                 'realizado'
            );


          const culturas=[
            ...new Set(
              ativas
                .map(s=>s.cultura)
                .filter(Boolean)
            )
          ];


          return `

            <div
              class="card card-click"
              data-relatorio-produtor="${esc(p.id)}">

              <div class="card-row">

                <div>

                  <h4>
                    👨‍🌾 ${esc(p.nome)}
                  </h4>

                  <div class="meta">

                    ${
                      esc(
                        p.municipio||
                        'Município não informado'
                      )
                    }

                    •
                    ${esc(p.estado||'AM')}

                  </div>

                  <div
                    class="meta"
                    style="margin-top:5px;">

                    ${dados.propriedades.length}
                    propriedade(s)

                    •

                    ${dados.talhoes.length}
                    talhão(ões)

                  </div>

                  <div class="meta">

                    ${ativas.length}
                    lavoura(s) ativa(s)

                  </div>

                  ${
                    culturas.length
                    ?`
                      <div class="meta">
                        Cultura:
                        <strong>
                          ${esc(
                            culturas.join(', ')
                          )}
                        </strong>
                      </div>
                    `
                    :''
                  }

                </div>


                <span
                  class="pill ${
                    pend.length
                      ?'gold'
                      :''
                  }">

                  ${pend.length}
                  pend.

                </span>

              </div>


              <div class="edit-hint">
                Toque para abrir o relatório
              </div>

            </div>
          `;

        }).join('');
  }


  // =========================
  // ATIVIDADES
  // =========================

  const ordemStatus={
    atrasado:0,
    hoje:1,
    programado:2
  };


  const atividadesOrdenadas=
    [...pendentes]
      .sort((a,b)=>{

        const sa=
          statusManejoTG(a);

        const sb=
          statusManejoTG(b);

        const oa=
          ordemStatus[sa]??9;

        const ob=
          ordemStatus[sb]??9;

        if(oa!==ob){
          return oa-ob;
        }

        return (
          a.data_aplicacao||''
        ).localeCompare(
          b.data_aplicacao||''
        );
      });


  if(!atividadesOrdenadas.length){

    atividadesEl.innerHTML=`
      <div class="empty">
        Nenhuma atividade pendente.
      </div>
    `;

  }else{

    atividadesEl.innerHTML=
      atividadesOrdenadas
        .slice(0,5)
        .map(m=>{

          const ctx=
            contextoSafra(
              m.safra_id
            );

          const status=
            statusManejoTG(m);


          let textoStatus=
            'Programada';

          let classe=
            'gold';


          if(status==='hoje'){

            textoStatus='Hoje';
          }


          if(status==='atrasado'){

            textoStatus='Atrasada';

            classe='red';
          }


          return `

            <div class="card">

              <div class="card-row">

                <div>

                  <h4>
                    ${esc(m.tipo)}
                  </h4>

                  <div class="meta">

                    <strong>
                      ${
                        esc(
                          ctx.produtor?.nome||
                          'Produtor'
                        )
                      }
                    </strong>

                  </div>

                  <div class="meta">

                    ${
                      esc(
                        ctx.safra?.cultura||
                        'Lavoura'
                      )
                    }

                    ${
                      ctx.safra?.variedade
                        ?' • '+
                         esc(
                           ctx.safra.variedade
                         )
                        :''
                    }

                  </div>

                  <div class="meta">

                    ${
                      esc(
                        ctx.propriedade?.nome||
                        ''
                      )
                    }

                    ${
                      ctx.talhao?.nome
                        ?' • '+
                         esc(ctx.talhao.nome)
                        :''
                    }

                  </div>

                  <div
                    class="meta"
                    style="margin-top:5px;">

                    ${
                      esc(
                        produtoManejoDashboardTG(m)
                      )
                    }

                  </div>

                  <div class="meta">

                    Data:
                    ${dateBR(
                      m.data_aplicacao
                    )}

                  </div>

                </div>


                <span
                  class="pill ${classe}">

                  ${textoStatus}

                </span>

              </div>

            </div>
          `;

        }).join('');
  }


  // =========================
  // PRODUTIVIDADE POR PRODUTOR
  // =========================

  const ranking=
    state.produtores
      .map(p=>{

        const dados=
          estruturaProdutorTG(
            p.id
          );

        const prod=
          producaoPeriodosTG(
            dados.colheitas
          );

        const culturas=[
          ...new Set(
            dados.safras
              .filter(
                s=>String(
                  s.status||'ativa'
                ).toLowerCase()!==
                  'encerrada'
              )
              .map(s=>s.cultura)
              .filter(Boolean)
          )
        ];

        return {
          produtor:p,
          dados,
          prod,
          culturas
        };

      })
      .sort(
        (a,b)=>
          b.prod.anual-
          a.prod.anual
      );


  if(!ranking.length){

    produtividadeEl.innerHTML=`
      <div class="empty">
        Nenhum produtor cadastrado.
      </div>
    `;

  }else{

    produtividadeEl.innerHTML=
      ranking
        .slice(0,5)
        .map(r=>`

          <div
            class="card card-click"
            data-relatorio-produtor="${
              esc(r.produtor.id)
            }">

            <div class="card-row">

              <div>

                <h4>
                  👨‍🌾 ${
                    esc(
                      r.produtor.nome
                    )
                  }
                </h4>

                <div class="meta">

                  🌱 ${
                    r.culturas.length
                      ?esc(
                        r.culturas.join(', ')
                      )
                      :'Sem lavoura ativa'
                  }

                </div>

              </div>


              <span class="pill gold">

                ${
                  r.prod.anual
                    .toLocaleString(
                      'pt-BR',
                      {
                        maximumFractionDigits:1
                      }
                    )
                } kg/ano

              </span>

            </div>


            <div
              style="
                display:grid;
                grid-template-columns:1fr 1fr 1fr;
                gap:8px;
                margin-top:14px;
              ">

              <div>

                <div class="meta">
                  Semana
                </div>

                <strong>
                  ${
                    r.prod.semana
                      .toLocaleString(
                        'pt-BR',
                        {
                          maximumFractionDigits:1
                        }
                      )
                  } kg
                </strong>

              </div>


              <div>

                <div class="meta">
                  Mês
                </div>

                <strong>
                  ${
                    r.prod.mensal
                      .toLocaleString(
                        'pt-BR',
                        {
                          maximumFractionDigits:1
                        }
                      )
                  } kg
                </strong>

              </div>


              <div>

                <div class="meta">
                  Acumulado
                </div>

                <strong>
                  ${
                    r.prod.acumulado
                      .toLocaleString(
                        'pt-BR',
                        {
                          maximumFractionDigits:1
                        }
                      )
                  } kg
                </strong>

              </div>

            </div>


            <div class="edit-hint">
              Toque para ver o histórico técnico
            </div>

          </div>

        `).join('');
  }


  // =========================
  // CLIQUES
  // =========================

  document
    .querySelectorAll(
      '[data-relatorio-produtor]'
    )
    .forEach(card=>{

      card.onclick=()=>{

        viewRelatorioProdutorTG(
          card.dataset.relatorioProdutor
        );
      };
    });


  const prodBtn=
    $('#dashboardProdutoresBtn');

  const verProd=
    $('#dashboardVerProdutores');


  const abrirProdutores=()=>{

    produtoresEl.scrollIntoView({
      behavior:'smooth',
      block:'start'
    });
  };


  if(prodBtn){
    prodBtn.onclick=
      abrirProdutores;
  }

  if(verProd){
    verProd.onclick=
      abrirProdutores;
  }


  const atividadesBtn=
    $('#dashboardAtividadesBtn');

  const verAtividades=
    $('#dashboardVerAtividades');


  const abrirAtividades=()=>{

    atividadesEl.scrollIntoView({
      behavior:'smooth',
      block:'start'
    });
  };


  if(atividadesBtn){
    atividadesBtn.onclick=
      abrirAtividades;
  }

  if(verAtividades){
    verAtividades.onclick=
      abrirAtividades;
  }


  const produtividadeBtn=
    $('#dashboardProdutividadeBtn');

  const verProdutividade=
    $('#dashboardVerProdutividade');


  const abrirProdutividade=()=>{

    produtividadeEl.scrollIntoView({
      behavior:'smooth',
      block:'start'
    });
  };


  if(produtividadeBtn){
    produtividadeBtn.onclick=
      abrirProdutividade;
  }

  if(verProdutividade){
    verProdutividade.onclick=
      abrirProdutividade;
  }


  const antigo=
    $('#dashSafras');

  if(antigo){
    antigo.innerHTML='';
  }
}
function renderProdutores(){const el=$('#produtoresList');el.innerHTML=state.produtores.length?state.produtores.map(p=>`<div class="card card-click" data-edit-produtor="${p.id}"><div class="card-row"><div><h4>${esc(p.nome)}</h4><div class="meta">${esc(p.municipio||'Município não informado')} • ${esc(p.estado||'')}</div><div class="meta">${esc(p.telefone||'Sem telefone')}</div><div class="meta">CPF/CNPJ: ${esc(p.cpf_cnpj||'Não informado')}</div></div><span class="pill">${state.propriedades.filter(x=>x.produtor_id===p.id).length} prop.</span></div><div class="edit-hint">Toque para abrir e editar</div></div>`).join(''):'<div class="empty">Nenhum produtor cadastrado.</div>'}
function renderPropriedades(){const el=$('#propriedadesList');el.innerHTML=state.propriedades.length?state.propriedades.map(p=>`<div class="card card-click" data-edit-propriedade="${p.id}"><div class="card-row"><div><h4>${esc(p.nome)}</h4><div class="meta">Produtor: ${esc(nameBy(state.produtores,p.produtor_id))}</div><div class="meta">${esc(p.municipio||'')} • ${Number(p.area_total_ha||0).toLocaleString('pt-BR')} ha</div><div class="meta">Protocolo: ${esc(p.protocolo||'automático')}</div></div><span class="pill gold">${state.talhoes.filter(t=>t.propriedade_id===p.id).length} talhões</span></div><div class="edit-hint">Toque para abrir e editar</div></div>`).join(''):'<div class="empty">Nenhuma propriedade cadastrada.</div>'}
function renderCadastroCampo(){

  const talhoesEl=
    $('#cadastroTalhoesList');

  const lavourasEl=
    $('#cadastroLavourasList');


  // =====================================
  // TALHÕES
  // =====================================

  if(talhoesEl){

    if(!state.talhoes.length){

      talhoesEl.innerHTML=`
        <div class="empty">
          Nenhum talhão cadastrado.
        </div>
      `;

    }else{

      talhoesEl.innerHTML=
        state.talhoes.map(t=>{

          const propriedade=
            state.propriedades.find(
              p=>String(p.id)===
                 String(t.propriedade_id)
            );

          const produtor=
            propriedade
              ?state.produtores.find(
                p=>String(p.id)===
                   String(propriedade.produtor_id)
              )
              :null;

          const lavouras=
            state.safras.filter(
              s=>String(s.talhao_id)===
                 String(t.id)
            );

          return `

            <div
              class="card card-click"
              data-edit-talhao="${esc(t.id)}">

              <div class="card-row">

                <div>

                  <h4>
                    🌱 ${esc(t.nome)}
                  </h4>

                  <div class="meta">
                    🏡
                    ${
                      esc(
                        propriedade?.nome||
                        'Propriedade não informada'
                      )
                    }
                  </div>

                  <div class="meta">
                    👨‍🌾
                    ${
                      esc(
                        produtor?.nome||
                        'Produtor não informado'
                      )
                    }
                  </div>

                  <div
                    class="meta"
                    style="margin-top:6px;">

                    Área:
                    <strong>
                      ${
                        Number(
                          t.area_ha||0
                        ).toLocaleString(
                          'pt-BR'
                        )
                      } ha
                    </strong>

                  </div>

                </div>


                <span class="pill gold">

                  ${lavouras.length}
                  lavoura(s)

                </span>

              </div>


              <div class="edit-hint">
                Toque para abrir o talhão
              </div>

            </div>
          `;

        }).join('');
    }
  }


  // =====================================
  // LAVOURAS
  // =====================================

  if(lavourasEl){

    if(!state.safras.length){

      lavourasEl.innerHTML=`
        <div class="empty">
          Nenhuma lavoura cadastrada.
        </div>
      `;

    }else{

      lavourasEl.innerHTML=
        state.safras.map(s=>{

          const talhao=
            state.talhoes.find(
              t=>String(t.id)===
                 String(s.talhao_id)
            );

          const propriedade=
            talhao
              ?state.propriedades.find(
                p=>String(p.id)===
                   String(talhao.propriedade_id)
              )
              :null;

          const produtor=
            propriedade
              ?state.produtores.find(
                p=>String(p.id)===
                   String(propriedade.produtor_id)
              )
              :null;

          const idade=
            ageDays(
              s.data_plantio
            );

          const kg=
            prodTotal(
              s.id
            );

          const prod=
            produtividade(
              s
            );

          const ativa=
            String(
              s.status||'ativa'
            ).toLowerCase()!=='encerrada';


          return `

            <div
              class="card card-click"
              data-edit-safra="${esc(s.id)}">

              <div class="card-row">

                <div>

                  <h4>
                    🌾 ${esc(
                      s.cultura||
                      'Lavoura'
                    )}

                    ${
                      s.variedade
                        ?' • '+esc(s.variedade)
                        :''
                    }
                  </h4>


                  <div class="meta">
                    👨‍🌾
                    ${
                      esc(
                        produtor?.nome||
                        'Produtor não informado'
                      )
                    }
                  </div>


                  <div class="meta">
                    🏡
                    ${
                      esc(
                        propriedade?.nome||
                        'Propriedade'
                      )
                    }
                  </div>


                  <div class="meta">
                    🌱
                    ${
                      esc(
                        talhao?.nome||
                        'Talhão'
                      )
                    }
                  </div>


                  <div
                    class="meta"
                    style="margin-top:6px;">

                    Plantio:
                    ${
                      dateBR(
                        s.data_plantio
                      )
                    }

                  </div>

                </div>


                <span
                  class="pill ${
                    ativa
                      ?''
                      :'red'
                  }">

                  ${
                    ativa
                      ?'Ativa'
                      :'Encerrada'
                  }

                </span>

              </div>


              <div
                class="kpi-line"
                style="margin-top:12px;">

                <span class="pill">

                  ${
                    idade===null
                      ?'Idade —'
                      :idade+' dias'
                  }

                </span>

                <span class="pill gold">

                  ${
                    kg.toLocaleString(
                      'pt-BR',
                      {
                        maximumFractionDigits:1
                      }
                    )
                  } kg

                </span>

                <span class="pill">

                  ${
                    prod
                      .toFixed(2)
                      .replace('.',',')
                  } t/ha

                </span>

              </div>


              <div class="edit-hint">
                Toque para abrir a lavoura
              </div>

            </div>
          `;

        }).join('');
    }
  }
}
function renderTalhoes(){const el=$('#talhoesList');el.innerHTML=state.talhoes.length?state.talhoes.map(t=>`<div class="card card-click" data-edit-talhao="${t.id}"><div class="card-row"><div><h4>${esc(t.nome)}</h4><div class="meta">${esc(nameBy(state.propriedades,t.propriedade_id))}</div><div class="meta">Área: ${Number(t.area_ha||0).toLocaleString('pt-BR')} ha</div></div><span class="pill">${state.safras.filter(s=>s.talhao_id===t.id).length} safra(s)</span></div><div class="edit-hint">Toque para abrir e editar</div></div>`).join(''):'<div class="empty">Nenhum talhão cadastrado.</div>'}
function safraCard(s,compact=false){const t=talhaoOfSafra(s),p=t?state.propriedades.find(x=>x.id===t.propriedade_id):null,age=ageDays(s.data_plantio),kg=prodTotal(s.id),prod=produtividade(s);return `<div class="card"><div class="card-row card-click" data-edit-safra="${s.id}"><div><h4>${esc(s.cultura)} ${s.variedade?`• ${esc(s.variedade)}`:''}</h4><div class="meta">${esc(p?.nome||'')} • ${esc(t?.nome||'')}</div><div class="kpi-line"><span class="pill">${age===null?'idade —':age+' dias'}</span><span class="pill gold">${kg.toLocaleString('pt-BR')} kg</span><span class="pill">${prod.toFixed(2).replace('.',',')} t/ha</span></div><div class="edit-hint">Toque para abrir e editar</div></div><span class="pill ${s.status==='encerrada'?'red':''}">${esc(s.status||'ativa')}</span></div>${compact?'':`<div class="actions"><button class="mini-btn" data-action="adubacao" data-sid="${s.id}">+ Adubação</button><button class="mini-btn" data-action="aplicacao" data-sid="${s.id}">+ Aplicação</button><button class="mini-btn" data-action="colheita" data-sid="${s.id}">+ Colheita</button></div>`}</div>`}
function renderSafras(){const el=$('#safrasList');el.innerHTML=state.safras.length?state.safras.map(s=>safraCard(s)).join(''):'<div class="empty">Nenhuma lavoura cadastrada.</div>'}
function renderProdutorLavoura(){
  const el=$('#produtorLavouraContent');
  if(!el)return;

  if(!state.safras.length){
    el.innerHTML=
      '<div class="empty">Nenhuma lavoura cadastrada.</div>';
    return;
  }

  el.innerHTML=state.safras.map(s=>{

    const t=state.talhoes.find(
      x=>String(x.id)===String(s.talhao_id)
    );

    const p=t
      ?state.propriedades.find(
        x=>String(x.id)===String(t.propriedade_id)
      )
      :null;

    const idade=ageDays(s.data_plantio);

    const r=resumoTecnicoSafra(s);

    const espacamento=
      s.espacamento_linhas_m &&
      s.espacamento_plantas_m
        ?`${Number(s.espacamento_linhas_m)
            .toLocaleString('pt-BR')} × ${
            Number(s.espacamento_plantas_m)
            .toLocaleString('pt-BR')
          } m`
        :'Não informado';

    const pct=Math.min(
      100,
      Math.max(0,r.atingimento||0)
    );

    return `
      <div class="card">

        <div class="card-row">
          <div>
            <h4>
              ${esc(s.cultura||'Lavoura')}
              ${s.variedade
                ?' • '+esc(s.variedade)
                :''
              }
            </h4>

            <div class="meta">
              ${esc(p?.nome||'Propriedade')}
              •
              ${esc(t?.nome||'Talhão')}
            </div>
          </div>

          <span class="pill">
            ${esc(s.status||'ativa')}
          </span>
        </div>


        <div style="
          margin-top:14px;
          display:grid;
          grid-template-columns:1fr 1fr;
          gap:10px;
        ">

          <div class="card" style="margin:0">
            <div class="meta">Área</div>
            <h4>
              ${Number(r.area||0)
                .toLocaleString('pt-BR')} ha
            </h4>
          </div>

          <div class="card" style="margin:0">
            <div class="meta">Plantas</div>
            <h4>
              ${Number(r.plantas||0)
                .toLocaleString('pt-BR')}
            </h4>
          </div>

          <div class="card" style="margin:0">
            <div class="meta">
              Produção acumulada
            </div>

            <h4>
              ${Number(r.totalKg||0)
                .toLocaleString(
                  'pt-BR',
                  {maximumFractionDigits:1}
                )} kg
            </h4>
          </div>

          <div class="card" style="margin:0">
            <div class="meta">
              Produtividade
            </div>

            <h4>
              ${Number(r.tha||0)
                .toFixed(2)
                .replace('.',',')} t/ha
            </h4>
          </div>

        </div>


        <div style="
          margin-top:14px;
          padding-top:12px;
          border-top:1px solid #ddd;
        ">

          <div class="meta">
            <strong>Plantio:</strong>
            ${dateBR(s.data_plantio)}
          </div>

          <div class="meta">
            <strong>Idade:</strong>
            ${idade===null
              ?'—'
              :idade+' dias'
            }
          </div>

          <div class="meta">
            <strong>Espaçamento:</strong>
            ${espacamento}
          </div>

          <div class="meta">
            <strong>População teórica:</strong>
            ${
              r.teorica
                ?Math.round(r.teorica)
                  .toLocaleString('pt-BR')+
                  ' plantas/ha'
                :'—'
            }
          </div>

          <div class="meta">
            <strong>População real:</strong>
            ${
              r.real
                ?Math.round(r.real)
                  .toLocaleString('pt-BR')+
                  ' plantas/ha'
                :'—'
            }
          </div>

          <div class="meta">
            <strong>Produção por planta:</strong>
            ${
              r.kgPlanta
                ?r.kgPlanta
                  .toFixed(2)
                  .replace('.',',')+
                  ' kg/planta'
                :'—'
            }
          </div>

          <div class="meta">
            <strong>Acompanhamento:</strong>
            ${esc(r.param.acompanhamento)}
          </div>

        </div>


        ${
          r.meta
          ?`
            <div style="
              margin-top:16px;
              padding:12px;
              border-radius:12px;
              background:rgba(0,0,0,.035);
            ">

              <div class="card-row">
                <div>
                  <strong>
                    Meta de produtividade
                  </strong>

                  <div class="meta">
                    ${r.meta
                      .toLocaleString('pt-BR')}
                    t/ha/${esc(r.param.periodoMeta)}
                  </div>
                </div>

                <span class="pill gold">
                  ${r.atingimento
                    .toFixed(0)}%
                </span>
              </div>


              <div style="
                height:10px;
                background:#ddd;
                border-radius:20px;
                overflow:hidden;
                margin-top:10px;
              ">

                <div style="
                  width:${pct}%;
                  height:100%;
                  background:#1d7a46;
                  border-radius:20px;
                ">
                </div>

              </div>

            </div>
          `
          :''
        }

      </div>
    `;
  }).join('');
}
function renderProdutorManejos(){

  const el=$('#produtorManejosContent');
  if(!el)return;

  const hoje=hojeLocalISO();

  function isoLocal(d){
    return [
      d.getFullYear(),
      String(d.getMonth()+1).padStart(2,'0'),
      String(d.getDate()).padStart(2,'0')
    ].join('-');
  }

  const daqui7=new Date(hoje+'T12:00:00');
  daqui7.setDate(daqui7.getDate()+7);

  const limite7=isoLocal(daqui7);

  const safraIds=new Set(
    state.safras.map(s=>String(s.id))
  );

  const atividades=[];


  // =============================
  // PRODUTOS DA ADUBAÇÃO
  // =============================

  function itensAdub(a){

    try{

      const j=JSON.parse(a.produto||'');

      if(Array.isArray(j)){

        return j.map(x=>({
          produto:x.produto||'',
          dose:x.dose??'',
          unidade:x.unidade||x.unidade_dose||''
        }))
        .filter(x=>x.produto);
      }

    }catch(_){}

    return a.produto?[{
      produto:a.produto,
      dose:a.dose??'',
      unidade:a.unidade_dose||''
    }]:[];
  }


  // =============================
  // PRODUTOS DA BORRIFAÇÃO
  // =============================

  function itensAplic(a){

    try{

      const j=JSON.parse(
        a.produto_comercial||''
      );

      if(Array.isArray(j)){

        return j.map(x=>({
          categoria:x.categoria||'',
          produto:x.produto||'',
          dose:x.dose??'',
          unidade:x.unidade||x.unidade_dose||''
        }))
        .filter(x=>x.produto);
      }

    }catch(_){}

    return a.produto_comercial?[{
      categoria:a.finalidade||'Produto',
      produto:a.produto_comercial,
      dose:a.dose??'',
      unidade:a.unidade_dose||''
    }]:[];
  }


  // =============================
  // FORMA DA ADUBAÇÃO
  // =============================

  function formaAdubacao(a){

    const tipo=normalizarTexto(
      a.tipo||''
    );

    if(tipo.includes('foliar')){
      return 'Foliar • pulverização';
    }

    if(tipo.includes('fertirrig')){
      return 'Fertirrigação';
    }

    if(
      tipo.includes('plantio') ||
      tipo.includes('cobertura')
    ){
      return 'Via solo';
    }

    return a.tipo||'Adubação';
  }


  // =============================
  // ADUBAÇÕES
  // =============================

  state.adubacoes
    .filter(a=>
      safraIds.has(
        String(a.safra_id)
      )
    )
    .forEach(a=>{

      atividades.push({

        ...a,

        origem:'adubacao',

        grupo:'Adubação',

        icone:'🌱',

        forma:
          formaAdubacao(a),

        itens:
          itensAdub(a)

      });

    });


  // =============================
  // BORRIFAÇÕES
  // =============================

  state.aplicacoes
    .filter(a=>
      safraIds.has(
        String(a.safra_id)
      )
    )
    .forEach(a=>{

      const itens=
        itensAplic(a);

      const categorias=
        itens
          .map(i=>
            normalizarTexto(
              i.categoria||''
            )
          );

      const nutricional=
        categorias.some(c=>
          c.includes('nutri') ||
          c.includes('fertiliz') ||
          c.includes('adub')
        );

      atividades.push({

        ...a,

        origem:'aplicacao',

        grupo:'Borrifação',

        icone:'💦',

        forma:
          nutricional
            ?'Nutricional / adubação foliar'
            :'Defensivos agrícolas',

        itens

      });

    });


  // =============================
  // CLASSIFICAÇÃO POR DATA
  // =============================

  const atrasadas=[];
  const deHoje=[];
  const semana=[];
  const proximas=[];
  const realizadas=[];


  atividades.forEach(a=>{

    const status=
      statusManejoTG(a);

    const data=
      a.data_aplicacao||'';


    if(status==='realizado'){

      realizadas.push(a);
      return;
    }


    if(status==='atrasado'){

      atrasadas.push(a);
      return;
    }


    if(data===hoje){

      deHoje.push(a);
      return;
    }


    if(
      data>hoje &&
      data<=limite7
    ){

      semana.push(a);
      return;
    }


    proximas.push(a);

  });


  atrasadas.sort(
    (a,b)=>
      (a.data_aplicacao||'')
        .localeCompare(
          b.data_aplicacao||''
        )
  );

  deHoje.sort(
    (a,b)=>
      (a.data_aplicacao||'')
        .localeCompare(
          b.data_aplicacao||''
        )
  );

  semana.sort(
    (a,b)=>
      (a.data_aplicacao||'')
        .localeCompare(
          b.data_aplicacao||''
        )
  );

  proximas.sort(
    (a,b)=>
      (a.data_aplicacao||'')
        .localeCompare(
          b.data_aplicacao||''
        )
  );

  realizadas.sort(
    (a,b)=>
      (
        b.data_realizacao||
        b.data_aplicacao||
        ''
      ).localeCompare(
        a.data_realizacao||
        a.data_aplicacao||
        ''
      )
  );


  // =============================
  // CARTÃO DA ATIVIDADE
  // =============================

  function cardAtividade(a){

    const ctx=
      contextoSafra(
        a.safra_id
      );

    const status=
      statusManejoTG(a);

    let textoStatus='Programada';
    let classe='gold';


    if(status==='hoje'){
      textoStatus='Hoje';
      classe='gold';
    }

    if(status==='atrasado'){
      textoStatus='Atrasada';
      classe='red';
    }

    if(status==='realizado'){
      textoStatus='Realizada';
      classe='';
    }


    return `

      <div class="card">

        <div class="card-row">

          <div style="min-width:0;">

            <h4 style="margin-bottom:5px;">

              ${a.icone}
              ${esc(a.grupo)}

            </h4>


            <div
              class="meta"
              style="
                font-weight:700;
                margin-bottom:6px;
              ">

              ${esc(a.forma)}

            </div>


            <div class="meta">

              🌾
              ${esc(
                ctx.safra?.cultura||
                'Lavoura'
              )}

              ${
                ctx.safra?.variedade
                  ?' • '+
                    esc(
                      ctx.safra.variedade
                    )
                  :''
              }

            </div>


            ${
              ctx.propriedade?.nome
                ?`
                  <div class="meta">
                    🏡
                    ${esc(
                      ctx.propriedade.nome
                    )}

                    ${
                      ctx.talhao?.nome
                        ?' • '+
                          esc(
                            ctx.talhao.nome
                          )
                        :''
                    }
                  </div>
                `
                :''
            }


            <div
              style="
                margin-top:10px;
              ">

              ${a.itens.map(i=>`

                <div
                  class="meta"
                  style="
                    margin-bottom:4px;
                  ">

                  ${
                    i.categoria
                      ?'<strong>'+
                        esc(i.categoria)+
                        ':</strong> '
                      :''
                  }

                  ${esc(i.produto)}

                  ${
                    i.dose!==''
                      ?' — '+
                        esc(i.dose)+
                        ' '+
                        esc(i.unidade||'')
                      :''
                  }

                </div>

              `).join('')}

            </div>


            ${
              a.alvo
                ?`
                  <div
                    class="meta"
                    style="margin-top:6px;">

                    <strong>
                      Alvo:
                    </strong>

                    ${esc(a.alvo)}

                  </div>
                `
                :''
            }


            ${
              a.observacoes
                ?`
                  <div
                    class="meta"
                    style="margin-top:6px;">

                    ${esc(
                      a.observacoes
                    )}

                  </div>
                `
                :''
            }


            <div
              class="meta"
              style="
                margin-top:8px;
                font-weight:700;
              ">

              📅
              ${dateBR(
                a.data_aplicacao
              )}

            </div>

          </div>


          <span
            class="pill ${classe}"
            style="
              white-space:nowrap;
            ">

            ${textoStatus}

          </span>

        </div>


        ${
          status!=='realizado'
            ?`

              <button
                class="btn btn-block"
                type="button"
                data-realizar-manejo
                data-origem="${esc(
                  a.origem
                )}"
                data-id="${esc(
                  a.id
                )}"
                style="margin-top:12px;">

                ✓ Marcar como realizada

              </button>

            `
            :''
        }

      </div>

    `;
  }


  // =============================
  // BLOCO / SEÇÃO
  // =============================

  function secao(
    titulo,
    lista
  ){

    if(!lista.length){
      return '';
    }

    return `

      <div
        class="section-head"
        style="margin-top:22px;">

        <h3>
          ${titulo}
        </h3>

      </div>

      ${lista
        .map(cardAtividade)
        .join('')}

    `;
  }


  // =============================
  // RESUMO
  // =============================

  el.innerHTML=`

    <div
      style="
        display:grid;
        grid-template-columns:1fr 1fr;
        gap:10px;
        margin-bottom:20px;
      ">

      <div
        class="card"
        style="margin:0;">

        <div class="meta">
          Hoje
        </div>

        <h2 style="margin:5px 0;">
          ${deHoje.length}
        </h2>

      </div>


      <div
        class="card"
        style="margin:0;">

        <div class="meta">
          Próximos 7 dias
        </div>

        <h2 style="margin:5px 0;">
          ${semana.length}
        </h2>

      </div>


      <div
        class="card"
        style="margin:0;">

        <div class="meta">
          Atrasadas
        </div>

        <h2 style="margin:5px 0;">
          ${atrasadas.length}
        </h2>

      </div>


      <div
        class="card"
        style="margin:0;">

        <div class="meta">
          Realizadas
        </div>

        <h2 style="margin:5px 0;">
          ${realizadas.length}
        </h2>

      </div>

    </div>


    ${
      !atividades.length
        ?`
          <div class="empty">
            Nenhuma atividade cadastrada.
          </div>
        `
        :''
    }


    ${secao(
      '⚠️ Atrasadas',
      atrasadas
    )}

    ${secao(
      '📌 Para hoje',
      deHoje
    )}

    ${secao(
      '📅 Esta semana',
      semana
    )}

    ${secao(
      '🗓️ Próximas',
      proximas
    )}

    ${secao(
      '✅ Realizadas',
      realizadas.slice(0,20)
    )}

  `;

}
async function realizarManejo(origem,id){
  const tabela=
    origem==='adubacao' ? 'adubacoes' :
    origem==='aplicacao' ? 'aplicacoes' :
    null;

  if(!tabela || !id)return;

  try{
    const r=await api(`/rest/v1/${tabela}?id=eq.${encodeURIComponent(id)}`,{
      method:'PATCH',
      body:JSON.stringify({status:'realizado'})
    });

    if(Array.isArray(r) && r.length===0){
      throw new Error('Registro não atualizado');
    }

    const arr=origem==='adubacao'
      ? state.adubacoes
      : state.aplicacoes;

    const item=arr.find(x=>String(x.id)===String(id));
    if(item)item.status='realizado';

    cacheData();
    renderProdutorManejos();
    renderProdutorHistorico();

    toast('Manejo marcado como realizado');
  }catch(err){
    console.error(err);
    toast('Não foi possível marcar como realizado');
  }
}
function renderProdutorProtocolo(){
  const el=$('#produtorProtocoloContent');
  if(!el)return;

  const safraIds=new Set(state.safras.map(s=>String(s.id)));
  const protocolo=[];

  function itensAdub(a){
    try{
      const j=JSON.parse(a.produto||'');
      if(Array.isArray(j))return j.map(x=>({
        produto:x.produto||'',
        dose:x.dose??'',
        unidade:x.unidade||x.unidade_dose||''
      })).filter(x=>x.produto);
    }catch(_){}

    return a.produto?[{
      produto:a.produto,
      dose:a.dose??'',
      unidade:a.unidade_dose||''
    }]:[];
  }

  function itensAplic(a){
    try{
      const j=JSON.parse(a.produto_comercial||'');
      if(Array.isArray(j))return j.map(x=>({
        categoria:x.categoria||'',
        produto:x.produto||'',
        dose:x.dose??'',
        unidade:x.unidade||x.unidade_dose||''
      })).filter(x=>x.produto && x.produto.toLowerCase()!=='nenhum');
    }catch(_){}

    return a.produto_comercial?[{
      categoria:a.finalidade||'Aplicação',
      produto:a.produto_comercial,
      dose:a.dose??'',
      unidade:a.unidade_dose||''
    }]:[];
  }

  state.adubacoes
    .filter(a=>safraIds.has(String(a.safra_id)))
    .forEach(a=>protocolo.push({
      tipo:'Adubação',
      data:a.data_aplicacao,
      itens:itensAdub(a)
    }));

  state.aplicacoes
    .filter(a=>safraIds.has(String(a.safra_id)))
    .forEach(a=>protocolo.push({
      tipo:'Borrifação',
      data:a.data_aplicacao,
      itens:itensAplic(a)
    }));

  protocolo.sort((a,b)=>(a.data||'').localeCompare(b.data||''));

  if(!protocolo.length){
    el.innerHTML='<div class="empty">Nenhum protocolo cadastrado.</div>';
    return;
  }

  el.innerHTML=protocolo.map(p=>`
    <div class="card">
      <h4>${esc(p.tipo)}</h4>
      <div class="meta">Data: ${dateBR(p.data)}</div>

      ${p.itens.map(i=>`
        <div class="meta">
          ${i.categoria?'<strong>'+esc(i.categoria)+':</strong> ':''}
          ${esc(i.produto)}
          ${i.dose!==''?' — '+esc(i.dose)+' '+esc(i.unidade||''):''}
        </div>
      `).join('')}
    </div>
  `).join('');
}
function renderProdutorHistorico(){
  const el=$('#produtorHistoricoContent');
  if(!el)return;

  const hoje=new Date().toISOString().slice(0,10);
  const safraIds=new Set(state.safras.map(s=>String(s.id)));
  const historico=[];

  function itensAdub(a){
    try{
      const j=JSON.parse(a.produto||'');
      if(Array.isArray(j))return j.map(x=>({
        produto:x.produto||'',
        dose:x.dose??'',
        unidade:x.unidade||x.unidade_dose||''
      })).filter(x=>x.produto);
    }catch(_){}

    return a.produto?[{
      produto:a.produto,
      dose:a.dose??'',
      unidade:a.unidade_dose||''
    }]:[];
  }

  function itensAplic(a){
    try{
      const j=JSON.parse(a.produto_comercial||'');
      if(Array.isArray(j))return j.map(x=>({
        categoria:x.categoria||'',
        produto:x.produto||'',
        dose:x.dose??'',
        unidade:x.unidade||x.unidade_dose||''
      })).filter(x=>
        x.produto &&
        x.produto.toLowerCase()!=='nenhum'
      );
    }catch(_){}

    return a.produto_comercial &&
      a.produto_comercial.toLowerCase()!=='nenhum'
      ?[{
        categoria:a.finalidade||'Aplicação',
        produto:a.produto_comercial,
        dose:a.dose??'',
        unidade:a.unidade_dose||''
      }]:[];
  }

  state.adubacoes
    .filter(a=>
  safraIds.has(String(a.safra_id)) &&
  ['realizada','realizado'].includes((a.status||'').toLowerCase())
)
    .forEach(a=>historico.push({
      tipo:'Adubação',
      data:a.data_aplicacao,
      itens:itensAdub(a)
    }));

  state.aplicacoes
    .filter(a=>
  safraIds.has(String(a.safra_id)) &&
  ['realizada','realizado'].includes((a.status||'').toLowerCase())
)
    .forEach(a=>historico.push({
      tipo:'Borrifação',
      data:a.data_aplicacao,
      itens:itensAplic(a)
    }));

  historico.sort((a,b)=>
    (b.data||'').localeCompare(a.data||'')
  );

  if(!historico.length){
    el.innerHTML='<div class="empty">Nenhuma atividade realizada.</div>';
    return;
  }

  el.innerHTML=historico.map(h=>`
    <div class="card">
      <h4>${esc(h.tipo)}</h4>
      <div class="meta">Realizado em: ${dateBR(h.data)}</div>

      ${h.itens.map(i=>`
        <div class="meta">
          ${i.categoria
            ?'<strong>'+esc(i.categoria)+':</strong> '
            :''
          }
          ${esc(i.produto)}
          ${i.dose!==''
            ?' — '+esc(i.dose)+' '+esc(i.unidade||'')
            :''
          }
        </div>
      `).join('')}
    </div>
  `).join('');
}
function renderProdutorFicha(){

  const el =
    $('#produtorFichaContent');

  if(!el) return;


  const produtor =
    state.produtores[0] || null;

  const propriedades =
    state.propriedades || [];

  const safras =
    state.safras || [];


  if(
    !produtor &&
    !propriedades.length &&
    !safras.length
  ){

    el.innerHTML = `
      <div class="empty">
        Ficha técnica ainda não disponível.
      </div>
    `;

    return;
  }


  el.innerHTML = `


    <!-- PRODUTOR -->

    <div class="card">

      <h4 style="margin-top:0;">
        👨‍🌾 Produtor
      </h4>

      <div class="meta">
        <strong>Nome:</strong>
        ${esc(produtor?.nome || '-')}
      </div>

      <div class="meta">
        <strong>Telefone:</strong>
        ${esc(produtor?.telefone || '-')}
      </div>

      <div class="meta">
        <strong>Município:</strong>
        ${esc(produtor?.municipio || '-')}
      </div>

      <div class="meta">
        <strong>Estado:</strong>
        ${esc(produtor?.estado || '-')}
      </div>

    </div>



    <!-- PROPRIEDADES -->

    <div
      style="
        font-size:13px;
        font-weight:800;
        color:#737d77;
        margin:22px 4px 8px;
      ">
      🏡 PROPRIEDADE
    </div>


    ${
      propriedades.length

      ? propriedades.map(propriedade=>{

          const area =
            propriedade?.area_total_ha ??
            propriedade?.area_total ??
            propriedade?.area_ha ??
            propriedade?.area ??
            '-';

          return `

            <div class="card">

              <h4 style="margin-top:0;">
                ${esc(
                  propriedade?.nome ||
                  'Propriedade'
                )}
              </h4>

              <div class="meta">
                <strong>Área total:</strong>
                ${esc(area)} ha
              </div>

              <div class="meta">
                <strong>Protocolo:</strong>
                ${esc(
                  propriedade?.protocolo ||
                  '-'
                )}
              </div>

            </div>
          `;

        }).join('')

      : `
        <div class="card">
          <div class="empty">
            Nenhuma propriedade cadastrada.
          </div>
        </div>
      `
    }



    <!-- LAVOURAS -->

    <div
      style="
        font-size:13px;
        font-weight:800;
        color:#737d77;
        margin:22px 4px 8px;
      ">
      🌱 MINHAS LAVOURAS
    </div>


    ${
      safras.length

      ? safras.map(safra=>{

          const talhao =
            state.talhoes.find(
              t =>
                String(t.id) ===
                String(safra.talhao_id)
            ) || null;


          const propriedade =
            talhao
              ? propriedades.find(
                  p =>
                    String(p.id) ===
                    String(
                      talhao.propriedade_id
                    )
                )
              : null;


          const idade =
            safra?.data_plantio
              ? ageDays(
                  safra.data_plantio
                )
              : null;


          const ativa =
            String(
              safra.status || ''
            ).toLowerCase() === 'ativa';


          return `

            <div class="card">

              <div
                style="
                  display:flex;
                  justify-content:space-between;
                  align-items:flex-start;
                  gap:10px;
                ">

                <div>

                  <h4
                    style="
                      margin:0;
                      font-size:19px;
                    ">

                    🌱
                    ${esc(
                      safra.cultura ||
                      'Lavoura'
                    )}

                    ${
                      safra.variedade
                        ? ` • ${esc(
                            safra.variedade
                          )}`
                        : ''
                    }

                  </h4>

                  <div
                    class="meta"
                    style="margin-top:5px;">

                    ${
                      propriedade?.nome
                        ? `🏡 ${esc(
                            propriedade.nome
                          )} • `
                        : ''
                    }

                    ${esc(
                      talhao?.nome ||
                      'Talhão não informado'
                    )}

                  </div>

                </div>


                <span
                  style="
                    background:${
                      ativa
                        ? '#e8f5ec'
                        : '#f1f1f1'
                    };
                    color:${
                      ativa
                        ? '#237443'
                        : '#747474'
                    };
                    padding:6px 9px;
                    border-radius:20px;
                    font-size:11px;
                    font-weight:700;
                    white-space:nowrap;
                  ">

                  ● ${esc(
                    safra.status ||
                    '-'
                  )}

                </span>

              </div>


              <div
                style="
                  display:grid;
                  grid-template-columns:1fr 1fr;
                  gap:12px;
                  margin-top:16px;
                ">

                <div class="meta">
                  <strong>Área:</strong><br>
                  ${esc(
                    talhao?.area_ha ||
                    '-'
                  )} ha
                </div>

                <div class="meta">
                  <strong>Plantio:</strong><br>

                  ${
                    safra?.data_plantio
                      ? dateBR(
                          safra.data_plantio
                        )
                      : '-'
                  }

                </div>

                <div class="meta">
                  <strong>Idade:</strong><br>

                  ${
                    idade === null
                      ? '-'
                      : idade + ' dias'
                  }

                </div>

                <div class="meta">
                  <strong>Situação:</strong><br>
                  ${esc(
                    safra?.status ||
                    '-'
                  )}
                </div>

              </div>

            </div>
          `;

        }).join('')

      : `
        <div class="card">
          <div class="empty">
            Nenhuma lavoura cadastrada.
          </div>
        </div>
      `
    }

  `;
}
function renderProdutorInicio(){

  const el = $('#produtorInicioContent');

  if(!el) return;


  const produtor =
    state.produtores[0] || null;

  const propriedades =
    state.propriedades || [];

  const safrasAtivas =
    (state.safras || []).filter(
      s =>
        String(s.status || '')
          .toLowerCase() === 'ativa'
    );


  // =========================================
  // NOME / SAUDAÇÃO
  // =========================================

  const primeiroNome =
    String(produtor?.nome || 'Produtor')
      .trim()
      .split(' ')[0];

  const hora =
    new Date().getHours();

  const saudacao =
    hora < 12
      ? 'Bom dia'
      : hora < 18
        ? 'Boa tarde'
        : 'Boa noite';


  // =========================================
  // ÁREA TOTAL
  // =========================================

  const areaTotal =
    propriedades.reduce(
      (total,p)=>{

        const area =
          Number(
            p.area_total_ha ??
            p.area_total ??
            p.area_ha ??
            p.area ??
            0
          );

        return total + area;
      },
      0
    );


  const formatar =
    valor =>
      Number(valor || 0)
        .toLocaleString(
          'pt-BR',
          {
            maximumFractionDigits:2
          }
        );


  // =========================================
  // SAFRAS ATIVAS
  // =========================================

  const idsSafrasAtivas =
    safrasAtivas.map(
      s => String(s.id)
    );


  // =========================================
  // MANEJOS
  // =========================================

  const agora =
    new Date();

  const hoje =
    agora.getFullYear() + '-' +
    String(
      agora.getMonth() + 1
    ).padStart(2,'0') + '-' +
    String(
      agora.getDate()
    ).padStart(2,'0');


  const manejos = [];


  state.adubacoes
    .filter(a =>
      idsSafrasAtivas.includes(
        String(a.safra_id)
      ) &&
      !['realizado','realizada'].includes(
        String(a.status || '')
          .toLowerCase()
      )
    )
    .forEach(a=>{

      let nome =
        'Adubação';

      try{

        const itens =
          typeof a.produto === 'string'
            ? JSON.parse(a.produto)
            : a.produto;

        if(Array.isArray(itens)){

          const nomes =
            itens
              .filter(i =>
                i?.produto &&
                String(i.produto)
                  .toLowerCase() !==
                  'nenhum'
              )
              .map(
                i => i.produto
              );

          if(nomes.length){
            nome =
              nomes.join(' + ');
          }
        }

      }catch(e){}


      manejos.push({

        tipo:'Adubação',

        icone:'🌱',

        data:a.data_aplicacao,

        nome,

        safra_id:a.safra_id

      });

    });


  state.aplicacoes
    .filter(a =>
      idsSafrasAtivas.includes(
        String(a.safra_id)
      ) &&
      !['realizado','realizada'].includes(
        String(a.status || '')
          .toLowerCase()
      )
    )
    .forEach(a=>{

      let nome =
        a.finalidade ||
        'Borrifação';

      try{

        const itens =
          typeof a.produto_comercial ===
          'string'
            ? JSON.parse(
                a.produto_comercial
              )
            : a.produto_comercial;

        if(Array.isArray(itens)){

          const nomes =
            itens
              .filter(i =>
                i?.produto &&
                String(i.produto)
                  .toLowerCase() !==
                  'nenhum'
              )
              .map(
                i => i.produto
              );

          if(nomes.length){
            nome =
              nomes.join(' + ');
          }
        }

      }catch(e){}


      manejos.push({

        tipo:'Borrifação',

        icone:'💧',

        data:a.data_aplicacao,

        nome,

        safra_id:a.safra_id

      });

    });


  manejos.sort(
    (a,b)=>
      String(a.data || '')
        .localeCompare(
          String(b.data || '')
        )
  );


  const atrasados =
    manejos.filter(
      m =>
        m.data &&
        m.data < hoje
    );


  const proximoManejo =
    manejos.find(
      m =>
        m.data &&
        m.data >= hoje
    ) || null;


  // =========================================
  // PRODUÇÃO GERAL
  // =========================================

  const colheitasAtivas =
    (state.colheitas || [])
      .filter(
        c =>
          idsSafrasAtivas.includes(
            String(c.safra_id)
          )
      );


  const producao =
    producaoPeriodosTG(
      colheitasAtivas
    );


  // =========================================
  // ÍCONE DA CULTURA
  // =========================================

  function iconeCultura(cultura){

    const c =
      normalizarTexto(
        cultura || ''
      );

    if(c.includes('maracuja'))
      return '🌿';

    if(c.includes('banana'))
      return '🍌';

    if(c.includes('melancia'))
      return '🍉';

    if(c.includes('abacaxi'))
      return '🍍';

    if(c.includes('milho'))
      return '🌽';

    if(c.includes('pimentao'))
      return '🫑';

    return '🌱';
  }


  // =========================================
  // HTML
  // =========================================

  el.innerHTML = `


    <!-- SAUDAÇÃO -->

    <div
      style="
        margin-bottom:18px;
      ">

      <div
        style="
          font-size:14px;
          color:#748078;
          margin-bottom:3px;
        ">
        ${saudacao},
      </div>

      <div
        style="
          font-size:26px;
          font-weight:800;
          color:#24372d;
        ">
        ${esc(primeiroNome)} 👋
      </div>

      <div
        style="
          color:#78827c;
          margin-top:5px;
          font-size:14px;
        ">

        ${
          propriedades.length === 1
            ? esc(
                propriedades[0]
                  ?.nome ||
                'Sua propriedade'
              )
            : `${propriedades.length} propriedades`
        }

      </div>

    </div>



    <!-- INDICADORES -->

    <div
      style="
        display:grid;
        grid-template-columns:
          repeat(3,1fr);
        gap:9px;
        margin-bottom:24px;
      ">


      <div
        class="card"
        style="
          margin:0;
          padding:15px 10px;
          text-align:center;
        ">

        <div
          style="
            font-size:22px;
            margin-bottom:5px;
          ">
          🌱
        </div>

        <strong
          style="
            display:block;
            font-size:22px;
          ">
          ${safrasAtivas.length}
        </strong>

        <span
          style="
            font-size:11px;
            color:#7b857f;
          ">
          Lavouras
        </span>

      </div>


      <div
        class="card"
        style="
          margin:0;
          padding:15px 10px;
          text-align:center;
        ">

        <div
          style="
            font-size:22px;
            margin-bottom:5px;
          ">
          🗺️
        </div>

        <strong
          style="
            display:block;
            font-size:22px;
          ">
          ${formatar(areaTotal)}
        </strong>

        <span
          style="
            font-size:11px;
            color:#7b857f;
          ">
          hectares
        </span>

      </div>


      <div
        class="card"
        style="
          margin:0;
          padding:15px 10px;
          text-align:center;
        ">

        <div
          style="
            font-size:22px;
            margin-bottom:5px;
          ">
          ${
            atrasados.length
              ? '⚠️'
              : '✅'
          }
        </div>

        <strong
          style="
            display:block;
            font-size:22px;
            ${
              atrasados.length
                ? 'color:#b63b32;'
                : ''
            }
          ">
          ${atrasados.length}
        </strong>

        <span
          style="
            font-size:11px;
            color:#7b857f;
          ">
          Atrasadas
        </span>

      </div>

    </div>



    <!-- MINHAS LAVOURAS -->

    <div
      style="
        display:flex;
        justify-content:space-between;
        align-items:center;
        margin:0 4px 10px;
      ">

      <div
        style="
          font-size:14px;
          color:#68756d;
          font-weight:800;
        ">
        🌱 MINHAS LAVOURAS
      </div>

      <div
        style="
          font-size:12px;
          color:#89918d;
        ">
        ${safrasAtivas.length}
        ativa${safrasAtivas.length === 1 ? '' : 's'}
      </div>

    </div>


    ${
      safrasAtivas.length

      ? safrasAtivas.map(safra=>{

          const talhao =
            state.talhoes.find(
              t =>
                String(t.id) ===
                String(
                  safra.talhao_id
                )
            ) || null;


          const idade =
            safra.data_plantio
              ? ageDays(
                  safra.data_plantio
                )
              : null;


          const colheitasSafra =
            state.colheitas.filter(
              c =>
                String(c.safra_id) ===
                String(safra.id)
            );


          const prodSafra =
            producaoPeriodosTG(
              colheitasSafra
            );


          return `

            <div
              class="card"
              style="
                margin-bottom:12px;
                padding:18px;
              ">


              <div
                style="
                  display:flex;
                  justify-content:
                    space-between;
                  align-items:flex-start;
                  gap:10px;
                ">


                <div>

                  <div
                    style="
                      font-size:20px;
                      font-weight:800;
                      color:#273a30;
                    ">

                    ${iconeCultura(
                      safra.cultura
                    )}

                    ${esc(
                      safra.cultura ||
                      'Lavoura'
                    )}

                    ${
                      safra.variedade
                        ? ` • ${esc(
                            safra.variedade
                          )}`
                        : ''
                    }

                  </div>


                  <div
                    style="
                      font-size:13px;
                      color:#7d8781;
                      margin-top:4px;
                    ">
                    📍 ${esc(
                      talhao?.nome ||
                      'Talhão não informado'
                    )}
                  </div>

                </div>


                <span
                  style="
                    background:#e8f5ec;
                    color:#237443;
                    padding:6px 9px;
                    border-radius:20px;
                    font-size:11px;
                    font-weight:700;
                    white-space:nowrap;
                  ">
                  ● Ativa
                </span>

              </div>



              <div
                style="
                  display:grid;
                  grid-template-columns:
                    1fr 1fr 1fr;
                  gap:10px;
                  margin-top:17px;
                ">


                <div>

                  <div
                    style="
                      font-size:11px;
                      color:#8a938e;
                    ">
                    PLANTIO
                  </div>

                  <strong
                    style="
                      font-size:13px;
                    ">
                    ${
                      safra.data_plantio
                        ? dateBR(
                            safra.data_plantio
                          )
                        : '-'
                    }
                  </strong>

                </div>


                <div>

                  <div
                    style="
                      font-size:11px;
                      color:#8a938e;
                    ">
                    IDADE
                  </div>

                  <strong
                    style="
                      font-size:13px;
                    ">
                    ${
                      idade != null
                        ? `${idade} dias`
                        : '-'
                    }
                  </strong>

                </div>


                <div>

                  <div
                    style="
                      font-size:11px;
                      color:#8a938e;
                    ">
                    ESTE MÊS
                  </div>

                  <strong
                    style="
                      font-size:13px;
                    ">
                    ${formatar(
                      prodSafra.mensal
                    )} kg
                  </strong>

                </div>

              </div>

            </div>
          `;

        }).join('')

      : `

        <div class="card">

          <div class="empty">
            Nenhuma lavoura ativa.
          </div>

        </div>

      `
    }



    <!-- PRODUÇÃO -->

    <div
      style="
        font-size:14px;
        color:#68756d;
        font-weight:800;
        margin:24px 4px 10px;
      ">
      📊 PRODUÇÃO
    </div>


    <div class="card">

      <div
        style="
          display:grid;
          grid-template-columns:
            1fr 1fr;
          gap:18px;
        ">


        <div>

          <div
            style="
              color:#89918d;
              font-size:12px;
            ">
            ESTE MÊS
          </div>

          <strong
            style="
              font-size:23px;
              color:#25392e;
            ">
            ${formatar(
              producao.mensal
            )} kg
          </strong>

        </div>


        <div>

          <div
            style="
              color:#89918d;
              font-size:12px;
            ">
            ESTE ANO
          </div>

          <strong
            style="
              font-size:23px;
              color:#25392e;
            ">
            ${formatar(
              producao.anual
            )} kg
          </strong>

        </div>

      </div>

    </div>



    ${
      atrasados.length

      ? `

        <div
          style="
            margin-top:18px;
            background:#fff1f0;
            border:
              1px solid #ffd1cd;
            border-radius:16px;
            padding:14px 16px;
          ">

          <div
            style="
              color:#b63b32;
              font-weight:800;
            ">
            ⚠️ ${atrasados.length}
            atividade${
              atrasados.length > 1
                ? 's'
                : ''
            }
            atrasada${
              atrasados.length > 1
                ? 's'
                : ''
            }
          </div>

          <div
            style="
              color:#7c6865;
              font-size:12px;
              margin-top:4px;
            ">
            Consulte a aba Atividades.
          </div>

        </div>

      `

      : ''
    }



    <!-- PRÓXIMA ATIVIDADE -->

    <div
      style="
        font-size:14px;
        color:#68756d;
        font-weight:800;
        margin:24px 4px 10px;
      ">
      📅 PRÓXIMA ATIVIDADE
    </div>


    ${
      proximoManejo

      ? (()=>{

          const safraManejo =
            state.safras.find(
              s =>
                String(s.id) ===
                String(
                  proximoManejo.safra_id
                )
            );

          const talhaoManejo =
            safraManejo
              ? state.talhoes.find(
                  t =>
                    String(t.id) ===
                    String(
                      safraManejo
                        .talhao_id
                    )
                )
              : null;


          return `

            <div class="card">

              <div
                style="
                  display:flex;
                  justify-content:
                    space-between;
                  gap:12px;
                  align-items:flex-start;
                ">


                <div>

                  <div
                    style="
                      font-size:18px;
                      font-weight:800;
                      color:#26352e;
                    ">
                    ${proximoManejo.icone}
                    ${esc(
                      proximoManejo.tipo
                    )}
                  </div>


                  <div
                    style="
                      color:#66716b;
                      margin-top:6px;
                    ">
                    ${esc(
                      proximoManejo.nome
                    )}
                  </div>


                  ${
                    safraManejo
                      ? `
                        <div
                          style="
                            color:#89918d;
                            font-size:12px;
                            margin-top:8px;
                          ">

                          🌱 ${esc(
                            safraManejo.cultura ||
                            ''
                          )}

                          ${
                            safraManejo.variedade
                              ? ` • ${esc(
                                  safraManejo
                                    .variedade
                                )}`
                              : ''
                          }

                          ${
                            talhaoManejo?.nome
                              ? ` • ${esc(
                                  talhaoManejo
                                    .nome
                                )}`
                              : ''
                          }

                        </div>
                      `
                      : ''
                  }

                </div>


                <div
                  style="
                    background:#eef5ef;
                    border-radius:12px;
                    padding:7px 10px;
                    font-weight:700;
                    font-size:12px;
                    color:#315f43;
                    white-space:nowrap;
                  ">
                  ${dateBR(
                    proximoManejo.data
                  )}
                </div>

              </div>

            </div>
          `;

        })()

      : `

        <div class="card">

          <div
            style="
              text-align:center;
              padding:8px;
              color:#7c8680;
            ">
            ✅ Nenhuma atividade próxima.
          </div>

        </div>

      `
    }

  `;
}
function opts(arr,value='id',label='nome'){return arr.map(x=>`<option value="${x[value]}">${esc(x[label])}</option>`).join('')}
function optsSelected(arr,selected,value='id',label='nome'){return arr.map(x=>`<option value="${x[value]}" ${String(x[value])===String(selected)?'selected':''}>${esc(x[label])}</option>`).join('')}
function modal(title,body,onSubmit){const w=$('#modalWrap');w.className='modal-backdrop';w.innerHTML=`<div class="modal"><div class="modal-head"><h3>${title}</h3><button class="close" id="closeModal">×</button></div><form id="modalForm">${body}<button class="btn btn-primary btn-block" type="submit">SALVAR</button></form></div>`;$('#closeModal').onclick=closeModal;$('#modalForm').onsubmit=onSubmit}
function closeModal(){$('#modalWrap').className='hidden';$('#modalWrap').innerHTML=''}
async function copiarPixTG(){
  const pix = '62382506000160';

  try{
    await navigator.clipboard.writeText(pix);
    toast('Chave PIX copiada!');
  }catch(e){
    try{
      const campo = document.createElement('textarea');
      campo.value = pix;
      document.body.appendChild(campo);
      campo.select();
      document.execCommand('copy');
      campo.remove();

      toast('Chave PIX copiada!');
    }catch(err){
      toast('Não foi possível copiar a chave PIX.');
    }
  }
}

async function carregarHistoricoPagamentosProdutor(produtorId){

  const el = $('#historicoPagamentosProdutor');
  if(!el) return;

  try{

    const pagamentos = await api(
      '/rest/v1/pagamentos_produtores' +
      '?produtor_id=eq.' + encodeURIComponent(produtorId) +
      '&select=*' +
      '&order=competencia_ano.desc,competencia_mes.desc'
    );

    if(!pagamentos || !pagamentos.length){

      el.innerHTML = `
        <div class="card">
          <div class="empty">
            Nenhum pagamento registrado ainda.
          </div>
        </div>
      `;

      return;
    }

    const meses = [
      '',
      'Janeiro',
      'Fevereiro',
      'Março',
      'Abril',
      'Maio',
      'Junho',
      'Julho',
      'Agosto',
      'Setembro',
      'Outubro',
      'Novembro',
      'Dezembro'
    ];

    const dinheiro = valor =>
      Number(valor || 0).toLocaleString(
        'pt-BR',
        {
          style:'currency',
          currency:'BRL'
        }
      );

    const dataBRPagamento = data => {

      if(!data) return '-';

      const [ano,mes,dia] =
        String(data).split('-');

      return `${dia}/${mes}/${ano}`;
    };

    el.innerHTML = pagamentos.map(p=>`

      <div class="card">

        <div class="card-row">

          <div>

            <strong>
              ${meses[p.competencia_mes] || '-'}
              /
              ${p.competencia_ano}
            </strong>

            <div class="meta" style="margin-top:6px;">
              ${dinheiro(p.valor)}
            </div>

          </div>

          <span class="pill">
            ✅ PAGO
          </span>

        </div>

        <div class="meta" style="margin-top:14px;">
          Pago em:
          <strong>
            ${dataBRPagamento(p.data_pagamento)}
          </strong>
        </div>

        <div class="meta" style="margin-top:5px;">
          Forma:
          <strong>
            ${String(p.forma_pagamento || '-').toUpperCase()}
          </strong>
        </div>

        <div class="meta" style="margin-top:5px;">
          Recibo:
          <strong>
            ${esc(p.numero_recibo || '-')}
          </strong>
        </div>

      </div>

    `).join('');

  }catch(err){

    console.error(
      'Erro ao carregar pagamentos:',
      err
    );

    el.innerHTML = `
      <div class="card">
        <div class="empty">
          Não foi possível carregar os pagamentos.
        </div>
      </div>
    `;
  }
}

async function renderProdutorFinanceiro(){

  if(!isProdutor()) return;

  const el = $('#produtorFinanceiroContent');
  if(!el) return;

  const produtorId =
    state.perfilUsuario?.produtor_id;

  if(!produtorId) return;

  el.innerHTML = `
    <div class="card">

      <div class="meta">
        💰 <strong>MENSALIDADE</strong>
      </div>

      <div class="card-row" style="margin-top:14px;">
        <div>
          <div class="meta">Vencimento</div>
          <strong>Todo dia 28</strong>
        </div>

        <div style="text-align:right;">
          <div class="meta">Prazo</div>
          <strong>Até 5 dias após</strong>
        </div>
      </div>

      <div
        id="financeiroStatus"
        style="
          margin-top:16px;
          padding:14px;
          border-radius:14px;
          background:#eef7f0;
        ">
        Carregando...
      </div>

    </div>


    <div class="card">

      <div class="meta">
        📲 <strong>PAGAMENTO VIA PIX</strong>
      </div>

      <h4 style="margin-bottom:4px;">
        Banco Inter
      </h4>

      <div class="meta">
        G. Correia Barros Filho
      </div>

      <div class="meta" style="margin-top:16px;">
        Chave PIX • CNPJ
      </div>

      <h3 style="margin-top:4px;">
        62.382.506/0001-60
      </h3>

      <button
        type="button"
        class="btn btn-primary btn-block"
        id="copiarPixProdutor">
        📋 COPIAR CHAVE PIX
      </button>

    </div>


    <div class="card">

      <div class="meta">
        📄 <strong>CONTRATO</strong>
      </div>

      <div
        id="contratoProdutorStatus"
        class="meta"
        style="margin-top:14px;">
        Verificando contrato...
      </div>

      <button
        type="button"
        class="btn btn-primary btn-block"
        id="verContratoProdutor"
        style="display:none;margin-top:14px;">
        📄 VER CONTRATO
      </button>

    </div>


    <div style="margin-top:22px;">
      <div class="meta">
        🧾 <strong>HISTÓRICO DE PAGAMENTOS</strong>
      </div>
    </div>

    <div id="historicoPagamentosProdutor">

  <div class="card">
    <div class="empty">
      Carregando pagamentos...
    </div>
  </div>

</div>
  `;


  atualizarStatusFinanceiro();
  
  carregarHistoricoPagamentosProdutor(produtorId);

  const btnPix = $('#copiarPixProdutor');

  if(btnPix){
    btnPix.onclick = copiarPixTG;
  }


  const statusContrato =
    $('#contratoProdutorStatus');

  const btnContrato =
    $('#verContratoProdutor');


  try{

    const caminho =
      encodeURIComponent(produtorId) +
      '/contrato.pdf';

    const res = await fetch(
      SUPABASE_URL +
      '/storage/v1/object/sign/Contratos/' +
      caminho,
      {
        method:'POST',
        headers:{
          'apikey':SUPABASE_KEY,
          'Authorization':
            'Bearer ' +
            state.session.access_token,
          'Content-Type':'application/json'
        },
        body:JSON.stringify({
          expiresIn:60
        })
      }
    );


    if(res.ok){

      statusContrato.textContent =
        '✅ Contrato disponível';

      btnContrato.style.display='block';

      btnContrato.onclick=()=>{
        abrirContratoProdutor(produtorId);
      };

    }else{

      statusContrato.textContent =
        'Contrato ainda não disponibilizado.';

      btnContrato.style.display='none';
    }

  }catch(err){

    console.error(
      'Erro ao verificar contrato do produtor:',
      err
    );

    statusContrato.textContent =
      'Contrato ainda não disponibilizado.';
  }
}
  function atualizarStatusFinanceiro(){
  const el = document.getElementById('financeiroStatus');
  if(!el) return;

  const hoje = new Date();
  hoje.setHours(0,0,0,0);

  const ano = hoje.getFullYear();
  const mes = hoje.getMonth();

  const vencimento = new Date(ano, mes, 28);
  vencimento.setHours(0,0,0,0);

  const limite = new Date(vencimento);
  limite.setDate(limite.getDate() + 5);

  const dataBR = d =>
    String(d.getDate()).padStart(2,'0') + '/' +
    String(d.getMonth() + 1).padStart(2,'0') + '/' +
    d.getFullYear();

  if(hoje < vencimento){

    el.style.background = '#eef5ef';
    el.style.color = '#28643d';

    el.innerHTML = `
      🟢 Em dia
      <div style="font-size:12px;font-weight:500;margin-top:3px;">
        Próximo vencimento: ${dataBR(vencimento)}
      </div>
    `;

  }else if(hoje <= limite){

    el.style.background = '#fff7df';
    el.style.color = '#8a6515';

    el.innerHTML = `
      🟡 Prazo de pagamento
      <div style="font-size:12px;font-weight:500;margin-top:3px;">
        Venceu em ${dataBR(vencimento)} • prazo até ${dataBR(limite)}
      </div>
    `;

  }else{

    el.style.background = '#fff0ef';
    el.style.color = '#b23b32';

    el.innerHTML = `
      🔴 Prazo encerrado
      <div style="font-size:12px;font-weight:500;margin-top:3px;">
        Prazo encerrado em ${dataBR(limite)}
      </div>
    `;
  }
}
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
  
async function excluirProdutorCompleto(id,btn=null){

  const produtor=
    state.produtores.find(
      p=>String(p.id)===String(id)
    );

  if(!produtor){
    toast('Produtor não encontrado');
    return;
  }


  const propriedades=
    state.propriedades.filter(
      p=>String(p.produtor_id)===String(id)
    );


  if(propriedades.length){

    toast(
      'Exclua primeiro as propriedades deste produtor'
    );

    return;
  }


  const confirmar=confirm(
    `Excluir definitivamente ${produtor.nome}?\n\n`+
    `O cadastro e o acesso ao aplicativo serão excluídos.`
  );

  if(!confirmar)return;


  try{

    if(btn){
      btn.disabled=true;
      btn.textContent='Excluindo...';
    }


    const res=await fetch(
      SUPABASE_URL+
      '/functions/v1/super-endpoint',
      {
        method:'POST',

        headers:{
          'Content-Type':'application/json',
          'apikey':SUPABASE_KEY,
          'Authorization':
            'Bearer '+
            state.session.access_token
        },

        body:JSON.stringify({
          acao:'excluir_produtor',
          produtor_id:id
        })
      }
    );


    const dados=
      await res.json();


    if(!res.ok){

      throw new Error(
        dados?.error ||
        'Não foi possível excluir o produtor'
      );
    }


    closeModal();

    await loadAll();

    toast(
      '✓ Produtor e acesso excluídos'
    );


  }catch(err){

    console.error(
      'Erro ao excluir produtor:',
      err
    );

    toast(
      err?.message ||
      'Erro ao excluir produtor'
    );


    if(btn){

      btn.disabled=false;

      btn.textContent=
        '🗑️ EXCLUIR PRODUTOR';
    }
  }
}

async function enviarContratoProdutor(produtorId, arquivo){

  if(!arquivo){
    toast('Selecione um contrato');
    return;
  }

  if(
    arquivo.type !== 'application/pdf' &&
    !arquivo.name.toLowerCase().endsWith('.pdf')
  ){
    toast('Selecione um arquivo PDF');
    return;
  }

  try{

    toast('Enviando contrato...');

    const caminho =
      encodeURIComponent(produtorId) +
      '/contrato.pdf';

    const res = await fetch(
      SUPABASE_URL +
      '/storage/v1/object/Contratos/' +
      caminho,
      {
        method:'POST',

        headers:{
          'apikey':SUPABASE_KEY,

          'Authorization':
            'Bearer ' +
            state.session.access_token,

          'Content-Type':'application/pdf',

          'x-upsert':'true'
        },

        body:arquivo
      }
    );

    if(!res.ok){

      let mensagem='Erro ao enviar contrato';

      try{
        const dados=await res.json();
        mensagem=
          dados.message ||
          dados.error ||
          mensagem;
      }catch(e){}

      throw new Error(mensagem);
    }

    toast('✓ Contrato enviado com sucesso');

    const status=
      $('#contratoAdminStatus');

    if(status){
      status.textContent=
        '✅ Contrato disponível';
    }

    const ver=
      $('#verContratoAdmin');

    const excluir=
      $('#excluirContratoAdmin');

    if(ver){
      ver.style.display='block';
    }

    if(excluir){
      excluir.style.display='block';
    }

  }catch(err){

    console.error(err);

    toast(
      err.message ||
      'Não foi possível enviar o contrato'
    );
  }
}

async function abrirContratoProdutor(produtorId){

  try{

    toast('Abrindo contrato...');

    const caminho =
      encodeURIComponent(produtorId) +
      '/contrato.pdf';

    const res = await fetch(
      SUPABASE_URL +
      '/storage/v1/object/sign/Contratos/' +
      caminho,
      {
        method:'POST',
        headers:{
          'apikey':SUPABASE_KEY,
          'Authorization':'Bearer ' + state.session.access_token,
          'Content-Type':'application/json'
        },
        body:JSON.stringify({
          expiresIn:300
        })
      }
    );

    const dados = await res.json();

    if(!res.ok){
      throw new Error(
        dados.message ||
        dados.error ||
        'Não foi possível abrir o contrato'
      );
    }

    const signedUrl =
      dados.signedURL ||
      dados.signedUrl;

    const url =
      signedUrl.startsWith('http')
        ? signedUrl
        : SUPABASE_URL + '/storage/v1' + signedUrl;

    if(
      window.AndroidTG &&
      typeof AndroidTG.abrirUrl === 'function'
    ){
      AndroidTG.abrirUrl(url);
    }else{
      window.location.href=url;
    }

  }catch(err){

    console.error(err);

    toast(
      err.message ||
      'Erro ao abrir contrato'
    );
  }
}


async function excluirContratoProdutor(produtorId){

  if(
    !confirm(
      'Deseja realmente excluir o contrato deste produtor?'
    )
  ){
    return;
  }

  try{

    toast('Excluindo contrato...');

    const caminho =
      encodeURIComponent(produtorId) +
      '/contrato.pdf';

    const res = await fetch(
      SUPABASE_URL +
      '/storage/v1/object/Contratos/' +
      caminho,
      {
        method:'DELETE',
        headers:{
          'apikey':SUPABASE_KEY,
          'Authorization':'Bearer ' + state.session.access_token
        }
      }
    );

    if(!res.ok){

      let mensagem='Erro ao excluir contrato';

      try{
        const dados=await res.json();
        mensagem=
          dados.message ||
          dados.error ||
          mensagem;
      }catch(e){}

      throw new Error(mensagem);
    }

    toast('✓ Contrato excluído');

    const status=$('#contratoAdminStatus');
    const ver=$('#verContratoAdmin');
    const excluir=$('#excluirContratoAdmin');

    if(status){
      status.textContent='Nenhum contrato enviado.';
    }

    if(ver){
      ver.style.display='none';
    }

    if(excluir){
      excluir.style.display='none';
    }

  }catch(err){

    console.error(err);

    toast(
      err.message ||
      'Não foi possível excluir o contrato'
    );
  }
}
async function verificarContratoProdutor(produtorId){

  const status = $('#contratoAdminStatus');
  const btnVer = $('#verContratoAdmin');
  const btnExcluir = $('#excluirContratoAdmin');
  const btnAdicionar = $('#adicionarContratoProdutor');

  try{

    const caminho =
      encodeURIComponent(produtorId) +
      '/contrato.pdf';

    const res = await fetch(
      SUPABASE_URL +
      '/storage/v1/object/sign/Contratos/' +
      caminho,
      {
        method:'POST',
        headers:{
          'apikey':SUPABASE_KEY,
          'Authorization':
            'Bearer ' + state.session.access_token,
          'Content-Type':'application/json'
        },
        body:JSON.stringify({
          expiresIn:60
        })
      }
    );

    if(res.ok){

      if(status){
        status.textContent =
          '✅ Contrato disponível';
      }

      if(btnVer){
        btnVer.style.display='block';
      }

      if(btnExcluir){
        btnExcluir.style.display='block';
      }

      if(btnAdicionar){
        btnAdicionar.innerHTML =
          '📎 SUBSTITUIR CONTRATO';
      }

    }else{

      if(status){
        status.textContent =
          'Nenhum contrato enviado.';
      }

      if(btnVer){
        btnVer.style.display='none';
      }

      if(btnExcluir){
        btnExcluir.style.display='none';
      }

      if(btnAdicionar){
        btnAdicionar.innerHTML =
          '📎 ADICIONAR CONTRATO';
      }

    }

  }catch(err){

    console.error(
      'Erro ao verificar contrato:',
      err
    );

  }
}
function abrirFinanceiroProdutorTecnico(produtorId){

  const produtor =
    state.produtores.find(
      p=>String(p.id)===String(produtorId)
    );

  if(!produtor){
    toast('Produtor não encontrado');
    return;
  }


  const pagamentos =
    (state.pagamentos_produtores || [])
      .filter(
        p=>String(p.produtor_id)===
           String(produtorId)
      )
      .sort((a,b)=>{

        const ca =
          Number(a.competencia_ano || 0) * 100 +
          Number(a.competencia_mes || 0);

        const cb =
          Number(b.competencia_ano || 0) * 100 +
          Number(b.competencia_mes || 0);

        return cb - ca;
      });


  const hoje = new Date();

  const mesAtual =
    hoje.getMonth() + 1;

  const anoAtual =
    hoje.getFullYear();


  const nomesMeses = [
    '',
    'Janeiro',
    'Fevereiro',
    'Março',
    'Abril',
    'Maio',
    'Junho',
    'Julho',
    'Agosto',
    'Setembro',
    'Outubro',
    'Novembro',
    'Dezembro'
  ];


  const pagamentoAtual =
    pagamentos.find(
      p=>
        Number(p.competencia_mes)===
          mesAtual &&
        Number(p.competencia_ano)===
          anoAtual &&
        String(p.status || '')
          .toLowerCase()==='pago'
    );


  const limite =
    new Date(
      anoAtual,
      mesAtual - 1,
      28
    );

  limite.setDate(
    limite.getDate() + 5
  );


  let statusTexto =
    '🟡 A RECEBER';

  let fundo =
    '#fff7dc';

  let cor =
    '#806514';


  if(pagamentoAtual){

    statusTexto =
      '✅ PAGO';

    fundo =
      '#eaf6ee';

    cor =
      '#287147';

  }else if(hoje > limite){

    statusTexto =
      '🔴 EM ATRASO';

    fundo =
      '#fff0ef';

    cor =
      '#b63b32';
  }


  const dinheiro =
    valor=>
      Number(valor || 0)
        .toLocaleString(
          'pt-BR',
          {
            style:'currency',
            currency:'BRL'
          }
        );


  const valorAtual =
    pagamentoAtual
      ? Number(
          pagamentoAtual.valor || 400
        )
      : 400;


  const w =
    $('#modalWrap');


  w.className =
    'modal-backdrop';


  w.innerHTML = `

    <div class="modal">

      <div class="modal-head">

        <h3>
          💰 Financeiro
        </h3>

        <button
          type="button"
          class="close"
          id="closeModal">
          ×
        </button>

      </div>


      <div class="card">

        <h3 style="margin-top:0;">
          👨‍🌾 ${esc(produtor.nome)}
        </h3>

        <div
          class="meta"
          style="margin-top:8px;">

          ${
            nomesMeses[mesAtual]
          }/${anoAtual}

        </div>


        <div
          style="
            display:flex;
            justify-content:space-between;
            align-items:center;
            gap:12px;
            margin-top:14px;
          ">

          <strong
            style="font-size:24px;">

            ${dinheiro(valorAtual)}

          </strong>


          <span
            style="
              padding:7px 11px;
              border-radius:20px;
              font-weight:800;
              background:${fundo};
              color:${cor};
            ">

            ${statusTexto}

          </span>

        </div>


        <div
          class="meta"
          style="margin-top:12px;">

          ${
            pagamentoAtual
              ? `
                Pago em:
                ${
                  dateBR(
                    pagamentoAtual
                      .data_pagamento
                  )
                }
              `
              : `
                Vencimento:
                28/${String(
                  mesAtual
                ).padStart(2,'0')}/${anoAtual}
              `
          }

        </div>


        ${
          !pagamentoAtual
            ? `
              <button
                type="button"
                class="btn btn-primary btn-block"
                id="registrarPagamentoFinanceiro"
                style="margin-top:18px;">

                💰 REGISTRAR PAGAMENTO

              </button>
            `
            : ''
        }

      </div>


      <h3 style="margin-top:22px;">
        🧾 Histórico de pagamentos
      </h3>


      <div>

        ${
          pagamentos.length
            ? pagamentos.map(p=>`

                <div class="card">

                  <div class="card-row">

                    <div>

                      <strong>

                        ${
                          nomesMeses[
                            Number(
                              p.competencia_mes
                            )
                          ] ||
                          'Mês'
                        }/${p.competencia_ano || ''}

                      </strong>

                      <div
                        class="meta"
                        style="margin-top:5px;">

                        ${
                          p.data_pagamento
                            ? 'Pago em ' +
                              dateBR(
                                p.data_pagamento
                              )
                            : ''
                        }

                      </div>

                      ${
                        p.forma_pagamento
                          ? `
                            <div class="meta">
                              ${esc(
                                String(
                                  p.forma_pagamento
                                ).toUpperCase()
                              )}
                            </div>
                          `
                          : ''
                      }

                      ${
                        p.numero_recibo
                          ? `
                            <div class="meta">
                              Recibo:
                              ${esc(
                                p.numero_recibo
                              )}
                            </div>
                          `
                          : ''
                      }

                    </div>


                    <div
                      style="text-align:right;">

                      <strong>
                        ${dinheiro(
                          p.valor
                        )}
                      </strong>

                      <div
                        style="
                          margin-top:6px;
                          color:#287147;
                          font-weight:800;
                          font-size:12px;
                        ">

                        ✅ PAGO

                      </div>

                    </div>

                  </div>

                </div>

              `).join('')
            : `
                <div class="empty">
                  Nenhum pagamento registrado ainda.
                </div>
              `
        }

      </div>

    </div>
  `;


  $('#closeModal').onclick =
    closeModal;


  const btnPagamento =
    $('#registrarPagamentoFinanceiro');


  if(btnPagamento){

    btnPagamento.onclick=()=>{

      closeModal();

      abrirPagamentoProdutor(
        produtorId
      );

    };
  }
}

async function abrirPagamentoProdutor(produtorId){

  const produtor = state.produtores.find(
    p => String(p.id) === String(produtorId)
  );

  if(!produtor){
    toast('Produtor não encontrado');
    return;
  }

  const hoje = new Date();

  const mesAtual = hoje.getMonth() + 1;
  const anoAtual = hoje.getFullYear();

  const dataHoje =
    hoje.getFullYear() + '-' +
    String(hoje.getMonth() + 1).padStart(2,'0') + '-' +
    String(hoje.getDate()).padStart(2,'0');


  modal(
    '💰 Registrar pagamento',

    `

    <div class="card" style="margin-bottom:16px;">
      <strong>👨‍🌾 ${esc(produtor.nome || 'Produtor')}</strong>
      <div class="meta" style="margin-top:5px;">
        Registrar mensalidade paga
      </div>
    </div>


    <div class="field">
      <label>Competência • Mês</label>

      <select id="pagamentoMes" required>

        <option value="1" ${mesAtual===1?'selected':''}>Janeiro</option>
        <option value="2" ${mesAtual===2?'selected':''}>Fevereiro</option>
        <option value="3" ${mesAtual===3?'selected':''}>Março</option>
        <option value="4" ${mesAtual===4?'selected':''}>Abril</option>
        <option value="5" ${mesAtual===5?'selected':''}>Maio</option>
        <option value="6" ${mesAtual===6?'selected':''}>Junho</option>
        <option value="7" ${mesAtual===7?'selected':''}>Julho</option>
        <option value="8" ${mesAtual===8?'selected':''}>Agosto</option>
        <option value="9" ${mesAtual===9?'selected':''}>Setembro</option>
        <option value="10" ${mesAtual===10?'selected':''}>Outubro</option>
        <option value="11" ${mesAtual===11?'selected':''}>Novembro</option>
        <option value="12" ${mesAtual===12?'selected':''}>Dezembro</option>

      </select>
    </div>


    <div class="field">
      <label>Ano</label>

      <input
        type="number"
        id="pagamentoAno"
        value="${anoAtual}"
        min="2020"
        max="2100"
        required>
    </div>


    <div class="field">
      <label>Valor pago (R$)</label>

      <input
        type="number"
        id="pagamentoValor"
        value="400.00"
        min="0"
        step="0.01"
        required>
    </div>


    <div class="field">
      <label>Data do pagamento</label>

      <input
        type="date"
        id="pagamentoData"
        value="${dataHoje}"
        required>
    </div>


    <div class="field">
      <label>Forma de pagamento</label>

      <select id="pagamentoForma" required>

        <option value="pix">
          PIX
        </option>

        <option value="dinheiro">
          Dinheiro
        </option>

        <option value="transferencia">
          Transferência
        </option>

        <option value="outro">
          Outro
        </option>

      </select>
    </div>


    <div class="field">
      <label>Observações</label>

      <textarea
        id="pagamentoObservacoes"
        placeholder="Opcional"></textarea>
    </div>

    `,

    async e => {

      e.preventDefault();

      const btn =
        e.currentTarget.querySelector(
          'button[type="submit"]'
        );

      const mes =
        Number($('#pagamentoMes').value);

      const ano =
        Number($('#pagamentoAno').value);

      const valor =
        Number($('#pagamentoValor').value);

      const dataPagamento =
        $('#pagamentoData').value;

      const formaPagamento =
        $('#pagamentoForma').value;

      const observacoes =
        $('#pagamentoObservacoes').value.trim();


      if(!mes || !ano || !valor || !dataPagamento){

        toast('Preencha os dados do pagamento');
        return;
      }


      btn.disabled = true;
      btn.textContent = 'SALVANDO...';


      try{

        const mesTexto =
          String(mes).padStart(2,'0');

        const dataVencimento =
          `${ano}-${mesTexto}-28`;


        const numeroRecibo =
          'TG-' +
          ano +
          '-' +
          String(Date.now()).slice(-8);


        await api(
          '/rest/v1/pagamentos_produtores',
          {
            method:'POST',

            body:JSON.stringify({

              user_id:uid(),

              produtor_id:produtorId,

              competencia_mes:mes,

              competencia_ano:ano,

              valor:valor,

              data_vencimento:
                dataVencimento,

              data_pagamento:
                dataPagamento,

              forma_pagamento:
                formaPagamento,

              status:'pago',

              numero_recibo:
                numeroRecibo,

              observacoes:
                observacoes || null

            })
          }
        );


        toast('✓ Pagamento registrado');

        viewProdutor(produtorId);


      }catch(err){

        console.error(err);

        const texto =
          String(err?.message || err);


        if(
          texto.includes('pagamento_mes_unico') ||
          texto.includes('duplicate key')
        ){

          toast(
            'Esse mês já possui pagamento registrado'
          );

        }else{

          toast(
            'Não foi possível registrar o pagamento'
          );
        }


        btn.disabled = false;
        btn.textContent = 'SALVAR';
      }

    }
  );
}

function viewProdutor(id){

  const p=state.produtores.find(
    x=>String(x.id)===String(id)
  );

  if(!p){
    toast('Produtor não encontrado');
    return;
  }

  const w=$('#modalWrap');

  w.className='modal-backdrop';

  w.innerHTML=`
    <div class="modal">

      <div class="modal-head">
        <h3>Ficha do produtor</h3>

        <button
          class="close"
          id="closeModal">
          ×
        </button>
      </div>


      <div class="card">

        <h2 style="margin-top:0;">
          👨‍🌾 ${esc(p.nome||'Produtor')}
        </h2>

        <div
          style="
            display:grid;
            gap:10px;
            margin-top:16px;
          ">

          <div>
            <div class="meta">
              CPF/CNPJ
            </div>

            <strong>
              ${esc(p.cpf_cnpj||'Não informado')}
            </strong>
          </div>


          <div>
            <div class="meta">
              Telefone
            </div>

            <strong>
              ${esc(p.telefone||'Não informado')}
            </strong>
          </div>

          <div>
  <div class="meta">
    Município
  </div>

  <strong>
    ${esc(p.municipio||'Não informado')}
  </strong>
</div>

          <div>
  <div class="meta">
    Estado
  </div>

  <strong>
    ${esc(p.estado||'AM')}
  </strong>
</div>

<div>
  <div class="meta">
    Localidade / Comunidade
  </div>

  <strong>
    ${esc(p.localidade||'Não informado')}
  </strong>
</div>

${
  p.latitude && p.longitude
  ?`
    <button
      type="button"
      class="btn btn-block"
      id="abrirMapaProdutor"
      style="margin-top:16px;">
      🗺️ ABRIR NO MAPA
    </button>

    <div
      class="meta"
      style="margin-top:7px;text-align:center;">
      📍 Localização registrada
    </div>
  `
  :''
}

</div>

        ${
          p.observacoes
          ?`
            <div
              style="
                border-top:1px solid #ddd;
                margin-top:16px;
                padding-top:14px;
              ">

              <div class="meta">
                Observações
              </div>

              <div>
                ${esc(p.observacoes)}
              </div>

            </div>
          `
          :''
        }

      </div>


      <div class="card">

        <h3 style="margin-top:0;">
          🔑 Acesso ao aplicativo
        </h3>

        <p class="meta">
          Crie o acesso para o produtor entrar no TG Agro Campo.
        </p>

        <button
          class="btn btn-primary btn-block"
          type="button"
          id="criarAcessoProdutor">
          🔑 CRIAR ACESSO
        </button>

      </div>

      <div class="card">

  <h3 style="margin-top:0;">
    📄 Contrato
  </h3>

  <p
    id="contratoAdminStatus"
    class="meta">
    Nenhum contrato enviado.
  </p>

  <input
    type="file"
    id="arquivoContratoProdutor"
    accept="application/pdf"
    style="display:none;">

  <button
    type="button"
    class="btn btn-primary btn-block"
    id="adicionarContratoProdutor">
    📎 ADICIONAR CONTRATO
  </button>

  <button
    type="button"
    class="btn btn-block"
    id="verContratoAdmin"
    style="display:none;margin-top:8px;">
    📄 VER CONTRATO
  </button>

  <button
    type="button"
    class="btn btn-danger btn-block"
    id="excluirContratoAdmin"
    style="display:none;margin-top:8px;">
    🗑️ EXCLUIR CONTRATO
  </button>

</div>
</div>

<div class="card">

  <h3 style="margin-top:0;">
    💰 Financeiro
  </h3>

  <p class="meta">
    Registre as mensalidades pagas deste produtor.
  </p>

  <button
    type="button"
    class="btn btn-primary btn-block"
    id="registrarPagamentoProdutor">
    💰 REGISTRAR PAGAMENTO
  </button>

</div>
      <button
        class="btn btn-primary btn-block"
        type="button"
        id="editarDadosProdutor">
        ✏️ EDITAR DADOS
      </button>

      <button
  class="btn btn-danger btn-block"
  type="button"
  id="excluirProdutorFicha"
  style="margin-top:10px;">
  🗑️ EXCLUIR PRODUTOR
</button>

    </div>
  `;
verificarContratoProdutor(id);
  const btnRegistrarPagamento =
  $('#registrarPagamentoProdutor');

if(btnRegistrarPagamento){

  btnRegistrarPagamento.onclick=()=>{
    abrirPagamentoProdutor(id);
  };

}

  $('#closeModal').onclick=
    closeModal;
const btnAdicionarContrato =
  $('#adicionarContratoProdutor');

const inputContrato =
  $('#arquivoContratoProdutor');

if(btnAdicionarContrato && inputContrato){

  btnAdicionarContrato.onclick=()=>{

    inputContrato.value='';
    inputContrato.click();

  };

  inputContrato.onchange=async()=>{

    const arquivo =
      inputContrato.files?.[0];

    if(!arquivo)return;

    const textoAnterior =
      btnAdicionarContrato.textContent;

    btnAdicionarContrato.disabled=true;
    btnAdicionarContrato.textContent=
      '⏳ ENVIANDO...';

    try{

      await enviarContratoProdutor(
        id,
        arquivo
      );

    }finally{

      btnAdicionarContrato.disabled=false;
      btnAdicionarContrato.textContent=
        textoAnterior;

    }

  };

}

  const btnVerContrato =
  $('#verContratoAdmin');

if(btnVerContrato){

  btnVerContrato.onclick=()=>{
    abrirContratoProdutor(id);
  };

}


const btnExcluirContrato =
  $('#excluirContratoAdmin');

if(btnExcluirContrato){

  btnExcluirContrato.onclick=()=>{
    excluirContratoProdutor(id);
  };

}

  $('#editarDadosProdutor').onclick=()=>{

    closeModal();

    editProdutor(id);
  };

  const excluirBtn=$('#excluirProdutorFicha');

if(excluirBtn){

  excluirBtn.onclick=()=>{

    excluirProdutorCompleto(
      id,
      excluirBtn
    );

  };
}
 
const mapaBtn=$('#abrirMapaProdutor');

if(mapaBtn){

  mapaBtn.onclick=()=>{

    const lat=Number(p.latitude);
    const lng=Number(p.longitude);

    if(!lat || !lng){

      toast('Localização não disponível');
      return;
    }

    if(
      window.AndroidTG &&
      typeof AndroidTG.abrirMapa==='function'
    ){

      AndroidTG.abrirMapa(
        lat,
        lng
      );

    }else{

      toast(
        'Não foi possível abrir o mapa'
      );
    }
  };
}

  $('#criarAcessoProdutor').onclick=
    async()=>{

      const email=prompt(
        'Digite o e-mail de acesso do produtor:'
      );

      if(!email)return;


      const senha=prompt(
        'Digite a senha inicial (mínimo 6 caracteres):'
      );

      if(!senha)return;


      if(senha.length<6){

        toast(
          'A senha precisa ter pelo menos 6 caracteres'
        );

        return;
      }


      try{

        toast('Criando acesso...');


        const res=await fetch(
          SUPABASE_URL+
          '/functions/v1/super-endpoint',
          {
            method:'POST',

            headers:{
              'Content-Type':'application/json',
              'apikey':SUPABASE_KEY,
              'Authorization':
                'Bearer '+
                state.session.access_token
            },

            body:JSON.stringify({
              produtor_id:id,
              email:
                email
                  .trim()
                  .toLowerCase(),
              password:senha
            })
          }
        );


        const dados=
          await res.json();


        if(!res.ok){

          throw new Error(
            dados.error||
            'Erro ao criar acesso'
          );
        }


        toast(
          '✓ Acesso criado com sucesso'
        );


      }catch(err){

        console.error(err);

        toast(
          err.message||
          'Não foi possível criar o acesso'
        );
      }
    };
}

function editProdutor(id){

  const p=state.produtores.find(
    x=>String(x.id)===String(id)
  );

  if(!p)return;


  modal(
    'Editar produtor',
    `

    <div class="field">
      <label>Nome</label>

      <input
        name="nome"
        required
        value="${esc(p.nome||'')}">
    </div>


    <div class="row2">

      <div class="field">
        <label>Telefone</label>

        <input
          name="telefone"
          value="${esc(p.telefone||'')}">
      </div>


      <div class="field">
        <label>CPF/CNPJ</label>

        <input
          name="cpf_cnpj"
          value="${esc(p.cpf_cnpj||'')}">
      </div>

    </div>


    <div class="row2">

      <div class="field">
        <label>Município</label>

        <input
          name="municipio"
          value="${esc(p.municipio||'')}">
      </div>


      <div class="field">
        <label>Estado</label>

        <input
          name="estado"
          value="${esc(p.estado||'AM')}">
      </div>

    </div>


    <div class="field">

      <label>Localidade / Comunidade</label>

      <input
        name="localidade"
        value="${esc(p.localidade||'')}"
        placeholder="Ex.: Novo Remanso">

    </div>


    <input
      type="hidden"
      name="latitude"
      id="novoProdLatitude"
      value="${p.latitude??''}">


    <input
      type="hidden"
      name="longitude"
      id="novoProdLongitude"
      value="${p.longitude??''}">


    <button
      type="button"
      class="btn btn-block"
      id="capturarLocalizacaoProdutor"
      style="margin-bottom:8px;">

      📍 ATUALIZAR LOCALIZAÇÃO

    </button>


    <div
      id="statusLocalizacaoProdutor"
      class="meta"
      style="margin-bottom:16px;">

      ${
        p.latitude && p.longitude
        ?`
          ✅ Localização registrada<br>
          ${Number(p.latitude).toFixed(6)},
          ${Number(p.longitude).toFixed(6)}
        `
        :'Nenhuma localização registrada'
      }

    </div>


    <div class="field">

      <label>Observações</label>

      <textarea
        name="observacoes">${esc(p.observacoes||'')}</textarea>

    </div>


    <button
      class="btn btn-danger btn-block"
      type="button"
      id="deleteProdutor">

      EXCLUIR PRODUTOR

    </button>

    `,

    async e=>{

      e.preventDefault();

      const btn=e.submitter;

      if(btn)btn.disabled=true;

      try{

        await updateRow(
          'produtores',
          id,
          formObj(e.currentTarget)
        );

        closeModal();

        await loadAll();

        toast('Produtor atualizado');

      }catch(err){

        console.error(err);

        toast('Erro ao atualizar produtor');

      }finally{

        if(btn)btn.disabled=false;
      }
    }
  );


  setTimeout(()=>{

    // =========================
    // ATUALIZAR GPS
    // =========================

    const gpsBtn=
      $('#capturarLocalizacaoProdutor');

    const statusGps=
      $('#statusLocalizacaoProdutor');


    if(gpsBtn){

      gpsBtn.onclick=()=>{

        if(
          !window.AndroidTG ||
          typeof AndroidTG.capturarLocalizacao!=='function'
        ){

          toast(
            'GPS do aplicativo indisponível'
          );

          return;
        }


        gpsBtn.disabled=true;

        gpsBtn.textContent=
          '📍 Localizando...';


        if(statusGps){

          statusGps.textContent=
            'Buscando sua localização...';
        }


        try{

          AndroidTG.capturarLocalizacao();

        }catch(err){

          console.error(
            'Erro GPS:',
            err
          );

          gpsBtn.disabled=false;

          gpsBtn.textContent=
            '📍 TENTAR NOVAMENTE';

          toast(
            'Não foi possível acessar o GPS'
          );
        }

      };
    }


    // =========================
    // EXCLUIR PRODUTOR
    // =========================

    const del=
      $('#deleteProdutor');


    if(del){

      del.onclick=async()=>{

        const props=
          state.propriedades.filter(
            x=>String(x.produtor_id)===String(id)
          ).length;


        if(props){

          toast(
            'Exclua primeiro as propriedades deste produtor'
          );

          return;
        }


        if(
          !confirm(
            'Excluir este produtor?'
          )
        )return;


        try{

          await deleteRow(
            'produtores',
            id
          );

          closeModal();

          await loadAll();

          toast(
            'Produtor excluído'
          );

        }catch(err){

          console.error(err);

          toast(
            'Não foi possível excluir'
          );
        }
      };
    }

  },0);
}

function viewPropriedade(id){

  const p=state.propriedades.find(
    x=>String(x.id)===String(id)
  );

  if(!p){
    toast('Propriedade não encontrada');
    return;
  }


  const produtor=
    state.produtores.find(
      x=>String(x.id)===
         String(p.produtor_id)
    );


  const talhoes=
    state.talhoes.filter(
      t=>String(t.propriedade_id)===
         String(id)
    );
  
  const idsTalhoes =
  new Set(
    talhoes.map(
      t=>String(t.id)
    )
  );


const lavouras =
  state.safras.filter(
    s=>idsTalhoes.has(
      String(s.talhao_id)
    )
  );


  const temLocalizacao=
    p.latitude!==null &&
    p.latitude!==undefined &&
    p.longitude!==null &&
    p.longitude!==undefined;


  const w=$('#modalWrap');

  w.className='modal-backdrop';


  w.innerHTML=`

    <div class="modal">

      <div class="modal-head">

        <h3>
          Ficha da propriedade
        </h3>

        <button
          class="close"
          id="closeModal">
          ×
        </button>

      </div>


      <div class="card">

        <h2 style="margin-top:0;">
          🏡 ${esc(p.nome||'Propriedade')}
        </h2>


        <div
          style="
            display:grid;
            gap:12px;
            margin-top:18px;
          ">


          <div>

            <div class="meta">
              Produtor
            </div>

            <strong>
              ${esc(
                produtor?.nome||
                'Não informado'
              )}
            </strong>

          </div>


          <div>

            <div class="meta">
              Município
            </div>

            <strong>
              ${esc(
                p.municipio||
                'Não informado'
              )}
            </strong>

          </div>


          <div>

            <div class="meta">
              Estado
            </div>

            <strong>
              ${esc(p.estado||'AM')}
            </strong>

          </div>


          <div>

            <div class="meta">
              Comunidade / Localidade
            </div>

            <strong>
              ${esc(
                p.comunidade||
                'Não informado'
              )}
            </strong>

          </div>


          <div>

            <div class="meta">
              Área total
            </div>

            <strong>
              ${
                Number(p.area_total_ha||0)
                  .toLocaleString('pt-BR')
              } ha
            </strong>

          </div>


          <div>

            <div class="meta">
              Protocolo
            </div>

            <strong>
              ${esc(
                p.protocolo||
                'Não informado'
              )}
            </strong>

          </div>


          <div>

            <div class="meta">
              Talhões cadastrados
            </div>

            <strong>
              ${talhoes.length}
            </strong>

          </div>

        </div>


        ${
          temLocalizacao
          ?`

            <button
              type="button"
              class="btn btn-block"
              id="abrirMapaPropriedadeFicha"
              style="margin-top:18px;">

              🗺️ ABRIR NO MAPA

            </button>


            <div
              class="meta"
              style="
                margin-top:8px;
                text-align:center;
              ">

              📍 Localização registrada

            </div>

          `
          :`

            <div
              class="meta"
              style="
                margin-top:18px;
                text-align:center;
              ">

              📍 Localização não cadastrada

            </div>

          `
        }

      </div>

     <!-- ========================= -->
      <!-- TALHÕES -->
      <!-- ========================= -->

      <h3 style="margin-top:24px;">
        🌱 Talhões
      </h3>

      ${
        talhoes.length
          ? talhoes.map(t=>`

              <div
                class="card card-click"
                data-edit-talhao="${esc(t.id)}">

                <div class="card-row">

                  <div>

                    <strong>
                      ${esc(t.nome || 'Talhão')}
                    </strong>

                    <div class="meta">
                      Área:
                      ${
                        Number(t.area_ha || 0)
                          .toLocaleString('pt-BR')
                      } ha
                    </div>

                  </div>

                  <span class="pill">
                    ${
                      lavouras.filter(
                        s=>String(s.talhao_id)===
                           String(t.id)
                      ).length
                    } lavoura(s)
                  </span>

                </div>

                <div class="edit-hint">
                  Toque para abrir o talhão
                </div>

              </div>

            `).join('')
          : `
              <div class="empty">
                Nenhum talhão cadastrado.
              </div>
            `
      }


      <button
        type="button"
        class="btn btn-primary btn-block"
        id="novoTalhaoPropriedadeFicha"
        style="margin-top:10px;">

        ➕ NOVO TALHÃO

      </button>


      <!-- ========================= -->
      <!-- LAVOURAS -->
      <!-- ========================= -->

      <h3 style="margin-top:24px;">
        🌾 Lavouras
      </h3>

      ${
        lavouras.length
          ? lavouras.map(s=>{

              const talhao =
                talhoes.find(
                  t=>String(t.id)===
                     String(s.talhao_id)
                );

              return `

                <div
                  class="card card-click"
                  data-edit-safra="${esc(s.id)}">

                  <div class="card-row">

                    <div>

                      <strong>
                        🌿 ${esc(s.cultura || 'Lavoura')}
                        ${
                          s.variedade
                            ? ` • ${esc(s.variedade)}`
                            : ''
                        }
                      </strong>

                      <div class="meta">
                        ${
                          esc(
                            talhao?.nome ||
                            'Talhão não informado'
                          )
                        }
                      </div>

                      ${
                        s.data_plantio
                          ? `
                              <div class="meta">
                                Plantio:
                                ${dateBR(s.data_plantio)}
                              </div>
                            `
                          : ''
                      }

                    </div>

                    <span class="pill">
                      ${esc(s.status || 'ativa')}
                    </span>

                  </div>

                  <div class="edit-hint">
                    Toque para abrir a lavoura
                  </div>

                </div>

              `;

            }).join('')
          : `
              <div class="empty">
                Nenhuma lavoura cadastrada.
              </div>
            `
      }


      <button
        type="button"
        class="btn btn-primary btn-block"
        id="novaLavouraPropriedadeFicha"
        style="margin-top:10px;">

        ➕ NOVA LAVOURA

      </button>
      <button
        class="btn btn-primary btn-block"
        type="button"
        id="editarDadosPropriedade">

        ✏️ EDITAR DADOS

      </button>


      <button
        class="btn btn-danger btn-block"
        type="button"
        id="excluirPropriedadeFicha"
        style="margin-top:10px;">

        🗑️ EXCLUIR PROPRIEDADE

      </button>

    </div>
  `;


  // FECHAR

  $('#closeModal').onclick=
    closeModal;


  // EDITAR

  $('#editarDadosPropriedade').onclick=()=>{

    closeModal();

    editPropriedade(id);
  };

  const btnNovoTalhao =
  $('#novoTalhaoPropriedadeFicha');

if(btnNovoTalhao){

  btnNovoTalhao.onclick=()=>{

    closeModal();

    modal(
      'Novo talhão',

      `
        <input
          type="hidden"
          name="propriedade_id"
          value="${esc(id)}">

        <div class="field">
          <label>Propriedade</label>

          <input
            value="${esc(p.nome || 'Propriedade')}"
            disabled>
        </div>

        <div class="row2">

          <div class="field">
            <label>Nome</label>

            <input
              name="nome"
              required
              placeholder="Talhão 01">
          </div>

          <div class="field">
            <label>Área (ha)</label>

            <input
              name="area_ha"
              type="number"
              step="0.01">
          </div>

        </div>

        <div class="field">
          <label>Observações</label>

          <textarea
            name="observacoes">
          </textarea>
        </div>
      `,

      submitSimple('talhoes')
    );

  };

}

  const btnNovaLavoura =
  $('#novaLavouraPropriedadeFicha');

if(btnNovaLavoura){

  btnNovaLavoura.onclick=()=>{

    if(!talhoes.length){
      toast('Cadastre um talhão primeiro');
      return;
    }

    closeModal();

    modal(
      'Nova lavoura',

      `
        <div class="field">
          <label>Talhão *</label>

          <select
            name="talhao_id"
            required>

            <option value="">
              Selecione
            </option>

            ${
              talhoes.map(t=>`
                <option value="${esc(t.id)}">
                  ${esc(t.nome)}
                </option>
              `).join('')
            }

          </select>
        </div>


        <div class="row2">

          <div class="field">
            <label>Cultura *</label>

            <input
              name="cultura"
              required
              placeholder="Maracujá">
          </div>

          <div class="field">
            <label>Variedade</label>

            <input
              name="variedade">
          </div>

        </div>


        <div class="row2">

          <div class="field">
            <label>Data de plantio</label>

            <input
              name="data_plantio"
              type="date">
          </div>

          <div class="field">
            <label>Nº de plantas</label>

            <input
              name="numero_plantas"
              type="number">
          </div>

        </div>


        <div class="row2">

          <div class="field">
            <label>Espaçamento linhas (m)</label>

            <input
              name="espacamento_linhas_m"
              type="number"
              step="0.01">
          </div>

          <div class="field">
            <label>Espaçamento plantas (m)</label>

            <input
              name="espacamento_plantas_m"
              type="number"
              step="0.01">
          </div>

        </div>
      `,

      submitSimple('safras')
    );

  };

}


  // MAPA

  const mapaBtn=
    $('#abrirMapaPropriedadeFicha');


  if(mapaBtn){

    mapaBtn.onclick=()=>{

      const lat=Number(
        p.latitude
      );

      const lng=Number(
        p.longitude
      );


      if(!lat || !lng){

        toast(
          'Localização não disponível'
        );

        return;
      }


      if(
        window.AndroidTG &&
        typeof AndroidTG.abrirMapa==='function'
      ){

        AndroidTG.abrirMapa(
          lat,
          lng
        );

      }else{

        toast(
          'Não foi possível abrir o mapa'
        );
      }
    };
  }


  // EXCLUIR

  const excluirBtn=
    $('#excluirPropriedadeFicha');


  if(excluirBtn){

    excluirBtn.onclick=async()=>{


      if(talhoes.length){

        toast(
          'Exclua primeiro os talhões desta propriedade'
        );

        return;
      }


      if(
        !confirm(
          `Excluir definitivamente ${p.nome||'esta propriedade'}?`
        )
      )return;


      try{

        excluirBtn.disabled=true;

        excluirBtn.textContent=
          'Excluindo...';


        await deleteRow(
          'propriedades',
          id
        );


        closeModal();

        await loadAll();


        toast(
          'Propriedade excluída'
        );


      }catch(err){

        console.error(err);


        excluirBtn.disabled=false;

        excluirBtn.textContent=
          '🗑️ EXCLUIR PROPRIEDADE';


        toast(
          'Não foi possível excluir a propriedade'
        );
      }
    };
  }
}

function editPropriedade(id){

  const p=state.propriedades.find(
    x=>String(x.id)===String(id)
  );

  if(!p)return;


  const temLocalizacao=
    p.latitude!==null &&
    p.latitude!==undefined &&
    p.longitude!==null &&
    p.longitude!==undefined;


  modal(
    'Editar propriedade',
    `

    <div class="field">
      <label>Produtor</label>

      <select
        name="produtor_id"
        required>

        <option value="">
          Selecione
        </option>

        ${optsSelected(
          state.produtores,
          p.produtor_id
        )}

      </select>
    </div>


    <div class="field">
      <label>Nome da propriedade</label>

      <input
        name="nome"
        required
        value="${esc(p.nome||'')}">
    </div>


    <div class="row2">

      <div class="field">
        <label>Município</label>

        <input
          name="municipio"
          value="${esc(p.municipio||'')}">
      </div>


      <div class="field">
        <label>Estado</label>

        <input
          name="estado"
          value="${esc(p.estado||'AM')}">
      </div>

    </div>


    <div class="field">
      <label>Comunidade / Localidade</label>

      <input
        name="comunidade"
        value="${esc(p.comunidade||'')}">
    </div>


    <div class="field">
      <label>Área total (ha)</label>

      <input
        name="area_total_ha"
        type="number"
        step="0.01"
        min="0"
        value="${p.area_total_ha??''}">
    </div>


    <input
      type="hidden"
      name="latitude"
      id="novaPropLatitude"
      value="${p.latitude??''}">

    <input
      type="hidden"
      name="longitude"
      id="novaPropLongitude"
      value="${p.longitude??''}">


    <button
      type="button"
      class="btn btn-block"
      id="capturarLocalizacaoPropriedade"
      style="margin-bottom:8px;">

      📍 ATUALIZAR LOCALIZAÇÃO

    </button>


    <div
      id="statusLocalizacaoPropriedade"
      class="meta"
      style="margin-bottom:14px;">

      ${
        temLocalizacao
          ?`✅ Localização registrada<br>
             ${Number(p.latitude).toFixed(6)},
             ${Number(p.longitude).toFixed(6)}`
          :'Nenhuma localização registrada'
      }

    </div>


    ${
      temLocalizacao
      ?`
        <button
          type="button"
          class="btn btn-block"
          id="abrirMapaPropriedade"
          style="margin-bottom:14px;">

          🗺️ ABRIR NO MAPA

        </button>
      `
      :''
    }


    <button
      class="btn btn-danger btn-block"
      type="button"
      id="deletePropriedade">

      EXCLUIR PROPRIEDADE

    </button>

    `,


    async e=>{

      e.preventDefault();

      const btn=e.submitter;

      if(btn)btn.disabled=true;

      try{

        await updateRow(
          'propriedades',
          id,
          formObj(e.currentTarget)
        );

        closeModal();

        await loadAll();

        toast(
          'Propriedade atualizada'
        );

      }catch(err){

        console.error(err);

        toast(
          'Erro ao atualizar propriedade'
        );

      }finally{

        if(btn)btn.disabled=false;
      }
    }
  );


  setTimeout(()=>{


    // =========================
    // GPS
    // =========================

    const gpsBtn=
      $('#capturarLocalizacaoPropriedade');

    const statusGps=
      $('#statusLocalizacaoPropriedade');


    if(gpsBtn){

      gpsBtn.onclick=()=>{

        if(
          !window.AndroidTG ||
          typeof AndroidTG.capturarLocalizacao!=='function'
        ){

          toast(
            'GPS do aplicativo indisponível'
          );

          return;
        }


        gpsBtn.disabled=true;

        gpsBtn.textContent=
          '📍 Localizando...';


        if(statusGps){

          statusGps.textContent=
            'Buscando sua localização...';
        }


        try{

          AndroidTG.capturarLocalizacao();

        }catch(err){

          console.error(
            'Erro GPS propriedade:',
            err
          );

          gpsBtn.disabled=false;

          gpsBtn.textContent=
            '📍 TENTAR NOVAMENTE';

          toast(
            'Não foi possível acessar o GPS'
          );
        }
      };
    }


    // =========================
    // ABRIR NO MAPA
    // =========================

    const mapaBtn=
      $('#abrirMapaPropriedade');


    if(mapaBtn){

      mapaBtn.onclick=()=>{

        const lat=Number(
          $('#novaPropLatitude')?.value
        );

        const lng=Number(
          $('#novaPropLongitude')?.value
        );


        if(!lat || !lng){

          toast(
            'Localização não disponível'
          );

          return;
        }


        if(
          window.AndroidTG &&
          typeof AndroidTG.abrirMapa==='function'
        ){

          AndroidTG.abrirMapa(
            lat,
            lng
          );

        }else{

          toast(
            'Não foi possível abrir o mapa'
          );
        }
      };
    }


    // =========================
    // EXCLUIR
    // =========================

    const del=
      $('#deletePropriedade');


    if(del){

      del.onclick=async()=>{

        if(
          state.talhoes.some(
            t=>String(t.propriedade_id)===
               String(id)
          )
        ){

          toast(
            'Exclua primeiro os talhões desta propriedade'
          );

          return;
        }


        if(
          !confirm(
            'Excluir esta propriedade?'
          )
        )return;


        try{

          await deleteRow(
            'propriedades',
            id
          );

          closeModal();

          await loadAll();

          toast(
            'Propriedade excluída'
          );

        }catch(err){

          console.error(err);

          toast(
            'Não foi possível excluir'
          );
        }
      };
    }

  },0);
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
  fd.get('data_aplicacao')>=hoje
    ?'programada'
    :'realizada',

data_realizacao:
  fd.get('data_aplicacao')>=hoje
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
          placeholder="Nome do produto">
      </div>

      <div class="row2">

        <div class="field">
          <label>Dose</label>

          <input
            class="aplic-dose"
            type="number"
            step="any"
            min="0">
          
        </div>

        <div class="field">
          <label>Unidade</label>

          <input
            class="aplic-unidade"
            placeholder="Ex.: mL/20 L, mL/100 L, L/ha"
            
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

    })).filter(x=>x.produto);

if(!itens.length){
  toast('Informe pelo menos um produto');
  return;
}

if(itens.some(x=>x.dose==='' || x.unidade==='')){
  toast('Informe dose e unidade dos produtos preenchidos');
  return;
}

    const fd=new FormData(form);

    const row={

      safra_id:sid,

      data_aplicacao:
        fd.get('data_aplicacao'),
      
      status:
    fd.get('data_aplicacao')>=hoje
      ?'programada'
      :'realizada',

  data_realizacao:
    fd.get('data_aplicacao')>=hoje
      ?null
      :fd.get('data_aplicacao'),

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

  const s=state.safras.find(
    x=>String(x.id)===String(sid)
  );

  if(!s){
    toast('Lavoura não encontrada');
    return;
  }

  const t=talhaoOfSafra(s);
  const param=parametroCultura(s.cultura);
  const cultura=normalizarTexto(s.cultura);

  const registros=state.colheitas
    .filter(c=>
      String(c.safra_id)===String(sid)
    )
    .sort((a,b)=>
      (b.data_colheita||'')
        .localeCompare(a.data_colheita||'')
    );


  // =========================
  // CONFIGURAÇÃO POR CULTURA
  // =========================

  let labelQuantidade='Quantidade de frutos';
  let nomeUnidade='frutos';
  let mostrarQuantidade=true;

  if(cultura.includes('banana')){
    labelQuantidade='Quantidade de cachos';
    nomeUnidade='cachos';
  }

  if(cultura.includes('melancia')){
    labelQuantidade='Quantidade de frutos';
    nomeUnidade='frutos';
  }

  if(cultura.includes('maracuja')){
    labelQuantidade='Quantidade de frutos';
    nomeUnidade='frutos';
  }

  if(cultura.includes('abacaxi')){
    labelQuantidade='Quantidade de frutos';
    nomeUnidade='frutos';
  }

  if(cultura.includes('pimentao')){
    labelQuantidade='Quantidade de frutos (opcional)';
    nomeUnidade='frutos';
  }


  // =========================
  // RESUMOS
  // =========================

  const totalKg=registros.reduce(
    (n,c)=>n+Number(c.peso_kg||0),
    0
  );

  const totalQtd=registros.reduce(
    (n,c)=>n+Number(c.quantidade_frutos||0),
    0
  );

  const plantas=Number(
    s.numero_plantas||0
  );

  const area=Number(
    t?.area_ha||0
  );

  const kgPlanta=
    plantas
      ?totalKg/plantas
      :0;

  const tha=
    area
      ?totalKg/area/1000
      :0;

  const pesoMedio=
    totalQtd
      ?totalKg/totalQtd
      :0;


  // =========================
  // PRODUÇÃO DO MÊS
  // =========================

  const mesAtual=hoje.slice(0,7);

  const kgMes=registros
    .filter(c=>
      String(c.data_colheita||'')
        .startsWith(mesAtual)
    )
    .reduce(
      (n,c)=>n+Number(c.peso_kg||0),
      0
    );


  // =========================
  // PRODUÇÃO DA SEMANA
  // =========================

  const dataHoje=
    new Date(hoje+'T12:00:00');

  const diaSemana=
    dataHoje.getDay()||7;

  const inicioSemana=
    new Date(dataHoje);

  inicioSemana.setDate(
    dataHoje.getDate()-diaSemana+1
  );

  const fimSemana=
    new Date(inicioSemana);

  fimSemana.setDate(
    inicioSemana.getDate()+6
  );

  function dataISO(d){
    const y=d.getFullYear();
    const m=String(
      d.getMonth()+1
    ).padStart(2,'0');

    const dia=String(
      d.getDate()
    ).padStart(2,'0');

    return `${y}-${m}-${dia}`;
  }

  const iniSem=dataISO(inicioSemana);
  const fimSem=dataISO(fimSemana);

  const kgSemana=registros
    .filter(c=>
      (c.data_colheita||'')>=iniSem &&
      (c.data_colheita||'')<=fimSem
    )
    .reduce(
      (n,c)=>n+Number(c.peso_kg||0),
      0
    );


  // =========================
  // RECEITA
  // =========================

  const receita=registros.reduce(
    (n,c)=>
      n+
      (
        Number(c.peso_kg||0) *
        Number(c.preco_kg||0)
      ),
    0
  );


  // =========================
  // HISTÓRICO
  // =========================

  const historico=registros.length
    ?registros.map(c=>{

      const kg=Number(
        c.peso_kg||0
      );

      const qtd=Number(
        c.quantidade_frutos||0
      );

      const medio=
        qtd
          ?kg/qtd
          :0;

      return `
        <div class="card">

          <div class="card-row">

            <div>

              <h4>
                ${kg.toLocaleString(
                  'pt-BR',
                  {maximumFractionDigits:2}
                )} kg
              </h4>

              <div class="meta">
                ${dateBR(c.data_colheita)}
              </div>

              ${
                qtd
                ?`
                  <div class="meta">
                    ${labelQuantidade}:
                    ${qtd.toLocaleString('pt-BR')}
                  </div>

                  <div class="meta">
                    Peso médio:
                    ${medio
                      .toFixed(2)
                      .replace('.',',')} kg/${nomeUnidade.slice(0,-1)}
                  </div>
                `
                :''
              }

              ${
                c.preco_kg
                ?`
                  <div class="meta">
                    Preço:
                    R$ ${Number(c.preco_kg)
                      .toFixed(2)
                      .replace('.',',')}/kg
                  </div>
                `
                :''
              }

              ${
                c.observacoes
                ?`
                  <div
                    class="meta"
                    style="margin-top:5px">
                    ${esc(c.observacoes)}
                  </div>
                `
                :''
              }

            </div>

          </div>

        </div>
      `;
    }).join('')
    :`
      <div class="empty">
        Nenhuma produção registrada nesta lavoura.
      </div>
    `;


  // =========================
  // FORMULÁRIO
  // =========================

  modal(
    'Registrar produção',
    `

    <div class="card">

      <h4>
        ${esc(s.cultura||'Lavoura')}
        ${s.variedade
          ?' • '+esc(s.variedade)
          :''
        }
      </h4>

      <div class="meta">
        ${esc(t?.nome||'Talhão')}
        •
        ${Number(area||0)
          .toLocaleString('pt-BR')} ha
      </div>

      <div class="meta">
        Acompanhamento:
        ${esc(param.acompanhamento)}
      </div>

    </div>


    <input
      type="hidden"
      name="safra_id"
      value="${esc(sid)}">


    <div class="row2">

      <div class="field">

        <label>
          Data da colheita
        </label>

        <input
          name="data_colheita"
          type="date"
          value="${hoje}"
          required>

      </div>


      <div class="field">

        <label>
          Peso colhido (kg)
        </label>

        <input
          id="pesoColheita"
          name="peso_kg"
          type="number"
          step="0.001"
          min="0"
          required>

      </div>

    </div>


    ${
      mostrarQuantidade
      ?`
        <div class="field">

          <label>
            ${labelQuantidade}
          </label>

          <input
            id="frutosColheita"
            name="quantidade_frutos"
            type="number"
            min="0">

        </div>
      `
      :''
    }


    <div class="field">

      <label>
        Preço por kg (R$) — opcional
      </label>

      <input
        id="precoColheita"
        name="preco_kg"
        type="number"
        step="0.01"
        min="0">

    </div>


    <div class="field">

      <label>
        Observações
      </label>

      <textarea
        name="observacoes"
        placeholder="Qualidade, perdas, classificação, observações da colheita..."></textarea>

    </div>


    <div class="card">

      <h4>
        Resultado desta colheita
      </h4>

      <div
        id="calcColheita"
        class="meta">

        Informe o peso da colheita.

      </div>

    </div>


    <h3>
      Desempenho da lavoura
    </h3>


    <div
      style="
        display:grid;
        grid-template-columns:1fr 1fr;
        gap:10px;
      ">


      ${
        cultura.includes('maracuja') ||
        cultura.includes('pimentao')
        ?`
          <div class="card" style="margin:0">

            <div class="meta">
              Esta semana
            </div>

            <h4>
              ${kgSemana.toLocaleString(
                'pt-BR',
                {maximumFractionDigits:1}
              )} kg
            </h4>

          </div>
        `
        :''
      }


      <div class="card" style="margin:0">

        <div class="meta">
          Este mês
        </div>

        <h4>
          ${kgMes.toLocaleString(
            'pt-BR',
            {maximumFractionDigits:1}
          )} kg
        </h4>

      </div>


      <div class="card" style="margin:0">

        <div class="meta">
          Acumulado
        </div>

        <h4>
          ${totalKg.toLocaleString(
            'pt-BR',
            {maximumFractionDigits:1}
          )} kg
        </h4>

      </div>


      <div class="card" style="margin:0">

        <div class="meta">
          Produtividade
        </div>

        <h4>
          ${tha
            .toFixed(2)
            .replace('.',',')} t/ha
        </h4>

      </div>


      ${
        plantas
        ?`
          <div class="card" style="margin:0">

            <div class="meta">
              Produção/planta
            </div>

            <h4>
              ${kgPlanta
                .toFixed(2)
                .replace('.',',')} kg
            </h4>

          </div>
        `
        :''
      }


      ${
        totalQtd
        ?`
          <div class="card" style="margin:0">

            <div class="meta">
              Peso médio
            </div>

            <h4>
              ${pesoMedio
                .toFixed(2)
                .replace('.',',')} kg
            </h4>

          </div>
        `
        :''
      }

    </div>


    ${
      receita
      ?`
        <div
          class="card"
          style="margin-top:10px">

          <div class="meta">
            Receita registrada
          </div>

          <h4>
            R$ ${receita.toLocaleString(
              'pt-BR',
              {
                minimumFractionDigits:2,
                maximumFractionDigits:2
              }
            )}
          </h4>

        </div>
      `
      :''
    }


    <h3>
      Histórico de produção
    </h3>

    ${historico}

    `,


    async e=>{

      e.preventDefault();

      const form=e.currentTarget;
      const btn=e.submitter;

      if(btn)btn.disabled=true;

      try{

        const row=
          formObj(form);

        row.safra_id=sid;

        await insertRow(
          'colheitas',
          row
        );

        closeModal();

        await loadAll();

        toast(
          'Produção registrada com sucesso'
        );

      }catch(err){

        console.error(err);

        toast(
          'Erro ao registrar produção'
        );

      }finally{

        if(btn)btn.disabled=false;
      }
    }
  );


  // =========================
  // CÁLCULO EM TEMPO REAL
  // =========================

  setTimeout(()=>{

    const peso=
      $('#pesoColheita');

    const qtd=
      $('#frutosColheita');

    const preco=
      $('#precoColheita');

    const calc=
      $('#calcColheita');


    function atualizar(){

      const kg=
        Number(peso?.value||0);

      const quantidade=
        Number(qtd?.value||0);

      const valorKg=
        Number(preco?.value||0);


      if(!kg){

        calc.innerHTML=
          'Informe o peso da colheita.';

        return;
      }


      const porPlanta=
        plantas
          ?kg/plantas
          :0;


      const produtividadeColheita=
        area
          ?kg/area/1000
          :0;


      const pesoUnidade=
        quantidade
          ?kg/quantidade
          :0;


      const valor=
        valorKg
          ?kg*valorKg
          :0;


      calc.innerHTML=`

        <strong>
          ${kg.toLocaleString(
            'pt-BR',
            {maximumFractionDigits:2}
          )} kg
        </strong>

        ${
          area
          ?`
            <br>
            Produtividade desta colheita:
            ${produtividadeColheita
              .toFixed(2)
              .replace('.',',')} t/ha
          `
          :''
        }

        ${
          plantas
          ?`
            <br>
            ${porPlanta
              .toFixed(3)
              .replace('.',',')} kg/planta
          `
          :''
        }

        ${
          quantidade
          ?`
            <br>
            Peso médio:
            ${pesoUnidade
              .toFixed(2)
              .replace('.',',')}
            kg/${nomeUnidade.slice(0,-1)}
          `
          :''
        }

        ${
          valor
          ?`
            <br>
            Valor estimado:
            <strong>
              R$ ${valor.toLocaleString(
                'pt-BR',
                {
                  minimumFractionDigits:2,
                  maximumFractionDigits:2
                }
              )}
            </strong>
          `
          :''
        }
      `;
    }


    if(peso){
      peso.oninput=atualizar;
    }

    if(qtd){
      qtd.oninput=atualizar;
    }

    if(preco){
      preco.oninput=atualizar;
    }

  },0);
}
function openNovoProdutor(){

  modal(
    'Novo produtor',
    `
      <h3 style="margin-top:0;">
        👨‍🌾 Dados do produtor
      </h3>

      <div class="field">
        <label>Nome *</label>
        <input
          name="nome"
          required
          placeholder="Nome do produtor">
      </div>

      <div class="row2">

        <div class="field">
          <label>Telefone</label>
          <input
            name="telefone"
            placeholder="(92) 99999-9999">
        </div>

        <div class="field">
          <label>CPF/CNPJ</label>
          <input
            name="cpf_cnpj"
            placeholder="CPF ou CNPJ">
        </div>

      </div>

      <div class="row2">

        <div class="field">
          <label>Município</label>
          <input
            name="municipio">
        </div>

        <div class="field">
          <label>Estado</label>
          <input
            name="estado"
            value="AM">
        </div>

      </div>

      <div class="field">
        <label>Localidade / Comunidade</label>
        <input
          name="localidade"
          placeholder="Ex.: Novo Remanso">
      </div>
      <input
  type="hidden"
  name="latitude"
  id="novoProdLatitude">

<input
  type="hidden"
  name="longitude"
  id="novoProdLongitude">

<button
  type="button"
  class="btn btn-block"
  id="capturarLocalizacaoProdutor"
  style="margin-bottom:8px;">
  📍 USAR LOCALIZAÇÃO ATUAL
</button>

<div
  id="statusLocalizacaoProdutor"
  class="meta"
  style="margin-bottom:16px;">
  Nenhuma localização registrada
</div>

      <div class="field">
        <label>Observações</label>
        <textarea
          name="observacoes">
        </textarea>
      </div>
    `,
    submitSimple('produtores')
  );

 setTimeout(()=>{

  const btn=
    document.querySelector(
      '#modalForm button[type="submit"]'
    );

  if(btn){
    btn.textContent=
      '👨‍🌾 CADASTRAR PRODUTOR';
  }


  const gpsBtn=
    $('#capturarLocalizacaoProdutor');

  const statusGps=
    $('#statusLocalizacaoProdutor');

  const latitude=
    $('#novoProdLatitude');

  const longitude=
    $('#novoProdLongitude');


 if(gpsBtn){

  gpsBtn.onclick=()=>{

    if(
      !window.AndroidTG ||
      typeof AndroidTG.capturarLocalizacao!=='function'
    ){

      toast(
        'GPS do aplicativo indisponível'
      );

      return;
    }


    gpsBtn.disabled=true;

    gpsBtn.textContent=
      '📍 Localizando...';


    if(statusGps){
      statusGps.textContent=
        'Buscando sua localização...';
    }


    try{

      AndroidTG.capturarLocalizacao();

    }catch(err){

      console.error(
        'Erro GPS:',
        err
      );

      gpsBtn.disabled=false;

      gpsBtn.textContent=
        '📍 TENTAR NOVAMENTE';

      toast(
        'Não foi possível acessar o GPS'
      );
    }

  };
}

},0);

}  

async function salvarNovoProdutorComAcesso(event){

  event.preventDefault();

  const form=event.currentTarget;
  const btn=event.submitter;

  const nome=
    form.querySelector('[name="nome"]')
      ?.value.trim();

  const telefone=
    form.querySelector('[name="telefone"]')
      ?.value.trim();

  const cpfCnpj=
    form.querySelector('[name="cpf_cnpj"]')
      ?.value.trim();

  const municipio=
    form.querySelector('[name="municipio"]')
      ?.value.trim();

  const estado=
    form.querySelector('[name="estado"]')
      ?.value.trim();

  const observacoes=
    form.querySelector('[name="observacoes"]')
      ?.value.trim();

  const email=
    form.querySelector('[name="email_acesso"]')
      ?.value.trim().toLowerCase();

  const senha=
    form.querySelector('[name="senha_acesso"]')
      ?.value;

  const confirmarSenha=
    form.querySelector('[name="confirmar_senha"]')
      ?.value;


  if(!nome || !email || !senha){
    toast('Preencha nome, e-mail e senha');
    return;
  }


  if(senha.length<6){
    toast('A senha precisa ter pelo menos 6 caracteres');
    return;
  }


  if(senha!==confirmarSenha){
    toast('As senhas não são iguais');
    return;
  }


  if(!navigator.onLine){
    toast('É necessário internet para criar o acesso');
    return;
  }


  if(btn){
    btn.disabled=true;
    btn.textContent='Criando produtor...';
  }


  let produtorId=null;


  try{

    /*
      1. CRIA O PRODUTOR
    */

    const produtoresCriados=
      await api(
        '/rest/v1/produtores',
        {
          method:'POST',
          body:JSON.stringify({
            user_id:uid(),
            nome,
            telefone:telefone||null,
            cpf_cnpj:cpfCnpj||null,
            municipio:municipio||null,
            estado:estado||'AM',
            observacoes:observacoes||null
          })
        }
      );


    produtorId=
      Array.isArray(produtoresCriados)
        ?produtoresCriados[0]?.id
        :produtoresCriados?.id;


    if(!produtorId){
      throw new Error(
        'O produtor foi criado, mas o ID não foi retornado'
      );
    }


    /*
      2. CRIA O LOGIN DO PRODUTOR
    */

    if(btn){
      btn.textContent='Criando acesso...';
    }


    const res=
      await fetch(
        SUPABASE_URL+
        '/functions/v1/super-endpoint',
        {
          method:'POST',

          headers:{
            'Content-Type':'application/json',
            'apikey':SUPABASE_KEY,
            'Authorization':
              'Bearer '+
              state.session.access_token
          },

          body:JSON.stringify({
            produtor_id:produtorId,
            email,
            password:senha
          })
        }
      );


    const dados=
      await res.json();


    if(!res.ok){
      throw new Error(
        dados?.error ||
        'Erro ao criar acesso do produtor'
      );
    }


    /*
      3. ATUALIZA O APP
    */

    closeModal();

    await loadAll();

    toast(
      '✓ Produtor e acesso criados com sucesso'
    );


  }catch(err){

    console.error(
      'Erro ao cadastrar produtor:',
      err
    );


    /*
      Se o produtor foi criado,
      mas o login falhou,
      remove o cadastro incompleto.
    */

    if(produtorId){

      try{
        await deleteRow(
          'produtores',
          produtorId
        );
      }catch(_){}

    }


    toast(
      err?.message ||
      'Não foi possível cadastrar o produtor'
    );


    if(btn){
      btn.disabled=false;
      btn.textContent=
        '👨‍🌾 CADASTRAR PRODUTOR';
    }

  }

}

function renderAtividadesTG(){

  const pendentesEl=
    $('#atividadesPendentesLista');

  const realizadasEl=
    $('#atividadesRealizadasLista');


  if(!pendentesEl || !realizadasEl){
    return;
  }


  const hoje=
    hojeLocalISO();


  const d7=
    new Date();

  d7.setDate(
    d7.getDate()+7
  );


  const limite7=[
    d7.getFullYear(),
    String(
      d7.getMonth()+1
    ).padStart(2,'0'),
    String(
      d7.getDate()
    ).padStart(2,'0')
  ].join('-');


  // =====================================
  // JUNTA ADUBAÇÃO + BORRIFAÇÃO
  // =====================================

  const atividades=[];


  state.adubacoes.forEach(a=>{

    atividades.push({
      ...a,
      origem:'adubacao',
      nomeAtividade:'Adubação',
      icone:'🌱'
    });

  });


  state.aplicacoes.forEach(a=>{

    atividades.push({
      ...a,
      origem:'aplicacao',
      nomeAtividade:'Borrifação',
      icone:'💦'
    });

  });


  // =====================================
  // SEPARA STATUS
  // =====================================

  const hojeLista=
    atividades.filter(
      a=>statusManejoTG(a)==='hoje'
    );


  const atrasadas=
    atividades.filter(
      a=>statusManejoTG(a)==='atrasado'
    );


  const semana=
    atividades.filter(a=>

      statusManejoTG(a)==='programado' &&

      (a.data_aplicacao||'')>=hoje &&

      (a.data_aplicacao||'')<=limite7
    );


  const realizadas=
    atividades.filter(
      a=>statusManejoTG(a)==='realizado'
    );


  const pendentes=
    atividades.filter(
      a=>statusManejoTG(a)!=='realizado'
    );


  // =====================================
  // CONTADORES
  // =====================================

  const hojeTotal=
    $('#atividadesHojeTotal');

  const atrasadasTotal=
    $('#atividadesAtrasadasTotal');

  const semanaTotal=
    $('#atividadesSemanaTotal');

  const realizadasTotal=
    $('#atividadesRealizadasTotal');


  if(hojeTotal){
    hojeTotal.textContent=
      hojeLista.length;
  }

  if(atrasadasTotal){
    atrasadasTotal.textContent=
      atrasadas.length;
  }

  if(semanaTotal){
    semanaTotal.textContent=
      semana.length;
  }

  if(realizadasTotal){
    realizadasTotal.textContent=
      realizadas.length;
  }


  // =====================================
  // PRODUTOS
  // =====================================

  function descricaoProdutos(a){

    try{

      const bruto=
        a.origem==='adubacao'
          ?a.produto
          :a.produto_comercial;


      const itens=
        JSON.parse(bruto||'');


      if(Array.isArray(itens)){

        const nomes=
          itens
            .filter(i=>i.produto)
            .map(i=>{

              let txt=
                i.produto;

              if(i.dose){
                txt+=
                  ` — ${i.dose}`;
              }

              if(
                i.unidade ||
                i.unidade_dose
              ){

                txt+=
                  ` ${
                    i.unidade||
                    i.unidade_dose
                  }`;
              }

              return txt;

            });


        if(nomes.length){
          return nomes.join(' + ');
        }
      }

    }catch(_){}


    if(a.origem==='adubacao'){

      return (
        a.produto ||
        'Adubação'
      );
    }


    return (
      a.produto_comercial ||
      a.finalidade ||
      'Borrifação'
    );
  }


  // =====================================
  // CARD
  // =====================================

  function cardAtividade(a){

    const ctx=
      contextoSafra(
        a.safra_id
      );


    const status=
      statusManejoTG(a);


    let textoStatus=
      'Programada';

    let classe=
      'gold';


    if(status==='hoje'){

      textoStatus='Hoje';
    }


    if(status==='atrasado'){

      textoStatus='Atrasada';
      classe='red';
    }


    if(status==='realizado'){

      textoStatus='Realizada';
      classe='';
    }


    return `

      <div class="card">

        <div class="card-row">

          <div>

            <h4>
              ${a.icone}
              ${esc(a.nomeAtividade)}
            </h4>


            <div class="meta">

              👨‍🌾

              <strong>
                ${
                  esc(
                    ctx.produtor?.nome||
                    'Produtor'
                  )
                }
              </strong>

            </div>


            <div class="meta">

              🌾
              ${
                esc(
                  ctx.safra?.cultura||
                  'Lavoura'
                )
              }

              ${
                ctx.safra?.variedade
                  ?' • '+
                    esc(
                      ctx.safra.variedade
                    )
                  :''
              }

            </div>


            <div class="meta">

              🏡
              ${
                esc(
                  ctx.propriedade?.nome||
                  'Propriedade'
                )
              }

            </div>


            <div class="meta">

              🌱
              ${
                esc(
                  ctx.talhao?.nome||
                  'Talhão'
                )
              }

            </div>


            <div
              class="meta"
              style="margin-top:7px;">

              <strong>
                ${
                  esc(
                    descricaoProdutos(a)
                  )
                }
              </strong>

            </div>


            ${
              a.alvo
              ?`
                <div class="meta">
                  Alvo:
                  ${esc(a.alvo)}
                </div>
              `
              :''
            }


            <div
              class="meta"
              style="margin-top:5px;">

              📅
              ${dateBR(
                a.data_aplicacao
              )}

            </div>

          </div>


          <span
            class="pill ${classe}">

            ${textoStatus}

          </span>

        </div>


        <div
          style="
            display:flex;
            gap:8px;
            margin-top:12px;
            flex-wrap:wrap;
          ">


          <button
            type="button"
            class="btn abrir-atividade"
            data-origem="${a.origem}"
            data-sid="${esc(a.safra_id)}">

            ✏️ Abrir / editar

          </button>


          ${
            status!=='realizado'
            ?`

              <button
                type="button"
                class="btn btn-gold realizar-atividade-central"
                data-origem="${a.origem}"
                data-id="${esc(a.id)}">

                ✓ Realizada

              </button>

            `
            :''
          }

        </div>

      </div>

    `;
  }


  // =====================================
  // PENDENTES
  // =====================================

  const ordem={
    atrasado:0,
    hoje:1,
    programado:2
  };


  const pendentesOrdenadas=
    [...pendentes]
      .sort((a,b)=>{

        const sa=
          statusManejoTG(a);

        const sb=
          statusManejoTG(b);


        const oa=
          ordem[sa]??9;

        const ob=
          ordem[sb]??9;


        if(oa!==ob){
          return oa-ob;
        }


        return (
          a.data_aplicacao||''
        ).localeCompare(
          b.data_aplicacao||''
        );

      });


  pendentesEl.innerHTML=

    pendentesOrdenadas.length

      ?pendentesOrdenadas
        .map(cardAtividade)
        .join('')

      :`

        <div class="empty">
          Nenhuma atividade pendente.
        </div>

      `;


  // =====================================
  // REALIZADAS
  // =====================================

  const realizadasOrdenadas=
    [...realizadas]
      .sort((a,b)=>{

        const da=
          a.data_realizacao ||
          a.data_aplicacao ||
          '';

        const db=
          b.data_realizacao ||
          b.data_aplicacao ||
          '';

        return db.localeCompare(da);

      });


  realizadasEl.innerHTML=

    realizadasOrdenadas.length

      ?realizadasOrdenadas
        .slice(0,20)
        .map(cardAtividade)
        .join('')

      :`

        <div class="empty">
          Nenhuma atividade realizada.
        </div>

      `;


  // =====================================
  // ABRIR / EDITAR
  // =====================================

  document
    .querySelectorAll(
      '.abrir-atividade'
    )
    .forEach(btn=>{

      btn.onclick=e=>{

        e.stopPropagation();


        const origem=
          btn.dataset.origem;

        const sid=
          btn.dataset.sid;


        if(origem==='adubacao'){

          openAdubacao(sid);

        }else{

          openAplicacao(sid);

        }

      };

    });


  // =====================================
  // MARCAR COMO REALIZADA
  // =====================================

  document
    .querySelectorAll(
      '.realizar-atividade-central'
    )
    .forEach(btn=>{

      btn.onclick=async e=>{

        e.stopPropagation();


        if(
          !confirm(
            'Marcar esta atividade como realizada?'
          )
        ){
          return;
        }


        await realizarManejo(
          btn.dataset.origem,
          btn.dataset.id
        );


        await loadAll();

      };

    });

}

function abrirSeletorAtividadeTG(tipo){

  const titulo=
    tipo==='adubacao'
      ?'🌱 Nova adubação'
      :'💦 Nova pulverização';


  modal(
    titulo,
    `

      <p class="meta">
        Escolha onde esta atividade será realizada.
      </p>


      <div class="field">

        <label>Produtor *</label>

        <select
          id="atividadeProdutor"
          required>

          <option value="">
            Selecione o produtor
          </option>

          ${state.produtores.map(p=>`
            <option value="${esc(p.id)}">
              ${esc(p.nome)}
            </option>
          `).join('')}

        </select>

      </div>


      <div class="field">

        <label>Propriedade *</label>

        <select
          id="atividadePropriedade"
          required
          disabled>

          <option value="">
            Primeiro selecione o produtor
          </option>

        </select>

      </div>


      <div class="field">

        <label>Talhão *</label>

        <select
          id="atividadeTalhao"
          required
          disabled>

          <option value="">
            Primeiro selecione a propriedade
          </option>

        </select>

      </div>


      <div class="field">

        <label>Lavoura *</label>

        <select
          id="atividadeSafra"
          required
          disabled>

          <option value="">
            Primeiro selecione o talhão
          </option>

        </select>

      </div>

    `,

    e=>{

      e.preventDefault();

      const safraId=
        $('#atividadeSafra')?.value;

      if(!safraId){

        toast(
          'Selecione a lavoura'
        );

        return;
      }


      closeModal();


      setTimeout(()=>{

        if(tipo==='adubacao'){

          openAdubacao(
            safraId
          );

        }else{

          openAplicacao(
            safraId
          );

        }

      },80);

    }
  );


  setTimeout(()=>{

    const produtor=
      $('#atividadeProdutor');

    const propriedade=
      $('#atividadePropriedade');

    const talhao=
      $('#atividadeTalhao');

    const safra=
      $('#atividadeSafra');


    const salvar=
      $('#modalForm button[type="submit"]');

    if(salvar){

      salvar.textContent=
        'CONTINUAR';

    }


    if(
      !produtor ||
      !propriedade ||
      !talhao ||
      !safra
    ){
      return;
    }


    // =========================
    // PRODUTOR → PROPRIEDADE
    // =========================

    produtor.onchange=()=>{

      const pid=
        produtor.value;


      const lista=
        state.propriedades.filter(
          p=>
            String(p.produtor_id)===
            String(pid)
        );


      propriedade.innerHTML=`

        <option value="">
          Selecione a propriedade
        </option>

        ${lista.map(p=>`
          <option value="${esc(p.id)}">
            ${esc(p.nome)}
          </option>
        `).join('')}

      `;


      propriedade.disabled=
        !pid;


      talhao.innerHTML=`
        <option value="">
          Primeiro selecione a propriedade
        </option>
      `;

      talhao.disabled=true;


      safra.innerHTML=`
        <option value="">
          Primeiro selecione o talhão
        </option>
      `;

      safra.disabled=true;

    };


    // =========================
    // PROPRIEDADE → TALHÃO
    // =========================

    propriedade.onchange=()=>{

      const propriedadeId=
        propriedade.value;


      const lista=
        state.talhoes.filter(
          t=>
            String(t.propriedade_id)===
            String(propriedadeId)
        );


      talhao.innerHTML=`

        <option value="">
          Selecione o talhão
        </option>

        ${lista.map(t=>`
          <option value="${esc(t.id)}">
            ${esc(t.nome)}
          </option>
        `).join('')}

      `;


      talhao.disabled=
        !propriedadeId;


      safra.innerHTML=`
        <option value="">
          Primeiro selecione o talhão
        </option>
      `;

      safra.disabled=true;

    };


    // =========================
    // TALHÃO → LAVOURA
    // =========================

    talhao.onchange=()=>{

      const talhaoId=
        talhao.value;


      const lista=
        state.safras.filter(
          s=>
            String(s.talhao_id)===
            String(talhaoId)
        );


      safra.innerHTML=`

        <option value="">
          Selecione a lavoura
        </option>

        ${lista.map(s=>`

          <option value="${esc(s.id)}">

            ${esc(
              s.cultura||
              'Lavoura'
            )}

            ${
              s.variedade
                ?' • '+esc(s.variedade)
                :''
            }

          </option>

        `).join('')}

      `;


      safra.disabled=
        !talhaoId;

    };

  },0);
}

function openForm(type,sid){
 if(type==='produtor')return openNovoProdutor();
if(type==='propriedade'){

  modal(
    'Nova propriedade',
    `
      <div class="field">
        <label>Produtor *</label>

        <select
          name="produtor_id"
          required>

          <option value="">
            Selecione
          </option>

          ${opts(state.produtores)}

        </select>
      </div>


      <div class="field">
        <label>Nome da propriedade *</label>

        <input
          name="nome"
          required
          placeholder="Ex.: Sítio Boa Esperança">
      </div>


      <div class="row2">

        <div class="field">
          <label>Município</label>

          <input
            name="municipio"
            placeholder="Ex.: Itacoatiara">
        </div>


        <div class="field">
          <label>Estado</label>

          <input
            name="estado"
            value="AM">
        </div>

      </div>


      <div class="field">
        <label>Comunidade / Localidade</label>

        <input
          name="comunidade"
          placeholder="Ex.: Novo Remanso">
      </div>


      <div class="field">
        <label>Área total (ha)</label>

        <input
          name="area_total_ha"
          type="number"
          step="0.01"
          min="0"
          placeholder="Ex.: 2">
      </div>


      <input
        type="hidden"
        name="latitude"
        id="novaPropLatitude">

      <input
        type="hidden"
        name="longitude"
        id="novaPropLongitude">


      <button
        type="button"
        class="btn btn-block"
        id="capturarLocalizacaoPropriedade"
        style="margin-bottom:8px;">

        📍 USAR LOCALIZAÇÃO ATUAL

      </button>


      <div
        id="statusLocalizacaoPropriedade"
        class="meta"
        style="margin-bottom:16px;">

        Nenhuma localização registrada

      </div>
    `,
    submitSimple('propriedades')
  );


  setTimeout(()=>{

    const gpsBtn=
      $('#capturarLocalizacaoPropriedade');

    const statusGps=
      $('#statusLocalizacaoPropriedade');

    const latitude=
      $('#novaPropLatitude');

    const longitude=
      $('#novaPropLongitude');


    if(!gpsBtn)return;

gpsBtn.onclick=()=>{

  if(
    !window.AndroidTG ||
    typeof AndroidTG.capturarLocalizacao!=='function'
  ){

    toast(
      'GPS do aplicativo indisponível'
    );

    return;
  }


  gpsBtn.disabled=true;

  gpsBtn.textContent=
    '📍 Localizando...';


  if(statusGps){

    statusGps.textContent=
      'Buscando sua localização...';
  }


  try{

    AndroidTG.capturarLocalizacao();

  }catch(err){

    console.error(
      'Erro GPS:',
      err
    );


    gpsBtn.disabled=false;

    gpsBtn.textContent=
      '📍 TENTAR NOVAMENTE';


    toast(
      'Não foi possível acessar o GPS'
    );
  }
};
   
  },0);


  return;
}
 if(type==='talhao')return modal('Novo talhão',`<div class="field"><label>Propriedade</label><select name="propriedade_id" required><option value="">Selecione</option>${opts(state.propriedades)}</select></div><div class="row2"><div class="field"><label>Nome</label><input name="nome" required placeholder="Talhão 01"></div><div class="field"><label>Área (ha)</label><input name="area_ha" type="number" step="0.01"></div></div><div class="field"><label>Observações</label><textarea name="observacoes"></textarea></div>`,submitSimple('talhoes'));
 if(type==='safra')return modal('Nova lavoura',`<div class="field"><label>Talhão</label><select name="talhao_id" required><option value="">Selecione</option>${state.talhoes.map(t=>`<option value="${t.id}">${esc(nameBy(state.propriedades,t.propriedade_id))} • ${esc(t.nome)}</option>`).join('')}</select></div><div class="row2"><div class="field"><label>Cultura</label><input name="cultura" required placeholder="Maracujá"></div><div class="field"><label>Variedade</label><input name="variedade"></div></div><div class="row2"><div class="field"><label>Data de plantio</label><input name="data_plantio" type="date"></div><div class="field"><label>Nº de plantas</label><input name="numero_plantas" type="number"></div></div><div class="row2"><div class="field"><label>Espaçamento linhas (m)</label><input name="espacamento_linhas_m" type="number" step="0.01"></div><div class="field"><label>Espaçamento plantas (m)</label><input name="espacamento_plantas_m" type="number" step="0.01"></div></div>`,submitSimple('safras'));
 if(type==='adubacao')return openAdubacao(sid);
 if(type==='adubacao')return modal('Registrar adubação',`<input type="hidden" name="safra_id" value="${sid}"><div class="row2"><div class="field"><label>Data</label><input name="data_aplicacao" type="date" value="${new Date().toISOString().slice(0,10)}" required></div><div class="field"><label>Tipo</label><select name="tipo"><option>Cobertura</option><option>Foliar</option><option>Plantio</option><option>Fertirrigação</option></select></div></div><div class="field"><label>Produto</label><input name="produto" required></div><div class="row2"><div class="field"><label>Dose</label><input name="dose" type="number" step="0.001"></div><div class="field"><label>Unidade</label><input name="unidade_dose" placeholder="g/planta, kg/ha"></div></div><div class="field"><label>Observações</label><textarea name="observacoes"></textarea></div>`,submitSimple('adubacoes'));
 if(type==='aplicacao')return openAplicacao(sid);
 if(type==='aplicacao')return modal('Registrar aplicação',`<input type="hidden" name="safra_id" value="${sid}"><div class="row2"><div class="field"><label>Data</label><input name="data_aplicacao" type="date" value="${new Date().toISOString().slice(0,10)}" required></div><div class="field"><label>Finalidade</label><select name="finalidade"><option>Inseticida</option><option>Fungicida</option><option>Acaricida</option><option>Bactericida</option><option>Herbicida</option><option>Biológico</option><option>Outro</option></select></div></div><div class="field"><label>Produto comercial</label><input name="produto_comercial" required></div><div class="field"><label>Ingrediente ativo</label><input name="ingrediente_ativo"></div><div class="row2"><div class="field"><label>Sistema</label><select name="sistema_grupo"><option value="">—</option><option>IRAC</option><option>FRAC</option><option>HRAC</option></select></div><div class="field"><label>Grupo MoA</label><input name="grupo_moa" placeholder="Ex.: 11, 3A"></div></div><div class="row2"><div class="field"><label>Dose</label><input name="dose" type="number" step="0.001"></div><div class="field"><label>Unidade</label><input name="unidade_dose" placeholder="mL/100 L"></div></div><div class="field"><label>Alvo</label><input name="alvo" placeholder="Lagarta, antracnose..."></div>`,submitSimple('aplicacoes'));
 if(type==='colheita')return openColheita(sid);
 if(type==='colheita')return modal('Registrar colheita',`<input type="hidden" name="safra_id" value="${sid}"><div class="row2"><div class="field"><label>Data</label><input name="data_colheita" type="date" value="${new Date().toISOString().slice(0,10)}" required></div><div class="field"><label>Peso (kg)</label><input name="peso_kg" type="number" step="0.001" required></div></div><div class="row2"><div class="field"><label>Quantidade de frutos</label><input name="quantidade_frutos" type="number"></div><div class="field"><label>Preço/kg (R$)</label><input name="preco_kg" type="number" step="0.01"></div></div><div class="field"><label>Observações</label><textarea name="observacoes"></textarea></div>`,submitSimple('colheitas'));
}
function formObj(form){const o={};for(const [k,v] of new FormData(form)){if(v!=='')o[k]=v}[
  'area_total_ha',
  'area_ha',
  'espacamento_linhas_m',
  'espacamento_plantas_m',
  'dose',
  'peso_kg',
  'preco_kg',
  'numero_plantas',
  'quantidade_frutos',
  'latitude',
  'longitude'
].forEach(k=>{if(o[k]!==undefined)o[k]=Number(o[k])});return o}
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
function showLogin(){

  $('#loginView').classList.remove('hidden');
  $('#app').classList.add('hidden');

  montarEscolhaLogin();

  const m=$('#loginMsg');

  if(m)m.textContent='';
}
async function showApp(){
  $('#loginView').classList.add('hidden');
  $('#app').classList.remove('hidden');
  $('#userLabel').textContent=state.session?.user?.email||'Gestão rural';

  if(!state.perfilUsuario && navigator.onLine){
    try{
      await loadPerfilUsuario();
    }catch(e){
      console.error(e);
    }
  }

  const produtor=isProdutor();
  const gestorNav=$('#gestorNav');
  const produtorNav=$('#produtorNav');

  if(gestorNav)gestorNav.classList.toggle('hidden',produtor);
  if(produtorNav)produtorNav.classList.toggle('hidden',!produtor);

  go(produtor?'produtor-inicio':'dashboard');

  await loadAll();
  syncQueue();
}
$('#loginForm').addEventListener('submit',async e=>{

  e.preventDefault();

  const m=$('#loginMsg');

  m.textContent='Entrando...';

  try{

    const s=await login(
      $('#email').value.trim(),
      $('#password').value
    );

    state.session=s;

    saveSession(s);

    state.perfilUsuario=null;

    await loadPerfilUsuario();

    /*
      Compatibilidade:

      Se não existir registro em perfis_usuarios,
      consideramos a conta como Técnico.

      Os produtores obrigatoriamente terão
      tipo_usuario = produtor.
    */

    const tipoReal=
      state.perfilUsuario?.tipo_usuario==='produtor'
        ?'produtor'
        :'tecnico';

    if(tipoReal!==state.loginTipo){

      const selecionado=
        state.loginTipo==='produtor'
          ?'Produtor'
          :'Técnico';

      const correto=
        tipoReal==='produtor'
          ?'Produtor'
          :'Técnico';

      saveSession(null);

      state.session=null;
      state.perfilUsuario=null;

      m.textContent=
        `Este login pertence ao acesso ${correto}. `+
        `Selecione ${correto} para entrar.`;

      return;
    }

    m.textContent='';

    await showApp();

  }catch(err){

    console.error(err);

    saveSession(null);

    state.session=null;
    state.perfilUsuario=null;

    m.textContent=
      'Não foi possível entrar. Confira e-mail e senha.';
  }
});
$('#logoutBtn').addEventListener('click',()=>{

  saveSession(null);

  state.session=null;
  state.perfilUsuario=null;

  state.produtores=[];
  state.propriedades=[];
  state.talhoes=[];
  state.safras=[];
  state.adubacoes=[];
  state.aplicacoes=[];
  state.colheitas=[];

  showLogin();
});
 
document.addEventListener('click',e=>{
  const novaAdub=
    e.target.closest(
      '#novaAtividadeAdubacao'
    );

  if(novaAdub){
    return abrirSeletorAtividadeTG(
      'adubacao'
    );
  }


  const novaPulv=
    e.target.closest(
      '#novaAtividadePulverizacao'
    );

  if(novaPulv){
    return abrirSeletorAtividadeTG(
      'aplicacao'
    );
  }
 const rm=e.target.closest('[data-realizar-manejo]');
if(rm)return realizarManejo(rm.dataset.origem,rm.dataset.id); 
 const p=e.target.closest('[data-page]');if(p)go(p.dataset.page);
 const g=e.target.closest('[data-go]');if(g)go(g.dataset.go);
 const o=e.target.closest('[data-open]');if(o)openForm(o.dataset.open);
 const a=e.target.closest('[data-action]');if(a)openForm(a.dataset.action,a.dataset.sid);
 const fp =
  e.target.closest(
    '[data-financeiro-produtor]'
  );

if(fp){

  return abrirFinanceiroProdutorTecnico(
    fp.dataset.financeiroProdutor
  );

}
const ep=e.target.closest('[data-edit-produtor]');if(ep)return viewProdutor(ep.dataset.editProdutor);
 const epr=e.target.closest('[data-edit-propriedade]');

if(epr){
  return viewPropriedade(
    epr.dataset.editPropriedade
  );
}
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
document.addEventListener('click',e=>{

  const btn=e.target.closest('#toggleSenha');

  if(!btn)return;

  const campo=$('#password');

  if(!campo)return;

  const mostrando=
    campo.type==='text';

  campo.type=
    mostrando
      ?'password'
      :'text';

  btn.textContent=
    mostrando
      ?'👁'
      :'🙈';

  btn.setAttribute(
    'aria-label',
    mostrando
      ?'Mostrar senha'
      :'Ocultar senha'
  );
});
boot();
