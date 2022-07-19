// These tests depend on you using df-py to setup your environment
// 1. get local ganache running
// 2. deploy: [veOcean, veAllocate] in local net
// 3. generate `subgraph.yaml` w/ generatenetworkssubgraphs
// 4. use ocean-subgraph `docker-compose up` to bring up local subgraph
// 5a. run: `npm run codegen` (just once, or if you change schema.graphql)
// 5b. run: `npm run create:local` (just once, or if you run 4a)
// 5c. run: `npm run deploy:local` (whenever you change anything)
// 6. run this test suite to verify that veAllocate events are working

import { expect } from 'chai'
import Web3 from 'web3'
import { AbiItem } from 'web3-utils';
import {Contract} from 'web3-eth-contract';
import { fetch } from 'cross-fetch'

const addresses = {
  'veOcean': '',
  'veAllocate': ''
}

const web3 = new Web3('http://127.0.0.1:8545')
const subgraphUrl = 'http://127.0.0.1:9000/subgraphs/name/oceanprotocol/ocean-subgraph'

const veOceanABI = [{"name": "CommitOwnership", "inputs": [{"name": "admin", "type": "address", "indexed": false}], "anonymous": false, "type": "event"}, {"name": "ApplyOwnership", "inputs": [{"name": "admin", "type": "address", "indexed": false}], "anonymous": false, "type": "event"}, {"name": "Deposit", "inputs": [{"name": "provider", "type": "address", "indexed": true}, {"name": "value", "type": "uint256", "indexed": false}, {"name": "locktime", "type": "uint256", "indexed": true}, {"name": "type", "type": "int128", "indexed": false}, {"name": "ts", "type": "uint256", "indexed": false}], "anonymous": false, "type": "event"}, {"name": "Withdraw", "inputs": [{"name": "provider", "type": "address", "indexed": true}, {"name": "value", "type": "uint256", "indexed": false}, {"name": "ts", "type": "uint256", "indexed": false}], "anonymous": false, "type": "event"}, {"name": "Supply", "inputs": [{"name": "prevSupply", "type": "uint256", "indexed": false}, {"name": "supply", "type": "uint256", "indexed": false}], "anonymous": false, "type": "event"}, {"stateMutability": "nonpayable", "type": "constructor", "inputs": [{"name": "token_addr", "type": "address"}, {"name": "_name", "type": "string"}, {"name": "_symbol", "type": "string"}, {"name": "_version", "type": "string"}], "outputs": []}, {"stateMutability": "nonpayable", "type": "function", "name": "commit_transfer_ownership", "inputs": [{"name": "addr", "type": "address"}], "outputs": [], "gas": 39445}, {"stateMutability": "nonpayable", "type": "function", "name": "apply_transfer_ownership", "inputs": [], "outputs": [], "gas": 41536}, {"stateMutability": "nonpayable", "type": "function", "name": "commit_smart_wallet_checker", "inputs": [{"name": "addr", "type": "address"}], "outputs": [], "gas": 37665}, {"stateMutability": "nonpayable", "type": "function", "name": "apply_smart_wallet_checker", "inputs": [], "outputs": [], "gas": 39641}, {"stateMutability": "view", "type": "function", "name": "get_last_user_slope", "inputs": [{"name": "addr", "type": "address"}], "outputs": [{"name": "", "type": "int128"}], "gas": 5124}, {"stateMutability": "view", "type": "function", "name": "user_point_history__ts", "inputs": [{"name": "_addr", "type": "address"}, {"name": "_idx", "type": "uint256"}], "outputs": [{"name": "", "type": "uint256"}], "gas": 2927}, {"stateMutability": "view", "type": "function", "name": "locked__end", "inputs": [{"name": "_addr", "type": "address"}], "outputs": [{"name": "", "type": "uint256"}], "gas": 2912}, {"stateMutability": "nonpayable", "type": "function", "name": "checkpoint", "inputs": [], "outputs": [], "gas": 37283250}, {"stateMutability": "nonpayable", "type": "function", "name": "deposit_for", "inputs": [{"name": "_addr", "type": "address"}, {"name": "_value", "type": "uint256"}], "outputs": [], "gas": 37475770}, {"stateMutability": "nonpayable", "type": "function", "name": "create_lock", "inputs": [{"name": "_value", "type": "uint256"}, {"name": "_unlock_time", "type": "uint256"}], "outputs": [], "gas": 37483588}, {"stateMutability": "nonpayable", "type": "function", "name": "increase_amount", "inputs": [{"name": "_value", "type": "uint256"}], "outputs": [], "gas": 37479810}, {"stateMutability": "nonpayable", "type": "function", "name": "increase_unlock_time", "inputs": [{"name": "_unlock_time", "type": "uint256"}], "outputs": [], "gas": 37486964}, {"stateMutability": "nonpayable", "type": "function", "name": "withdraw", "inputs": [], "outputs": [], "gas": 37465773}, {"stateMutability": "view", "type": "function", "name": "balanceOf", "inputs": [{"name": "addr", "type": "address"}], "outputs": [{"name": "", "type": "uint256"}], "gas": 12660}, {"stateMutability": "view", "type": "function", "name": "balanceOf", "inputs": [{"name": "addr", "type": "address"}, {"name": "_t", "type": "uint256"}], "outputs": [{"name": "", "type": "uint256"}], "gas": 12660}, {"stateMutability": "view", "type": "function", "name": "balanceOfAt", "inputs": [{"name": "addr", "type": "address"}, {"name": "_block", "type": "uint256"}], "outputs": [{"name": "", "type": "uint256"}], "gas": 792910}, {"stateMutability": "view", "type": "function", "name": "totalSupply", "inputs": [], "outputs": [{"name": "", "type": "uint256"}], "gas": 905026}, {"stateMutability": "view", "type": "function", "name": "totalSupply", "inputs": [{"name": "t", "type": "uint256"}], "outputs": [{"name": "", "type": "uint256"}], "gas": 905026}, {"stateMutability": "view", "type": "function", "name": "totalSupplyAt", "inputs": [{"name": "_block", "type": "uint256"}], "outputs": [{"name": "", "type": "uint256"}], "gas": 1287488}, {"stateMutability": "nonpayable", "type": "function", "name": "changeController", "inputs": [{"name": "_newController", "type": "address"}], "outputs": [], "gas": 38115}, {"stateMutability": "view", "type": "function", "name": "token", "inputs": [], "outputs": [{"name": "", "type": "address"}], "gas": 3000}, {"stateMutability": "view", "type": "function", "name": "supply", "inputs": [], "outputs": [{"name": "", "type": "uint256"}], "gas": 3030}, {"stateMutability": "view", "type": "function", "name": "locked", "inputs": [{"name": "arg0", "type": "address"}], "outputs": [{"name": "", "type": "tuple", "components": [{"name": "amount", "type": "int128"}, {"name": "end", "type": "uint256"}]}], "gas": 5483}, {"stateMutability": "view", "type": "function", "name": "epoch", "inputs": [], "outputs": [{"name": "", "type": "uint256"}], "gas": 3090}, {"stateMutability": "view", "type": "function", "name": "point_history", "inputs": [{"name": "arg0", "type": "uint256"}], "outputs": [{"name": "", "type": "tuple", "components": [{"name": "bias", "type": "int128"}, {"name": "slope", "type": "int128"}, {"name": "ts", "type": "uint256"}, {"name": "blk", "type": "uint256"}]}], "gas": 9554}, {"stateMutability": "view", "type": "function", "name": "user_point_history", "inputs": [{"name": "arg0", "type": "address"}, {"name": "arg1", "type": "uint256"}], "outputs": [{"name": "", "type": "tuple", "components": [{"name": "bias", "type": "int128"}, {"name": "slope", "type": "int128"}, {"name": "ts", "type": "uint256"}, {"name": "blk", "type": "uint256"}]}], "gas": 9850}, {"stateMutability": "view", "type": "function", "name": "user_point_epoch", "inputs": [{"name": "arg0", "type": "address"}], "outputs": [{"name": "", "type": "uint256"}], "gas": 3446}, {"stateMutability": "view", "type": "function", "name": "slope_changes", "inputs": [{"name": "arg0", "type": "uint256"}], "outputs": [{"name": "", "type": "int128"}], "gas": 3325}, {"stateMutability": "view", "type": "function", "name": "controller", "inputs": [], "outputs": [{"name": "", "type": "address"}], "gas": 3240}, {"stateMutability": "view", "type": "function", "name": "transfersEnabled", "inputs": [], "outputs": [{"name": "", "type": "bool"}], "gas": 3270}, {"stateMutability": "view", "type": "function", "name": "name", "inputs": [], "outputs": [{"name": "", "type": "string"}], "gas": 13589}, {"stateMutability": "view", "type": "function", "name": "symbol", "inputs": [], "outputs": [{"name": "", "type": "string"}], "gas": 11348}, {"stateMutability": "view", "type": "function", "name": "version", "inputs": [], "outputs": [{"name": "", "type": "string"}], "gas": 11378}, {"stateMutability": "view", "type": "function", "name": "decimals", "inputs": [], "outputs": [{"name": "", "type": "uint256"}], "gas": 3390}, {"stateMutability": "view", "type": "function", "name": "future_smart_wallet_checker", "inputs": [], "outputs": [{"name": "", "type": "address"}], "gas": 3420}, {"stateMutability": "view", "type": "function", "name": "smart_wallet_checker", "inputs": [], "outputs": [{"name": "", "type": "address"}], "gas": 3450}, {"stateMutability": "view", "type": "function", "name": "admin", "inputs": [], "outputs": [{"name": "", "type": "address"}], "gas": 3480}, {"stateMutability": "view", "type": "function", "name": "future_admin", "inputs": [], "outputs": [{"name": "", "type": "address"}], "gas": 3510}]
const veAllocateABI = [{"inputs":[{"internalType":"uint256","name":"amount","type":"uint256"},{"internalType":"string","name":"_id","type":"string"}],"name":"allocate","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"_address","type":"address"},{"internalType":"string","name":"_id","type":"string"}],"name":"getveAllocation","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"amount","type":"uint256"},{"internalType":"string","name":"_id","type":"string"}],"name":"removeAllocation","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"_address","type":"address"}],"name":"totalAllocation","outputs":[{"internalType":"uint256","name":"","type":"uint256"},{"internalType":"string[]","name":"","type":"string[]"},{"internalType":"uint256[]","name":"","type":"uint256[]"}],"stateMutability":"view","type":"function"}]

describe('Simple veAllocate testing', async () => {
  let accounts: string[]
  let veOcean: Contract
  let veAllocate: Contract
  let alice: string
  let bob: string
  
  before(async () => {
    veOcean = new web3.eth.Contract(veOceanABI as AbiItem[], addresses['veOcean'])
    veAllocate = new web3.eth.Contract(veAllocateABI as AbiItem[], addresses['veAllocate'])
    
    accounts = await web3.eth.getAccounts()
    alice = accounts[0]
    bob = accounts[1]

    // TODO - give ocean to alice
    // TODO - get alice to lock ocean
  })

  it('should allocate, remove allocation, and verify subgraph', async () => {
    const dt: Object = {
      dataNftAddress: '0x0000000000000000000000000000000000000000',
      chain: 1
    }

    veAllocate.setAllocation(100, "test", {"from": alice})
    const alloc1 = veAllocate.getTotalAllocation(alice, 100, 0)
    expect(alloc1[0][0]).to.equal("test")
    expect(alloc1[1][0]).to.equal(100)

    veAllocate.setAllocation(25, "test2", {"from": alice})
    const alloc2 = veAllocate.getTotalAllocation(alice, 100, 0)
    expect(alloc2[0][1]).to.equal("test2")
    expect(alloc2[1][1]).to.equal(25)
  })
})
