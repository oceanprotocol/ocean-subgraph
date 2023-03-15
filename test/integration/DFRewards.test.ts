import { NftFactory, sleep, Datatoken, DfRewards } from '@oceanprotocol/lib'
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
// const aquarius = new Aquarius('http://127.0.0.1:5000')
const web3 = new Web3('http://127.0.0.1:8545')

const subgraphUrl =
  'http://127.0.0.1:9000/subgraphs/name/oceanprotocol/ocean-subgraph'

describe('DFRewards tests', async () => {
  const nftName = 'testNFT'
  const nftSymbol = 'TST'
  const marketPlaceFeeAddress = '0x1230000000000000000000000000000000000000'
  const feeToken = '0x3210000000000000000000000000000000000000'
  const publishMarketFeeAmount = '0.1'
  const cap = '10000'
  const templateIndex = 1
  let datatokenAddress1: string
  let datatokenAddress2: string
  let dataToken: Datatoken
  let Factory: NftFactory
  let factoryAddress: string
  let accounts: string[]
  let publisher: string
  let dfRewards: DfRewards
  let user1: string
  let user2: string

  before(async () => {
    factoryAddress = addresses.ERC721Factory.toLowerCase()
    Factory = new NftFactory(factoryAddress, web3)
    accounts = await web3.eth.getAccounts()
    dataToken = new Datatoken(web3)
    dfRewards = new DfRewards(addresses.DFRewards, web3)
    publisher = accounts[0].toLowerCase()
    user1 = accounts[1].toLowerCase()
    user2 = accounts[2].toLowerCase()
  })

  it('should publish two datatokens', async () => {
    let result = await Factory.createNftWithDatatoken(
      publisher,
      {
        name: nftName,
        symbol: nftSymbol,
        templateIndex,
        tokenURI: '',
        transferable: true,
        owner: publisher
      },
      {
        templateIndex,
        cap,
        feeAmount: publishMarketFeeAmount,
        paymentCollector: '0x0000000000000000000000000000000000000000',
        feeToken,
        minter: publisher,
        mpFeeAddress: marketPlaceFeeAddress,
        name: 'DT1',
        symbol: 'DT1'
      }
    )
    datatokenAddress1 = result.events.TokenCreated.returnValues[0].toLowerCase()

    result = await Factory.createNftWithDatatoken(
      publisher,
      {
        name: nftName,
        symbol: nftSymbol,
        templateIndex,
        tokenURI: '',
        transferable: true,
        owner: publisher
      },
      {
        templateIndex,
        cap,
        feeAmount: publishMarketFeeAmount,
        paymentCollector: '0x0000000000000000000000000000000000000000',
        feeToken,
        minter: publisher,
        mpFeeAddress: marketPlaceFeeAddress,
        name: 'DT2',
        symbol: 'DT2'
      }
    )
    datatokenAddress2 = result.events.TokenCreated.returnValues[0].toLowerCase()
  })

  it('should top-up DF Rewards', async () => {
    // mint tokens
    await dataToken.mint(datatokenAddress1, publisher, '1000')
    await dataToken.mint(datatokenAddress2, publisher, '1000')
    // approve
    await dataToken.approve(
      datatokenAddress1,
      addresses.DFRewards,
      '1000',
      publisher
    )
    await dataToken.approve(
      datatokenAddress2,
      addresses.DFRewards,
      '1000',
      publisher
    )

    // top-up DF Rewards
    const tx = await dfRewards.allocateRewards(
      publisher,
      [user1, user2],
      ['100', '200'],
      datatokenAddress1
    )
    const user1Balance = await dfRewards.getAvailableRewards(
      user1,
      datatokenAddress1
    )
    // check subgraph
    await sleep(2000)
    const initialQuery = {
      query: `query {
        dfrewards(where: {id:"${user1.toLowerCase()}"}){
            id
            receiver {
              id
            }
            availableClaims(where: {token:"${datatokenAddress1.toLowerCase()}"}){
              id
              receiver {
                id
              }
              amount
              token {
                id
              }
            }
            history(orderBy:timestamp,orderDirection:desc){
              id
              receiver {
                id
              }
              amount
              token {
                id
              }
              type
              tx
              eventIndex
            }
          }        
                }`
    }
    const initialResponse = await fetch(subgraphUrl, {
      method: 'POST',
      body: JSON.stringify(initialQuery)
    })
    const info = (await initialResponse.json()).data.dfrewards
    assert(info[0].receiver.id === user1.toLowerCase())
    assert(String(info[0].availableClaims[0].amount) === user1Balance)
    assert(
      info[0].availableClaims[0].token.id === datatokenAddress1.toLowerCase()
    )
    assert(info[0].history[0].amount === '100')
    assert(info[0].history[0].tx === tx.transactionHash.toLowerCase())
    assert(info[0].history[0].type === 'Allocated')
  })

  it('user2 claims some rewards', async () => {
    const expectedReward = await dfRewards.getAvailableRewards(
      user2,
      datatokenAddress1
    )
    await dfRewards.claimRewards(user2, user2, datatokenAddress1)

    const user2Balance = await dfRewards.getAvailableRewards(
      user2,
      datatokenAddress1
    )
    // check subgraph
    await sleep(2000)
    const initialQuery = {
      query: `query {
        dfrewards(where: {id:"${user2.toLowerCase()}"}){
            id
            receiver {
              id
            }
            availableClaims(where: {token:"${datatokenAddress1.toLowerCase()}"}){
              id
              receiver {
                id
              }
              amount
              token {
                id
              }
            }
            history(orderBy:timestamp,orderDirection:desc){
              id
              receiver {
                id
              }
              amount
              token {
                id
              }
              type
              tx
              eventIndex
            }
          }        
                }`
    }
    const initialResponse = await fetch(subgraphUrl, {
      method: 'POST',
      body: JSON.stringify(initialQuery)
    })
    const info = (await initialResponse.json()).data.dfrewards
    assert(info[0].receiver.id === user2.toLowerCase())
    assert(String(info[0].availableClaims[0].amount) === user2Balance)
    assert(
      info[0].availableClaims[0].token.id === datatokenAddress1.toLowerCase()
    )
    assert(info[0].history[0].amount === expectedReward)
    assert(info[0].history[0].type === 'Claimed')
  })
})
