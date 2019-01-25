#!/bin/sh

ROOT=$(cd `dirname $0`/..; pwd)
REGISTRY="--registry http://localhost:4873"

cd $ROOT
yarn clean
yarn clean:modules
yarn install
yarn build

for dir in $(find $ROOT/packages -type d -depth 1); do
  cd $dir

  name=$(jq -r '.name' package.json)
  sha=$(npm pack --dry-run --json | jq -r '.[0].shasum')
  registry_sha=$(npm view $REGISTRY $name dist.shasum 2>/dev/null)
  updated=$(test "$sha" = "$registry_sha"; echo $?)

  # echo "name=$name, sha=$sha, registry_sha=$registry_sha, updated=$updated"
  if [ $updated -ne 0 ]; then
    echo "Publishing $name"

    version=$(jq -r '.version' package.json)
    if [ ! -z $(npm view $REGISTRY $name@$version .version) ]; then
      echo "Updating version"
      version=$(npm version --no-git-tag-version patch)
      echo "Version updated to $version"
    fi

    npm publish $REGISTRY
  fi
done
