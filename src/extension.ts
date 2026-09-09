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


  // registerCommand connects a command ID (defined in package .json) to actual code.
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

        // .document.fileName is the full path on to that open file.
        const filePath = editor.document.fileName;

        // spawn runs "node <filePath>" as a child process. It is the same as typing
        // it into a terminal ourselves, except our code gets to watch it.
        const child = cp.spawn('node', [filePath]);


      // We'll build up everything written to stderr here, piece by piece.
        let errorOutput = '';

        // .on('data', ...) fires everytime a new chunk of output arrives.
        // chunk arrives as raw bytes (a Buffer), so .toString() makes it readable text.
        child.stderr.on('data', (chunk) => {
          errorOutput += chunk.toString();
        });

        child.on('exit', async (code) => {
          if(errorOutput) {
            const sourceCode = fs.readFileSync(filePath, 'utf-8'); // Reads the whole source file when an error is detected
            const response = await anthropic.messages.create({
              model: 'claude-sonnet-4-5',
              max_tokens: 1024,
              messages: [
                {
                  role: 'user',
                  content: `A users code just crashed. Here is the error:
                  
                  ${errorOutput}

                  Here is the full source code of the file that crashed:

                  ${sourceCode}

                  Please explain, in plain English for a beginner:
                  1. What went wrong
                  2.Why it happened (the underlying misunderstanding or mistake)
                  3. A suggested fix, with a short code example`,
                }
              ],
            });
            console.log(response.content[0].text);
            console.log(`--- CodeWhisperer detected an error in ${filePath} ---`);
            console.log(errorOutput);
          } else {
            console.log(`--- CodeWhisperer: ${filePath} ran cleanly (exit code ${code}) ---`);
          }
        });
    }
  );

  // subcriptions is a cleanup list - VS Code uses it to properly dispose of 
  // our command when the extension deactivates, so we don't leave it registered forever.
  context.subscriptions.push(runFileCommand);
}

// deactivate() runs when the extension is shut down. Nothing to clean up yet.
export function deactivate() {}