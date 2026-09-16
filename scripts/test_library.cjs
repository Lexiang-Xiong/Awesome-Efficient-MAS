const assert=require('node:assert/strict');
const {papers,stats}=require('../docs/data/papers.json');
const model=require('../docs/library-model.js');
const base={category:'All papers',query:'',year:'all',representative:false,sort:'year-desc',page:1,pageSize:25};
// Reproduce the atlas navigation that used to leave six papers in All papers.
const narrowed={...base,category:'Optimization',query:'Continual Learning',page:9};
assert.equal(model.select(papers,narrowed).matches.length,6);
assert.equal(model.select(papers,narrowed).page,1);
for(const [category,count] of Object.entries(stats.bySection)){
  const state=model.browse({...narrowed,year:'2026',representative:true},category);
  const result=model.select(papers,state);
  assert.equal(result.matches.length,count,category);
  assert.equal(result.page,1);assert.equal(state.query,'');
}
const all=model.browse(narrowed,'All papers');
assert.equal(model.select(papers,all).matches.length,256);
const shown=[];
for(let page=1;page<=model.select(papers,all).pages;page++)
  shown.push(...model.select(papers,{...all,page}).items.map(p=>p.key));
assert.equal(shown.length,256);assert.equal(new Set(shown).size,256);
assert.equal(model.select(papers,{...all,pageSize:'all'}).items.length,256);
assert.equal(model.select(papers,{...all,query:'   '}).matches.length,256);
assert.equal(model.select(papers,{...all,query:'no-such-paper-test'}).items.length,0);
console.log('PASS: stale atlas filters, every category count, all 256 papers across pagination, show-all, whitespace and empty results.');
