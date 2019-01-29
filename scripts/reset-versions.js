#!/usr/bin/env node

const fs = require('fs');
const vm = require('vm');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const REGISTRY = '--registry http://localhost:4873';

function collect(packageDir) {
  const pkg = JSON.parse(
    fs.readFileSync(path.resolve(packageDir, 'package.json'), 'utf8')
  );

  const registry = vm.runInNewContext(
    'o=' + execSync(`npm view ${REGISTRY} ${pkg.name} . 2>/dev/null`).toString()
  );

  return {
    directory: packageDir,
    package: pkg,
    registry,
    update: false
  };
}

// collect package info
const packages = fs
  .readdirSync(path.resolve(ROOT, 'packages'))
  .map(f => path.resolve(ROOT, 'packages', f))
  .filter(f => fs.statSync(f).isDirectory())
  .map(collect);

// set versions
for (const p of packages) {
  if (p.package.version !== p.registry.version) {
    console.log(p.package.name, p.package.version, '=>', p.registry.version);
    p.package.version = p.registry.version;
    p.update = true;
  }
}

while (true) {
  let updated = false;

  for (const p of packages) {
    for (const other of packages) {
      if (
        !!other.package.dependencies &&
        !!other.package.dependencies[p.package.name] &&
        other.package.dependencies[p.package.name] !== p.package.version
      ) {
        console.log(
          `=> Update version of ${p.package.name} in ${other.package.name} to ${
            p.package.version
          }`
        );
        other.package.dependencies[p.package.name] = p.package.version;
        other.update = true;
      }
    }
  }

  if (!updated) {
    break;
  }
}

for (const p of packages) {
  if (p.update) {
    fs.writeFileSync(
      path.resolve(p.directory, 'package.json'),
      JSON.stringify(p.package, null, 2),
      'utf8'
    );
  }
}
