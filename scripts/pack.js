#!/usr/bin/env node

const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');

function action(message, fn) {
  console.log(message, '...');
  fn();
  console.log(message, '...', 'done');
}

action('clean', () =>
  execSync('yarn clean && yarn clean:modules', { cwd: ROOT })
);
action('install', () => execSync('yarn install', { cwd: ROOT }));
action('build', () => execSync('yarn build', { cwd: ROOT }));

action('packing for Mac', () => {
  execSync('npm shrinkwrap', { cwd: path.resolve(ROOT, 'packages', 'cli') });
  execSync('yarn pack:macos', { cwd: path.resolve(ROOT, 'packages', 'cli') });
});
