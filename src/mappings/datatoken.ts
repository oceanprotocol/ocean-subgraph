import { BigInt, BigDecimal } from '@graphprotocol/graph-ts'
import { OrderStarted, Transfer } from '../types/templates/DataToken/DataToken'

import { Datatoken, TokenBalance, TokenOrder } from '../types/schema'
import {
  tokenToDecimal,
  updateTokenBalance,
  ZERO_BD,
  MINUS_1_BD,
  saveTokenTransaction
} from '../helpers'

/************************************
 ********** Pool Controls ***********
 ************************************/

export function handleTransfer(event: Transfer): void {
  const tokenId = event.address.toHex()

  const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'

  const amount = tokenToDecimal(event.params.value.toBigDecimal(), 18)
  const tokenShareFrom = event.params.from.toHex()
  const tokenShareTo = event.params.to.toHex()
  const tokenBalanceFromId = tokenId.concat('-').concat(tokenShareFrom)
  const tokenBalanceToId = tokenId.concat('-').concat(tokenShareTo)
  let tokenBalanceFrom = TokenBalance.load(tokenBalanceFromId)
  let tokenBalanceTo = TokenBalance.load(tokenBalanceToId)
  let oldBalanceFrom = BigDecimal.fromString('0.0')
  let oldBalanceTo = BigDecimal.fromString('0.0')

  const isMint = tokenShareFrom == ZERO_ADDRESS
  const isBurn = tokenShareTo == ZERO_ADDRESS

  const datatoken = Datatoken.load(tokenId)

  if (isMint) {
    tokenBalanceTo = TokenBalance.load(tokenBalanceToId)
    oldBalanceTo = tokenBalanceTo == null ? ZERO_BD : tokenBalanceTo.balance
    datatoken.supply = datatoken.supply.plus(amount)
    updateTokenBalance(tokenBalanceToId, tokenId, tokenShareTo, amount)
  } else if (isBurn) {
    tokenBalanceFrom = TokenBalance.load(tokenBalanceFromId)
    oldBalanceFrom =
      tokenBalanceFrom == null ? ZERO_BD : tokenBalanceFrom.balance
    datatoken.supply = datatoken.supply.minus(amount)
    updateTokenBalance(
      tokenBalanceFromId,
      tokenId,
      tokenShareFrom,
      amount.times(MINUS_1_BD)
    )
  } else {
    tokenBalanceFrom = TokenBalance.load(tokenBalanceFromId)
    oldBalanceFrom =
      tokenBalanceFrom == null ? ZERO_BD : tokenBalanceFrom.balance
    datatoken.supply = datatoken.supply.minus(amount)
    updateTokenBalance(
      tokenBalanceFromId,
      tokenId,
      tokenShareFrom,
      amount.times(MINUS_1_BD)
    )

    tokenBalanceTo = TokenBalance.load(tokenBalanceToId)
    oldBalanceTo = tokenBalanceTo == null ? ZERO_BD : tokenBalanceTo.balance
    datatoken.supply = datatoken.supply.plus(amount)
    updateTokenBalance(tokenBalanceToId, tokenId, tokenShareTo, amount)
  }

  if (
    tokenBalanceTo != null &&
    tokenBalanceTo.balance.notEqual(ZERO_BD) &&
    oldBalanceTo.equals(ZERO_BD)
  ) {
    datatoken.holderCount += BigInt.fromI32(1)
  }

  if (
    tokenBalanceFrom != null &&
    tokenBalanceFrom.balance.equals(ZERO_BD) &&
    oldBalanceFrom.notEqual(ZERO_BD)
  ) {
    datatoken.holderCount -= BigInt.fromI32(1)
  }

  datatoken.save()
  saveTokenTransaction(event, 'Transfer')
}

export function handleOrderStarted(event: OrderStarted): void {
  const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'
  const tokenId = event.address.toHex()
  const datatoken = Datatoken.load(tokenId)
  if (datatoken == null) return

  const payer = event.params.payer.toHex()
  // let feeCollector = event.params.mrktFeeCollector
  // let marketFee = event.params.marketFee
  const tx = event.transaction.hash
  const orderId = tokenId
    .concat('-')
    .concat(payer)
    .concat('-')
    .concat(tx.toHexString())
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
  if (
    event.params.mrktFeeCollector != null &&
    event.params.mrktFeeCollector.toHex() != ZERO_ADDRESS
  ) {
    order.marketFeeCollector = event.params.mrktFeeCollector.toHexString()
  }
  order.marketFee = tokenToDecimal(event.params.marketFee.toBigDecimal(), 18)
  order.tx = tx

  order.save()

  datatoken.orderCount = datatoken.orderCount.plus(BigInt.fromI32(1))
  datatoken.save()

  saveTokenTransaction(event, 'OrderStarted')
}
