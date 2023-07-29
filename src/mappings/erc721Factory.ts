import {
  NFTCreated,
  TokenCreated,
  ERC721Factory,
  Template721Added,
  Template20Added
} from '../@types/ERC721Factory/ERC721Factory'
import { Erc721Template, Erc20Template } from '../@types/schema'
import { decimal } from './utils/constants'
import { weiToDecimal } from './utils/generic'

import { getUser } from './utils/userUtils'
import {
  getToken,
  getNftToken,
  getErc721TemplateId,
  getErc20TemplateId
} from './utils/tokenUtils'
import { addDatatoken } from './utils/globalUtils'
import { BigInt } from '@graphprotocol/graph-ts'

export function handleNftCreated(event: NFTCreated): void {
  // const nft = new Nft(event.params.newTokenAddress.toHexString())
  const nft = getNftToken(event.params.newTokenAddress)
  const user = getUser(event.params.admin.toHexString())
  nft.owner = user.id
  const creator = getUser(event.params.creator.toHexString())
  nft.creator = creator.id
  nft.address = event.params.newTokenAddress.toHexString()
  nft.name = event.params.tokenName
  nft.symbol = event.params.symbol.toString()
  nft.tokenUri = event.params.tokenURI.toString()
  nft.createdTimestamp = event.block.timestamp.toI32()
  nft.tx = event.transaction.hash.toHex()
  nft.block = event.block.number.toI32()
  nft.eventIndex = event.logIndex.toI32()
  nft.transferable = event.params.transferable
  nft.template = event.params.templateAddress.toHexString()

  nft.save()
}

export function handleNewToken(event: TokenCreated): void {
  const token = getToken(event.params.newTokenAddress, true)
  // const token = new Token(event.params.newTokenAddress.toHexString())

  token.isDatatoken = true
  token.address = event.params.newTokenAddress.toHexString()
  token.createdTimestamp = event.block.timestamp.toI32()
  token.tx = event.transaction.hash.toHex()
  token.block = event.block.number.toI32()
  token.eventIndex = event.logIndex.toI32()

  token.nft = event.params.creator.toHexString()

  token.name = event.params.name
  token.symbol = event.params.symbol
  token.decimals = 18
  token.supply = decimal.ZERO
  token.cap = weiToDecimal(event.params.cap.toBigDecimal(), 18)
  token.templateId = getErc20TemplateId(event.params.templateAddress)
  token.save()
  addDatatoken()
}

export function handleNew721Template(event: Template721Added): void {
  const dbId = getErc721TemplateId(event.params._templateAddress)
  if (dbId === BigInt.zero()) {
    const template = new Erc721Template(event.params._templateAddress)
    template.templateId = event.params.nftTemplateCount
    template.save()
  }
}

export function handleNew20Template(event: Template20Added): void {
  const dbId = getErc20TemplateId(event.params._templateAddress)
  if (dbId === BigInt.zero()) {
    const template = new Erc20Template(event.params._templateAddress)
    template.templateId = event.params.nftTemplateCount
    template.save()
  }
}
