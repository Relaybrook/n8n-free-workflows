import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const source = JSON.parse(readFileSync(join(root, 'workflows/lead-list-cleaner/workflow.json'), 'utf8'));
// Relaybrook's original twelve synthetic rows, held fixed across code changes.
const fixture = JSON.parse(readFileSync(join(root, 'tests/lead-list-cleaner/fixture.json'), 'utf8'));
assert.equal(fixture.length, 12);
const names = ['John Smith', "Mary O'Brien", 'Ludwig van der Berg', 'Anna-Lena Müller', 'Sales Team', 'Alex Rivera', 'Sam Lee', 'Jane Doe', 'Kevin McDonald'];

for (const kind of ['sample', 'padded-full-name', 'padded-first-name']) {
  const rows = structuredClone(fixture);
  if (kind === 'padded-full-name') rows[4]['Full Name'] = '  Dr. ANNA-LENA MÜLLER  ';
  if (kind === 'padded-first-name') {
    delete rows[4]['Full Name'];
    rows[4]['First Name'] = '  Dr. ANNA-LENA  ';
    rows[4]['Last Name'] = 'MÜLLER';
  }
  const workflow = structuredClone(source);
  const sample = workflow.nodes.find(n => n.name === 'Sample messy leads');
  assert.ok(sample, 'Keep the sample fixture boundary, or update this test when renaming it.');
  sample.parameters.jsCode = `return ${JSON.stringify(rows)}.map(json => ({ json }));`;
  const settings = workflow.nodes.find(n => n.name === 'Cleaner settings');
  settings.parameters.assignments.assignments.find(a => a.name === 'source').value = 'sample';
  const spec = {
    version: 1, name: `Lead cleaner: ${kind}`, input: { node: 'Run cleaner', items: [{}] }, mocks: [], timeoutMs: 90000,
    assertions: [
      { node: 'Preview cleaned leads', count: 9, pluck: 'json.full_name', equals: names },
      { node: 'Summarize cleaning run', count: 1, pluck: 'json.input_rows', equals: [12] },
      { node: 'Summarize cleaning run', pluck: 'json.output_rows', equals: [9] },
      { node: 'Summarize cleaning run', pluck: 'json.duplicates_merged', equals: [3] },
      ...['Read CSV file', 'Read leads from Google Sheets', 'Upsert into cleaned tab', 'Write cleaned CSV file'].map(node => ({ node, count: 0 })),
    ],
  };
  // Use the existing CLI against isolated, inactive workflows. All fixtures
  // are synthetic; the CSV/Sheets branches above are asserted to stay skipped.
  const work = join(root, 'temp/lead-list-cleaner-tests', kind); mkdirSync(work, { recursive: true });
  const workflowFile = join(work, 'workflow.json'), caseFile = join(work, 'case.json');
  writeFileSync(workflowFile, JSON.stringify(workflow)); writeFileSync(caseFile, JSON.stringify(spec));
  const result = spawnSync('n8n-check', [workflowFile, caseFile, '--out', join(work, 'report'), '--allow-network'], { stdio: 'inherit' });
  assert.equal(result.status, 0, `${kind}: ${result.error?.message || 'n8n output contract failed'}`);
  assert.equal(JSON.parse(readFileSync(join(work, 'report/report.json'), 'utf8')).requests.length, 0);
  console.log(`PASS ${kind}`);
}
