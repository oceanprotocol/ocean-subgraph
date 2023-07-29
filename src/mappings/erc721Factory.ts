import {
  NFTCreated,
  TokenCreated,
  Template721Added,
  Template20Added
} from '../@types/ERC721Factory/ERC721Factory'
import { Erc721Template, Erc20Template } from '../@types/schema'
import { decimal } from './utils/constants'
import { weiToDecimal } from './utils/generic'
import {
  ERC20Template as factoryERC20Template,
  ERC20Template3 as factoryERC20Template3
} from '../@types/templates'
import { getUser } from './utils/userUtils'
import {
  getToken,
  getNftToken,
  getErc20TemplateId,
  getPredictContract
} from './utils/tokenUtils'
import { BigInt } from '@graphprotocol/graph-ts'
import { addDatatoken } from './utils/globalUtils'

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
  if (token.templateId === BigInt.fromString('3')) {
    factoryERC20Template3.create(event.params.newTokenAddress)
    const predictContract = getPredictContract(event.params.newTokenAddress)
    predictContract.timestamp = event.block.timestamp.toI32()
    predictContract.txId = event.transaction.hash.toHex()
    predictContract.block = event.block.number.toI32()
    predictContract.eventIndex = event.logIndex.toI32()
    predictContract.save()
  }
  factoryERC20Template.create(event.params.newTokenAddress)
}

export function handleNew721Template(event: Template721Added): void {
  let template = Erc721Template.load(
    event.params._templateAddress.toHexString()
  )
  if (template === null) {
    template = new Erc721Template(event.params._templateAddress.toHexString())
    template.templateId = event.params.nftTemplateCount
    template.save()
  }
}

export function handleNew20Template(event: Template20Added): void {
  let template = Erc20Template.load(event.params._templateAddress.toHexString())
  if (template === null) {
    template = new Erc20Template(event.params._templateAddress.toHexString())
    template.templateId = event.params.nftTemplateCount
    template.save()
  }
}
