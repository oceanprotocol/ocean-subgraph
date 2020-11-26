
import { BigInt, Address, Bytes, store, BigDecimal } from '@graphprotocol/graph-ts'
import { OrderStarted, Transfer } from '../types/templates/Datatoken/Datatoken'
import { Datatoken as DatatokenTemplate } from '../types/templates/Datatoken/Datatoken'
import { log } from '@graphprotocol/graph-ts'

import {
    OceanDatatokens,
    Datatoken, PoolShare, Pool, User, TokenBalance, TokenOrder
} from '../types/schema'
import {
    hexToDecimal,
    bigIntToDecimal,
    tokenToDecimal,
    createTokenBalanceEntity,
    updateDatatokenBalance,
    saveTokenTransaction,
    ZERO_BD, createPoolShareEntity, createUserEntity
} from './helpers'

/************************************
 ********** Pool Controls ***********
 ************************************/

export function handleTransfer(event: Transfer): void {
  let tokenId = event.address.toHex()

  let ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'

  let isMint = event.params.from.toHex() == ZERO_ADDRESS
  let isBurn = event.params.to.toHex() == ZERO_ADDRESS

  let amount = tokenToDecimal(event.params.value.toBigDecimal(), 18)
  let tokenShareFrom = event.params.from.toHex()
  let tokenShareTo = event.params.to.toHex()
  let tokenBalanceFromId = tokenId.concat('-').concat(event.params.from.toHex())
  let tokenBalanceToId = tokenId.concat('-').concat(event.params.to.toHex())
  let tokenBalanceFrom = TokenBalance.load(tokenBalanceFromId)
  let tokenBalanceTo = TokenBalance.load(tokenBalanceToId)
  let oldBalanceFrom = BigDecimal.fromString('0.0')
  let oldBalanceTo = BigDecimal.fromString('0.0')

  let datatoken = Datatoken.load(tokenId)

  if (isMint) {
    createTokenBalanceEntity(tokenBalanceToId, tokenId, tokenShareTo)
    tokenBalanceTo = TokenBalance.load(tokenBalanceToId)
    let user = User.load(tokenShareTo)
    oldBalanceTo = tokenBalanceTo.balance
    tokenBalanceTo.balance += amount
    tokenBalanceTo.save()
    datatoken.supply += amount
  } else if (isBurn) {
    createTokenBalanceEntity(tokenBalanceFromId, tokenId, tokenShareFrom)
    tokenBalanceFrom = TokenBalance.load(tokenBalanceFromId)
    let user = User.load(tokenShareFrom)
    oldBalanceFrom = tokenBalanceFrom.balance
    tokenBalanceFrom.balance -= amount
    tokenBalanceFrom.save()
    datatoken.supply -= amount
  } else {

    createTokenBalanceEntity(tokenBalanceFromId, tokenId, tokenShareFrom)
    let userFrom = User.load(tokenShareFrom)
    tokenBalanceFrom = TokenBalance.load(tokenBalanceFromId)
    oldBalanceFrom = tokenBalanceFrom.balance
    tokenBalanceFrom.balance -= amount
    tokenBalanceFrom.save()

    createTokenBalanceEntity(tokenBalanceToId, tokenId, tokenShareTo)
    let userTo = User.load(tokenShareTo)
    tokenBalanceTo = TokenBalance.load(tokenBalanceToId)
    oldBalanceTo = tokenBalanceTo.balance
    tokenBalanceTo.balance += amount
    tokenBalanceTo.save()
  }

  if (
    tokenBalanceTo !== null
    && tokenBalanceTo.balance.notEqual(ZERO_BD)
    && oldBalanceTo.equals(ZERO_BD)
  ) {
    datatoken.holdersCount += BigInt.fromI32(1)
  }

  if (
    tokenBalanceFrom !== null
    && tokenBalanceFrom.balance.equals(ZERO_BD)
    && oldBalanceFrom.notEqual(ZERO_BD)
  ) {
    datatoken.holdersCount -= BigInt.fromI32(1)
  }

  datatoken.save()
}

export function handleOrderStarted(event: OrderStarted): void {
  let ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'
  let tokenId = event.address.toHex()
  let datatoken = Datatoken.load(tokenId)
  if (datatoken == null) return


  let payer = event.params.payer.toHex()
  // let feeCollector = event.params.mrktFeeCollector
  // let marketFee = event.params.marketFee
  let tx = event.transaction.hash
  let orderId = tokenId.concat('-').concat(payer).concat('-').concat(tx.toHexString())
  let order = TokenOrder.load(orderId)
  if (order == null) {
      order = new TokenOrder(orderId)
  }
  order.datatokenId = tokenId
  order.amount = tokenToDecimal(event.params.amount.toBigDecimal(), 18)
  order.consumer = event.params.consumer.toHex()
  order.payer = payer
  order.serviceId = event.params.serviceId.toI32()
  order.timestamp = event.params.timestamp.toI32()
  if (event.params.mrktFeeCollector != null && event.params.mrktFeeCollector.toHex() != ZERO_ADDRESS) {
      order.marketFeeCollector = event.params.mrktFeeCollector.toHexString()
  }
  order.marketFee = tokenToDecimal(event.params.marketFee.toBigDecimal(), 18)
  order.tx = tx

  order.save()
  datatoken.orderCount = datatoken.orderCount + BigInt.fromI32(1)
  datatoken.save()
}
