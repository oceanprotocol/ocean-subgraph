import {
  DatatokenCreateParams,
  NftFactory,
  NftCreateData,
  sleep,
  ZERO_ADDRESS,
  Dispenser,
  Datatoken,
  DispenserParams
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
  const dispenserAddress = addresses.Dispenser.toLowerCase()
  let dtAddress: string
  let marketPlaceFeeAddress: string
  let dt
  let Factory: NftFactory
  let factoryAddress: string
  let accounts: string[]
  let publisher: string
  let nftAddress: string
  let time: number
  let blockNumber: number
  let dispenser: Dispenser
  let dispenserId: string
  let datatoken: Datatoken
  let user1: string
  let user2: string

  before(async () => {
    factoryAddress = addresses.ERC721Factory.toLowerCase()
    Factory = new NftFactory(factoryAddress, web3)
    accounts = await web3.eth.getAccounts()
    publisher = accounts[0].toLowerCase()
    marketPlaceFeeAddress = accounts[1].toLowerCase()
    user1 = accounts[2].toLowerCase()
    user2 = accounts[3].toLowerCase()
  })

  it('should initialize Dispenser and datatoken class', async () => {
    dispenser = new Dispenser(
      addresses.Dispenser,
      web3,
      8996,
      null,
      DispenserTemplate.abi as AbiItem[]
    )
    assert(dispenser.getDefaultAbi() !== null)

    datatoken = new Datatoken(web3, 8996, null, ERC20Template.abi as AbiItem[])
    assert(datatoken.getDefaultAbi() !== null)
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
    const erc20Params: DatatokenCreateParams = {
      templateIndex,
      cap,
      feeAmount,
      paymentCollector: ZERO_ADDRESS,
      feeToken: ZERO_ADDRESS,
      minter: publisher,
      mpFeeAddress: marketPlaceFeeAddress
    }

    const tx = await Factory.createNftWithDatatoken(
      publisher,
      nftParams,
      erc20Params
    )
    const nftTemplate = await Factory.getNFTTemplate(nftParams.templateIndex)
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
                  owner{id},
                  creator{id},
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
                  eventIndex,
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
    assert(nft.owner.id === publisher, 'incorrect value for: owner')
    assert(nft.creator.id === publisher, 'incorrect value for: creator')
    assert(nft.managerRole[0] === publisher, 'incorrect value for: managerRole')
    assert(
      nft.erc20DeployerRole[0] === factoryAddress,
      'incorrect value for: erc20DeployerRole'
    )
    assert(nft.storeUpdateRole === null, 'incorrect value for: storeUpdateRole')
    assert(nft.metadataRole === null, 'incorrect value for: metadataRole')
    assert(
      nft.template === nftTemplate.templateAddress.toLowerCase(),
      'incorrect value for: template'
    )
    assert(nft.transferable === true, 'incorrect value for: transferable')
    assert(nft.createdTimestamp >= time, 'incorrect value: createdTimestamp')
    assert(nft.createdTimestamp < time + 5, 'incorrect value: createdTimestamp')
    assert(nftTx.from === publisher, 'incorrect value for: tx')
    assert(nftTx.to === factoryAddress, 'incorrect value for: tx')
    assert(nftTx.blockNumber >= blockNumber, 'incorrect value for: tx')
    assert(nft.block >= blockNumber, 'incorrect value for: block')
    assert(nft.block < blockNumber + 50, 'incorrect value for: block')
    assert(nft.orderCount === '0', 'incorrect value for: orderCount')
    assert(
      nft.eventIndex !== null && nft.eventIndex > 0,
      'Invalid eventIndex for NFT creation'
    )
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
            eventIndex,
            block,
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

    assert(
      parseInt(dt.templateId) === templateIndex,
      'incorrect value for: templateId'
    )
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
    assert(dt.lastPriceValue === '0', 'incorrect value for: lastPriceValue')
    assert(
      dt.eventIndex !== null && dt.eventIndex > 0,
      'incorrect value for: eventIndex'
    )
  })

  it('Make user1 minter', async () => {
    await datatoken.addMinter(dtAddress, publisher, user1)

    assert((await datatoken.getPermissions(dtAddress, user1)).minter === true)
    await sleep(sleepMs)
    const minterQuery = {
      query: `query {token(id: "${dtAddress}"){minter{id}, eventIndex}}`
    }

    const minterResponse = await fetch(subgraphUrl, {
      method: 'POST',
      body: JSON.stringify(minterQuery)
    })
    const dt = (await minterResponse.json()).data.token
    assert(dt.minter[1] === user1, 'incorrect value for: minter')
    assert(dt.eventIndex !== null, 'incorrect value for: eventIndex')
  })

  it('Create dispenser', async () => {
    const maxTokens = '921'
    const maxBalance = '9032'
    const dispenserParams: DispenserParams = {
      maxTokens,
      maxBalance,
      withMint: true
    }
    const tx = (
      await datatoken.createDispenser(
        dtAddress,
        publisher,
        dispenserAddress,
        dispenserParams
      )
    ).events.NewDispenser
    await sleep(sleepMs)
    assert(tx, 'Cannot create dispenser')
    dispenserId = `${dispenserAddress}-${dtAddress}`

    const dispenserQuery = {
      query: `query {dispenser(id: "${dispenserId}"){
            id
            contract
            active
            owner
            token {
              id
            }
            allowedSwapper
            isMinter
            maxTokens
            maxBalance
            balance
            block
            createdTimestamp
            tx
            eventIndex
            dispenses {
              id
            }
            __typename
        }}`
    }
    const graphResponse = await fetch(subgraphUrl, {
      method: 'POST',
      body: JSON.stringify(dispenserQuery)
    })
    const response = (await graphResponse.json()).data.dispenser

    assert(response.id === dispenserId, 'incorrect value for: id')
    assert(response.contract === dispenserAddress, 'incorrect value: contract')
    assert(response.active === true, 'incorrect value for: active')
    assert(response.owner === publisher, 'incorrect value for: owner')
    assert(response.token.id === dtAddress, 'incorrect value for: token.id')
    assert(response.allowedSwapper === ZERO_ADDRESS, 'incorrect allowedSwapper')
    assert(response.isMinter === true, 'incorrect value for: isMinter')
    assert(response.maxTokens === web3.utils.fromWei(maxTokens), 'maxTokens')
    assert(response.maxBalance === web3.utils.fromWei(maxBalance), 'maxBalance')
    assert(response.balance === '0', 'maxBalance')
    assert(response.block === tx.blockNumber, 'wrong block')
    assert(response.createdTimestamp >= time, 'incorrect: createdTimestamp')
    assert(response.createdTimestamp < time + 15, 'incorrect: createdTimestamp')
    assert(response.tx === tx.transactionHash, 'incorrect value for: tx')
    assert(
      response.eventIndex !== null && response.eventIndex > 0,
      'incorrect value for: eventIndex'
    )
    assert(response.dispenses.length === 0, 'incorrect value for: dispenses')
    assert(response.__typename === 'Dispenser', 'incorrect value: __typename')
  })

  it('Deactivates dispenser', async () => {
    const deactiveQuery = {
      query: `query {dispenser(id: "${dispenserId}"){active, eventIndex}}`
    }

    const initialResponse = await fetch(subgraphUrl, {
      method: 'POST',
      body: JSON.stringify(deactiveQuery)
    })
    const initialActive = (await initialResponse.json()).data.dispenser.active
    assert(initialActive === true, 'incorrect value for: initialActive')

    // Deactivate exchange
    const tx = await dispenser.deactivate(dtAddress, publisher)
    const status = await dispenser.status(dtAddress)
    assert(status.active === false, 'Dispenser is still active')
    await sleep(sleepMs)
    // Check the updated value for active
    const updatedResponse = await fetch(subgraphUrl, {
      method: 'POST',
      body: JSON.stringify(deactiveQuery)
    })
    const updatedActive = (await updatedResponse.json()).data.dispenser
    assert(updatedActive.active === false, 'incorrect value for: updatedActive')
    assert(updatedActive.eventIndex !== null, 'incorrect value for: eventIndex')
    assert(
      updatedActive.eventIndex === tx.events.DispenserDeactivated.logIndex,
      'incorrect value for: eventIndex'
    )
  })

  it('Activates dispenser', async () => {
    const activeQuery = {
      query: `query {dispenser(id: "${dispenserId}"){active, eventIndex}}`
    }
    const initialResponse = await fetch(subgraphUrl, {
      method: 'POST',
      body: JSON.stringify(activeQuery)
    })
    const initialActive = (await initialResponse.json()).data.dispenser
    assert(initialActive.active === false, 'incorrect value for: initialActive')
    assert(initialActive.eventIndex !== null, 'incorrect value for: eventIndex')

    // Activate dispenser
    const tx = await dispenser.activate(dtAddress, '100', '100', publisher)
    await sleep(sleepMs)

    // Check the updated value for active
    const updatedResponse = await fetch(subgraphUrl, {
      method: 'POST',
      body: JSON.stringify(activeQuery)
    })
    const updatedActive = (await updatedResponse.json()).data.dispenser
    assert(updatedActive.active === true, 'incorrect value for: updatedActive')
    assert(updatedActive.eventIndex !== null, 'incorrect value for: eventIndex')
    assert(
      updatedActive.eventIndex === tx.events.DispenserActivated.logIndex,
      'incorrect value for: eventIndex'
    )
  })

  it('User2 gets datatokens from the dispenser', async () => {
    const amount = '3'
    const dispenseQuery = {
      query: `query {dispenser(id: "${dispenserId}"){
        dispenses{
          id
          dispenser{id}
          user {id}
          amount
          block
          createdTimestamp
          tx
          eventIndex
          __typename
        }}}`
    }
    // Check initial values before dispense
    const response1 = await fetch(subgraphUrl, {
      method: 'POST',
      body: JSON.stringify(dispenseQuery)
    })
    await sleep(sleepMs)
    const before = (await response1.json()).data.dispenser.dispenses
    assert(before.length === 0, 'incorrect value for: dispenses')

    const tx = await dispenser.dispense(dtAddress, user2, amount, user2)
    await sleep(sleepMs)

    // Check values after dispense
    const response2 = await fetch(subgraphUrl, {
      method: 'POST',
      body: JSON.stringify(dispenseQuery)
    })
    const dispense = (await response2.json()).data.dispenser.dispenses[0]

    assert(
      dispense.id ===
        `${
          tx.transactionHash
        }-${dispenserId}-${tx.events.TokensDispensed.logIndex.toFixed(1)}`,
      'wrong id'
    )
    assert(dispense.dispenser.id === dispenserId, 'incorrect value for: user')
    assert(dispense.user.id === user2, 'incorrect value for: user')
    assert(dispense.amount === amount, 'incorrect value for: user')
    assert(dispense.block === tx.blockNumber, 'incorrect value for: block')
    assert(dispense.createdTimestamp >= time, 'incorrect: createdTimestamp')
    assert(dispense.createdTimestamp < time + 15, 'incorrect: createdTimestamp')
    assert(dispense.tx === tx.transactionHash, 'incorrect value for: tx')
    assert(dispense.eventIndex !== null, 'incorrect value for: eventIndex')
    assert(dispense.__typename === 'DispenserTransaction', 'wrong __typename')
  })

  it('Owner withdraws all of the datatokens', async () => {
    await dispenser.ownerWithdraw(dtAddress, publisher)
    await sleep(sleepMs)

    // Check balance after owner withdraw
    const balanceQuery = {
      query: `query {dispenser(id: "${dispenserId}"){balance, eventIndex}}`
    }

    const response = await fetch(subgraphUrl, {
      method: 'POST',
      body: JSON.stringify(balanceQuery)
    })
    const balance = (await response.json()).data.dispenser
    assert(balance.balance === '0', 'incorrect value for: balance')
    assert(balance.eventIndex !== null, 'incorrect value for: eventIndex')
  })

  it('Updates allowed swapper', async () => {
    const swapperQuery = {
      query: `query {dispenser(id: "${dispenserId}"){allowedSwapper, eventIndex}}`
    }
    // Check initial allowedSwapper
    const swapperResponse1 = await fetch(subgraphUrl, {
      method: 'POST',
      body: JSON.stringify(swapperQuery)
    })
    const allowedSwapper1 = (await swapperResponse1.json()).data.dispenser
      .allowedSwapper
    assert(
      allowedSwapper1 === ZERO_ADDRESS,
      'incorrect value for: allowedSwapper'
    )

    const tx = await dispenser.setAllowedSwapper(dtAddress, publisher, user1)
    await sleep(sleepMs)

    const swapperResponse2 = await fetch(subgraphUrl, {
      method: 'POST',
      body: JSON.stringify(swapperQuery)
    })
    const allowedSwapper2 = (await swapperResponse2.json()).data.dispenser

    assert(
      allowedSwapper2.allowedSwapper === user1,
      'incorrect value for: allowedSwapper 2'
    )
    assert(
      allowedSwapper2.eventIndex !== null &&
        allowedSwapper2.eventIndex ===
          tx.events.DispenserAllowedSwapperChanged.logIndex,
      'incorrect value for: eventIndex'
    )
  })
})
