import {
  Erc20CreateParams,
  NftFactory,
  NftCreateData,
  sleep,
  ZERO_ADDRESS,
  Dispenser,
  Datatoken
} from '@oceanprotocol/lib'
import DispenserTemplate from '@oceanprotocol/contracts/artifacts/contracts/pools/dispenser/Dispenser.sol/Dispenser.json'
import ERC20Template from '@oceanprotocol/contracts/artifacts/contracts/templates/ERC20Template.sol/ERC20Template.json'
import { assert } from 'chai'
import Web3 from 'web3'
import { homedir } from 'os'
import fs from 'fs'
import { fetch } from 'cross-fetch'
import { TransactionReceipt } from 'web3-core'
import { AbiItem } from 'web3-utils/types'

const sleepMs = 1800

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

describe('Dispenser tests', async () => {
  const nftName = 'test-Fixed-Price-NFT'
  const nftSymbol = 'TST-FIXED'
  const tokenURI = 'https://oceanprotocol.com/nft/fixed'
  const cap = '10000'
  const feeAmount = '0.2'
  const templateIndex = 1
  let dtAddress: string
  let marketPlaceFeeAddress: string
  let fixedRateId: string
  let dt
  let Factory: NftFactory
  let factoryAddress: string
  let accounts: string[]
  let publisher: string
  let nftAddress: string
  let time: number
  let blockNumber: number
  let exchangeId: string
  let dispenser: Dispenser
  let datatoken: Datatoken
  let user1: string

  before(async () => {
    factoryAddress = addresses.ERC721Factory.toLowerCase()
    Factory = new NftFactory(factoryAddress, web3)
    accounts = await web3.eth.getAccounts()
    publisher = accounts[0].toLowerCase()
    marketPlaceFeeAddress = accounts[1].toLowerCase()
    user1 = accounts[2].toLowerCase()
  })

  it('should initialize Dispenser and datatoken class', async () => {
    dispenser = new Dispenser(
      web3,
      8996,
      addresses.dispenserAddress,
      DispenserTemplate.abi as AbiItem[]
    )
    assert(dispenser !== null)

    datatoken = new Datatoken(web3, 8996, ERC20Template.abi as AbiItem[])
    assert(datatoken !== null)
  })

  it('Deploying an NFT with ERC20', async () => {
    const date = new Date()
    time = Math.floor(date.getTime() / 1000)
    blockNumber = await web3.eth.getBlockNumber()

    const nftParams: NftCreateData = {
      name: nftName,
      symbol: nftSymbol,
      templateIndex: 1,
      tokenURI,
      transferable: true,
      owner: publisher
    }
    const erc20Params: Erc20CreateParams = {
      templateIndex,
      cap,
      feeAmount,
      paymentCollector: ZERO_ADDRESS,
      feeToken: ZERO_ADDRESS,
      minter: publisher,
      mpFeeAddress: marketPlaceFeeAddress
    }

    const tx = await Factory.createNftWithErc20(
      publisher,
      nftParams,
      erc20Params
    )
    assert(tx.events.NFTCreated.event === 'NFTCreated')
    assert(tx.events.TokenCreated.event === 'TokenCreated')
    nftAddress = tx.events.NFTCreated.returnValues.newTokenAddress.toLowerCase()
    dtAddress =
      tx.events.TokenCreated.returnValues.newTokenAddress.toLowerCase()

    // Check NFT values
    await sleep(sleepMs)
    const nftQuery = {
      query: `query {
                nft(id:"${nftAddress}"){    
                  id,
                  symbol,
                  name,
                  tokenUri,
                  owner,
                  creator,
                  address,
                  providerUrl,
                  assetState,
                  managerRole,
                  erc20DeployerRole,
                  storeUpdateRole,
                  metadataRole,
                  template,
                  transferable,
                  createdTimestamp,
                  tx,
                  block,
                  orderCount}}`
    }
    const initialResponse = await fetch(subgraphUrl, {
      method: 'POST',
      body: JSON.stringify(nftQuery)
    })
    const nft = (await initialResponse.json()).data.nft
    const nftTx: TransactionReceipt = await web3.eth.getTransactionReceipt(
      nft.tx
    )
    assert(nft.id === nftAddress, 'incorrect value for: id')
    assert(nft.symbol === nftSymbol, 'incorrect value for: symbol')
    assert(nft.name === nftName, 'incorrect value for: name')
    assert(nft.tokenUri === tokenURI, 'incorrect value for: tokenUri')
    assert(nft.owner === publisher, 'incorrect value for: owner')
    assert(nft.creator === publisher, 'incorrect value for: creator')
    assert(nft.managerRole[0] === publisher, 'incorrect value for: managerRole')
    assert(
      nft.erc20DeployerRole[0] === factoryAddress,
      'incorrect value for: erc20DeployerRole'
    )
    assert(nft.storeUpdateRole === null, 'incorrect value for: storeUpdateRole')
    assert(nft.metadataRole === null, 'incorrect value for: metadataRole')
    assert(nft.template === '', 'incorrect value for: template')
    assert(nft.transferable === true, 'incorrect value for: transferable')
    assert(
      nft.createdTimestamp >= time,
      'incorrect value for: createdTimestamp'
    )
    assert(
      nft.createdTimestamp < time + 5,
      'incorrect value for: createdTimestamp'
    )
    assert(nftTx.from === publisher, 'incorrect value for: tx')
    assert(nftTx.to === factoryAddress, 'incorrect value for: tx')
    assert(nftTx.blockNumber >= blockNumber, 'incorrect value for: tx')
    assert(nft.block >= blockNumber, 'incorrect value for: block')
    assert(nft.block < blockNumber + 50, 'incorrect value for: block')
    assert(nft.orderCount === '0', 'incorrect value for: orderCount')
  })

  it('Test all DT Fields after deploying', async () => {
    // Check Datatoken Values
    const dtQuery = {
      query: `query {
          token(id: "${dtAddress}"){    
            id,
            symbol,
            name,
            decimals,
            address,
            cap,
            supply,
            isDatatoken,
            nft {id},
            minter,
            paymentManager,
            paymentCollector,
            publishMarketFeeAddress,
            publishMarketFeeAmount,
            templateId,
            holderCount,
            orderCount,
            orders {id},
            fixedRateExchanges {id},
            dispensers {id},
            createdTimestamp,
            tx,
            block,
            lastPriceToken,
            lastPriceValue
          }}`
    }
    const dtResponse = await fetch(subgraphUrl, {
      method: 'POST',
      body: JSON.stringify(dtQuery)
    })
    dt = (await dtResponse.json()).data.token

    const dtTx: TransactionReceipt = await web3.eth.getTransactionReceipt(dt.tx)

    assert(dt.id === dtAddress, 'incorrect value for: id')
    assert(dt.symbol, 'incorrect value for: symbol')
    assert(dt.name, 'incorrect value for: name')
    assert(dt.decimals === 18, 'incorrect value for: decimals')
    assert(dt.address === dtAddress, 'incorrect value for: address')
    assert(dt.cap === cap, 'incorrect value for: cap')
    assert(dt.supply === '0', 'incorrect value for: supply')
    assert(dt.isDatatoken === true, 'incorrect value for: isDatatoken')
    assert(dt.nft.id === nftAddress, 'incorrect value for: nft.id')
    assert(dt.minter[0] === publisher, 'incorrect value for: minter')
    assert(dt.paymentManager === null, 'incorrect value for: paymentManager')
    assert(
      dt.paymentCollector === null,
      'incorrect value for: paymentCollector'
    )
    assert(
      dt.publishMarketFeeAddress === marketPlaceFeeAddress,
      'incorrect value for: publishMarketFeeAddress'
    )
    assert(
      dt.publishMarketFeeAmount === feeAmount,
      'incorrect value for: publishMarketFeeAmount'
    )

    assert(dt.templateId === templateIndex, 'incorrect value for: templateId')
    assert(dt.holderCount === '0', 'incorrect value for: holderCount')
    assert(dt.orderCount === '0', 'incorrect value for: orderCount')
    assert(dt.orders, 'incorrect value for: orders')
    assert(dt.fixedRateExchanges, 'incorrect value for: fixedRateExchanges')
    assert(dt.dispensers, 'incorrect value for: dispensers')
    assert(dt.createdTimestamp >= time, 'incorrect value for: createdTimestamp')
    assert(
      dt.createdTimestamp < time + 5,
      'incorrect value for: createdTimestamp'
    )
    assert(dtTx.from === publisher, 'incorrect value for: tx')
    assert(dtTx.to === factoryAddress, 'incorrect value for: tx')
    assert(dtTx.blockNumber >= blockNumber, 'incorrect value for: tx')
    assert(dt.block >= blockNumber, 'incorrect value for: block')
    assert(dt.block < blockNumber + 50, 'incorrect value for: block')
    assert(
      dt.lastPriceToken === '0x0000000000000000000000000000000000000000',
      'incorrect value for: lastPriceToken'
    )
    assert(dt.lastPriceValue === '0', 'incorrect value for: lastPriceValue')
  })

  it('Make user1 minter', async () => {
    await datatoken.addMinter(dtAddress, publisher, user1)

    assert((await datatoken.getDTPermissions(dtAddress, user1)).minter === true)
    await sleep(sleepMs)
    const minterQuery = {
      query: `query {token(id: "${dtAddress}"){minter{id}}}`
    }
    console.log('minterQuery', minterQuery)
    const minterResponse = await fetch(subgraphUrl, {
      method: 'POST',
      body: JSON.stringify(minterQuery)
    })
    const minter = (await minterResponse.json()).data.token.minter
    assert(minter[1] === user1, 'incorrect value for: minter')
  })

  it('Deactivates exchange', async () => {
    const deactiveQuery = {
      query: `query {fixedRateExchange(id: "${fixedRateId}"){active}}`
    }

    const initialResponse = await fetch(subgraphUrl, {
      method: 'POST',
      body: JSON.stringify(deactiveQuery)
    })
    const initialActive = (await initialResponse.json()).data.fixedRateExchange
      .active
    assert(initialActive === true, 'incorrect value for: initialActive')

    // Deactivate exchange
    await dispenser.deactivate(publisher, exchangeId)
    await sleep(sleepMs)

    // Check the updated value for active
    const updatedResponse = await fetch(subgraphUrl, {
      method: 'POST',
      body: JSON.stringify(deactiveQuery)
    })
    const updatedActive = (await updatedResponse.json()).data.fixedRateExchange
      .active
    assert(updatedActive === false, 'incorrect value for: updatedActive')
  })

  it('Activates exchange', async () => {
    const activeQuery = {
      query: `query {fixedRateExchange(id: "${fixedRateId}"){active}}`
    }
    const initialResponse = await fetch(subgraphUrl, {
      method: 'POST',
      body: JSON.stringify(activeQuery)
    })
    const initialActive = (await initialResponse.json()).data.fixedRateExchange
      .active
    assert(initialActive === false, 'incorrect value for: initialActive')

    // Activate exchange
    await dispenser.activate(dtAddress, '100', '100', publisher)
    await sleep(sleepMs)

    // Check the updated value for active
    const updatedResponse = await fetch(subgraphUrl, {
      method: 'POST',
      body: JSON.stringify(activeQuery)
    })
    const updatedActive = (await updatedResponse.json()).data.fixedRateExchange
      .active
    assert(updatedActive === true, 'incorrect value for: updatedActive')
  })

  //   it('User1 buys a datatoken', async () => {
  //     const swapsQuery = {
  //       query: `query {fixedRateExchange(id: "${fixedRateId}"){
  //           swaps{
  //             id
  //             exchangeId{id}
  //             by{id}
  //             baseTokenAmount
  //             dataTokenAmount
  //             block
  //             createdTimestamp
  //             tx
  //             __typename
  //           }
  //         }}`
  //     }
  //     // Check initial swaps
  //     const initialResponse = await fetch(subgraphUrl, {
  //       method: 'POST',
  //       body: JSON.stringify(swapsQuery)
  //     })
  //     const initialSwaps = (await initialResponse.json()).data.fixedRateExchange
  //       .swaps
  //     assert(initialSwaps.length === 0, 'incorrect value for: initialSwaps')

  //     const datatoken = new Datatoken(web3, 8996)
  //     // Mint datatokens as initial supply is 0
  //     await datatoken.mint(dtAddress, publisher, '100')
  //     await datatoken.approve(dtAddress, fixedRateAddress, '100', publisher)

  //     const daiContract = new web3.eth.Contract(
  //       MockERC20.abi as AbiItem[],
  //       addresses.MockDAI
  //     )
  //     // user1 need DAI so that they can buy the datatoken
  //     await daiContract.methods
  //       .transfer(user1, web3.utils.toWei('100'))
  //       .send({ from: publisher })
  //     await daiContract.methods
  //       .approve(fixedRateAddress, web3.utils.toWei('10000000'))
  //       .send({ from: user1 })

  //     // user1 has no DTs before buying one
  //     let user1Balance = await datatoken.balance(dtAddress, user1)
  //     assert(user1Balance === '0', 'incorrect value for: user1Balance')

  //     const tx = (await dispenser.(user1, exchangeId, dtAmount, '100'))
  //       .events?.Swapped
  //     await sleep(sleepMs)
  //     user1Balance = await datatoken.balance(dtAddress, user1)
  //     // user1 has 1 datatoken
  //     assert(user1Balance === dtAmount, 'incorrect value for: user1Balance')

  //     // Check updated swaps
  //     const updatedResponse = await fetch(subgraphUrl, {
  //       method: 'POST',
  //       body: JSON.stringify(swapsQuery)
  //     })
  //     const swaps = (await updatedResponse.json()).data.fixedRateExchange.swaps[0]
  //     const swappedAmount = web3.utils.fromWei(
  //       new BN(tx.returnValues.baseTokenSwappedAmount)
  //     )
  //     assert(swaps.id === `${tx.transactionHash}-${fixedRateId}`, 'incorrect: id')
  //     assert(swaps.exchangeId.id === fixedRateId, 'incorrect: exchangeId')
  //     assert(swaps.by.id === user1, 'incorrect value for: id')
  //     assert(swaps.baseTokenAmount === swappedAmount, 'incorrect baseTokenAmount')
  //     assert(swaps.dataTokenAmount === dtAmount, 'incorrect: dataTokenAmount')
  //     assert(swaps.block === tx.blockNumber, 'incorrect value for: block')
  //     assert(swaps.createdTimestamp >= time, 'incorrect: createdTimestamp')
  //     assert(swaps.createdTimestamp < time + 25, 'incorrect: createdTimestamp 2')
  //     assert(swaps.tx === tx.transactionHash, 'incorrect value for: tx')
  //     assert(swaps.__typename === 'FixedRateExchangeSwap', 'incorrect __typename')
  //   })
  //   it('User1 sells a datatoken', async () => {
  //     await datatoken.approve(dtAddress, fixedRateAddress, dtAmount, user1)
  //     const tx = (await fixedRate.sellDT(user1, exchangeId, '10', '9')).events
  //       ?.Swapped
  //     assert(tx != null)
  //     await sleep(sleepMs)
  //     const swapsQuery = {
  //       query: `query {fixedRateExchange(id: "${fixedRateId}"){
  //           swaps(orderBy: createdTimestamp, orderDirection: desc){
  //             id
  //             exchangeId{id}
  //             by{id}
  //             baseTokenAmount
  //             dataTokenAmount
  //             block
  //             createdTimestamp
  //             tx
  //             __typename
  //           }
  //         }}`
  //     }
  //     // Check initial swaps
  //     const response = await fetch(subgraphUrl, {
  //       method: 'POST',
  //       body: JSON.stringify(swapsQuery)
  //     })
  //     const swaps = (await response.json()).data.fixedRateExchange.swaps[0]
  //     const swappedAmount = web3.utils.fromWei(
  //       new BN(tx.returnValues.baseTokenSwappedAmount)
  //     )
  //     assert(swaps.id === `${tx.transactionHash}-${fixedRateId}`, 'incorrect: id')
  //     assert(swaps.exchangeId.id === fixedRateId, 'incorrect: exchangeId')
  //     assert(swaps.by.id === user1, 'incorrect value for: id')
  //     assert(swaps.baseTokenAmount === swappedAmount, 'incorrect baseTokenAmount')
  //     assert(swaps.dataTokenAmount === dtAmount, 'incorrect: dataTokenAmount')
  //     assert(swaps.block === tx.blockNumber, 'incorrect value for: block')
  //     assert(swaps.createdTimestamp >= time, 'incorrect: createdTimestamp')
  //     assert(swaps.createdTimestamp < time + 25, 'incorrect: createdTimestamp 2')
  //     assert(swaps.tx === tx.transactionHash, 'incorrect value for: tx')
  //     assert(swaps.__typename === 'FixedRateExchangeSwap', 'incorrect __typename')
  //   })

  it('Updates allowed swapper', async () => {
    const swapperQuery = {
      query: `query {fixedRateExchange(id: "${fixedRateId}"){allowedSwapper}}`
    }
    // Check initial allowedSwapper
    const swapperResponse1 = await fetch(subgraphUrl, {
      method: 'POST',
      body: JSON.stringify(swapperQuery)
    })
    const allowedSwapper1 = (await swapperResponse1.json()).data
      .fixedRateExchange.allowedSwapper
    assert(
      allowedSwapper1 === ZERO_ADDRESS,
      'incorrect value for: allowedSwapper'
    )

    await dispenser.setAllowedSwapper(publisher, exchangeId, user1)
    await sleep(sleepMs)

    const swapperResponse2 = await fetch(subgraphUrl, {
      method: 'POST',
      body: JSON.stringify(swapperQuery)
    })
    const allowedSwapper2 = (await swapperResponse2.json()).data
      .fixedRateExchange.allowedSwapper

    assert(allowedSwapper2 === user1, 'incorrect value for: allowedSwapper 2')
  })
})
