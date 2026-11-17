import { chromium } from 'playwright';

// End-to-end regression for the KYC onboarding prototype (served on :4321).
const B = 'http://localhost:4321/';
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 393, height: 852 } });
const p = await ctx.newPage();
const errors = [];
p.on('pageerror', (e) => errors.push(e.message));
const fails = [];
const check = (name, ok, got) => { if (!ok) fails.push(`${name}: ${JSON.stringify(got)}`); };
const path = () => p.url().split('#')[1];
const errs = () => p.locator('[data-error]').allTextContents();
const wait = (ms = 600) => p.waitForTimeout(ms);
const primary = () => p.locator('ds-actions button').first();
const stored = () => p.evaluate(() => JSON.parse(localStorage.getItem('bec-kyc-onboarding-v2')));
const pick = async (i, text) => { await p.locator('ds-field').nth(i).click(); await p.keyboard.type(text); await p.keyboard.press('Enter'); await wait(300); };
const type = async (i, text) => { await p.locator('ds-field').nth(i).click(); await p.keyboard.type(text); };

// Fresh, empty start via the logo
await p.goto(B + '?reset#/'); await wait();
await p.click('ds-brand-header .logo'); await wait(300);
check('get started label', (await p.locator('ds-actions a').innerText()).trim() === 'Get started', await p.locator('ds-actions a').innerText());

// Forced order: deep link ahead redirects
await p.goto(B + '#/q/q7'); await wait(800);
check('deep link redirect', path() === '/q/q1', path());

// Q1 (bank contact details kept) -> Q2
await primary().click(); await wait();
check('q1 -> q2', path() === '/q/q2', path());
// Q2 validation then fill
await primary().click(); await wait(300);
check('q2 errors', (await errs()).length === 2, await errs());
await pick(0, 'Den'); await type(1, 'Odense');
await primary().click(); await wait();
// Q3
await primary().click(); await wait(300);
check('q3 error', (await errs())[0] === 'Choose at least one country', await errs());
await p.locator('mat-checkbox', { hasText: 'Denmark' }).first().click();
await primary().click(); await wait();
check('q4 reached', path() === '/q/q4', path());
// Q4: yes + yes without countries is blocked
await p.locator('ds-radio-card').first().locator('mat-radio-button').first().click();
await p.locator('ds-radio-card').nth(1).locator('mat-radio-button').first().click(); await wait(300);
await primary().click(); await wait(300);
check('q4 needs country', (await errs()).includes('Add at least one tax country'), await errs());
// Add Sweden with an invalid then valid TIN
await p.click('.add-country'); await wait();
await p.click('ds-actions button:has-text("Add country")'); await wait(300);
check('add empty errors', (await errs()).length === 2, await errs());
await pick(0, 'Swe'); await type(1, '1985-01');
await p.click('ds-actions button:has-text("Add country")'); await wait(300);
check('bad tin', (await errs())[0]?.startsWith('Swedish TINs have 12 digits'), await errs());
await p.locator('ds-field').nth(1).click(); await p.keyboard.press('End'); await p.keyboard.type('01-1234');
await p.click('ds-actions button:has-text("Add country")'); await wait();
// Add Norway without TIN
await p.click('.add-country'); await wait();
await pick(0, 'Nor');
await p.click("text=I don't have a TIN for Norway");
await p.click("text=I haven't received one yet");
await p.locator('ds-field', { hasText: 'Tell us why' }).click(); await p.keyboard.type('Moved in October');
await p.click('ds-actions button:has-text("Add country")'); await wait();
check('two tax rows', (await p.locator('.country-row').count()) === 2, await p.locator('.country-row').count());
// Remove Sweden, undo
await p.locator('.country-row', { hasText: 'Sweden' }).click(); await wait();
await p.click('button:has-text("Remove country")'); await wait(700);
check('removed', (await p.locator('.country-row').count()) === 1, await p.locator('.country-row').count());
await p.click('.mat-mdc-snack-bar-container button:has-text("Undo")'); await wait(400);
check('undo', (await p.locator('.country-row').count()) === 2, await p.locator('.country-row').count());
// Nothing saved until the section completes
check('not saved mid-section', (await stored()).completed.length === 0, (await stored()).completed);
check('complete label', (await primary().innerText()).trim() === 'Complete section', await primary().innerText());
await primary().click(); await wait();
const s1 = await stored();
check('about saved', s1.completed.includes('about') && s1.answers.taxCountries.length === 2, s1.completed);

// Leave dialog: change something in the next section, then leave
await p.click('ds-actions a'); await wait();
check('next section', path() === '/q/q5', path());
await p.locator('mat-checkbox').first().click();
await p.click('ds-task-bar button[aria-label="Close"]'); await wait(500);
check('leave dialog', (await p.locator('ds-leave-dialog').count()) === 1, 0);
check('dialog name', (await p.locator('[role="alertdialog"]').getAttribute('aria-labelledby')) === 'leave-title', null);
await p.click('ds-leave-dialog button:has-text("Leave without saving")'); await wait();
check('left to hub', path() === '/', path());
check('discarded', (await stored()).answers.usage.length === 0, (await stored()).answers.usage);

// Connections abroad (seed the bank section up to Q8)
await p.evaluate(() => { const k = 'bec-kyc-onboarding-v2'; const d = JSON.parse(localStorage.getItem(k)); d.answered = ['q1','q2','q3','q4','q5','q6','q7','q9']; d.answers.connectionCountries = []; d.answers.connections = 'yes'; localStorage.setItem(k, JSON.stringify(d)); });
await p.goto(B + '#/q/q8'); await p.reload(); await wait(800);
await primary().click(); await wait(300);
check('q8 needs country', (await errs()).includes('Add at least one country'), await errs());
await p.click('.add-country'); await wait();
await pick(0, 'Ger');
await p.locator('mat-checkbox', { hasText: 'Family' }).click();
await type(1, 'Cousins in Berlin');
await p.click('ds-actions button:has-text("Add country")'); await wait();
check('connection row', (await p.locator('.country-row').allInnerTexts())[0]?.startsWith('Germany'), await p.locator('.country-row').allInnerTexts());

// Consent: nothing preselected, required
await p.evaluate(() => { const k = 'bec-kyc-onboarding-v2'; const d = JSON.parse(localStorage.getItem(k)); d.answered = ['q1','q2','q3','q4','q5','q6','q7','q9','q8','q10','q11','q12','q13','q14','q15','q16','q17']; localStorage.setItem(k, JSON.stringify(d)); });
await p.goto(B + '#/q/q18'); await p.reload(); await wait(800);
check('consent not preselected', (await p.locator('input[type=radio]:checked').count()) === 0, 'checked');
await primary().click(); await wait(300);
check('consent required', (await errs())[0] === 'Choose an answer', await errs());

// Review blocks sending while answers are missing
await p.goto(B + '?reset#/review'); await wait(800);
await p.click('ds-actions button:has-text("Send to the bank")'); await wait(600);
check('send blocked', path() === '/review' && (await p.locator('.missing').count()) > 0, path());

console.log(fails.length ? 'FAIL\n' + fails.join('\n') : 'ALL PASS');
console.log('errors', JSON.stringify(errors));
await b.close();
