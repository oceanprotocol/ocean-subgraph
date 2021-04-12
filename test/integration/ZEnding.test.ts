/* eslint-disable prefer-destructuring */
import { assert, use } from 'chai'
import spies from 'chai-spies'
import Web3 from 'web3'
const fetch = require('cross-fetch')
const web3 = new Web3('http://127.0.0.1:8545')
const subgraphUrl =
  'http://localhost:9000/subgraphs/name/oceanprotocol/ocean-subgraph'

use(spies)

describe('Ending tests', () => {
  let result: any
  it('Get Graph status', async () => {
    const query = {
      query: `query {
        _meta{hasIndexingErrors,
          deployment,
          block{number}
        }
      }`
    }
    const response = await fetch(subgraphUrl, {
      method: 'POST',
      body: JSON.stringify(query)
    })
    result = await response.json()
  })

  it('Make sure that graph has no sync errors', async () => {
    assert(result.data._meta.hasIndexingErrors == false)
  })
  it('Make sure that graph has synced to last block', async () => {
    const lastblock = await web3.eth.getBlockNumber()
    assert(result.data._meta.block.number === lastblock)
  })
})
