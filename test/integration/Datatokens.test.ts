/* eslint-disable prefer-destructuring */
import { assert, use } from 'chai'
import spies from 'chai-spies'
import Web3 from 'web3'
import { Ocean, ConfigHelper, Account } from '@oceanprotocol/lib'
const fetch = require('cross-fetch')
const web3 = new Web3('http://127.0.0.1:8545')
const subgraphUrl =
  'http://127.0.0.1:9000/subgraphs/name/oceanprotocol/ocean-subgraph'
function sleep(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}
use(spies)

describe('Datatokens test flow', () => {
  let alice: Account
  let ocean: Ocean

  it('Initialize Ocean Library', async () => {
    await sleep(60000) // wait 1 min for graph
    const config = new ConfigHelper().getConfig('development')
    config.web3Provider = web3
    ocean = await Ocean.getInstance(config)
    alice = (await ocean.accounts.list())[0]
  })

  it('Alice publishes a datatoken and querys the graph', async () => {
    const datatoken = await ocean.datatokens.create('', alice.getId())
    const graphToken = datatoken.toLowerCase()
    await sleep(1000) // let graph ingest our transaction
    const query = {
      query: `query {
        datatoken(id:"${graphToken}"){symbol,id}}`
    }
    const response = await fetch(subgraphUrl, {
      method: 'POST',
      body: JSON.stringify(query)
    })
    const result = await response.json()
    assert(result.data.datatoken.id === graphToken)
  })
})
