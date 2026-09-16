const assert=require('node:assert/strict');
const {papers,stats}=require('../docs/data/papers.json');
const model=require('../docs/library-model.js');
const base={categories:[],match:'any',subfamily:'all',query:'',year:'all',representative:false,sort:'year-desc',page:1,pageSize:5};
// Reproduce the atlas navigation that used to leave six papers in All papers.
const narrowed={...base,categories:['Optimization'],query:'Continual Learning',page:9};
assert.equal(model.select(papers,narrowed).matches.length,6);
assert.equal(model.select(papers,narrowed).page,2);
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
assert.equal(model.select(papers,all).items.length,5);
assert.equal(model.select(papers,all).pages,52);
assert.equal(model.select(papers,{...all,page:52}).items.length,1);
assert.equal(model.select(papers,{...all,pageSize:10}).pages,26);
const combination={...base,categories:['Topology','Runtime']};
assert.equal(model.select(papers,combination).matches.length,papers.filter(p=>p.categories.includes('Topology')||p.categories.includes('Runtime')).length);
const intersection=model.select(papers,{...combination,match:'all'}).matches;
assert.equal(intersection.length,papers.filter(p=>p.categories.includes('Topology')&&p.categories.includes('Runtime')).length);
assert.ok(intersection.length>0);
const refined={...combination,match:'all',year:'2025',representative:true};
assert.deepEqual(model.select(papers,refined).matches.map(p=>p.key).sort(),papers.filter(p=>p.categories.includes('Topology')&&p.categories.includes('Runtime')&&p.year===2025&&p.evidence).map(p=>p.key).sort());
const toggled=model.toggle({...base,query:'agent',year:'2025'},'Topology');
assert.equal(toggled.query,'agent');assert.equal(toggled.year,'2025');assert.deepEqual(toggled.categories,['Topology']);
assert.deepEqual(model.toggle(toggled,'Topology').categories,[]);
const family='Optimization / Continual Learning';
assert.equal(model.select(papers,{...base,subfamily:family}).matches.length,papers.filter(p=>p.subfamilies.includes(family)).length);
assert.equal(model.browse({...narrowed,subfamily:family},'Topology').subfamily,'all');
assert.equal(model.select(papers,{...all,query:'   '}).matches.length,256);
assert.equal(model.select(papers,{...all,query:'no-such-paper-test'}).items.length,0);
console.log('PASS: category totals, OR/AND tags, combined filters, atlas reset, 5/10-item pagination, and all 256 papers without duplicates.');
