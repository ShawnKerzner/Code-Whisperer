export function buildErrorPrompt(errorOutput: string, numberedSource: string): string {
  return `A student's code just crashed. Here is the error:

${errorOutput}

Here is the full source code of the file that crashed, with line numbers prepended:

${numberedSource}

Respond ONLY with a JSON object (no markdown, no code fences, no extra text) in exactly this shape:

{
  "whatWentWrong": "plain English explanation of the bug, citing specific line number(s)",
  "whyItHappened": "the underlying misunderstanding or mistake, citing specific line number(s)",
  "suggestedFix": "a short explanation of the fix",
  "fixSnippet": "just the corrected lines of code that need to change, as a plain string - not the whole file",
  "replaceStartLine": the first original line number this snippet replaces (a number, not a string),
  "replaceEndLine": the last original line number this snippet replaces (a number, not a string)
}`;
}