import { NFTCreated, TokenCreated } from '../@types/ERC721Factory/ERC721Factory'
import { Nft, Token } from '../@types/schema'
import { ZERO_BD } from '../helpers'
import { getUser } from './utils/userUtils'

export function handleNftCreated(event: NFTCreated): void {
  const nft = new Nft(event.params.newTokenAddress.toHexString())

  const user = getUser(event.params.admin.toHexString())
  nft.owner = user.id
  nft.address = event.params.newTokenAddress.toHexString()
  nft.name = event.params.tokenName.toHex()
  nft.symbol = ''
  nft.createdTimestamp = event.block.timestamp.toI32()
  nft.tx = event.transaction.hash
  nft.block = event.block.number.toI32()

  nft.save()
}

export function handleNewToken(event: TokenCreated): void {
  const token = new Token(event.params.newTokenAddress.toHexString())
  token.isDatatoken = true
  token.address = event.params.newTokenAddress.toHexString()
  token.createdTimestamp = event.block.timestamp.toI32()
  token.tx = event.transaction.hash
  token.block = event.block.number.toI32()

  token.name = event.params.tokenName.toString()
  token.decimals = 18
  token.supply = ZERO_BD
  token.save()
}
