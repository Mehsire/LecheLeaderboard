import {
  bugCycleDuration,
  bugCycleKeyframes,
  formatBugScore,
  formatTeamName,
  patchBugShell,
  patchBugSvg,
  rankNumberFromSheet,
  updateBugValuesInDom,
} from './bug-svg';

const bugSnippet = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg">
  <g id="alien_logo" transform="translate(0 1)">
    <rect id="texture" transform="translate(0 -1)" width="331" height="27"/>
    <rect id="Alienware-Logo_1" transform="translate(85 2)" width="162" height="13"/>
  </g>
  <g id="info" opacity="0">
    <text id="teamName" transform="translate(66)"><tspan x="73.4258" y="13.1">TEAM NAME 1</tspan></text>
    <text id="teamTotal" transform="translate(66 49)"><tspan x="86.0176" y="9.825">TEAM TOTAL</tspan></text>
    <g id="scorebox_2" transform="translate(66 11)">
      <path id="coin" transform="translate(25.3602 8.23724)" d="M0 0"/>
      <text id="score" transform="translate(51.6398)"><tspan x="0.171875" y="32.36">101,558</tspan></text>
    </g>
  </g>
  <text id="rankNumber"><tspan>1</tspan></text>
</svg>`;

const rotationSnippet = `${bugSnippet.replace('</svg>', '')}
<style>
@keyframes kf_info_opacity_0 {
  0% { opacity: 1; }
  2.25% { opacity: 0; }
  26.42% { opacity: 0; }
  28.71% { opacity: 1; }
  100% { opacity: 1; }
}
@keyframes kf_subwayPromo_opacity_0 {
  0% { opacity: 0; }
  2.25% { opacity: 1; }
  26.42% { opacity: 1; }
  27.58% { opacity: 0; }
  100% { opacity: 0; }
}
#info { animation: kf_info_opacity_0 27.990035s linear infinite; }
</style>
<rect width="10" height="10">
  <animate attributeName="height" values="1; 0; 1" keyTimes="0; 0.0225; 0.2871" dur="27.990035s" />
</rect>
</svg>`;

const values = {
  rankNumber: '2',
  teamName: 'Alpha Squad',
  score: '5,024',
};

describe('bug-svg', () => {
  it('extracts numeric rank from sheet ordinals', () => {
    expect(rankNumberFromSheet('1st')).toBe('1');
    expect(rankNumberFromSheet('4th')).toBe('4');
  });

  it('formats scores with comma separators', () => {
    expect(formatBugScore(101558)).toBe('101,558');
  });

  it('uppercases team names', () => {
    expect(formatTeamName('Alpha Squad')).toBe('ALPHA SQUAD');
  });

  it('ellipsizes long team names', () => {
    const longName = formatTeamName('The Extremely Long Team Name That Will Not Fit');
    expect(longName.endsWith('…')).toBe(true);
    expect(longName).toBe(longName.toUpperCase());
  });

  it('calculates svg cycle duration from teamSec and sponsorSec', () => {
    expect(bugCycleDuration({ teamSec: 30, sponsorSec: 10 })).toBe(41.3);
  });

  it('builds a team-first timeline', () => {
    const keyframes = bugCycleKeyframes({ teamSec: 30, sponsorSec: 10 });
    expect(keyframes.total).toBe(41.3);
    expect(keyframes.teamHoldEnd).toBeCloseTo(72.6392, 3);
    expect(keyframes.sponsorStart).toBeCloseTo(74.2131, 3);
    expect(keyframes.sponsorEnd).toBeCloseTo(98.4262, 3);
  });

  it('patches rank, team name, and score text nodes', () => {
    const patched = patchBugSvg(bugSnippet, values);
    expect(patched).toContain('ALPHA SQUAD');
    expect(patched).toContain('5,024');
    expect(patched).toContain('>2</tspan>');
  });

  it('centers team name, score, and team total on the same axis', () => {
    const patched = patchBugSvg(bugSnippet, values);
    expect(patched).toContain('text-anchor="middle"');
    expect(patched).toContain('x="113"');
    expect(patched).toContain('font-size="14"');
    expect(patched).toContain('translate(66 14)');
    expect(patched).toContain('translate(66 52)');
  });

  it('clips alienware header inside the svg viewport', () => {
    const patched = patchBugSvg(bugSnippet, values);
    expect(patched).toContain('overflow="hidden"');
    expect(patched).toContain('id="texture" transform="translate(0 0)"');
    expect(patched).toContain('id="alien_logo" transform="translate(0 0)"');
  });

  it('remaps every keyframe step in multi-step css animations', () => {
    const snippet = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg">
<style>
@keyframes kf_info_opacity_0 {
  0% { opacity: 1; }
  2.25% { opacity: 0; }
  26.42% { opacity: 0; }
  28.71% { opacity: 1; }
  100% { opacity: 1; }
}
#info { animation: kf_info_opacity_0 27.990035s linear infinite; }
</style>
</svg>`;
    const patched = patchBugSvg(snippet, values, { teamSec: 30, sponsorSec: 10 });
    expect(patched).not.toContain('26.42%');
    expect(patched).not.toContain('28.71%');
    expect(patched).not.toContain('2.25%');
    expect(patched).toContain('opacity: 1');
    expect(patched).toContain('72.6392%');
  });

  it('updates svg animation duration when rotation timing is set', () => {
    const patched = patchBugSvg(rotationSnippet, values, { teamSec: 30, sponsorSec: 10 });
    expect(patched).toContain('41.3s');
    expect(patched).not.toContain('27.990035s');
    expect(patched).not.toContain('26.42%');
    expect(patched).not.toContain('28.71%');
    expect(patched).toContain('animation: kf_info_opacity_0 41.3s linear infinite');
    expect(patched).toContain('<g id="info" opacity="1"');
  });

  it('freezes the bug on the team page when rotation timing is omitted', () => {
    const patched = patchBugSvg(rotationSnippet, values);
    expect(patched).toContain('#info{opacity:1!important;animation:none!important}');
    expect(patched).toContain('#subwayPromo{opacity:0!important;animation:none!important}');
    expect(patched).not.toContain('<animate');
  });

  it('builds a static shell via patchBugShell', () => {
    const patched = patchBugShell(rotationSnippet, { teamSec: 30, sponsorSec: 10 });
    expect(patched).toContain('41.3s');
    expect(patched).toContain('>TEAM</tspan>');
  });

  it('updates values in a live innerHTML container', () => {
    const container = document.createElement('div');
    container.innerHTML = patchBugShell(rotationSnippet, { teamSec: 30, sponsorSec: 10 });

    expect(updateBugValuesInDom(container, values)).toBe(true);
    expect(container.querySelector('#teamName tspan')?.textContent).toBe('ALPHA SQUAD');
    expect(container.querySelector('#score tspan')?.textContent).toBe('5,024');
    expect(container.querySelector('#rankNumber tspan')?.textContent).toBe('2');
  });
});
