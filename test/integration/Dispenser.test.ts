/* eslint-disable prefer-destructuring */
import { assert, use } from 'chai'
import spies from 'chai-spies'
import Web3 from 'web3'
import { Ocean, ConfigHelper, Account } from '@oceanprotocol/lib'
const fetch = require('cross-fetch')
const web3 = new Web3('http://127.0.0.1:8545')
const subgraphUrl =
  'http://localhost:9000/subgraphs/name/oceanprotocol/ocean-subgraph'
function sleep(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

async function getDispenserStatusFromGraph(datatoken: string) {
  const id = datatoken.toLowerCase()
  const query = {
    query: `query {
      dispenser(id:"${id}"){active,owner{id},minterApproved,isTrueMinter,maxTokens,maxBalance,balance,datatoken{id}}}`
  }
  const response = await fetch(subgraphUrl, {
    method: 'POST',
    body: JSON.stringify(query)
  })
  const result = await response.json()
  return result
}

use(spies)

describe('Dispenser test flow', () => {
  let alice: Account
  let bob: Account
  let ocean: Ocean
  let tokenAddress
  let tokenAddress2
  let tokenAddress3
  const tokenAmount = '1000'
  it('Initialize Ocean Library', async () => {
    const config = new ConfigHelper().getConfig('development')
    config.web3Provider = web3
    ocean = await Ocean.getInstance(config)
    alice = (await ocean.accounts.list())[0]
    bob = (await ocean.accounts.list())[1]
  })

  it('should create some datatokens', async () => {
    tokenAddress = await ocean.datatokens.create(
      '',
      alice.getId(),
      '1000000000000000',
      'AliceDT',
      'DTA'
    )
    assert(tokenAddress !== null)
    tokenAddress2 = await ocean.datatokens.create(
      '',
      alice.getId(),
      '1000000000000000',
      'AliceDT2',
      'DTA2'
    )
    assert(tokenAddress2 !== null)
    tokenAddress3 = await ocean.datatokens.create(
      '',
      alice.getId(),
      '1000000000000000',
      'AliceDT3',
      'DTA3'
    )
    assert(tokenAddress3 !== null)
  })

  it('Alice mints 1000 tokens', async () => {
    const txid = await ocean.datatokens.mint(
      tokenAddress,
      alice.getId(),
      tokenAmount
    )
    assert(txid !== null)
  })

  it('Alice creates a dispenser', async () => {
    const tx = await ocean.OceanDispenser.activate(
      tokenAddress,
      '1',
      '1',
      alice.getId()
    )
    assert(tx, 'Cannot activate dispenser')
    await sleep(3000) // let graph ingest our transaction
    const status = await getDispenserStatusFromGraph(tokenAddress)
    assert(status.data.dispenser.datatoken.id === tokenAddress.toLowerCase())
    assert(status.data.dispenser.owner.id === alice.getId().toLowerCase())
    assert(status.data.dispenser.isTrueMinter === false)
    assert(status.data.dispenser.minterApproved === false)
    assert(status.data.dispenser.active === true)
    assert(status.data.dispenser.balance === '0')
  })

  it('Alice should make the dispenser a minter', async () => {
    const tx = await ocean.OceanDispenser.makeMinter(
      tokenAddress,
      alice.getId()
    )
    assert(tx, 'Cannot make dispenser a minter')
    await sleep(3000) // let graph ingest our transaction
    const status = await getDispenserStatusFromGraph(tokenAddress)
    assert(status.data.dispenser.datatoken.id === tokenAddress.toLowerCase())
    assert(status.data.dispenser.owner.id === alice.getId().toLowerCase())
    assert(status.data.dispenser.isTrueMinter === true)
    assert(status.data.dispenser.minterApproved === true)
  })

  it('Bob requests datatokens', async () => {
    const tx = await ocean.OceanDispenser.dispense(
      tokenAddress,
      bob.getId(),
      '1'
    )
    assert(tx, 'Bob failed to get 1DT')
    await sleep(3000) // let graph ingest our transaction
    const id = tx.transactionHash.toLowerCase()
    const query = {
      query: `query DispenserHistory {
      dispenserTransactions(orderBy: timestamp, orderDirection: desc,
        where: {tx: "${id}"}) {
          datatoken{id},
          user{id},
          amount,
          block,
          timestamp,
          tx,
          type
      }
    }`
    }

    const response = await fetch(subgraphUrl, {
      method: 'POST',
      body: JSON.stringify(query)
    })
    const result = await response.json()

    assert(result.data.dispenserTransactions[0].type === 'dispense')
  })
  it('Alice calls removeMinter role and checks if she is the new minter', async () => {
    const tx = await ocean.OceanDispenser.cancelMinter(
      tokenAddress,
      alice.getId()
    )
    assert(tx, 'Cannot cancel minter role')
    await sleep(3000) // let graph ingest our transaction
    const status = await getDispenserStatusFromGraph(tokenAddress)
    assert(status.data.dispenser.datatoken.id === tokenAddress.toLowerCase())
    assert(status.data.dispenser.owner.id === alice.getId().toLowerCase())
    assert(status.data.dispenser.isTrueMinter === false)
    assert(status.data.dispenser.minterApproved === false)
    assert(status.data.dispenser.active === true)
  })
  it('Alice deactivates the dispenser', async () => {
    const tx = await ocean.OceanDispenser.deactivate(
      tokenAddress,
      alice.getId()
    )
    assert(tx, 'Cannot make dispenser a minter')
    await sleep(3000) // let graph ingest our transaction
    const status = await getDispenserStatusFromGraph(tokenAddress)
    assert(status.data.dispenser.datatoken.id === tokenAddress.toLowerCase())
    assert(status.data.dispenser.owner.id === alice.getId().toLowerCase())
    assert(status.data.dispenser.active === false)
  })

  it('Alice creates a dispenser without minter role', async () => {
    const tx = await ocean.OceanDispenser.activate(
      tokenAddress2,
      '1',
      '1',
      alice.getId()
    )
    assert(tx, 'Cannot activate dispenser')
    await sleep(3000) // let graph ingest our transaction
    const status = await getDispenserStatusFromGraph(tokenAddress2)
    assert(status.data.dispenser.datatoken.id === tokenAddress2.toLowerCase())
    assert(status.data.dispenser.owner.id === alice.getId().toLowerCase())
    assert(status.data.dispenser.isTrueMinter === false)
    assert(status.data.dispenser.minterApproved === false)
    assert(status.data.dispenser.active === true)
  })
  it('Alice withdraws all datatokens', async () => {
    const mintTx = await ocean.datatokens.mint(
      tokenAddress2,
      alice.getId(),
      '10',
      ocean.OceanDispenser.dispenserAddress
    )
    assert(mintTx, 'Alice cannot mint tokens')
    const tx = await ocean.OceanDispenser.ownerWithdraw(
      tokenAddress2,
      alice.getId()
    )
    assert(tx, 'Alice failed to withdraw all her tokens')
    await sleep(3000) // let graph ingest our transaction
    const status = await getDispenserStatusFromGraph(tokenAddress2)
    assert(status.data.dispenser.datatoken.id === tokenAddress2.toLowerCase())
    assert(status.data.dispenser.owner.id === alice.getId().toLowerCase())
    assert(status.data.dispenser.isTrueMinter === false)
    assert(status.data.dispenser.minterApproved === false)
    assert(status.data.dispenser.active === true)
    assert(status.data.dispenser.balance === '0')
    const id = tx.transactionHash.toLowerCase()
    const query = {
      query: `query DispenserHistory {
      dispenserTransactions(orderBy: timestamp, orderDirection: desc,
        where: {tx: "${id}"}) {
          datatoken{id},
          user{id},
          amount,
          block,
          timestamp,
          tx,
          type
      }
    }`
    }
    // console.log(query)
    const response = await fetch(subgraphUrl, {
      method: 'POST',
      body: JSON.stringify(query)
    })
    const result = await response.json()
    assert(result.data.dispenserTransactions[0].type === 'withdraw')
  })
})
