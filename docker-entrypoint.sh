#!/bin/bash
echo "Waiting for contracts to be deployed"
while [ ! -f "/ocean-contracts/artifacts/ready" ]; do
  sleep 2
done
export ADDRESS_FILE="/ocean-contracts/artifacts/address.json"
/usr/src/app/
npm run quickstart:barge
tail -f /dev/null
