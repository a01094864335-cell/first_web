/** Game adapter for Avatar02's audited viewer compositor.
 * Uses the catalogue's layer plan, masks, glasses clipping and frame helpers.
 * The only copied-viewer change is AVATAR_VIEWER_NO_BOOT; original PR3 is untouched.
 */
const ROOT = "/avatar02/";
let manifest,
  helpers,
  loading,
  revision = 0,
  ticking = false;
const images = new Map(),
  registrations = new Map(),
  frames = new Map(),
  timelines = new Map();
const preSlots = new Set([
  "hairRear",
  "base",
  "skin",
  "eyeCover",
  "eyes",
  "bottom",
  "shoes",
  "top",
]);
export async function loadAvatarCatalogue() {
  if (loading) return loading;
  loading = (async () => {
    globalThis.AVATAR_VIEWER_NO_BOOT = true;
    if (!globalThis.AvatarViewer)
      await new Promise((resolve, reject) => {
        const script = document.createElement("script");
        const timer = setTimeout(() => {
          script.remove();
          reject(Error("캐릭터 합성기 연결이 지연돼요. 다시 시도해주세요."));
        }, 8000);
        script.src = ROOT + "viewer.js";
        script.onload = () => {
          clearTimeout(timer);
          resolve();
        };
        script.onerror = () => {
          clearTimeout(timer);
          script.remove();
          reject(Error("캐릭터 합성기를 읽지 못했어요."));
        };
        document.head.append(script);
      });
    helpers = globalThis.AvatarViewer;
    const response = await fetch(ROOT + "manifest.json", {
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) throw Error("캐릭터 목록을 읽지 못했어요.");
    manifest = await response.json();
    return manifest;
  })().catch((error) => {
    loading = null;
    throw error;
  });
  return loading;
}
export function normalizeAvatar(value = {}) {
  const selection = {};
  for (const [slot, id] of Object.entries(value.selection || {}))
    if (manifest?.items.some((i) => i.slot === slot && i.id === id))
      selection[slot] = id;
  return {
    selection,
    lens: manifest?.lensColors.includes(value.lens) ? value.lens : "charcoal",
  };
}
function image(path) {
  if (!images.has(path)) {
    const img = new Image();
    img.onload = () => {
      revision++;
      frames.clear();
    };
    img.onerror = () => {
      revision++;
      img.failed = true;
    };
    img.src = ROOT + path;
    images.set(path, img);
  }
  return images.get(path);
}
function canvas() {
  const c = document.createElement("canvas");
  [c.width, c.height] = manifest.cell;
  return c;
}
function compose(state, direction, frame) {
  const token = JSON.stringify([
    state.selection,
    state.lens,
    state.motion,
    direction,
    frame,
    revision,
  ]);
  if (frames.has(token)) return frames.get(token);
  const [cw, ch] = manifest.cell,
    row = manifest.directions.indexOf(direction),
    plan = helpers.layerPlan(manifest, state, direction);
  const tile = canvas(),
    before = canvas(),
    restored = canvas(),
    off = canvas();
  const tc = tile.getContext("2d"),
    bc = before.getContext("2d"),
    rc = restored.getContext("2d"),
    oc = off.getContext("2d");
  tc.imageSmoothingEnabled =
    bc.imageSmoothingEnabled =
    rc.imageSmoothingEnabled =
    oc.imageSmoothingEnabled =
      false;
  const paint = (ctx, path) => {
    const img = image(path);
    if (img.complete && img.naturalWidth)
      ctx.drawImage(img, frame * cw, row * ch, cw, ch, 0, 0, cw, ch);
  };
  const restore = (path) => {
    if (!path) return;
    const mask = image(path);
    if (mask.complete && mask.naturalWidth) {
      rc.clearRect(0, 0, cw, ch);
      rc.globalCompositeOperation = "source-over";
      rc.drawImage(before, 0, 0);
      rc.globalCompositeOperation = "destination-in";
      paint(rc, path);
      rc.globalCompositeOperation = "source-over";
      tc.drawImage(restored, 0, 0);
    }
  };
  const glasses = (path) => {
    const pixels = (p) => {
      oc.clearRect(0, 0, cw, ch);
      if (p) paint(oc, p);
      return oc.getImageData(0, 0, cw, ch).data;
    };
    const raw = pixels(path),
      hair = plan.layers.find((l) => l.slot === "hair"),
      hat = plan.layers.find((l) => l.slot === "hat");
    const out = oc.createImageData(cw, ch);
    out.data.set(
      helpers.clipGlassesPixels(
        raw,
        hair ? pixels(hair.path) : null,
        hat ? pixels(hat.path) : null,
        cw,
        direction,
      ),
    );
    oc.putImageData(out, 0, 0);
    tc.drawImage(off, 0, 0);
  };
  let hasHand = false;
  for (const layer of plan.layers) {
    if (layer.slot === "hand") {
      restore(plan.handsMask);
      hasHand = true;
    }
    if (layer.slot === "glasses") glasses(layer.path);
    else paint(tc, layer.path);
    if (preSlots.has(layer.slot)) paint(bc, layer.path);
  }
  restore(hasHand ? plan.gripMask : plan.handsMask);
  for (const layer of helpers.foregroundProtectionLayers(plan, direction))
    paint(tc, layer.path);
  if (frames.size > 256) frames.clear();
  frames.set(token, tile);
  return tile;
}
function tick(now) {
  for (const [element, r] of registrations) {
    if (!element.isConnected) {
      registrations.delete(element);
      continue;
    }
    if (document.hidden) continue;
    const frame = helpers.frameAt(
      manifest,
      r.motion,
      matchMedia("(prefers-reduced-motion: reduce)").matches
        ? 0
        : now - r.origin,
    );
    const token = JSON.stringify([
      r.selection,
      r.lens,
      r.motion,
      r.direction,
      frame,
      revision,
    ]);
    if (token === r.painted) continue;
    r.painted = token;
    const ctx = element.getContext("2d");
    if (!ctx) continue;
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, element.width, element.height);
    ctx.drawImage(
      compose(r, r.direction, frame),
      0,
      0,
      element.width,
      element.height,
    );
    const plan = helpers.layerPlan(manifest, r, r.direction),
      paths = [
        ...plan.layers.map((l) => l.path),
        plan.handsMask,
        plan.gripMask,
      ].filter(Boolean);
    const failed = paths.filter((p) => image(p).failed),
      ready = paths.every((p) => image(p).complete && image(p).naturalWidth);
    element.dataset.ready = String(ready);
    element.dataset.error = String(failed.length > 0);
    const fallback = element.parentElement?.querySelector(".avatar-fallback");
    if (fallback)
      fallback.textContent = failed.length ? "애셋 로드 오류" : "불러오는 중";
    element.title = failed.length
      ? "일부 캐릭터 애셋을 불러오지 못했어요. 새로고침해 다시 시도해주세요."
      : "";
  }
  if (registrations.size) requestAnimationFrame(tick);
  else ticking = false;
}
export function attachAvatar(element, value = {}, options = {}) {
  if (!manifest || !element) return;
  const previous = registrations.get(element),
    normalized = normalizeAvatar(value);
  const motion = manifest.motions[options.motion] ? options.motion : "idle",
    direction = manifest.directions.includes(options.direction)
      ? options.direction
      : "front";
  const timeline = options.timelineKey && timelines.get(options.timelineKey);
  const origin =
    previous?.motion === motion
      ? previous.origin
      : timeline?.motion === motion
        ? timeline.origin
        : performance.now();
  if (options.timelineKey)
    timelines.set(options.timelineKey, { motion, origin });
  const r = {
    ...normalized,
    motion,
    direction,
    origin,
    timelineKey: options.timelineKey || previous?.timelineKey,
    painted: null,
  };
  element.width = manifest.cell[0];
  element.height = manifest.cell[1];
  registrations.set(element, r);
  if (!ticking) {
    ticking = true;
    requestAnimationFrame(tick);
  }
}
export function setAvatarMotion(element, motion, direction) {
  const previous = registrations.get(element);
  if (previous)
    attachAvatar(element, previous, {
      motion,
      direction: direction || previous.direction,
      timelineKey: previous.timelineKey,
    });
}
export function directionBetween(from, to) {
  const dx = to.x - from.x,
    dy = to.y - from.y;
  return Math.abs(dx) > Math.abs(dy)
    ? dx > 0
      ? "right"
      : "left"
    : dy > 0
      ? "front"
      : "back";
}
export function avatarDiagnostics() {
  return {
    registered: registrations.size,
    images: images.size,
    failed: [...images.entries()].filter(([, v]) => v.failed).map(([k]) => k),
  };
}

export function retryAvatarImages() {
  for (const [path, img] of images) if (img.failed) images.delete(path);
  frames.clear();
  revision++;
}
