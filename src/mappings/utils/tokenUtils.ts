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



  if (
    address.toHexString().toLowerCase() ==
    '0x0423ac88aedb41343ff94cfb9cf60325b4fd07f8'.toLowerCase()
  ) {
    predictContract.secondsPerEpoch = BigInt.fromI32(300)
    predictContract.secondsPerSubscription = BigInt.fromI32(86400)
    predictContract.truevalSubmitTimeout = BigInt.fromI32(259200)
    predictContract.stakeToken = '0x973e69303259b0c2543a38665122b773d28405fb'
    predictContract.txId =
      '0xeb0136b0419f95d232f133681679d6ce7d830948d6ea0ed43d9496af508fb6e8'
    predictContract.timestamp = 1697814249
    predictContract.block = 3083831
    predictContract.eventIndex = 8
    predictContract.paused = false
  }
  
  if (
    address.toHexString().toLowerCase() ==
    '0x097422bae67d9c602c7ddbb3cb2f6268157ea746'.toLowerCase()
  ) {
    predictContract.secondsPerEpoch = BigInt.fromI32(3600)
    predictContract.secondsPerSubscription = BigInt.fromI32(86400)
    predictContract.truevalSubmitTimeout = BigInt.fromI32(259200)
    predictContract.stakeToken = '0x973e69303259b0c2543a38665122b773d28405fb'
    predictContract.txId =
      '0x9db5c2e64dcc0276c429f2264673be27dde8dad67fe9e222ba9d53f2414fae76'
    predictContract.timestamp = 1695219531
    predictContract.block = 2683502
    predictContract.eventIndex = 8
    predictContract.paused = false
  }
  
  if (
    address.toHexString().toLowerCase() ==
    '0x0aff8e712b3fb993c9c9cb7528d90c8692c53a9a'.toLowerCase()
  ) {
    predictContract.secondsPerEpoch = BigInt.fromI32(300)
    predictContract.secondsPerSubscription = BigInt.fromI32(7200)
    predictContract.truevalSubmitTimeout = BigInt.fromI32(14400)
    predictContract.stakeToken = '0x973e69303259b0c2543a38665122b773d28405fb'
    predictContract.txId =
      '0xbf4d0647e3c8afde2363dcacd2013dde0c413510e7fb2781c857979810a14713'
    predictContract.timestamp = 1699899655
    predictContract.block = 3448775
    predictContract.eventIndex = 6
    predictContract.paused = false
  }
  
  if (
    address.toHexString().toLowerCase() ==
    '0x0f39784c50868bf8efca6516e735d309f34d9c79'.toLowerCase()
  ) {
    predictContract.secondsPerEpoch = BigInt.fromI32(3600)
    predictContract.secondsPerSubscription = BigInt.fromI32(86400)
    predictContract.truevalSubmitTimeout = BigInt.fromI32(259200)
    predictContract.stakeToken = '0x973e69303259b0c2543a38665122b773d28405fb'
    predictContract.txId =
      '0xd52d57b873fda788b5e48decc668ad056d6158abd2db28a70925fc3f35334f56'
    predictContract.timestamp = 1695219338
    predictContract.block = 2683473
    predictContract.eventIndex = 6
    predictContract.paused = false
  }
  
  if (
    address.toHexString().toLowerCase() ==
    '0x11d513dae274c9df9475a3b956ca983b94bb0dc0'.toLowerCase()
  ) {
    predictContract.secondsPerEpoch = BigInt.fromI32(3600)
    predictContract.secondsPerSubscription = BigInt.fromI32(86400)
    predictContract.truevalSubmitTimeout = BigInt.fromI32(259200)
    predictContract.stakeToken = '0x973e69303259b0c2543a38665122b773d28405fb'
    predictContract.txId =
      '0x61daeeab451b483db94821f196a1cac6dad389eb51b8aadf30e5e974c35d7140'
    predictContract.timestamp = 1695220002
    predictContract.block = 2683583
    predictContract.eventIndex = 6
    predictContract.paused = false
  }
  
  if (
    address.toHexString().toLowerCase() ==
    '0x1271909aa317f4c57c826dcc603e9e99706305e9'.toLowerCase()
  ) {
    predictContract.secondsPerEpoch = BigInt.fromI32(3600)
    predictContract.secondsPerSubscription = BigInt.fromI32(86400)
    predictContract.truevalSubmitTimeout = BigInt.fromI32(259200)
    predictContract.stakeToken = '0x973e69303259b0c2543a38665122b773d28405fb'
    predictContract.txId =
      '0xda95968edaf6e279b2683e9c1f673785236ad79b1449710cd35805ad68fd2023'
    predictContract.timestamp = 1695219454
    predictContract.block = 2683488
    predictContract.eventIndex = 8
    predictContract.paused = false
  }
  
  if (
    address.toHexString().toLowerCase() ==
    '0x1d8acdeeaa7c155ce5944bd8c5f0b64795bc99ff'.toLowerCase()
  ) {
    predictContract.secondsPerEpoch = BigInt.fromI32(300)
    predictContract.secondsPerSubscription = BigInt.fromI32(86400)
    predictContract.truevalSubmitTimeout = BigInt.fromI32(259200)
    predictContract.stakeToken = '0x973e69303259b0c2543a38665122b773d28405fb'
    predictContract.txId =
      '0xa2e25be92360801c215abf4005a87c5f817619943bb6c27c90bd48f77c937e00'
    predictContract.timestamp = 1694514234
    predictContract.block = 2566076
    predictContract.eventIndex = 6
    predictContract.paused = false
  }
  
  if (
    address.toHexString().toLowerCase() ==
    '0x2c69ed60f8d122bda55d5996484a290eaa2b289c'.toLowerCase()
  ) {
    predictContract.secondsPerEpoch = BigInt.fromI32(300)
    predictContract.secondsPerSubscription = BigInt.fromI32(86400)
    predictContract.truevalSubmitTimeout = BigInt.fromI32(259200)
    predictContract.stakeToken = '0x973e69303259b0c2543a38665122b773d28405fb'
    predictContract.txId =
      '0x339f85d73be0266e5271dd099073eb507856684f350c4cc6e3f41f20518d72f5'
    predictContract.timestamp = 1694514053
    predictContract.block = 2566043
    predictContract.eventIndex = 6
    predictContract.paused = false
  }
  
  if (
    address.toHexString().toLowerCase() ==
    '0x388d104da5b8578e4e65cda016461692681257d5'.toLowerCase()
  ) {
    predictContract.secondsPerEpoch = BigInt.fromI32(300)
    predictContract.secondsPerSubscription = BigInt.fromI32(86400)
    predictContract.truevalSubmitTimeout = BigInt.fromI32(259200)
    predictContract.stakeToken = '0x973e69303259b0c2543a38665122b773d28405fb'
    predictContract.txId =
      '0xb18faaf8f664f3bc711bf70e697da4493b53a7ce138158c04fc458ac19fd2fe1'
    predictContract.timestamp = 1697813865
    predictContract.block = 3083761
    predictContract.eventIndex = 6
    predictContract.paused = false
  }
  
  if (
    address.toHexString().toLowerCase() ==
    '0x48c625c021b1e55d76e364e2359f1f48fe995d4a'.toLowerCase()
  ) {
    predictContract.secondsPerEpoch = BigInt.fromI32(300)
    predictContract.secondsPerSubscription = BigInt.fromI32(86400)
    predictContract.truevalSubmitTimeout = BigInt.fromI32(259200)
    predictContract.stakeToken = '0x973e69303259b0c2543a38665122b773d28405fb'
    predictContract.txId =
      '0x2d1314bf880751197c0ba92dda5d498719483639dde24a883adf8b556974965a'
    predictContract.timestamp = 1694513993
    predictContract.block = 2566032
    predictContract.eventIndex = 6
    predictContract.paused = false
  }
  
  if (
    address.toHexString().toLowerCase() ==
    '0x4bf4ac39d9d580ea6913da46fd524e01614c71bb'.toLowerCase()
  ) {
    predictContract.secondsPerEpoch = BigInt.fromI32(3600)
    predictContract.secondsPerSubscription = BigInt.fromI32(86400)
    predictContract.truevalSubmitTimeout = BigInt.fromI32(259200)
    predictContract.stakeToken = '0x973e69303259b0c2543a38665122b773d28405fb'
    predictContract.txId =
      '0x5ebb5a513ddeafcbbcac237f7169ac2a4654873c6ce19672e3a7889eccae8913'
    predictContract.timestamp = 1695219610
    predictContract.block = 2683516
    predictContract.eventIndex = 6
    predictContract.paused = false
  }
  
  if (
    address.toHexString().toLowerCase() ==
    '0x4d2dfb9a65bffb859eb657ef1d97bb70a7b07f81'.toLowerCase()
  ) {
    predictContract.secondsPerEpoch = BigInt.fromI32(3600)
    predictContract.secondsPerSubscription = BigInt.fromI32(86400)
    predictContract.truevalSubmitTimeout = BigInt.fromI32(259200)
    predictContract.stakeToken = '0x973e69303259b0c2543a38665122b773d28405fb'
    predictContract.txId =
      '0x7e8d5c8bc9b90231cc4f52c634e2934339a692429f746d22d3cd8103b40f01f9'
    predictContract.timestamp = 1695219831
    predictContract.block = 2683555
    predictContract.eventIndex = 6
    predictContract.paused = false
  }
  
  if (
    address.toHexString().toLowerCase() ==
    '0x55327cdc9d5da6f6dbec8671fb9bd876c7f13863'.toLowerCase()
  ) {
    predictContract.secondsPerEpoch = BigInt.fromI32(300)
    predictContract.secondsPerSubscription = BigInt.fromI32(7200)
    predictContract.truevalSubmitTimeout = BigInt.fromI32(259200)
    predictContract.stakeToken = '0x973e69303259b0c2543a38665122b773d28405fb'
    predictContract.txId =
      '0x755428c09b5c60b0028e37eb8009eeeb5af545fb2c971339b2b9c99a1da5ff02'
    predictContract.timestamp = 1699899688
    predictContract.block = 3448781
    predictContract.eventIndex = 6
    predictContract.paused = false
  }
  
  if (
    address.toHexString().toLowerCase() ==
    '0x5aa2a4d188bd0073e3774aa40ddf35e31584ecfe'.toLowerCase()
  ) {
    predictContract.secondsPerEpoch = BigInt.fromI32(300)
    predictContract.secondsPerSubscription = BigInt.fromI32(7200)
    predictContract.truevalSubmitTimeout = BigInt.fromI32(259200)
    predictContract.stakeToken = '0x973e69303259b0c2543a38665122b773d28405fb'
    predictContract.txId =
      '0xc35b19fe5c1f9f8459f1067e73a8af777f3aa63b0eef636db93661a812198c88'
    predictContract.timestamp = 1699869959
    predictContract.block = 3443494
    predictContract.eventIndex = 6
    predictContract.paused = false
  }
  
  if (
    address.toHexString().toLowerCase() ==
    '0x6565f86727ba85d9350d1fbe89076168c151bfec'.toLowerCase()
  ) {
    predictContract.secondsPerEpoch = BigInt.fromI32(300)
    predictContract.secondsPerSubscription = BigInt.fromI32(3000)
    predictContract.truevalSubmitTimeout = BigInt.fromI32(30000)
    predictContract.stakeToken = '0x973e69303259b0c2543a38665122b773d28405fb'
    predictContract.txId =
      '0x06fb3c6eb2332efbec165e3be58187427e3afe1430295536e7279a9b7d7d8c12'
    predictContract.timestamp = 1699899677
    predictContract.block = 3448779
    predictContract.eventIndex = 6
    predictContract.paused = false
  }
  
  if (
    address.toHexString().toLowerCase() ==
    '0x676170bf86926261a3021449bddbe438efebcd26'.toLowerCase()
  ) {
    predictContract.secondsPerEpoch = BigInt.fromI32(300)
    predictContract.secondsPerSubscription = BigInt.fromI32(86400)
    predictContract.truevalSubmitTimeout = BigInt.fromI32(259200)
    predictContract.stakeToken = '0x973e69303259b0c2543a38665122b773d28405fb'
    predictContract.txId =
      '0x02f688de48e7eac2415890a06bd60a666366d23b7daa026c33fa07490030cad8'
    predictContract.timestamp = 1697814019
    predictContract.block = 3083789
    predictContract.eventIndex = 6
    predictContract.paused = false
  }
  
  if (
    address.toHexString().toLowerCase() ==
    '0x6c5b4324a08ecc6a4414879e276430751c6bd700'.toLowerCase()
  ) {
    predictContract.secondsPerEpoch = BigInt.fromI32(300)
    predictContract.secondsPerSubscription = BigInt.fromI32(86400)
    predictContract.truevalSubmitTimeout = BigInt.fromI32(259200)
    predictContract.stakeToken = '0x973e69303259b0c2543a38665122b773d28405fb'
    predictContract.txId =
      '0x20359971fc178db2ca19256677bd9ff681e393b644d0e55455df796cf172c9b6'
    predictContract.timestamp = 1697814173
    predictContract.block = 3083817
    predictContract.eventIndex = 8
    predictContract.paused = false
  }
  
  if (
    address.toHexString().toLowerCase() ==
    '0x6d434011fe93c4338925ad676a726d47b9e9305c'.toLowerCase()
  ) {
    predictContract.secondsPerEpoch = BigInt.fromI32(300)
    predictContract.secondsPerSubscription = BigInt.fromI32(86400)
    predictContract.truevalSubmitTimeout = BigInt.fromI32(259200)
    predictContract.stakeToken = '0x973e69303259b0c2543a38665122b773d28405fb'
    predictContract.txId =
      '0x19f7ff237d5e641fa3775401c5cf0ff83b395876a095e97c8de84dcdb9cab1bc'
    predictContract.timestamp = 1697814096
    predictContract.block = 3083803
    predictContract.eventIndex = 8
    predictContract.paused = false
  }
  
  if (
    address.toHexString().toLowerCase() ==
    '0x71a255e05a3f501e1a3bfc6dfe1c05e3e79213c3'.toLowerCase()
  ) {
    predictContract.secondsPerEpoch = BigInt.fromI32(300)
    predictContract.secondsPerSubscription = BigInt.fromI32(86400)
    predictContract.truevalSubmitTimeout = BigInt.fromI32(259200)
    predictContract.stakeToken = '0x973e69303259b0c2543a38665122b773d28405fb'
    predictContract.txId =
      '0x7752867e1d74151811b2aa3fce2b1cce07da5e12722f939948b33e79761d9bbe'
    predictContract.timestamp = 1697813942
    predictContract.block = 3083775
    predictContract.eventIndex = 6
    predictContract.paused = false
  }
  
  if (
    address.toHexString().toLowerCase() ==
    '0x74f033c4b4d571c8f65da2c035a90871976476d0'.toLowerCase()
  ) {
    predictContract.secondsPerEpoch = BigInt.fromI32(300)
    predictContract.secondsPerSubscription = BigInt.fromI32(86400)
    predictContract.truevalSubmitTimeout = BigInt.fromI32(259200)
    predictContract.stakeToken = '0x973e69303259b0c2543a38665122b773d28405fb'
    predictContract.txId =
      '0x04392b6bee4d7092247a020404a696fdd7d18eb62ebb8fd3befe69377b6f6ab7'
    predictContract.timestamp = 1694514114
    predictContract.block = 2566054
    predictContract.eventIndex = 6
    predictContract.paused = false
  }
  
  if (
    address.toHexString().toLowerCase() ==
    '0x7bb67c67c089e566d8650514fe872b1e16ed946b'.toLowerCase()
  ) {
    predictContract.secondsPerEpoch = BigInt.fromI32(3600)
    predictContract.secondsPerSubscription = BigInt.fromI32(86400)
    predictContract.truevalSubmitTimeout = BigInt.fromI32(259200)
    predictContract.stakeToken = '0x973e69303259b0c2543a38665122b773d28405fb'
    predictContract.txId =
      '0x39987ef58a6ee1d7908185a5b80071606ebf15b0b16fee68bc6e59050ba883c9'
    predictContract.timestamp = 1695219682
    predictContract.block = 2683528
    predictContract.eventIndex = 8
    predictContract.paused = false
  }
  
  if (
    address.toHexString().toLowerCase() ==
    '0x9dccb0fe8e7313141833b9ed96d5a90e3aa20bba'.toLowerCase()
  ) {
    predictContract.secondsPerEpoch = BigInt.fromI32(300)
    predictContract.secondsPerSubscription = BigInt.fromI32(86400)
    predictContract.truevalSubmitTimeout = BigInt.fromI32(259200)
    predictContract.stakeToken = '0x973e69303259b0c2543a38665122b773d28405fb'
    predictContract.txId =
      '0xffcd933d3f547aa8261822f4030022d3ecf517fa909eb885149fbaea19fa82f3'
    predictContract.timestamp = 1697814403
    predictContract.block = 3083859
    predictContract.eventIndex = 6
    predictContract.paused = false
  }
  
  if (
    address.toHexString().toLowerCase() ==
    '0xa1f5241cc11166ab83f240fe7bda9038d98502c8'.toLowerCase()
  ) {
    predictContract.secondsPerEpoch = BigInt.fromI32(300)
    predictContract.secondsPerSubscription = BigInt.fromI32(86400)
    predictContract.truevalSubmitTimeout = BigInt.fromI32(259200)
    predictContract.stakeToken = '0x973e69303259b0c2543a38665122b773d28405fb'
    predictContract.txId =
      '0x5add4f395468a02d368d6417812ec41a18b48d503130c7aa8cc8c4f4ab8e8f13'
    predictContract.timestamp = 1694514293
    predictContract.block = 2566087
    predictContract.eventIndex = 6
    predictContract.paused = false
  }
  
  if (
    address.toHexString().toLowerCase() ==
    '0xa792936b708418a9ea57b1ee18f65c71e988279a'.toLowerCase()
  ) {
    predictContract.secondsPerEpoch = BigInt.fromI32(300)
    predictContract.secondsPerSubscription = BigInt.fromI32(86400)
    predictContract.truevalSubmitTimeout = BigInt.fromI32(259200)
    predictContract.stakeToken = '0x973e69303259b0c2543a38665122b773d28405fb'
    predictContract.txId =
      '0x74c982adbbf498b261bc3f4bddc5967714fa1be8efa55659c3e51742b70c81ec'
    predictContract.timestamp = 1697812239
    predictContract.block = 3083466
    predictContract.eventIndex = 6
    predictContract.paused = false
  }
  
  if (
    address.toHexString().toLowerCase() ==
    '0xa8d5ced9249d5d7526be3f21a5041cf8b2f55c7d'.toLowerCase()
  ) {
    predictContract.secondsPerEpoch = BigInt.fromI32(3600)
    predictContract.secondsPerSubscription = BigInt.fromI32(86400)
    predictContract.truevalSubmitTimeout = BigInt.fromI32(259200)
    predictContract.stakeToken = '0x973e69303259b0c2543a38665122b773d28405fb'
    predictContract.txId =
      '0x52ad1ed0ca68cb71e32de7d6a675f5e5f85765cd9c097c97980cde228c37f539'
    predictContract.timestamp = 1695219754
    predictContract.block = 2683541
    predictContract.eventIndex = 6
    predictContract.paused = false
  }
  
  if (
    address.toHexString().toLowerCase() ==
    '0xb35f6fbf1a8190b4baf9292dba31f17ca7ae772e'.toLowerCase()
  ) {
    predictContract.secondsPerEpoch = BigInt.fromI32(300)
    predictContract.secondsPerSubscription = BigInt.fromI32(86400)
    predictContract.truevalSubmitTimeout = BigInt.fromI32(259200)
    predictContract.stakeToken = '0x973e69303259b0c2543a38665122b773d28405fb'
    predictContract.txId =
      '0xf899a9e84175e0d3f059111a5528166ac576b794c10ba2e6cd1afd1b0d533ee9'
    predictContract.timestamp = 1697814326
    predictContract.block = 3083845
    predictContract.eventIndex = 6
    predictContract.paused = false
  }
  
  if (
    address.toHexString().toLowerCase() ==
    '0xc178ad0c6fe2cb69e19f442398bca44e593a7371'.toLowerCase()
  ) {
    predictContract.secondsPerEpoch = BigInt.fromI32(300)
    predictContract.secondsPerSubscription = BigInt.fromI32(86400)
    predictContract.truevalSubmitTimeout = BigInt.fromI32(259200)
    predictContract.stakeToken = '0x973e69303259b0c2543a38665122b773d28405fb'
    predictContract.txId =
      '0xbcbd571afe9a132cea7eccd4dff7a54dd45ea4bcefb5198b15b174fef9a85596'
    predictContract.timestamp = 1694513873
    predictContract.block = 2566010
    predictContract.eventIndex = 6
    predictContract.paused = false
  }
  
  if (
    address.toHexString().toLowerCase() ==
    '0xc2c5c790b411a835742ed0d517df68fea958058d'.toLowerCase()
  ) {
    predictContract.secondsPerEpoch = BigInt.fromI32(3600)
    predictContract.secondsPerSubscription = BigInt.fromI32(86400)
    predictContract.truevalSubmitTimeout = BigInt.fromI32(259200)
    predictContract.stakeToken = '0x973e69303259b0c2543a38665122b773d28405fb'
    predictContract.txId =
      '0x9d258bf5da5d30c9bb43c49465141ef29a9268d3c5b24ffca073f5a783e952fa'
    predictContract.timestamp = 1695219125
    predictContract.block = 2683460
    predictContract.eventIndex = 8
    predictContract.paused = false
  }
  
  if (
    address.toHexString().toLowerCase() ==
    '0xc5e873330ba14fe99d92a04bda390e0b12068de8'.toLowerCase()
  ) {
    predictContract.secondsPerEpoch = BigInt.fromI32(300)
    predictContract.secondsPerSubscription = BigInt.fromI32(86400)
    predictContract.truevalSubmitTimeout = BigInt.fromI32(259200)
    predictContract.stakeToken = '0x973e69303259b0c2543a38665122b773d28405fb'
    predictContract.txId =
      '0x5b7bdfd8200d812046fc7e905c7a94a4857a0c2ba4ee8ae261cd50aa935e8df2'
    predictContract.timestamp = 1694513933
    predictContract.block = 2566021
    predictContract.eventIndex = 6
    predictContract.paused = false
  }
  
  if (
    address.toHexString().toLowerCase() ==
    '0xd18af05b59bf008ec2e828aaed4b1f0a18086b1c'.toLowerCase()
  ) {
    predictContract.secondsPerEpoch = BigInt.fromI32(300)
    predictContract.secondsPerSubscription = BigInt.fromI32(7200)
    predictContract.truevalSubmitTimeout = BigInt.fromI32(14400)
    predictContract.stakeToken = '0x973e69303259b0c2543a38665122b773d28405fb'
    predictContract.txId =
      '0xe25d8888942540b31c1476f5353b2584113ffed67a6f11f3dc70e1d7cadedb5f'
    predictContract.timestamp = 1699899385
    predictContract.block = 3448726
    predictContract.eventIndex = 8
    predictContract.paused = false
  }
  
  if (
    address.toHexString().toLowerCase() ==
    '0xda1e3c0ac74f2f10bb0c7635c9dc68bd3da0c95b'.toLowerCase()
  ) {
    predictContract.secondsPerEpoch = BigInt.fromI32(300)
    predictContract.secondsPerSubscription = BigInt.fromI32(86400)
    predictContract.truevalSubmitTimeout = BigInt.fromI32(259200)
    predictContract.stakeToken = '0x973e69303259b0c2543a38665122b773d28405fb'
    predictContract.txId =
      '0xc0a0f26db2c08e8217b1b98e0780a16c92d05089e5309964cbd037fc61b984e3'
    predictContract.timestamp = 1694513807
    predictContract.block = 2565998
    predictContract.eventIndex = 6
    predictContract.paused = false
  }
  
  if (
    address.toHexString().toLowerCase() ==
    '0xe71099845e51eeb930f4a087971d281e1568d47e'.toLowerCase()
  ) {
    predictContract.secondsPerEpoch = BigInt.fromI32(300)
    predictContract.secondsPerSubscription = BigInt.fromI32(86400)
    predictContract.truevalSubmitTimeout = BigInt.fromI32(259200)
    predictContract.stakeToken = '0x973e69303259b0c2543a38665122b773d28405fb'
    predictContract.txId =
      '0x9c73a9167f8192b317c9f7d65b58d4057a69a41632d030fc801c3b48ae09fc17'
    predictContract.timestamp = 1694514174
    predictContract.block = 2566065
    predictContract.eventIndex = 6
    predictContract.paused = false
  }
  
  if (
    address.toHexString().toLowerCase() ==
    '0xece66c359714da419d85ce2de07b3dbea19a329b'.toLowerCase()
  ) {
    predictContract.secondsPerEpoch = BigInt.fromI32(300)
    predictContract.secondsPerSubscription = BigInt.fromI32(86400)
    predictContract.truevalSubmitTimeout = BigInt.fromI32(259200)
    predictContract.stakeToken = '0x973e69303259b0c2543a38665122b773d28405fb'
    predictContract.txId =
      '0x2f4f6a2edc3780ef36e6252eb3b03e74e2432a600a144ede8caa63a77f06b7fe'
    predictContract.timestamp = 1699962105
    predictContract.block = 3459970
    predictContract.eventIndex = 6
    predictContract.paused = false
  }
  
  if (
    address.toHexString().toLowerCase() ==
    '0xee0fb7faa7cd805b7a9b03a88a1bf544831a42c3'.toLowerCase()
  ) {
    predictContract.secondsPerEpoch = BigInt.fromI32(3600)
    predictContract.secondsPerSubscription = BigInt.fromI32(86400)
    predictContract.truevalSubmitTimeout = BigInt.fromI32(259200)
    predictContract.stakeToken = '0x973e69303259b0c2543a38665122b773d28405fb'
    predictContract.txId =
      '0x02e55d8d28e164abdb19d4302dd54cff30ae52f59b2c454f69813b4e873f9945'
    predictContract.timestamp = 1695219908
    predictContract.block = 2683569
    predictContract.eventIndex = 6
    predictContract.paused = false
  }
  
  if (
    address.toHexString().toLowerCase() ==
    '0xf0721f9d310344cc697c6d35d4a2aa0659a4f333'.toLowerCase()
  ) {
    predictContract.secondsPerEpoch = BigInt.fromI32(300)
    predictContract.secondsPerSubscription = BigInt.fromI32(86400)
    predictContract.truevalSubmitTimeout = BigInt.fromI32(259200)
    predictContract.stakeToken = '0x973e69303259b0c2543a38665122b773d28405fb'
    predictContract.txId =
      '0x6de58138e18bf21a6cb893e4dcb6d732b4007deed0ad8e29284e95bc30c65f40'
    predictContract.timestamp = 1694514354
    predictContract.block = 2566098
    predictContract.eventIndex = 6
    predictContract.paused = false
  }
  
  if (
    address.toHexString().toLowerCase() ==
    '0xfe588188c1021e5feeb5d5870e2ba222e07791c0'.toLowerCase()
  ) {
    predictContract.secondsPerEpoch = BigInt.fromI32(300)
    predictContract.secondsPerSubscription = BigInt.fromI32(86400)
    predictContract.truevalSubmitTimeout = BigInt.fromI32(259200)
    predictContract.stakeToken = '0x973e69303259b0c2543a38665122b773d28405fb'
    predictContract.txId =
      '0x4ae6d83c3d717d58701d03c98be53710079eaa2447d06857824660d832ad9e35'
    predictContract.timestamp = 1697813788
    predictContract.block = 3083747
    predictContract.eventIndex = 6
    predictContract.paused = false
  }
  // testnet contracts done

  // mainnet from here on

  if (
    address.toHexString().toLowerCase() ==
    '0x18f54cc21b7a2fdd011bea06bba7801b280e3151'.toLowerCase()
  ) {
    predictContract.secondsPerEpoch = BigInt.fromI32(300)
    predictContract.secondsPerSubscription = BigInt.fromI32(86400)
    predictContract.truevalSubmitTimeout = BigInt.fromI32(259200)
    predictContract.stakeToken = '0x39d22b78a7651a76ffbde2aaab5fd92666aca520'
    predictContract.txId =
      '0xc6bdecd2c06b1c7fe350f0d375e14a3f0312756c4a659e8edfbf74567acba77e'
    predictContract.timestamp = 1696238187
    predictContract.block = 916047
    predictContract.eventIndex = 6
    predictContract.paused = false
  }

  if (
    address.toHexString().toLowerCase() ==
    '0x2d8e2267779d27c2b3ed5408408ff15d9f3a3152'.toLowerCase()
  ) {
    predictContract.secondsPerEpoch = BigInt.fromI32(3600)
    predictContract.secondsPerSubscription = BigInt.fromI32(86400)
    predictContract.truevalSubmitTimeout = BigInt.fromI32(259200)
    predictContract.stakeToken = '0x39d22b78a7651a76ffbde2aaab5fd92666aca520'
    predictContract.txId =
      '0xa974299eb88b5166b09fc35810e7ed5daf3e481a924b40d5d4e27c4c95224d1b'
    predictContract.timestamp = 1696238800
    predictContract.block = 916127
    predictContract.eventIndex = 6
    predictContract.paused = false
  }

  if (
    address.toHexString().toLowerCase() ==
    '0x30f1c55e72fe105e4a1fbecdff3145fc14177695'.toLowerCase()
  ) {
    predictContract.secondsPerEpoch = BigInt.fromI32(300)
    predictContract.secondsPerSubscription = BigInt.fromI32(86400)
    predictContract.truevalSubmitTimeout = BigInt.fromI32(259200)
    predictContract.stakeToken = '0x39d22b78a7651a76ffbde2aaab5fd92666aca520'
    predictContract.txId =
      '0xce9b9c9d7ca722c9e2e4aaf44bfa7072a895a6dc1c322ab3100b305248fc0e8b'
    predictContract.timestamp = 1696238041
    predictContract.block = 916022
    predictContract.eventIndex = 6
    predictContract.paused = false
  }

  if (
    address.toHexString().toLowerCase() ==
    '0x31fabe1fc9887af45b77c7d1e13c5133444ebfbd'.toLowerCase()
  ) {
    predictContract.secondsPerEpoch = BigInt.fromI32(300)
    predictContract.secondsPerSubscription = BigInt.fromI32(86400)
    predictContract.truevalSubmitTimeout = BigInt.fromI32(259200)
    predictContract.stakeToken = '0x39d22b78a7651a76ffbde2aaab5fd92666aca520'
    predictContract.txId =
      '0x5af1471bff7a5c6faed640c7b9b00013b5c9601ba10fb89ecc3119171a1de7aa'
    predictContract.timestamp = 1696238094
    predictContract.block = 916031
    predictContract.eventIndex = 6
    predictContract.paused = false
  }

  if (
    address.toHexString().toLowerCase() ==
    '0x3fb744c3702ff2237fc65f261046ead36656f3bc'.toLowerCase()
  ) {
    predictContract.secondsPerEpoch = BigInt.fromI32(300)
    predictContract.secondsPerSubscription = BigInt.fromI32(86400)
    predictContract.truevalSubmitTimeout = BigInt.fromI32(259200)
    predictContract.stakeToken = '0x39d22b78a7651a76ffbde2aaab5fd92666aca520'
    predictContract.txId =
      '0x70276e2fa7abb87d6852d3a7cb6b349c53763351de458d7eb26207d02a37cdcf'
    predictContract.timestamp = 1696238281
    predictContract.block = 916063
    predictContract.eventIndex = 6
    predictContract.paused = false
  }

  if (
    address.toHexString().toLowerCase() ==
    '0x55c6c33514f80b51a1f1b63c8ba229feb132cedb'.toLowerCase()
  ) {
    predictContract.secondsPerEpoch = BigInt.fromI32(300)
    predictContract.secondsPerSubscription = BigInt.fromI32(86400)
    predictContract.truevalSubmitTimeout = BigInt.fromI32(259200)
    predictContract.stakeToken = '0x39d22b78a7651a76ffbde2aaab5fd92666aca520'
    predictContract.txId =
      '0x248d3e16ff7a75c8e944576955c9e54711f05e3fb9cb79269c67770c79ba9d63'
    predictContract.timestamp = 1696238134
    predictContract.block = 916038
    predictContract.eventIndex = 6
    predictContract.paused = false
  }

  if (
    address.toHexString().toLowerCase() ==
    '0x74a61f733bd9a2ce40d2e39738fe4912925c06dd'.toLowerCase()
  ) {
    predictContract.secondsPerEpoch = BigInt.fromI32(3600)
    predictContract.secondsPerSubscription = BigInt.fromI32(86400)
    predictContract.truevalSubmitTimeout = BigInt.fromI32(259200)
    predictContract.stakeToken = '0x39d22b78a7651a76ffbde2aaab5fd92666aca520'
    predictContract.txId =
      '0xa5581593120b51dfb93e4cfd2af041a15a344a405e94cd3f6ed43869089e86ac'
    predictContract.timestamp = 1696239037
    predictContract.block = 916151
    predictContract.eventIndex = 6
    predictContract.paused = false
  }

  if (
    address.toHexString().toLowerCase() ==
    '0x8165caab33131a4ddbf7dc79f0a8a4920b0b2553'.toLowerCase()
  ) {
    predictContract.secondsPerEpoch = BigInt.fromI32(3600)
    predictContract.secondsPerSubscription = BigInt.fromI32(86400)
    predictContract.truevalSubmitTimeout = BigInt.fromI32(259200)
    predictContract.stakeToken = '0x39d22b78a7651a76ffbde2aaab5fd92666aca520'
    predictContract.txId =
      '0x38d03c539ea164cce6e0a1b2fe17c7d49b25ec83a496ae2fa62bd050ecb06b6e'
    predictContract.timestamp = 1696238489
    predictContract.block = 916097
    predictContract.eventIndex = 6
    predictContract.paused = false
  }

  if (
    address.toHexString().toLowerCase() ==
    '0x93f9d558ccde9ea371a20d36bd3ba58c7218b48f'.toLowerCase()
  ) {
    predictContract.secondsPerEpoch = BigInt.fromI32(3600)
    predictContract.secondsPerSubscription = BigInt.fromI32(86400)
    predictContract.truevalSubmitTimeout = BigInt.fromI32(259200)
    predictContract.stakeToken = '0x39d22b78a7651a76ffbde2aaab5fd92666aca520'
    predictContract.txId =
      '0xe9f300bde7ec4a97c212a442d26cbd4b19437b871a29121e1abd5727b8ee2530'
    predictContract.timestamp = 1696239260
    predictContract.block = 916176
    predictContract.eventIndex = 6
    predictContract.paused = false
  }

  if (
    address.toHexString().toLowerCase() ==
    '0x9c4a2406e5aa0f908d6e816e5318b9fc8a507e1f'.toLowerCase()
  ) {
    predictContract.secondsPerEpoch = BigInt.fromI32(300)
    predictContract.secondsPerSubscription = BigInt.fromI32(86400)
    predictContract.truevalSubmitTimeout = BigInt.fromI32(259200)
    predictContract.stakeToken = '0x39d22b78a7651a76ffbde2aaab5fd92666aca520'
    predictContract.txId =
      '0x2362e758cdef66d19a23a7247d284c5ad91f0bec94f77aa197a6932a7e86f8e1'
    predictContract.timestamp = 1696238432
    predictContract.block = 916088
    predictContract.eventIndex = 6
    predictContract.paused = false
  }

  if (
    address.toHexString().toLowerCase() ==
    '0xa2d9dbbdf21c30bb3e63d16ba75f644ac11a0cf0'.toLowerCase()
  ) {
    predictContract.secondsPerEpoch = BigInt.fromI32(3600)
    predictContract.secondsPerSubscription = BigInt.fromI32(86400)
    predictContract.truevalSubmitTimeout = BigInt.fromI32(259200)
    predictContract.stakeToken = '0x39d22b78a7651a76ffbde2aaab5fd92666aca520'
    predictContract.txId =
      '0x6d2e3101a010a59ccf0523df75cbb282005fb549bc2df0921d1e80492d6bd170'
    predictContract.timestamp = 1696238863
    predictContract.block = 916135
    predictContract.eventIndex = 6
    predictContract.paused = false
  }

  if (
    address.toHexString().toLowerCase() ==
    '0xaa6515c138183303b89b98aea756b54f711710c5'.toLowerCase()
  ) {
    predictContract.secondsPerEpoch = BigInt.fromI32(3600)
    predictContract.secondsPerSubscription = BigInt.fromI32(86400)
    predictContract.truevalSubmitTimeout = BigInt.fromI32(259200)
    predictContract.stakeToken = '0x39d22b78a7651a76ffbde2aaab5fd92666aca520'
    predictContract.txId =
      '0x00e15733c922283fa243ce4a73e3ae636c66c0cabb7b1a81f40d4e5d05e1c1c7'
    predictContract.timestamp = 1696238618
    predictContract.block = 916108
    predictContract.eventIndex = 6
    predictContract.paused = false
  }

  if (
    address.toHexString().toLowerCase() ==
    '0xb1c55346023dee4d8b0d7b10049f0c8854823766'.toLowerCase()
  ) {
    predictContract.secondsPerEpoch = BigInt.fromI32(300)
    predictContract.secondsPerSubscription = BigInt.fromI32(86400)
    predictContract.truevalSubmitTimeout = BigInt.fromI32(259200)
    predictContract.stakeToken = '0x39d22b78a7651a76ffbde2aaab5fd92666aca520'
    predictContract.txId =
      '0x643032ac88f837dca705aebf5f87dd024e6885ae4231606d17b4bc9f225a71b9'
    predictContract.timestamp = 1696238333
    predictContract.block = 916072
    predictContract.eventIndex = 6
    predictContract.paused = false
  }

  if (
    address.toHexString().toLowerCase() ==
    '0xbe09c6e3f2341a79f74898b8d68c4b5818a2d434'.toLowerCase()
  ) {
    predictContract.secondsPerEpoch = BigInt.fromI32(300)
    predictContract.secondsPerSubscription = BigInt.fromI32(86400)
    predictContract.truevalSubmitTimeout = BigInt.fromI32(259200)
    predictContract.stakeToken = '0x39d22b78a7651a76ffbde2aaab5fd92666aca520'
    predictContract.txId =
      '0xfd5700b09e1952f37bbff34b0b9d85f2887b81635ca0cf598bbfe373b273b798'
    predictContract.timestamp = 1696238240
    predictContract.block = 916056
    predictContract.eventIndex = 6
    predictContract.paused = false
  }

  if (
    address.toHexString().toLowerCase() ==
    '0xd41ffee162905b45b65fa6b6e4468599f0490065'.toLowerCase()
  ) {
    predictContract.secondsPerEpoch = BigInt.fromI32(3600)
    predictContract.secondsPerSubscription = BigInt.fromI32(86400)
    predictContract.truevalSubmitTimeout = BigInt.fromI32(259200)
    predictContract.stakeToken = '0x39d22b78a7651a76ffbde2aaab5fd92666aca520'
    predictContract.txId =
      '0x193d1060b4920aa9d1f7759a7090eec9c456d79f505b6230af94169f6dc31956'
    predictContract.timestamp = 1696238707
    predictContract.block = 916118
    predictContract.eventIndex = 6
    predictContract.paused = false
  }

  if (
    address.toHexString().toLowerCase() ==
    '0xd49cbfd694f4556c00023ddd3559c36af3ae0a80'.toLowerCase()
  ) {
    predictContract.secondsPerEpoch = BigInt.fromI32(3600)
    predictContract.secondsPerSubscription = BigInt.fromI32(86400)
    predictContract.truevalSubmitTimeout = BigInt.fromI32(259200)
    predictContract.stakeToken = '0x39d22b78a7651a76ffbde2aaab5fd92666aca520'
    predictContract.txId =
      '0x40814d5f0ef24f3f9cf4b215081f7528b5de154243fcf59a7b454a5bc271f560'
    predictContract.timestamp = 1696239212
    predictContract.block = 916168
    predictContract.eventIndex = 6
    predictContract.paused = false
  }

  if (
    address.toHexString().toLowerCase() ==
    '0xe66421fd29fc2d27d0724f161f01b8cbdcd69690'.toLowerCase()
  ) {
    predictContract.secondsPerEpoch = BigInt.fromI32(300)
    predictContract.secondsPerSubscription = BigInt.fromI32(86400)
    predictContract.truevalSubmitTimeout = BigInt.fromI32(259200)
    predictContract.stakeToken = '0x39d22b78a7651a76ffbde2aaab5fd92666aca520'
    predictContract.txId =
      '0x06f034e9b8bfb52e2e482ea7a32efa9eb9b4feded8c3c046ee0833378d120bac'
    predictContract.timestamp = 1696237984
    predictContract.block = 916013
    predictContract.eventIndex = 6
    predictContract.paused = false
  }

  if (
    address.toHexString().toLowerCase() ==
    '0xf28c94c55d8c5e1d70ca3a82744225a4f7570b30'.toLowerCase()
  ) {
    predictContract.secondsPerEpoch = BigInt.fromI32(300)
    predictContract.secondsPerSubscription = BigInt.fromI32(86400)
    predictContract.truevalSubmitTimeout = BigInt.fromI32(259200)
    predictContract.stakeToken = '0x39d22b78a7651a76ffbde2aaab5fd92666aca520'
    predictContract.txId =
      '0xe24cd880f5be9be7ce49309ddfebbaea5cce0cbbfc52a5d265705956efdcafe9'
    predictContract.timestamp = 1696238391
    predictContract.block = 916081
    predictContract.eventIndex = 6
    predictContract.paused = false
  }

  if (
    address.toHexString().toLowerCase() ==
    '0xf8c34175fc1f1d373ec67c4fd1f1ce57c69c3fb3'.toLowerCase()
  ) {
    predictContract.secondsPerEpoch = BigInt.fromI32(3600)
    predictContract.secondsPerSubscription = BigInt.fromI32(86400)
    predictContract.truevalSubmitTimeout = BigInt.fromI32(259200)
    predictContract.stakeToken = '0x39d22b78a7651a76ffbde2aaab5fd92666aca520'
    predictContract.txId =
      '0xced7e3cfa204914ae24d0e411a4eed8c3a5476b96c4bee00c77e55fe11fedcd6'
    predictContract.timestamp = 1696238944
    predictContract.block = 916143
    predictContract.eventIndex = 6
    predictContract.paused = false
  }

  if (
    address.toHexString().toLowerCase() ==
    '0xfa69b2c1224cebb3b6a36fb5b8c3c419afab08dd'.toLowerCase()
  ) {
    predictContract.secondsPerEpoch = BigInt.fromI32(3600)
    predictContract.secondsPerSubscription = BigInt.fromI32(86400)
    predictContract.truevalSubmitTimeout = BigInt.fromI32(259200)
    predictContract.stakeToken = '0x39d22b78a7651a76ffbde2aaab5fd92666aca520'
    predictContract.txId =
      '0xa252cf012e10da7a99ab26933a4fb273b289e82eb012463ee6e1a1f14f2617a5'
    predictContract.timestamp = 1696239124
    predictContract.block = 916159
    predictContract.eventIndex = 6
    predictContract.paused = false
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