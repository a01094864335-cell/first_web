import {
  loadAvatarCatalogue,
  attachAvatar,
  setAvatarMotion,
  directionBetween,
  normalizeAvatar,
  retryAvatarImages,
  avatarDiagnostics,
} from "./avatar-runtime.js";
const app = document.querySelector("#app"),
  sheet = document.querySelector("#sheet"),
  toastEl = document.querySelector("#toast");
const demoRuntime = {
  enabled: new URLSearchParams(location.search).get("demo") === "1",
  api: null,
};
let avatarManifest = null,
  avatarLoadError = "",
  avatarDraft = null,
  avatarDraftUser = null,
  avatarPreviewMotion = "idle",
  avatarPreviewDirection = "front",
  mapPose = "idle",
  mapDirection = "front";
const avatarPositions = new Map();
let avatarSearchQuery = "",
  avatarSlotFilter = "all";
const motionLabels = {
  idle: "기본 자세",
  walk: "걷기",
  greet: "인사",
  drink: "음료 마시기",
  examine: "살펴보기",
  sit: "앉기",
  celebrate: "기뻐하기",
  dress: "꾸미기",
};
// Display-only Korean labels; keep catalogue IDs and original manifest unchanged.
const avatarItemLabels = {
  "skin-warm": "따뜻한 피부 톤",
  "skin-deep": "깊은 피부 톤",
  "hair-short": "짧은 머리",
  "top-plain": "기본 무지 티",
  "top-vest": "기본 조끼",
  "bottom-shorts": "기본 반바지",
  "hat-baseball": "야구모자",
  "glasses-round": "동그란 안경",
  "body-crossbody": "크로스백",
  "hand-mug": "머그컵",
  "shoes-sneakers": "운동화",
  "shoes-loafers": "로퍼",
  "shoes-boots": "부츠",
  "body-mini-bag": "미니백",
  "body-headphones": "헤드폰",
  "hand-takeout-cup": "테이크아웃 컵",
  "hand-book": "책",
  "top-raglan": "래글런 티",
  "top-turtleneck": "터틀넥 니트",
  "top-bomber": "봄버 재킷",
  "bottom-skirt-pleated": "플리츠 스커트",
  "bottom-trousers-cargo": "카고 바지",
  "hair-curly-bob": "곱슬 단발",
  "hair-pixie": "픽시컷",
  "hair-pigtails": "양갈래 머리",
  "hair-long-straight": "긴 생머리",
  "hair-braid": "땋은 머리",
  "hat-beanie": "비니",
  "hat-beret": "베레모",
  "glasses-square": "네모 안경",
  "hair-buzz": "버즈컷",
  "hair-afro": "짧은 아프로",
  "hair-high-bun": "높은 번 머리",
  "hair-side-ponytail": "옆 포니테일",
  "top-tee-plain": "무지 반팔 티",
  "top-tee-striped": "줄무늬 반팔 티",
  "top-shirt-blue": "파란 셔츠",
  "top-cardigan-rust": "적갈색 카디건",
  "top-hoodie-lavender": "라벤더 후드티",
  "top-vest-moss": "이끼색 조끼",
  "top-overall-denim": "데님 멜빵 상의",
  "bottom-shorts-charcoal": "차콜 반바지",
  "bottom-trousers-navy": "네이비 바지",
  "bottom-skirt-coral": "코랄 스커트",
  "bottom-overall-denim": "데님 멜빵 하의",
  "hat-bucket": "버킷햇",
  "body-tote": "캔버스 토트백",
  "hand-camera": "소형 카메라",
  "eyes-dot": "점 눈",
  "eyes-sleepy": "졸린 눈",
  "eyes-smile": "웃는 눈",
};
const slotLabels = {
  skin: "피부",
  eyes: "눈",
  hair: "머리",
  top: "상의",
  bottom: "하의",
  shoes: "신발",
  body: "가방·헤드폰",
  hat: "모자",
  glasses: "안경",
  hand: "손 소품",
};
const inDemo = () => demoRuntime.enabled && state?.config?.demo === true;
let state = null,
  page = "cafe",
  wardrobeTab = "closet",
  offline = false,
  entryPending = new URLSearchParams(location.search).get("entry"),
  busy = false;
const esc = (v) =>
  String(v ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const notify = (text) => {
  toastEl.textContent = text;
  toastEl.classList.add("show");
  clearTimeout(notify.timer);
  notify.timer = setTimeout(() => toastEl.classList.remove("show"), 4500);
};
const retryStorageKey = "cafe-quest:pending-requests:v1";
let retryStorageAvailable = true;
const uncertainRequests = new Map();
try {
  const stored = JSON.parse(sessionStorage.getItem(retryStorageKey) || "[]");
  if (!Array.isArray(stored)) throw Error("invalid retry metadata");
  for (const row of stored) {
    if (
      Array.isArray(row) &&
      row.length === 2 &&
      typeof row[0] === "string" &&
      typeof row[1] === "string" &&
      row[1].length <= 128
    )
      uncertainRequests.set(row[0], row[1]);
  }
} catch {
  retryStorageAvailable = false;
}
function persistRetryMetadata() {
  try {
    if (uncertainRequests.size)
      sessionStorage.setItem(
        retryStorageKey,
        JSON.stringify([...uncertainRequests]),
      );
    else sessionStorage.removeItem(retryStorageKey);
    retryStorageAvailable = true;
  } catch {
    retryStorageAvailable = false;
  }
}
function unresolvedMessage(message) {
  return (
    message +
    (retryStorageAvailable
      ? ""
      : " 재시도 정보를 보관할 수 없어요. 결과를 확인할 때까지 이 페이지를 새로고침하거나 닫지 마세요.")
  );
}
async function api(path, data) {
  const isDemo = typeof demoRuntime !== "undefined" && demoRuntime.enabled;
  const signature = JSON.stringify([
    isDemo ? "demo" : "server",
    state?.user?.id || "anonymous",
    path,
    data,
  ]);
  const key =
    data === undefined
      ? null
      : uncertainRequests.get(signature) || crypto.randomUUID();
  if (key) {
    uncertainRequests.set(signature, key);
    persistRetryMetadata();
  }
  for (let attempt = 0; attempt < 2; attempt++) {
    let res, result;
    try {
      if (isDemo) {
        if (!demoRuntime.api)
          throw Error(
            "데모 모듈을 불러오지 못했어요. 실제 서버로 전환하지 않습니다.",
          );
        result = await demoRuntime.api(path, data, key);
        res = { ok: true, status: 200 };
      } else {
        res = await fetch("/api/" + path, {
          method: data === undefined ? "GET" : "POST",
          headers:
            data === undefined
              ? {}
              : { "Content-Type": "application/json", "Idempotency-Key": key },
          body: data === undefined ? undefined : JSON.stringify(data),
          signal: AbortSignal.timeout(15000),
        });
        result = await res.json();
      }
    } catch (e) {
      if (isDemo) {
        uncertainRequests.delete(signature);
        persistRetryMetadata();
        throw e;
      }
      if (attempt === 0) {
        if (data !== undefined)
          notify(
            "응답을 확인하지 못했어요. 같은 요청으로 결과를 다시 확인 중이에요.",
          );
        continue;
      }
      offline = true;
      throw Error(
        data === undefined
          ? "연결할 수 없어요. 잠시 후 다시 확인해주세요."
          : unresolvedMessage(
              "처리 결과가 아직 확인되지 않았어요. 다시 누르면 같은 요청으로 확인해요.",
            ),
      );
    }
    if (res.status >= 500) {
      if (attempt === 0) continue;
      throw Error(
        unresolvedMessage(
          "서버의 처리 결과를 확인하지 못했어요. 같은 요청으로 다시 확인해주세요.",
        ),
      );
    }
    uncertainRequests.delete(signature);
    if (path === "logout" && res.ok) uncertainRequests.clear();
    persistRetryMetadata();
    if (!res.ok) throw Error(result.error || "요청을 완료하지 못했어요.");
    return result;
  }
}
async function refresh(render = true) {
  try {
    state = await api("state");
    offline = false;
    if (render) draw();
  } catch (e) {
    offline = true;
    if (state && render) draw();
    else if (!state)
      app.innerHTML = `<p class="loading">${demoRuntime.enabled ? "데모를 불러오지 못했어요. 실제 서버에 연결하지 않았어요." : "서버에 연결할 수 없어요."}<br><button data-action="retry">다시 연결</button></p>`;
    throw e;
  }
}
async function act(path, data, success) {
  if (busy) return;
  busy = true;
  try {
    const result = await api(path, data);
    try {
      await refresh();
    } catch {
      notify(
        "처리는 완료됐지만 최신 화면을 불러오지 못했어요. 다시 연결해주세요.",
      );
      return result;
    }
    if (success) notify(success);
    return result;
  } catch (e) {
    notify(e.message);
  } finally {
    busy = false;
  }
}
const isStore = () => state?.session?.mode === "store";
const icons = { hat: "🧢", cup: "☕", accessory: "🌼", prop: "📖" };
function avatarFor(user) {
  if (user.appearance?.avatar02)
    return normalizeAvatar(user.appearance.avatar02);
  // Legacy visuals only: approximate equivalents, never changes ownership or price.
  const selection = {},
    mapping = {
      item0: ["hat", "hat-baseball"],
      item1: ["hat", "hat-beanie"],
      item2: ["hat", "hat-beret"],
      item3: ["hand", "hand-book"],
      item4: ["hand", "hand-mug"],
      item5: ["body", "body-tote"],
      item6: ["top", "top-plain"],
      item7: ["top", "top-vest-moss"],
      item8: ["top", "top-shirt-blue"],
      item9: ["top", "top-cardigan-rust"],
    };
  for (const id of user.appearance?.equipped || []) {
    const pair = mapping[id];
    if (pair) selection[pair[0]] = pair[1];
  }
  return normalizeAvatar({ selection, lens: "charcoal" });
}
function person(u, s, self = false) {
  return `<div class="person avatar-person ${self ? "self" : ""} ${s.mode === "remote" ? "remote" : ""}" style="left:${(Number(s.x) || 0.55) * 100}%;top:${(Number(s.y) || 0.66) * 100}%;z-index:${Math.round((Number(s.y) || 0.66) * 100)}" ${self ? 'id="player"' : ""} role="img" aria-label="${esc(u.nickname)}${s.mode === "remote" ? " 원격" : ""}"><canvas class="avatar-canvas" data-avatar-owner="${esc(u.id)}" aria-hidden="true"></canvas><span class="avatar-fallback">${avatarLoadError ? "애셋 오류" : "불러오는 중"}</span>${s.mode === "remote" ? '<span class="tag">원격</span>' : ""}</div>`;
}
function mountAvatars() {
  if (!avatarManifest) return;
  const users = [state.user, ...(state.guests || [])].filter(Boolean);
  app.querySelectorAll("canvas[data-avatar-owner]").forEach((canvas) => {
    const u = users.find((u) => u.id === canvas.dataset.avatarOwner);
    if (!u) return;
    const self = u.id === state.user.id,
      s = self ? state.session : u.session || u;
    const previous = avatarPositions.get(u.id);
    let direction = self ? mapDirection : previous?.direction || "front";
    let motion = self ? mapPose : "idle";
    if (!self && previous && (previous.x !== s.x || previous.y !== s.y)) {
      direction = directionBetween(previous, s);
      motion = "walk";
      setTimeout(() => {
        if (canvas.isConnected) setAvatarMotion(canvas, "idle", direction);
      }, 650);
    }
    avatarPositions.set(u.id, { x: s.x, y: s.y, direction });
    attachAvatar(canvas, avatarFor(u), {
      motion,
      direction,
      timelineKey: "user:" + u.id,
    });
  });
  const preview = document.querySelector("#avatar-preview");
  if (preview)
    attachAvatar(preview, avatarDraft, {
      motion: avatarPreviewMotion,
      direction: avatarPreviewDirection,
      timelineKey: "wardrobe-preview",
    });
}
function avatarPartLabel(item) {
  return avatarItemLabels[item.id] || item.label || item.id;
}
function avatarPartSearch() {
  const query = avatarSearchQuery.trim().toLocaleLowerCase("ko-KR");
  const slots = [...new Set(avatarManifest.items.map((i) => i.slot))];
  const matching = avatarManifest.items.filter(
    (i) =>
      (avatarSlotFilter === "all" || i.slot === avatarSlotFilter) &&
      (!query ||
        [avatarPartLabel(i), i.id, slotLabels[i.slot] || i.slot]
          .join(" ")
          .toLocaleLowerCase("ko-KR")
          .includes(query)),
  );
  return { query, slots, matching };
}
function avatarPartOptions() {
  const { query, slots, matching } = avatarPartSearch();
  return slots
    .filter((slot) => avatarSlotFilter === "all" || slot === avatarSlotFilter)
    .map((slot) => {
      const results = matching.filter((i) => i.slot === slot),
        selected = avatarManifest.items.find(
          (i) => i.slot === slot && i.id === avatarDraft.selection[slot],
        );
      if (query && !results.length && !selected && avatarSlotFilter === "all")
        return "";
      const pinned =
        selected && !results.some((i) => i.id === selected.id)
          ? selected
          : null;
      return `<label class="avatar-part-group">${slotLabels[slot] || esc(slot)} <small>${results.length}종${pinned ? " · 현재 선택 별도 유지" : ""}</small><select data-avatar-slot="${slot}" aria-label="${esc(slotLabels[slot] || slot)} 파츠 선택"><option value="">기본 / 없음</option>${pinned ? `<option value="${esc(pinned.id)}" selected>${esc(avatarPartLabel(pinned))} · 현재 선택</option>` : ""}${results.map((i) => `<option value="${esc(i.id)}" ${avatarDraft.selection[slot] === i.id ? "selected" : ""}>${esc(avatarPartLabel(i))}</option>`).join("")}</select></label>`;
    })
    .join("");
}
function avatarSearchStatus() {
  const { query, matching } = avatarPartSearch();
  return matching.length
    ? `${matching.length}종 표시 / 전체 ${avatarManifest.items.length}종${query ? " · 검색해도 시착 중인 파츠는 유지돼요." : ""}`
    : "검색 결과가 없어요. 다른 검색어나 부위를 선택해주세요. 시착 중인 파츠는 그대로 유지돼요.";
}
function updateAvatarSearch() {
  const results = document.querySelector("#avatar-parts-results");
  if (!results) return;
  results.innerHTML = avatarPartOptions();
  document.querySelector("#avatar-search-status").textContent =
    avatarSearchStatus();
  document.querySelectorAll("[data-avatar-filter]").forEach((b) => {
    const active = b.dataset.avatarFilter === avatarSlotFilter;
    b.setAttribute("aria-pressed", String(active));
    b.classList.toggle("active", active);
  });
}
function avatarDiagnosticsMarkup() {
  const info = avatarDiagnostics();
  const [cw,ch] = avatarManifest?.cell || [80,80];
  const rows = avatarManifest?.directions?.length || 4;
  const columns = Math.max(1,...Object.values(avatarManifest?.motions || {}).map(m=>Math.max(...m.frames)+1));
  const width=cw*columns,height=ch*rows;
  const estimateMiB=info.images*width*height*4/1048576;
  return `<dl class="avatar-render-stats"><dt>이미지 캐시 항목</dt><dd data-avatar-stat="images">${info.images}</dd><dt>실패 이미지</dt><dd data-avatar-stat="failed">${info.failed.length}</dd><dt>등록된 캔버스</dt><dd data-avatar-stat="registered">${info.registered}</dd><dt>비트맵 이론 추정</dt><dd data-avatar-stat="bitmap-estimate">${estimateMiB.toFixed(2)} MiB</dd></dl><p class="muted">추정식: 캐시 항목 수 × ${width} × ${height} × RGBA 4바이트. 로딩 중·실패 항목도 포함해 모두 디코딩한다고 가정한 값이에요. 실제 브라우저 메모리 측정값이 아니며, 합성 프레임 캐시·GPU·브라우저 부가 메모리는 제외해요.</p><p class="muted">조회 시각: <time>${esc(new Date().toLocaleTimeString('ko-KR'))}</time> · 새로고침은 정보만 읽으며 캐시 정책을 바꾸지 않아요.</p>${info.failed.length?`<details><summary>실패한 애셋 경로</summary><ul>${info.failed.map(path=>`<li><code>${esc(path)}</code></li>`).join('')}</ul></details>`:''}`;
}
function avatarEditor() {
  if (!avatarManifest)
    return `<p class="notice">${esc(avatarLoadError || "파츠 목록을 읽고 있어요.")}</p>${avatarLoadError ? '<button data-action="avatar-retry">캐릭터 다시 불러오기</button>' : ""}`;
  if (avatarDraftUser !== state.user.id || !avatarDraft) {
    avatarDraft = avatarFor(state.user);
    avatarDraftUser = state.user.id;
    avatarSearchQuery = "";
    avatarSlotFilter = "all";
  }
  const slots = [...new Set(avatarManifest.items.map((i) => i.slot))];
  return `<section class="avatar-editor"><div class="avatar-preview-stage"><canvas id="avatar-preview" class="avatar-canvas" width="80" height="80" aria-label="선택한 파츠를 합성한 캐릭터 미리보기"></canvas><span class="avatar-fallback">불러오는 중</span></div><p class="notice">${avatarManifest.items.length}종 파츠 무료 시착 · 개발 체험용이며 실제 경제 정책이 아니에요.</p><p class="muted">방향·모션은 미리보기용이에요. 기본 자세는 정지 프레임이며 게임 효과를 만들지 않아요.</p><div class="avatar-select-grid"><label>방향<select data-avatar-control="direction">${[
    ["front", "앞"],
    ["right", "오른쪽"],
    ["back", "뒤"],
    ["left", "왼쪽"],
  ]
    .map(
      ([v, t]) =>
        `<option value="${v}" ${avatarPreviewDirection === v ? "selected" : ""}>${t}</option>`,
    )
    .join(
      "",
    )}</select></label><label>동작<select data-avatar-control="motion">${Object.keys(
    avatarManifest.motions,
  )
    .map(
      (v) =>
        `<option value="${v}" ${avatarPreviewMotion === v ? "selected" : ""}>${motionLabels[v] || v}</option>`,
    )
    .join(
      "",
    )}</select></label><label>렌즈 색<select data-avatar-control="lens">${avatarManifest.lensColors.map((v) => `<option value="${v}" ${avatarDraft.lens === v ? "selected" : ""}>${{ charcoal: "차콜", green: "초록", blue: "파랑" }[v] || v}</option>`).join("")}</select></label></div><section class="avatar-parts-browser" aria-label="파츠 찾아보기"><div class="avatar-search-row"><label for="avatar-search">파츠 검색<input id="avatar-search" type="search" value="${esc(avatarSearchQuery)}" placeholder="머리, 안경, 셔츠 이름으로 찾기" autocomplete="off" spellcheck="false"></label><button data-action="avatar-search-clear">검색 초기화</button></div><div class="avatar-slot-filters" role="group" aria-label="파츠 부위 필터">${["all", ...slots].map((slot) => `<button type="button" data-avatar-filter="${slot}" aria-pressed="${avatarSlotFilter === slot}" class="${avatarSlotFilter === slot ? "active" : ""}">${slot === "all" ? "전체" : slotLabels[slot] || esc(slot)}</button>`).join("")}</div><p id="avatar-search-status" class="muted" role="status" aria-live="polite">${avatarSearchStatus()}</p><div id="avatar-parts-results" class="avatar-select-grid">${avatarPartOptions()}</div></section><p class="muted">모자와 머리는 조합 전용 레이어를 사용해요. 파츠 선택 후 네 방향과 동작을 확인해보세요.</p><div class="actions"><button data-action="avatar-reset">기본으로 시착</button><button data-action="avatar-retry">애셋 다시 불러오기</button><button class="primary" data-action="avatar-save">파츠 저장 · 맵에 적용</button></div><details id="avatar-render-info" class="avatar-render-info"><summary>개발 렌더링 정보</summary><div id="avatar-render-stats">${avatarDiagnosticsMarkup()}</div><button data-action="avatar-diagnostics-refresh">렌더링 정보 새로고침</button></details></section>`;
}
function nav() {
  return `<nav class="bottom-nav" aria-label="주 메뉴">${[
    ["cafe", "⌂", "카페"],
    ["quests", "♧", "퀘스트"],
    ["character", "☺", "내 캐릭터"],
  ]
    .map(
      ([id, icon, label]) =>
        `<button data-page="${id}" class="${page === id ? "active" : ""}" ${page === id ? 'aria-current="page"' : ""}><span aria-hidden="true">${icon}</span>${label}</button>`,
    )
    .join("")}</nav>`;
}
function header() {
  return `<header><div><h1>THE CREDIT</h1><span class="mode">${isStore() ? "● 매장 모드" : "◌ 원격 모드"}</span></div><div class="header-actions"><button class="icon-button coin" data-action="ledger" aria-label="코인 내역">◉ ${state.user.coins}</button><button class="icon-button" data-action="profile" aria-label="내 프로필 및 설정">☺</button><button class="icon-button" data-action="hide" ${!state.session.visible ? "disabled" : ""}>숨기기</button></div></header>`;
}
function furnishing(name, x, y, w) {
  return `<img class="furniture" src="/public/assets/${name}.webp" alt="" style="left:${x}%;top:${y}%;width:${w}%;z-index:${Math.round(y)}" draggable="false">`;
}
function mapView() {
  const guests = state.guests || [];
  return `<div class="toolbar"><button data-action="guests">맵 참여 중 ${guests.length + (state.session.visible ? 1 : 0)}명 ›</button><button data-action="stamps">▣ 내 스탬프 ${state.user.stamps}</button></div><div class="map-wrap"><div class="map" id="map" role="application" aria-label="카페 맵. 클릭하여 이동하거나 아래 퀘스트 메뉴를 이용하세요." tabindex="0"><img class="map-bg" src="/public/assets/background.webp" alt="긴 직사각형 카페, 왼쪽 바와 아래쪽 ㄴ자 벤치" draggable="false">${furnishing("wall-shelf", 10, 65, 10)}${furnishing("bar-counter", 24, 65, 17)}${[31, 41, 51, 61].map((y) => furnishing("bar-stool", 36, y, 7)).join("")}${furnishing("l-bench", 31, 95, 50)}${[
    [78, 39],
    [78, 65],
    [24, 84],
    [24, 95],
    [41, 95],
    [58, 95],
  ]
    .map(([x, y]) => furnishing("round-table", x, y, 15))
    .join(
      "",
    )}${furnishing("plant", 85, 21, 15)}${furnishing("coffee-machine", 24, 35, 12)}<button class="plant-action" data-action="plant" aria-label="퀘스트 오브젝트: 새 화분 살펴보기">♧</button>${guests.map((g) => person(g, g.session || g)).join("")}${person(state.user, state.session, true)}</div></div><div class="map-avatar-actions"><button data-action="avatar-actions">캐릭터 동작</button></div><button class="quest-strip" data-page="quests">♧ 오늘의 작은 발견 · 퀘스트 보기 ›</button>`;
}
function questsView() {
  return `<section class="page"><h2>오늘의 작은 발견</h2><p class="muted page-intro">${isStore() ? "천천히 둘러보고 나만의 취향을 찾아보세요." : "원격에서는 미리보기만 가능해요. 매장 QR로 참여하면 진행할 수 있어요."}</p>${
    (state.quests || [])
      .map((q) => {
        const ready = ["complete", "completed", "claimable"].includes(q.status),
          claimed = ["claimed", "rewarded"].includes(q.status);
        return `<article class="card"><div class="row"><h3>${esc(q.title)}</h3><span class="status">◉ ${q.reward}</span></div><p>${esc(q.description)}</p>${q.note ? `<p class="notice">${esc(q.note)}</p>` : ""}<div class="actions"><span class="muted">${esc({ available: "시작 전", active: "진행 중", started: "진행 중", pending: "직원 승인 대기", complete: "완료", completed: "완료", claimed: "수령 완료", rejected: "승인 거절", unavailable: "참여 중단" }[q.status] || q.status)}</span>${claimed ? "" : ready ? `<button class="primary" data-quest="${esc(q.id)}" data-qaction="claim">보상 받기</button>` : q.status === "pending" ? "" : q.status === "unavailable" || q.available === false ? `<button disabled>참여할 수 없어요</button>` : q.kind === "cumulative" ? `<span class="muted">방문하면 자동으로 기록돼요</span>` : `<button data-quest="${esc(q.id)}" data-qaction="${q.status === "available" ? "start" : "progress"}" ${!isStore() ? "disabled" : ""}>${q.status === "available" ? "시작하기" : q.kind === "purchase" ? "직원 확인 요청" : q.kind === "mood" ? "기분 선택" : "확인하기"}</button>`}</div></article>`;
      })
      .join("") || '<p class="empty">등록된 퀘스트가 없어요.</p>'
  }</section>`;
}
function characterView() {
  const items = (state.items || []).filter(
    (i) => wardrobeTab === "shop" || i.owned,
  );
  return `<section class="page"><h2>${esc(state.user.nickname)}의 옷장</h2><p class="muted">실제 파츠를 겹쳐 만든 캐릭터를 골라보세요.</p>${avatarEditor()}<div class="actions"><button data-action="privacy">공개 설정</button><button data-action="account">계정 · 복구 안내</button><button data-action="character-concepts">이전 캐릭터 시안 보기</button></div><details class="legacy-inventory"><summary>이전 아이템 보관함 · 새 파츠 시착과 별개</summary><p class="muted">기존 코인·구매·보유 기록은 유지돼요. 새 파츠 저장 후에는 아래 착용 선택이 새 캐릭터 외형을 바꾸지 않아요. 새 파츠를 저장하지 않은 캐릭터만 비슷한 기존 아이템으로 표시해요.</p><div class="tabs"><button data-tab="closet" class="${wardrobeTab === "closet" ? "active" : ""}">내 아이템</button><button data-tab="shop" class="${wardrobeTab === "shop" ? "active" : ""}">이전 상점</button></div><div class="grid">${items.map((i) => `<article class="card"><div class="item-icon">${icons[i.slot] || "✦"}</div><h3>${esc(i.name)}</h3><p class="muted">${i.owned ? "보유 중" : "◉ " + i.price}</p><div class="actions"><button data-item="${esc(i.id)}" data-iaction="${i.owned ? "equip" : "buy"}">${i.owned ? (i.equipped ? "해제" : "착용") : "구매"}</button></div></article>`).join("")}</div>${!items.length ? '<p class="empty">아직 모은 아이템이 없어요.</p>' : ""}</details></section>`;
}
function draw() {
  app.removeAttribute("aria-busy");
  const storageWarning = document.querySelector("#demo-storage-warning");
  if (storageWarning)
    storageWarning.hidden = !(
      demoRuntime.enabled && state?.config?.storagePersistent === false
    );
  if (!state?.user) {
    app.innerHTML = `<div class="loading"><h1>THE CREDIT</h1><p>카페에 머무는 또 하나의 방법</p><button data-action="onboard" class="primary">내 캐릭터 만들기</button>${demoRuntime.enabled ? '<p><button data-demo-kakao="restore">데모 연결 계정 복원</button></p>' : '<p><a href="/?demo=1">연동 없이 데모 체험하기</a></p>'}</div>`;
    return;
  }
  const remaining = new Date(state.session.expiresAt).getTime() - Date.now();
  app.innerHTML =
    header() +
    (avatarLoadError
      ? `<div class="notice">캐릭터 애셋 연결을 확인해주세요. <button data-action="avatar-retry">다시 불러오기</button></div>`
      : "") +
    (offline
      ? '<div class="notice connection">연결이 끊겼어요. 최신 상태를 다시 확인해주세요.</div>'
      : "") +
    (isStore() && remaining > 0 && remaining < 600000
      ? '<div class="notice">아직 카페에 계신가요? <button data-action="extend">90분 연장</button></div>'
      : "") +
    (page === "cafe"
      ? mapView()
      : page === "quests"
        ? questsView()
        : characterView()) +
    nav();
  mountAvatars();
}
function modal(title, body) {
  sheet.innerHTML = `<div class="sheet-header"><h2 id="sheet-title">${esc(title)}</h2><button data-action="close" aria-label="닫기">×</button></div><div class="sheet-content">${demoRuntime.enabled ? '<p class="demo-notice">데모 · 실제 계정/스탬프와 무관</p>' : ""}${body}</div>`;
  if (!sheet.open) sheet.showModal();
}
function onboard() {
  modal(
    "처음 오셨네요 ☕",
    `<p>닉네임과 기본 색상을 골라주세요.</p><form id="onboard"><label>닉네임<input name="nickname" maxlength="16" required autocomplete="nickname" placeholder="카페에서 부를 이름"></label><label>기본 옷 색상<select name="appearance"><option value="0">라벤더</option><option value="1">세이지</option><option value="2">하늘</option><option value="3">코랄</option></select></label><p class="muted">${demoRuntime.enabled ? "지금은 브라우저 안의 가상 데이터로 체험해요. 실제 카카오 인증이나 매장 적립은 하지 않아요." : "진행도는 서버에 저장돼요. 카카오에 연결하지 않은 게스트는 브라우저 데이터를 삭제하거나 기기를 바꾸면 복구하기 어려울 수 있어요."}</p><button class="primary" type="submit">카페 들어가기</button></form>`,
  );
}
function privacy() {
  modal(
    "내가 고르는 공개 범위",
    `<p class="muted">기본은 비공개예요. 공개하면 닉네임과 캐릭터가 보여요. 작은 매장에서는 공개 정보로 나를 알아볼 수 있어요.</p><form id="privacy"><label><input type="checkbox" name="visible" ${state.session.visible ? "checked" : ""}>맵과 손님 목록에 나를 공개</label><label>활동<select name="activity">${["", "독서", "작업", "휴식", "수다"].map((v) => `<option ${state.session.activity === v ? "selected" : ""} value="${v}">${v || "공개하지 않음"}</option>`).join("")}</select></label><label>오늘 고른 음료<input name="drink" maxlength="30" value="${esc(state.session.drink)}" placeholder="비워두면 공개하지 않아요"></label><button type="submit" class="primary">저장</button></form>`,
  );
}
function profile() {
  modal(
    "내 참여 상태",
    `<h3>${esc(state.user.nickname)}</h3><p>${isStore() ? "매장 QR로 참여 중" : "원격으로 둘러보는 중"} · ${state.session.visible ? "공개" : "비공개"}</p>${isStore() ? `<p class="muted">종료 예정 ${esc(new Date(state.session.expiresAt).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" }))}. 실제 위치나 좌석 점유를 뜻하지 않아요.</p>` : ""}<div class="stack"><button data-action="privacy">공개 설정</button>${isStore() ? '<button data-action="extend">90분 연장</button><button data-action="checkout">매장 참여 종료</button>' : ""}<button data-action="account">계정 및 설정</button></div>`,
  );
}
function stamps() {
  const linked = !!state.user.linked;
  modal(
    "내 스탬프",
    `<h3>${state.user.stamps}개</h3><div class="stamp-grid">${Array.from({ length: 10 }, (_, i) => `<span class="${i < state.user.stamps ? "filled" : ""}">${i < state.user.stamps ? "☕" : "·"}</span>`).join("")}</div><p>유료 음료 한 잔당 1개. 10개로 원하는 음료 한 잔을 교환해요.</p><p class="muted">웹 코인과 별개의 잔액이에요. 적립에는 카카오 계정 연결과 직원 확인이 필요해요.</p><div class="stack"><button data-action="ledger-stamps">스탬프 내역</button><button data-action="account">${linked ? "연결 계정 확인" : "카카오 연결 안내"}</button><button data-action="redeem" ${!linked || !isStore() || state.user.stamps < 10 ? "disabled" : ""}>무료 음료 사용 · 10개</button>${!isStore() ? "<small>무료 음료는 매장 모드에서만 사용할 수 있어요.</small>" : ""}${inDemo() ? `<button data-action="demo-stamp-code" ${!linked ? "disabled" : ""}>데모 적립 코드 보기</button><button data-action="demo-convert" ${!linked || state.user.stamps < 1 ? "disabled" : ""}>스탬프 → 코인 체험 · 예시 비율</button>` : "<button disabled>코인 전환 · 비율 확정 후 제공</button>"}</div>`,
  );
}
function account() {
  modal(
    "계정과 데이터",
    `<p>${state.user.linked ? (inDemo() ? "데모 카카오 연결 계정이에요. 실제 인증이 아니에요." : "카카오에 연결된 계정이에요.") : "현재 게스트 계정이에요."}</p><form id="nickname"><label>닉네임<input name="nickname" required maxlength="16" value="${esc(state.user.nickname)}"></label><button type="submit">닉네임 저장</button></form><p class="muted">${inDemo() ? "가상 데이터는 브라우저에 보관해요. 데이터 초기화 시 체험 상태가 사라져요." : "진행도는 서버에 저장돼요. 미연결 게스트는 브라우저 데이터 삭제·기기 변경·로그아웃 시 복구가 제한돼요."}</p><div class="stack"><button data-action="blocks">차단한 손님 관리</button>${["staff", "admin"].includes(state.user.role) ? '<button data-action="staff">운영자 대시보드</button>' : ""}${inDemo() ? `${!state.user.linked ? '<button data-demo-kakao="new">카카오 신규 연결 체험</button><button data-demo-kakao="existing">기존 계정으로 병합 체험</button>' : ""}<button data-action="demo-delete">데모 계정 삭제 체험</button>` : "<button disabled>카카오 연결 · 운영 설정 필요</button><button disabled>탈퇴 · 데이터 처리 정책 검토 중</button>"}<button data-action="logout">로그아웃</button></div>`,
  );
}
const conceptMotions = [
  ["01-walk-aligned.gif", "걷기"],
  ["02-idle-aligned.gif", "대기"],
  ["03-wave-aligned.gif", "인사"],
  ["04-drink-aligned.gif", "음료 마시기"],
  ["05-inspect-aligned.gif", "살펴보기"],
  ["06-sit-aligned.gif", "앉기"],
  ["07-happy-aligned.gif", "기뻐하기"],
  ["08-dress-up-aligned.gif", "꾸미기"],
];
function characterConcepts(motion = "sheet") {
  const selected = conceptMotions.find(([file]) => file === motion);
  const src = selected
    ? "/public/assets/concepts/motions/" + selected[0]
    : "/public/assets/concepts/variants-12.png";
  modal(
    "캐릭터 시안·동작 미리보기",
    `<p class="notice">이전 디자인 시안 · 현재 맵은 02번 캐릭터의 실제 파츠 합성본을 사용해요</p><p class="muted">개별 게임 스프라이트가 아닌 12종 컨셉 모음이에요. 이 컨셉 모음 이미지 자체를 게임 스프라이트로 쓰지는 않아요.</p><div class="actions"><button data-concept-motion="sheet">12종 캐릭터</button>${conceptMotions.map(([file, label]) => `<button data-concept-motion="${file}">${label}</button>`).join("")}</div><figure class="concept-preview"><img loading="lazy" src="${src}" alt="${selected ? selected[1] + " 12종 캐릭터 동작 시안" : "12종 캐릭터 스타일 시안"}"><figcaption>${selected ? selected[1] : "기본 스타일 12종"} · 선택한 이미지 하나만 불러와요.</figcaption></figure>`,
  );
}
function demoControls() {
  if (!demoRuntime.enabled) return;
  const banner = document.querySelector("#demo-banner");
  banner.hidden = false;
  banner.innerHTML =
    '<strong>데모 · 실제 계정/스탬프와 무관</strong><p id="demo-storage-warning" hidden>브라우저 저장에 실패했어요. 현재 탭에서만 유지되며 새로고침하면 변경을 잃을 수 있어요.</p><details><summary>체험 도구</summary><div class="demo-tools"><label>역할 <select id="demo-role"><option value="">선택</option><option value="guest">게스트</option><option value="customer">연결 손님</option><option value="staff">직원</option><option value="admin">관리자</option></select></label><button data-action="demo-checkin">매장 입장 체험</button><button data-action="demo-advance">91분 후 만료 체험</button><button data-action="demo-reset">데모 초기화</button></div></details>';
  banner.addEventListener("click", handle);
  banner.querySelector("#demo-role").addEventListener("change", async (e) => {
    if (!e.target.value) return;
    const r = await act(
      "demo/role",
      { role: e.target.value },
      "데모 역할을 변경했어요.",
    );
    if (r) {
      page = "cafe";
      sheet.close();
      draw();
    }
    e.target.value = "";
  });
}
async function demoStampCode() {
  try {
    const qr = await api("stamps/qr");
    const { default: qrcode } = await import(
      "./public/assets/vendor/qrcode.mjs"
    );
    const code = qrcode(0, "M");
    code.addData(qr.payload);
    code.make();
    modal(
      "데모 적립 식별 코드",
      `<p>실제 매장에서 사용할 수 없는 데모 QR이에요. 실제 계정이나 적립 권한을 담지 않아요.</p><div class="demo-qr">${code.createSvgTag(4, 16)}</div><label>손님 식별자<input readonly value="${esc(qr.uid)}"></label><p><code>${esc(qr.payload)}</code></p><p class="muted">직원 체험에서는 아래 식별자를 입력해 적립해보세요. 실제 카메라 스캔·계정 인증 연동은 아직 없어요.</p>`,
    );
  } catch (e) {
    notify(e.message);
  }
}
function demoConversion() {
  modal(
    "데모 스탬프 전환",
    `<p class="notice">예시 비율: 스탬프 1개 = 50 코인. 실제 사용 불가.</p><p>보유 ${state.user.stamps}개. 코인에서 스탬프로 되돌릴 수 없어요.</p><form id="demo-convert"><label>전환할 스탬프<input name="amount" type="number" min="1" max="${state.user.stamps}" step="1" value="1" required></label><button type="submit">전환 내용 확인</button></form>`,
  );
}
function ledger(currency = "coins") {
  modal(
    currency === "coins" ? "코인 내역" : "스탬프 내역",
    `<div class="tabs"><button data-action="ledger" class="${currency === "coins" ? "active" : ""}">코인</button><button data-action="ledger-stamps" class="${currency === "stamps" ? "active" : ""}">스탬프</button></div><p class="muted">${currency === "coins" ? "꾸미기에 사용하는 웹 코인이에요. 스탬프·음료·현금으로 역전환할 수 없어요." : "실물 음료에 사용하는 적립 내역이에요. 사용 실수는 직원에게 거래 기록 확인을 요청해주세요."}</p>${
      (state.ledger || [])
        .filter((l) => l.currency === currency)
        .map(
          (l) =>
            `<div class="ledger-row row"><span>${esc(l.reason || l.type)}<br><small>${esc(l.created ? new Date(l.created * 1000).toLocaleString("ko-KR") : "")}</small></span><strong>${l.amount > 0 ? "+" : ""}${esc(l.amount)}</strong></div>`,
        )
        .join("") || '<p class="empty">아직 거래가 없어요.</p>'
    }`,
  );
}
async function blocks() {
  try {
    const list = await api("blocks");
    modal(
      "차단한 손님",
      `<p class="muted">차단을 해제하면 서로의 공개 손님 카드를 다시 볼 수 있어요.</p>${list.map((g) => `<div class="ledger-row row"><span>${esc(g.nickname)}</span><button data-unblock="${esc(g.id)}">차단 해제</button></div>`).join("") || '<p class="empty">차단한 손님이 없어요.</p>'}`,
    );
  } catch (e) {
    notify(e.message);
  }
}
let staffData = null,
  pendingOperation = null;
const operationNames = {
  content: "콘텐츠 버전 저장",
  business: "영업 참여 상태 변경",
  grant: "스탬프 적립",
  approve: "구매 퀘스트 확인",
  reverse: "적립 취소",
  restore: "무료 음료 사용 복원",
  "coin-adjust": "코인 조정",
  end: "매장 참여 종료",
  hide: "프로필 숨김",
  unhide: "프로필 제한 해제",
  resolve: "신고 처리",
};
async function staff() {
  try {
    staffData = await api("staff/dashboard");
    const d = staffData,
      admin = state.user.role === "admin";
    modal(
      "운영자 대시보드",
      `<p class="muted">서버에서 직원 권한을 확인해요. 모든 변경에는 담당자·사유·시각이 기록돼요.</p><div class="actions"><button data-op="grant">스탬프 적립 / 종이 카드 이전</button>${admin ? ["coin-adjust", "restore", "end", "hide", "unhide", "business"].map((op) => `<button data-op="${op}">${operationNames[op]}</button>`).join("") : ""}</div>${admin ? contentPanel(d.content) : ""}<h3 class="section-title">구매 승인 대기 · ${(d.pending || []).length}</h3>${(d.pending || []).map((r, i) => `<article class="card"><h3>${esc(r.nickname)}</h3><p>${esc(r.qid)} · ${esc(r.cycle)} · ${esc(r.reward)} 코인</p><button data-op="approve" data-index="${i}">승인 / 거절</button></article>`).join("") || '<p class="muted">대기 건이 없어요.</p>'}<h3 class="section-title">최근 적립</h3>${(d.recentGrants || []).map((r, i) => `<div class="ledger-row"><p>${esc(r.reason)} · ${esc(r.amount)}개</p><small>손님 ${esc(r.uid)}<br>거래 ${esc(r.id)}</small><div class="actions"><button data-op="reverse" data-index="${i}">적립 취소</button></div></div>`).join("") || '<p class="muted">적립 기록이 없어요.</p>'}${admin ? `<h3 class="section-title">신고</h3>${(d.reports || []).map((r, i) => `<div class="ledger-row"><p>${esc(r.reason)}</p><small>대상 ${esc(r.target)}</small><div class="actions"><button data-op="resolve" data-index="${i}">처리하기</button></div></div>`).join("") || '<p class="muted">신고가 없어요.</p>'}<h3 class="section-title">감사 기록</h3>${(d.audit || []).map((r) => `<div class="ledger-row"><strong>${esc(r.action)}</strong><p>${esc(r.reason)}</p><small>대상 ${esc(r.target)} · ${esc(new Date(r.created * 1000).toLocaleString("ko-KR"))}</small></div>`).join("") || '<p class="muted">기록이 없어요.</p>'}` : ""}`,
    );
  } catch (e) {
    notify(e.message);
  }
}
function contentPanel(content) {
  const section = (kind, label, rows) =>
    `<h3 class="section-title">${label}</h3><button data-content-kind="${kind}" data-content-index="new">새로 만들기</button>${(
      rows || []
    )
      .map((r, i) => {
        const body = r.body || r;
        const editable =
          kind === "item" || !["visit", "cumulative"].includes(body.kind);
        return `<div class="ledger-row row"><span>${esc(body.name || body.title || r.id)}<br><small>${r.enabled === false ? "중단" : "활성"} · 버전 ${esc(r.version || 1)}</small></span>${editable ? `<button data-content-kind="${kind}" data-content-index="${i}">편집 / 예약</button>` : "<small>자동 운영 퀘스트</small>"}</div>`;
      })
      .join("")}`;
  return `<details class="content-controls"><summary>콘텐츠 관리 · 아이템 / 퀘스트</summary><p class="muted">편집할 때마다 새 버전을 만들어요. 이미 접수한 퀘스트의 조건·보상은 이전 버전을 유지해요.</p>${section("item", "상점 아이템", content?.items)}${section("quest", "운영 퀘스트", content?.quests)}</details>`;
}
function contentForm(kind, index) {
  if (state.user.role !== "admin" || !["item", "quest"].includes(kind)) return;
  const r =
    index === "new"
      ? {}
      : (staffData.content?.[kind === "item" ? "items" : "quests"] || [])[
          Number(index)
        ];
  if (!r) return;
  const body = r.body || r;
  if (kind === "quest" && ["visit", "cumulative"].includes(body.kind)) return;
  const localDate = (value) => {
    if (value == null) return "";
    const date = new Date(Number(value) * 1000);
    return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
  };
  const field = (name, label, value = "", type = "text", extra = "") =>
    `<label>${label}<input name="${name}" type="${type}" value="${esc(value)}" required ${extra}></label>`;
  const select = (name, label, options, value) =>
    `<label>${label}<select name="${name}">${options.map(([v, label]) => `<option value="${v}" ${v === value ? "selected" : ""}>${label}</option>`).join("")}</select></label>`;
  modal(
    kind === "item" ? "상점 아이템 편집" : "퀘스트 편집",
    `<form id="content" data-kind="${kind}">${field("id", "고유 ID", r.id || "", "text", index === "new" ? 'maxlength="80"' : "readonly")}${
      kind === "item"
        ? field("name", "아이템 이름", body.name || "") +
          field(
            "price",
            "가격 · 코인",
            body.price ?? 0,
            "number",
            'min="0" max="100000" step="1"',
          ) +
          select(
            "slot",
            "착용 부위",
            [
              ["hat", "모자"],
              ["prop", "소품"],
              ["outfit", "옷"],
            ],
            body.slot || "prop",
          )
        : field("title", "퀘스트 제목", body.title || "") +
          field("description", "조건 설명", body.description || "") +
          field(
            "reward",
            "보상 · 코인",
            body.reward ?? 0,
            "number",
            'min="0" max="100000" step="1"',
          ) +
          select(
            "quest-kind",
            "진행 방식",
            [
              ["explore", "화분 탐색"],
              ["mood", "기분 선택"],
              ["purchase", "직원 구매 승인"],
            ],
            body.kind || "explore",
          )
    }<label><input name="enabled" type="checkbox" ${r.enabled !== false ? "checked" : ""}>신규 판매 / 참여 허용</label><label>시작 (비우면 제한 없음)<input name="starts" type="datetime-local" value="${localDate(r.starts)}"></label><label>종료 (비우면 제한 없음)<input name="ends" type="datetime-local" value="${localDate(r.ends)}"></label><p class="muted">시간은 현재 기기의 시간대(${esc(Intl.DateTimeFormat().resolvedOptions().timeZone)})로 입력해요. 기존 구매 가격과 이미 접수한 퀘스트 보상은 변경하지 않아요.</p><label>변경 사유<input name="reason" required maxlength="300"></label><button class="primary" type="submit">새 버전 내용 확인</button></form>`,
  );
}
function operationForm(op, index) {
  if (!["staff", "admin"].includes(state.user.role) || !operationNames[op])
    return;
  const input = (name, label, value = "", type = "text", extra = "") =>
    `<label>${label}<input name="${name}" value="${esc(value)}" type="${type}" required ${extra}></label>`;
  let body = "";
  if (op === "business")
    body =
      '<label>영업 참여 상태<select name="closed" required><option value="">선택해주세요</option><option value="true">영업 종료 / 참여 중단</option><option value="false">영업 재개 / 참여 허용</option></select></label><p class="notice">종료하면 모든 매장 참여 세션이 끝나고 모든 공개가 숨겨져요. 재개해도 이전 세션·공개는 자동 복구되지 않아요.</p>';
  if (op === "grant")
    body =
      input("uid", "손님 계정 식별자") +
      input(
        "amount",
        "유료 음료 수량 / 이전 스탬프 수량",
        1,
        "number",
        'min="1" max="100" step="1"',
      ) +
      input("source_ref", "주문 항목 또는 종이 카드 이전 고유 번호") +
      '<p class="muted">무료 음료에는 적립하지 마세요. 종이 카드 이전은 원본을 회수하거나 이전 완료 표시해주세요.</p>';
  if (op === "approve") {
    const r = staffData.pending[index];
    if (!r) return;
    body = `<p>${esc(r.nickname)} · ${esc(r.qid)} · ${esc(r.cycle)}</p><input type="hidden" name="uid" value="${esc(r.uid)}"><input type="hidden" name="qid" value="${esc(r.qid)}"><input type="hidden" name="cycle" value="${esc(r.cycle)}"><label>처리<select name="approve"><option value="true">구매 확인 · 승인</option><option value="false">거절</option></select></label><label>주문 항목 고유 번호 (승인 시 필수)<input name="order_ref" maxlength="100"></label>`;
  }
  if (op === "reverse") {
    const r = staffData.recentGrants[index];
    if (!r) return;
    body =
      `<p>원래 적립 ${esc(r.amount)}개 · ${esc(r.reason)}</p>` +
      input("original_id", "원거래 번호", r.id) +
      input(
        "amount",
        "취소할 수량",
        1,
        "number",
        `min="1" max="${Number(r.amount)}" step="1"`,
      ) +
      '<p class="muted">이미 사용한 잔액으로 취소할 수 없으면 자동 차감하지 않고 관리자 확인이 필요해요.</p>';
  }
  if (op === "restore")
    body =
      input("original_id", "무료 음료 사용 원거래 번호") +
      input(
        "amount",
        "복원할 스탬프 수량",
        10,
        "number",
        'min="1" max="10" step="1"',
      );
  if (op === "coin-adjust")
    body =
      input("uid", "손님 계정 식별자") +
      input(
        "amount",
        "코인 조정량 (차감은 음수)",
        1,
        "number",
        'min="-100000" max="100000" step="1"',
      );
  if (["end", "hide", "unhide"].includes(op))
    body =
      input("uid", "대상 손님 계정 식별자") +
      `<p class="muted">${op === "end" ? "매장 참여와 공개를 종료해요." : op === "hide" ? "공개를 숨기고 재공개를 제한해요." : "다시 공개를 선택할 수 있게 제한을 해제해요. 자동 공개되지 않아요."}</p>`;
  if (op === "resolve") {
    const r = staffData.reports[index];
    if (!r) return;
    body = `<p>${esc(r.reason)}</p><input type="hidden" name="report_id" value="${esc(r.id)}"><label>처리 결과<select name="outcome"><option value="reviewed">확인 완료</option><option value="hidden">대상 프로필 숨김</option><option value="dismissed">조치 없이 종결</option></select></label>`;
  }
  modal(
    operationNames[op],
    `<form id="operation" data-op="${op}">${body}<label>처리 사유<input name="reason" required maxlength="300" placeholder="손님 안내 및 확인한 내용을 남겨주세요"></label><button class="primary" type="submit">내용 확인</button></form>`,
  );
}
function confirmOperation(op, data) {
  pendingOperation = { op, data };
  const labels = {
    kind: "콘텐츠 종류",
    id: "고유 ID",
    body: "새 버전 내용",
    enabled: "신규 참여 허용",
    starts: "시작",
    ends: "종료",
    closed: "영업 참여 종료",
    uid: "손님 식별자",
    amount: "수량",
    source_ref: "주문/이전 번호",
    original_id: "원거래",
    qid: "퀘스트",
    cycle: "회차",
    approve: "결정",
    order_ref: "주문 항목",
    reason: "사유",
    report_id: "신고",
    outcome: "처리 결과",
  };
  modal(
    operationNames[op] + " 확인",
    `<p>아래 내용을 확인한 뒤 확정해주세요. 서버 원장과 감사 기록에 남아요.</p><dl class="operation-summary">${Object.entries(
      data,
    )
      .map(
        ([k, v]) =>
          `<dt>${labels[k] || esc(k)}</dt><dd>${esc(k === "approve" ? (v ? "승인" : "거절") : k === "closed" ? (v ? "영업 종료 · 모든 참여 종료 및 공개 숨김" : "영업 재개 · 이전 참여 자동 복구 없음") : typeof v === "object" && v !== null ? JSON.stringify(v, null, 2) : v === null ? "제한 없음" : ["starts", "ends"].includes(k) ? new Date(v * 1000).toLocaleString("ko-KR") : typeof v === "boolean" ? (v ? "허용" : "중단") : v)}</dd>`,
      )
      .join(
        "",
      )}</dl><div class="actions"><button data-action="staff">취소</button><button class="primary" data-action="confirm-operation">확정</button></div>`,
  );
}
function receipt(r) {
  modal(
    "무료 음료 사용 완료",
    `<div class="receipt-mark" aria-hidden="true">☕</div><h3>스탬프 ${Math.abs(r.amount || 10)}개 사용</h3><p>직원에게 이 화면을 보여주세요.</p><p class="muted">사용 시각: ${esc(new Date(r.created * 1000).toLocaleString("ko-KR"))}<br>거래 번호: <code>${esc(r.id)}</code></p><p class="muted">움직이는 표시는 진위를 보장하지 않아요. 필요한 경우 직원이 서버 거래 기록을 확인해요. 손님이 직접 취소할 수 없어요.</p><button data-action="stamps">스탬프로 돌아가기</button>`,
  );
}
function guests() {
  modal(
    "함께 머무는 손님",
    `<p class="muted">맵에 공개 참여 중인 손님이에요. 실제 매장 인원이나 좌석 현황과 다를 수 있어요.</p>${(state.guests || []).map((g) => `<article class="card"><h3>${esc(g.nickname)} ${g.mode === "remote" ? "· 원격" : ""}</h3><p>${esc(g.activity || "")} ${esc(g.drink || "")}</p><div class="actions"><button data-guest="${esc(g.id)}" data-gaction="block">차단</button><button data-guest="${esc(g.id)}" data-gaction="report">신고</button></div></article>`).join("") || '<p class="empty">지금은 공개한 다른 손님이 없어요.<br>혼자서도 편안히 둘러보세요.</p>'}`,
  );
}
app.addEventListener("input", (e) => {
  if (e.target.id === "avatar-search") {
    avatarSearchQuery = e.target.value;
    updateAvatarSearch();
  }
});
app.addEventListener("change", (e) => {
  const el = e.target;
  if (el.dataset.avatarSlot) {
    avatarDraft.selection[el.dataset.avatarSlot] = el.value;
    if (!el.value) delete avatarDraft.selection[el.dataset.avatarSlot];
    if (avatarSearchQuery.trim()) {
      const slot = el.dataset.avatarSlot;
      updateAvatarSearch();
      const next =
        document.querySelector(`[data-avatar-slot="${slot}"]`) ||
        document.querySelector("#avatar-search");
      next?.focus();
    }
  } else if (el.dataset.avatarControl === "lens") avatarDraft.lens = el.value;
  else if (el.dataset.avatarControl === "motion")
    avatarPreviewMotion = el.value;
  else if (el.dataset.avatarControl === "direction")
    avatarPreviewDirection = el.value;
  else return;
  attachAvatar(document.querySelector("#avatar-preview"), avatarDraft, {
    motion: avatarPreviewMotion,
    direction: avatarPreviewDirection,
    timelineKey: "wardrobe-preview",
  });
});
app.addEventListener("click", handle);
sheet.addEventListener("click", handle);
app.addEventListener("keydown", (e) => {
  if (e.target.id !== "map" || !state) return;
  const delta = {
    ArrowLeft: [-0.04, 0],
    ArrowRight: [0.04, 0],
    ArrowUp: [0, -0.04],
    ArrowDown: [0, 0.04],
  }[e.key];
  if (delta) {
    e.preventDefault();
    walk(state.session.x + delta[0], state.session.y + delta[1]);
  }
});
async function handle(e) {
  const b = e.target.closest("button");
  if (b) {
    if (b.dataset.avatarFilter) {
      avatarSlotFilter = b.dataset.avatarFilter;
      updateAvatarSearch();
      return;
    }
    if (b.dataset.mapMotion) {
      mapPose = b.dataset.mapMotion;
      sheet.close();
      setAvatarMotion(
        document.querySelector("#map #player canvas"),
        mapPose,
        mapDirection,
      );
      return;
    }
    if (b.dataset.conceptMotion) {
      characterConcepts(b.dataset.conceptMotion);
      return;
    }
    if (b.dataset.demoKakao && demoRuntime.enabled) {
      const r = await act(
        "demo/kakao",
        { mode: b.dataset.demoKakao },
        "데모 계정 연결 상태를 갱신했어요. 실제 카카오 인증은 하지 않았어요.",
      );
      if (r) {
        sheet.close();
        page = "cafe";
        draw();
      }
      return;
    }
    if (b.dataset.demoConvert && inDemo()) {
      const r = await act(
        "stamps/convert",
        { amount: Number(b.dataset.demoConvert) },
        "예시 전환이 완료됐어요. 실제 매장 스탬프에는 영향이 없어요.",
      );
      if (r) stamps();
      return;
    }
    if (b.dataset.contentKind) {
      contentForm(b.dataset.contentKind, b.dataset.contentIndex);
      return;
    }
    if (b.dataset.op) {
      operationForm(b.dataset.op, Number(b.dataset.index));
      return;
    }
    if (b.dataset.unblock) {
      if (await act("unblock", { id: b.dataset.unblock }, "차단을 해제했어요."))
        await blocks();
      return;
    }
    if (b.dataset.page) {
      page = b.dataset.page;
      draw();
      return;
    }
    if (b.dataset.tab) {
      wardrobeTab = b.dataset.tab;
      draw();
      return;
    }
    if (b.dataset.quest) {
      const q = state.quests.find((q) => q.id === b.dataset.quest);
      if (b.dataset.qaction === "progress" && q.kind === "mood") {
        modal(
          "오늘의 기분",
          `<p>다른 손님에게 공개하지 않아도 괜찮아요.</p><div class="actions">${[
            ["calm", "편안해요"],
            ["focused", "집중하고 싶어요"],
            ["happy", "설레요"],
            ["tired", "쉬고 싶어요"],
          ]
            .map(
              ([v, label]) =>
                `<button data-mood="${v}" data-qid="${esc(q.id)}">${label}</button>`,
            )
            .join("")}</div>`,
        );
        return;
      }
      if (b.dataset.qaction === "progress" && q.kind === "explore") {
        page = "cafe";
        draw();
        notify("오른쪽 위 화분의 ♧ 버튼을 눌러주세요.");
        return;
      }
      await act(
        "quest",
        { id: b.dataset.quest, action: b.dataset.qaction },
        "퀘스트 상태를 업데이트했어요.",
      );
      return;
    }
    if (b.dataset.mood) {
      await act(
        "quest",
        { id: b.dataset.qid, action: "progress", value: b.dataset.mood },
        "오늘의 기분을 기록했어요.",
      );
      sheet.close();
      return;
    }
    if (b.dataset.item) {
      const item = state.items.find((i) => i.id === b.dataset.item);
      if (b.dataset.iaction === "buy") {
        modal(
          "구매 확인",
          `<h3>${esc(item.name)}</h3><p>${item.price} 코인을 사용해요. 남은 코인: ${state.user.coins - item.price}</p><button data-buy="${esc(item.id)}" class="primary" ${state.user.coins < item.price ? "disabled" : ""}>구매 확정</button>`,
        );
      } else await act("equip", { id: item.id }, "착용 상태를 저장했어요.");
      return;
    }
    if (b.dataset.buy) {
      if (await act("buy", { id: b.dataset.buy }, "내 아이템에 추가했어요."))
        sheet.close();
      return;
    }
    if (b.dataset.guest) {
      if (b.dataset.gaction === "block") {
        await act(
          "block",
          { id: b.dataset.guest },
          "서로의 손님 카드가 숨겨져요.",
        );
        guests();
      } else
        modal(
          "신고하기",
          `<form id="report" data-id="${esc(b.dataset.guest)}"><label>신고 사유<input name="reason" required maxlength="200"></label><button type="submit">신고 접수</button></form>`,
        );
      return;
    }
    const action = b.dataset.action;
    if(action==='avatar-diagnostics-refresh'){const target=document.querySelector('#avatar-render-stats');if(target)target.innerHTML=avatarDiagnosticsMarkup();return;}
    if (action === "avatar-search-clear") {
      avatarSearchQuery = "";
      avatarSlotFilter = "all";
      const input = document.querySelector("#avatar-search");
      if (input) {
        input.value = "";
        updateAvatarSearch();
        input.focus();
      }
      return;
    }

    if (action === "avatar-retry") {
      startAvatarLoading();
      return;
    }
    if (action === "avatar-actions") {
      modal(
        "캐릭터 동작",
        `<p class="muted">화면에서만 재생되는 모션이에요. 퀘스트·구매·상태를 바꾸지 않아요.</p><button data-action="avatar-retry">애셋 다시 불러오기</button><div class="actions">${Object.keys(
          avatarManifest?.motions || {},
        )
          .map(
            (v) =>
              `<button data-map-motion="${v}">${motionLabels[v] || v}</button>`,
          )
          .join("")}</div>`,
      );
      return;
    }
    if (action === "avatar-reset") {
      avatarDraft = { selection: {}, lens: "charcoal" };
      draw();
      return;
    }
    if (action === "avatar-save") {
      const snapshot = {
        selection: { ...avatarDraft.selection },
        lens: avatarDraft.lens,
      };
      const r = await act("avatar", snapshot, "캐릭터 파츠를 저장했어요.");
      if (r) {
        if (r.user && state?.user?.id === r.user.id) state.user = r.user;
        if (JSON.stringify(avatarDraft) === JSON.stringify(snapshot))
          avatarDraft = normalizeAvatar(
            r.user?.appearance?.avatar02 || snapshot,
          );
        draw();
      }
      return;
    }

    if (action === "character-concepts") {
      characterConcepts();
      return;
    }
    if (demoRuntime.enabled) {
      if (action === "demo-stamp-code") {
        await demoStampCode();
        return;
      }
      if (action === "demo-convert") {
        demoConversion();
        return;
      }
      if (action === "demo-checkin") {
        await act("checkin", { entry: "cafe" }, "가상 매장에 입장했어요.");
        return;
      }
      if (action === "demo-advance") {
        await act(
          "demo/advance",
          { minutes: 91 },
          "데모 시간을 91분 진행했어요.",
        );
        return;
      }
      if (action === "demo-reset") {
        modal(
          "데모를 초기화할까요?",
          '<p>이 브라우저의 가상 계정·거래·진행도만 초기화해요. 실제 서비스 데이터는 건드리지 않아요.</p><button data-action="confirm-demo-reset">데모 초기화 확정</button>',
        );
        return;
      }
      if (action === "confirm-demo-reset") {
        if (await act("demo/reset", {}, "데모를 초기화했어요.")) {
          sheet.close();
          page = "cafe";
          draw();
        }
        return;
      }
      if (action === "demo-delete") {
        modal(
          "데모 계정 삭제 체험",
          '<p>현재 가상 계정 데이터만 삭제해요. 실제 카카오 계정이나 서비스 데이터는 삭제하지 않아요.</p><button data-action="confirm-demo-delete">가상 계정 삭제 확정</button>',
        );
        return;
      }
      if (action === "confirm-demo-delete") {
        if (
          await act(
            "account/delete",
            { confirm: true },
            "가상 계정을 삭제했어요.",
          )
        ) {
          sheet.close();
          page = "cafe";
          draw();
        }
        return;
      }
    }
    if (action === "close") sheet.close();
    if (action === "retry") {
      try {
        await refresh();
      } catch {
        notify("아직 연결할 수 없어요.");
      }
    }
    if (action === "onboard") onboard();
    if (action === "profile") profile();
    if (action === "privacy") privacy();
    if (action === "stamps") stamps();
    if (action === "guests") guests();
    if (action === "hide")
      await act(
        "privacy",
        { visible: false, activity: "", drink: "" },
        "모두에게 숨겼어요.",
      );
    if (action === "extend") {
      await act("extend", {}, "참여 시간을 연장했어요.");
      sheet.close();
    }
    if (action === "checkout") {
      modal(
        "매장 참여를 마칠까요?",
        `<p>공개가 숨겨지고 퀘스트 진행이 멈춰요. 보유 코인과 아이템은 그대로 남아요.</p><button data-action="confirm-checkout">참여 종료</button>`,
      );
    }
    if (action === "confirm-checkout") {
      await act("checkout", {}, "원격 모드로 전환했어요.");
      sheet.close();
    }
    if (action === "plant") {
      const q = state.quests.find((q) => q.kind === "explore");
      if (!q) {
        notify("탐색 퀘스트를 확인해주세요.");
        return;
      }
      if (q.available === false || q.status === "unavailable") {
        notify("지금은 이 퀘스트에 참여할 수 없어요.");
        return;
      }
      if (!isStore()) {
        notify("매장 QR로 참여하면 탐색할 수 있어요.");
        return;
      }
      await act(
        "quest",
        {
          id: q.id,
          action: q.status === "available" ? "start" : "progress",
          value: "plant",
        },
        q.status === "available"
          ? "퀘스트를 시작했어요. 화분을 한 번 더 살펴보세요."
          : "화분을 살펴봤어요.",
      );
    }
    if (action === "confirm-operation" && pendingOperation) {
      const { op, data } = pendingOperation;
      const r = await act("staff/" + op, data, "처리를 완료했어요.");
      if (r) {
        pendingOperation = null;
        await staff();
      }
    }
    if (action === "account") account();
    if (action === "ledger") ledger();
    if (action === "ledger-stamps") ledger("stamps");
    if (action === "blocks") await blocks();
    if (action === "staff") await staff();
    if (action === "logout")
      modal(
        "로그아웃할까요?",
        `<p>${state.user.linked ? "다시 로그인하면 연결 계정의 진행도를 이어갈 수 있어요." : "게스트는 로그아웃하면 이 캐릭터와 진행도에 다시 접근하지 못할 수 있어요. 카카오 연결이 준비되기 전에는 로그아웃하지 않는 것을 권장해요."}</p><div class="actions"><button data-action="close">유지하기</button><button data-action="confirm-logout">위험을 이해했어요 · 로그아웃</button></div>`,
      );
    if (action === "confirm-logout") {
      if (await act("logout", {}, "로그아웃했어요.")) {
        sheet.close();
        page = "cafe";
        draw();
      }
    }
    if (action === "redeem")
      modal(
        "직원에게 보여주며 사용해주세요",
        `<p>스탬프 10개를 차감하고 원하는 음료 한 잔을 사용해요.</p><p>차감 후 ${state.user.stamps - 10}개가 남아요. 직접 취소·복원할 수 없으니 직원과 함께 확인해주세요.</p><div class="actions"><button data-action="close">취소</button><button class="primary" data-action="confirm-redeem">10개 차감하고 사용</button></div>`,
      );
    if (action === "confirm-redeem") {
      const r = await act("stamps/redeem", {});
      if (r?.receipt) receipt(r.receipt);
      else if (r) notify("사용 결과의 거래 내역을 확인해주세요.");
    }
    return;
  }
  if (e.target.closest("#map")) {
    const r = e.target.closest("#map").getBoundingClientRect();
    await walk((e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height);
  }
}
sheet.addEventListener("submit", async (e) => {
  e.preventDefault();
  const f = e.target,
    d = new FormData(f);
  if (f.id === "demo-convert" && inDemo()) {
    const amount = Number(d.get("amount"));
    if (!Number.isInteger(amount) || amount < 1 || amount > state.user.stamps) {
      notify("보유량 안에서 전환할 수량을 골라주세요.");
      return;
    }
    modal(
      "예시 전환 확인",
      `<p>가상 스탬프 ${amount}개 차감 → ${amount * 50} 코인 지급</p><p>전환 후 스탬프 ${state.user.stamps - amount}개, 코인 ${state.user.coins + amount * 50}개예요.</p><p class="notice">예시 비율 · 실제 사용 불가 · 역전환 불가</p><button class="primary" data-demo-convert="${amount}">가상 전환 확정</button>`,
    );
    return;
  }
  if (f.id === "content") {
    const kind = f.dataset.kind,
      starts = d.get("starts")
        ? new Date(d.get("starts")).getTime() / 1000
        : null,
      ends = d.get("ends") ? new Date(d.get("ends")).getTime() / 1000 : null;
    if (
      (starts !== null && !Number.isFinite(starts)) ||
      (ends !== null && !Number.isFinite(ends)) ||
      (starts !== null && ends !== null && ends <= starts)
    ) {
      notify("종료 시간은 시작 시간보다 뒤여야 해요.");
      return;
    }
    const body =
      kind === "item"
        ? {
            name: d.get("name"),
            price: Number(d.get("price")),
            slot: d.get("slot"),
          }
        : {
            title: d.get("title"),
            description: d.get("description"),
            reward: Number(d.get("reward")),
            kind: d.get("quest-kind"),
          };
    confirmOperation("content", {
      kind,
      id: d.get("id"),
      body,
      enabled: d.has("enabled"),
      starts,
      ends,
      reason: d.get("reason"),
    });
  }
  if (f.id === "operation") {
    const data = Object.fromEntries(d.entries());
    if ("closed" in data) data.closed = data.closed === "true";
    if ("amount" in data) data.amount = Number(data.amount);
    if ("approve" in data) {
      data.approve = data.approve === "true";
      if (data.approve && !data.order_ref.trim()) {
        notify("승인할 주문 항목 고유 번호를 입력해주세요.");
        return;
      }
    }
    if (
      "amount" in data &&
      (!Number.isInteger(data.amount) || data.amount === 0)
    ) {
      notify("0이 아닌 정수 수량을 입력해주세요.");
      return;
    }
    confirmOperation(f.dataset.op, data);
  }
  if (f.id === "nickname") {
    if (
      await act(
        "profile",
        { nickname: d.get("nickname") },
        "닉네임을 저장했어요.",
      )
    )
      account();
  }
  if (f.id === "onboard") {
    const r = await act("guest", {
      nickname: d.get("nickname"),
      appearance: {
        color: ["#a777be", "#789b66", "#709cb3", "#c57c77"][
          Number(d.get("appearance"))
        ],
      },
    });
    if (r) {
      sheet.close();
      await checkEntry();
    }
  }
  if (f.id === "privacy") {
    if (
      await act(
        "privacy",
        {
          visible: d.has("visible"),
          activity: d.get("activity"),
          drink: d.get("drink"),
        },
        "공개 설정을 저장했어요.",
      )
    )
      sheet.close();
  }
  if (f.id === "report") {
    await act(
      "report",
      { id: f.dataset.id, reason: d.get("reason") },
      "신고를 접수했어요.",
    );
    sheet.close();
  }
});
async function checkEntry() {
  if (entryPending && state?.user) {
    const entryCode = entryPending;
    entryPending = false;
    const checkedIn = await act(
      "checkin",
      { entry: entryCode },
      "매장 모드로 참여했어요. 공개는 직접 선택해주세요.",
    );
    const cleanUrl = new URL(location.href);
    cleanUrl.searchParams.delete("entry");
    history.replaceState(null, "", cleanUrl.pathname + cleanUrl.search);
    if (checkedIn) privacy();
  }
}
async function walk(x, y) {
  if (busy) return;
  busy = true;
  try {
    const result = await api("move", { x, y });
    const player = document.querySelector("#map #player");
    let lastPoint = { x: state.session.x, y: state.session.y };
    for (const pt of result.path || [{ x, y }]) {
      if (!player || !player.isConnected || page !== "cafe") break;
      const px = Array.isArray(pt) ? pt[0] : pt.x,
        py = Array.isArray(pt) ? pt[1] : pt.y;
      mapDirection = directionBetween(lastPoint, { x: px, y: py });
      mapPose = "walk";
      setAvatarMotion(player.querySelector("canvas"), mapPose, mapDirection);
      lastPoint = { x: px, y: py };
      player.style.left = px * 100 + "%";
      player.style.top = py * 100 + "%";
      player.style.zIndex = Math.round(py * 100);
      await new Promise((r) => setTimeout(r, 90));
    }
    mapPose = "idle";
    setAvatarMotion(player?.querySelector("canvas"), "idle", mapDirection);
    await refresh();
  } catch (e) {
    notify(e.message);
  } finally {
    mapPose = "idle";
    setAvatarMotion(
      document.querySelector("#map #player canvas"),
      "idle",
      mapDirection,
    );
    busy = false;
  }
}
function startAvatarLoading() {
  retryAvatarImages();
  avatarLoadError = "";
  loadAvatarCatalogue()
    .then((m) => {
      avatarManifest = m;
      if (state) draw();
    })
    .catch((e) => {
      avatarLoadError = e.message;
      if (state) draw();
    });
}
startAvatarLoading();
if (demoRuntime.enabled) {
  demoControls();
  try {
    demoRuntime.api = (await import("./demo-api.js")).demoApi;
  } catch (e) {
    notify("데모 모듈을 불러오지 못했어요. 실제 서버는 호출하지 않아요.");
  }
}
try {
  await refresh();
  await checkEntry();
} catch {}
setInterval(async () => {
  if (!document.hidden && !busy) {
    try {
      await api("heartbeat", { foreground: true });
      await refresh(!sheet.open && page !== "character");
    } catch {}
  }
}, 4000);
