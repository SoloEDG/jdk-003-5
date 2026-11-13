export function hash(text: string): number {
  let n = 2166136261;
  for (const c of text) n = Math.imul(n ^ c.charCodeAt(0), 16777619);
  return n >>> 0;
}
export function shuffle<T>(items: T[], seed: number): T[] {
  const result = [...items];
  let n = seed || 1;
  for (let i = result.length - 1; i > 0; i--) {
    n = (Math.imul(n, 1664525) + 1013904223) >>> 0;
    const j = n % (i + 1);
    [result[i], result[j]] = [result[j]!, result[i]!];
  }
  return result;
}
export function uid(prefix: string): string {
  return `${prefix}-${crypto.randomUUID()}`;
}
