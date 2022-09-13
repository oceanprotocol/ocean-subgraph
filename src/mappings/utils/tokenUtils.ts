import { Address, log, BigDecimal, BigInt } from '@graphprotocol/graph-ts'
import { Nft, Token } from '../../@types/schema'
import { ERC20 } from '../../@types/templates/ERC20Template/ERC20'
import { ERC20Template, ERC721Template } from '../../@types/templates'
import { addNft } from './globalUtils'
import { ZERO_ADDRESS } from './constants'

export function createToken(address: Address, isDatatoken: boolean): Token {
  log.debug('started creating token with address: {}', [address.toHexString()])
  if (isDatatoken) {
    ERC20Template.create(address)
  }
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
  token.hasMetaData = false
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
    nftToken.hasMetaData = false
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
