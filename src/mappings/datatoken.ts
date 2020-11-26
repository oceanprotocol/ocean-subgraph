
import { BigInt, Address, Bytes, store, BigDecimal } from '@graphprotocol/graph-ts'
import { OrderStarted, Transfer } from '../types/templates/Datatoken/Datatoken'
import { Datatoken as DatatokenTemplate } from '../types/templates/Datatoken/Datatoken'
import { log } from '@graphprotocol/graph-ts'

import {
    OceanDatatokens,
    Datatoken, PoolShare, Pool, User, TokenBalance
} from '../types/schema'
import {
    hexToDecimal,
    bigIntToDecimal,
    tokenToDecimal,
    createTokenBalanceEntity,
    updateDatatokenBalance,
    saveTransaction,
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
  let oldBalanceFrom = 0
  let oldBalanceTo = 0

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

}
