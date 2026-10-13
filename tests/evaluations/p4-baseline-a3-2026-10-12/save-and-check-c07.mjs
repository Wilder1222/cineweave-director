import { readFile, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';

const output = 'D:/Temp/cineweave-split-p4-baseline-a3-20261012';
const inputPath = 'D:/Temp/cineweave-split-p4-contents-raw-inputs-20261012.json';
const checker = 'D:/Temp/cineweave-split-baseline-20261012-23e5cb0865/restored/skills/cineweave-director/scripts/check-shot-review.mjs';
const input = JSON.parse(await readFile(inputPath, 'utf8'));
const source = input.cases.find(item => item.id === 'CW-SPLIT-C07').rawData.sourceDocument.text;
await writeFile(`${output}/C07-source-FG-01-r1.txt`, source, 'utf8');
const result = spawnSync(process.execPath, [checker, `${output}/C07-review.json`], { encoding: 'utf8' });
await writeFile(`${output}/C07-check.stdout.json`, result.stdout, 'utf8');
await writeFile(`${output}/C07-check.stderr.txt`, result.stderr, 'utf8');
const execution = { nodeVersion: process.version, command: `node ${checker} ${output}/C07-review.json`, exitCode: result.status, signal: result.signal, error: result.error?.message ?? null, sourceTextSha256: createHash('sha256').update(source, 'utf8').digest('hex'), scope: 'plan_only' };
await writeFile(`${output}/C07-check.execution.json`, JSON.stringify(execution, null, 2) + '\n', 'utf8');
console.log(JSON.stringify(execution));
console.log(result.stdout);
