import { Address, log } from '@graphprotocol/graph-ts'
import { Nft, Token } from '../../@types/schema'
import { ERC20 } from '../../@types/templates/ERC20Template/ERC20'
import { ERC20Template, ERC721Template } from '../../@types/templates'
import { addNft } from './globalUtils'

export function createToken(address: Address, isDatatoken: boolean): Token {
  log.debug('started creating token with address: {}', [address.toHexString()])
  if (isDatatoken) {
    ERC20Template.create(address)
  }
  const token = new Token(address.toHexString())
  const contract = ERC20.bind(address)
  token.name = contract.name()
  token.symbol = contract.symbol()
  token.address = address.toHexString()
  token.isDatatoken = false
  token.decimals = contract.decimals()
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
  log.debug('started creating nft token with address: {}', [
    address.toHexString()
  ])
  ERC721Template.create(address)
  const token = new Nft(address.toHexString())
  // const contract = ERC721Template.bind(address)
  token.name = ''
  token.symbol = ''
  token.address = address.toHexString()
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
