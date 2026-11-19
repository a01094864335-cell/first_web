// Scene objects, foot-depth and interaction affordances share the layout manifest.
const escapeHTML = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
export const sceneDepth = y => Math.round(Number(y) * 1000) + 100;
export function renderMapScene(layout) {
  if (!layout) return '<p class="map-error" role="status">맵을 불러오는 중이에요.</p>';
  return layout.objects.map(object => {
    const style = `left:${object.x*100}%;top:${object.y*100}%;width:${object.width*100}%;height:${object.height*100}%;z-index:${sceneDepth(object.depth ?? object.y+object.height)}`;
    const asset = String(object.asset || '');
    if (!/^[a-zA-Z0-9_./-]+\.(?:png|webp|svg)$/.test(asset) || asset.includes('..')) throw Error('Invalid map asset path');
    const url = asset.startsWith('/public/assets/') ? asset : `/public/assets/cafe-map/${asset}`;
    const repeat = object.repeat && object.tileSize;
    const crop = object.sourceRect;
    if (crop && (!object.sourceSize || crop.length !== 4 || crop.some(v=>!Number.isFinite(v)||v<0))) throw Error('Invalid map source crop');
    const image = repeat ? `<div class="map-object map-tile" data-map-object="${escapeHTML(object.id)}" style="${style};background-image:url('${url}');background-size:${object.tileSize.width/object.width*100}% ${object.tileSize.height/object.height*100}%;background-repeat:repeat" aria-hidden="true"></div>` : crop ? `<svg class="map-object" data-map-object="${escapeHTML(object.id)}" style="${style}" viewBox="${crop.join(' ')}" preserveAspectRatio="none" aria-hidden="true"><image href="${url}" width="${object.sourceSize.width}" height="${object.sourceSize.height}"/></svg>` : `<img class="map-object" data-map-object="${escapeHTML(object.id)}" src="${url}" style="${style}" alt="" draggable="false">`;
    const interaction = object.interaction;
    if (!interaction) return image;
    // The visual badge may float above its object; the interaction's route always ends at its floor anchor.
    const badge = interaction.badge || {x: object.x+object.width/2,y:object.y};
    return image + `<button class="map-hotspot" data-action="map-object" data-map-target="${escapeHTML(object.id)}" style="left:${badge.x*100}%;top:${badge.y*100}%" aria-label="${escapeHTML(interaction.label)}"><span aria-hidden="true">${interaction.action === "door" ? "↪" : "♧"}</span></button>`;
  }).join('');
}
