// app.js - Target Builder functionality (vanilla JS)

const DATA_URL = './data/targets.json';
let templates = [];
let current = { template: null };

const el = id => document.getElementById(id);

function show(elm){ elm.classList.remove('hidden'); }
function hide(elm){ elm.classList.add('hidden'); }

function setStatus(message){ const s = el('status'); s.textContent = message; }

// Date helpers (UK format DD/MM/YYYY)
function formatUKDate(d){
  if(!d) return '';
  const dt = new Date(d);
  const day = String(dt.getDate()).padStart(2,'0');
  const month = String(dt.getMonth()+1).padStart(2,'0');
  const year = dt.getFullYear();
  return `${day}/${month}/${year}`;
}

function addDays(date, days){ const d = new Date(date); d.setDate(d.getDate()+days); return d; }

// Load data
async function loadData(){
  try{
    const res = await fetch(DATA_URL);
    if(!res.ok) throw new Error('Failed to load templates');
    const json = await res.json();
    templates = json.templates || [];
  }catch(err){
    console.error(err);
    // fallback: small inline dataset
    templates = [
      { id:'fallback-attendance', category:'Attendance', issue:'Overall attendance is below expectation', title:'Improve attendance', defaultAction:'attend all scheduled sessions', defaultMeasure:'on at least 90% of scheduled sessions', measureOptions:['on at least 90% of scheduled sessions','on at least 95% of scheduled sessions','on every scheduled session'], recommendedDuration:'three weeks', evidenceOptions:['Attendance register','Tutor observation'], reviewerOptions:['Personal tutor','Success Coach'], targetTemplate:'For the next {duration}, you will {action} {measure}. This will be checked using {evidence} and reviewed with {reviewer} on {reviewDate}.', supportActionTemplate:'{reviewer} to meet with the learner to discuss barriers and agree support.', reviewNoteTemplate:'Review attendance over the agreed period and record progress.' }
    ];
    setStatus('Using fallback templates — start a local server to load full data.');
  }
}

// Render category cards
function categories(){
  const grid = el('categoriesGrid');
  grid.innerHTML='';
  const cats = [...new Map(templates.map(t=>[t.category,t.category])).values()];
  cats.forEach(cat => {
    const card = document.createElement('button');
    card.className='card category';
    card.setAttribute('role','listitem');
    card.innerHTML = `<div class="icon" aria-hidden="true">${cat.charAt(0)}</div><div><h3>${cat}</h3><p>${categorySummary(cat)}</p></div>`;
    card.addEventListener('click',()=> openCategory(cat));
    card.addEventListener('keydown',e=>{ if(e.key==='Enter' || e.key===' ') { e.preventDefault(); openCategory(cat); }});
    grid.appendChild(card);
  });
}

function categorySummary(cat){
  const count = templates.filter(t=>t.category===cat).length;
  return `${count} common issue${count===1?'':'s'} — click to view`; }

function openCategory(cat){
  current.category = cat;
  el('categoryField').value = cat;
  el('issuesTitle').textContent = `Issues — ${cat}`;
  const list = el('issuesList'); list.innerHTML='';
  templates.filter(t=>t.category===cat).forEach(t=>{
    const row = document.createElement('button');
    row.className='card';
    row.innerHTML = `<h3>${t.issue}</h3><p class="muted">${t.title}</p>`;
    row.addEventListener('click',()=> selectIssue(t));
    list.appendChild(row);
  });
  hide(el('categoriesView')); show(el('issuesView'));
}

function selectIssue(t){
  current.template = t;
  el('issueField').value = t.issue;
  el('actionField').value = t.defaultAction || '';
  populateSelect(el('measureField'), t.measureOptions || [], t.defaultMeasure);
  populateSelect(el('evidenceField'), t.evidenceOptions || [], (t.evidenceOptions||[])[0]);
  populateSelect(el('reviewerField'), t.reviewerOptions || [], (t.reviewerOptions||[])[0]);
  // recommended duration
  selectRecommendedDuration(t.recommendedDuration);

  // show builder
  hide(el('issuesView')); show(el('builderView'));
}

function populateSelect(selectEl, options, selected){
  selectEl.innerHTML='';
  (options||[]).forEach(opt=>{
    const o = document.createElement('option'); o.value = opt; o.textContent = opt; if(opt===selected) o.selected=true; selectEl.appendChild(o);
  });
}

function selectRecommendedDuration(rec){
  const sel = el('durationField');
  if(!rec){ sel.value='2 weeks'; return; }
  // try to match
  const map = { 'one week':'1 week','two weeks':'2 weeks','three weeks':'3 weeks','four weeks':'4 weeks'};
  const key = rec.toLowerCase();
  if(key.includes('one')) sel.value='1 week';
  else if(key.includes('two')) sel.value='2 weeks';
  else if(key.includes('three')) sel.value='3 weeks';
  else if(key.includes('four')) sel.value='4 weeks';
  else sel.value='custom';
}

function openGuided(){
  current.template = null;
  el('categoryField').value = ''; el('issueField').value=''; el('actionField').value='';
  populateSelect(el('measureField'), ['Every scheduled session','Every college day','At least 90% attendance','At least 95% attendance','No late arrivals'], 'Every scheduled session');
  populateSelect(el('evidenceField'), ['Attendance register','Punctuality record','Canvas submission record','Tutor observation','ProMonitor record'], 'Tutor observation');
  populateSelect(el('reviewerField'), ['Personal tutor','Subject lecturer','Success Coach','Curriculum lead'], 'Personal tutor');
  hide(el('categoriesView')); hide(el('issuesView')); show(el('builderView'));
}

function onGenerate(){
  // basic validation
  const action = el('actionField').value.trim();
  const measure = el('customMeasure').value.trim() || el('measureField').value;
  const durationSel = el('durationField').value;
  let durationText = durationSel;
  let reviewDate = '';
  if(durationSel==='by date' || durationSel==='custom'){
    // if date selected use reviewDate input
    const dateVal = el('reviewDate').value;
    if(durationSel==='by date' && !dateVal){ alert('Please choose a review date'); return; }
    if(dateVal){ reviewDate = formatUKDate(dateVal); }
    durationText = durationSel==='by date' ? `by ${reviewDate}` : (el('customDuration').value || 'by the agreed review date');
  }else{
    durationText = durationSel.replace('week','teaching week'); // '2 weeks' -> '2 teaching weeks'
  }

  const evidence = el('customEvidence').value.trim() || el('evidenceField').value;
  const reviewer = el('customReviewer').value.trim() || el('reviewerField').value;

  // build templates
  let learner = '';
  let staff = '';
  let note = '';

  const t = current.template;
  if(t){
    const tpl = t.targetTemplate || '{duration}: {action} {measure}. Checked using {evidence}.';
    const ctx = { duration: durationText, action, measure, evidence, reviewer, reviewDate };
    learner = applyTemplate(tpl, ctx);
    staff = applyTemplate(t.supportActionTemplate || '{reviewer} to discuss and agree support.', ctx);
    note = applyTemplate(t.reviewNoteTemplate || 'Review progress and record outcomes.', ctx);
  }else{
    // generic
    learner = `For the next ${durationText}, you will ${action} ${measure}. This will be checked using ${evidence} and reviewed with ${reviewer}${reviewDate?` on ${reviewDate}`:''}.`;
    staff = `${reviewer} to provide appropriate support and review progress.`;
    note = `Review the learner's progress for the agreed period and record whether the target has been achieved.`;
  }

  el('learnerTarget').value = sentenceCase(learner);
  el('staffAction').value = sentenceCase(staff);
  el('reviewNote').value = sentenceCase(note);

  updateCharCount();
  updateSMARTChecks();
  show(el('preview'));
}

function applyTemplate(tpl, ctx){
  return tpl.replace(/\{(\w+)\}/g, (_,k)=> ctx[k] || '');
}

function sentenceCase(s){
  if(!s) return s;
  return s.replace(/(^\s*|\.[\s\n]*)[a-z]/g, c=>c.toUpperCase());
}

function updateCharCount(){ el('charCount').textContent = String(el('learnerTarget').value.length); }

function updateSMARTChecks(){
  const learner = el('learnerTarget').value;
  // simple rules
  const specific = Boolean(el('actionField').value.trim());
  const measurable = Boolean(el('customMeasure').value.trim() || el('measureField').value);
  const achievable = !/100%|100 percent|always every/.test(learner.toLowerCase());
  const relevant = Boolean(el('categoryField').value || el('issueField').value);
  const timebound = Boolean(el('durationField').value || el('reviewDate').value);

  setStatusItem('qSpecific', specific);
  setStatusItem('qMeasurable', measurable);
  setStatusItem('qAchievable', achievable);
  setStatusItem('qRelevant', relevant);
  setStatusItem('qTimebound', timebound);
}

function setStatusItem(id, ok){
  const elItem = el(id); const span = elItem.querySelector('.status');
  span.textContent = ok ? 'Yes' : 'No'; span.style.color = ok ? 'green' : 'red';
}

// Copy helpers
async function copyText(text){
  try{ await navigator.clipboard.writeText(text); return true;}catch(e){ console.warn('clipboard failed',e); return false; }
}

function copyWithFeedback(button, text, label){
  copyText(text).then(ok=>{
    if(ok){ const original = button.textContent; button.textContent='Copied'; setStatus(label+' copied'); setTimeout(()=>button.textContent=original,1500); }
    else{ alert('Copy failed. You can select the text and use Ctrl+C.'); }
  });
}

// Variants
function applyVariant(kind){
  const base = current.template; // we can alter tone
  const learner = el('learnerTarget').value;
  if(!learner) return;
  if(kind==='supportive'){
    el('learnerTarget').value = learner.replace(/^For the next/, 'To help you re-establish a consistent routine, for the next');
  }else if(kind==='firmer'){
    el('learnerTarget').value = learner.replace(/^For the next/, 'For the next').replace('you will', 'you are expected to');
  }else if(kind==='short'){
    // attempt to produce a short version ~40-70 words by trimming clauses
    const short = learner.split('.').slice(0,2).join('.');
    el('learnerTarget').value = short;
  }else if(kind==='detailed'){
    el('learnerTarget').value = learner + ' You will be offered additional support where required and staff will record any agreed adjustments.';
  }else if(kind==='reset'){
    // regenerate
    onGenerate(); return;
  }
  updateCharCount(); updateSMARTChecks();
}

// Search
function doSearch(q){
  q = q.trim().toLowerCase();
  const list = el('searchList'); list.innerHTML='';
  if(!q){ hide(el('searchResults')); show(el('categoriesView')); return; }
  const words = q.split(/\s+/).filter(Boolean);
  const scored = templates.map(t=>{
    let score = 0;
    const hay = [t.category, t.issue, t.title, (t.aliases||[]).join(' ') , (t.tags||[]).join(' ')].join(' ').toLowerCase();
    words.forEach(w=>{ if(hay.includes(w)) score += w.length; });
    // prefer same category
    if(t.category.toLowerCase().includes(words[0])) score += 1;
    return {t,score};
  }).filter(x=>x.score>0).sort((a,b)=>b.score-a.score);

  if(scored.length===0){ show(el('searchResults')); show(el('noResults')); hide(el('categoriesView')); hide(el('issuesView')); hide(el('builderView')); return; }

  scored.forEach(s=>{
    const b = document.createElement('button'); b.className='card'; b.innerHTML = `<strong>${s.t.issue}</strong><div class="muted">${s.t.category} — ${s.t.title}</div>`;
    b.addEventListener('click',()=>{ current.template = s.t; // open builder with template
      el('categoryField').value = s.t.category; el('issueField').value = s.t.issue; el('actionField').value = s.t.defaultAction || '';
      populateSelect(el('measureField'), s.t.measureOptions || [], s.t.defaultMeasure);
      populateSelect(el('evidenceField'), s.t.evidenceOptions || [], (s.t.evidenceOptions||[])[0]);
      populateSelect(el('reviewerField'), s.t.reviewerOptions || [], (s.t.reviewerOptions||[])[0]);
      hide(el('searchResults')); show(el('builderView'));
    });
    list.appendChild(b);
  });

  show(el('searchResults')); hide(el('categoriesView')); hide(el('issuesView')); hide(el('builderView'));
}

// Personal data warning
function checkPersonalData(text){
  const email = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(text);
  const phone = /\b(07\d{9}|\+44\d{9,12}|\d{10,11})\b/.test(text);
  const idlike = /\b\d{6,12}\b/.test(text);
  return email || phone || idlike;
}

// Setup event listeners
function bind(){
  el('guidedBtn').addEventListener('click',openGuided);
  el('searchBtn').addEventListener('click',()=>doSearch(el('search').value));
  el('search').addEventListener('keydown',(e)=>{ if(e.key==='Enter'){ e.preventDefault(); doSearch(el('search').value); }});
  el('backToCategories').addEventListener('click',()=>{ hide(el('issuesView')); show(el('categoriesView')); });
  el('backToIssues').addEventListener('click',()=>{ hide(el('builderView')); show(el('issuesView')); });
  el('backFromSearch').addEventListener('click',()=>{ hide(el('searchResults')); show(el('categoriesView')); });
  el('generateBtn').addEventListener('click',onGenerate);
  el('clearBtn').addEventListener('click',()=>{ if(confirm('Clear the form?')) document.getElementById('builderForm').reset(); });

  el('copyLearner').addEventListener('click',()=> copyWithFeedback(el('copyLearner'), el('learnerTarget').value, 'Learner target'));
  el('copyStaff').addEventListener('click',()=> copyWithFeedback(el('copyStaff'), el('staffAction').value, 'Staff support action'));
  el('copyReview').addEventListener('click',()=> copyWithFeedback(el('copyReview'), el('reviewNote').value, 'Review note'));
  el('copyAll').addEventListener('click',()=> copyWithFeedback(el('copyAll'), `${el('learnerTarget').value}\n\nStaff action:\n${el('staffAction').value}\n\nReview note:\n${el('reviewNote').value}`, 'All content'));
  el('printBtn').addEventListener('click',()=> window.print());

  document.querySelectorAll('#variantControls button').forEach(b=> b.addEventListener('click',()=> applyVariant(b.dataset.variant)));

  el('learnerTarget').addEventListener('input', ()=>{ updateCharCount(); updateSMARTChecks(); if(checkPersonalData(el('learnerTarget').value)){ alert('Warning: remove personal data such as names, emails or phone numbers before saving or copying.'); }});
  el('actionField').addEventListener('input', ()=> updateSMARTChecks());
}

// Init
(async function init(){
  await loadData();
  categories();
  bind();
})();
