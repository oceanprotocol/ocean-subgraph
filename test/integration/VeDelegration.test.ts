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

describe('Delegation tests', async () => {
  let veOcean: VeOcean
  let ownerAccount: string
  let Eve: string
  let Bob: string
  let delegateContract
  const configHelper = new ConfigHelper()
  const config = configHelper.getConfig('development')

  before(async () => {
    const accounts = await web3.eth.getAccounts()
    ownerAccount = accounts[0]
    Bob = accounts[2]
    Eve = accounts[4]
    delegateContract = new web3.eth.Contract(
      veDelegation.abi as AbiItem[],
      addresses.veDelegation
    )

    const tokenContract = new web3.eth.Contract(minAbi, addresses.Ocean)
    const estGas = await calculateEstimatedGas(
      ownerAccount,
      tokenContract.methods.mint,
      Eve,
      web3.utils.toWei('100000')
    )
    await sendTx(
      ownerAccount,
      estGas,
      web3,
      1,
      tokenContract.methods.mint,
      Eve,
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

  it('Eve should lock 100 Ocean and Delegate them to Bob', async () => {
    // since we can only lock once, we test if tx fails or not
    // so if there is already a lock, skip it
    let currentBalance = await veOcean.getLockedAmount(Eve)
    let currentLock = await veOcean.lockEnd(Eve)
    const amount = '100'
    await approve(web3, config, Eve, addresses.Ocean, addresses.veOCEAN, amount)
    const timestamp = Math.floor(Date.now() / 1000)
    const unlockTime = timestamp + 30 * 86400
    console.log('unlock time', unlockTime)

    if (parseInt(currentBalance) > 0 || currentLock > 0) {
      // we already have some locked tokens, so our transaction should fail
      try {
        await veOcean.lockTokens(Eve, amount, unlockTime)
        assert(false, 'This should fail!')
      } catch (e) {
        // do nothing
      }
    } else {
      await veOcean.lockTokens(Eve, amount, unlockTime)
    }
    currentBalance = await veOcean.getLockedAmount(Eve)
    currentLock = await veOcean.lockEnd(Eve)
    await sleep(2000)
    const initialQuery = {
      query: `query {
                      veOCEANs(id:"${Eve.toLowerCase()}"){    
                        id,
                        lockedAmount,
                        unlockTime
                      }
                    }`
    }
    await sleep(2000)

    const initialResponse = await fetch(subgraphUrl, {
      method: 'POST',
      body: JSON.stringify(initialQuery)
    })
    await sleep(2000)
    console.log('initial response', initialResponse)
    const info = (await initialResponse.json()).data.veOCEANs
    console.log('info', info)
    assert(info[0].id === Eve.toLowerCase(), 'ID is incorrect')
    assert(info[0].lockedAmount === currentBalance, 'LockedAmount is incorrect')
    assert(info[0].unlockTime === currentLock, 'Unlock time is not correct')

    const lockTime = await veOcean.lockEnd(Eve)
    const extLockTime = Number(lockTime) + 31556926

    await delegateContract.methods.setApprovalForAll(Eve, true).send({
      from: Eve
    })

    await veOcean.increaseUnlockTime(Eve, extLockTime)

    const estGas = await calculateEstimatedGas(
      Eve,
      delegateContract.methods.create_boost,
      Eve,
      Bob,
      10000,
      0,
      extLockTime,
      0
    )

    const tx3 = await sendTx(
      Eve,
      estGas,
      web3,
      1,
      delegateContract.methods.create_boost,
      Eve,
      Bob,
      10000,
      0,
      extLockTime,
      0
    )
    console.log('TX3: ', tx3)
    console.log('Events: ', tx3.events.DelegateBoost)
    console.log('Events: ', tx3.events.DelegateBoost.returnValues)
    console.log('Events: ', tx3.events.DelegateBoost.returnValues._token_id)

    assert(tx3, 'Transaction failed')
    assert(tx3.events.DelegateBoost, 'No Delegate boost event')

    sleep(2000)
    const delegateQuery = {
      query: `query {
        veDelegation(id:"${tx3.events.DelegateBoost.returnValues._token_id}"){    
          id
          delegator {
            id
          }
          receiver {
            id
          }
          tokenId
          amount
          cancelTime
          expireTime
          block
                    }
                  }`
    }

    const delegateResponse = await fetch(subgraphUrl, {
      method: 'POST',
      body: JSON.stringify(delegateQuery)
    })
    const json = await delegateResponse.json()
    console.log('Json', json)
    console.log('Data', json?.data)
    console.log('veDelegation', json?.data?.veDelegations)
    assert(json?.data?.veDelegations, 'No veDelegations')
  })
})
