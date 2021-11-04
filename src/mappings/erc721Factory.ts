import { log } from '@graphprotocol/graph-ts'
import { NFTCreated, TokenCreated } from '../@types/ERC721Factory/ERC721Factory'
import { Nft, Token } from '../@types/schema'
import { ZERO_BD } from '../helpers'

export function handleNftCreated(event: NFTCreated): void {
  const nft = new Nft(event.params.newTokenAddress.toHexString())

  nft.owner = event.params.admin.toHexString()
  nft.address = event.params.newTokenAddress.toHexString()
  nft.name = event.params.tokenName.toHex()
  nft.symbol = ''
  nft.createTime = event.block.timestamp.toI32()
  nft.tx = event.transaction.hash
  nft.block = event.block.number.toI32()

  nft.save()
}

export function handleNewToken(event: TokenCreated): void {
  const token = new Token(event.params.newTokenAddress.toHexString())
  token.isDatatoken = true
  token.address = event.params.newTokenAddress.toHexString()
  token.createTime = event.block.timestamp.toI32()
  token.tx = event.transaction.hash
  token.block = event.block.number.toI32()

  token.name = event.params.tokenName.toString()
  token.decimals = 18
  token.supply = ZERO_BD
  log.info('dt name {} ', [event.params.tokenName.toString()])
  token.save()
}
