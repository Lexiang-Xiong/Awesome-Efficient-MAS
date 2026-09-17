'use strict';
// A taxonomy timeline, not a citation graph. Only manuscript tags and years are used.
const researchMapModel = {
  collection(papers, layer, family, year = 'all', page = 1, pageSize = 4) {
    const related = papers.filter(p => p.categories.includes(layer) && p.subfamilies.includes(family));
    const getYear = p => Number.isFinite(p.year) ? p.year : 'Undated';
    const years = [...new Set(related.map(getYear))].sort((a,b) => a==='Undated'?1:b==='Undated'?-1:a-b);
    const buckets = years.map(year => ({year, count:related.filter(p => getYear(p)===year).length}));
    const filtered = related.filter(p => year==='all' || String(getYear(p))===String(year))
      .sort((a,b) => (Number(b.year)||0)-(Number(a.year)||0) || a.title.localeCompare(b.title));
    const pages = Math.max(1,Math.ceil(filtered.length/pageSize));
    page = Math.max(1,Math.min(page,pages));
    return {layer,family,buckets,total:related.length,count:filtered.length,page,pages,
      items:filtered.slice((page-1)*pageSize,page*pageSize)};
  },
  focus(papers, layer, family) {
    return this.build(papers.filter(p => p.subfamilies.includes(family)), layer, [family]);
  },
  build(papers, layer, families) {
    const collection = papers.filter(p => p.categories.includes(layer));
    const lanes = families.map(family => ({family, label:family.split(' / ')[1], papers:collection.filter(p => p.subfamilies.includes(family))}));
    const unassigned = collection.filter(p => !families.some(f => p.subfamilies.includes(f)));
    if (unassigned.length) lanes.push({family:'context', label:'Section context', papers:unassigned});
    const years = [...new Set(collection.map(p => p.year).filter(Number.isFinite))].sort((a,b) => a-b);
    if (collection.some(p => !Number.isFinite(p.year))) years.push('Undated');
    // Each year is a bucket. Within-year offsets prevent overlap, not exact dates.
    const column = 146, startX = 310;
    let top = 74;
    lanes.forEach(lane => {
      const buckets = years.map(year => lane.papers.filter(p => (Number.isFinite(p.year)?p.year:'Undated')===year).sort((a,b) => a.title.localeCompare(b.title)));
      const rows = Math.max(1,...buckets.map(bucket => Math.ceil(bucket.length/5)));
      lane.height = Math.max(102, rows*22+66);
      lane.y = top + lane.height/2;
      lane.nodes = buckets.flatMap((bucket,yi) => bucket.map((paper,i) => ({paper, x:startX+yi*column+24+(i%5)*23, y:lane.y+(Math.floor(i/5)-(Math.ceil(bucket.length/5)-1)/2)*22})));
      top += lane.height;
    });
    return {layer,lanes,years,startX,column,width:startX+Math.max(1,years.length)*column+24,height:top+40,count:collection.length,marks:lanes.reduce((n,l) => n+l.nodes.length,0)};
  }
};
if(typeof module!=='undefined')module.exports=researchMapModel;
