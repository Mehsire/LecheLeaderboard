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

/** x center of the rank column (left of the stats column within #info). */
const RANK_COLUMN_CENTER = 33;

const TEAM_NAME_MAX_FONT_SIZE = 14;
const TEAM_NAME_MAX_WIDTH = 160;
const TEAM_NAME_CHAR_RATIO = 0.62;

const SCORE_FONT_SIZE = 32;
const SCORE_MIN_FONT_SIZE = 14;
/** Bug SVG viewBox width; score must stay inside the grey panel. */
const BUG_VIEWBOX_WIDTH = 270;
const SCOREBOX_ORIGIN_X = 66;
/**
 * Center of the grey stats panel (right of the rank column), in local coords
 * relative to translate(SCOREBOX_ORIGIN_X …).
 */
const STATS_TEXT_CENTER = (BUG_VIEWBOX_WIDTH - SCOREBOX_ORIGIN_X) / 2;
const SCORE_EDGE_PAD = 6;
const RANK_LABEL_Y = 11.25;
const RANK_NUMBER_Y = 32.36;
/**
 * Width estimate for placing the coin tight against the score.
 * Special Gothic Expanded One is wide; 0.68 underestimates and overlaps
 * (runtime: "40,428" actual≈0.76). Slightly above measured for safety when fitting.
 */
const COIN_LAYOUT_CHAR_RATIO = 0.78;
/** Slightly tighter than fit ratio so the coin hugs the digits. */
const COIN_PLACE_CHAR_RATIO = 0.7;
const SCOREBOX_Y = 12;
const TEAM_NAME_BASELINE_Y = 13.1;
const TEAM_TOTAL_Y = 52;
const TEAM_TOTAL_TSPAN_Y = 9.825;
const TEAM_TOTAL_FONT_SIZE = 9;
const COIN_WIDTH = 22;
const COIN_HEIGHT = 25.5;
const COIN_GAP = 3;

/**
 * Vertical midpoint between team name and TEAM TOTAL, in #info coords
 * (same space as scorebox_2's parent before SCOREBOX_Y).
 */
function scoreBandCenterY(): number {
  const nameBottom = TEAM_NAME_BASELINE_Y + TEAM_NAME_MAX_FONT_SIZE * 0.2;
  const totalTop = TEAM_TOTAL_Y + TEAM_TOTAL_TSPAN_Y - TEAM_TOTAL_FONT_SIZE * 0.8;
  return (nameBottom + totalTop) / 2;
}

/** Score baseline (scorebox-local) so the glyph optical center sits in the label gap. */
function scoreBaselineForFont(fontSize: number): number {
  return scoreBandCenterY() - SCOREBOX_Y + fontSize * 0.36;
}

const BUG_LABEL_FONT = 'Victor Mono';
const BUG_NUMBER_FONT = 'Special Gothic Expanded One';

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
  setSvgText(scope, 'score', values.score);
  centerBugStats(scope, values);
  centerRankColumn(scope, values.rankNumber);
  applyBugFonts(scope);
  if (scope instanceof Document && scope.documentElement.tagName === 'svg') {
    fixAlienLogoOverflow(scope);
  }
}

function applyBugFonts(scope: Document | ParentNode): void {
  styleLabelFont(scope, 'teamName');
  styleLabelFont(scope, 'teamTotal');
  styleLabelFont(scope, 'rank');
  styleNumberFont(scope, 'score');
  styleNumberFont(scope, 'rankNumber');
}

function styleLabelFont(scope: Document | ParentNode, id: string): void {
  const el = bugElement(scope, id);
  if (!el) {
    return;
  }
  el.setAttribute('font-family', BUG_LABEL_FONT);
  el.setAttribute('font-weight', 'bold');
}

function styleNumberFont(scope: Document | ParentNode, id: string): void {
  const el = bugElement(scope, id);
  if (!el) {
    return;
  }
  el.setAttribute('font-family', BUG_NUMBER_FONT);
  el.removeAttribute('font-weight');
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

function centerRankColumn(scope: Document | ParentNode, rankNumber: string): void {
  styleRankNumber(scope, rankNumber, RANK_COLUMN_CENTER);
  styleRankLabel(scope, RANK_COLUMN_CENTER);
}

function styleRankLabel(scope: Document | ParentNode, centerX: number): void {
  const el = bugElement(scope, 'rank');
  if (!el) {
    return;
  }

  // Use the same coordinate origin as #rankNumber (no leftover X translate from the export).
  el.setAttribute('text-anchor', 'middle');
  el.setAttribute('x', String(centerX));
  el.setAttribute('y', String(RANK_LABEL_Y + 3));
  el.removeAttribute('transform');

  const tspan = el.querySelector('tspan');
  if (tspan) {
    tspan.removeAttribute('x');
    tspan.removeAttribute('y');
  }
}

function styleRankNumber(scope: Document | ParentNode, rankNumber: string, centerX: number): void {
  const el = bugElement(scope, 'rankNumber');
  if (!el) {
    return;
  }

  el.setAttribute('text-anchor', 'middle');
  el.setAttribute('x', String(centerX));
  el.setAttribute('y', String(RANK_NUMBER_Y + 14.152));
  el.removeAttribute('transform');

  const tspan = el.querySelector('tspan');
  if (tspan) {
    tspan.textContent = rankNumber;
    tspan.removeAttribute('x');
    tspan.removeAttribute('y');
  }
}

/** Nudge #rank so its ink center matches #rankNumber after fonts/layout. */
export function syncRankLabelToNumber(root: ParentNode): number | null {
  const rank = bugElement(root, 'rank') as SVGGraphicsElement | null;
  const num = bugElement(root, 'rankNumber') as SVGGraphicsElement | null;
  if (!rank || !num) {
    return null;
  }

  let rankBox: DOMRect | null = null;
  let numBox: DOMRect | null = null;
  try {
    rankBox = rank.getBoundingClientRect();
    numBox = num.getBoundingClientRect();
  } catch {
    return null;
  }

  if (!rankBox.width || !numBox.width) {
    return null;
  }

  const rankCx = rankBox.left + rankBox.width / 2;
  const numCx = numBox.left + numBox.width / 2;
  const deltaScreen = numCx - rankCx;
  if (Math.abs(deltaScreen) < 0.25) {
    return 0;
  }

  const svg = rank.ownerSVGElement;
  if (!svg?.createSVGPoint || !svg.getScreenCTM) {
    return null;
  }

  const ctm = svg.getScreenCTM();
  if (!ctm) {
    return null;
  }

  const inv = ctm.inverse();
  const p0 = svg.createSVGPoint();
  const p1 = svg.createSVGPoint();
  p0.x = 0;
  p1.x = deltaScreen;
  const deltaSvg = p1.matrixTransform(inv).x - p0.matrixTransform(inv).x;
  const currentX = Number(rank.getAttribute('x') || RANK_COLUMN_CENTER);
  const nextX = currentX + deltaSvg;
  rank.setAttribute('x', String(nextX));
  return deltaSvg;
}

function styleTeamName(scope: Document | ParentNode, teamName: string, centerX: number): void {
  const el = bugElement(scope, 'teamName');
  if (!el) {
    return;
  }

  const displayName = formatTeamName(teamName);
  el.setAttribute('text-anchor', 'middle');
  el.setAttribute('font-size', String(TEAM_NAME_MAX_FONT_SIZE));
  el.setAttribute('transform', `translate(${SCOREBOX_ORIGIN_X})`);

  const tspan = el.querySelector('tspan');
  if (tspan) {
    tspan.textContent = displayName;
    tspan.setAttribute('x', String(centerX));
    tspan.setAttribute('y', String(TEAM_NAME_BASELINE_Y));
  }
}

function styleTeamTotal(scope: Document | ParentNode, centerX: number): void {
  const el = bugElement(scope, 'teamTotal');
  if (!el) {
    return;
  }

  el.setAttribute('text-anchor', 'middle');
  el.setAttribute('font-size', String(TEAM_TOTAL_FONT_SIZE));
  el.setAttribute('transform', `translate(${SCOREBOX_ORIGIN_X} ${TEAM_TOTAL_Y})`);

  const tspan = el.querySelector('tspan');
  if (tspan) {
    tspan.setAttribute('x', String(centerX));
    tspan.setAttribute('y', String(TEAM_TOTAL_TSPAN_Y));
  }
}

function styleScorebox(scope: Document | ParentNode, scoreText: string, _centerX: number): void {
  const scorebox = bugElement(scope, 'scorebox_2');
  if (scorebox) {
    scorebox.setAttribute('transform', `translate(${SCOREBOX_ORIGIN_X} ${SCOREBOX_Y})`);
  }

  const scoreEl = bugElement(scope, 'score');
  if (!scoreEl) {
    return;
  }

  const fontSize = scoreFontSizeForWidth(scoreText);
  const scoreWidth = estimateTextWidth(scoreText, fontSize, COIN_PLACE_CHAR_RATIO);
  const layout = scoreClusterLayout(fontSize, scoreWidth);

  scoreEl.setAttribute('text-anchor', 'middle');
  scoreEl.removeAttribute('transform');
  scoreEl.setAttribute('font-size', String(fontSize));

  const tspan = scoreEl.querySelector('tspan');
  if (tspan) {
    tspan.setAttribute('x', String(layout.scoreCenter));
    tspan.setAttribute('y', String(layout.baseline));
  }

  const coinEl = bugElement(scope, 'coin');
  if (coinEl) {
    coinEl.setAttribute('transform', coinTransform(layout));
  }
}

/** Usable width inside scorebox_2 for the coin + score cluster. */
function statsAvailableWidth(): number {
  return BUG_VIEWBOX_WIDTH - SCOREBOX_ORIGIN_X - 2 * SCORE_EDGE_PAD;
}

/**
 * Largest font that still fits coin + digits in the grey stats area.
 * Uses a conservative char ratio so we don't overflow before fonts load.
 */
export function scoreFontSizeForWidth(scoreText: string): number {
  if (!scoreText) {
    return SCORE_FONT_SIZE;
  }
  const available = statsAvailableWidth();
  const coinFactor = (COIN_WIDTH + COIN_GAP) / SCORE_FONT_SIZE;
  const textFactor = scoreText.length * COIN_LAYOUT_CHAR_RATIO;
  const fontSize = Math.min(SCORE_FONT_SIZE, available / (coinFactor + textFactor));
  return Math.max(SCORE_MIN_FONT_SIZE, Math.round(fontSize * 10) / 10);
}

interface ScoreClusterLayout {
  fontSize: number;
  scale: number;
  coinW: number;
  coinH: number;
  gap: number;
  scoreCenter: number;
  baseline: number;
  coinX: number;
  coinY: number;
  clusterWidth: number;
}

/** Center coin + score as one cluster in the available stats width. */
function scoreClusterLayout(fontSize: number, scoreWidth: number): ScoreClusterLayout {
  const scale = fontSize / SCORE_FONT_SIZE;
  const coinW = COIN_WIDTH * scale;
  const coinH = COIN_HEIGHT * scale;
  const gap = COIN_GAP * scale;
  const clusterWidth = coinW + gap + scoreWidth;
  const available = statsAvailableWidth();
  const clusterLeft = SCORE_EDGE_PAD + Math.max(0, (available - clusterWidth) / 2);
  const coinX = clusterLeft;
  const scoreCenter = clusterLeft + coinW + gap + scoreWidth / 2;
  const baseline = scoreBaselineForFont(fontSize);
  const coinY = coinYForScoreBaseline(baseline, fontSize, coinH);
  return { fontSize, scale, coinW, coinH, gap, scoreCenter, baseline, coinX, coinY, clusterWidth };
}

function coinTransform(layout: ScoreClusterLayout): string {
  return layout.scale === 1
    ? `translate(${layout.coinX} ${layout.coinY})`
    : `translate(${layout.coinX} ${layout.coinY}) scale(${roundScale(layout.scale)})`;
}

/**
 * After fonts load: grow the score to fill unused grey-panel width, then
 * re-center the coin + score cluster (horizontally and between the labels).
 */
export function syncCoinToScore(root: ParentNode): number | null {
  const score = bugElement(root, 'score') as SVGGraphicsElement | null;
  const coin = bugElement(root, 'coin') as SVGGraphicsElement | null;
  const teamName = bugElement(root, 'teamName') as SVGGraphicsElement | null;
  const teamTotal = bugElement(root, 'teamTotal') as SVGGraphicsElement | null;
  if (!score || !coin) {
    return null;
  }

  const svg = score.ownerSVGElement;
  if (!svg?.createSVGPoint || !svg.getScreenCTM) {
    return null;
  }
  const ctm = svg.getScreenCTM();
  if (!ctm) {
    return null;
  }
  const inv = ctm.inverse();
  const toSvg = (screenX: number, screenY: number) => {
    const p = svg.createSVGPoint();
    p.x = screenX;
    p.y = screenY;
    return p.matrixTransform(inv);
  };

  let fontSize = Number(score.getAttribute('font-size') || SCORE_FONT_SIZE);
  let scoreBox: DOMRect;
  try {
    scoreBox = score.getBoundingClientRect();
  } catch {
    return null;
  }
  if (!scoreBox.width) {
    return null;
  }

  let scoreWidth = toSvg(scoreBox.right, 0).x - toSvg(scoreBox.left, 0).x;
  const available = statsAvailableWidth();
  const scale0 = fontSize / SCORE_FONT_SIZE;
  const cluster0 = COIN_WIDTH * scale0 + COIN_GAP * scale0 + scoreWidth;

  // Grow toward the full stats width when the conservative estimate over-shrunk.
  if (cluster0 > 0 && cluster0 < available - 0.5) {
    const grown = Math.min(SCORE_FONT_SIZE, Math.round(fontSize * (available / cluster0) * 10) / 10);
    if (grown > fontSize + 0.05) {
      scoreWidth *= grown / fontSize;
      fontSize = grown;
      score.setAttribute('font-size', String(fontSize));
    }
  }

  const layout = scoreClusterLayout(fontSize, scoreWidth);
  const tspan = score.querySelector('tspan');
  if (tspan) {
    tspan.setAttribute('x', String(layout.scoreCenter));
    tspan.setAttribute('y', String(layout.baseline));
  }
  coin.setAttribute('transform', coinTransform(layout));

  // Fine-tune vertical position from real label boxes after fonts/layout.
  if (teamName && teamTotal && tspan) {
    try {
      const nameBox = teamName.getBoundingClientRect();
      const totalBox = teamTotal.getBoundingClientRect();
      scoreBox = score.getBoundingClientRect();
      if (nameBox.height && totalBox.height && scoreBox.height) {
        const gapMidScreen = (nameBox.bottom + totalBox.top) / 2;
        const scoreMidScreen = (scoreBox.top + scoreBox.bottom) / 2;
        const deltaSvg = toSvg(0, gapMidScreen).y - toSvg(0, scoreMidScreen).y;
        if (Math.abs(deltaSvg) > 0.25) {
          const nextBaseline = layout.baseline + deltaSvg;
          tspan.setAttribute('y', String(nextBaseline));
          const coinY = coinYForScoreBaseline(nextBaseline, fontSize, layout.coinH);
          coin.setAttribute(
            'transform',
            layout.scale === 1
              ? `translate(${layout.coinX} ${coinY})`
              : `translate(${layout.coinX} ${coinY}) scale(${roundScale(layout.scale)})`,
          );
        }
      }
    } catch {
      /* getBoundingClientRect may fail in non-rendered contexts */
    }
  }

  return layout.coinX;
}

function roundScale(scale: number): number {
  return Math.round(scale * 1000) / 1000;
}

/** Vertically center the coin icon on the score digits. */
function coinYForScoreBaseline(baseline: number, fontSize: number, coinHeight: number): number {
  const scoreCenterY = baseline - fontSize * 0.36;
  return scoreCenterY - coinHeight / 2;
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
  result = replaceKeyframesBlock(
    result,
    'kf_scorebox_transform_0',
    buildScoreboxTransformKeyframes(keyframes),
  );
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
  const teamOutMid = (teamHoldEnd + sponsorStart) / 2;
  const teamInMid = (sponsorEnd + 100) / 2;
  return `@keyframes kf_info_opacity_0 {
  0% {
    animation-timing-function: ease-in-out;
    opacity: 1;
  }
  ${formatPercent(teamHoldEnd)}% {
    animation-timing-function: ease-in-out;
    opacity: 1;
  }
  ${formatPercent(teamOutMid)}% {
    animation-timing-function: linear;
    opacity: 0;
  }
  ${formatPercent(sponsorStart)}% {
    animation-timing-function: linear;
    opacity: 0;
  }
  ${formatPercent(sponsorEnd)}% {
    animation-timing-function: linear;
    opacity: 0;
  }
  ${formatPercent(teamInMid)}% {
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
  const teamOutMid = (teamHoldEnd + sponsorStart) / 2;
  const teamInMid = (sponsorEnd + 100) / 2;
  return `@keyframes kf_subwayPromo_opacity_0 {
  0% {
    animation-timing-function: linear;
    opacity: 0;
  }
  ${formatPercent(teamHoldEnd)}% {
    animation-timing-function: linear;
    opacity: 0;
  }
  ${formatPercent(teamOutMid)}% {
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
  ${formatPercent(teamInMid)}% {
    animation-timing-function: linear;
    opacity: 0;
  }
  100% {
    animation-timing-function: linear;
    opacity: 0;
  }
}`;
}

/** Grey scorebox cover: stay full-bleed while sponsor is visible so black rank never shows under it. */
function buildScoreboxTransformKeyframes(keyframes: ReturnType<typeof bugCycleKeyframes>): string {
  const { teamHoldEnd, sponsorStart, sponsorEnd } = keyframes;
  const teamOutMid = (teamHoldEnd + sponsorStart) / 2;
  const teamInMid = (sponsorEnd + 100) / 2;
  const teamPose =
    'translateX(105px) translateY(23px) translateX(-39px) translateY(0px)';
  const sponsorPose =
    'translateX(105px) translateY(23px) translateX(-105px) translateY(0px)';
  return `@keyframes kf_scorebox_transform_0 {
  0% {
    transform: ${teamPose};
  }
  ${formatPercent(teamHoldEnd)}% {
    animation-timing-function: ease-in-out;
    transform: ${teamPose};
  }
  ${formatPercent(teamOutMid)}% {
    animation-timing-function: linear;
    transform: ${sponsorPose};
  }
  ${formatPercent(sponsorStart)}% {
    animation-timing-function: linear;
    transform: ${sponsorPose};
  }
  ${formatPercent(sponsorEnd)}% {
    animation-timing-function: linear;
    transform: ${sponsorPose};
  }
  ${formatPercent(teamInMid)}% {
    animation-timing-function: ease-in-out;
    transform: ${sponsorPose};
  }
  100% {
    transform: ${teamPose};
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
  // Team-page rest pose: keyframes use translate(105,23) + translateX(-39) => (66,23).
  // animation:none alone falls back to the SVG attribute at (105,23), exposing extra black.
  result = result.replace(
    '</style>',
    `#info{opacity:1!important;animation:none!important}` +
      `#subwayPromo{opacity:0!important;animation:none!important}` +
      `#alien_logo{animation:none!important}` +
      `#scorebox{animation:none!important;transform:translate(66px,23px)!important}` +
      `#bar{animation:none!important}` +
      `</style>`,
  );
  result = result.replace(
    /(<path id="scorebox" transform=")translate\(105 23\)"/,
    '$1translate(66 23)"',
  );
  result = result.replace(/<g id="info" opacity="0"/g, '<g id="info" opacity="1"');
  return result;
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
      blockName.includes('kf_subwayPromo_opacity_0') ||
      blockName.includes('kf_scorebox_transform_0')
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
