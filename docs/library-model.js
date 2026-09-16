'use strict';
// Shared by the browser and the regression checks.
const libraryModel = {
  browse(state, category) {
    return {...state, category, query:'', year:'all', representative:false, page:1};
  },
  select(papers, state) {
    const query=state.query.trim().toLowerCase();
    const matches=papers.filter(p=>
      (state.category==='All papers'||p.categories.includes(state.category))&&
      (state.year==='all'||String(p.year)===state.year)&&
      (!state.representative||p.evidence)&&
      (!query||`${p.title} ${p.authors} ${p.method||''} ${p.key} ${p.subfamilies.join(' ')}`.toLowerCase().includes(query)));
    matches.sort((a,b)=>state.sort==='title'?a.title.localeCompare(b.title):
      (state.sort==='year-asc'?a.year-b.year:b.year-a.year)||a.title.localeCompare(b.title));
    const size=state.pageSize==='all'?Math.max(1,matches.length):Number(state.pageSize);
    const pages=Math.max(1,Math.ceil(matches.length/size));
    const page=Math.max(1,Math.min(state.page,pages));
    const start=(page-1)*size;
    return {matches,items:matches.slice(start,start+size),page,pages,from:matches.length?start+1:0,to:Math.min(start+size,matches.length)};
  }
};
if(typeof module!=='undefined')module.exports=libraryModel;
