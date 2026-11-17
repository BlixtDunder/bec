import { chromium } from 'playwright';
const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 393, height: 852 } }); const p = await ctx.newPage();
const errors=[]; p.on('pageerror', e=>errors.push(e.message));
const B='http://localhost:4321/';
const seed = async (a) => p.evaluate((a) => { const k='bec-kyc-onboarding-v2'; const d=JSON.parse(localStorage.getItem(k)); d.answered=a; localStorage.setItem(k, JSON.stringify(d)); }, a);
const focused = () => p.evaluate(() => { const e = document.activeElement; const lab = e.getAttribute('aria-labelledby') ? document.getElementById(e.getAttribute('aria-labelledby'))?.textContent : (e.labels?.[0]?.textContent || e.getAttribute('aria-label') || e.textContent); const d = e.getAttribute('aria-describedby') ? e.getAttribute('aria-describedby').split(' ').map(i=>document.getElementById(i)?.textContent).join(' | ') : (e.closest('[aria-describedby]') ? document.getElementById(e.closest('[aria-describedby]').getAttribute('aria-describedby'))?.textContent : ''); return `${e.tagName.toLowerCase()}${e.type?'['+e.type+']':''} "${(lab||'').trim().slice(0,40)}" desc="${(d||'').trim()}"`; });
await p.goto(B+'?reset#/'); await p.waitForTimeout(400);
console.log('hub title:', await p.title());
// 1. heading focus after navigation
await p.click('ds-actions a'); await p.waitForTimeout(900);
console.log('after nav focus:', await p.evaluate(()=>document.activeElement.tagName+' '+document.activeElement.textContent.trim()), '| title:', await p.title());
// 2. error focus: Q2 empty -> first invalid
await seed(['q1']); await p.goto(B+'#/q/q2'); await p.reload(); await p.waitForTimeout(600);
await p.click('ds-actions button:has-text("Continue")'); await p.waitForTimeout(500);
console.log('q2 error focus:', await focused());
// Q3 checkbox group error
await seed(['q1','q2']); await p.goto(B+'#/q/q3'); await p.reload(); await p.waitForTimeout(600);
await p.click('ds-actions button:has-text("Continue")'); await p.waitForTimeout(500);
console.log('q3 error focus:', await focused());
// Q18: no preselection, disclosure semantics, error focus
await seed(['q1','q2','q3','q4','q5','q6','q7','q9','q8','q10','q11','q12','q13','q14','q15','q16','q17']); await p.goto(B+'#/q/q18'); await p.reload(); await p.waitForTimeout(600);
console.log('q18 checked radios:', await p.locator('input[type=radio]:checked').count(), '| toggle expanded:', await p.getAttribute('#statement-toggle','aria-expanded'));
await p.click('ds-actions button:has-text("Continue")'); await p.waitForTimeout(500);
console.log('q18 error focus:', await focused());
// keyboard: select with arrow keys and continue with Enter
await p.keyboard.press('Space'); await p.waitForTimeout(150);
console.log('after space checked:', await p.locator('input[type=radio]:checked').count());
// accessibility tree snapshot of q18 (role/name)
const snap = await p.locator('main').ariaSnapshot();
console.log('--- q18 a11y tree ---\n'+snap.split('\n').slice(0,40).join('\n'));
// 400% zoom ~ 320 css px: no horizontal scroll
await p.setViewportSize({ width: 320, height: 640 });
for (const u of ['#/q/q18','#/','#/q/q4']) { await p.goto(B+u); await p.waitForTimeout(500); console.log('reflow', u, await p.evaluate(()=>document.documentElement.scrollWidth <= window.innerWidth)); }
console.log('errors', JSON.stringify(errors));
await b.close();
