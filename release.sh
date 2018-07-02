#!/usr/bin/env bash
set -e

project_name="$1"

if [ "$project_name" = "" ] ; then
    echo "usage: ${0} [gcp project name]"
    exit 1
fi

echo -n "Compressing... "
zip -r gcf.zip node_modules index.js package.json package-lock.json 1>/dev/null
echo "done"

echo -n "Deploying... "
gcloud beta functions deploy "slack-integration-it-support" --project="$project_name" --memory=128M --entry-point=main --source=./gcf.zip --trigger-http

rm -f gcf.zip