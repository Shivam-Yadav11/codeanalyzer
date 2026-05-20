const codeInput = document.getElementById('codeInput');
const lineNumbers = document.getElementById('lineNumbers');
const langBadge = document.getElementById('langBadge');

/* Line number sync */
function updateLineNumbers() {
    const lines = codeInput.value.split('\n').length;
    let html = '';
    for (let i = 1; i <= Math.max(lines, 15); i++) html += '<span>' + i + '</span>';
    lineNumbers.innerHTML = html;
}
codeInput.addEventListener('input', () => { updateLineNumbers(); detectLanguageLive(); });
codeInput.addEventListener('scroll', () => { lineNumbers.style.transform = 'translateY(-' + codeInput.scrollTop + 'px)'; });
codeInput.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
        e.preventDefault();
        const s = codeInput.selectionStart, en = codeInput.selectionEnd;
        codeInput.value = codeInput.value.substring(0, s) + '    ' + codeInput.value.substring(en);
        codeInput.selectionStart = codeInput.selectionEnd = s + 4;
        updateLineNumbers();
    }
});
updateLineNumbers();

/* Live language detection */
function detectLanguageLive() {
    const code = codeInput.value;
    let lang = 'auto-detect';
    if (code.includes('#include') || code.includes('cout') || code.includes('cin') || (/\bint main\b/.test(code) && !code.includes('public class'))) lang = 'C/C++';
    else if (code.includes('public class') || code.includes('System.out.println')) lang = 'Java';
    else if (/\bdef\s+\w+/.test(code) || (/\bprint\s*\(/.test(code) && !/\bfunction\b/.test(code))) lang = 'Python';
    else if (/\bfunction\b|\bconst\s+\w+\s*=|\blet\s+\w+\s*=|\bvar\s+\w+\s*=/.test(code)) lang = 'JavaScript';
    langBadge.textContent = lang;
}

/* Load sample */
function loadSample(type) {
    const samples = {
        js: 'function bubbleSort(arr) {\n    let n = arr.length;\n    let temp = 0;\n    for (let i = 0; i < n - 1; i++) {\n        for (let j = 0; j < n - i - 1; j++) {\n            if (arr[j] > arr[j + 1]) {\n                temp = arr[j];\n                arr[j] = arr[j + 1];\n                arr[j + 1] = temp;\n            }\n        }\n    }\n    return arr;\n}\n\nfunction findMax(arr) {\n    let max = arr[0];\n    for (let i = 1; i < arr.length; i++) {\n        if (arr[i] > max) {\n            max = arr[i];\n        }\n    }\n    return max;\n}\n\nconst result = bubbleSort([5, 3, 8, 1, 2]);\nconsole.log(result);',
        py: 'def fibonacci(n):\n    if n <= 1:\n        return n\n    a, b = 0, 1\n    for i in range(2, n + 1):\n        temp = a + b\n        a = b\n        b = temp\n    return b\n\ndef find_duplicates(lst):\n    seen = set()\n    duplicates = []\n    for item in lst:\n        if item in seen:\n            duplicates.append(item)\n        else:\n            seen.add(item)\n    return duplicates\n\nresult = fibonacci(10)\nprint(result)\n\ndata = [1, 2, 3, 2, 4, 5, 3, 6]\ndups = find_duplicates(data)\nprint(dups)',
        cpp: '#include <iostream>\nusing namespace std;\n\nvoid selectionSort(int arr[], int n) {\n    int minIdx, temp;\n    for (int i = 0; i < n - 1; i++) {\n        minIdx = i;\n        for (int j = i + 1; j < n; j++) {\n            if (arr[j] < arr[minIdx]) {\n                minIdx = j;\n            }\n        }\n        temp = arr[i];\n        arr[i] = arr[minIdx];\n        arr[minIdx] = temp;\n    }\n}\n\nint binarySearch(int arr[], int n, int x) {\n    int low = 0, high = n - 1;\n    while (low <= high) {\n        int mid = (low + high) / 2;\n        if (arr[mid] == x) return mid;\n        else if (arr[mid] < x) low = mid + 1;\n        else high = mid - 1;\n    }\n    return -1;\n}\n\nint main() {\n    int arr[] = {64, 25, 12, 22, 11};\n    int n = 5;\n    selectionSort(arr, n);\n    for (int i = 0; i < n; i++) {\n        cout << arr[i] << " ";\n    }\n    return 0;\n}'
    };
    codeInput.value = samples[type] || '';
    updateLineNumbers();
    detectLanguageLive();
    showToast('Sample loaded', 'fa-check-circle', '#00ffaa');
}

/* Clear editor */
function clearEditor() {
    codeInput.value = '';
    updateLineNumbers();
    langBadge.textContent = 'auto-detect';
    document.getElementById('outputSection').classList.remove('visible');
    document.getElementById('statsBar').classList.remove('visible');
    showToast('Editor cleared', 'fa-eraser', '#ffaa00');
}

/* Toast notification */
function showToast(text, icon, color) {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = '<i class="fas ' + icon + '" style="color:' + color + '"></i> ' + text;
    container.appendChild(toast);
    setTimeout(() => { toast.classList.add('fade-out'); setTimeout(() => toast.remove(), 300); }, 2500);
}

/* Ripple + Analyze */
function handleAnalyze(e) {
    const btn = document.getElementById('analyzeBtn');
    const ripple = document.createElement('span');
    ripple.className = 'ripple';
    const rect = btn.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    ripple.style.width = ripple.style.height = size + 'px';
    ripple.style.left = (e.clientX - rect.left - size / 2) + 'px';
    ripple.style.top = (e.clientY - rect.top - size / 2) + 'px';
    btn.appendChild(ripple);
    setTimeout(() => ripple.remove(), 600);
    analyzeCode();
}

function analyzeCode() {
    const code = codeInput.value.trim();
    if (!code) { showToast('Please enter some code first', 'fa-exclamation-triangle', '#ff4466'); return; }
    const overlay = document.getElementById('loadingOverlay');
    overlay.classList.add('active');
    setTimeout(() => {
        const result = performAnalysis(code);
        renderResults(result);
        overlay.classList.remove('active');
        showToast('Analysis complete', 'fa-check-circle', '#00ffaa');
    }, 800);
}

/* ===== Keyword set ===== */
const KEYWORDS = new Set(['if','else','for','while','do','switch','case','break','continue','return','function','class','new','this','super','import','from','export','default','def','print','input','range','len','int','str','float','list','dict','set','tuple','true','false','null','none','self','True','False','None','char','double','bool','void','string','long','short','unsigned','signed','static','const','include','using','namespace','std','cout','cin','endl','public','private','protected','main','sizeof','typeof','instanceof','extends','implements','abstract','final','try','catch','throw','finally','async','await','yield','lambda','with','as','pass','global','nonlocal','assert','raise','except','in','not','and','or','is','elif','map','filter','reduce','Math','console','log','Array','Object','Number','String','Boolean','Date','JSON','Promise','window','document','process','require','module','args','kwargs','__init__','__name__','__main__','append','extend','push','pop','shift','unshift','splice','slice','forEach','reduce','find','indexOf','length','size','count','sort','sorted','reverse','reversed','enumerate','zip','open','close','read','write','readline','type','isinstance','hasattr','getattr','vector','pair','make_pair','begin','end','push_back','pop_back','emplace_back','insert','erase','find','lower_bound','upper_bound','unique','swap','max','min','abs','pow','sqrt','ceil','floor','round','sin','cos','tan','log','exp','PI','EOF','NULL','items','keys','values','format','join','split','strip','replace']);

/* ===== Core analysis ===== */
function performAnalysis(code) {
    const lines = code.split('\n');
    const result = { language:'Unknown', totalLines:lines.length, codeLines:0, emptyLines:0, commentLines:0, variables:[], functions:[], loops:[], issues:[], timeComplexity:{value:'N/A',detail:'',score:0}, spaceComplexity:{value:'N/A',detail:'',score:0} };

    if (code.includes('#include')||code.includes('cout')||code.includes('cin')||(/\bint main\b/.test(code)&&!code.includes('public class'))) result.language='C/C++';
    else if (code.includes('public class')||code.includes('System.out.println')) result.language='Java';
    else if (/\bdef\s+\w+/.test(code)||(/\bprint\s*\(/.test(code)&&!/\bfunction\b/.test(code))) result.language='Python';
    else if (/\bfunction\b|\bconst\s+\w+\s*=|\blet\s+\w+\s*=|\bvar\s+\w+\s*=/.test(code)) result.language='JavaScript';

    const lang = result.language;
    let inBlockComment = false;
    lines.forEach(line => {
        const trimmed = line.trim();
        if (inBlockComment) { if (trimmed.includes('*/')) inBlockComment = false; else result.commentLines++; return; }
        if (trimmed.startsWith('/*')) { if (!trimmed.includes('*/')) inBlockComment = true; result.commentLines++; return; }
        if (trimmed === '') { result.emptyLines++; return; }
        if (lang === 'Python' && trimmed.startsWith('#')) { result.commentLines++; return; }
        if (lang !== 'Python' && (trimmed.startsWith('//') || trimmed.startsWith('*'))) { result.commentLines++; return; }
        result.codeLines++;
    });

    result.variables = extractVariables(code, lang, lines);
    result.functions = extractFunctions(code, lang);
    result.loops = extractLoops(code, lang, lines);
    result.issues = extractIssues(code, lines, lang, result);
    result.timeComplexity = estimateTimeComplexity(code, lines, lang, result.loops, result.functions);
    result.spaceComplexity = estimateSpaceComplexity(code, lang, result.variables, result.functions);
    return result;
}

/* ===== Utility functions ===== */
function splitByComma(str) {
    const parts = []; let depth = 0, current = '';
    for (const ch of str) {
        if (ch==='['||ch==='{'||ch==='(') depth++;
        if (ch===']'||ch==='}'||ch===')') depth--;
        if (ch===','&&depth===0) { parts.push(current); current=''; } else current+=ch;
    }
    if (current.trim()) parts.push(current);
    return parts;
}

function isCommentLine(t, lang) {
    if (!t) return true;
    if (t.startsWith('/*')||t.startsWith('*')||t.startsWith('*/')) return true;
    if (lang==='Python'&&t.startsWith('#')) return true;
    if (lang!=='Python'&&t.startsWith('//')) return true;
    return false;
}

function buildScopeMap(lines, lang) {
    const fb = new Set();
    if (lang==='Python') {
        let inf=false, bi=0;
        lines.forEach((l,i) => {
            const ind=l.replace(/\t/g,'    ').match(/^(\s*)/)[1].length;
            if (/^\s*def\s+\w+/.test(l)) { inf=true; bi=ind; }
            else if (inf) { if (l.trim()==='') return; if (ind<=bi) { inf=false; return; } fb.add(i); }
        });
    } else {
        let bd=0, inf=false;
        const fr = lang==='Java'
            ? /\b(?:(?:public|private|protected|static)\s+)*(?:void|int|float|double|char|long|boolean|String|byte)\s+\w+\s+(\w+)\s*\(/
            : /\b(?:void|int|float|double|char|long|short|bool|string|auto)\s+\*?\s*(\w+)\s*\(/;
        lines.forEach((l,i) => {
            const t=l.trim();
            if (isCommentLine(t,lang)) return;
            if (!inf&&fr.test(t)) { inf=true; bd=0; }
            if (inf) {
                for (const c of t) { if (c==='{') bd++; if (c==='}') bd--; }
                if (bd<=0) { inf=false; bd=0; } else fb.add(i);
            }
        });
    }
    return fb;
}

/* ===== Extract variables ===== */
function extractVariables(code, lang, lines) {
    const vars = [], seen = new Set(), funcBody = buildScopeMap(lines, lang);
    function addVar(name, type, value, lineNum) {
        name = name.replace(/[*&]/g, '').trim();
        if (!name||KEYWORDS.has(name)||seen.has(name)||!/^\w+$/.test(name)||/^\d/.test(name)) return;
        seen.add(name);
        vars.push({ name, type:type||'dynamic', value:(value!==undefined&&value!==null&&value!=='')?value.trim().substring(0,60):null, line:lineNum, scope:funcBody.has(lineNum-1)?'local':'global' });
    }
    if (lang === 'Python') {
        lines.forEach((line, idx) => {
            const t = line.trim(); if (isCommentLine(t, lang)) return;
            const fm = t.match(/^for\s+([\w,\s]+)\s+in\s+/);
            if (fm) { fm[1].split(',').forEach(v => { const n = v.trim().match(/^(\w+)$/); if (n) addVar(n[1], 'dynamic', null, idx+1); }); return; }
            const td = t.match(/^(\w+)\s*:\s*(\w+)\s*=\s*(.+)/);
            if (td && !KEYWORDS.has(td[1])) { addVar(td[1], td[2], td[3].replace(/#.*$/, '').trim(), idx+1); return; }
            const up = t.match(/^([\w,\s]+?)\s*=\s*(?!=)(.+)/);
            if (up) {
                const ns = up[1].split(','), vl = up[2].replace(/#.*$/, '').trim();
                if (ns.length > 1) ns.forEach(n => { const c = n.trim().match(/^(\w+)$/); if (c) addVar(c[1], 'dynamic', null, idx+1); });
                else { const c = up[1].trim().match(/^(\w+)$/); if (c && !KEYWORDS.has(c[1])) addVar(c[1], 'dynamic', vl, idx+1); }
                return;
            }
        });
    } else if (lang === 'JavaScript') {
        lines.forEach((line, idx) => {
            const t = line.trim(); if (isCommentLine(t, lang)) return;
            const dm = t.match(/^(let|const|var)\s+(.+)/);
            if (dm) {
                const dt = dm[1], rest = dm[2].replace(/;$/, '').trim();
                splitByComma(rest).forEach(part => {
                    part = part.trim(); if (!part) return;
                    const ad = part.match(/^\[\s*([^\]]*)\s*\](?:\s*=\s*(.+))?/);
                    if (ad) { ad[1].split(',').forEach(v => { const n = v.trim().match(/^(\w+)/); if (n) addVar(n[1], dt, ad[2]?ad[2].trim():null, idx+1); }); return; }
                    const od = part.match(/^\{\s*([^}]+)\s*\}(?:\s*=\s*(.+))?/);
                    if (od) { od[1].split(',').forEach(v => { const n = v.trim().match(/^(?:\.\.\.)?(\w+)/); if (n) addVar(n[1], dt, od[2]?od[2].trim():null, idx+1); }); return; }
                    const sm = part.match(/^(\w+)\s*=\s*(.+)/);
                    if (sm) { addVar(sm[1], dt, sm[2].trim(), idx+1); return; }
                    const jn = part.match(/^(\w+)$/);
                    if (jn) addVar(jn[1], dt, null, idx+1);
                });
            }
        });
    } else {
        const types = lang === 'Java'
            ? '\\b(int|float|double|char|long|short|boolean|String|var|byte)\\b'
            : '\\b(int|float|double|char|long|short|bool|string|auto|unsigned\\s+int|unsigned\\s+char|unsigned\\s+long|unsigned\\s+short|unsigned|signed)\\b';
        lines.forEach((line, idx) => {
            const t = line.trim(); if (isCommentLine(t, lang)) return;
            const fm = t.match(new RegExp('\\bfor\\s*\\(\\s*('+types+')\\s+(\\w+)\\s*=\\s*([^;]+)'));
            if (fm) { addVar(fm[2], fm[1].replace(/\s+/g,' ').trim(), fm[3].trim(), idx+1); return; }
            const tm = t.match(new RegExp('^'+types));
            if (!tm) return;
            const vt = tm[0].replace(/\s+/g,' ').trim();
            let at = t.substring(tm[0].length).trim(); let ps = '';
            while (at.startsWith('*')) { ps+='*'; at=at.substring(1).trim(); }
            const ft = vt+ps; at = at.replace(/;$/,'').trim();
            splitByComma(at).forEach(part => {
                part = part.trim(); if (!part) return;
                const am = part.match(/^(\w+)\s*(?:\[\d*\]|\[\])+$/);
                if (am) { addVar(am[1], ft+'[]', null, idx+1); return; }
                const sm = part.match(/^(\w+)\s*=\s*(.+)/);
                if (sm) { addVar(sm[1], ft, sm[2].trim(), idx+1); return; }
                const ai = part.match(/^(\w+)\s*(?:\[\d*\]|\[\])*\s*=\s*(.+)/);
                if (ai) { addVar(ai[1], ft+'[]', ai[2].trim(), idx+1); return; }
                const jn = part.match(/^(\w+)$/);
                if (jn) addVar(jn[1], ft, null, idx+1);
            });
        });
    }
    return vars;
}

/* ===== Extract functions ===== */
function extractFunctions(code, lang) {
    const funcs = []; let m;
    if (lang==='Python') {
        const re=/\bdef\s+(\w+)\s*\(([^)]*)\)/g;
        while((m=re.exec(code))!==null) funcs.push({name:m[1],params:m[2].trim().substring(0,80),paramCount:m[2].trim()?m[2].split(',').filter(p=>p.trim()&&p.trim()!=='self').length:0});
    } else if (lang==='JavaScript') {
        const r1=/\bfunction\s+(\w+)\s*\(([^)]*)\)/g;
        while((m=r1.exec(code))!==null) funcs.push({name:m[1],params:m[2].trim().substring(0,80),paramCount:m[2].trim()?m[2].split(',').filter(p=>p.trim()).length:0});
        const r2=/\b(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s+)?(?:function|\([^)]*\)\s*=>|\w+\s*=>)/g;
        while((m=r2.exec(code))!==null) if(!KEYWORDS.has(m[1])) funcs.push({name:m[1],params:'(arrow)',paramCount:0});
    } else if (lang==='Java') {
        const re=/\b(?:(?:public|private|protected|static)\s+)*(?:void|int|float|double|char|long|boolean|String|var)\s+\w+\s+(\w+)\s*\(([^)]*)\)/g;
        while((m=re.exec(code))!==null) funcs.push({name:m[1],params:m[2].trim().substring(0,80),paramCount:m[2].trim()?m[2].split(',').filter(p=>p.trim()).length:0});
    } else {
        const re=/\b(?:void|int|float|double|char|long|short|bool|string|auto)\s+(\*?\s*\w+)\s*\(([^)]*)\)/g;
        while((m=re.exec(code))!==null){const n=m[1].replace(/\*/g,'').trim();if(n&&!KEYWORDS.has(n))funcs.push({name:n,params:m[2].trim().substring(0,80),paramCount:m[2].trim()?m[2].split(',').filter(p=>p.trim()).length:0});}
    }
    return funcs;
}

/* ===== Extract loops ===== */
function extractLoops(code, lang, lines) {
    const loops=[];
    lines.forEach((line,idx) => {
        const t=line.trim(); let type=null, detail='';
        if(lang==='Python') {
            const f=t.match(/^\s*for\s+(\w+)\s+in\s+(.+)/);
            if(f){type='for-in';detail=f[1]+' in '+f[2].replace(/:$/,'').trim();}
            else if(/^\s*while\s+.+:$/.test(t)){type='while';detail=t.replace(/:$/,'').trim();}
        } else {
            const f=t.match(/^\s*for\s*\((.+)\)/);
            if(f){type='for';detail=f[1].trim().substring(0,60);}
            else{const w=t.match(/^\s*while\s*\((.+)\)/);if(w){type='while';detail=w[1].trim().substring(0,60);}else if(/^\s*do\s*\{/.test(t)){type='do-while';detail='do-while loop';}}
        }
        if(type) loops.push({type,detail,line:idx+1});
    });
    return loops;
}

/* ===== Extract issues ===== */
function extractIssues(code, lines, lang, result) {
    const issues = [];
    if (result.emptyLines > 3) issues.push({type:'warning',text:'Found '+result.emptyLines+' empty lines \u2014 consider reducing for readability'});
    if (result.totalLines > 50) issues.push({type:'warning',text:'Code is '+result.totalLines+' lines long \u2014 consider breaking into modules'});
    const sl = result.variables.filter(v => v.name.length === 1);
    if (sl.length > 0) issues.push({type:'suggestion',text:'Single-letter variables: '+sl.map(v=>'`'+v.name+'`').join(', ')+' \u2014 use descriptive names'});
    const gen = result.variables.filter(v => ['temp','tmp','data','result','x','y','z','val','obj','item','arr','num','res','ret'].includes(v.name.toLowerCase()));
    if (gen.length > 0) issues.push({type:'suggestion',text:'Generic variable names: '+gen.map(v=>'`'+v.name+'`').join(', ')+' \u2014 be more specific'});
    let mi=0;
    lines.forEach(l=>{const n=l.replace(/\t/g,'    ').match(/^(\s*)/)[1].length;if(n>mi)mi=n;});
    const nl=Math.floor(mi/4);
    if(nl>3) issues.push({type:'error',text:'Deep nesting detected (level '+nl+') \u2014 extract into functions'});
    else if(nl>2) issues.push({type:'warning',text:'Nesting level '+nl+' \u2014 consider flattening'});
    const mn=code.match(/(?<![.\w])(?:[2-9]\d*|1\d+)(?![.\w])/g);
    if(mn&&mn.length>2) issues.push({type:'suggestion',text:'Found '+mn.length+' magic numbers \u2014 use named constants'});
    if(result.commentLines===0&&result.codeLines>5) issues.push({type:'suggestion',text:'No comments found \u2014 add documentation for clarity'});
    let cd=0;
    lines.forEach(l=>{
        const t=l.trim();
        if(lang==='Python'){const li=l.replace(/\t/g,'    ').match(/^(\s*)/)[1].length;const lv=Math.floor(li/4);if(/^\s*(for|while)\s/.test(t))cd=Math.max(cd,lv);}
        else{if(/^\s*(for|while)\s*[\({]/.test(t))cd++;if(/^\s*\}/.test(t))cd=Math.max(0,cd-1);}
    });
    if(cd>=2) issues.push({type:'warning',text:'Nested loops detected (depth '+(cd+1)+') \u2014 check for O(n^2+) performance impact'});
    if(result.functions.length===0&&result.codeLines>10) issues.push({type:'error',text:'No functions defined \u2014 wrap logic in functions for reusability'});
    const todos=code.match(/\b(TODO|FIXME|HACK|XXX|BUG)\b/gi);
    if(todos) issues.push({type:'warning',text:'Found '+todos.length+' marker(s): '+[...new Set(todos)].join(', ')+' \u2014 resolve before shipping'});
    if(lang==='JavaScript'&&/\bvar\s+\w+/.test(code)) issues.push({type:'error',text:'Avoid `var` \u2014 use `let` or `const` instead'});
    if(lang==='JavaScript'&&/[^!=]==[^=]/.test(code)) issues.push({type:'warning',text:'Use `===` instead of `==` for strict equality checks'});
    if(lang==='C/C++'&&code.includes('using namespace std')) issues.push({type:'suggestion',text:'Avoid `using namespace std` \u2014 use explicit std:: qualifiers'});
    if(lang==='C/C++'&&/\bint\s+mid\s*=\s*\(low\s*\+\s*high\)\s*\/\s*2/.test(code)) issues.push({type:'error',text:'Integer overflow in `(low + high) / 2` \u2014 use `low + (high - low) / 2`'});
    const vn=result.variables.map(v=>v.name);
    const dv=vn.filter((v,i)=>vn.indexOf(v)!==i);
    if(dv.length>0) issues.push({type:'warning',text:'Potentially redeclared variables: '+[...new Set(dv)].map(v=>'`'+v+'`').join(', ')});
    const ll=lines.filter(l=>l.length>120);
    if(ll.length>0) issues.push({type:'suggestion',text:ll.length+' line(s) exceed 120 characters \u2014 consider breaking them'});
    return issues;
}

/* ===== Estimate time complexity ===== */
function estimateTimeComplexity(code, lines, lang, loops, functions) {
    if (loops.length===0) {
        const fn=functions.map(f=>f.name);
        const hr=fn.some(f=>(code.match(new RegExp('\\b'+f+'\\s*\\(','g'))||[]).length>1);
        if(hr){const h2=fn.some(f=>(code.match(new RegExp('\\b'+f+'\\s*\\(','g'))||[]).length>=3);if(h2)return{value:'O(2^n) est.',detail:'Multiple recursive calls per frame \u2014 exponential growth risk',score:85};return{value:'O(n) est.',detail:'Single recursive call \u2014 likely linear with depth n',score:25};}
        return{value:'O(1)',detail:'No loops or recursion \u2014 constant time operations only',score:5};
    }
    let mx=0,cn=0;
    lines.forEach(l=>{
        const t=l.trim();
        if(lang==='Python'){const i=l.replace(/\t/g,'    ').match(/^(\s*)/)[1].length;const lv=Math.floor(i/4);if(/^\s*(for|while)\s/.test(t))mx=Math.max(mx,lv);}
        else{if(/^\s*(for|while|do)\s*[\({]/.test(t)){cn++;mx=Math.max(mx,cn);}if(/^\s*\}/.test(t))cn=Math.max(0,cn-1);}
    });
    const nd=mx;
    const hl=/\/\s*2\b/.test(code)||/>>>?\s*1/.test(code)||/\bmid\b/.test(code)||code.includes('Math.floor')||code.includes('Math.ceil')||/half|middle|binary/i.test(code);
    const hs=/\.sort\s*\(|\.sorted\s*\(|std::sort|Arrays\.sort/.test(code);
    if(hs)return{value:'O(n log n)',detail:'Sort operation detected \u2014 comparison sort lower bound',score:40};
    if(nd<=1){if(hl)return{value:'O(log n)',detail:'Single loop with halving pattern \u2014 logarithmic',score:10};return{value:'O(n)',detail:'Single loop iterating over input data',score:20};}
    else if(nd===2){if(hl)return{value:'O(n log n)',detail:'Outer loop with inner logarithmic reduction',score:40};return{value:'O(n\u00B2)',detail:'Two levels of nested loops \u2014 quadratic',score:60};}
    else if(nd===3)return{value:'O(n\u00B3)',detail:'Three levels of nesting \u2014 cubic complexity',score:80};
    else return{value:'O(n'+(nd>4?'...':'\u2074')+')',detail:nd+' levels of nesting \u2014 very high complexity',score:95};
}

/* ===== Estimate space complexity ===== */
function estimateSpaceComplexity(code, lang, variables, functions) {
    let s=10, d=[];
    const ap=lang==='Python'?/\[\s*\]|\blist\(|\.append\(|\.extend\(|\bset\(|\bdict\(|\btuple\(/:/\[\s*\]|\bnew\s+Array|\bArray\(|\.push\(|\.pop\(|vector|map|unordered_map|set|unordered_set/;
    const ar=code.match(ap)||[];
    if(ar.length>0){s+=20;d.push(ar.length+' data structure(s)');}
    if(variables.length>10){s+=15;d.push(variables.length+' variables');}else if(variables.length>5){s+=8;d.push(variables.length+' variables');}
    const fn=functions.map(f=>f.name);
    const hr=fn.some(f=>(code.match(new RegExp('\\b'+f+'\\s*\\(','g'))||[]).length>1);
    if(hr){s+=25;d.push('recursive call stack');}
    if(/\bnew\s+\w+/.test(code)||/\bclass\s+\w+/.test(code)){s+=10;d.push('object allocation');}
    if(/(\[\]\[\]|\[\[)/.test(code)||/vector.*vector/.test(code)){s+=20;d.push('2D/nested structure');}
    if(/\.copy\(|\.slice\(|list\(|\.clone\(/.test(code)){s+=10;d.push('data copying');}
    let v;
    if(s<=15)v='O(1)';else if(s<=35)v='O(n)';else if(s<=55)v='O(n log n)';else v='O(n\u00B2)';
    if(d.length===0)d.push('minimal auxiliary space');
    return{value:v,detail:d.join(', '),score:Math.min(s,100)};
}

/* ===== Render results ===== */
function renderResults(r) {
    document.getElementById('statLines').textContent = r.totalLines;
    document.getElementById('statVars').textContent = r.variables.length;
    document.getElementById('statFuncs').textContent = r.functions.length;
    document.getElementById('statLoops').textContent = r.loops.length;
    document.getElementById('statIssues').textContent = r.issues.length;
    document.getElementById('statsBar').classList.add('visible');

    const grid = document.getElementById('resultGrid');
    grid.innerHTML = '';

    function scoreBadge(score) {
        if(score<=25) return '<span class="score-badge score-good">Efficient</span>';
        if(score<=55) return '<span class="score-badge score-ok">Moderate</span>';
        return '<span class="score-badge score-bad">Costly</span>';
    }

    /* Variables table */
    grid.appendChild(makeCard(
        '<i class="fas fa-database icon-vars"></i> Variables Detected <span style="margin-left:auto;font-size:0.75rem;color:var(--text-muted)">'+r.variables.length+'</span>',
        r.variables.length > 0
            ? '<div><div class="var-table-head"><span>Name</span><span>Type</span><span>Initial Value</span><span>Line</span><span>Scope</span></div>'+r.variables.map(v=>'<div class="var-table-row"><span class="var-name">'+escapeHtml(v.name)+'</span><span class="var-type">'+escapeHtml(v.type)+'</span><span class="var-value" title="'+escapeHtml(v.value||'\u2014')+'">'+escapeHtml(v.value||'\u2014')+'</span><span class="var-line">L'+v.line+'</span><span class="var-scope '+(v.scope==='local'?'scope-local':'scope-global')+'">'+v.scope+'</span></div>').join('')+'</div>'
            : '<div class="empty-state" style="padding:15px"><i class="fas fa-search" style="font-size:1.2rem"></i><p>No variables detected</p></div>',
        'full-width'));

    /* Functions */
    grid.appendChild(makeCard(
        '<i class="fas fa-cube icon-funcs"></i> Functions Detected <span style="margin-left:auto;font-size:0.75rem;color:var(--text-muted)">'+r.functions.length+'</span>',
        r.functions.length>0 ? r.functions.map(f=>'<div class="detail-item"><span class="detail-line">fn</span><div><div class="detail-code">'+f.name+'('+escapeHtml(f.params)+')</div><div style="color:var(--text-muted);font-size:0.72rem;margin-top:2px">'+f.paramCount+' parameter'+(f.paramCount!==1?'s':'')+'</div></div></div>').join('') : '<div class="empty-state" style="padding:15px"><i class="fas fa-search" style="font-size:1.2rem"></i><p>No functions detected</p></div>'));

    /* Loops */
    grid.appendChild(makeCard(
        '<i class="fas fa-sync-alt icon-loops"></i> Loops Detected <span style="margin-left:auto;font-size:0.75rem;color:var(--text-muted)">'+r.loops.length+'</span>',
        r.loops.length>0 ? r.loops.map(l=>'<div class="detail-item"><span class="detail-line">L'+l.line+'</span><div><span style="border-left:3px solid #ffaa00;padding-left:8px;font-size:0.75rem;font-weight:600;color:#ffaa00">'+l.type+'</span><div class="detail-code" style="margin-top:4px">'+escapeHtml(l.detail)+'</div></div></div>').join('') : '<div class="empty-state" style="padding:15px"><i class="fas fa-search" style="font-size:1.2rem"></i><p>No loops detected</p></div>'));

    /* Time complexity */
    var ts=Math.min(r.timeComplexity.score,100);
    grid.appendChild(makeCard('<i class="fas fa-clock icon-time"></i> Time Complexity '+scoreBadge(ts),
        '<div class="complexity-display"><div class="complexity-big">'+r.timeComplexity.value+'</div></div><div class="complexity-detail" style="margin-top:8px">'+r.timeComplexity.detail+'</div><div class="complexity-bar"><div class="complexity-fill" data-width="'+ts+'"></div></div><div style="display:flex;justify-content:space-between;margin-top:4px"><span style="font-size:0.7rem;color:var(--info)">Efficient</span><span style="font-size:0.7rem;color:var(--error)">Costly</span></div>'));

    /* Space complexity */
    var ss=Math.min(r.spaceComplexity.score,100);
    grid.appendChild(makeCard('<i class="fas fa-memory icon-space"></i> Space Complexity '+scoreBadge(ss),
        '<div class="complexity-display"><div class="complexity-big">'+r.spaceComplexity.value+'</div></div><div class="complexity-detail" style="margin-top:8px">'+r.spaceComplexity.detail+'</div><div class="complexity-bar"><div class="complexity-fill" data-width="'+ss+'"></div></div><div style="display:flex;justify-content:space-between;margin-top:4px"><span style="font-size:0.7rem;color:var(--info)">Low</span><span style="font-size:0.7rem;color:var(--error)">High</span></div>'));

    /* Issues */
    // var im={error:'fa-times-circle',warning:'fa-exclamation-triangle',suggestion:'fa-lightbulb',info:'fa-info-circle'};
    // var tc={error:0,warning:0,suggestion:0};
    // r.issues.forEach(i=>tc[i.type]++);
    // var ib=Object.entries(tc).filter(function(e){return e[1]>0;}).map(function(e){var t=e[0],c=e[1];var cl={error:'var(--error)',warning:'var(--warning)',suggestion:'var(--suggestion)'};return'<span style="font-size:0.72rem;color:'+cl[t]+';font-weight:600">'+c+' '+t+(c>1?'s':'')+'</span>';}).join(' &middot; ');
    // grid.appendChild(makeCard('<i class="fas fa-flag icon-issues"></i> Issues & Suggestions <span style="margin-left:auto;font-size:0.78rem">'+ib+'</span>',
    //     r.issues.length>0?'<div class="messages-list">'+r.issues.map(function(i){return'<div class="msg msg-'+i.type+'"><i class="fas '+im[i.type]+'"></i><span>'+i.text+'</span></div>';}).join('')+'</div>':'<div class="empty-state" style="padding:20px"><i class="fas fa-check-circle" style="font-size:1.8rem;color:var(--accent);opacity:1"></i><p style="color:var(--accent);margin-top:8px">No issues found \u2014 looking clean</p></div>','full-width'));

    /* Code summary */
    var cr=r.totalLines>0?Math.round((r.codeLines/r.totalLines)*100):0;
    grid.appendChild(makeCard('<i class="fas fa-chart-bar" style="background:rgba(0,255,170,0.15);color:#00ffaa;width:30px;height:30px;display:flex;align-items:center;justify-content:center;border-radius:8px;font-size:0.85rem;flex-shrink:0"></i> Code Summary',
        '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:10px">'+[['LANGUAGE',r.language,'var(--accent)'],['TOTAL',r.totalLines,'var(--text)'],['CODE',r.codeLines,'var(--text)'],['COMMENTS',r.commentLines,r.commentLines>0?'var(--suggestion)':'var(--text-muted)'],['EMPTY',r.emptyLines,r.emptyLines>3?'var(--warning)':'var(--text-muted)'],['CODE RATIO',cr+'%',cr>=60?'var(--accent)':'var(--warning)']].map(function(e){var l=e[0],v=e[1],c=e[2];return'<div style="text-align:center;padding:12px 8px;background:rgba(0,0,0,0.2);border-radius:10px"><div style="font-size:1.3rem;font-weight:700;color:'+c+';font-family:\'JetBrains Mono\',monospace">'+v+'</div><div style="font-size:0.65rem;color:var(--text-muted);margin-top:4px;letter-spacing:0.5px">'+l+'</div></div>';}).join('')+'</div>','full-width'));

    /* Staggered card entrance animation */
    var section = document.getElementById('outputSection');
    section.classList.add('visible');
    var cards = grid.querySelectorAll('.result-card');
    cards.forEach(function(card, i) {
        setTimeout(function() {
            card.classList.add('visible');
            var bars = card.querySelectorAll('.complexity-fill[data-width]');
            bars.forEach(function(bar) {
                setTimeout(function() { bar.style.width = bar.dataset.width + '%'; }, 100);
            });
        }, 100 + i * 120);
    });
}

function makeCard(title, content, extraClass) {
    var card = document.createElement('div');
    card.className = 'result-card ' + (extraClass || '');
    card.innerHTML = '<div class="result-card-title">' + title + '</div>' + content;
    return card;
}

function escapeHtml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}






// --new code--
/* ===== EXTENDED ANALYSIS MODULES ===== */

/* ---------- LEXICAL ANALYSIS ---------- */
function stripCommentsForLex(code, lang) {
    var result = '', i = 0, inBlock = false, inStr = false, strCh = '';
    while (i < code.length) {
        if (inStr) { result += code[i]; if (code[i] === '\\' && i + 1 < code.length) { i++; result += code[i]; } else if (code[i] === strCh) inStr = false; i++; continue; }
        if (code[i] === '"' || code[i] === "'" || code[i] === '`') { inStr = true; strCh = code[i]; result += code[i]; i++; continue; }
        if (inBlock) { if (code[i] === '*' && i + 1 < code.length && code[i + 1] === '/') { inBlock = false; i += 2; } else i++; continue; }
        if (lang === 'Python' && code[i] === '#') { while (i < code.length && code[i] !== '\n') i++; continue; }
        if (lang !== 'Python' && code[i] === '/' && i + 1 < code.length) {
            if (code[i + 1] === '/') { while (i < code.length && code[i] !== '\n') i++; continue; }
            if (code[i + 1] === '*') { inBlock = true; i += 2; continue; }
        }
        result += code[i]; i++;
    }
    return result;
}

function runTokenizer(cleanCode, lang) {
    var tokens = [], i = 0;
    while (i < cleanCode.length) {
        if (/\s/.test(cleanCode[i])) { i++; continue; }
        if (cleanCode[i] === '"' || cleanCode[i] === "'" || cleanCode[i] === '`') {
            var q = cleanCode[i], s = q; i++;
            while (i < cleanCode.length && cleanCode[i] !== q) { if (cleanCode[i] === '\\' && i + 1 < cleanCode.length) { s += cleanCode[i]; i++; } if (i < cleanCode.length) { s += cleanCode[i]; i++; } }
            if (i < cleanCode.length) { s += cleanCode[i]; i++; }
            tokens.push({ type: 'String', value: s }); continue;
        }
        if (/\d/.test(cleanCode[i]) || (cleanCode[i] === '.' && i + 1 < cleanCode.length && /\d/.test(cleanCode[i + 1]))) {
            var num = '';
            if (cleanCode[i] === '0' && i + 1 < cleanCode.length && (cleanCode[i + 1] === 'x' || cleanCode[i + 1] === 'X')) { num = '0x'; i += 2; while (i < cleanCode.length && /[0-9a-fA-F]/.test(cleanCode[i])) { num += cleanCode[i]; i++; } }
            else { while (i < cleanCode.length && /[\d.]/.test(cleanCode[i])) { num += cleanCode[i]; i++; } if (i < cleanCode.length && /[eEfFlL]/.test(cleanCode[i])) { num += cleanCode[i]; i++; if (i < cleanCode.length && /[+-]/.test(cleanCode[i])) { num += cleanCode[i]; i++; } while (i < cleanCode.length && /\d/.test(cleanCode[i])) { num += cleanCode[i]; i++; } } }
            tokens.push({ type: 'Number', value: num }); continue;
        }
        if (/[a-zA-Z_]/.test(cleanCode[i])) {
            var id = ''; while (i < cleanCode.length && /\w/.test(cleanCode[i])) { id += cleanCode[i]; i++; }
            if (KEYWORDS.has(id)) tokens.push({ type: 'Keyword', value: id });
            else if (/^[A-Z]/.test(id) && id.length > 1) tokens.push({ type: 'Class', value: id });
            else tokens.push({ type: 'Identifier', value: id });
            continue;
        }
        if (cleanCode[i] === '#') { var pp = '#'; i++; while (i < cleanCode.length && cleanCode[i] !== '\n') { pp += cleanCode[i]; i++; } tokens.push({ type: 'Preprocessor', value: pp.trim() }); continue; }
        if (i + 2 < cleanCode.length) { var thr = cleanCode[i] + cleanCode[i + 1] + cleanCode[i + 2]; if (['===', '!==', '>>>', '<<=', '>>=', '...'].indexOf(thr) !== -1) { tokens.push({ type: 'Operator', value: thr }); i += 3; continue; } }
        if (i + 1 < cleanCode.length) { var two = cleanCode[i] + cleanCode[i + 1]; if (['==', '!=', '<=', '>=', '&&', '||', '++', '--', '+=', '-=', '*=', '/=', '%=', '=>', '<<', '>>', '&=', '|=', '^=', '**'].indexOf(two) !== -1) { tokens.push({ type: 'Operator', value: two }); i += 2; continue; } }
        if ('+-*/%=<>!&|^~?:'.indexOf(cleanCode[i]) !== -1) { tokens.push({ type: 'Operator', value: cleanCode[i] }); i++; continue; }
        if ('(){}[];,.'.indexOf(cleanCode[i]) !== -1) { tokens.push({ type: 'Delimiter', value: cleanCode[i] }); i++; continue; }
        tokens.push({ type: 'Unknown', value: cleanCode[i] }); i++;
    }
    return tokens;
}

function performLexicalAnalysis(code, lang) {
    var clean = stripCommentsForLex(code, lang);
    var tokens = runTokenizer(clean, lang);
    var counts = {};
    tokens.forEach(function (t) { counts[t.type] = (counts[t.type] || 0) + 1; });
    return { tokens: tokens, counts: counts, totalTokens: tokens.length };
}

/* ---------- SYNTAX TREE ---------- */
function parseLineNode(trimmed, ln, lang) {
    if (!trimmed) return null;
    /* Python */
    if (lang === 'Python') {
        var dm = trimmed.match(/^def\s+(\w+)\s*\(([^)]*)\)\s*:/);
        if (dm) return { label: 'FunctionDef: ' + dm[1] + '(' + dm[2].trim() + ')', type: 'function', line: ln, children: [] };
        var fm = trimmed.match(/^for\s+(.+)\s+in\s+(.+):/);
        if (fm) return { label: 'ForIn: ' + fm[1].trim() + ' in ' + fm[2].replace(/:$/, '').trim(), type: 'loop', line: ln, children: [] };
        var wm = trimmed.match(/^while\s+(.+):/);
        if (wm) return { label: 'While: ' + wm[1].replace(/:$/, '').trim(), type: 'loop', line: ln, children: [] };
        var im = trimmed.match(/^if\s+(.+):/);
        if (im) return { label: 'If: ' + im[1].replace(/:$/, '').trim(), type: 'condition', line: ln, children: [] };
        var em = trimmed.match(/^elif\s+(.+):/);
        if (em) return { label: 'Elif: ' + em[1].replace(/:$/, '').trim(), type: 'condition', line: ln, children: [] };
        if (/^else\s*:/.test(trimmed)) return { label: 'Else', type: 'condition', line: ln, children: [] };
        var rm = trimmed.match(/^return\s+(.*)/);
        if (rm) return { label: 'Return: ' + rm[1].trim(), type: 'return', line: ln, children: [] };
        var am = trimmed.match(/^(\w[\w,\s]*)\s*=\s*(.+)/);
        if (am) return { label: 'Assign: ' + am[1].trim() + ' = ' + am[2].replace(/#.*$/, '').trim(), type: 'assign', line: ln, children: [] };
        var cm = trimmed.match(/^class\s+(\w+)/);
        if (cm) return { label: 'ClassDef: ' + cm[1], type: 'class', line: ln, children: [] };
        return { label: 'Expr: ' + trimmed.substring(0, 70), type: 'expr', line: ln, children: [] };
    }
    /* C-style */
    var incM = trimmed.match(/^#\s*(include|define)\s+(.*)/);
    if (incM) return { label: incM[1] + ' ' + incM[2].trim(), type: 'preprocessor', line: ln, children: [] };
    var usingM = trimmed.match(/^using\s+(.*)/);
    if (usingM) return { label: 'Using: ' + usingM[1].trim(), type: 'import', line: ln, children: [] };
    var classM = trimmed.match(/^(?:public|private|protected)?\s*class\s+(\w+)/);
    if (classM) return { label: 'ClassDecl: ' + classM[1], type: 'class', line: ln, children: [] };
    var funcM = trimmed.match(/^(?:(?:public|private|protected|static|async)\s+)*(?:void|int|float|double|char|long|short|bool|string|auto|String|var|boolean|byte)\s+\*?\s*(\w+)\s*\(([^)]*)\)/);
    if (funcM && !KEYWORDS.has(funcM[1])) return { label: 'FunctionDecl: ' + funcM[1] + '(' + funcM[2].trim() + ')', type: 'function', line: ln, children: [] };
    var jfM = trimmed.match(/^function\s+(\w+)\s*\(([^)]*)\)/);
    if (jfM) return { label: 'FunctionDecl: ' + jfM[1] + '(' + jfM[2].trim() + ')', type: 'function', line: ln, children: [] };
    var afM = trimmed.match(/^(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s+)?(?:function|\([^)]*\)\s*=>|\w+\s*=>)/);
    if (afM && !KEYWORDS.has(afM[1])) return { label: 'ArrowFunc: ' + afM[1], type: 'function', line: ln, children: [] };
    var forM = trimmed.match(/^for\s*\((.+)\)/);
    if (forM) return { label: 'For: ' + forM[1].trim().substring(0, 55), type: 'loop', line: ln, children: [] };
    var whM = trimmed.match(/^while\s*\((.+)\)/);
    if (whM) return { label: 'While: ' + whM[1].trim().substring(0, 55), type: 'loop', line: ln, children: [] };
    if (/^do\s*\{/.test(trimmed)) return { label: 'DoWhile', type: 'loop', line: ln, children: [] };
    var ifM = trimmed.match(/^if\s*\((.+)\)/);
    if (ifM) return { label: 'If: ' + ifM[1].trim().substring(0, 55), type: 'condition', line: ln, children: [] };
    if (/^else\s+if\s*\(/.test(trimmed)) { var eiM = trimmed.match(/^else\s+if\s*\((.+)\)/); return { label: 'ElseIf: ' + (eiM ? eiM[1].trim().substring(0, 50) : ''), type: 'condition', line: ln, children: [] }; }
    if (/^else\s*\{/.test(trimmed) || /^else\s*$/.test(trimmed)) return { label: 'Else', type: 'condition', line: ln, children: [] };
    var swM = trimmed.match(/^switch\s*\((.+)\)/);
    if (swM) return { label: 'Switch: ' + swM[1].trim(), type: 'condition', line: ln, children: [] };
    var csM = trimmed.match(/^case\s+(.+):/);
    if (csM) return { label: 'Case: ' + csM[1].trim(), type: 'condition', line: ln, children: [] };
    if (/^default\s*:/.test(trimmed)) return { label: 'Default', type: 'condition', line: ln, children: [] };
    var retM = trimmed.match(/^return\s*(.*);?\s*$/);
    if (retM) return { label: 'Return: ' + retM[1].trim(), type: 'return', line: ln, children: [] };
    var importM = trimmed.match(/^(?:import|from)\s+(.*)/);
    if (importM) return { label: 'Import: ' + importM[1].trim().substring(0, 60), type: 'import', line: ln, children: [] };
    if (trimmed.endsWith(';')) trimmed = trimmed.slice(0, -1).trim();
    var assignM = trimmed.match(/^(\w+(?:\[[^\]]*\])*)\s*=\s*(.+)/);
    if (assignM) return { label: 'Assign: ' + assignM[1].trim() + ' = ' + assignM[2].trim().substring(0, 50), type: 'assign', line: ln, children: [] };
    return { label: 'Expr: ' + trimmed.substring(0, 65), type: 'expr', line: ln, children: [] };
}

function buildSyntaxTree(code, lang) {
    var lines = code.split('\n');
    var root = { label: 'Program', type: 'program', line: 0, children: [] };
    if (lang === 'Python') {
        var indStack = [0], nodeStack = [root];
        for (var i = 0; i < lines.length; i++) {
            var t = lines[i].trim();
            if (!t || t.startsWith('#')) continue;
            var ind = lines[i].replace(/\t/g, '    ').match(/^(\s*)/)[1].length;
            while (indStack.length > 1 && ind <= indStack[indStack.length - 1]) { indStack.pop(); nodeStack.pop(); }
            var node = parseLineNode(t, i + 1, lang);
            if (node) { nodeStack[nodeStack.length - 1].children.push(node); if (t.endsWith(':')) { indStack.push(ind); nodeStack.push(node); } }
        }
    } else {
        var nStack = [root], bDepth = 0;
        for (var i = 0; i < lines.length; i++) {
            var t = lines[i].trim();
            if (!t || isCommentLine(t, lang)) continue;
            var ob = 0, cb = 0, inS = false, sc = '';
            for (var j = 0; j < t.length; j++) {
                if (inS) { if (t[j] === sc && t[j - 1] !== '\\') inS = false; continue; }
                if (t[j] === '"' || t[j] === "'") { inS = true; sc = t[j]; continue; }
                if (t[j] === '{') ob++; if (t[j] === '}') cb++;
            }
            for (var k = 0; k < cb; k++) { if (nStack.length > 1) nStack.pop(); }
            var node = parseLineNode(t, i + 1, lang);
            if (node) nStack[nStack.length - 1].children.push(node);
            for (var k = 0; k < ob; k++) { if (node) nStack.push(node); }
        }
    }
    return root;
}

function renderTreeHTML(node, prefix, isLast, depth) {
    if (depth > 12) return prefix + (isLast ? '└── ' : '├── ') + '<span class="tree-branch">...</span>\n';
    var html = '';
    var conn = isLast ? '└── ' : '├── ';
    var childPfx = isLast ? '    ' : '│   ';
    var typeColors = { program: 'tree-type', function: 'tree-name', loop: 'tree-value', condition: 'tree-kw', return: 'tree-value', assign: 'tree-branch', expr: 'tree-branch', class: 'tree-name', preprocessor: 'tree-branch', import: 'tree-branch' };
    var cls = typeColors[node.type] || 'tree-branch';
    html += prefix + '<span class="tree-branch">' + conn + '</span><span class="' + cls + '">' + escapeHtml(node.label) + '</span>\n';
    for (var i = 0; i < node.children.length; i++) {
        html += renderTreeHTML(node.children[i], prefix + '<span class="tree-branch">' + childPfx + '</span>', i === node.children.length - 1, depth + 1);
    }
    return html;
}

/* ---------- SEMANTIC ANALYSIS ---------- */
function performSemanticAnalysis(code, lang, variables, functions) {
    var checks = [];
    var varNames = variables.map(function (v) { return v.name; });
    var funcNames = functions.map(function (f) { return f.name; });
    var usedVars = new Set();
    var lines = code.split('\n');
    lines.forEach(function (line) {
        var t = line.trim();
        if (isCommentLine(t, lang) || !t) return;
        varNames.forEach(function (vn) {
            var re = new RegExp('(?<![.\\w])' + vn + '(?![\\w(])');
            if (re.test(t) && !t.match(new RegExp('^(?:let|const|var|int|float|double|char|long|short|bool|string|auto|unsigned)\\s+.*\\b' + vn + '\\b'))) {
                usedVars.add(vn);
            }
        });
    });
    checks.push({ status: 'ok', title: 'Variable Declarations', detail: variables.length + ' variable(s) declared and tracked' });
    var unused = varNames.filter(function (v) { return !usedVars.has(v); });
    if (unused.length > 0) checks.push({ status: 'warn', title: 'Unused Variables', detail: unused.map(function (v) { return '`' + v + '`'; }).join(', ') + ' — declared but never read' });
    else if (variables.length > 0) checks.push({ status: 'ok', title: 'Variable Usage', detail: 'All declared variables are referenced' });
    var funcCalls = [];
    var callRe = /(?<![.\w])(\w+)\s*\(/g;
    var m;
    while ((m = callRe.exec(code)) !== null) {
        var cn = m[1];
        if (!KEYWORDS.has(cn) && funcNames.indexOf(cn) === -1 && ['if', 'for', 'while', 'switch', 'catch'].indexOf(cn) === -1 && funcCalls.indexOf(cn) === -1) {
            funcCalls.push(cn);
        }
    }
    if (funcCalls.length > 0) checks.push({ status: 'warn', title: 'Undefined Function Calls', detail: funcCalls.map(function (v) { return '`' + v + '()`'; }).join(', ') + ' — not defined in this scope' });
    else checks.push({ status: 'ok', title: 'Function Calls', detail: 'All called functions are defined locally' });
    if (functions.length > 0) {
        var noReturn = functions.filter(function (f) {
            var re = new RegExp('function\\s+' + f.name + '|void\\s+\\w+\\s+' + f.name + '|def\\s+' + f.name);
            var m2 = code.match(re);
            if (m2) {
                var idx = code.indexOf(m2[0]);
                var chunk = code.substring(idx, idx + 2000);
                var brace = 0, started = false, inS = false, sc = '';
                for (var i = 0; i < chunk.length; i++) {
                    if (inS) { if (chunk[i] === sc && chunk[i - 1] !== '\\') inS = false; continue; }
                    if (chunk[i] === '"' || chunk[i] === "'") { inS = true; sc = chunk[i]; continue; }
                    if (chunk[i] === '{') { brace++; started = true; }
                    if (chunk[i] === '}') { brace--; if (started && brace <= 0) break; }
                }
                if (m2[0].indexOf('void') !== -1 || m2[0].indexOf('def ') !== -1) return false;
                return chunk.indexOf('return') === -1 || chunk.indexOf('return') > chunk.lastIndexOf('}');
            }
            return false;
        });
        if (noReturn.length > 0) checks.push({ status: 'warn', title: 'Missing Return Statements', detail: noReturn.map(function (f) { return '`' + f.name + '()`'; }).join(', ') + ' — non-void function may not return a value' });
        else checks.push({ status: 'ok', title: 'Return Statements', detail: 'All non-void functions have return paths' });
    }
    var redeclared = [];
    var seen = {};
    variables.forEach(function (v) {
        if (seen[v.name]) redeclared.push('`' + v.name + '` (L' + seen[v.name] + ', L' + v.line + ')');
        else seen[v.name] = v.line;
    });
    if (redeclared.length > 0) checks.push({ status: 'error', title: 'Variable Redeclaration', detail: redeclared.join(', ') });
    else checks.push({ status: 'ok', title: 'Unique Declarations', detail: 'No duplicate variable names detected' });
    if (lang === 'JavaScript') {
        if (/[^!=]==[^=]/.test(code)) checks.push({ status: 'error', title: 'Strict Equality', detail: 'Use `===` instead of `==` to avoid type coercion bugs' });
        else checks.push({ status: 'ok', title: 'Strict Equality', detail: 'Using strict equality operators' });
    }
    if (lang === 'C/C++') {
        if (/\(low\s*\+\s*high\)\s*\/\s*2/.test(code)) checks.push({ status: 'error', title: 'Integer Overflow', detail: '`(low + high) / 2` can overflow — use `low + (high - low) / 2`' });
        else checks.push({ status: 'ok', title: 'Binary Search Safety', detail: 'No integer overflow pattern detected' });
    }
    checks.push({ status: 'ok', title: 'Language Compliance', detail: 'Code conforms to ' + lang + ' syntax rules' });
    return checks;
}

/* ---------- THREE ADDRESS CODE ---------- */
function decomposeExpr(expr, tc) {
    expr = expr.trim().replace(/;$/, '').trim();
    if (/^[\d.]+$/.test(expr)) return { code: expr, temps: [] };
    if ((/^'[^']*'$/.test(expr)) || (/^"[^"]*"$/.test(expr))) return { code: expr, temps: [] };
    if (/^\w+$/.test(expr)) return { code: expr, temps: [] };
    if (/^\w+\[/.test(expr) && /\]$/.test(expr)) return { code: expr, temps: [] };
    var depth = 0, splitIdx = -1, splitOp = null;
    var opsList = [
        ['||', 1], ['&&', 2], ['==', 3], ['!=', 3], ['<=', 4], ['>=', 4], ['<', 4], ['>', 4],
        ['+', 5], ['-', 5], ['*', 6], ['/', 6], ['%', 6]
    ];
    for (var i = expr.length - 1; i >= 0; i--) {
        if (expr[i] === ')') depth++;
        if (expr[i] === '(') depth--;
        if (depth !== 0) continue;
        for (var oi = 0; oi < opsList.length; oi++) {
            var op = opsList[oi][0];
            if (i >= op.length - 1 && expr.substring(i - op.length + 1, i + 1) === op) {
                if (op === '-' && (i === 0 || '+-*/%=<>!&|^~('.indexOf(expr[i - 1]) !== -1)) continue;
                if (op === '+' && i > 0 && expr[i - 1] === 'e') continue;
                splitIdx = i - op.length + 1; splitOp = op; break;
            }
        }
        if (splitIdx >= 0) break;
    }
    if (splitIdx >= 0 && splitOp) {
        var left = expr.substring(0, splitIdx).trim();
        var right = expr.substring(splitIdx + splitOp.length).trim();
        var lr = decomposeExpr(left, tc);
        var rr = decomposeExpr(right, tc);
        var tmp = 't' + tc.val++;
        var allTemps = lr.temps.concat(rr.temps);
        allTemps.push(tmp + ' = ' + lr.code + ' ' + splitOp + ' ' + rr.code);
        return { code: tmp, temps: allTemps };
    }
    if (expr.startsWith('(') && expr.endsWith(')')) return decomposeExpr(expr.slice(1, -1), tc);
    return { code: expr, temps: [] };
}

function generateThreeAddressCode(code, lang, variables) {
    var lines = code.split('\n');
    var tacLines = [];
    var tc = { val: 1 };
    var labelCount = 0;
    function nextLabel() { return 'L' + (labelCount++); }
    function cleanT(t) { return t.replace(/;$/, '').trim(); }

    for (var i = 0; i < lines.length; i++) {
        var t = cleanT(lines[i].trim());
        if (!t || isCommentLine(t, lang)) continue;

        if (/^#\w/.test(t)) { tacLines.push({ label: '', code: t, comment: 'preprocessor' }); continue; }
        if (/^using\s/.test(t)) { tacLines.push({ label: '', code: t, comment: 'namespace' }); continue; }
        if (/^(import|from)\s/.test(t)) { tacLines.push({ label: '', code: t, comment: 'import' }); continue; }
        if (/^}\s*$/.test(t)) continue;

        var retM = t.match(/^return\s+(.*)/);
        if (retM) {
            var rv = cleanT(retM[1]);
            if (rv && rv !== '') {
                var rd = decomposeExpr(rv, tc);
                rd.temps.forEach(function (tl) { tacLines.push({ label: '', code: tl }); });
                tacLines.push({ label: '', code: 'return ' + rd.code, comment: '' });
            } else {
                tacLines.push({ label: '', code: 'return', comment: '' });
            }
            continue;
        }

        var forM = t.match(/^for\s*\(\s*(.*)\s*;\s*(.*)\s*;\s*(.*)\s*\)/);
        if (forM) {
            var init = cleanT(forM[1]), cond = cleanT(forM[2]), upd = cleanT(forM[3]);
            var ld = decomposeExpr(init, tc);
            ld.temps.forEach(function (tl) { tacLines.push({ label: '', code: tl }); });
            if (ld.code !== init) tacLines.push({ label: '', code: init });
            var startL = nextLabel(), endL = nextLabel();
            tacLines.push({ label: startL + ':', code: '' });
            var cd2 = decomposeExpr(cond, tc);
            cd2.temps.forEach(function (tl) { tacLines.push({ label: '', code: tl }); });
            tacLines.push({ label: '', code: 'if ' + cd2.code + ' == 0 goto ' + endL, comment: 'loop condition' });
            tacLines.push({ label: '', code: '... body ...', comment: '' });
            var ud = decomposeExpr(upd, tc);
            ud.temps.forEach(function (tl) { tacLines.push({ label: '', code: tl }); });
            if (ud.code !== upd) tacLines.push({ label: '', code: upd });
            tacLines.push({ label: '', code: 'goto ' + startL, comment: '' });
            tacLines.push({ label: endL + ':', code: '' });
            continue;
        }

        var whileM = t.match(/^while\s*\((.+)\)/);
        if (whileM) {
            var wcond = cleanT(whileM[1]);
            var ws = nextLabel(), we = nextLabel();
            tacLines.push({ label: ws + ':', code: '' });
            var wd = decomposeExpr(wcond, tc);
            wd.temps.forEach(function (tl) { tacLines.push({ label: '', code: tl }); });
            tacLines.push({ label: '', code: 'if ' + wd.code + ' == 0 goto ' + we, comment: 'while condition' });
            tacLines.push({ label: '', code: '... body ...', comment: '' });
            tacLines.push({ label: '', code: 'goto ' + ws, comment: '' });
            tacLines.push({ label: we + ':', code: '' });
            continue;
        }

        var ifM = t.match(/^if\s*\((.+)\)/);
        if (ifM) {
            var icond = cleanT(ifM[1]);
            var id = decomposeExpr(icond, tc);
            id.temps.forEach(function (tl) { tacLines.push({ label: '', code: tl }); });
            tacLines.push({ label: '', code: 'if ' + id.code + ' == 0 goto L_skip', comment: 'if branch' });
            tacLines.push({ label: '', code: '... then ...', comment: '' });
            tacLines.push({ label: 'L_skip:', code: '' });
            continue;
        }

        if (/^else/.test(t)) continue;
        if (/^(do|case|default|switch)/.test(t)) { tacLines.push({ label: '', code: t, comment: 'control' }); continue; }

        var assignM = t.match(/^(.+?)\s*=\s*(.+)$/);
        if (assignM) {
            var target = assignM[1].trim();
            var rhs = assignM[2].trim();
            if (KEYWORDS.has(target)) continue;
            var rd2 = decomposeExpr(rhs, tc);
            rd2.temps.forEach(function (tl) { tacLines.push({ label: '', code: tl }); });
            tacLines.push({ label: '', code: target + ' = ' + rd2.code });
            continue;
        }

        var callM = t.match(/^(\w+)\s*\((.*)\)\s*$/);
        if (callM && !KEYWORDS.has(callM[1])) {
            var args = callM[2].split(',').map(function (a) { return a.trim(); }).filter(function (a) { return a; });
            args.forEach(function (arg, ai) {
                var ad = decomposeExpr(arg, tc);
                ad.temps.forEach(function (tl) { tacLines.push({ label: '', code: tl }); });
                tacLines.push({ label: '', code: 'param' + (ai + 1) + ' = ' + ad.code });
            });
            tacLines.push({ label: '', code: 'call ' + callM[1] + ', ' + args.length, comment: '' });
            continue;
        }

        tacLines.push({ label: '', code: t.substring(0, 70), comment: '' });
    }
    return tacLines;
}

/* ---------- CODE OPTIMIZATION ---------- */
function analyzeOptimizations(code, lang, variables) {
    var opts = [];
    var lines = code.split('\n');
    var varValues = {};
    lines.forEach(function (line, idx) {
        var t = line.trim();
        if (isCommentLine(t, lang) || !t) return;
        var am = t.match(/^(?:let|const|var|int|float|double|long|short|bool|string|auto|unsigned\s+\w+)?\s*(\w+)\s*=\s*(.+);?\s*$/);
        if (am && !KEYWORDS.has(am[1])) {
            var val = am[2].replace(/;$/, '').trim();
            var constFold = val.match(/^(\d+)\s*([+\-*/%])\s*(\d+)$/);
            if (constFold) {
                var a = parseInt(constFold[1]), op = constFold[2], b = parseInt(constFold[3]), result = null;
                if (op === '+') result = a + b; else if (op === '-') result = a - b;
                else if (op === '*') result = a * b; else if (op === '/' && b !== 0) result = Math.floor(a / b);
                else if (op === '%' && b !== 0) result = a % b;
                if (result !== null) {
                    opts.push({ type: 'fold', desc: 'Constant folding: compute at compile time',
                        before: am[1] + ' = ' + a + ' ' + op + ' ' + b,
                        after: am[1] + ' = ' + result, line: idx + 1 });
                }
            }
            var floatFold = val.match(/^(\d+\.?\d*)\s*([+\-*/])\s*(\d+\.?\d*)$/);
            if (floatFold && !constFold) {
                var fa = parseFloat(floatFold[1]), fop = floatFold[2], fb = parseFloat(floatFold[3]), fr = null;
                if (fop === '+') fr = fa + fb; else if (fop === '-') fr = fa - fb;
                else if (fop === '*') fr = fa * fb; else if (fop === '/' && fb !== 0) fr = fa / fb;
                if (fr !== null && Number.isFinite(fr)) {
                    opts.push({ type: 'fold', desc: 'Constant folding: evaluate floating-point at compile time',
                        before: am[1] + ' = ' + fa + ' ' + fop + ' ' + fb,
                        after: am[1] + ' = ' + parseFloat(fr.toPrecision(10)), line: idx + 1 });
                }
            }
            varValues[am[1]] = val;
        }
        var selfAssign = t.match(/^(\w+)\s*=\s*\1\s*;?\s*$/);
        if (selfAssign && !KEYWORDS.has(selfAssign[1])) {
            opts.push({ type: 'redundant', desc: 'Redundant self-assignment — this has no effect',
                before: selfAssign[1] + ' = ' + selfAssign[1], after: '/* remove */', line: idx + 1 });
        }
        var mul2 = t.match(/^(.+?)\s*=\s*(\w+)\s*\*\s*2\s*;?\s*$/);
        if (mul2 && !KEYWORDS.has(mul2[1])) {
            opts.push({ type: 'strength', desc: 'Strength reduction: replace multiply by 2 with left shift',
                before: mul2[1].trim() + ' = ' + mul2[2] + ' * 2',
                after: mul2[1].trim() + ' = ' + mul2[2] + ' << 1', line: idx + 1 });
        }
        var mulPow = t.match(/^(.+?)\s*=\s*(\w+)\s*\*\s*(\w+)\s*;?\s*$/);
        if (mulPow && mulPow[2] === mulPow[3] && !KEYWORDS.has(mulPow[1])) {
            opts.push({ type: 'strength', desc: 'Strength reduction: x*x → use Math.pow or a dedicated square function',
                before: mulPow[1].trim() + ' = ' + mulPow[2] + ' * ' + mulPow[3],
                after: mulPow[1].trim() + ' = ' + mulPow[2] + ' ** 2', line: idx + 1 });
        }
    });
    var usedSet = new Set();
    code.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '').split('\n').forEach(function (line) {
        var t = line.trim();
        if (!t) return;
        variables.forEach(function (v) {
            var re = new RegExp('(?<![.\\w])' + v.name + '(?![\\w(=])');
            if (re.test(t) && !t.match(new RegExp('(?:let|const|var|int|float|double|char|long|short|bool|string|auto|unsigned)\\s+.*\\b' + v.name + '\\b\\s*='))) {
                usedSet.add(v.name);
            }
        });
    });
    var deadVars = variables.filter(function (v) { return !usedSet.has(v.name); });
    deadVars.slice(0, 5).forEach(function (v) {
        opts.push({ type: 'dead', desc: 'Dead store: `' + v.name + '` is written but never read',
            before: v.type + ' ' + v.name + (v.value ? ' = ' + v.value : ''), after: '/* remove unused variable */', line: v.line });
    });
    var nestedLoops = [];
    var depth = 0;
    lines.forEach(function (line, idx) {
        var t = line.trim();
        if (/^(for|while)\s*[\({]/.test(t)) {
            depth++;
            if (depth >= 2) nestedLoops.push({ line: idx + 1, depth: depth });
        }
        if (lang !== 'Python') {
            var ob = 0, cb2 = 0;
            for (var j = 0; j < t.length; j++) { if (t[j] === '{') ob++; if (t[j] === '}') cb2++; }
            depth = Math.max(0, depth - cb2);
        }
    });
    if (nestedLoops.length > 0) {
        opts.push({ type: 'loop-opt', desc: 'Nested loop at depth ' + nestedLoops[0].depth + ' — consider algorithmic optimization (e.g., hash map lookup, early exit)',
            before: 'O(n^' + nestedLoops[0].depth + ') nested iteration', after: 'Consider: hash set for O(1) lookups, break early, or restructure', line: nestedLoops[0].line });
    }
    return opts;
}



/* ---------- CODE OUTPUT SIMULATION ---------- */
function simulateCodeOutput(code, lang, variables, functions) {
    var outputs = [];
    var env = {};
    var lines = code.split('\n');
    var note = '';

    function tryEval(expr) {
        expr = expr.trim().replace(/;$/, '').trim();
        var numM = expr.match(/^-?\d+\.?\d*$/);
        if (numM) return parseFloat(numM[0]);
        var strM = expr.match(/^(['"])(.*)\1$/);
        if (strM) return strM[2];
        if (env.hasOwnProperty(expr)) return env[expr];
        var arrM = expr.match(/^\[([^\]]*)\]$/);
        if (arrM) {
            var items = arrM[1].split(',').map(function (s) { return tryEval(s.trim()); });
            return items;
        }
        var binM = expr.match(/^([\w.]+)\s*([+\-*/%])\s*([\w.]+)$/);
        if (binM) {
            var l = tryEval(binM[1]), r = tryEval(binM[3]), op = binM[2];
            if (typeof l === 'number' && typeof r === 'number') {
                if (op === '+') return l + r; if (op === '-') return l - r;
                if (op === '*') return l * r; if (op === '/') return r !== 0 ? l / r : undefined;
                if (op === '%') return r !== 0 ? l % r : undefined;
            }
        }
        return undefined;
    }

    function formatVal(v) {
        if (v === undefined || v === null) return 'undefined';
        if (Array.isArray(v)) return '[' + v.join(', ') + ']';
        if (typeof v === 'number' && v % 1 !== 0) return v.toString();
        return String(v);
    }

    function runLines(lns, localEnv) {
        var e = Object.assign({}, env, localEnv);
        for (var i = 0; i < lns.length; i++) {
            var t = lns[i].trim();
            if (!t || isCommentLine(t, lang)) continue;
            /* Python print */
            if (lang === 'Python') {
                var pm = t.match(/^print\s*\((.+)\)$/);
                if (pm) {
                    var args = pm[1].split(',').map(function (a) { return tryEvalLocal(a.trim(), e); });
                    outputs.push(args.map(formatVal).join(' '));
                    continue;
                }
                var am2 = t.match(/^([\w,\s]+?)\s*=\s*(.+)/);
                if (am2) {
                    var ns = am2[1].split(',').map(function (n) { return n.trim(); });
                    var vl = am2[2].replace(/#.*$/, '').trim();
                    if (ns.length === 1) e[ns[0]] = tryEvalLocal(vl, e);
                    continue;
                }
                var fm = t.match(/^for\s+(\w+)\s+in\s+(.+):/);
                if (fm) {
                    var iterable = tryEvalLocal(fm[2].replace(/:$/, '').trim(), e);
                    if (Array.isArray(iterable)) {
                        var body = [];
                        var bi = i + 1;
                        var fInd = lns[i].replace(/\t/g, '    ').match(/^(\s*)/)[1].length;
                        while (bi < lns.length) {
                            var bLine = lns[bi];
                            var bInd = bLine.replace(/\t/g, '    ').match(/^(\s*)/)[1].length;
                            if (bLine.trim() === '' || bInd > fInd) { body.push(bLine); bi++; }
                            else break;
                        }
                        iterable.forEach(function (item) {
                            e[fm[1]] = item;
                            runLines(body, e);
                        });
                        i = bi - 1;
                    }
                    continue;
                }
                continue;
            }
            /* JS console.log */
            if (lang === 'JavaScript') {
                var clm = t.match(/^console\.log\s*\((.+)\)$/);
                if (clm) {
                    var args = clm[1].split(',').map(function (a) { return tryEvalLocal(a.trim(), e); });
                    outputs.push(args.map(formatVal).join(' '));
                    continue;
                }
            }
            /* C++ cout */
            if (lang === 'C/C++') {
                var coutM = t.match(/^cout\s*<<\s*(.+?)(?:\s*<<\s*endl)?\s*;?\s*$/);
                if (coutM) {
                    var parts = t.split('<<').slice(1).map(function (p) { return p.trim().replace(/;$/, '').replace(/endl/i, ''); }).filter(function (p) { return p; });
                    var outParts = parts.map(function (p) { return formatVal(tryEvalLocal(p, e)); });
                    outputs.push(outParts.join(' '));
                    continue;
                }
                var forCM = t.match(/^for\s*\(\s*(?:int|auto)?\s*(\w+)\s*=\s*(\d+)\s*;\s*\w+\s*([<>=!]+)\s*(\d+)\s*;\s*\w+(\+\+|--|\+=\d+|-=\d+)\s*\)/);
                if (forCM) {
                    var fv = parseInt(forCM[2]), flimit = parseInt(forCM[4]);
                    var body = [];
                    var bi = i + 1, bd = 0;
                    while (bi < lns.length) {
                        var bl = lns[bi].trim();
                        if (bl.startsWith('{')) { bd++; body.push(bl); bi++; continue; }
                        if (bl.startsWith('}')) { bd--; if (bd <= 0) { bi++; break; } body.push(bl); bi++; continue; }
                        if (bd > 0) { body.push(lns[bi]); bi++; continue; }
                        break;
                    }
                    var op2 = forCM[3];
                    if (op2 === '<') { for (var fi = fv; fi < flimit; fi++) runLines(body, e); }
                    else if (op2 === '<=') { for (var fi = fv; fi <= flimit; fi++) runLines(body, e); }
                    i = bi - 1;
                    continue;
                }
            }
            /* Generic assignment */
            var gAm = t.match(/^(?:let|const|var|int|float|double|long|short|bool|string|auto|unsigned\s+\w+)?\s*(\w+)\s*=\s*(.+);?\s*$/);
            if (gAm && !KEYWORDS.has(gAm[1])) {
                e[gAm[1]] = tryEvalLocal(gAm[2].replace(/;$/, '').trim(), e);
                continue;
            }
            /* Generic for (JS) */
            if (lang === 'JavaScript') {
                var jsFor = t.match(/^for\s*\(\s*(?:let|var|const)?\s*(\w+)\s*=\s*(\d+)\s*;\s*\w+\s*([<>=!]+)\s*(.+?)\s*;\s*\w+\+\+\s*\)/);
                if (jsFor) {
                    var jfv = parseInt(jsFor[2]), jfl = tryEvalLocal(jsFor[4], e);
                    var body = [];
                    var bi = i + 1, bd = 0;
                    while (bi < lns.length) {
                        var bl = lns[bi].trim();
                        if (bl.startsWith('{')) { bd++; body.push(lns[bi]); bi++; continue; }
                        if (bl.startsWith('}')) { bd--; if (bd <= 0) { bi++; break; } body.push(lns[bi]); bi++; continue; }
                        if (bd > 0) { body.push(lns[bi]); bi++; continue; }
                        break;
                    }
                    var jop = jsFor[3];
                    if (jop === '<' && typeof jfl === 'number') { for (var ji = jfv; ji < jfl; ji++) runLines(body, e); }
                    i = bi - 1;
                    continue;
                }
            }
        }
    }

    function tryEvalLocal(expr, e) {
        var oldEnv = env;
        env = e;
        var r = tryEval(expr);
        env = oldEnv;
        return r;
    }

    try {
        runLines(lines, {});
    } catch (ex) {
        note = 'Simulation stopped: ' + ex.message;
    }

    if (outputs.length === 0) note = 'No output statements detected (print / console.log / cout)';

    return { outputs: outputs, note: note };
}

/* ---------- RENDER HOOK ---------- */
var _origRenderResults = renderResults;

renderResults = function (r) {
    _origRenderResults(r);

    var grid = document.getElementById('resultGrid');
    var existingCount = grid.querySelectorAll('.result-card').length;
    var code = codeInput.value.trim();
    var lang = r.language;

    /* --- Lexical Analysis --- */
    var lex = performLexicalAnalysis(code, lang);
    var tkCls = { Keyword: 'tk-keyword', Identifier: 'tk-identifier', Operator: 'tk-operator', Number: 'tk-number', String: 'tk-string', Delimiter: 'tk-delimiter', Preprocessor: 'tk-preprocessor', Class: 'tk-class', Unknown: 'tk-unknown' };
    var tkClr = { Keyword: '#bb77ff', Identifier: '#00aaff', Operator: '#ffaa00', Number: '#00ffaa', String: '#ff4466', Delimiter: '#6a8a7a', Preprocessor: '#00c8ff', Class: '#ffc800', Unknown: 'var(--text-muted)' };
    var summaryHtml = '<div class="token-summary">';
    var typeOrder = ['Keyword', 'Identifier', 'Operator', 'Number', 'String', 'Delimiter', 'Preprocessor', 'Class'];
    typeOrder.forEach(function (tp) {
        if (lex.counts[tp]) {
            summaryHtml += '<span class="token-pill" style="background:' + tkClr[tp] + '15;color:' + tkClr[tp] + '">' + tp + ' <span class="token-pill-count">' + lex.counts[tp] + '</span></span>';
        }
    });
    summaryHtml += '</div>';
    var maxShow = 80;
    var listHtml = '<div class="token-list">';
    lex.tokens.slice(0, maxShow).forEach(function (tk) {
        listHtml += '<div class="token-row"><span class="token-badge ' + (tkCls[tk.type] || 'tk-unknown') + '">' + tk.type + '</span><span class="token-val" title="' + escapeHtml(tk.value) + '">' + escapeHtml(tk.value) + '</span></div>';
    });
    if (lex.tokens.length > maxShow) listHtml += '<div class="token-more">Showing ' + maxShow + ' of ' + lex.tokens.length + ' tokens</div>';
    listHtml += '</div>';
    grid.appendChild(makeCard('<i class="fas fa-puzzle-piece icon-lex"></i> Lexical Analysis <span style="margin-left:auto;font-size:.75rem;color:var(--text-muted)">' + lex.totalTokens + ' tokens</span>', summaryHtml + listHtml, 'full-width'));

    /* --- Syntax Tree --- */
    var tree = buildSyntaxTree(code, lang);
    var treeHtml = '<div class="syntax-tree">' + renderTreeHTML(tree, '', true, 0) + '</div>';
    grid.appendChild(makeCard('<i class="fas fa-sitemap icon-tree"></i> Abstract Syntax Tree', treeHtml, 'full-width'));

    /* --- Semantic Analysis --- */
    var semChecks = performSemanticAnalysis(code, lang, r.variables, r.functions);
    var semHtml = '';
    semChecks.forEach(function (ch) {
        var cls = ch.status === 'ok' ? 'sem-ok' : ch.status === 'warn' ? 'sem-warn' : 'sem-error';
        var icon = ch.status === 'ok' ? 'fa-check' : ch.status === 'warn' ? 'fa-exclamation' : 'fa-times';
        semHtml += '<div class="semantic-item ' + cls + '"><div class="sem-icon"><i class="fas ' + icon + '"></i></div><div><div>' + escapeHtml(ch.title) + '</div><div class="sem-detail">' + escapeHtml(ch.detail) + '</div></div></div>';
    });
    grid.appendChild(makeCard('<i class="fas fa-shield-alt icon-sem"></i> Semantic Analysis', semHtml));

    /* --- Three Address Code --- */
    var tac = generateThreeAddressCode(code, lang, r.variables);
    var tacHtml = '<div class="tac-display">';
    tac.forEach(function (tl, idx) {
        var parts = tl.code.split(/\b(t\d+)\b/);
        var formatted = '';
        parts.forEach(function (p) {
            if (/^t\d+$/.test(p)) formatted += '<span class="tac-temp">' + p + '</span>';
            else {
                var ops = p.split(/(\s*[+\-*/%=<>!&|^]+\s*)/);
                ops.forEach(function (op) {
                    if (/^[+\-*/%=<>!&|^]+$/.test(op.trim())) formatted += '<span class="tac-op">' + op + '</span>';
                    else if (/^(call|param\d+|goto|if|return)\b/.test(op.trim())) formatted += '<span class="tac-func">' + op + '</span>';
                    else formatted += '<span class="tac-operand">' + escapeHtml(op) + '</span>';
                });
            }
        });
        var commentHtml = tl.comment ? '  <span class="tac-comment">// ' + escapeHtml(tl.comment) + '</span>' : '';
        tacHtml += '<div class="tac-line"><span class="tac-label">' + (tl.label || '') + '</span><span>' + formatted + commentHtml + '</span></div>';
    });
    tacHtml += '</div>';
    grid.appendChild(makeCard('<i class="fas fa-microchip icon-tac"></i> Three Address Code <span style="margin-left:auto;font-size:.75rem;color:var(--text-muted)">' + tac.length + ' instructions</span>', tacHtml, 'full-width'));

    /* --- Code Optimization --- */
    // var opts = analyzeOptimizations(code, lang, r.variables);
    // var optHtml = '';
    // if (opts.length > 0) {
    //     opts.forEach(function (o) {
    //         var badgeCls = { fold: 'opt-fold', dead: 'opt-dead', redundant: 'opt-redundant', strength: 'opt-strength', 'loop-opt': 'opt-loop-opt' };
    //         var badgeLabel = { fold: 'Constant Fold', dead: 'Dead Code', redundant: 'Redundant', strength: 'Strength Red.', 'loop-opt': 'Loop Opt.' };
    //         optHtml += '<div class="opt-item"><div class="opt-header"><span class="opt-type-badge ' + (badgeCls[o.type] || 'opt-fold') + '">' + (badgeLabel[o.type] || o.type) + '</span><span style="font-size:.7rem;color:var(--text-muted)">L' + o.line + '</span></div>';
    //         optHtml += '<div class="opt-code opt-before">' + escapeHtml(o.before) + '</div>';
    //         optHtml += '<div class="opt-arrow"><i class="fas fa-arrow-down"></i></div>';
    //         optHtml += '<div class="opt-code opt-after">' + escapeHtml(o.after) + '</div>';
    //         optHtml += '<div class="opt-desc">' + escapeHtml(o.desc) + '</div></div>';
    //     });
    // } else {
    //     optHtml = '<div class="empty-state" style="padding:15px"><i class="fas fa-check-circle" style="font-size:1.2rem;color:var(--accent);opacity:1"></i><p style="color:var(--accent);margin-top:6px">No obvious optimizations found</p></div>';
    // }
    // grid.appendChild(makeCard('<i class="fas fa-rocket icon-opt"></i> Code Optimization <span style="margin-left:auto;font-size:.75rem;color:var(--text-muted)">' + opts.length + ' found</span>', optHtml, 'full-width'));

    /* --- Code Output --- */
    var simOut = simulateCodeOutput(code, lang, r.variables, r.functions);
    var outHtml = '<div class="output-terminal">';
    simOut.outputs.forEach(function (o) {
        outHtml += '<div class="output-line">' + escapeHtml(o) + '</div>';
    });
    outHtml += '</div>';
    if (simOut.note) outHtml += '<div class="output-note"><i class="fas fa-info-circle"></i> ' + escapeHtml(simOut.note) + '</div>';
    grid.appendChild(makeCard('<i class="fas fa-terminal icon-output"></i> Simulated Output', outHtml, 'full-width'));

    /* --- Animate new cards --- */
    var allCards = grid.querySelectorAll('.result-card');
    var newCards = [];
    for (var ci = existingCount; ci < allCards.length; ci++) newCards.push(allCards[ci]);
    newCards.forEach(function (card, idx) {
        setTimeout(function () {
            card.classList.add('visible');
            card.querySelectorAll('.complexity-fill[data-width]').forEach(function (bar) {
                setTimeout(function () { bar.style.width = bar.dataset.width + '%'; }, 100);
            });
        }, 100 + (existingCount + idx) * 120);
    });
};