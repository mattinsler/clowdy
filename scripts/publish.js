#!/usr/bin/env node

const fs = require('fs');
const vm = require('vm');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const REGISTRY = '--registry http://localhost:4873';

function action(message, fn) {
  console.log(message, '...');
  fn();
  console.log(message, '...', 'done');
}

action('clean', () => execSync('yarn clean && yarn clean:modules', { cwd: ROOT }));
action('install', () => execSync('yarn install', { cwd: ROOT }));
action('build', () => execSync('yarn build', { cwd: ROOT }));

function collect(packageDir) {
  const pkg = JSON.parse(fs.readFileSync(path.resolve(packageDir, 'package.json'), 'utf8'));

  const sha = JSON.parse(
    execSync(`npm pack --dry-run --json -s`, {
      cwd: packageDir
    }).toString()
  )[0].shasum;

  const registry = vm.runInNewContext('o=' + execSync(`npm view ${REGISTRY} ${pkg.name} . 2>/dev/null`).toString());

  const publish = sha !== registry.dist.shasum;

  return {
    directory: packageDir,
    package: pkg,
    publish,
    registry,
    sha,
    update: publish && pkg.version === registry.version
  };
}

function updateVersion(p) {
  const version = p.package.version.split('.').map(Number);
  ++version[2];
  console.log(`=> ${p.package.name} version updated ${p.package.version} => ${version.join('.')}`);
  p.package.version = version.join('.');
}

function publish(p) {
  fs.writeFileSync(path.resolve(p.directory, 'package.json'), JSON.stringify(p.package, null, 2), 'utf8');
  execSync(`npm publish ${REGISTRY}`, { cwd: p.directory });
}

let packages;
// collect package info
action('collect package info', () => {
  packages = fs
    .readdirSync(path.resolve(ROOT, 'packages'))
    .map(f => path.resolve(ROOT, 'packages', f))
    .filter(f => fs.statSync(f).isDirectory())
    .map(collect);
});

// do version updates
action('update versions', () => {
  for (const p of packages) {
    if (p.update) {
      updateVersion(p);
    }
  }
});

// for all packages, check and assign dependents, set update&publish if a change happens
action('update dependencies', () => {
  while (true) {
    let updated = false;

    for (const p of packages) {
      for (const other of packages) {
        if (
          !!other.package.dependencies &&
          !!other.package.dependencies[p.package.name] &&
          other.package.dependencies[p.package.name] !== p.package.version
        ) {
          console.log(`=> Update version of ${p.package.name} in ${other.package.name} to ${p.package.version}`);
          other.package.dependencies[p.package.name] = p.package.version;
          other.publish = true;
          if (!other.update) {
            other.update = true;
            updateVersion(other);
          }
          updated = true;
        }
      }
    }

    if (!updated) {
      break;
    }
  }
});

// do publishes
for (const p of packages) {
  if (p.publish) {
    action(`publishing ${p.package.name}@${p.package.version}`, () => {
      publish(p);
    });
  }
}
