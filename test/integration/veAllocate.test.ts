// TODO - veAllocate - Create/Load dependencies & interface
// import {
//   veAllocate
// } from '@oceanprotocol/lib'

import { assert } from 'chai'
import Web3 from 'web3'
import { homedir } from 'os'
import fs from 'fs'
import { fetch } from 'cross-fetch'

const data = JSON.parse(
  fs.readFileSync(
    process.env.ADDRESS_FILE ||
      `${homedir}/.ocean/ocean-contracts/artifacts/address.json`,
    'utf8'
  )
)

const addresses = data.development
const web3 = new Web3('http://127.0.0.1:8545')
const subgraphUrl = 'http://127.0.0.1:9000/subgraphs/name/oceanprotocol/ocean-subgraph'

const veAllocateAddress = ''
const veAllocateABI = ''

describe('Simple veAllocate testing', async () => {
  let accounts: string[]
  let veAllocate: Object
  let alice: string
  let bob: string
  
  before(async () => {
    // veAllocate = new veAllocate(veAllocateAddress, web3)
    accounts = await web3.eth.getAccounts()
    alice = accounts[0]
    bob = accounts[1]

    // TODO - give ocean to alice
    // TODO - get alice to lock ocean
  })

  it('should allocate and remove allocation for a given DT + chain', async () => {
    const dt: Object = {
      address: '0x000000000000000000000000000000000000ABCD',
      chain: 1
    }

    // TODO - allocate veOcean to veAllocate -> id, amount
    // TODO - remove allocation from veAllocate-> id
    // TODO - graph tests here
    assert(1 === 1)
  })
})
