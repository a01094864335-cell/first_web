/** Focused client policy tests. No dependencies or DOM/browser simulation.
 * Extracts pure rendering and request helpers from the delivered script.
 * Run: node scripts/test-client.cjs
 */
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const {webcrypto} = require('node:crypto');
const source = fs.readFileSync(path.join(__dirname, '..', 'script.js'), 'utf8');
function section(start, end) {
  const a = source.indexOf(start), b = source.indexOf(end, a);
  assert(a >= 0 && b > a, `Client helper boundaries changed: ${start}`);
  return source.slice(a, b);
}
const requestSource = section('const retryStorageKey', 'async function refresh');
const memory = new Map();
const storage = {
  getItem: k => memory.get(k) || null,
  setItem: (k, v) => memory.set(k, v),
  removeItem: k => memory.delete(k),
};
let keys = [];
function client(uid, fetcher, store = storage) {
  return new Function('fetch', 'sessionStorage', 'crypto', 'AbortSignal', 'notify', 'state',
    `let offline=false; ${requestSource}; return api;`)(
      fetcher, store, webcrypto, globalThis.AbortSignal, () => {}, {user: {id: uid}});
}
const unavailableFetch = async (_url, options) => {
  keys.push(options.headers['Idempotency-Key']);
  throw new TypeError('Simulated network failure');
};
const successfulFetch = async (_url, options) => {
  keys.push(options.headers['Idempotency-Key']);
  return {ok: true, status: 200, json: async () => ({ok: true})};
};
async function testRetryPolicy() {
  await assert.rejects(() => client('userA', unavailableFetch)('buy', {id: 'item0'}));
  const original = keys[0];
  assert.equal(keys.length, 2, 'Exactly one automatic retry');
  assert.equal(keys[1], original, 'Automatic retry reuses key');
  assert.equal(memory.size, 1, 'Unresolved metadata saved');
  await client('userB', successfulFetch)('buy', {id: 'item0'});
  assert.notEqual(keys.at(-1), original, 'Different user cannot reuse key');
  await client('userA', successfulFetch)('buy', {id: 'item0'});
  assert.equal(keys.at(-1), original, 'Reload restores original key');
  assert.equal(memory.size, 0, 'Definitive success removes metadata');

  await assert.rejects(() => client('userA', unavailableFetch)('buy', {id: 'item1'}));
  await client('userA', successfulFetch)('logout', {});
  assert.equal(memory.size, 0, 'Successful logout clears pending metadata');

  const blockedStorage = {
    getItem() {throw Error('Storage disabled');},
    setItem() {throw Error('Storage disabled');},
    removeItem() {throw Error('Storage disabled');},
  };
  await assert.rejects(
    () => client('userA', unavailableFetch, blockedStorage)('buy', {id: 'item2'}),
    /새로고침하거나 닫지/,
    'Unavailable storage must warn against closing/reloading unresolved request',
  );

  let attempts = 0;
  const rejected = client('userA', async () => {
    attempts++;
    return {ok: false, status: 409, json: async () => ({error: 'already owned'})};
  });
  await assert.rejects(() => rejected('buy', {id: 'owned'}), /already owned/);
  assert.equal(attempts, 1, 'Definitive client errors are not automatically retried');
  assert.equal(memory.size, 0, 'Definitive rejection clears metadata');
}
function testQuestPolicy() {
  const render = new Function('state', 'esc', 'isStore',
    section('function questsView()', 'function characterView()') + ';return questsView();');
  const quests = [
    {id: 'paused', title: 'Paused', status: 'active', available: false},
    {id: 'completed', title: 'Completed', status: 'complete', available: false},
    {id: 'automatic', title: 'Automatic', status: 'active', kind: 'cumulative'},
    {id: 'rejected', title: 'Rejected', status: 'rejected', note: '직원 확인 필요'},
    {id: 'unavailable', title: 'Unavailable', status: 'unavailable'},
  ];
  const html = render({quests}, String, () => true);
  assert.doesNotMatch(html, /data-quest="paused"/, 'Paused progress has no action');
  assert.match(html, /data-quest="completed" data-qaction="claim"/, 'Completed reward stays claimable');
  assert.doesNotMatch(html, /data-quest="automatic"/, 'Cumulative progress is automatic');
  assert.match(html, /직원 확인 필요/, 'Rejection reason visible');
  assert.doesNotMatch(html, /data-quest="unavailable"/, 'Unavailable quest has no action');
}
(async () => {
  await testRetryPolicy();
  testQuestPolicy();
  console.log('PASS client retry persistence, user isolation, cleanup, warnings, and quest action policies');
})().catch(error => {console.error(error);process.exitCode = 1;});
