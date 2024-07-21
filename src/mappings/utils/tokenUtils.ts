import { Address, log, BigDecimal, BigInt } from '@graphprotocol/graph-ts'
import {
  Nft,
  Token,
  PredictContract,
  Erc721Template,
  Erc20Template
} from '../../@types/schema'
import { ERC20 } from '../../@types/templates/ERC20Template/ERC20'
import { ERC721Template } from '../../@types/templates'
import { addNft } from './globalUtils'
import { ZERO_ADDRESS } from './constants'

export function createToken(address: Address, isDatatoken: boolean): Token {
  log.debug('started creating token with address: {}', [address.toHexString()])
  const token = new Token(address.toHexString())
  const contract = ERC20.bind(address)
  const name = contract.try_name()
  if (name.reverted) token.name = ''
  else token.name = name.value
  const symbol = contract.try_symbol()
  if (name.reverted) token.symbol = ''
  else token.symbol = symbol.value
  token.address = address.toHexString()
  token.isDatatoken = isDatatoken
  const decimals = contract.try_decimals()
  if (decimals.reverted) token.decimals = 18
  else token.decimals = decimals.value
  token.lastPriceToken = ZERO_ADDRESS
  token.lastPriceValue = BigDecimal.zero()
  token.orderCount = BigInt.zero()
  token.holderCount = BigInt.zero()
  token.createdTimestamp = 0
  token.block = 0
  token.tx = ''
  token.eventIndex = 0
  token.templateId = BigInt.zero()
  token.save()
  return token
}

export function getToken(address: Address, isDatatoken: boolean): Token {
  let newToken = Token.load(address.toHexString())
  if (newToken === null) {
    newToken = createToken(address, isDatatoken)
  }
  return newToken
}

export function createNftToken(address: Address): Nft {
  ERC721Template.create(address)
  const token = new Nft(address.toHexString())
  token.name = ''
  token.symbol = ''
  token.address = address.toHexString()
  token.providerUrl = ''
  token.tokenUri = ''
  token.owner = ''
  token.creator = ''
  token.assetState = 0
  token.template = ''
  token.transferable = true
  token.createdTimestamp = 0
  token.block = 0
  token.tx = ''
  token.orderCount = BigInt.zero()
  token.hasMetadata = false
  token.eventIndex = 0
  token.save()
  addNft()
  return token
}

export function getNftToken(address: Address): Nft {
  let newToken = Nft.load(address.toHexString())
  if (newToken === null) {
    newToken = createNftToken(address)
  }
  return newToken
}

export function getNftTokenWithID(tokenId: string): Nft {
  let nftToken = Nft.load(tokenId)
  if (nftToken === null) {
    nftToken = new Nft(tokenId)
    // const contract = ERC721Template.bind(address)
    nftToken.name = ''
    nftToken.symbol = ''
    nftToken.address = tokenId
    nftToken.providerUrl = ''
    nftToken.tokenUri = ''
    nftToken.owner = ''
    nftToken.creator = ''
    nftToken.assetState = 0
    nftToken.template = ''
    nftToken.transferable = true
    nftToken.createdTimestamp = 0
    nftToken.block = 0
    nftToken.tx = ''
    nftToken.orderCount = BigInt.zero()
    nftToken.hasMetadata = false
    nftToken.eventIndex = 0
    nftToken.save()
    addNft()
  }
  return nftToken
}

export function getUSDValue(
  address: string,
  value: BigDecimal,
  timestamp: number
): BigDecimal {
  return BigDecimal.zero()
}

export function getErc721TemplateId(address: Address): BigInt {
  const template = Erc721Template.load(address.toHexString())
  if (template) {
    return template.templateId
  }
  return BigInt.zero()
}

export function getErc20TemplateId(address: Address): BigInt {
  const template = Erc20Template.load(address.toHexString())
  if (template) {
    return template.templateId
  }
  return BigInt.zero()
}

declare const hardCodedContractData: {
  [key: string]: {
    token: string;
    secondsPerEpoch: i32;
    secondsPerSubscription: i32;
    truevalSubmitTimeout: i32;
    stakeToken: string;
    txId: string;
    timestamp: i32;
    block: i32;
    eventIndex: i32;
  };
};

const hardCodedContractData = {
  "0x18f54cc21b7a2fdd011bea06bba7801b280e3151": {
    "token": "0x18f54cc21b7a2fdd011bea06bba7801b280e3151",
    "secondsPerEpoch": 300,
    "secondsPerSubscription": 86400,
    "truevalSubmitTimeout": 259200,
    "stakeToken": "0x39d22b78a7651a76ffbde2aaab5fd92666aca520",
    "txId": "0xc6bdecd2c06b1c7fe350f0d375e14a3f0312756c4a659e8edfbf74567acba77e",
    "timestamp": 1696238187,
    "block": 916047,
    "eventIndex": 6
  },
  "0x2d8e2267779d27c2b3ed5408408ff15d9f3a3152": {
    "token": "0x2d8e2267779d27c2b3ed5408408ff15d9f3a3152",
    "secondsPerEpoch": 3600,
    "secondsPerSubscription": 86400,
    "truevalSubmitTimeout": 259200,
    "stakeToken": "0x39d22b78a7651a76ffbde2aaab5fd92666aca520",
    "txId": "0xa974299eb88b5166b09fc35810e7ed5daf3e481a924b40d5d4e27c4c95224d1b",
    "timestamp": 1696238800,
    "block": 916127,
    "eventIndex": 6
  },
  "0x30f1c55e72fe105e4a1fbecdff3145fc14177695": {
    "token": "0x30f1c55e72fe105e4a1fbecdff3145fc14177695",
    "secondsPerEpoch": 300,
    "secondsPerSubscription": 86400,
    "truevalSubmitTimeout": 259200,
    "stakeToken": "0x39d22b78a7651a76ffbde2aaab5fd92666aca520",
    "txId": "0xce9b9c9d7ca722c9e2e4aaf44bfa7072a895a6dc1c322ab3100b305248fc0e8b",
    "timestamp": 1696238041,
    "block": 916022,
    "eventIndex": 6
  },
  "0x31fabe1fc9887af45b77c7d1e13c5133444ebfbd": {
    "token": "0x31fabe1fc9887af45b77c7d1e13c5133444ebfbd",
    "secondsPerEpoch": 300,
    "secondsPerSubscription": 86400,
    "truevalSubmitTimeout": 259200,
    "stakeToken": "0x39d22b78a7651a76ffbde2aaab5fd92666aca520",
    "txId": "0x5af1471bff7a5c6faed640c7b9b00013b5c9601ba10fb89ecc3119171a1de7aa",
    "timestamp": 1696238094,
    "block": 916031,
    "eventIndex": 6
  },
  "0x3fb744c3702ff2237fc65f261046ead36656f3bc": {
    "token": "0x3fb744c3702ff2237fc65f261046ead36656f3bc",
    "secondsPerEpoch": 300,
    "secondsPerSubscription": 86400,
    "truevalSubmitTimeout": 259200,
    "stakeToken": "0x39d22b78a7651a76ffbde2aaab5fd92666aca520",
    "txId": "0x70276e2fa7abb87d6852d3a7cb6b349c53763351de458d7eb26207d02a37cdcf",
    "timestamp": 1696238281,
    "block": 916063,
    "eventIndex": 6
  },
  "0x55c6c33514f80b51a1f1b63c8ba229feb132cedb": {
    "token": "0x55c6c33514f80b51a1f1b63c8ba229feb132cedb",
    "secondsPerEpoch": 300,
    "secondsPerSubscription": 86400,
    "truevalSubmitTimeout": 259200,
    "stakeToken": "0x39d22b78a7651a76ffbde2aaab5fd92666aca520",
    "txId": "0x248d3e16ff7a75c8e944576955c9e54711f05e3fb9cb79269c67770c79ba9d63",
    "timestamp": 1696238134,
    "block": 916038,
    "eventIndex": 6
  },
  "0x74a61f733bd9a2ce40d2e39738fe4912925c06dd": {
    "token": "0x74a61f733bd9a2ce40d2e39738fe4912925c06dd",
    "secondsPerEpoch": 3600,
    "secondsPerSubscription": 86400,
    "truevalSubmitTimeout": 259200,
    "stakeToken": "0x39d22b78a7651a76ffbde2aaab5fd92666aca520",
    "txId": "0xa5581593120b51dfb93e4cfd2af041a15a344a405e94cd3f6ed43869089e86ac",
    "timestamp": 1696239037,
    "block": 916151,
    "eventIndex": 6
  },
  "0x8165caab33131a4ddbf7dc79f0a8a4920b0b2553": {
    "token": "0x8165caab33131a4ddbf7dc79f0a8a4920b0b2553",
    "secondsPerEpoch": 3600,
    "secondsPerSubscription": 86400,
    "truevalSubmitTimeout": 259200,
    "stakeToken": "0x39d22b78a7651a76ffbde2aaab5fd92666aca520",
    "txId": "0x38d03c539ea164cce6e0a1b2fe17c7d49b25ec83a496ae2fa62bd050ecb06b6e",
    "timestamp": 1696238489,
    "block": 916097,
    "eventIndex": 6
  },
  "0x93f9d558ccde9ea371a20d36bd3ba58c7218b48f": {
    "token": "0x93f9d558ccde9ea371a20d36bd3ba58c7218b48f",
    "secondsPerEpoch": 3600,
    "secondsPerSubscription": 86400,
    "truevalSubmitTimeout": 259200,
    "stakeToken": "0x39d22b78a7651a76ffbde2aaab5fd92666aca520",
    "txId": "0xe9f300bde7ec4a97c212a442d26cbd4b19437b871a29121e1abd5727b8ee2530",
    "timestamp": 1696239260,
    "block": 916176,
    "eventIndex": 6
  },
  "0x9c4a2406e5aa0f908d6e816e5318b9fc8a507e1f": {
    "token": "0x9c4a2406e5aa0f908d6e816e5318b9fc8a507e1f",
    "secondsPerEpoch": 300,
    "secondsPerSubscription": 86400,
    "truevalSubmitTimeout": 259200,
    "stakeToken": "0x39d22b78a7651a76ffbde2aaab5fd92666aca520",
    "txId": "0x2362e758cdef66d19a23a7247d284c5ad91f0bec94f77aa197a6932a7e86f8e1",
    "timestamp": 1696238432,
    "block": 916088,
    "eventIndex": 6
  },
  "0xa2d9dbbdf21c30bb3e63d16ba75f644ac11a0cf0": {
    "token": "0xa2d9dbbdf21c30bb3e63d16ba75f644ac11a0cf0",
    "secondsPerEpoch": 3600,
    "secondsPerSubscription": 86400,
    "truevalSubmitTimeout": 259200,
    "stakeToken": "0x39d22b78a7651a76ffbde2aaab5fd92666aca520",
    "txId": "0x6d2e3101a010a59ccf0523df75cbb282005fb549bc2df0921d1e80492d6bd170",
    "timestamp": 1696238863,
    "block": 916135,
    "eventIndex": 6
  },
  "0xaa6515c138183303b89b98aea756b54f711710c5": {
    "token": "0xaa6515c138183303b89b98aea756b54f711710c5",
    "secondsPerEpoch": 3600,
    "secondsPerSubscription": 86400,
    "truevalSubmitTimeout": 259200,
    "stakeToken": "0x39d22b78a7651a76ffbde2aaab5fd92666aca520",
    "txId": "0x00e15733c922283fa243ce4a73e3ae636c66c0cabb7b1a81f40d4e5d05e1c1c7",
    "timestamp": 1696238618,
    "block": 916108,
    "eventIndex": 6
  },
  "0xb1c55346023dee4d8b0d7b10049f0c8854823766": {
    "token": "0xb1c55346023dee4d8b0d7b10049f0c8854823766",
    "secondsPerEpoch": 300,
    "secondsPerSubscription": 86400,
    "truevalSubmitTimeout": 259200,
    "stakeToken": "0x39d22b78a7651a76ffbde2aaab5fd92666aca520",
    "txId": "0x643032ac88f837dca705aebf5f87dd024e6885ae4231606d17b4bc9f225a71b9",
    "timestamp": 1696238333,
    "block": 916072,
    "eventIndex": 6
  },
  "0xbe09c6e3f2341a79f74898b8d68c4b5818a2d434": {
    "token": "0xbe09c6e3f2341a79f74898b8d68c4b5818a2d434",
    "secondsPerEpoch": 300,
    "secondsPerSubscription": 86400,
    "truevalSubmitTimeout": 259200,
    "stakeToken": "0x39d22b78a7651a76ffbde2aaab5fd92666aca520",
    "txId": "0xfd5700b09e1952f37bbff34b0b9d85f2887b81635ca0cf598bbfe373b273b798",
    "timestamp": 1696238240,
    "block": 916056,
    "eventIndex": 6
  },
  "0xd41ffee162905b45b65fa6b6e4468599f0490065": {
    "token": "0xd41ffee162905b45b65fa6b6e4468599f0490065",
    "secondsPerEpoch": 3600,
    "secondsPerSubscription": 86400,
    "truevalSubmitTimeout": 259200,
    "stakeToken": "0x39d22b78a7651a76ffbde2aaab5fd92666aca520",
    "txId": "0x193d1060b4920aa9d1f7759a7090eec9c456d79f505b6230af94169f6dc31956",
    "timestamp": 1696238707,
    "block": 916118,
    "eventIndex": 6
  },
  "0xd49cbfd694f4556c00023ddd3559c36af3ae0a80": {
    "token": "0xd49cbfd694f4556c00023ddd3559c36af3ae0a80",
    "secondsPerEpoch": 3600,
    "secondsPerSubscription": 86400,
    "truevalSubmitTimeout": 259200,
    "stakeToken": "0x39d22b78a7651a76ffbde2aaab5fd92666aca520",
    "txId": "0x40814d5f0ef24f3f9cf4b215081f7528b5de154243fcf59a7b454a5bc271f560",
    "timestamp": 1696239212,
    "block": 916168,
    "eventIndex": 6
  },
  "0xe66421fd29fc2d27d0724f161f01b8cbdcd69690": {
    "token": "0xe66421fd29fc2d27d0724f161f01b8cbdcd69690",
    "secondsPerEpoch": 300,
    "secondsPerSubscription": 86400,
    "truevalSubmitTimeout": 259200,
    "stakeToken": "0x39d22b78a7651a76ffbde2aaab5fd92666aca520",
    "txId": "0x06f034e9b8bfb52e2e482ea7a32efa9eb9b4feded8c3c046ee0833378d120bac",
    "timestamp": 1696237984,
    "block": 916013,
    "eventIndex": 6
  },
  "0xf28c94c55d8c5e1d70ca3a82744225a4f7570b30": {
    "token": "0xf28c94c55d8c5e1d70ca3a82744225a4f7570b30",
    "secondsPerEpoch": 300,
    "secondsPerSubscription": 86400,
    "truevalSubmitTimeout": 259200,
    "stakeToken": "0x39d22b78a7651a76ffbde2aaab5fd92666aca520",
    "txId": "0xe24cd880f5be9be7ce49309ddfebbaea5cce0cbbfc52a5d265705956efdcafe9",
    "timestamp": 1696238391,
    "block": 916081,
    "eventIndex": 6
  },
  "0xf8c34175fc1f1d373ec67c4fd1f1ce57c69c3fb3": {
    "token": "0xf8c34175fc1f1d373ec67c4fd1f1ce57c69c3fb3",
    "secondsPerEpoch": 3600,
    "secondsPerSubscription": 86400,
    "truevalSubmitTimeout": 259200,
    "stakeToken": "0x39d22b78a7651a76ffbde2aaab5fd92666aca520",
    "txId": "0xced7e3cfa204914ae24d0e411a4eed8c3a5476b96c4bee00c77e55fe11fedcd6",
    "timestamp": 1696238944,
    "block": 916143,
    "eventIndex": 6
  },
  "0xfa69b2c1224cebb3b6a36fb5b8c3c419afab08dd": {
    "token": "0xfa69b2c1224cebb3b6a36fb5b8c3c419afab08dd",
    "secondsPerEpoch": 3600,
    "secondsPerSubscription": 86400,
    "truevalSubmitTimeout": 259200,
    "stakeToken": "0x39d22b78a7651a76ffbde2aaab5fd92666aca520",
    "txId": "0xa252cf012e10da7a99ab26933a4fb273b289e82eb012463ee6e1a1f14f2617a5",
    "timestamp": 1696239124,
    "block": 916159,
    "eventIndex": 6
  }
}

export function createPredictContract(address: Address): PredictContract {
  const predictContract = new PredictContract(address.toHexString())
  const token = getToken(address, true)
  predictContract.token = token.id
  predictContract.secondsPerEpoch = BigInt.zero()
  predictContract.secondsPerSubscription = BigInt.zero()
  predictContract.truevalSubmitTimeout = BigInt.zero()
  predictContract.stakeToken = null
  predictContract.txId = ''
  predictContract.timestamp = 0
  predictContract.block = 0
  predictContract.eventIndex = 0
  predictContract.paused = false

  if (hardCodedContractData.hasOwnProperty(address.toHexString().toLowerCase())) {
    const contractData = hardCodedContractData[address.toHexString().toLowerCase()]
    predictContract.secondsPerEpoch = BigInt.fromI32(contractData.secondsPerEpoch)
    predictContract.secondsPerSubscription = BigInt.fromI32(contractData.secondsPerSubscription)
    predictContract.truevalSubmitTimeout = BigInt.fromI32(contractData.truevalSubmitTimeout)
    predictContract.stakeToken = Address.fromString(contractData.stakeToken)
    predictContract.txId = contractData.txId
    predictContract.timestamp = contractData.timestamp
    predictContract.block = contractData.block
    predictContract.eventIndex = contractData.eventIndex
  }

  predictContract.save()
  return predictContract
}

export function getPredictContract(address: Address): PredictContract {
  let newPredictContract = PredictContract.load(address.toHexString())
  if (newPredictContract === null) {
    newPredictContract = createPredictContract(address)
  }
  return newPredictContract
}
