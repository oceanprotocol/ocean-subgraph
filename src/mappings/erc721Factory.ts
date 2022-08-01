import { NFTCreated, TokenCreated } from '../@types/ERC721Factory/ERC721Factory'
import { decimal } from './utils/constants'
import { weiToDecimal } from './utils/generic'

import { getUser } from './utils/userUtils'
import { getToken, getNftToken } from './utils/tokenUtils'
import { addDatatoken, getTemplates } from './utils/globalUtils'
import { log } from '@graphprotocol/graph-ts'

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
  nft.transferable = event.params.transferable

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

  token.nft = event.params.creator.toHexString()

  token.name = event.params.name
  token.symbol = event.params.symbol
  token.decimals = 18
  token.supply = decimal.ZERO
  token.cap = weiToDecimal(event.params.cap.toBigDecimal(), 18)
  const templateAddress = event.params.templateAddress
  let existingContracts: string[]
  const templates = getTemplates()
  if (!templates.fixedRateTemplates) existingContracts = []
  else existingContracts = templates.ssTemplates as string[]

  log.info(
    '\n\n\n**********\n\n\n***********\n\n\nAddress is template:\n{}\n\n\n************\n\n\n*********\n\n\n',
    [existingContracts[0]]
  )
  log.info(
    '\n\n\n**********\n\n\n***********\n\n\nAddress is template:\n{}\n\n\n************\n\n\n*********\n\n\n',
    [existingContracts[1]]
  )
  log.info(
    '\n\n\n**********\n\n\n***********\n\n\nChecking if templates work! \n[0]:\n{}\n\n\n************\n\n\n*********\n\n\n',
    [templateAddress.toHexString()]
  )

  token.save()
  addDatatoken()
}
