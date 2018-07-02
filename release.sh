#!/usr/bin/env bash
set -ex

project_name="$1"
ssh_destination="$2"

if [ "$project_name" = "" -o "$ssh_destination" = "" ] ; then
    echo "usage: ${0} [gcp project name] [ssh destination]"
    exit 1
fi

image_name="eu.gcr.io/$project_name/slack-integration/it-support:latest"
docker build -t $image_name .
gcloud auth configure-docker

docker push $image_name
ssh $ssh_destination "docker-credential-gcr configure-docker || exit 1; docker pull ${image_name}; docker rm -f server; docker run -d --rm --name server -p 80:3000 ${image_name}"

#echo -n "Compressing... "
#zip -r gcf.zip node_modules index.js package.json package-lock.json 1>/dev/null
#echo "done"

#echo -n "Deploying... "
#gcloud beta functions deploy "slack-integration-it-support" --project="$project_name" --memory=128M --entry-point=main --source=./ --trigger-http

#rm -f gcf.zip