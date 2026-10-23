import * as vscode from 'vscode';
import * as fs from 'fs';
import { runFile } from './runner';
import { findCrashLine } from './parsing';
import { explainError } from './claude';
import { showExplanationPanel } from './panel';
import Anthropic from '@anthropic-ai/sdk';

const API_KEY_SECRET = 'codewhisperer.anthropicApiKey';

export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.commands.registerCommand('codewhisperer.runFile', () => handleRunFile(context)),
    vscode.commands.registerCommand('codewhisperer.setApiKey', () => promptForApiKey(context))
  );
}

export function deactivate() {}

async function handleRunFile(context: vscode.ExtensionContext) {
  try {
    await runAndExplain(context);
  } catch (err) {
    if (err instanceof Anthropic.AuthenticationError) {
      vscode.window.showErrorMessage(
        'CodeWhisperer: your API key was rejected. Run "CodeWhisperer: Set API Key" to update it.'
      );
      return;
    }
    const message = err instanceof Error ? err.message : String(err);
    vscode.window.showErrorMessage(`CodeWhisperer: ${message}`);
  }
}

async function runAndExplain(context: vscode.ExtensionContext) {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    vscode.window.showErrorMessage('No file is open to run.');
    return;
  }

  const filePath = editor.document.fileName;
  const { exitCode, stderr } = await runFile(filePath);
  if (exitCode === 0) {
    vscode.window.showInformationMessage('CodeWhisperer: file ran without errors.');
    return;
  }

  const apiKey = (await context.secrets.get(API_KEY_SECRET)) ?? (await promptForApiKey(context));
  if (!apiKey) {
    return;
  }

  const source = fs.readFileSync(filePath, 'utf-8');
  const explanation = await explainError(apiKey, stderr, source);
  showExplanationPanel(source, findCrashLine(stderr), explanation);
}

async function promptForApiKey(context: vscode.ExtensionContext): Promise<string | undefined> {
  const key = await vscode.window.showInputBox({
    prompt: 'Enter your Anthropic API key (from console.anthropic.com)',
    password: true,
    ignoreFocusOut: true,
  });
  if (!key) {
    return undefined;
  }
  await context.secrets.store(API_KEY_SECRET, key);
  return key;
}