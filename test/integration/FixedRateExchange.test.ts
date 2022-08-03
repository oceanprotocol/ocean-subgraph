import {
  Erc20CreateParams,
  NftFactory,
  NftCreateData,
  sleep,
  FreCreationParams,
  ZERO_ADDRESS,
  FixedRateExchange
} from '@oceanprotocol/lib'
import { assert } from 'chai'
import Web3 from 'web3'
import { homedir } from 'os'
import fs from 'fs'
import { fetch } from 'cross-fetch'
import { TransactionReceipt } from 'web3-core'

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

describe('Fixed Rate Exchange tests', async () => {
  const nftName = 'test-Fixed-Price-NFT'
  const nftSymbol = 'TST-FIXED'
  const tokenURI = 'https://oceanprotocol.com/nft/fixed'
  const cap = '10000'
  const feeAmount = '0.2'
  const price = '123'
  const publishMarketSwapFee = '0.003'
  let datatokenAddress: string
  let fixedRateAddress: string
  let baseTokenAddress: string
  let marketPlaceFeeAddress: string
  let fixedRateId: string
  let dt
  let Factory: NftFactory
  let factoryAddress: string
  let accounts: string[]
  let publisher: string
  let erc721Address: string
  let nftAddress: string
  let time: number
  let blockNumber: number
  let exchangeContract: string
  let exchangeId: string
  let transactionHash: string
  let fixedRate: FixedRateExchange

  before(async () => {
    factoryAddress = addresses.ERC721Factory.toLowerCase()
    fixedRateAddress = addresses.FixedPrice.toLowerCase()
    baseTokenAddress = addresses.MockDAI.toLowerCase()
    Factory = new NftFactory(factoryAddress, web3)
    accounts = await web3.eth.getAccounts()
    publisher = accounts[0].toLowerCase()
    marketPlaceFeeAddress = accounts[1].toLowerCase()
  })

  it('Deploying a Fixed Rate Exchange & Test NFT Fields', async () => {
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
      templateIndex: 1,
      cap,
      feeAmount,
      paymentCollector: ZERO_ADDRESS,
      feeToken: ZERO_ADDRESS,
      minter: publisher,
      mpFeeAddress: marketPlaceFeeAddress
    }
    const fixedRateParams: FreCreationParams = {
      fixedRateAddress,
      baseTokenAddress,
      owner: publisher,
      marketFeeCollector: marketPlaceFeeAddress,
      baseTokenDecimals: 18,
      datatokenDecimals: 18,
      fixedRate: price,
      marketFee: publishMarketSwapFee,
      allowedConsumer: ZERO_ADDRESS,
      withMint: false
    }

    const result = await Factory.createNftErc20WithFixedRate(
      publisher,
      nftParams,
      erc20Params,
      fixedRateParams
    )
    transactionHash = result.transactionHash.toLowerCase()
    erc721Address = result.events.NFTCreated.returnValues[0]
    datatokenAddress = result.events.TokenCreated.returnValues[0].toLowerCase()

    exchangeContract =
      result.events.NewFixedRate.returnValues.exchangeContract.toLowerCase()
    exchangeId =
      result.events.NewFixedRate.returnValues.exchangeId.toLowerCase()

    fixedRateId = `${exchangeContract}-${exchangeId}`

    // Check NFT values
    await sleep(2000)
    nftAddress = erc721Address.toLowerCase()
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
    await sleep(2000)
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

  it('Test DT Fields after deploying Fixed rate exchange', async () => {
    // Check Datatoken Values
    const dtQuery = {
      query: `query {
        token(id: "${datatokenAddress}"){    
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
    await sleep(2000)
    dt = (await dtResponse.json()).data.token

    const dtTx: TransactionReceipt = await web3.eth.getTransactionReceipt(dt.tx)

    assert(dt.id === datatokenAddress, 'incorrect value for: id')
    assert(dt.symbol, 'incorrect value for: symbol')
    assert(dt.name, 'incorrect value for: name')
    assert(dt.decimals === 18, 'incorrect value for: decimals')
    assert(dt.address === datatokenAddress, 'incorrect value for: address')
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

    assert(dt.templateId === null, 'incorrect value for: templateId')
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

  it('Test fixedRateExchanges Fields', async () => {
    const fixedQuery = {
      query: `query {
        fixedRateExchange(id: "${fixedRateId}"){  
          id
          contract
          exchangeId
          owner {
            id
          }
          datatoken {
            id
          }
          baseToken {
            id
          }
          datatokenSupply
          baseTokenSupply
          datatokenBalance
          baseTokenBalance
          price
          active
          totalSwapValue
          allowedSwapper
          withMint
          isMinter
          updates {
            id
          }
          swaps {
            id
          }
          createdTimestamp
          tx
          block
          publishMarketFeeAddress
          publishMarketSwapFee
        }
      }`
    }
    const fixedResponse = await fetch(subgraphUrl, {
      method: 'POST',
      body: JSON.stringify(fixedQuery)
    })
    await sleep(2000)
    const fixed = (await fixedResponse.json()).data.fixedRateExchange
    const fixedTx: TransactionReceipt = await web3.eth.getTransactionReceipt(
      fixed.tx
    )
    // Test Fixed Rate Exchange Values
    assert(fixed.id === fixedRateId, 'incorrect value for: id')
    assert(fixed.contract === exchangeContract, 'incorrect value for: contract')
    assert(fixed.exchangeId === exchangeId, 'incorrect value for: exchangeId')
    assert(fixed.owner.id === publisher, 'incorrect value for: owner.id')
    assert(
      fixed.datatoken.id === datatokenAddress,
      'incorrect value for: datatoken.id'
    )
    assert(
      fixed.baseToken.id === baseTokenAddress,
      'incorrect value for: baseToken.id'
    )
    assert(
      fixed.datatokenSupply === '0',
      'incorrect value for: datatokenSupply'
    )
    assert(
      fixed.baseTokenSupply === '0',
      'incorrect value for: baseTokenSupply'
    )
    assert(
      fixed.datatokenBalance === '0',
      'incorrect value for: datatokenBalance'
    )
    assert(
      fixed.baseTokenBalance === '0',
      'incorrect value for: baseTokenBalance'
    )
    assert(fixed.price === price, 'incorrect value for: price')
    assert(fixed.active === true, 'incorrect value for: active')
    assert(fixed.totalSwapValue === '0', 'incorrect value for: totalSwapValue')
    assert(
      fixed.allowedSwapper === ZERO_ADDRESS,
      'incorrect value for: allowedSwapper'
    )
    assert(fixed.withMint === null, 'incorrect value for: withMint')
    assert(fixed.isMinter === null, 'incorrect value for: isMinter')
    assert(fixed.updates, 'incorrect value for: updates.id')
    assert(fixed.swaps, 'incorrect value for: swaps')
    assert(
      fixed.createdTimestamp >= time,
      'incorrect value for: createdTimestamp'
    )
    assert(
      fixed.createdTimestamp < time + 5,
      'incorrect value for: createdTimestamp'
    )
    assert(fixed.tx === transactionHash, 'incorrect value for: tx')
    assert(fixed.block >= blockNumber, 'incorrect value for: block')
    assert(fixed.block < blockNumber + 50, 'incorrect value for: block')
    assert(
      fixed.publishMarketFeeAddress === marketPlaceFeeAddress,
      'incorrect value for: publishMarketFeeAddress'
    )
    assert(
      fixed.publishMarketSwapFee === publishMarketSwapFee,
      'incorrect value for: publishMarketSwapFee'
    )
    assert(fixedTx.from === publisher, 'incorrect value for: tx')
    assert(fixedTx.to === factoryAddress, 'incorrect value for: tx')
  })

  it('Update Fixed Rate Price', async () => {
    fixedRate = new FixedRateExchange(web3, fixedRateAddress, 8996)
    const priceQuery = {
      query: `query {fixedRateExchange(id: "${fixedRateId}"){price}}`
    }

    // Check initial price
    const priceResponse1 = await fetch(subgraphUrl, {
      method: 'POST',
      body: JSON.stringify(priceQuery)
    })
    await sleep(2000)
    const price1 = (await priceResponse1.json()).data.fixedRateExchange.price
    assert(price1 === price, 'incorrect value for: price 1')

    // Update price
    await fixedRate.setRate(publisher, exchangeId, '999')
    await sleep(2000)

    // Check price after first update
    const priceResponse2 = await fetch(subgraphUrl, {
      method: 'POST',
      body: JSON.stringify(priceQuery)
    })
    await sleep(2000)
    const price2 = (await priceResponse2.json()).data.fixedRateExchange.price
    assert(price2 === '999', 'incorrect value for: price 2')

    // Update price a 2nd time
    await fixedRate.setRate(publisher, exchangeId, '5.123')
    await sleep(2000)

    // Check price after 2nd update
    const priceResponse3 = await fetch(subgraphUrl, {
      method: 'POST',
      body: JSON.stringify(priceQuery)
    })
    await sleep(2000)
    const price3 = (await priceResponse3.json()).data.fixedRateExchange.price

    assert(price3 === '5.123', 'incorrect value for: price 3')
  })
})
