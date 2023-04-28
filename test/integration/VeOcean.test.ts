import {
  VeOcean,
  VeAllocate,
  NftFactory,
  calculateEstimatedGas,
  sendTx,
  approve,
  ConfigHelper,
  sleep,
  VeFeeDistributor
} from '@oceanprotocol/lib'
import { AbiItem } from 'web3-utils'
import { HttpProvider } from 'web3-providers-http'
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

function evmMine() {
  const provider = web3.currentProvider as HttpProvider
  return new Promise((resolve, reject) => {
    provider.send(
      {
        jsonrpc: '2.0',
        method: 'evm_mine',
        id: new Date().getTime()
      },
      (error, result) => {
        if (error) {
          return reject(error)
        }
        return resolve(result)
      }
    )
  })
}
function evmIncreaseTime(seconds) {
  const provider = web3.currentProvider as HttpProvider
  return new Promise((resolve, reject) => {
    provider.send(
      {
        method: 'evm_increaseTime',
        params: [seconds],
        jsonrpc: '2.0',
        id: new Date().getTime()
      },
      (error, result) => {
        if (error) {
          return reject(error)
        }
        return evmMine().then(() => resolve(result))
      }
    )
  })
}

async function getTotalLockedOcean() {
  const initialQuery = {
    query: `query{
      globalStatistics{
        totalOceanLocked
      }
    }`
  }
  const initialResponse = await fetch(subgraphUrl, {
    method: 'POST',
    body: JSON.stringify(initialQuery)
  })
  const data = (await initialResponse.json()).data.globalStatistics
  if (data.length == 0) return 0

  return data[0].totalOceanLocked
}
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
  let nftFactory
  let veOcean: VeOcean
  let delegateContract
  let veAllocate: VeAllocate
  let veFeeDistributor: VeFeeDistributor
  let ownerAccount: string
  let Alice: string
  let Bob: string
  let nft1, nft2, nft3
  let chainId
  const configHelper = new ConfigHelper()
  const config = configHelper.getConfig('development')

  before(async () => {
    const accounts = await web3.eth.getAccounts()
    chainId = await web3.eth.getChainId()
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
    veAllocate = new VeAllocate(addresses.veAllocate, web3)
    nftFactory = new NftFactory(addresses.ERC721Factory, web3)
    veFeeDistributor = new VeFeeDistributor(addresses.veFeeDistributor, web3)
  })

  it('Alice should lock 100 Ocean', async () => {
    // since we can only lock once, we test if tx fails or not
    // so if there is already a lock, skip it
    const totalOceanLockedBefore = await getTotalLockedOcean()
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
    const totalOceanLockedAfter = await getTotalLockedOcean()
    assert(
      parseFloat(totalOceanLockedAfter) > parseFloat(totalOceanLockedBefore),
      'After (' +
        totalOceanLockedAfter +
        ') shold be higher then ' +
        totalOceanLockedBefore
    )
    assert(
      parseFloat(totalOceanLockedAfter) ==
        parseFloat(totalOceanLockedBefore + amount),
      'Invalid totalOceanLockedAfter (' + totalOceanLockedAfter + ')'
    )
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
  })

  it('Alice should increase the lock time', async () => {
    const currentLock = await veOcean.lockEnd(Alice)
    const newLock = parseInt(String(currentLock)) + 7 * 86400
    await veOcean.increaseUnlockTime(Alice, newLock)
    const newCurrentLock = await veOcean.lockEnd(Alice)
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
    assert(
      info[0].unlockTime === newCurrentLock,
      'Expected lock ' +
        newCurrentLock +
        ' to equal subgraph value ' +
        info[0].unlockTime
    )
  })

  it('Alice should increase the locked amount', async () => {
    const amount = '200'
    await approve(
      web3,
      config,
      Alice,
      addresses.Ocean,
      addresses.veOCEAN,
      amount
    )
    await veOcean.increaseAmount(Alice, amount)
    const newCurrentBalance = await veOcean.getLockedAmount(Alice)
    const newCurrentLock = await veOcean.lockEnd(Alice)
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
    assert(
      info[0].unlockTime === newCurrentLock,
      'Expected lock ' +
        newCurrentLock +
        ' to equal subgraph value ' +
        info[0].unlockTime
    )
    assert(
      info[0].lockedAmount === newCurrentBalance,
      'Expected balance ' +
        newCurrentBalance +
        ' to equal subgraph value ' +
        info[0].lockedAmount
    )
  })

  it('Alice should publish 3 NFTs', async () => {
    // publish 3 nfts
    nft1 = await nftFactory.createNFT(Alice, {
      name: 'testNft1',
      symbol: 'TSTF1',
      templateIndex: 1,
      tokenURI: '',
      transferable: true,
      owner: Alice
    })
    nft2 = await nftFactory.createNFT(Alice, {
      name: 'testNft2',
      symbol: 'TSTF2',
      templateIndex: 1,
      tokenURI: '',
      transferable: true,
      owner: Alice
    })
    nft3 = await nftFactory.createNFT(Alice, {
      name: 'testNft3',
      symbol: 'TSTF3',
      templateIndex: 1,
      tokenURI: '',
      transferable: true,
      owner: Alice
    })
  })

  it('Alice should allocate 10% to NFT1', async () => {
    const tx = await veAllocate.setAllocation(Alice, '1000', nft1, chainId)
    const newTotalAllocation = await veAllocate.getTotalAllocation(Alice)
    await sleep(2000)
    let initialQuery = {
      query: `query {
                veAllocateUsers(id:"${Alice.toLowerCase()}"){    
                    id,
                    allocatedTotal
                    eventIndex
                  }
                }`
    }
    let initialResponse = await fetch(subgraphUrl, {
      method: 'POST',
      body: JSON.stringify(initialQuery)
    })
    let info = (await initialResponse.json()).data.veAllocateUsers
    assert(
      info[0].allocatedTotal === newTotalAllocation,
      'Expected totalAllocation ' +
        newTotalAllocation +
        ' to equal subgraph value ' +
        info[0].allocatedTotal
    )
    assert(info[0].eventIndex === tx.events.AllocationSet.logIndex)
    initialQuery = {
      query: `query {
        veAllocations(
          where: {allocationUser:"${Alice.toLowerCase()}", chainId:"${chainId}", nftAddress:"${nft1.toLowerCase()}"}
        ){    
                    id,
                    allocated,
                    eventIndex
                  }
                }`
    }
    initialResponse = await fetch(subgraphUrl, {
      method: 'POST',
      body: JSON.stringify(initialQuery)
    })
    info = (await initialResponse.json()).data.veAllocations
    assert(
      info[0].allocated === '1000',
      'Expected totalAllocation 1000 to equal subgraph value ' +
        info[0].allocatedTotal
    )
    assert(info[0].eventIndex === tx.events.AllocationSet.logIndex)
  })

  it('Alice should allocate 10% to NFT2 and 20% to NFT3', async () => {
    const tx = await veAllocate.setBatchAllocation(
      Alice,
      ['1000', '2000'],
      [nft2, nft3],
      [chainId, chainId]
    )
    const totalAllocation = await veAllocate.getTotalAllocation(Alice)

    await sleep(2000)
    let initialQuery = {
      query: `query {
                veAllocateUsers(id:"${Alice.toLowerCase()}"){    
                    id,
                    allocatedTotal,
                    eventIndex
                  }
                }`
    }
    let initialResponse = await fetch(subgraphUrl, {
      method: 'POST',
      body: JSON.stringify(initialQuery)
    })
    let info = (await initialResponse.json()).data.veAllocateUsers
    assert(
      info[0].allocatedTotal === totalAllocation,
      'Expected totalAllocation ' +
        totalAllocation +
        ' to equal subgraph value ' +
        info[0].allocatedTotal
    )
    assert(info[0].eventIndex === tx.events.AllocationSetMultiple.logIndex)
    initialQuery = {
      query: `query {
        veAllocations(
          where: {allocationUser:"${Alice.toLowerCase()}", chainId:"${chainId}", nftAddress:"${nft2.toLowerCase()}"}
        ){
                    id,
                    allocated,
                    eventIndex
                  }
                }`
    }
    initialResponse = await fetch(subgraphUrl, {
      method: 'POST',
      body: JSON.stringify(initialQuery)
    })
    info = (await initialResponse.json()).data.veAllocations
    assert(
      info[0].allocated === '1000',
      'Expected totalAllocation 1000 to equal subgraph value ' +
        info[0].allocatedTotal
    )
    assert(info[0].eventIndex === tx.events.AllocationSetMultiple.logIndex)
    initialQuery = {
      query: `query {
        veAllocations(
            where: {allocationUser:"${Alice.toLowerCase()}", chainId:"${chainId}", nftAddress:"${nft3.toLowerCase()}"}
          ){    
                    id,
                    allocated
                  }
                }`
    }
    initialResponse = await fetch(subgraphUrl, {
      method: 'POST',
      body: JSON.stringify(initialQuery)
    })
    info = (await initialResponse.json()).data.veAllocations
    assert(
      info[0].allocated === '2000',
      'Expected totalAllocation 1000 to equal subgraph value ' +
        info[0].allocatedTotal
    )
  })

  it('Alice should advance chain one day', async () => {
    await evmIncreaseTime(60 * 60 * 24)
  })

  it('Alice should add ocean rewards to feeDistrib', async () => {
    // mint 10 ocean and send them to feeDistrib
    let tokenContract = new web3.eth.Contract(minAbi, addresses.Ocean)
    let estGas = await calculateEstimatedGas(
      ownerAccount,
      tokenContract.methods.mint,
      addresses.veFeeDistributor,
      web3.utils.toWei('10')
    )
    await sendTx(
      ownerAccount,
      estGas,
      web3,
      1,
      tokenContract.methods.mint,
      addresses.veFeeDistributor,
      web3.utils.toWei('10')
    )
    const minAbiFee = [
      {
        name: 'checkpoint_token',
        outputs: [],
        inputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
        gas: 820723
      },
      {
        name: 'checkpoint_total_supply',
        outputs: [],
        inputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
        gas: 10592405
      }
    ] as AbiItem[]
    tokenContract = new web3.eth.Contract(minAbiFee, addresses.veFeeDistributor)
    estGas = await calculateEstimatedGas(
      ownerAccount,
      tokenContract.methods.checkpoint_token
    )

    await sendTx(
      ownerAccount,
      estGas,
      web3,
      1,
      tokenContract.methods.checkpoint_token
    )
    estGas = await calculateEstimatedGas(
      ownerAccount,
      tokenContract.methods.checkpoint_total_supply
    )
    await sendTx(
      ownerAccount,
      estGas,
      web3,
      1,
      tokenContract.methods.checkpoint_total_supply
    )
  })

  it('Alice should advance chain 7 day', async () => {
    await evmIncreaseTime(60 * 60 * 24 * 7)
  })

  it('Alice should add again ocean rewards to feeDistrib', async () => {
    // mint 20 ocean and send them to feeDistrib
    let tokenContract = new web3.eth.Contract(minAbi, addresses.Ocean)
    let estGas = await calculateEstimatedGas(
      ownerAccount,
      tokenContract.methods.mint,
      addresses.veFeeDistributor,
      web3.utils.toWei('20')
    )
    await sendTx(
      ownerAccount,
      estGas,
      web3,
      1,
      tokenContract.methods.mint,
      addresses.veFeeDistributor,
      web3.utils.toWei('20')
    )
    const minAbiFee = [
      {
        name: 'checkpoint_token',
        outputs: [],
        inputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
        gas: 820723
      },
      {
        name: 'checkpoint_total_supply',
        outputs: [],
        inputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
        gas: 10592405
      }
    ] as AbiItem[]
    tokenContract = new web3.eth.Contract(minAbiFee, addresses.veFeeDistributor)
    estGas = await calculateEstimatedGas(
      ownerAccount,
      tokenContract.methods.checkpoint_token
    )
    await sendTx(
      ownerAccount,
      estGas,
      web3,
      1,
      tokenContract.methods.checkpoint_token
    )
    estGas = await calculateEstimatedGas(
      ownerAccount,
      tokenContract.methods.checkpoint_total_supply
    )
    await sendTx(
      ownerAccount,
      estGas,
      web3,
      1,
      tokenContract.methods.checkpoint_total_supply
    )
  })

  it('Alice should advance chain 7 day', async () => {
    await evmIncreaseTime(60 * 60 * 24 * 7)
  })

  it('Alice should claim rewards', async () => {
    await veFeeDistributor.claim(Alice)
  })
  it('Alice should withdraw locked tokens', async () => {
    await evmIncreaseTime(60 * 60 * 24 * 7)
    const totalOceanLockedBefore = await getTotalLockedOcean()
    await veOcean.withdraw(Alice)
    await sleep(2000)
    const totalOceanLockedAfter = await getTotalLockedOcean()
    assert(
      parseFloat(totalOceanLockedAfter) < parseFloat(totalOceanLockedBefore),
      'After (' +
        totalOceanLockedAfter +
        ') shold be lower then ' +
        totalOceanLockedBefore
    )
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
    const unlockTime = timestamp + 30 * 86400

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
    await sleep(2000)

    const initialResponse = await fetch(subgraphUrl, {
      method: 'POST',
      body: JSON.stringify(initialQuery)
    })
    await sleep(2000)
    const info = (await initialResponse.json()).data.veOCEANs
    assert(info[0].id === Alice.toLowerCase(), 'ID is incorrect')
    assert(info[0].lockedAmount === currentBalance, 'LockedAmount is incorrect')
    assert(info[0].unlockTime === currentLock, 'Unlock time is not correct')

    const lockTime = await veOcean.lockEnd(Alice)
    const extLockTime = Number(lockTime) + 31556926

    await delegateContract.methods.setApprovalForAll(Alice, true).send({
      from: Alice
    })

    await veOcean.increaseUnlockTime(Alice, extLockTime)

    const initalBoostExpiry = extLockTime - 100000
    let estGas = await calculateEstimatedGas(
      Alice,
      delegateContract.methods.create_boost,
      Alice,
      Bob,
      5000,
      0,
      initalBoostExpiry,
      0
    )

    const tx3 = await sendTx(
      Alice,
      estGas,
      web3,
      1,
      delegateContract.methods.create_boost,
      Alice,
      Bob,
      5000,
      0,
      initalBoostExpiry,
      0
    )

    assert(tx3, 'Transaction failed')
    assert(tx3.events.DelegateBoost, 'No Delegate boost event')
    const tokenId = tx3.events.DelegateBoost.returnValues._token_id
    await evmIncreaseTime(60)
    // extend boost
    estGas = await calculateEstimatedGas(
      Alice,
      delegateContract.methods.extend_boost,
      tokenId,
      10000,
      extLockTime,
      0
    )

    const tx4 = await sendTx(
      Alice,
      estGas,
      web3,
      1,
      delegateContract.methods.extend_boost,
      tokenId,
      10000,
      extLockTime,
      0
    )

    assert(tx4, 'Transaction failed')
    assert(tx4.events.ExtendBoost, 'No ExtendBoost event')
    await evmIncreaseTime(60)
    // burn it
    estGas = await calculateEstimatedGas(
      Alice,
      delegateContract.methods.cancel_boost,
      tokenId
    )

    const tx5 = await sendTx(
      Alice,
      estGas,
      web3,
      1,
      delegateContract.methods.cancel_boost,
      tokenId
    )

    assert(tx5, 'Transaction failed')
    assert(tx5.events.BurnBoost, 'No BurnBoost event')

    await sleep(3000)
    const delegateQuery = {
      query: `query{
        veDelegations(where:{delegator:"${Alice.toLowerCase()}"}){
          id
          delegator {
            id
          }
          receiver{
            id
          }
          amount
          tokenId
          cancelTime
          expireTime
          updates(orderBy:timestamp orderDirection:asc){
            id
            block
            timestamp
            tx
            eventIndex
            sender
            amount
            cancelTime
            expireTime
            type
          }
        }
      }`
    }

    const delegateResponse = await fetch(subgraphUrl, {
      method: 'POST',
      body: JSON.stringify(delegateQuery)
    })
    const resp = await delegateResponse.json()
    const delegations = resp.data.veDelegations

    assert(delegations.length > 0, 'No veDelegations')
    assert(
      delegations[0].tokenId.toLowerCase() ==
        tx3.events.DelegateBoost.returnValues._token_id.toLowerCase(),
      'Invalid tokenID'
    )
    assert(delegations[0].amount == '0', 'Invalid amount, should be 0')
    assert(delegations[0].updates.length > 0, 'No updates')
    // check updates.  first is create boost
    assert(
      delegations[0].updates[0].type == 0,
      'Invalid type. should be createBoost'
    )
    assert(
      delegations[0].updates[0].cancelTime ==
        tx3.events.DelegateBoost.returnValues._cancel_time,
      'Invalid cancelTime'
    )
    assert(
      delegations[0].updates[0].expireTime ==
        tx3.events.DelegateBoost.returnValues._expire_time,
      'Invalid expireTime'
    )
    assert(
      delegations[0].updates[0].amount ==
        tx3.events.DelegateBoost.returnValues._amount,
      'Invalid amount'
    )
    // check extend boos update
    assert(
      delegations[0].updates[1].type == 1,
      'Invalid type. should be extend Boost'
    )
    assert(
      delegations[0].updates[1].cancelTime ==
        tx4.events.ExtendBoost.returnValues._cancel_time,
      'Invalid cancelTime for extend boost'
    )
    assert(
      delegations[0].updates[1].expireTime ==
        tx4.events.ExtendBoost.returnValues._expire_time,
      'Invalid expireTime for extend boost'
    )
    assert(
      delegations[0].updates[1].amount ==
        tx4.events.ExtendBoost.returnValues._amount,
      'Invalid amount for extend boost'
    )
    // check burn
    assert(delegations[0].updates[2].type == 2, 'Invalid type. should be burn')
  })
})
