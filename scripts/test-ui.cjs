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
  const heartbeatCallbacks = [];
  w.setInterval = (fn) => {
    heartbeatCallbacks.push(fn);
    return 1;
  };
  const manifest = JSON.parse(
    fs.readFileSync(path.join(root, "avatar02/manifest.json"), "utf8"),
  );
  w.__avatarRuntime = {
    loadAvatarCatalogue: async () => manifest,
    retryAvatarImages: () => {},
    normalizeAvatar: (value = {}) => ({
      selection: value.selection || {},
      lens: value.lens || "charcoal",
    }),
    attachAvatar: (el, value, options) => {
      if (el) {
        el.dataset.avatarState = JSON.stringify(value);
        el.dataset.avatarMotion = options.motion;
        el.dataset.avatarDirection = options.direction;
      }
    },
    setAvatarMotion: (el, motion, direction) => {
      if (el) {
        el.dataset.avatarMotion = motion;
        el.dataset.avatarDirection = direction;
      }
    },
    directionBetween: (a, b) =>
      Math.abs(b.x - a.x) > Math.abs(b.y - a.y)
        ? b.x > a.x
          ? "right"
          : "left"
        : b.y > a.y
          ? "front"
          : "back",
  };
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
  const originalDemoApi=w.__demoApi;
  w.__demoApi=async(...args)=>{
    if(args[0]==='state'&&w.__rejectNextState){w.__rejectNextState=false;throw Error('simulated refresh failure after confirmed save');}
    const result=await originalDemoApi(...args);
    if(args[0]==='avatar'&&w.__testRefreshFailure){w.__rejectNextState=true;w.__testRefreshFailure=false;}
    return result;
  };
  w.__qrcode = (
    await import(
      require("node:url").pathToFileURL(
        path.join(root, "public/assets/vendor/qrcode.mjs"),
      ).href
    )
  ).default;
  const source = fs
    .readFileSync(path.join(root, "script.js"), "utf8")
    .replace(
      /import\s*\{[\s\S]*?\}\s*from\s*['"]\.\/avatar-runtime\.js['"];?/,
      "const {loadAvatarCatalogue,attachAvatar,setAvatarMotion,directionBetween,normalizeAvatar,retryAvatarImages}=window.__avatarRuntime;",
    )
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
  assert.ok(
    (await w.__demoApi("state")).items.find((i) => i.id === "item3").equipped,
  );
  const change = (selector, value) => {
    const el = get(selector);
    el.value = value;
    el.dispatchEvent(new w.Event("change", { bubbles: true }));
  };
  change('[data-avatar-slot="hair"]', "hair-pigtails");
  change('[data-avatar-slot="hat"]', "hat-beret");
  change('[data-avatar-control="lens"]', "blue");
  change('[data-avatar-control="motion"]', "drink");
  change('[data-avatar-control="direction"]', "back");
  assert.equal(get("#avatar-preview").dataset.avatarMotion, "drink");
  assert.equal(get("#avatar-preview").dataset.avatarDirection, "back");
  const focusedSelect=get('[data-avatar-slot="hair"]');focusedSelect.focus();
  for (const fn of heartbeatCallbacks) await fn();
  assert.equal(get('[data-avatar-slot="hair"]'),focusedSelect,'Wardrobe DOM identity survives heartbeat');
  assert.equal(w.document.activeElement,focusedSelect,'Focused selector survives heartbeat');
  assert.equal(
    get('[data-avatar-slot="hair"]').value,
    "hair-pigtails",
    "Unsaved draft persists through heartbeat",
  );
  w.__testRefreshFailure=true;
  await click('[data-action="avatar-save"]');
  const saved = (await w.__demoApi("state")).user.appearance.avatar02;
  assert.equal(saved.selection.hair, "hair-pigtails");
  assert.equal(saved.lens, "blue");
  await click('[data-page="cafe"]');
  assert.deepEqual(
    JSON.parse(get("#player canvas").dataset.avatarState),
    JSON.parse(JSON.stringify(saved)),
  );
  await click('[data-action="avatar-actions"]');
  await click('[data-map-motion="greet"]');
  for (let n = 0; n < 2; n++) for (const fn of heartbeatCallbacks) await fn();
  assert.equal(
    get("#player canvas").dataset.avatarMotion,
    "greet",
    "Map action persists across DOM refresh",
  );
  const map=get('#map');map.getBoundingClientRect=()=>({left:0,top:0,width:100,height:100});
  map.dispatchEvent(new w.MouseEvent('click',{bubbles:true,clientX:55,clientY:70}));await delay(900);
  assert.equal(get('#player canvas').dataset.avatarMotion,'idle','Walk returns to basic pose');
  assert.equal(get('#player canvas').dataset.avatarDirection,'right','Walk follows horizontal direction');
  await click('[data-page="character"]');
  assert.equal(get('[data-avatar-slot="hair"]').value, "hair-pigtails");
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
    "PASS demo DOM flows + avatar save despite refresh failure, map/wardrobe parity, heartbeat draft/focus preservation, pose persistence, walk direction/idle; zero network calls (renderer mocked)",
  );
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
