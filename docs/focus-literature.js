'use strict';
(() => {
  const mount = $('#research-map');
  let layer, family, currentView='image', year='all', page=1, model, pinned=null;
  const esc = escapeHtml;
  const title = () => family.split(' / ')[1].replace('Topology ','');
  const browse = () => {
    Object.assign(state,libraryModel.browse(state,layer),{subfamily:family});
    syncLibraryControls();render();
  };
  function switchView(view) {
    currentView=view;
    const literature=view==='literature';
    $('.atlas-shell').classList.toggle('is-literature',literature);
    mount.hidden=!literature;
    $('#focus-image-panel').hidden=literature;
    $('#focus-image-panel').setAttribute('role','tabpanel');
    $('#focus-image-panel').setAttribute('aria-labelledby','focus-image-tab');
    for(const [id,selected] of [['focus-image-tab',!literature],['focus-literature-tab',literature]]) {
      const tab=$('#'+id);tab.setAttribute('aria-selected',String(selected));tab.tabIndex=selected?0:-1;
    }
    $('#focus-discovery').setAttribute('aria-expanded',String(literature));
    if(literature)showDetail(pinned);
    else $('#focus-paper-detail').hidden=true;
  }
  function showDetail(paper) {
    const panel=$('#focus-paper-detail');panel.hidden=false;
    if(!paper) {
      panel.innerHTML=`<span class="inspector-label">READ THE RESEARCH TRAIL</span><h3>${esc(title())}</h3><p>${model.total} papers, grouped by bibliography year. Select a year to follow the work in that period.</p><p>Hover over a card to preview it, or select one to keep its details here.</p><a class="trail-browse" href="#library">Browse this branch →</a><button class="compact-button trail-back">← Back to figure</button>`;
    } else {
      const url=safeUrl(paper.url);
      panel.innerHTML=`<span class="inspector-label">${pinned===paper?'SELECTED PAPER':'PAPER PREVIEW'} · ${esc(paper.year||'Undated')}</span><h3>${esc(paper.method||title())}</h3><p class="trail-full-title">${esc(paper.title)}</p><p class="trail-authors">${esc(paper.authors.split(' and ').join(', '))}</p>${paper.evidence?`<div class="trail-evidence"><b>Reported effect</b><p>${esc(paper.evidence.effect)}</p><b>Main boundary</b><p>${esc(paper.evidence.boundary)}</p></div>`:''}<div class="trail-detail-actions">${url?`<a href="${esc(url)}" target="_blank" rel="noopener noreferrer">Read paper ↗</a>`:''}<button class="compact-button trail-back">← Back to figure</button></div>`;
    }
    panel.querySelector('.trail-browse')?.addEventListener('click',browse);
    panel.querySelector('.trail-back').addEventListener('click',()=>{switchView('image');$('#focus-image-tab').focus({preventScroll:true});});
  }
  function drawCards() {
    model=researchMapModel.collection(papers,layer,family,year,page);
    page=model.page;
    mount.innerHTML=`<div class="trail-heading"><div><span class="inspector-label">THE RESEARCH TRAIL</span><h4>${esc(title())}</h4></div><span>${model.total} papers</span></div><div class="trail-years" role="group" aria-label="Filter related papers by year"><button data-trail-year="all" aria-pressed="${year==='all'}">All years <b>${model.total}</b></button>${model.buckets.map(b=>`<button data-trail-year="${esc(b.year)}" aria-pressed="${String(year)===String(b.year)}"><span>${esc(b.year)}</span><i style="--bar:${100*b.count/Math.max(...model.buckets.map(b=>b.count))}%" aria-hidden="true"></i><b>${b.count}</b></button>`).join('')}</div><div class="trail-card-grid">${model.items.map(p=>`<button class="trail-card" data-paper-key="${esc(p.key)}" aria-pressed="${pinned?.key===p.key}"><span class="trail-card-meta"><span>${esc(p.year||'Undated')}</span>${p.evidence?'<span class="trail-evidence-badge">Evidence in survey</span>':''}</span><strong>${esc(p.method||p.title)}</strong>${p.method?`<span class="trail-card-title">${esc(p.title)}</span>`:''}<span class="trail-card-author">${esc(p.authors.split(' and ').slice(0,2).join(', '))}${p.authors.split(' and ').length>2?' et al.':''}</span><span class="trail-card-open">Preview paper ↗</span></button>`).join('')||'<p class="trail-empty">No papers assigned to this branch yet.</p>'}</div><div class="trail-pagination"><button class="compact-button" id="trail-previous" ${page===1?'disabled':''} aria-label="Previous related papers">←</button><span role="status">${model.count?`${(page-1)*4+1}–${Math.min(page*4,model.count)} of ${model.count}`:'0 papers'} · Page ${page} / ${model.pages}</span><button class="compact-button" id="trail-next" ${page===model.pages?'disabled':''} aria-label="Next related papers">→</button></div><p class="trail-note">Years follow the bibliography; grouping indicates a shared research direction.</p>`;
    mount.querySelectorAll('[data-trail-year]').forEach(button=>button.addEventListener('click',()=>{
      year=button.dataset.trailYear;page=1;pinned=null;drawCards();showDetail(null);
      mount.querySelector(`[data-trail-year="${year}"]`).focus({preventScroll:true});
    }));
    for(const button of mount.querySelectorAll('.trail-card')) {
      const paper=model.items.find(p=>p.key===button.dataset.paperKey);
      button.addEventListener('pointerenter',()=>{if(!pinned)showDetail(paper);});
      button.addEventListener('focus',()=>{if(!pinned)showDetail(paper);});
      button.addEventListener('click',()=>{
        pinned=pinned===paper?null:paper;
        mount.querySelectorAll('.trail-card').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.paperKey===pinned?.key)));
        showDetail(pinned||paper);
        mount.querySelector('.trail-inline-detail')?.remove();
        if(pinned) {
          const inline=document.createElement('article');inline.className='trail-inline-detail';
          const url=safeUrl(paper.url);
          inline.innerHTML=`<strong>${esc(paper.title)}</strong><p>${esc(paper.authors.split(' and ').join(', '))}</p>${paper.evidence?`<p><b>Reported effect:</b> ${esc(paper.evidence.effect)}</p><p><b>Main boundary:</b> ${esc(paper.evidence.boundary)}</p>`:''}${url?`<a href="${esc(url)}" target="_blank" rel="noopener noreferrer">Read paper ↗</a>`:''}`;
          button.after(inline);
        }
      });
    }
    for(const [id,delta] of [['trail-previous',-1],['trail-next',1]]) {
      $('#'+id).addEventListener('click',()=>{
        page+=delta;pinned=null;drawCards();showDetail(null);
        const next=$('#'+id);(next.disabled?$('#'+(delta>0?'trail-previous':'trail-next')):next).focus({preventScroll:true});
      });
    }
  }
  function bindViews() {
    const tabs=[$('#focus-image-tab'),$('#focus-literature-tab')];
    tabs.forEach((tab,i)=>{
      tab.onclick=()=>switchView(i?'literature':'image');
      tab.onkeydown=e=>{
        if(['ArrowLeft','ArrowRight','Home','End'].includes(e.key)) {
          e.preventDefault();const n=e.key==='Home'?0:e.key==='End'?1:1-i;
          switchView(n?'literature':'image');tabs[n].focus({preventScroll:true});
        }
      };
    });
    $('#focus-discovery').onclick=()=>{switchView('literature');tabs[1].focus({preventScroll:true});};
  }
  function syncFocus(detail) {
    const {focused}=detail;
    $('.focus-views').hidden=!focused;
    $('.figure-caption').hidden=focused;
    $('#focus-discovery').hidden=!focused;
    $('.focus-discovery-hint').hidden=focused;
    if(!focused) {
      mount.hidden=true;mount.replaceChildren();$('#focus-image-panel').hidden=false;
      $('#focus-paper-detail').hidden=true;$('.atlas-shell').classList.remove('is-literature');
      currentView='image';family=null;pinned=null;return;
    }
    if(family!==detail.family||layer!==detail.layer) {
      family=detail.family;layer=detail.layer;year='all';page=1;pinned=null;
      drawCards();bindViews();
      $('#focus-paper-count').textContent=model.total;
      $('#focus-discovery').innerHTML=`<span class="discovery-heading">Follow this research <b>${model.total} papers ↗</b></span><span class="discovery-bars" aria-hidden="true">${model.buckets.map(b=>`<span><i style="height:${14*b.count/Math.max(...model.buckets.map(b=>b.count))}px"></i><small>${esc(b.year)}</small></span>`).join('')}</span><span class="discovery-foot">Explore papers by year</span>`;
      $('#focus-discovery').setAttribute('aria-label',`Explore ${model.total} related papers in ${title()}`);
      switchView(currentView);
    }
  }
  mount.setAttribute('role','tabpanel');mount.setAttribute('aria-labelledby','focus-literature-tab');
  document.addEventListener('atlas-region-change',e=>syncFocus(e.detail));
  document.addEventListener('keydown',e=>{
    if(e.key==='Escape'&&atlasFocused&&$('.atlas-shell').contains(document.activeElement)) {
      if(currentView==='literature'){switchView('image');$('#focus-image-tab').focus({preventScroll:true});}
      else setAtlasFocus(false);
    }
  });
})();
