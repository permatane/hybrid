'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { execFileSync } = require('node:child_process');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const motion = fs.readFileSync(path.join(root, 'hybrid/rivis.motion.js'), 'utf8');
const support = fs.readFileSync(path.join(root, 'hybrid/rivis.support.js'), 'utf8');

test('Motion Studio is hidden immediately when its async module mounts', () => {
  assert.match(motion, /section\.hidden\s*=\s*true/);
  assert.match(motion, /section\.setAttribute\('hidden',''\)/);
  assert.match(motion, /section\.style\.display\s*=\s*'none'/);
  assert.match(motion, /#tabSectionMotionStudio\[hidden\]\{display:none!important\}/);
});

test('switchTab hides Motion Studio on every tab change and only reveals it on selection', () => {
  assert.match(support, /if\(el\.id==='tabSectionMotionStudio'\)\{el\.hidden=true;el\.setAttribute\('hidden',''\);el\.style\.display='none';/);
  assert.match(support, /motionPanel\.hidden=false;motionPanel\.removeAttribute\('hidden'\);motionPanel\.style\.removeProperty\('display'\);motionPanel\.classList\.remove\('hidden'\)/);
});

test('legacy default tab and existing tab routes remain registered', () => {
  assert.match(support, /const state=\{activeTab:'idea_studio'/);
  for (const tab of ['idea_studio', 'saved_ideas', 'meta_gen', 'cloud_library']) {
    assert.ok(support.includes("tabId==='" + tab + "'"), 'missing legacy tab route: ' + tab);
  }
  assert.ok(support.includes("switchTab('idea_studio')"), 'legacy Library-to-Idea route missing');
});

test('Motion and Support runtime files pass Node syntax checks', () => {
  for (const file of ['hybrid/rivis.motion.js', 'hybrid/rivis.support.js']) {
    execFileSync(process.execPath, ['--check', path.join(root, file)], { stdio: 'pipe' });
  }
});
