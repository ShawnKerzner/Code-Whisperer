import * as vscode from 'vscode';
import * as cp from 'child_process';

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

        child.on('exit', (code) => {
          if(errorOutput) {
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