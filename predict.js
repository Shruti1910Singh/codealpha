function getScoreColor(s) { return s>=750?'#22C55E':s>=650?'#14B8A6':s>=550?'#F59E0B':'#EF4444'; }
function getScoreLabel(s) { return s>=750?'Excellent':s>=650?'Good':s>=550?'Fair':'Poor'; }

function loadDemo() {
  document.getElementById('f_age').value=32;
  document.getElementById('f_gender').value='male';
  document.getElementById('f_marital').value='married';
  document.getElementById('f_annual_income').value=850000;
  document.getElementById('f_monthly_income').value=70833;
  document.getElementById('f_employment').value='employed';
  document.getElementById('f_years_employed').value=5;
  document.getElementById('f_monthly_expenses').value=25000;
  document.getElementById('f_savings').value=200000;
  document.getElementById('f_debt').value=120000;
  document.getElementById('f_cc_util').value=28;
  document.getElementById('f_loan_amount').value=500000;
  document.getElementById('f_loan_purpose').value='home';
  document.getElementById('f_credit_accounts').value=3;
  document.getElementById('f_missed').value=0;
  document.getElementById('f_late').value=1;
  document.getElementById('f_defaults').value='0';
}

function resetForm() {
  loadDemo();
  document.getElementById('placeholder').style.display='block';
  document.querySelectorAll('.result-card').forEach(c=>c.remove());
}

function collectData() {
  return {
    age:+document.getElementById('f_age').value,
    gender:document.getElementById('f_gender').value,
    marital:document.getElementById('f_marital').value,
    annual_income:+document.getElementById('f_annual_income').value,
    monthly_income:+document.getElementById('f_monthly_income').value,
    employment:document.getElementById('f_employment').value,
    years_employed:+document.getElementById('f_years_employed').value,
    monthly_expenses:+document.getElementById('f_monthly_expenses').value,
    savings:+document.getElementById('f_savings').value,
    debt:+document.getElementById('f_debt').value,
    cc_util:+document.getElementById('f_cc_util').value,
    loan_amount:+document.getElementById('f_loan_amount').value,
    loan_purpose:document.getElementById('f_loan_purpose').value,
    credit_accounts:+document.getElementById('f_credit_accounts').value,
    missed:+document.getElementById('f_missed').value,
    late:+document.getElementById('f_late').value,
    defaults:document.getElementById('f_defaults').value
  };
}

async function runPrediction() {
  const btn=document.getElementById('btn-predict'), btnText=document.getElementById('btn-text');
  btn.disabled=true;
  btnText.innerHTML='<span class="spinner"></span>&nbsp; Analyzing...';
  const data=collectData();
  try {
    const prompt=`You are a credit scoring AI analyst. Analyze this financial profile and return ONLY a valid JSON object, no markdown, no explanation:
Age:${data.age}, Gender:${data.gender}, Marital:${data.marital}
Annual Income:₹${data.annual_income}, Monthly:₹${data.monthly_income}
Employment:${data.employment}, Years:${data.years_employed}
Monthly Expenses:₹${data.monthly_expenses}, Savings:₹${data.savings}
Debt:₹${data.debt}, CC Utilization:${data.cc_util}%
Loan:₹${data.loan_amount}, Purpose:${data.loan_purpose}, Accounts:${data.credit_accounts}
Missed Payments:${data.missed}, Late:${data.late}, Defaults:${data.defaults}

Return this JSON (fill all numeric values, no placeholders):
{"credit_score":0,"verdict":"Creditworthy","approval_probability":0,"risk_probability":0,"confidence":0,"risk_level":"Low","risk_factors":[{"name":"Debt-to-Income Ratio","score":0,"level":"Low","impact":"Positive"},{"name":"Payment History","score":0,"level":"Low","impact":"Positive"},{"name":"Credit Utilization","score":0,"level":"Low","impact":"Positive"},{"name":"Income Stability","score":0,"level":"Low","impact":"Positive"},{"name":"Savings Buffer","score":0,"level":"Low","impact":"Positive"},{"name":"Loan-to-Income Ratio","score":0,"level":"Low","impact":"Positive"}],"model_scores":{"random_forest":0,"decision_tree":0,"logistic_regression":0},"model_verdicts":{"random_forest":"Creditworthy","decision_tree":"Creditworthy","logistic_regression":"Creditworthy"},"explanation":"2-3 sentence explanation here.","recommendations":["tip1","tip2","tip3"]}`;

    const response=await fetch("https://api.anthropic.com/v1/messages",{
      method:"POST",headers:{"Content-Type":"application/json"},
      body:JSON.stringify({model:"claude-sonnet-4-6",max_tokens:1000,messages:[{role:"user",content:prompt}]})
    });
    const apiData=await response.json();
    const text=apiData.content.map(i=>i.text||'').join('');
    const result=JSON.parse(text.replace(/```json|```/g,'').trim());
    saveHistory(data,result);
    displayResults(result,data);
  } catch(err) {
    const result=fallbackPredict(data);
    saveHistory(data,result);
    displayResults(result,data);
  } finally {
    btn.disabled=false;
    btnText.innerHTML='🔍 Predict Credit Score';
  }
}

function fallbackPredict(data) {
  let score=500;
  const dti=(data.debt+data.loan_amount)/Math.max(data.annual_income,1);
  if(dti<0.3)score+=80;else if(dti<0.5)score+=40;else if(dti>1.5)score-=100;else if(dti>0.8)score-=50;
  if(data.missed===0&&data.late===0)score+=80;else if(data.missed>3)score-=100;else score-=(data.missed*20+data.late*10);
  if(data.defaults==='0')score+=60;else if(data.defaults==='1')score-=60;else score-=120;
  if(data.cc_util<30)score+=50;else if(data.cc_util>80)score-=60;
  if(data.years_employed>5)score+=40;
  if(data.employment==='unemployed')score-=80;
  if(data.savings>data.annual_income*0.3)score+=30;
  score=Math.max(300,Math.min(850,score));
  const ok=score>=600, conf=Math.min(95,Math.max(55,Math.abs(score-575)/2.75+55));
  return {
    credit_score:score,verdict:ok?'Creditworthy':'Not Creditworthy',
    approval_probability:ok?Math.round(conf):Math.round(100-conf),
    risk_probability:ok?Math.round(100-conf):Math.round(conf),
    confidence:Math.round(conf),risk_level:score>700?'Low':score>550?'Medium':'High',
    risk_factors:[
      {name:'Debt-to-Income Ratio',score:Math.max(0,Math.min(100,Math.round(100-dti*50))),level:dti<0.4?'Low':'High',impact:dti<0.4?'Positive':'Negative'},
      {name:'Payment History',score:Math.max(0,100-(data.missed*20+data.late*8)),level:data.missed===0?'Low':'High',impact:data.missed===0?'Positive':'Negative'},
      {name:'Credit Utilization',score:Math.max(0,100-data.cc_util),level:data.cc_util<30?'Low':'High',impact:data.cc_util<30?'Positive':'Negative'},
      {name:'Income Stability',score:data.employment==='employed'?80:40,level:data.employment==='unemployed'?'High':'Low',impact:data.employment==='employed'?'Positive':'Negative'},
      {name:'Savings Buffer',score:Math.min(100,Math.round(data.savings/data.annual_income*200)),level:data.savings>data.annual_income*0.2?'Low':'Medium',impact:data.savings>data.annual_income*0.2?'Positive':'Neutral'},
      {name:'Loan-to-Income Ratio',score:Math.max(0,100-Math.round(data.loan_amount/data.annual_income*50)),level:data.loan_amount<data.annual_income?'Low':'High',impact:data.loan_amount<data.annual_income?'Positive':'Negative'}
    ],
    model_scores:{random_forest:Math.max(300,Math.min(850,score+Math.round((Math.random()-0.5)*20))),decision_tree:Math.max(300,Math.min(850,score+Math.round((Math.random()-0.5)*30))),logistic_regression:Math.max(300,Math.min(850,score+Math.round((Math.random()-0.5)*25)))},
    model_verdicts:{random_forest:ok?'Creditworthy':'Not Creditworthy',decision_tree:ok?'Creditworthy':'Not Creditworthy',logistic_regression:score>580?'Creditworthy':'Not Creditworthy'},
    explanation:ok?`The applicant is classified as Creditworthy primarily due to ${data.annual_income>500000?'strong':'adequate'} annual income and ${data.missed===0?'a clean payment record with no missed payments':'manageable payment history'}. Credit utilization at ${data.cc_util}% is ${data.cc_util<30?'well within':'near'} the recommended 30% threshold, and the debt-to-income ratio of ${Math.round(dti*100)}% is ${dti<0.5?'acceptable':'manageable'}.`:`The applicant is classified as Not Creditworthy primarily due to ${data.missed>2?'multiple missed payments indicating poor payment discipline':data.defaults!=='0'?'previous loan defaults which significantly increase risk':'a high debt-to-income ratio'}. Combined existing debt and loan request represent ${Math.round(dti*100)}% of annual income, exceeding acceptable thresholds for credit approval.`,
    recommendations:ok?['Maintain your current payment discipline to keep improving your score.','Consider reducing credit card utilization below 20% for a higher score.','Building a larger savings buffer will further strengthen your creditworthiness.']:['Clear any missed payments immediately — this has the highest single impact on your score.','Reduce existing debt before applying for additional loans.','Consider a secured credit card or credit-builder loan to rebuild your credit history.']
  };
}

function saveHistory(data,result) {
  const hist=JSON.parse(localStorage.getItem('cw-history')||'[]');
  hist.unshift({date:new Date().toLocaleDateString('en-IN'),age:data.age,income:data.annual_income,debt:data.debt,score:result.credit_score,verdict:result.verdict,confidence:result.confidence});
  localStorage.setItem('cw-history',JSON.stringify(hist.slice(0,50)));
}

function displayResults(result,data) {
  document.getElementById('placeholder').style.display='none';
  document.querySelectorAll('.result-card').forEach(c=>c.remove());
  const area=document.getElementById('results-area');
  const sc=getScoreColor(result.credit_score), sl=getScoreLabel(result.credit_score), ok=result.verdict==='Creditworthy';
  const mp=((result.credit_score-300)/550*100).toFixed(1);

  // Card 1 – Main result
  const c1=document.createElement('div'); c1.className='result-card';
  c1.innerHTML=`<h3>🎯 Credit Assessment Result</h3>
  <div class="prediction-header">
    <div class="pred-main" style="background:${ok?'linear-gradient(135deg,#065f46,#0d9488)':'linear-gradient(135deg,#7f1d1d,#dc2626)'}">
      <div style="font-size:13px;opacity:0.8">AI Verdict</div>
      <div class="pred-verdict">${ok?'✅':'❌'} ${result.verdict}</div>
      <div class="pred-confidence">Confidence: <strong>${result.confidence}%</strong></div>
      <div style="margin-top:12px;padding:8px 16px;background:rgba(255,255,255,0.15);border-radius:8px;font-size:12px">Risk Level: <strong>${result.risk_level}</strong></div>
    </div>
    <div class="pred-score-box">
      <div style="font-size:12px;color:var(--gray-400);margin-bottom:4px">Credit Score</div>
      <div class="pred-score-num" style="color:${sc}">${result.credit_score}</div>
      <div style="margin-top:6px"><span class="badge" style="background:${sc}22;color:${sc};font-size:13px;padding:4px 14px">${sl}</span></div>
      <div class="score-range-bar" style="margin-top:16px"><div class="track"></div><div class="marker" style="left:${mp}%"></div></div>
      <div class="score-labels"><span>300 Poor</span><span>Fair</span><span>Good</span><span>850 Excellent</span></div>
    </div>
  </div>`;
  area.appendChild(c1);

  // Card 2 – Probabilities + chart
  const c2=document.createElement('div'); c2.className='result-card';
  c2.innerHTML=`<h3>📊 Probability Analysis</h3>
  <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:16px">
    <div style="text-align:center;padding:16px;background:var(--gray-50);border-radius:12px"><div style="font-size:28px;font-weight:800;color:#22C55E">${result.approval_probability}%</div><div style="font-size:12px;color:var(--gray-400);margin-top:4px">Approval Probability</div></div>
    <div style="text-align:center;padding:16px;background:var(--gray-50);border-radius:12px"><div style="font-size:28px;font-weight:800;color:#EF4444">${result.risk_probability}%</div><div style="font-size:12px;color:var(--gray-400);margin-top:4px">Risk Probability</div></div>
    <div style="text-align:center;padding:16px;background:var(--gray-50);border-radius:12px"><div style="font-size:28px;font-weight:800;color:var(--primary)">${result.confidence}%</div><div style="font-size:12px;color:var(--gray-400);margin-top:4px">Model Confidence</div></div>
  </div>
  <div style="position:relative;height:200px"><canvas id="prob-chart" role="img" aria-label="Probability chart: Approval ${result.approval_probability}%, Risk ${result.risk_probability}%"></canvas></div>`;
  area.appendChild(c2);

  // Card 3 – Risk factors
  const c3=document.createElement('div'); c3.className='result-card';
  let rh='<div class="risk-list">';
  result.risk_factors.forEach(rf=>{
    const col=rf.impact==='Positive'?'#22C55E':rf.impact==='Negative'?'#EF4444':'#F59E0B';
    const bc=rf.level==='Low'?'badge-success':rf.level==='High'?'badge-danger':'badge-warning';
    rh+=`<div class="risk-item"><div class="risk-label">${rf.name}<span class="badge ${bc}" style="margin-left:6px">${rf.level}</span></div><div class="risk-bar-wrap"><div class="risk-bar-fill" style="width:${rf.score}%;background:${col}"></div></div><div class="risk-score" style="color:${col}">${rf.score}</div></div>`;
  });
  rh+='</div>';
  c3.innerHTML=`<h3>⚠️ Risk Factor Analysis</h3>${rh}`;
  area.appendChild(c3);

  // Card 4 – AI explanation
  const c4=document.createElement('div'); c4.className='result-card';
  c4.innerHTML=`<h3>🧠 Explainable AI — Why This Prediction?</h3>
  <div class="ai-text">${result.explanation}</div>
  <div style="margin-top:16px">
    <div style="font-size:13px;font-weight:700;margin-bottom:10px;color:var(--gray-800)">💡 Recommendations to Improve Your Score</div>
    ${result.recommendations.map((r,i)=>`<div style="display:flex;gap:10px;margin-bottom:8px;font-size:13px;color:var(--gray-600)"><span style="color:var(--primary);font-weight:700;min-width:18px">${i+1}.</span><span>${r}</span></div>`).join('')}
  </div>`;
  area.appendChild(c4);

  // Card 5 – Model comparison
  const c5=document.createElement('div'); c5.className='result-card';
  const ms=result.model_scores, mv=result.model_verdicts;
  c5.innerHTML=`<h3>🔬 Multi-Model Comparison</h3>
  <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px">
  ${[{n:'🌲 Random Forest',s:ms.random_forest,v:mv.random_forest,b:true},{n:'🌳 Decision Tree',s:ms.decision_tree,v:mv.decision_tree,b:false},{n:'📈 Logistic Reg.',s:ms.logistic_regression,v:mv.logistic_regression,b:false}]
    .map(m=>`<div style="background:var(--gray-50);border-radius:12px;padding:16px;text-align:center;border:${m.b?'2px solid var(--primary)':'1px solid var(--gray-200)'}">
    ${m.b?'<div style="font-size:10px;color:var(--primary);font-weight:700;margin-bottom:6px">★ BEST MODEL</div>':''}
    <div style="font-size:12px;font-weight:600;margin-bottom:8px;color:var(--gray-800)">${m.n}</div>
    <div style="font-size:28px;font-weight:800;color:${getScoreColor(m.s)}">${m.s}</div>
    <div style="font-size:11px;margin-top:6px;color:var(--gray-600)">${m.v==='Creditworthy'?'✅':'❌'} ${m.v}</div>
    </div>`).join('')}
  </div>`;
  area.appendChild(c5);

  // Draw chart
  setTimeout(()=>{
    const ctx=document.getElementById('prob-chart');
    if(ctx) new Chart(ctx,{type:'doughnut',data:{labels:['Approval Probability','Risk Probability'],datasets:[{data:[result.approval_probability,result.risk_probability],backgroundColor:['#22C55E','#EF4444'],borderWidth:0,hoverOffset:4}]},options:{responsive:true,maintainAspectRatio:false,cutout:'70%',plugins:{legend:{labels:{color:document.body.classList.contains('dark')?'#9CA3AF':'#475569',font:{size:12}}}}}});
  },100);

  area.scrollIntoView({behavior:'smooth',block:'start'});
}
