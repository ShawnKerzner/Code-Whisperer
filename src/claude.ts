import * as vscode from 'vscode';
import Anthropic from '@anthropic-ai/sdk';
import { buildErrorPrompt } from './prompt';
import { Explanation, numberLines, parseExplanation } from './parsing';

export async function explainError(apiKey: string, stderr: string, source: string): Promise<Explanation> {
  const config = vscode.workspace.getConfiguration('codewhisperer');
  const client = new Anthropic({ apiKey });

  const response = await client.messages.create({
    model: config.get<string>('model', 'claude-sonnet-4-5'),
    max_tokens: config.get<number>('maxTokens', 1024),
    messages: [{ role: 'user', content: buildErrorPrompt(stderr, numberLines(source)) }],
  });

  const firstBlock = response.content[0];
  if (firstBlock.type !== 'text') {
    throw new Error(`Unexpected response type from Claude: ${firstBlock.type}`);
  }
  return parseExplanation(firstBlock.text);
}