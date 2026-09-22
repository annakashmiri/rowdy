'use strict';
// Zero-dependency tests for the pure logic inside index.html (between the CORE markers).
// Run with: npm test
const assert = require('assert');
const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const m = html.match(/\/\*CORE-START\*\/([\s\S]*?)\/\*CORE-END\*\//);
if (!m) throw new Error('CORE markers not found in index.html');
const core = new Function(
  m[1] + '\nreturn {SPECS,generate,valuesFor,tsvCell,landingFor,applyParsed,newAd,normAd,matchOption,DEFAULT_ROWS};'
)();

let passed = 0;
function test(name, fn) {
  try { fn(); passed++; console.log('ok   ' + name); }
  catch (e) { process.exitCode = 1; console.error('FAIL ' + name + '\n     ' + e.message); }
}

const deal = (o = {}) => ({
  status: '', campaign: 'Payday September', service: 'Delivery', start: '2026-09-24', end: '2026-09-30',
  ongoing: false, code: '089794', landing: '', cta: 'Order Now', folder: 'MY Payday Sep',
  audience: '', rule: '', notes: '', ...o
});
const ad = (o = {}) => core.normAd({
  name: 'Static',
  meta: { headline: '3 Pizzas for RM39', primary_text: 'Payday is here.', description: 'Order now' },
  tiktok: { primary_text: '3 pizzas for RM39.' },
  youtube: { headline: '3 Pizzas for RM39', long_headline: 'Payday pizza deal', description: 'Order today!' },
  search: { headlines: ['A headline', 'Another one'], descriptions: ['A description'] },
  ...o
});
const cells = (pk, d, ads, row) => core.generate(pk, d, ads, row).arrays;

test('every tab has the column count the sheet has', () => {
  const n = k => core.SPECS[k].length;
  assert.deepStrictEqual([n('meta'), n('tiktok'), n('youtube'), n('search')], [20, 17, 22, 49]);
});

test('rows are as wide as the sheet and length columns are LEN formulas for the right row', () => {
  const r = cells('meta', deal(), [ad(), ad()], 274);
  assert.strictEqual(r[0].length, 20);
  assert.strictEqual(r[0][8], '=LEN(H274)');   // I
  assert.strictEqual(r[1][10], '=LEN(J275)');  // K, second row
});

test('values land in the right columns (Meta)', () => {
  const r = cells('meta', deal(), [ad()], 274)[0];
  assert.strictEqual(r[1], 'Payday September');       // B
  assert.strictEqual(r[2], 'Static');                 // C
  assert.strictEqual(r[7], '3 Pizzas for RM39');      // H
  assert.strictEqual(r[13], 'https://order.dominos.com.my/?vc=089794'); // N
  assert.strictEqual(r[15], 'Order Now');             // P
  assert.strictEqual(r[16], 'MY Payday Sep');         // Q
  assert.strictEqual(r[0], '');                       // A: CoE column stays blank
  assert.strictEqual(r[17], '');                      // R: preview links stay blank
});

test('values land in the right columns (TikTok, YouTube, Search)', () => {
  const t = cells('tiktok', deal(), [ad()], 199)[0];
  assert.strictEqual(t[7], '3 pizzas for RM39.'); assert.strictEqual(t[9], 'https://order.dominos.com.my/?vc=089794'); assert.strictEqual(t[10], 'Order Now');
  const y = cells('youtube', deal(), [ad()], 88)[0];
  assert.strictEqual(y[9], 'Payday pizza deal'); assert.strictEqual(y[13], 'https://order.dominos.com.my/?vc=089794'); assert.strictEqual(y[14], 'Order Now');
  const s = cells('search', deal(), [ad()], 45)[0];
  assert.strictEqual(s[7], 'A headline'); assert.strictEqual(s[9], 'Another one'); assert.strictEqual(s[37], 'A description'); assert.strictEqual(s[45], 'https://order.dominos.com.my/?vc=089794');
  assert.strictEqual(s[12], '=LEN(L45)');  // column M: Headline 3 is empty but its LEN formula is still written
});

test('voucher code keeps its leading zero and a typed landing page wins', () => {
  assert.strictEqual(core.landingFor(deal()), 'https://order.dominos.com.my/?vc=089794');
  assert.strictEqual(core.landingFor(deal({ code: '' })), 'https://order.dominos.com.my/');
  assert.strictEqual(core.landingFor(deal({ landing: 'https://example.com/x' })), 'https://example.com/x');
});

test('ongoing deals write "Ongoing" in the end-date column', () => {
  assert.strictEqual(cells('meta', deal({ ongoing: true, end: '' }), [ad()], 274)[0][5], 'Ongoing');
});

test('tab-separated output quotes cells with newlines, tabs and quotes', () => {
  assert.strictEqual(core.tsvCell('plain'), 'plain');
  assert.strictEqual(core.tsvCell('a\nb'), '"a\nb"');
  assert.strictEqual(core.tsvCell('say "hi"'), '"say ""hi"""');
});

test('warnings: over limit, emoji on TikTok, formula-like start, missing basics', () => {
  const bad = ad({ name: 'Bad', meta: { headline: 'This headline is far too long for Meta', primary_text: '-50% off' }, tiktok: { primary_text: 'Deal 🍕' } });
  const meta = core.generate('meta', deal(), [bad], 274).warnings.map(w => w.m).join('|');
  assert.ok(/over the 25 limit/.test(meta)); assert.ok(/formula/.test(meta));
  assert.ok(/emoji/.test(core.generate('tiktok', deal(), [bad], 199).warnings.map(w => w.m).join('|')));
  const empty = core.generate('meta', deal({ campaign: '', start: '' }), [core.newAd()], 274).warnings.map(w => w.m).join('|');
  assert.ok(/Campaign name is empty/.test(empty) && /Start date is empty/.test(empty) && /no ad name/.test(empty));
});

test('warns when the end date is before the start date', () => {
  const w = core.generate('meta', deal({ start: '2026-09-30', end: '2026-09-24' }), [ad()], 274).warnings.map(w => w.m).join('|');
  assert.ok(/before the start date/.test(w));
});

test('AI reply: messy output is cleaned, junk is ignored', () => {
  const state = { platforms: { meta: false, tiktok: false, youtube: false, search: false }, deal: deal({ campaign: '', service: '', start: '', end: '', cta: '' }), ads: [core.newAd()] };
  const notes = core.applyParsed(state, {
    campaign_name: '  Boost Week ', service_method: 'delivery', start_date: '2026-09-17', end_date: '27 Sept',
    cta: 'order now', platforms: ['Meta', 'facebook', 'TikTok'], landing_page: 'not a url',
    ads: [{ name: 'Static' }, { name: 'Video' }], unclear: ['Check the year', ' ']
  });
  assert.strictEqual(state.deal.campaign, 'Boost Week');
  assert.strictEqual(state.deal.service, 'Delivery');
  assert.strictEqual(state.deal.end, '');          // "27 Sept" is not ISO, so it is ignored
  assert.strictEqual(state.deal.landing, '');      // not a URL, ignored
  assert.strictEqual(state.deal.cta, 'Order Now');
  assert.deepStrictEqual(state.platforms, { meta: true, tiktok: true, youtube: false, search: false });
  assert.strictEqual(state.ads.length, 2);
  assert.deepStrictEqual(notes, ['Check the year']);
});

test('AI reply: garbage does not throw', () => {
  const state = { platforms: { meta: false }, deal: deal(), ads: [core.newAd()] };
  assert.deepStrictEqual(core.applyParsed(state, null), []);
  assert.deepStrictEqual(core.applyParsed(state, 'hello'), []);
  assert.deepStrictEqual(core.applyParsed(state, { ads: 'x', platforms: 'y' }), []);
});

console.log(`\n${passed} passed${process.exitCode ? ', some FAILED' : ''}`);
