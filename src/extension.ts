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

          // Prepend line numbers to every line so Claude's citations are
          // guaranteed accurate, not just inferred from context.
          const numberedSourceCode = sourceCode
            .split('\n')
            .map((line, index) => `${index + 1}: ${line}`)
            .join('\n');

          // Ask Claude for a structured (JSON) 3-part beginner explanation:
          // what broke, why, and how to fix it - each citing line numbers.
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
  "fixedCode": "a corrected version of the relevant code as a plain string"
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
              console.log('Fixed code:', explanation.fixedCode);
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