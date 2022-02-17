#!/bin/bash

# default to true in case it is not set
DEPLOY_SUBGRAPH="${DEPLOY_SUBGRAPH:-true}"
echo "deploy subgraph is ${DEPLOY_SUBGRAPH}"

if [ "${DEPLOY_SUBGRAPH}" = "true" ]
then
  echo "Waiting for contracts to be deployed"
  while [ ! -f "/ocean-contracts/artifacts/ready" ]; do
    sleep 2
  done
  export ADDRESS_FILE="/ocean-contracts/artifacts/address.json"
  cd /usr/src/app/
  npm run quickstart:barge
fi
tail -f /dev/null
