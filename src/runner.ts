import * as cp from 'child_process';

export interface RunResult {
  exitCode: number | null;
  stderr: string;
}

export function runFile(filePath: string): Promise<RunResult> {
  return new Promise((resolve, reject) => {
    const child = cp.spawn('node', [filePath]);
    let stderr = '';

    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    child.on('error', reject);
    child.on('exit', (exitCode) => resolve({ exitCode, stderr }));
  });
}