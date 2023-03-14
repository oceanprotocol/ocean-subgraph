import {
  VeOcean,
  calculateEstimatedGas,
  sendTx,
  approve,
  ConfigHelper,
  sleep
} from '@oceanprotocol/lib'
import { AbiItem } from 'web3-utils'
import { assert } from 'chai'
import Web3 from 'web3'
import { homedir } from 'os'
import fs from 'fs'
import { fetch } from 'cross-fetch'
import veDelegation from '@oceanprotocol/contracts/artifacts/contracts/ve/veDelegation.vy/veDelegation.json'

const data = JSON.parse(
  fs.readFileSync(
    process.env.ADDRESS_FILE ||
      `${homedir}/.ocean/ocean-contracts/artifacts/address.json`,
    'utf8'
  )
)

const addresses = data.development
const web3 = new Web3('http://127.0.0.1:8545')

const subgraphUrl =
  'http://127.0.0.1:9000/subgraphs/name/oceanprotocol/ocean-subgraph'

const minAbi = [
  {
    constant: false,
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'value', type: 'uint256' }
    ],
    name: 'mint',
    outputs: [{ name: '', type: 'bool' }],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function'
  }
] as AbiItem[]

describe('veOcean tests', async () => {
  let veOcean: VeOcean
  let ownerAccount: string
  let Alice: string
  let Bob: string
  let delegateContract
  const configHelper = new ConfigHelper()
  const config = configHelper.getConfig('development')

  before(async () => {
    const accounts = await web3.eth.getAccounts()
    ownerAccount = accounts[0]
    Alice = accounts[1]
    Bob = accounts[2]
    delegateContract = new web3.eth.Contract(
      veDelegation.abi as AbiItem[],
      addresses.veDelegation
    )

    const tokenContract = new web3.eth.Contract(minAbi, addresses.Ocean)
    const estGas = await calculateEstimatedGas(
      ownerAccount,
      tokenContract.methods.mint,
      Alice,
      web3.utils.toWei('100000')
    )
    await sendTx(
      ownerAccount,
      estGas,
      web3,
      1,
      tokenContract.methods.mint,
      Alice,
      web3.utils.toWei('100000')
    )
    await sendTx(
      ownerAccount,
      estGas,
      web3,
      1,
      tokenContract.methods.mint,
      Bob,
      web3.utils.toWei('100000')
    )
    veOcean = new VeOcean(addresses.veOCEAN, web3)
  })

  it('Alice should lock 100 Ocean and Delegate them to Bob', async () => {
    // since we can only lock once, we test if tx fails or not
    // so if there is already a lock, skip it
    let currentBalance = await veOcean.getLockedAmount(Alice)
    let currentLock = await veOcean.lockEnd(Alice)
    const amount = '100'
    await approve(
      web3,
      config,
      Alice,
      addresses.Ocean,
      addresses.veOCEAN,
      amount
    )
    const timestamp = Math.floor(Date.now() / 1000)
    const unlockTime = timestamp + 7 * 86400

    if (parseInt(currentBalance) > 0 || currentLock > 0) {
      // we already have some locked tokens, so our transaction should fail
      try {
        await veOcean.lockTokens(Alice, amount, unlockTime)
        assert(false, 'This should fail!')
      } catch (e) {
        // do nothing
      }
    } else {
      await veOcean.lockTokens(Alice, amount, unlockTime)
    }
    currentBalance = await veOcean.getLockedAmount(Alice)
    currentLock = await veOcean.lockEnd(Alice)
    await sleep(2000)
    const initialQuery = {
      query: `query {
                    veOCEANs(id:"${Alice.toLowerCase()}"){    
                      id,
                      lockedAmount,
                      unlockTime
                    }
                  }`
    }
    const initialResponse = await fetch(subgraphUrl, {
      method: 'POST',
      body: JSON.stringify(initialQuery)
    })
    const info = (await initialResponse.json()).data.veOCEANs
    assert(info[0].id === Alice.toLowerCase())
    assert(info[0].lockedAmount === currentBalance)
    assert(info[0].unlockTime === currentLock)

    const lockTime = await veOcean.lockEnd(Alice)

    const tx1 = await delegateContract.methods
      .setApprovalForAll(Alice, true)
      .send({
        from: Alice
      })
    console.log('TX1: ', tx1)

    const tx = await delegateContract.methods
      .create_boost(Alice, Bob, 100, 0, lockTime, 0)
      .send({
        from: Bob
      })
    console.log('TX: ', tx)
  })
})
