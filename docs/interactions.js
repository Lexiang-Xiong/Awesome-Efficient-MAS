'use strict';

// Functional interactions use the same survey data and filters as the paper library.
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const initialPositions = positions.map(p => [...p]);
const disabledAgents = new Set();
let selectedAgent = null;
let hoveredAgent = null;
let dragState = null;
let graphBudget = 9;
const agentNotes = [
  'Combines the team’s contributions and coordinates the final response.',
  'Investigates candidate explanations and shares supporting evidence.',
  'Decomposes the request and proposes an execution plan.',
  'Checks claims and intermediate results against available evidence.',
  'Carries out a subtask or tool action and returns its result.',
  'Critiques a candidate answer and identifies gaps for revision.',
  'Finds relevant information and passes it to the active team.'
];
const nodeGroups = [];
$('#network-nodes').replaceChildren();
positions.forEach(([x, y, label], i) => {
  const group = svgElement('g', {class:'agent-node', transform:`translate(${x} ${y})`, tabindex:0, role:'button', 'aria-label':`Inspect ${label}`, 'aria-pressed':'false', 'data-agent':i});
  group.append(svgElement('circle', {r:i ? 34 : 44, class:'node-halo'}));
  group.append(svgElement('circle', {r:i ? 23 : 32, class:i ? 'network-node' : 'network-core'}));
  const symbol = svgElement('text', {x:0,y:6,class:i ? 'node-symbol' : 'core-symbol'});
  symbol.textContent = i ? 'A'+i : 'C';
  const name = svgElement('text', {x:0,y:i ? 43 : 52,class:'node-label'});
  name.textContent = label;
  group.append(symbol, name);
  group.addEventListener('pointerenter', () => {hoveredAgent=i;paintGraph();});
  group.addEventListener('pointerleave', () => {hoveredAgent=null;if(!dragState)paintGraph();});
  group.addEventListener('focus', () => {hoveredAgent=i;paintGraph();});
  group.addEventListener('blur', () => {hoveredAgent=null;paintGraph();});
  group.addEventListener('click', () => {if(group.dataset.dragged==='true'){group.dataset.dragged='false';return;}selectAgent(i);});
  group.addEventListener('keydown', e => {
    if(e.key==='Enter'||e.key===' '){e.preventDefault();selectAgent(i);}
    if(e.key==='Escape'){selectedAgent=null;hoveredAgent=null;paintGraph();}
    const offsets = {ArrowLeft:[-8,0],ArrowRight:[8,0],ArrowUp:[0,-8],ArrowDown:[0,8]};
    if(offsets[e.key]){e.preventDefault();positions[i][0]=Math.max(42,Math.min(488,positions[i][0]+offsets[e.key][0]));positions[i][1]=Math.max(42,Math.min(300,positions[i][1]+offsets[e.key][1]));paintGraph();}
  });
  group.addEventListener('pointerdown', e => {
    if(e.button!==0)return;
    dragState={i,px:e.clientX,py:e.clientY,moved:false};
    group.setPointerCapture(e.pointerId);
  });
  group.addEventListener('pointermove', e => {
    if(!dragState||dragState.i!==i)return;
    if(Math.hypot(e.clientX-dragState.px,e.clientY-dragState.py)<4&&!dragState.moved)return;
    dragState.moved=true;
    const point=$('#network').createSVGPoint();point.x=e.clientX;point.y=e.clientY;
    const local=point.matrixTransform($('#network').getScreenCTM().inverse());
    positions[i][0]=Math.max(42,Math.min(488,local.x));positions[i][1]=Math.max(42,Math.min(300,local.y));
    selectedAgent=i;paintGraph();
  });
  function finishDrag(){if(dragState?.i===i){group.dataset.dragged=String(dragState.moved);dragState=null;}}
  group.addEventListener('pointerup',finishDrag);group.addEventListener('pointercancel',finishDrag);
  nodeGroups.push(group);$('#network-nodes').append(group);
});

function availablePairs(){return pairs.filter(([a,b])=>!disabledAgents.has(a)&&!disabledAgents.has(b));}
function activePairs(){
  const viable=availablePairs();
  if(graphMode==='custom'){
    const priority=[...modes.sparse,...pairs.filter(p=>!modes.sparse.some(q=>q[0]===p[0]&&q[1]===p[1]))];
    return priority.filter(([a,b])=>!disabledAgents.has(a)&&!disabledAgents.has(b)).slice(0,Math.min(graphBudget,viable.length));
  }
  return (modes[graphMode]||modes.sparse).filter(([a,b])=>!disabledAgents.has(a)&&!disabledAgents.has(b));
}
function selectAgent(i){selectedAgent=selectedAgent===i?null:i;paintGraph();}
function paintGraph(){
  const active=activePairs();const focus=hoveredAgent??selectedAgent;
  $('#network-edges').replaceChildren();
  pairs.forEach(([a,b],i)=>{
    const [x1,y1]=positions[a], [x2,y2]=positions[b];
    const on=active.some(p=>p[0]===a&&p[1]===b);
    const related=focus===a||focus===b;
    const className=`network-edge${on?'':' off'}${focus!==null&&on?(related?' traced':' faded'):''}`;
    $('#network-edges').append(svgElement('line',{x1,y1,x2,y2,class:className,'data-active':String(on)}));
    if(on&&!motionPaused&&!reducedMotion.matches&&(focus===null||related)){
      const dot=svgElement('circle',{r:related?2.5:1.8,class:'pulse'});
      dot.append(svgElement('animateMotion',{dur:`${2.5+i%3}s`,repeatCount:'indefinite',path:`M${x1},${y1} L${x2},${y2}`,begin:`-${i*.5}s`}));
      $('#network-edges').append(dot);
    }
  });
  nodeGroups.forEach((g,i)=>{
    g.setAttribute('transform',`translate(${positions[i][0]} ${positions[i][1]})`);
    g.classList.toggle('selected',i===selectedAgent);g.classList.toggle('disabled',disabledAgents.has(i));g.setAttribute('aria-pressed',String(i===selectedAgent));
  });
  $('#edge-count').textContent=active.length;
  $('#graph-caption').textContent={dense:'Every available agent connected.',sparse:'Keep the useful connections.',routed:'Activate a task-specific path.',custom:'A communication budget you control.'}[graphMode];
  $('#link-budget').max=availablePairs().length;$('#link-budget').value=active.length;
  $('#budget-value').value=`${active.length} / ${availablePairs().length}`;
  $('#link-budget').style.setProperty('--range-fill',`${100*active.length/Math.max(1,availablePairs().length)}%`);
  document.querySelectorAll('[data-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.mode===graphMode)));
  const inspect=focus;
  $('#agent-label').textContent=inspect===null?'SELECT AN AGENT':`${positions[inspect][2].toUpperCase()} · ${disabledAgents.has(inspect)?'DISABLED':active.filter(([a,b])=>a===inspect||b===inspect).length+' CONNECTIONS'}`;
  $('#agent-description').textContent=inspect===null?'Drag a node. Trace its connections. Reshape the team.':agentNotes[inspect];
  $('#toggle-agent').disabled=selectedAgent===null;
  $('#toggle-agent').textContent=selectedAgent!==null&&disabledAgents.has(selectedAgent)?'Enable agent':'Disable agent';
}
drawGraph = mode => {graphMode=mode;paintGraph();};
$('#link-budget').addEventListener('input',e=>{graphMode='custom';graphBudget=Number(e.target.value);paintGraph();});
$('#toggle-agent').addEventListener('click',()=>{if(selectedAgent===null)return;if(disabledAgents.has(selectedAgent))disabledAgents.delete(selectedAgent);else disabledAgents.add(selectedAgent);paintGraph();});
$('#reset-network').addEventListener('click',()=>{disabledAgents.clear();selectedAgent=null;hoveredAgent=null;initialPositions.forEach((p,i)=>{positions[i][0]=p[0];positions[i][1]=p[1];});graphBudget=9;drawGraph('sparse');});
paintGraph();

// Original manuscript figures, with keyboard- and touch-accessible annotations.
const atlasFigures={
  Topology:{file:'pruning_figure',ratio:'1140 / 405',source:'figures/generated/pruning_figure.pdf',
    regions:[
      {name:'Pruning',search:'Topology Pruning',box:[0,0,66,49],description:'Remove redundant agents or communication links from an existing topology. The intervention changes which paths remain available.',examples:'AgentPrune · AgentDropout'},
      {name:'Construction',search:'Topology Construction',box:[0,50,66,49],description:'Select roles and construct a task-specific graph. The goal is useful coordination, rather than simply the smallest possible team.',examples:'G-Designer · GTD · HiVA'},
      {name:'Adaptation',search:'Topology Adaptation',box:[67,0,32,99],description:'Revise the collaboration structure from intermediate feedback or transferred priors as the task evolves.',examples:'TopoPrior · TacoMAS · MasFACT'}]},
  Runtime:{file:'runtime_overview_figure',ratio:'1500 / 400',source:'figures/generated/runtime_overview_figure.pdf',
    regions:[
      {name:'Communication',search:'Communication',box:[0,0,49,48],description:'Select and compress exchanged content. Shorter messages save resources only if the information needed for the task survives.',examples:'S2-MAD · EcoLANG · DebateOCR'},
      {name:'Routing',search:'Routing',box:[50,0,49,48],description:'Choose the next model, agent, or context view according to the current execution state and quality requirement.',examples:'CASTER · RCR-Router · Smurfs'},
      {name:'State',search:'State',box:[0,49,49,50],description:'Reuse memory and model cache instead of reconstructing the same execution state. Logical decisions and serving work are distinct costs.',examples:'TokenDance · KVCOMM'},
      {name:'Scheduling',search:'Scheduling',box:[50,49,49,50],description:'Turn dependencies into an execution plan. Concurrency, deferral, and recovery determine latency and capacity.',examples:'Act-or-Defer · AgentRadio'}]},
  Optimization:{file:'optimization_figure',ratio:'1500 / 425',source:'figures/generated/optimization_figure.pdf',
    regions:[
      {name:'Prompt optimization',search:'Prompt Optimization',box:[0,0,49,48],description:'Refine coupled agent instructions using system-level feedback. Improving a local prompt need not improve the whole workflow.',examples:'MAPGD · MAPRO · MASPO'},
      {name:'Workflow search',search:'Workflow Search',box:[50,0,49,48],description:'Search executable collaboration programs. The deployed workflow must repay the cost of generating and evaluating its candidates.',examples:'MASS · AFlow · MetaAgent'},
      {name:'Policy learning',search:'Policy Learning',box:[0,51,49,48],description:'Train sequential decisions from collaboration trajectories. Training cost, sample efficiency, and deployment cost are separate quantities.',examples:'OPTIMA · CORL · LEMON'},
      {name:'Continual learning',search:'Continual Learning',box:[50,51,49,48],description:'Convert accumulated experience into skills or procedures that improve future requests. Reuse and maintenance determine lifecycle efficiency.',examples:'MetaTeam · SkillGraph · G-Memory'}]}
};
let atlasLayer='Topology';let atlasRegion=0;let atlasFocused=false;
// Pixel bounds in the original PNGs. The topology feedback label extends into
// the gutter, so its outline is shared by the two adjacent clipping paths.
const atlasCrops={
  Topology:{size:[1140,405],panels:[
    {bounds:[0,0,770,200]},
    {bounds:[0,210,770,195],outline:'0,210 770,210 770,230 700,230 700,290 770,290 770,405 0,405'},
    {bounds:[700,0,440,405],hotspot:[770,0,370,405],outline:'770,0 1140,0 1140,405 770,405 770,290 700,290 700,230 770,230'}
  ]},
  Runtime:{size:[1500,400],panels:[
    {bounds:[0,0,745,190]},{bounds:[745,0,755,190]},
    {bounds:[0,190,745,210]},{bounds:[745,190,755,210]}
  ]},
  Optimization:{size:[1500,425],panels:[
    {bounds:[0,0,750,207]},{bounds:[750,0,750,207]},
    {bounds:[0,207,750,218]},{bounds:[750,207,750,218]}
  ]}
};
function updateAtlasCrop(){
  const figure=atlasFigures[atlasLayer],crop=atlasCrops[atlasLayer];
  const {bounds,outline}=crop.panels[atlasRegion];
  const stage=$('.figure-stage'),svg=$('#region-image');
  stage.style.setProperty('--crop-ratio',bounds[2]/bounds[3]);
  svg.setAttribute('viewBox',bounds.join(' '));
  svg.setAttribute('aria-label',`${figure.regions[atlasRegion].name} — cropped manuscript figure`);
  const clip=svgElement('clipPath',{id:'atlas-crop-clip',clipPathUnits:'userSpaceOnUse'});
  clip.append(outline?svgElement('polygon',{points:outline}):svgElement('rect',{x:bounds[0],y:bounds[1],width:bounds[2],height:bounds[3]}));
  const defs=svgElement('defs',{});defs.append(clip);
  svg.replaceChildren(defs,svgElement('image',{href:`assets/figures/${figure.file}.png`,width:crop.size[0],height:crop.size[1],'clip-path':'url(#atlas-crop-clip)'}));
  $('#region-restore').setAttribute('aria-label',`Restore complete ${atlasLayer.toLowerCase()} figure`);
  $('#atlas-caption').textContent=atlasFocused?`${figure.regions[atlasRegion].name} · click image to restore`:'Hover to explore · click a region to enlarge';
}
function renderAtlas(layer){
  atlasLayer=layer;atlasRegion=0;atlasFocused=false;const figure=atlasFigures[layer];
  const crops=atlasCrops[layer];
  figure.regions.forEach((r,i)=>{
    const bounds=crops.panels[i].hotspot||crops.panels[i].bounds;
    r.box=bounds.map((value,j)=>100*value/crops.size[j%2]);
  });
  document.querySelectorAll('[data-layer]').forEach(b=>b.setAttribute('aria-controls','figure-atlas'));
  $('#figure-atlas').setAttribute('role','tabpanel');$('#figure-atlas').setAttribute('aria-labelledby','tab-'+layer.toLowerCase());$('#figure-atlas').tabIndex=0;
  $('#figure-atlas').innerHTML=`<div class="atlas-shell"><div class="atlas-toolbar"><span>FIGURE EXPLORER / ${layer.toUpperCase()}</span><button id="open-atlas" class="compact-button">Open full screen ⤢</button></div><div class="atlas-body"><div class="atlas-paper"><div class="figure-stage" style="--figure-ratio:${figure.ratio}"><img src="assets/figures/${figure.file}.png" alt="Original manuscript figure: ${layer} methods" loading="lazy" decoding="async">${figure.regions.map((r,i)=>`<button class="figure-hotspot" data-region="${i}" aria-label="Inspect ${r.name}" style="--x:${r.box[0]}%;--y:${r.box[1]}%;--w:${r.box[2]}%;--h:${r.box[3]}%"><span>${i+1}</span></button>`).join('')}</div><p class="figure-caption"><span>Original figure · ${layer}</span><span>Hover / focus / select</span></p></div><div class="atlas-info"><span class="atlas-step" id="atlas-step"></span><h3 id="atlas-title"></h3><p id="atlas-explanation"></p><div class="atlas-examples" id="atlas-examples"></div><button id="focus-region" class="compact-button">Focus this panel ⤢</button><a id="atlas-papers" href="#library">Related papers →</a></div></div><div class="atlas-regions" role="group" aria-label="Figure regions">${figure.regions.map((r,i)=>`<button class="atlas-region" data-region-choice="${i}" aria-pressed="${i===0}">${String(i+1).padStart(2,'0')} ${r.name}</button>`).join('')}</div></div><p class="atlas-description">${layers[layer].description}</p>`;
  const restore=document.createElement('button');
  restore.id='region-restore';restore.className='region-restore';restore.hidden=true;
  restore.append(svgElement('svg',{id:'region-image',role:'img',preserveAspectRatio:'xMidYMid meet'}));
  $('.figure-stage').append(restore);
  $('.figure-caption span:last-child').id='atlas-caption';
  restore.addEventListener('click',()=>setAtlasFocus(false));
  restore.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();setAtlasFocus(false);}});
  document.querySelectorAll('.figure-hotspot').forEach(b=>{
    b.addEventListener('pointerenter',()=>{if(!atlasFocused)setAtlasRegion(Number(b.dataset.region));});
    b.addEventListener('focus',()=>{if(!atlasFocused)setAtlasRegion(Number(b.dataset.region));});
    b.addEventListener('click',()=>{setAtlasRegion(Number(b.dataset.region));setAtlasFocus(true);});
  });
  document.querySelectorAll('[data-region-choice]').forEach(b=>b.addEventListener('click',()=>{setAtlasRegion(Number(b.dataset.regionChoice));}));
  $('#focus-region').addEventListener('click',()=>setAtlasFocus(!atlasFocused));
  $('#open-atlas').addEventListener('click',()=>openFigure(`assets/figures/${figure.file}.png`,`${layer} · original figure`,`${layers[layer].description} Source: ${figure.source}. Original artwork is unchanged; page whitespace is cropped.`));
  $('#atlas-papers').addEventListener('click',()=>{
    const query=figure.regions[atlasRegion].search;
    Object.assign(state,libraryModel.browse(state,layer),{query});syncLibraryControls();
    $('#search').value=query;$('#year').value='all';$('#representative').checked=false;render();
  });
  setAtlasRegion(0);
}
function setAtlasRegion(index){
  atlasRegion=index;const f=atlasFigures[atlasLayer], r=f.regions[index];
  $('#atlas-step').textContent=`${String(index+1).padStart(2,'0')} / ${String(f.regions.length).padStart(2,'0')} · ${atlasLayer.toUpperCase()}`;
  $('#atlas-title').textContent=r.name;$('#atlas-explanation').textContent=r.description;
  $('#atlas-examples').textContent=r.examples;
  document.querySelectorAll('[data-region-choice]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.regionChoice)===index)));
  document.querySelectorAll('.figure-hotspot').forEach(b=>b.classList.toggle('is-active',Number(b.dataset.region)===index));
  updateAtlasCrop();
  const info=$('.atlas-info');info.classList.remove('is-changing');requestAnimationFrame(()=>info.classList.add('is-changing'));
}
function setAtlasFocus(focus){
  atlasFocused=focus;$('.figure-stage').classList.toggle('is-focused',focus);
  $('.figure-stage > img').hidden=focus;
  $('#region-restore').hidden=!focus;
  document.querySelectorAll('.figure-hotspot').forEach(b=>{b.tabIndex=focus?-1:0;b.inert=focus;});
  $('#focus-region').textContent=focus?'Show complete figure ↙':'Focus this panel ⤢';
  $('#focus-region').setAttribute('aria-pressed',String(focus));
  updateAtlasCrop();
  if(focus)$('#region-restore').focus({preventScroll:true});
  else document.querySelector(`.figure-hotspot[data-region="${atlasRegion}"]`).focus({preventScroll:true});
}
const baseShowLayer=showLayer;
showLayer=layer=>{baseShowLayer(layer);renderAtlas(layer);};
renderAtlas('Topology');

// Copy exactly the citation displayed on the page, including on file:// previews.
$('#copy-citation').addEventListener('click',async()=>{
  const button=$('#copy-citation'),code=$('#citation-code'),status=$('#citation-status');
  const citation=code.textContent.trim();
  button.disabled=true;
  try{
    let copied=false;
    if(navigator.clipboard?.writeText){
      try{await navigator.clipboard.writeText(citation);copied=true;}catch{/* Try the local-preview fallback. */}
    }
    if(!copied){
      const field=document.createElement('textarea');field.value=citation;
      field.className='clipboard-buffer';field.setAttribute('readonly','');document.body.append(field);
      try{field.select();copied=document.execCommand('copy');}finally{field.remove();button.focus({preventScroll:true});}
    }
    if(!copied)throw new Error('Clipboard unavailable');
    button.textContent='Copied ✓';status.textContent='BibTeX copied to clipboard.';
  }catch{
    const range=document.createRange();range.selectNodeContents(code);
    const selection=window.getSelection();selection.removeAllRanges();selection.addRange(range);
    status.textContent='Copy is unavailable. Citation selected — press Ctrl+C or ⌘C to copy.';
    button.textContent='Copy BibTeX';
  }finally{button.disabled=false;}
});

// Accessible native dialog: Escape closes it and focus returns to its opener.
const figureDialog=$('#figure-dialog');let viewerZoom=1;let viewerOpener=null;let viewerDrag=null;
function openFigure(src,title,caption){
  viewerOpener=document.activeElement;$('#dialog-title').textContent=title;$('#dialog-image').src=src;$('#dialog-image').alt=title;
  $('#dialog-caption').textContent=caption;$('#download-figure').href=src;setViewerZoom(1);figureDialog.showModal();$('#close-figure').focus();
}
function setViewerZoom(zoom){
  viewerZoom=Math.max(1,Math.min(3,zoom));$('#zoom-level').value=Math.round(viewerZoom*100)+'%';
  $('#figure-viewport').classList.toggle('zoomed',viewerZoom>1);$('#figure-viewport').style.setProperty('--zoom-width',viewerZoom*100+'%');
  $('#zoom-out').disabled=viewerZoom===1;$('#zoom-in').disabled=viewerZoom===3;
  if(viewerZoom===1){$('#figure-viewport').scrollTop=0;$('#figure-viewport').scrollLeft=0;}
}
$('#close-figure').addEventListener('click',()=>figureDialog.close());
figureDialog.addEventListener('close',()=>{viewerOpener?.focus({preventScroll:true});viewerDrag=null;});
figureDialog.addEventListener('click',e=>{if(e.target===figureDialog){const b=figureDialog.getBoundingClientRect();if(e.clientX<b.left||e.clientX>b.right||e.clientY<b.top||e.clientY>b.bottom)figureDialog.close();}});
$('#zoom-in').addEventListener('click',()=>setViewerZoom(viewerZoom+.5));$('#zoom-out').addEventListener('click',()=>setViewerZoom(viewerZoom-.5));$('#zoom-fit').addEventListener('click',()=>setViewerZoom(1));
const viewer=$('#figure-viewport');
viewer.addEventListener('pointerdown',e=>{if(viewerZoom<=1||e.pointerType!=='mouse'||e.button!==0)return;viewerDrag={x:e.clientX,y:e.clientY,left:viewer.scrollLeft,top:viewer.scrollTop};viewer.setPointerCapture(e.pointerId);});
viewer.addEventListener('pointermove',e=>{if(viewerDrag){viewer.scrollLeft=viewerDrag.left+viewerDrag.x-e.clientX;viewer.scrollTop=viewerDrag.top+viewerDrag.y-e.clientY;}});
viewer.addEventListener('pointerup',()=>viewerDrag=null);viewer.addEventListener('pointercancel',()=>viewerDrag=null);

// Measured MASS values are copied from sections/6_synthesis.tex, not simulated.
const massStages=[
  {short:'Base',score:63.54,title:'Base system',description:'The initial system, before the reported optimization pipeline.'},
  {short:'APO',score:67.44,title:'Agent-prompt optimization',description:'Refining agent prompts raises the mean score by 3.90 points over the initial system.'},
  {short:'1PO',score:74.56,title:'Block-prompt optimization',description:'Block-level prompt optimization produces the largest increment in this ordered pipeline: +7.12 points.'},
  {short:'2TO',score:77.55,title:'Topology optimization',description:'Optimizing topology raises the mean score by another 2.99 points after the prompt changes.'},
  {short:'3PO',score:78.40,title:'Workflow-prompt refinement',description:'Final workflow-level refinement adds 0.85 points. Returns diminish at the end of the reported pipeline.'}
];
let massIndex=0;const massSVG=$('#mass-chart');
let compactChart=false;
const plotX=i=>compactChart?45+i*78:70+i*137.5,plotY=score=>265-(score-60)/20*230;
[60,65,70,75,80].forEach(value=>{const y=plotY(value);massSVG.append(svgElement('line',{x1:70,y1:y,x2:620,y2:y,class:'chart-grid'}));const text=svgElement('text',{x:44,y:y+4,class:'chart-axis-label','text-anchor':'end'});text.textContent=value;massSVG.append(text);});
const path=massStages.map((s,i)=>`${i?'L':'M'}${plotX(i)},${plotY(s.score)}`).join(' ');
massSVG.append(svgElement('path',{d:path,class:'chart-line-base'}));
const activePath=svgElement('path',{d:path,class:'chart-line-active',pathLength:100,'stroke-dasharray':100,'stroke-dashoffset':100});massSVG.append(activePath);
const lengths=[0];for(let i=1;i<massStages.length;i++)lengths[i]=lengths[i-1]+Math.hypot(plotX(i)-plotX(i-1),plotY(massStages[i].score)-plotY(massStages[i-1].score));
massStages.forEach((s,i)=>{
  const point=svgElement('g',{class:'chart-point',role:'button',tabindex:0,'aria-label':`${s.title}: ${s.score.toFixed(2)} mean score`,'aria-pressed':'false','data-stage':i});
  point.append(svgElement('rect',{x:plotX(i)-37,y:10,width:74,height:300,fill:'transparent','pointer-events':'all'}));
  point.append(svgElement('circle',{cx:plotX(i),cy:plotY(s.score),r:11,class:'point-halo'}));point.append(svgElement('circle',{cx:plotX(i),cy:plotY(s.score),r:5,class:'point-marker'}));
  const label=svgElement('text',{x:plotX(i),y:300,'text-anchor':'middle'});label.textContent=s.short;point.append(label);
  const score=svgElement('text',{x:plotX(i),y:plotY(s.score)-20,'text-anchor':'middle'});score.textContent=s.score.toFixed(2);point.append(score);
  point.addEventListener('click',()=>selectMassStage(i));point.addEventListener('pointerenter',()=>selectMassStage(i));point.addEventListener('focus',()=>selectMassStage(i));point.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();selectMassStage(i);}});massSVG.append(point);
});
function selectMassStage(index){
  massIndex=index;const stage=massStages[index];
  $('#mass-stage').value=index;$('#mass-stage').style.setProperty('--range-fill',`${index*25}%`);$('#stage-short').value=stage.short;
  $('#stage-score').textContent=stage.score.toFixed(2);$('#stage-title').textContent=stage.title;$('#stage-description').textContent=stage.description;
  $('#stage-delta').textContent=index?`+${(stage.score-massStages[0].score).toFixed(2)} points vs. base`:'Initial operating point';
  $('#stage-number').textContent=`0${index+1} / 05`;$('#stage-prev').disabled=index===0;$('#stage-next').disabled=index===4;
  document.querySelectorAll('[data-stage]').forEach(point=>{point.classList.toggle('is-past',Number(point.dataset.stage)<=index);point.classList.toggle('is-selected',Number(point.dataset.stage)===index);point.setAttribute('aria-pressed',String(Number(point.dataset.stage)===index));});
  activePath.setAttribute('stroke-dashoffset',100-100*lengths[index]/lengths[4]);
}
$('#mass-stage').addEventListener('input',e=>selectMassStage(Number(e.target.value)));
$('#stage-prev').addEventListener('click',()=>selectMassStage(Math.max(0,massIndex-1)));$('#stage-next').addEventListener('click',()=>selectMassStage(Math.min(4,massIndex+1)));
$('#mass-original').addEventListener('click',()=>openFigure('assets/figures/optimization_results_b.png','MASS · stage returns','Original figure from optimization_results_b.pdf. The interactive reconstruction uses the more precise values stated in the survey text: 63.54, 67.44, 74.56, 77.55, and 78.40. Stages are cumulative.'));
const massPaper=papers.find(p=>p.key==='arxiv250202533');if(massPaper&&safeUrl(massPaper.url)){$('#mass-paper').href=massPaper.url;$('#mass-paper').target='_blank';$('#mass-paper').rel='noopener noreferrer';}
selectMassStage(0);

function resizeMassChart(){
  compactChart=matchMedia('(max-width:760px)').matches;
  massSVG.setAttribute('viewBox',compactChart?'0 0 400 320':'0 0 690 320');
  massSVG.querySelectorAll('.chart-grid').forEach(line=>{line.setAttribute('x1',plotX(0));line.setAttribute('x2',plotX(4));});
  massSVG.querySelectorAll('.chart-axis-label').forEach(label=>label.setAttribute('x',compactChart?29:44));
  massSVG.querySelectorAll('.chart-point').forEach((point,i)=>{
    point.querySelector('rect').setAttribute('x',plotX(i)-(compactChart?29:37));
    point.querySelector('rect').setAttribute('width',compactChart?58:74);
    point.querySelectorAll('circle').forEach(circle=>circle.setAttribute('cx',plotX(i)));
    point.querySelectorAll('text').forEach(label=>label.setAttribute('x',plotX(i)));
  });
  const resizedPath=massStages.map((s,i)=>`${i?'L':'M'}${plotX(i)},${plotY(s.score)}`).join(' ');
  massSVG.querySelector('.chart-line-base').setAttribute('d',resizedPath);activePath.setAttribute('d',resizedPath);
  for(let i=1;i<massStages.length;i++)lengths[i]=lengths[i-1]+Math.hypot(plotX(i)-plotX(i-1),plotY(massStages[i].score)-plotY(massStages[i-1].score));
  selectMassStage(massIndex);
}
matchMedia('(max-width:760px)').addEventListener('change',resizeMassChart);resizeMassChart();

// Motion remains secondary to content: no hidden sections or scroll hijacking.
const sectionObserver=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('is-revealed');sectionObserver.unobserve(entry.target);}}),{threshold:.12});
document.querySelectorAll('.section').forEach(el=>sectionObserver.observe(el));
document.querySelectorAll('.taxonomy-tabs button').forEach(el=>el.addEventListener('pointermove',e=>{if(reducedMotion.matches)return;const box=el.getBoundingClientRect();el.style.setProperty('--mouse-x',e.clientX-box.left+'px');el.style.setProperty('--mouse-y',e.clientY-box.top+'px');}));
let scrollPending=false;
function updateReading(){
  const total=document.documentElement.scrollHeight-innerHeight;
  $('#reading-progress').style.width=(total>0?100*scrollY/total:0)+'%';
  let current='';document.querySelectorAll('main section[id]').forEach(section=>{if(section.getBoundingClientRect().top<innerHeight*.35)current=section.id;});
  document.querySelectorAll('.header nav a').forEach(a=>{const active=a.hash==='#'+current;a.classList.toggle('current',active);if(active)a.setAttribute('aria-current','location');else a.removeAttribute('aria-current');});
  scrollPending=false;
}
addEventListener('scroll',()=>{if(!scrollPending){scrollPending=true;requestAnimationFrame(updateReading);}},{passive:true});updateReading();
