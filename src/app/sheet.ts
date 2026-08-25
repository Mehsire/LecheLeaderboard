export const EVENT_SHEET = {
  id: '1cPl3NuUcOhO2Ifw8xGjm_Vx31CGqE73s8kzWVLoPz7E',
  /** Full scoreboard block: AD1:AL5 */
  scoreboardRange: 'AD1:AL5',
  /** Team summary block for mini overlays: AD9:AL12 */
  teamSummaryRange: 'AD9:AL12',
  refreshSeconds: 15,
  defaultEventName: 'Sym Ark Raiders Event',
  defaultLogo: 'event-logo.svg',
} as const;

export function sheetGvizUrl(responseHandler: string, range: string): string {
  const tqx = encodeURIComponent(`out:json;responseHandler:${responseHandler}`);
  return (
    `https://docs.google.com/spreadsheets/d/${EVENT_SHEET.id}/gviz/tq` +
    `?tqx=${tqx}&range=${encodeURIComponent(range)}`
  );
}
