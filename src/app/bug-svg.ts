export interface BugValues {
  rankNumber: string;
  teamName: string;
  score: string;
}

export interface BugRotationTiming {
  teamSec: number;
  sponsorSec: number;
}

const ORIGINAL_TIMELINE = {
  teamOut: 2.25,
  sponsorEnd: 26.42,
  teamIn: 28.71,
} as const;
const TRANSITION_SEC = 0.65;

/** Total SVG cycle length for team + sponsor pages including transitions. */
export function bugCycleDuration(timing: BugRotationTiming): number {
  return timing.teamSec + timing.sponsorSec + 2 * TRANSITION_SEC;
}

export function bugCycleKeyframes(timing: BugRotationTiming) {
  const total = bugCycleDuration(timing);
  const pct = (seconds: number) => (seconds / total) * 100;

  return {
    total,
    teamHoldEnd: pct(timing.teamSec),
    sponsorStart: pct(timing.teamSec + TRANSITION_SEC),
    sponsorEnd: pct(timing.teamSec + TRANSITION_SEC + timing.sponsorSec),
  };
}

/** Numeric rank for the bug (e.g. "1st" → "1"). */
export function rankNumberFromSheet(rank: string): string {
  const match = /\d+/.exec(rank.trim());
  return match ? match[0] : rank.trim();
}

/** Comma-separated whole number to match the bug SVG placeholder style. */
export function formatBugScore(value: number): string {
  const whole = Math.round(Number(value));
  if (!Number.isFinite(whole)) {
    return '0';
  }
  return whole.toLocaleString('en-US', { maximumFractionDigits: 0 });
}

/** Uppercase and ellipsize a team name to fit the stats column at max font size. */
export function formatTeamName(name: string, maxWidth = TEAM_NAME_MAX_WIDTH): string {
  return ellipsizeText(name.trim().toUpperCase(), maxWidth, TEAM_NAME_MAX_FONT_SIZE, TEAM_NAME_CHAR_RATIO);
}

/** x center within the stats column (relative to translate(66 …) origin). */
const STATS_TEXT_CENTER = 113;

const TEAM_NAME_MAX_FONT_SIZE = 14;
const TEAM_NAME_MAX_WIDTH = 200;
const TEAM_NAME_CHAR_RATIO = 0.62;

const SCORE_FONT_SIZE = 32;
const SCOREBOX_Y = 14;
const TEAM_TOTAL_Y = 52;
const COIN_WIDTH = 22;
const COIN_GAP = 8;
const COIN_Y = 9.5;

const PLACEHOLDER_VALUES: BugValues = {
  rankNumber: '0',
  teamName: 'TEAM',
  score: '0',
};

export function patchBugSvg(
  svg: string,
  values: BugValues,
  rotation: BugRotationTiming | null = null,
): string {
  const doc = parseBugSvg(svg);
  applyBugValues(doc, values);
  let result = serializeBugSvg(doc);
  result = rotation ? patchBugRotation(result, rotation) : disableBugRotation(result);
  return result;
}

/** Patch the static bug shell once; update live values with {@link updateBugValuesInDom}. */
export function patchBugShell(
  svg: string,
  rotation: BugRotationTiming | null = null,
): string {
  return patchBugSvg(svg, PLACEHOLDER_VALUES, rotation);
}

export function updateBugValuesInDom(root: ParentNode, values: BugValues): boolean {
  if (!root.querySelector('#teamName')) {
    return false;
  }

  applyBugValues(root, values);
  return true;
}

function parseBugSvg(svg: string): Document {
  return new DOMParser().parseFromString(svg, 'image/svg+xml');
}

function serializeBugSvg(doc: Document): string {
  return new XMLSerializer().serializeToString(doc.documentElement);
}

function applyBugValues(scope: Document | ParentNode, values: BugValues): void {
  setSvgText(scope, 'rankNumber', values.rankNumber);
  setSvgText(scope, 'score', values.score);
  centerBugStats(scope, values);
  if (scope instanceof Document && scope.documentElement.tagName === 'svg') {
    fixAlienLogoOverflow(scope);
  }
}

/** Prevent the header bar from rendering above the SVG viewport. */
function fixAlienLogoOverflow(doc: Document): void {
  doc.documentElement.setAttribute('overflow', 'hidden');

  const alienLogo = doc.getElementById('alien_logo');
  if (alienLogo) {
    alienLogo.setAttribute('transform', 'translate(0 0)');
  }

  const texture = doc.getElementById('texture');
  if (texture) {
    texture.setAttribute('transform', 'translate(0 0)');
  }
}

function centerBugStats(scope: Document | ParentNode, values: BugValues): void {
  styleTeamName(scope, values.teamName, STATS_TEXT_CENTER);
  styleTeamTotal(scope, STATS_TEXT_CENTER);
  styleScorebox(scope, values.score, STATS_TEXT_CENTER);
}

function styleTeamName(scope: Document | ParentNode, teamName: string, centerX: number): void {
  const el = bugElement(scope, 'teamName');
  if (!el) {
    return;
  }

  const displayName = formatTeamName(teamName);
  el.setAttribute('text-anchor', 'middle');
  el.setAttribute('font-size', String(TEAM_NAME_MAX_FONT_SIZE));

  const tspan = el.querySelector('tspan');
  if (tspan) {
    tspan.textContent = displayName;
    tspan.setAttribute('x', String(centerX));
  }
}

function styleTeamTotal(scope: Document | ParentNode, centerX: number): void {
  const el = bugElement(scope, 'teamTotal');
  if (!el) {
    return;
  }

  el.setAttribute('text-anchor', 'middle');
  el.setAttribute('transform', `translate(66 ${TEAM_TOTAL_Y})`);

  const tspan = el.querySelector('tspan');
  if (tspan) {
    tspan.setAttribute('x', String(centerX));
  }
}

function styleScorebox(scope: Document | ParentNode, scoreText: string, centerX: number): void {
  const scorebox = bugElement(scope, 'scorebox_2');
  if (scorebox) {
    scorebox.setAttribute('transform', `translate(66 ${SCOREBOX_Y})`);
  }

  const scoreEl = bugElement(scope, 'score');
  if (!scoreEl) {
    return;
  }

  const scoreWidth = estimateTextWidth(scoreText, SCORE_FONT_SIZE);
  scoreEl.setAttribute('text-anchor', 'middle');
  scoreEl.removeAttribute('transform');

  const tspan = scoreEl.querySelector('tspan');
  if (tspan) {
    tspan.setAttribute('x', String(centerX));
  }

  const coinEl = bugElement(scope, 'coin');
  if (coinEl) {
    const coinX = centerX - scoreWidth / 2 - COIN_GAP - COIN_WIDTH;
    coinEl.setAttribute('transform', `translate(${coinX} ${COIN_Y})`);
  }
}

function ellipsizeText(
  text: string,
  maxWidth: number,
  fontSize: number,
  charWidthRatio: number,
): string {
  if (estimateTextWidth(text, fontSize, charWidthRatio) <= maxWidth) {
    return text;
  }

  const ellipsis = '…';
  let trimmed = text;
  while (
    trimmed.length > 0 &&
    estimateTextWidth(trimmed + ellipsis, fontSize, charWidthRatio) > maxWidth
  ) {
    trimmed = trimmed.slice(0, -1);
  }

  return trimmed.length < text.length ? `${trimmed}${ellipsis}` : text;
}

function estimateTextWidth(text: string, fontSize: number, charWidthRatio = 0.58): number {
  return text.length * fontSize * charWidthRatio;
}

function bugElement(scope: Document | ParentNode, id: string): Element | null {
  if (scope instanceof Document) {
    return scope.getElementById(id);
  }
  return scope.querySelector(`#${id}`);
}

function setSvgText(scope: Document | ParentNode, id: string, text: string): void {
  const el = bugElement(scope, id);
  if (!el) {
    return;
  }
  const tspan = el.querySelector('tspan');
  if (tspan) {
    tspan.textContent = text;
    return;
  }
  el.textContent = text;
}

function patchBugRotation(svg: string, timing: BugRotationTiming): string {
  const keyframes = bugCycleKeyframes(timing);
  const duration = formatSeconds(keyframes.total);

  let result = svg.replace(/27\.990035s/g, `${duration}s`);
  result = result.replace(/27\.99s/g, `${duration}s`);
  result = replaceOpacityKeyframes(result, keyframes);
  result = patchCssKeyframePercentages(result, keyframes);
  result = patchSmilKeyTimes(result, keyframes);
  result = result.replace(/<g id="info" opacity="0"/g, '<g id="info" opacity="1"');
  return result;
}

function replaceOpacityKeyframes(
  svg: string,
  keyframes: ReturnType<typeof bugCycleKeyframes>,
): string {
  let result = replaceKeyframesBlock(
    svg,
    'kf_info_opacity_0',
    buildInfoOpacityKeyframes(keyframes),
  );
  result = replaceKeyframesBlock(
    result,
    'kf_subwayPromo_opacity_0',
    buildSubwayPromoOpacityKeyframes(keyframes),
  );
  return result;
}

function buildInfoOpacityKeyframes(keyframes: ReturnType<typeof bugCycleKeyframes>): string {
  const { teamHoldEnd, sponsorStart, sponsorEnd } = keyframes;
  return `@keyframes kf_info_opacity_0 {
  0% {
    animation-timing-function: ease-in-out;
    opacity: 1;
  }
  ${formatPercent(teamHoldEnd)}% {
    animation-timing-function: ease-in-out;
    opacity: 1;
  }
  ${formatPercent(sponsorStart)}% {
    animation-timing-function: linear;
    opacity: 0;
  }
  ${formatPercent(sponsorEnd)}% {
    animation-timing-function: ease-in-out;
    opacity: 0;
  }
  100% {
    animation-timing-function: linear;
    opacity: 1;
  }
}`;
}

function buildSubwayPromoOpacityKeyframes(keyframes: ReturnType<typeof bugCycleKeyframes>): string {
  const { teamHoldEnd, sponsorStart, sponsorEnd } = keyframes;
  return `@keyframes kf_subwayPromo_opacity_0 {
  0% {
    animation-timing-function: linear;
    opacity: 0;
  }
  ${formatPercent(teamHoldEnd)}% {
    animation-timing-function: cubic-bezier(0.5, 0, 0.5, 1);
    opacity: 0;
  }
  ${formatPercent(sponsorStart)}% {
    animation-timing-function: linear;
    opacity: 1;
  }
  ${formatPercent(sponsorEnd)}% {
    animation-timing-function: cubic-bezier(0.5, 0, 0.5, 1);
    opacity: 1;
  }
  100% {
    animation-timing-function: linear;
    opacity: 0;
  }
}`;
}

function replaceKeyframesBlock(svg: string, name: string, replacement: string): string {
  const start = svg.indexOf(`@keyframes ${name}`);
  if (start === -1) {
    return svg;
  }

  const braceStart = svg.indexOf('{', start);
  if (braceStart === -1) {
    return svg;
  }

  let depth = 0;
  let blockEnd = braceStart;
  for (let index = braceStart; index < svg.length; index++) {
    const char = svg[index];
    if (char === '{') {
      depth++;
    } else if (char === '}') {
      depth--;
      if (depth === 0) {
        blockEnd = index;
        break;
      }
    }
  }

  return svg.slice(0, start) + replacement + svg.slice(blockEnd + 1);
}

function disableBugRotation(svg: string): string {
  let result = svg.replace(/<animate\b[^>]*\/>/g, '');
  result = result.replace(
    '</style>',
    `#info{opacity:1!important;animation:none!important}` +
      `#subwayPromo{opacity:0!important;animation:none!important}` +
      `#alien_logo,#scorebox,#bar{animation:none!important}` +
      `</style>`,
  );
  return result.replace(/<g id="info" opacity="0"/g, '<g id="info" opacity="1"');
}

function patchCssKeyframePercentages(
  svg: string,
  keyframes: ReturnType<typeof bugCycleKeyframes>,
): string {
  let result = svg;
  let searchStart = 0;

  while (true) {
    const blockStart = result.indexOf('@keyframes', searchStart);
    if (blockStart === -1) {
      break;
    }

    const nameEnd = result.indexOf('{', blockStart);
    const blockName = result.slice(blockStart, nameEnd);
    if (
      blockName.includes('kf_info_opacity_0') ||
      blockName.includes('kf_subwayPromo_opacity_0')
    ) {
      const braceStart = nameEnd;
      let depth = 0;
      let blockEnd = braceStart;
      for (let index = braceStart; index < result.length; index++) {
        const char = result[index];
        if (char === '{') {
          depth++;
        } else if (char === '}') {
          depth--;
          if (depth === 0) {
            blockEnd = index;
            break;
          }
        }
      }
      searchStart = blockEnd + 1;
      continue;
    }

    const braceStart = nameEnd;
    if (braceStart === -1) {
      break;
    }

    let depth = 0;
    let blockEnd = braceStart;
    for (let index = braceStart; index < result.length; index++) {
      const char = result[index];
      if (char === '{') {
        depth++;
      } else if (char === '}') {
        depth--;
        if (depth === 0) {
          blockEnd = index;
          break;
        }
      }
    }

    const block = result.slice(blockStart, blockEnd + 1);
    const patched = block.replace(/(\d+(?:\.\d+)?)%/g, (_match, rawPct: string) => {
      const remapped = remapTimelinePct(Number(rawPct), keyframes);
      return `${formatPercent(remapped)}%`;
    });

    result = result.slice(0, blockStart) + patched + result.slice(blockEnd + 1);
    searchStart = blockStart + patched.length;
  }

  return result;
}

function patchSmilKeyTimes(
  svg: string,
  keyframes: ReturnType<typeof bugCycleKeyframes>,
): string {
  return svg.replace(/keyTimes="([^"]+)"/g, (_match, rawTimes: string) => {
    const remapped = rawTimes
      .split(';')
      .map((entry) => {
        const value = Number(entry.trim());
        if (!Number.isFinite(value)) {
          return entry.trim();
        }
        return formatKeyTime(remapTimelinePct(value * 100, keyframes) / 100);
      })
      .join('; ');
    return `keyTimes="${remapped}"`;
  });
}

/** Map the SVG's original team-at-end timeline onto a team-first cycle. */
function remapTimelinePct(
  oldPct: number,
  keyframes: ReturnType<typeof bugCycleKeyframes>,
): number {
  const { teamHoldEnd, sponsorStart, sponsorEnd } = keyframes;

  if (oldPct >= ORIGINAL_TIMELINE.teamIn) {
    const ratio = (oldPct - ORIGINAL_TIMELINE.teamIn) / (100 - ORIGINAL_TIMELINE.teamIn);
    return ratio * teamHoldEnd;
  }

  if (oldPct <= ORIGINAL_TIMELINE.teamOut) {
    const ratio = oldPct / ORIGINAL_TIMELINE.teamOut;
    return teamHoldEnd + ratio * (sponsorStart - teamHoldEnd);
  }

  if (oldPct <= ORIGINAL_TIMELINE.sponsorEnd) {
    const ratio =
      (oldPct - ORIGINAL_TIMELINE.teamOut) /
      (ORIGINAL_TIMELINE.sponsorEnd - ORIGINAL_TIMELINE.teamOut);
    return sponsorStart + ratio * (sponsorEnd - sponsorStart);
  }

  const ratio =
    (oldPct - ORIGINAL_TIMELINE.sponsorEnd) /
    (ORIGINAL_TIMELINE.teamIn - ORIGINAL_TIMELINE.sponsorEnd);
  return sponsorEnd + ratio * (100 - sponsorEnd);
}

function formatSeconds(value: number): string {
  return value.toFixed(6).replace(/\.?0+$/, '');
}

function formatPercent(value: number): string {
  const rounded = Math.round(value * 10000) / 10000;
  return Number.isInteger(rounded) ? String(rounded) : String(rounded);
}

function formatKeyTime(value: number): string {
  return String(Math.round(value * 10000) / 10000);
}
