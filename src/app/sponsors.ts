/** Event sponsor images live in public/sponsors/ and are listed in manifest.json. */
export const SPONSOR_MANIFEST = 'sponsors/manifest.json';

export function sponsorImageUrl(filename: string): string {
  return `sponsors/${filename}`;
}

export async function loadEventSponsors(baseUri: string): Promise<string[]> {
  const manifestUrl = new URL(SPONSOR_MANIFEST, baseUri).toString();
  try {
    const response = await fetch(manifestUrl, { cache: 'no-cache' });
    if (!response.ok) {
      return [];
    }
    const files = (await response.json()) as unknown;
    if (!Array.isArray(files)) {
      return [];
    }
    return files
      .filter((file): file is string => typeof file === 'string' && file.trim().length > 0)
      .map((file) => new URL(sponsorImageUrl(file.trim()), baseUri).toString());
  } catch {
    return [];
  }
}
