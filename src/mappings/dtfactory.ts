import { Address, BigInt, BigDecimal } from '@graphprotocol/graph-ts'
import { TokenRegistered } from '../types/DTFactory/DTFactory'
import { OceanDatatokens, Datatoken } from '../types/schema'
import { Datatoken as DatatokenContract } from '../types/templates'
import {
  ZERO_BD,
} from './helpers'
import { log } from '@graphprotocol/graph-ts'

export function handleNewToken(event: TokenRegistered): void {
  let factory = OceanDatatokens.load('1')

  // if no factory yet, set up blank initial
  if (factory == null) {
    factory = new OceanDatatokens('1')
    factory.tokenCount = 0
    factory.txCount = BigInt.fromI32(0)
  }

  let datatoken = new Datatoken(event.params.tokenAddress.toHexString())
  log.error('************************ handleNewToken: datatokenId {}', [datatoken.id.toString()])
  datatoken.minter = event.params.registeredBy
  datatoken.publisher = event.params.registeredBy
  datatoken.supply = ZERO_BD
  datatoken.createTime = event.block.timestamp.toI32()
  datatoken.holdersCount = BigInt.fromI32(0)
  datatoken.factoryID = event.address.toHexString()
  datatoken.tx = event.transaction.hash
  datatoken.save()

  factory.tokenCount = factory.tokenCount + 1
  factory.save()

  DatatokenContract.create(event.params.tokenAddress)
}