export const SPENDING_SHEET = {
  id: '1rkaUZ8GCvz7866_DWh-yZ1L2hSjdOwbYlBgAv5rCqPY',
  sheet: 'Spending Tracker',
  nameColumn: 'I',
  scoreColumn: 'J',
  startRow: 4,
  endRow: 8,
  title: 'Spending Tracker',
} as const;

export function spendingSheetUrl(responseHandler: string): string {
  const tqx = encodeURIComponent(`out:json;responseHandler:${responseHandler}`);
  const sheet = encodeURIComponent(SPENDING_SHEET.sheet);
  const limit = SPENDING_SHEET.endRow - SPENDING_SHEET.startRow + 1;
  const tq = encodeURIComponent(
    `select ${SPENDING_SHEET.nameColumn}, ${SPENDING_SHEET.scoreColumn} limit ${limit}`,
  );
  return (
    `https://docs.google.com/spreadsheets/d/${SPENDING_SHEET.id}/gviz/tq` +
    `?tqx=${tqx}&tq=${tq}&sheet=${sheet}`
  );
}
