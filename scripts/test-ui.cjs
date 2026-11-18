// DOM behavior checks, not browser layout/visual QA. Run after npm ci.
const { JSDOM } = require("jsdom");
const fs = require("node:fs"),
  path = require("node:path"),
  assert = require("node:assert/strict");
const root = path.resolve(__dirname, "..");
const delay = (ms) => new Promise((r) => setTimeout(r, ms));
(async () => {
  const dom = new JSDOM(
    fs.readFileSync(path.join(root, "index.html"), "utf8"),
    {
      url: "http://localhost/?demo=1&entry=cafe",
      runScripts: "outside-only",
      pretendToBeVisual: true,
    },
  );
  const w = dom.window;
  let networkCalls = 0;
  w.fetch = () => {
    networkCalls++;
    throw Error("Demo must never call network");
  };
  w.HTMLDialogElement.prototype.showModal = function () {
    this.open = true;
  };
  w.HTMLDialogElement.prototype.close = function () {
    this.open = false;
  };
  w.eval(
    fs
      .readFileSync(path.join(root, "demo-api.js"), "utf8")
      .replace("export async function demoApi", "async function demoApi") +
      "\nwindow.__demoApi=demoApi;",
  );
  w.__qrcode = (
    await import(
      require("node:url").pathToFileURL(
        path.join(root, "public/assets/vendor/qrcode.mjs"),
      ).href
    )
  ).default;
  const source = fs
    .readFileSync(path.join(root, "script.js"), "utf8")
    .replace('(await import("./demo-api.js")).demoApi', "window.__demoApi")
    .replace(
      'await import("./public/assets/vendor/qrcode.mjs")',
      "({default:window.__qrcode})",
    );
  await w.eval("(async()=>{" + source + "})()");
  const get = (s) => {
    const el = w.document.querySelector(s);
    assert.ok(el, "Missing " + s);
    return el;
  };
  const click = async (s) => {
    get(s).click();
    await delay(30);
  };
  const submit = async (s) => {
    get(s).dispatchEvent(
      new w.Event("submit", { bubbles: true, cancelable: true }),
    );
    await delay(40);
  };
  const fill = (s, value) => {
    get(s).value = value;
  };
  assert.equal(get("#demo-banner").hidden, false);
  await click('[data-action="onboard"]');
  fill('[name="nickname"]', "DOM 테스트");
  await submit("#onboard");
  assert.match(get("header").textContent, /매장 모드/);
  await click('[data-action="close"]');
  await click('[data-page="quests"]');
  await click('[data-qaction="claim"]');
  assert.match(get(".coin").textContent, /20/);
  await click('[data-page="character"]');
  await click('[data-tab="shop"]');
  await click('[data-item="item3"]');
  await click('[data-buy="item3"]');
  await click('[data-item="item3"]');
  assert.ok(get(".wardrobe-preview .prop"));
  await click('[data-action="account"]');
  await click('[data-demo-kakao="new"]');
  await click('[data-page="cafe"]');
  await click('[data-action="stamps"]');
  assert.ok(get('[data-action="demo-stamp-code"]'));
  await click('[data-action="demo-stamp-code"]');
  assert.match(get("#sheet").textContent, /데모/);
  await click('[data-action="close"]');
  const customer = (await w.__demoApi("state")).user.id;
  const role = get("#demo-role");
  role.value = "admin";
  role.dispatchEvent(new w.Event("change", { bubbles: true }));
  await delay(40);
  await click('[data-action="profile"]');
  await click('[data-action="account"]');
  await click('[data-action="staff"]');
  assert.match(get("#sheet").textContent, /운영자 대시보드/);
  assert.ok(get('[data-op="grant"]'));
  await click('[data-op="grant"]');
  fill('#operation [name="uid"]', customer);
  fill('#operation [name="amount"]', "12");
  fill('#operation [name="source_ref"]', "DOM-order");
  fill('#operation [name="reason"]', "데모 적립 검사");
  await submit("#operation");
  await click('[data-action="confirm-operation"]');
  role.value = "customer";
  role.dispatchEvent(new w.Event("change", { bubbles: true }));
  await delay(40);
  await click('[data-action="stamps"]');
  await click('[data-action="redeem"]');
  await click('[data-action="confirm-redeem"]');
  assert.match(get("#sheet").textContent, /데모/);
  assert.equal((await w.__demoApi("state")).user.stamps, 2);
  await click('[data-action="close"]');
  await click('[data-action="stamps"]');
  await click('[data-action="demo-convert"]');
  await submit("#demo-convert");
  await click('[data-demo-convert="1"]');
  assert.equal((await w.__demoApi("state")).user.stamps, 1);
  assert.equal(networkCalls, 0);
  dom.window.close();
  console.log(
    "PASS demo DOM onboarding, QR mode, reward, purchase/equip, mock linking, code screen, operator grant, redemption and example conversion; zero network calls",
  );
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
