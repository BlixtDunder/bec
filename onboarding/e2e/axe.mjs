import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 393, height: 852 } }); const p = await ctx.newPage();
const B = 'http://localhost:4321/';
const seed = async (answered, completed=[]) => { await p.evaluate(([a,c]) => { const k='bec-kyc-onboarding-v2'; const d=JSON.parse(localStorage.getItem(k)); d.answered=a; d.completed=c; localStorage.setItem(k, JSON.stringify(d)); }, [answered, completed]); };
const ALL = ['q1','q2','q3','q4','q5','q6','q7','q9','q8','q10','q11','q12','q13','q14','q15','q16','q17','q18','q19'];
await p.goto(B+'?reset#/'); await p.waitForTimeout(500);
const results = {};
const scan = async (name) => { await p.waitForTimeout(700); const r = await new AxeBuilder({ page: p }).withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa','best-practice']).analyze(); for (const v of r.violations) { const k = v.id+' ['+v.impact+']'; (results[k] ??= {help:v.help, pages:new Set(), n:0, eg:v.nodes[0]?.target?.join(' ')+' :: '+(v.nodes[0]?.failureSummary||'').split('\n')[1]}); results[k].pages.add(name); results[k].n += v.nodes.length; } };
await scan('hub');
for (let i=0;i<ALL.length;i++) { await seed(ALL.slice(0,i), []); await p.goto(B+'#/q/'+ALL[i]); await p.reload(); await scan(ALL[i]); }
// error state on q2
await seed(['q1']); await p.goto(B+'#/q/q2'); await p.reload(); await p.waitForTimeout(500); await p.click('ds-actions button:has-text("Continue")'); await scan('q2-errors');
await seed(['q1','q2','q3']); await p.goto(B+'#/q/q4/country'); await p.reload(); await scan('tax-country');
await p.click('ds-actions button:has-text("Add country")'); await scan('tax-country-errors');
await seed(ALL, ['about','bank','money','docs','consents']); await p.goto(B+'#/review'); await p.reload(); await scan('review');
// leave dialog
await seed(['q1']); await p.goto(B+'#/q/q2'); await p.reload(); await p.waitForTimeout(500); await p.locator('ds-field').nth(1).click(); await p.keyboard.type('x'); await p.click('ds-task-bar button[aria-label="Close"]'); await scan('leave-dialog'); await p.keyboard.press('Escape'); await seed(ALL.slice(0,17)); await p.goto(B+'#/q/q18'); await p.reload(); await p.click('ds-disclosure button'); await scan('q18-collapsed'); await seed(ALL.slice(0,18)); await p.goto(B+'#/q/q19'); await p.reload(); await scan('q19'); await p.click('ds-disclosure button'); await scan('q19-collapsed');
for (const [k,v] of Object.entries(results)) console.log(k, '|', v.help, '| nodes', v.n, '| on', [...v.pages].join(','), '\n   eg', v.eg);
console.log('rules failing:', Object.keys(results).length);
await b.close();
