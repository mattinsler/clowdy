#!/bin/sh

ROOT=$(cd `dirname $0`/..; pwd)

cd $ROOT

# yarn clean
# yarn clean:modules

# yarn install

# yarn build

rm -rf dist
mkdir dist

for dir in $(find packages -depth 1 -type d); do
  dirname=`basename $dir`
  mkdir dist/$dirname
done
