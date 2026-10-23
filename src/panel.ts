import * as vscode from 'vscode';
import { Explanation } from './parsing';

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export function buildPanelHtml(source: string, crashLine: number | null, explanation: Explanation): string {
  const sourceHtml = source
    .split('\n')
    .map((line, index) => {
      const lineNumber = index + 1;
      const color = lineNumber === crashLine ? 'red' : 'inherit';
      return `<div style="color: ${color};">${lineNumber}: ${escapeHtml(line)}</div>`;
    })
    .join('');

  const section = (title: string, body: string) => `
    <div style="color: #4da6ff; margin-top: 20px;">
      <h3>${title}</h3>
      <p>${escapeHtml(body)}</p>
    </div>`;

  return `
    <html>
      <body style="font-family: monospace;">
        <div style="white-space: pre;">${sourceHtml}</div>
        ${section('What Went Wrong', explanation.whatWentWrong)}
        ${section('Why It Happened', explanation.whyItHappened)}
        ${section('Suggested Fix', explanation.suggestedFix)}
        <div style="color: #4da6ff; margin-top: 20px;">
          <h3>Replace lines ${explanation.replaceStartLine}–${explanation.replaceEndLine} with:</h3>
        </div>
        <pre style="color: #33cc33; background-color: rgba(51, 204, 51, 0.1); padding: 10px;">${escapeHtml(explanation.fixSnippet)}</pre>
      </body>
    </html>`;
}

export function showExplanationPanel(source: string, crashLine: number | null, explanation: Explanation): void {
  const panel = vscode.window.createWebviewPanel(
    'codewhispererExplanation',
    'CodeWhisperer',
    vscode.ViewColumn.Beside,
    {}
  );
  panel.webview.html = buildPanelHtml(source, crashLine, explanation);
}