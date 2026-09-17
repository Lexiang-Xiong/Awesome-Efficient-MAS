const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const model = require('../docs/research-map-model.js');
const {papers} = JSON.parse(fs.readFileSync(path.join(__dirname,'../docs/data/papers.json'),'utf8'));
for (const layer of ['Topology','Runtime','Optimization']) {
  const families=[...new Set(papers.flatMap(p=>p.subfamilies).filter(f=>f.startsWith(layer+' / ')))];
  const m=model.build(papers,layer,families);
  const expected=papers.filter(p=>p.categories.includes(layer));
  const actual=new Set(m.lanes.flatMap(l=>l.nodes.map(n=>n.paper.key)));
  assert.deepEqual([...actual].sort(),expected.map(p=>p.key).sort(),`${layer}: all section papers must be represented`);
  assert.equal(m.count,expected.length);
  for(const family of families) {
    const focused=model.focus(papers,layer,family);
    const related=expected.filter(p=>p.subfamilies.includes(family));
    assert.equal(focused.lanes.length,1,'Focused map must contain only the selected direction');
    assert.equal(focused.count,related.length);
    assert.deepEqual(focused.lanes[0].nodes.map(n=>n.paper.key).sort(),related.map(p=>p.key).sort());
    assert(!focused.lanes.some(l=>l.family==='context'),'Unrelated section context must stay out of focused views');
    const collection=model.collection(papers,layer,family);
    assert.equal(collection.buckets.reduce((n,b)=>n+b.count,0),related.length);
    const collected=[];
    for(let page=1;page<=collection.pages;page++) {
      const batch=model.collection(papers,layer,family,'all',page);
      assert(batch.items.length<=4);
      collected.push(...batch.items.map(p=>p.key));
    }
    assert.deepEqual(collected.sort(),related.map(p=>p.key).sort(),'Card pagination must expose every related paper exactly once');
    for(const bucket of collection.buckets) {
      const filtered=model.collection(papers,layer,family,String(bucket.year),999);
      assert.equal(filtered.count,bucket.count);
      assert.equal(filtered.page,filtered.pages,'Changing filters must clamp the current page');
      assert(filtered.items.every(p=>String(p.year)===String(bucket.year)));
    }
  }
  for(const lane of m.lanes) {
    assert.equal(new Set(lane.nodes.map(n=>n.paper.key)).size,lane.nodes.length,'No duplicates on one branch');
    for(const n of lane.nodes) {
      assert(n.x-11>=m.startX && n.x+11<m.width);
      assert(n.y-11>lane.y-lane.height/2 && n.y+11<lane.y+lane.height/2);
      if(lane.family!=='context')assert(n.paper.subfamilies.includes(lane.family),'Only manuscript-tagged memberships');
    }
    for(let a=0;a<lane.nodes.length;a++)for(let b=a+1;b<lane.nodes.length;b++) {
      assert(Math.hypot(lane.nodes[a].x-lane.nodes[b].x,lane.nodes[a].y-lane.nodes[b].y)>=22,'Paper hit targets must not overlap');
    }
  }
}
const fixtures=[{key:'a',title:'A',year:2024,categories:['X'],subfamilies:['X / One','X / Two']},{key:'b',title:'B',year:null,categories:['X'],subfamilies:[]}];
const m=model.build(fixtures,'X',['X / One','X / Two']);
assert.equal(m.count,2);assert.equal(m.marks,3);
assert.equal(m.lanes.at(-1).label,'Section context');assert.equal(m.years.at(-1),'Undated');
const undated=model.collection([{...fixtures[1],subfamilies:['X / One']}],'X','X / One','Undated');
assert.equal(undated.items.length,1);
const empty=model.collection([],'X','X / One');
assert.equal(empty.page,1);assert.equal(empty.pages,1);assert.equal(empty.items.length,0);
console.log('PASS: research-map coverage, classification, overlapping memberships, undated fallback, bounds and non-overlapping hit targets.');
