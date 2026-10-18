// Portable shared-design integration; only the local pinned asset file is fetched.
import { verify, importDesign, decodeDesign, ASSET_SHA, THEMES } from './shared/model.mjs';
import { compose } from './shared/art.mjs';
export { importDesign, decodeDesign };
let dataPromise;
export async function loadCanonicalAssets() {
  if (!dataPromise) dataPromise = (async () => {
    const response = await fetch(new URL('./assets/image-data.json', import.meta.url), { credentials: 'omit', mode: 'same-origin' });
    if (!response.ok) throw new Error('The local Nouns artwork could not be loaded.');
    const bytes = await response.arrayBuffer();
    const hash = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes)), value => value.toString(16).padStart(2, '0')).join('');
    if (hash !== ASSET_SHA) throw new Error('The local Nouns artwork does not match its source record.');
    return JSON.parse(new TextDecoder().decode(bytes));
  })().catch(error => { dataPromise = null; throw error; });
  return dataPromise;
}
export async function prepareWorkshopDesign(input, data) {
  const design = await verify(input);
  const source = data || await loadCanonicalAssets();
  return {
    design,
    svg: compose(design, source, 'front', 'industry-production'),
    description: `${THEMES[design.theme].name}, ${design.edition.label}, original Nouns collectible art specimen.`,
  };
}
