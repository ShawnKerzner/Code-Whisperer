import * as dotenv from 'dotenv'; // imports our API key
dotenv.config();
import * as vscode from 'vscode';
import * as cp from 'child_process';
import * as fs from 'fs'; // import needed to read the source file
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// activate() runs once, automatically, when VS Code loads our extension.
// It's job is to register things (commands, listeners) - not to do the real work itself.
export function activate(context: vscode.ExtensionContext) {
  console.log('CodeWhisperer is now active');

  // registerCommand connects a command ID (defined in package.json) to actual code.
  // "codewhisperer.runFile" must match the "command" field in package.json exactly
  const runFileCommand = vscode.commands.registerCommand(
    'codewhisperer.runFile',
    () => {
      // vscode.window.activeTextEditor gives us whatever file the dev currently
      // has focused/open. It can be undefined if no editor is open, so we check
      const editor = vscode.window.activeTextEditor;

      if (!editor) {
        vscode.window.showErrorMessage('No file is open to run.');
        return;
      }

      // .document.fileName is the full path to that open file.
      const filePath = editor.document.fileName;

      // spawn runs "node <filePath>" as a child process. Same as typing
      // it into a terminal ourselves, except our code gets to watch it.
      const child = cp.spawn('node', [filePath]);

      // We'll build up everything written to stderr here, piece by piece.
      let errorOutput = '';

      // .on('data', ...) fires every time a new chunk of output arrives.
      // chunk arrives as raw bytes (a Buffer), so .toString() makes it readable text.
      child.stderr.on('data', (chunk) => {
        errorOutput += chunk.toString();
      });

      // Runs once the child process finishes.
      child.on('exit', async (code) => {
        if (errorOutput) {
          // Decision A: send Claude the FULL source, not just the error,
          // for accurate, context-aware explanations.
          const sourceCode = fs.readFileSync(filePath, 'utf-8');

          // Parse the crash line number from the stack trace, for red-highlighting in the display.
          const lineMatch = errorOutput.match(/:(\d+):\d+\)/);
          const crashLine = lineMatch ? parseInt(lineMatch[1]) : null;

          // Prepend line numbers to every line so Claude's citations are
          // guaranteed accurate, not just inferred from context.
          const numberedSourceCode = sourceCode
            .split('\n')
            .map((line, index) => `${index + 1}: ${line}`)
            .join('\n');

          // Ask Claude for a structured (JSON) beginner explanation:
          // what broke, why, a fix explanation, and a minimal fix snippet with line range.
          const response = await anthropic.messages.create({
            model: 'claude-sonnet-4-5',
            max_tokens: 1024,
            messages: [
              {
                role: 'user',
                content: `A student's code just crashed. Here is the error:

${errorOutput}

Here is the full source code of the file that crashed, with line numbers prepended:

${numberedSourceCode}

Respond ONLY with a JSON object (no markdown, no code fences, no extra text) in exactly this shape:

{
  "whatWentWrong": "plain English explanation of the bug, citing specific line number(s)",
  "whyItHappened": "the underlying misunderstanding or mistake, citing specific line number(s)",
  "suggestedFix": "a short explanation of the fix",
  "fixSnippet": "just the corrected lines of code that need to change, as a plain string - not the whole file",
  "replaceStartLine": the first original line number this snippet replaces (a number, not a string),
  "replaceEndLine": the last original line number this snippet replaces (a number, not a string)
}`,
              },
            ],
          });

          const firstBlock = response.content[0];

          if (firstBlock.type === 'text') {
            try {
              // Claude sometimes wraps JSON in markdown code fences despite
              // instructions not to. Strip ```json / ``` if present, before parsing.
              const cleaned = firstBlock.text
                .replace(/```json\n?/, '')
                .replace(/```\s*$/, '')
                .trim();

              const explanation = JSON.parse(cleaned);

              console.log('What went wrong:', explanation.whatWentWrong);
              console.log('Why it happened:', explanation.whyItHappened);
              console.log('Suggested fix:', explanation.suggestedFix);
              console.log('Fix snippet (lines', explanation.replaceStartLine, '-', explanation.replaceEndLine, '):', explanation.fixSnippet);

              // Build the source code as HTML, one div per line, coloring
              // only the crash line red - everything else stays neutral.
              const sourceLines = sourceCode.split('\n');
              const sourceHtml = sourceLines
                .map((line, index) => {
                  const lineNumber = index + 1;
                  const isCrashLine = lineNumber === crashLine;
                  const color = isCrashLine ? 'red' : 'inherit';
                  return `<div style="color: ${color};">${lineNumber}: ${escapeHtml(line)}</div>`;
                })
                .join('');

              // Blue explanation sections: what went wrong, why, and the fix explanation.
              const explanationHtml = `
                <div style="color: #4da6ff; margin-top: 20px;">
                  <h3>What Went Wrong</h3>
                  <p>${escapeHtml(explanation.whatWentWrong)}</p>
                </div>
                <div style="color: #4da6ff; margin-top: 20px;">
                  <h3>Why It Happened</h3>
                  <p>${escapeHtml(explanation.whyItHappened)}</p>
                </div>
                <div style="color: #4da6ff; margin-top: 20px;">
                  <h3>Suggested Fix</h3>
                  <p>${escapeHtml(explanation.suggestedFix)}</p>
                </div>
              `;

              // Green fix snippet - just the corrected lines, labeled with which
              // original lines they replace, so the student has to locate and apply it.
              const fixHtml = `
                <div style="color: #4da6ff; margin-top: 20px;">
                  <h3>Replace lines ${explanation.replaceStartLine}–${explanation.replaceEndLine} with:</h3>
                </div>
                <pre style="color: #33cc33; background-color: rgba(51, 204, 51, 0.1); padding: 10px;">${escapeHtml(explanation.fixSnippet)}</pre>
              `;

              const panel = vscode.window.createWebviewPanel(
                'codewhispererExplanation',
                'CodeWhisperer',
                vscode.ViewColumn.Beside,
                {}
              );

              panel.webview.html = `
                <html>
                  <body style="font-family: monospace;">
                    <div style="white-space: pre;">${sourceHtml}</div>
                    ${explanationHtml}
                    ${fixHtml}
                  </body>
                </html>
              `;
            } catch (err) {
              console.log('Failed to parse Claude\'s response as JSON.');
              console.log('Raw response was:', firstBlock.text);
            }
          } else {
            console.log('Unexpected response type from Claude:', firstBlock.type);
          }

          console.log(`--- CodeWhisperer detected an error in ${filePath} ---`);
          console.log(errorOutput);
        } else {
          console.log(`--- CodeWhisperer: ${filePath} ran cleanly (exit code ${code}) ---`);
        }
      });
    }
  );

  // subscriptions is a cleanup list - VS Code uses it to properly dispose of
  // our command when the extension deactivates, so we don't leave it registered forever.
  context.subscriptions.push(runFileCommand);
}

// deactivate() runs when the extension is shut down. Nothing to clean up yet.
export function deactivate() {}

// Escapes HTML-sensitive characters so code containing < or > displays as
// literal text instead of being misinterpreted as HTML markup.
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}