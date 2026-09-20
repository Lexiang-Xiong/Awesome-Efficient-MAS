'use strict';
const $ = (s) => document.querySelector(s);
const svgNS = 'http://www.w3.org/2000/svg';
const positions = [[265,170,'Coordinator'],[110,85,'Researcher'],[400,65,'Planner'],[445,230,'Verifier'],[315,302,'Executor'],[130,285,'Reviewer'],[60,182,'Retriever']];
const pairs = []; for(let a=0;a<7;a++) for(let b=a+1;b<7;b++) pairs.push([a,b]);
const modes = { dense: pairs, sparse: [[0,1],[0,2],[0,3],[0,4],[0,5],[0,6],[1,6],[2,3],[4,5]], routed: [[0,1],[1,6],[0,3],[3,4]] };
let graphMode = 'sparse'; let motionPaused = matchMedia('(prefers-reduced-motion: reduce)').matches;
function svgElement(tag,attrs){const el=document.createElementNS(svgNS,tag);for(const [k,v] of Object.entries(attrs))el.setAttribute(k,v);return el;}
function drawGraph(mode){graphMode=mode;$('#network-edges').replaceChildren();const active=modes[mode].map(p=>p.join('-'));pairs.forEach(([a,b],i)=>{const [x1,y1]=positions[a], [x2,y2]=positions[b];const on=active.includes([a,b].join('-'));$('#network-edges').append(svgElement('line',{x1,y1,x2,y2,class:`network-edge${on?'':' off'}`}));if(on&&!motionPaused){const dot=svgElement('circle',{r:2.1,class:'pulse'});const anim=svgElement('animateMotion',{dur:`${3+i%3}s`,repeatCount:'indefinite',path:`M${x1},${y1} L${x2},${y2}`,begin:`-${i*.6}s`});dot.append(anim);$('#network-edges').append(dot);}});$('#edge-count').textContent=active.length;$('#graph-caption').textContent={dense:'Every agent communicates with every other.',sparse:'Keep the useful connections.',routed:'Activate a task-specific path.'}[mode];document.querySelectorAll('[data-mode]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.mode===mode));}
positions.forEach(([x,y,label],i)=>{const g=svgElement('g',{});g.append(svgElement('circle',{cx:x,cy:y,r:i?23:32,class:i?'network-node':'network-core'}));const symbol=svgElement('text',{x,y:y+6,class:i?'node-symbol':'core-symbol'});symbol.textContent=i?'A'+i:'C';g.append(symbol);const name=svgElement('text',{x,y:y+(i?42:51),class:'node-label'});name.textContent=label;g.append(name);$('#network-nodes').append(g);});
document.querySelectorAll('[data-mode]').forEach(b=>b.addEventListener('click',()=>drawGraph(b.dataset.mode)));
function updateMotion(){const b=$('#motion-toggle');b.textContent=motionPaused?'▶':'Ⅱ';b.setAttribute('aria-label',motionPaused?'Play graph animation':'Pause graph animation');b.title=b.getAttribute('aria-label');drawGraph(graphMode);}
$('#motion-toggle').addEventListener('click',()=>{motionPaused=!motionPaused;updateMotion();});matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change',e=>{motionPaused=e.matches;updateMotion();});updateMotion();
const layers={Topology:{description:'Change the participating agents and their communication structure. Remove redundancy, construct task-specific teams, or adapt connections from feedback.',families:[['Topology pruning','Simplify an existing collaboration graph by removing redundant agents or edges.'],['Topology construction','Create a task-specific collaboration structure.'],['Topology adaptation','Revise the organization as tasks or intermediate evidence change.']]},Runtime:{description:'Control what an existing structure activates for the current request: information, models, state, and execution schedules.',families:[['Communication','Compress and select messages while preserving useful evidence.'],['Routing','Choose the agent, model, or context appropriate to the current step.'],['State','Manage persistent memory and share reusable cache state.'],['Scheduling','Respect dependencies while controlling concurrency, capacity, and retries.']]},Optimization:{description:'Learn a reusable asset through search or training. Account for the design cost as well as the savings obtained when that asset is reused.',families:[['Prompt optimization','Refine coupled instructions through system-level feedback.'],['Workflow search','Search executable programs and compound collaboration workflows.'],['Policy learning','Train sequential decisions from rewarded collaboration trajectories.'],['Continual learning','Turn accumulated experience into reusable skills and procedures.']]}};
function showLayer(name){const layer=layers[name];document.querySelectorAll('[data-layer]').forEach(b=>{const selected=b.dataset.layer===name;b.setAttribute('aria-selected',selected);b.tabIndex=selected?0:-1;});$('#taxonomy-detail').setAttribute('aria-labelledby','tab-'+name.toLowerCase());$('#taxonomy-detail').innerHTML=`<div class="layer-description">${layer.description}<a href="#library" data-browse="${name}">Explore ${name.toLowerCase()} papers →</a></div><div class="subfamilies">${layer.families.map(([title,desc])=>`<div class="subfamily"><h3>${title}</h3><p>${desc}</p></div>`).join('')}</div>`;$('#taxonomy-detail [data-browse]').addEventListener('click',()=>{browseCategory(name);});}
document.querySelectorAll('[data-layer]').forEach((b,index)=>{b.addEventListener('click',()=>showLayer(b.dataset.layer));b.addEventListener('keydown',e=>{const tabs=[...document.querySelectorAll('[data-layer]')];let next;if(e.key==='ArrowRight')next=(index+1)%3;if(e.key==='ArrowLeft')next=(index+2)%3;if(e.key==='Home')next=0;if(e.key==='End')next=2;if(next!==undefined){e.preventDefault();tabs[next].focus();showLayer(tabs[next].dataset.layer);}});});showLayer('Topology');
const corpus=window.SURVEY_DATA||{papers:[],stats:{cited:0}};const papers=corpus.papers;const state={categories:[],match:'any',subfamily:'all',query:'',year:'all',sort:'year-desc',representative:false,page:1,pageSize:5};
const escapeHtml=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const categories=['All papers','Topology','Runtime','Optimization','Collaboration Boundary','Background','Foundations','Evaluation','Synthesis','Open Problems','Introduction','Conclusion'];
$('#corpus-count').textContent=corpus.stats.cited||papers.length;
const years=[...new Set(papers.map(p=>p.year).filter(Boolean))].sort((a,b)=>b-a);years.forEach(year=>{const option=document.createElement('option');option.value=year;option.textContent=year;$('#year').append(option);});
const families=[...new Set(papers.flatMap(p=>p.subfamilies))].sort();
for(const family of families){const option=document.createElement('option');option.value=family;option.textContent=family;$('#subfamily').append(option);}
function safeUrl(url){try{const u=new URL(url);return ['http:','https:'].includes(u.protocol)?u.href:null;}catch{return null;}}
function syncLibraryControls(){
  $('#search').value=state.query;$('#year').value=state.year;
  $('#representative').checked=state.representative;$('#sort').value=state.sort;$('#tag-match').value=state.match;$('#subfamily').value=state.subfamily;
}
function browseCategory(category){
  Object.assign(state,libraryModel.browse(state,category));
  syncLibraryControls();render();
}
function render(){
  const result=libraryModel.select(papers,state);
  const {matches,items,pages,from,to}=result;state.page=result.page;
  $('#result-count').textContent=`${matches.length} ${matches.length===1?'paper':'papers'}${state.categories.length?' · '+state.categories.join(state.match==='all'?' + ':' / '):''}`;
  $('#result-range').textContent=matches.length?`Showing ${from}–${to} of ${matches.length}`:'No results';
  const facetPapers=libraryModel.select(papers,{...state,categories:[]}).matches;
  $('#category-filters').innerHTML=`<button class="filter" data-all-papers aria-pressed="${!state.categories.length}">All papers<span>${papers.length}</span></button>`+categories.filter(c=>c!=='All papers'&&papers.some(p=>p.categories.includes(c))).map(c=>`<label class="filter filter-tag ${state.categories.includes(c)?'is-selected':''}"><input type="checkbox" data-category="${c}" ${state.categories.includes(c)?'checked':''}><span class="filter-name">${c}</span><span class="facet-count" title="Papers with this tag matching the current search, year, method family and evidence filters">${facetPapers.filter(p=>p.categories.includes(c)).length}</span></label>`).join('');
  $('[data-all-papers]').addEventListener('click',()=>browseCategory('All papers'));
  document.querySelectorAll('[data-category]').forEach(input=>input.addEventListener('change',()=>{
    const category=input.dataset.category;Object.assign(state,libraryModel.toggle(state,category));render();
    document.querySelector(`[data-category="${category}"]`)?.focus({preventScroll:true});
  }));
  const filters=state.categories.map(c=>['category',c,c]);
  if(state.query.trim())filters.push(['query',`Search: ${state.query}`,'']);
  if(state.year!=='all')filters.push(['year',`Year: ${state.year}`,'']);
  if(state.subfamily!=='all')filters.push(['subfamily',state.subfamily,'']);
  if(state.representative)filters.push(['representative','Evidence-table methods only','']);
  $('#active-filters').innerHTML=filters.length?`<span>${state.categories.length>1?(state.match==='all'?'All selected tags':'Any selected tag'):'Active filters'}</span>${filters.map(([key,label,value])=>`<button class="filter-chip" data-remove-filter="${key}" data-filter-value="${escapeHtml(value)}" aria-label="Remove ${escapeHtml(label)}">${escapeHtml(label)} ×</button>`).join('')}<button class="text-button" id="clear-active-filters">Clear all</button>`:'<span>No filters applied · 256 papers in the collection.</span>';
  document.querySelectorAll('[data-remove-filter]').forEach(b=>b.addEventListener('click',()=>{
    const key=b.dataset.removeFilter;
    if(key==='category')state.categories=state.categories.filter(c=>c!==b.dataset.filterValue);
    else state[key]=['year','subfamily'].includes(key)?'all':key==='representative'?false:'';
    state.page=1;syncLibraryControls();render();
  }));
  $('#clear-active-filters')?.addEventListener('click',()=>browseCategory('All papers'));
  $('#paper-list').innerHTML=items.map(p=>{
    const authors=p.authors.split(' and ');
    const authorText=authors.length>5?authors.slice(0,5).join(', ')+', et al.':authors.join(', ');
    const url=safeUrl(p.url);
    return `<article class="paper"><div><h3>${url?`<a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(p.title)}</a>`:escapeHtml(p.title)}</h3><p class="paper-authors">${escapeHtml(authorText)}</p><div class="paper-meta"><span class="paper-year">${p.year||'Undated'}</span>${p.categories.slice(0,4).map(c=>`<span class="tag ${['Topology','Runtime','Optimization'].includes(c)?c.toLowerCase():'other'}">${escapeHtml(c)}</span>`).join('')}${p.evidence?'<span class="tag other">Evidence table</span>':''}</div>${p.evidence?`<details><summary>${escapeHtml(p.method)} · View evidence & limitations</summary><p><strong>Reported effect:</strong> ${escapeHtml(p.evidence.effect)}<br><strong>Update:</strong> ${escapeHtml(p.evidence.update)}<br><strong>Main boundary:</strong> ${escapeHtml(p.evidence.boundary)}<br><strong>Explicitly quantified:</strong> ${p.evidence.quantified.length?escapeHtml(p.evidence.quantified.join('; ')):'None of the four evidence coordinates'}<br>Unlisted coordinates are not established in the survey’s evidence table; this does not mean an effect is absent.</p></details>`:''}</div>${url?`<a class="paper-link" href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer" aria-label="Read ${escapeHtml(p.title)}">↗</a>`:''}</article>`;
  }).join('')||'<div class="empty">No papers match these filters.<br><button class="compact-button" id="empty-reset">Clear filters and show all papers</button></div>';
  $('#empty-reset')?.addEventListener('click',()=>browseCategory('All papers'));
  $('#page-info').textContent=`Page ${state.page} of ${pages} · ${from}–${to} of ${matches.length}`;
  for(const id of ['previous','previous-top','first-page'])$('#'+id).disabled=state.page===1;
  for(const id of ['next','next-top','last-page'])$('#'+id).disabled=state.page===pages;
  $('#page-jump').innerHTML=Array.from({length:pages},(_,i)=>`<option value="${i+1}" ${state.page===i+1?'selected':''}>${i+1} / ${pages}</option>`).join('');
  $('#page-jump').disabled=pages===1;
}
$('#page-size').addEventListener('change',e=>{state.pageSize=e.target.value;state.page=1;render();});
for(const [id,key,event] of [['search','query','input'],['year','year','change'],['sort','sort','change'],['tag-match','match','change'],['subfamily','subfamily','change']]){
  $('#'+id).addEventListener(event,e=>{state[key]=e.target.value;state.page=1;render();});
}
$('#representative').addEventListener('change',e=>{state.representative=e.target.checked;state.page=1;render();});
$('#clear-filters').addEventListener('click',()=>browseCategory('All papers'));
function goToPage(page){
  state.page=page;render();
  $('.results-line').scrollIntoView({block:'start',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
}
for(const [id,delta] of [['previous',-1],['next',1],['previous-top',-1],['next-top',1]])$('#'+id).addEventListener('click',()=>goToPage(state.page+delta));
$('#first-page').addEventListener('click',()=>goToPage(1));
$('#last-page').addEventListener('click',()=>goToPage(libraryModel.select(papers,state).pages));
$('#page-jump').addEventListener('change',e=>goToPage(Number(e.target.value)));
document.addEventListener('keydown',e=>{if(e.key==='/'&&!['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName)&&!document.activeElement.isContentEditable){e.preventDefault();$('#search').focus();}});
const mapgd=papers.find(p=>p.key==='2025_han_mapgd');if(mapgd&&safeUrl(mapgd.url)){$('#mapgd-link').href=mapgd.url;$('#mapgd-link').target='_blank';$('#mapgd-link').rel='noopener noreferrer';}
const config=window.SITE_CONFIG||{};for(const [id,key]of [['repository-link','repositoryUrl'],['paper-link','paperUrl']])if(safeUrl(config[key])){$('#'+id).href=config[key];$('#'+id).hidden=false;}function publicationUrl(value){
  if(!value)return null;
  try{const url=new URL(value,document.baseURI);return ['https:','http:'].includes(url.protocol)?url.href:null;}catch{return null;}
}
for(const [id,key] of [['hero-github','repositoryUrl'],['hero-pdf','pdfUrl']]){
  const url=publicationUrl(config[key]);if(!url)continue;
  const link=$('#'+id);link.href=url;link.target='_blank';link.rel='noopener noreferrer';link.removeAttribute('aria-disabled');link.removeAttribute('title');link.querySelector('small')?.remove();
}
render();
