import { BigInt, log } from '@graphprotocol/graph-ts'
import { TokenRegistered } from '../@types/DTFactory/DTFactory'
import {
  DatatokenFactory,
  Datatoken as DatatokenEntity
} from '../@types/schema'
import { DataToken as DatatokenDataSource } from '../@types/templates'

import { createUserEntity, tokenToDecimal, ZERO_BD } from '../helpers'

export function handleNewToken(event: TokenRegistered): void {
  let factory = DatatokenFactory.load('1')

  // if no factory yet, set up blank initial
  if (factory == null) {
    factory = new DatatokenFactory('1')
    factory.tokenCount = 0
  }

  const datatoken = new DatatokenEntity(event.params.tokenAddress.toHexString())
  log.warning('************************ handleNewToken: datatokenId {}', [
    datatoken.id.toString()
  ])

  datatoken.factoryID = event.address.toHexString()

  datatoken.symbol = event.params.tokenSymbol
  datatoken.name = event.params.tokenName
  datatoken.decimals = 18
  datatoken.address = event.params.tokenAddress.toHexString()
  datatoken.cap = tokenToDecimal(event.params.tokenCap.toBigDecimal(), 18)
  datatoken.supply = ZERO_BD

  createUserEntity(event.params.registeredBy.toHex())
  datatoken.minter = event.params.registeredBy.toHex()
  datatoken.publisher = event.params.registeredBy.toHex()

  datatoken.holderCount = BigInt.fromI32(0)
  datatoken.orderCount = BigInt.fromI32(0)
  datatoken.orderVolume = BigInt.fromI32(0).toBigDecimal()
  datatoken.metadataUpdateCount = BigInt.fromI32(0)

  datatoken.createTime = event.block.timestamp.toI32()
  datatoken.tx = event.transaction.hash
  datatoken.save()

  factory.tokenCount = factory.tokenCount + 1
  factory.save()

  DatatokenDataSource.create(event.params.tokenAddress)
}
