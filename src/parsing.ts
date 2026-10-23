export interface Explanation {
  whatWentWrong: string;
  whyItHappened: string;
  suggestedFix: string;
  fixSnippet: string;
  replaceStartLine: number;
  replaceEndLine: number;
}

export function numberLines(source: string): string {
  return source
    .split('\n')
    .map((line, index) => `${index + 1}: ${line}`)
    .join('\n');
}

export function findCrashLine(stderr: string): number | null {
  const match = stderr.match(/:(\d+):\d+\)/);
  return match ? parseInt(match[1], 10) : null;
}

export function parseExplanation(text: string): Explanation {
  const cleaned = text
    .replace(/```json\n?/, '')
    .replace(/```\s*$/, '')
    .trim();
  return JSON.parse(cleaned) as Explanation;
}