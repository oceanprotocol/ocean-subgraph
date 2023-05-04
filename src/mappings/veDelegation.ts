import { BigDecimal, BigInt } from '@graphprotocol/graph-ts'
import { VeDelegationUpdate } from '../@types/schema'
import {
  BurnBoost,
  DelegateBoost,
  ExtendBoost,
  TransferBoost
} from '../@types/veDelegation/veDelegation'
import { weiToDecimal } from './utils/generic'
import { getveDelegation, getveOCEAN } from './utils/veUtils'

export function handleDelegation(event: DelegateBoost): void {
  const _delegator = event.params._delegator.toHex()
  const _receiver = event.params._receiver.toHex()
  const _tokenId = event.params._token_id
  const _amount = event.params._amount
  const _cancelTime = event.params._cancel_time
  const _expireTime = event.params._expire_time
  // create veOcean if does not exists
  getveOCEAN(_receiver)
  const delegator = getveOCEAN(_delegator)

  const veDelegation = getveDelegation(event.address, _tokenId.toHex())
  veDelegation.delegator = _delegator
  veDelegation.receiver = _receiver
  veDelegation.tokenId = _tokenId
  veDelegation.amount = weiToDecimal(
    _amount.toBigDecimal(),
    BigInt.fromI32(18).toI32()
  )
  veDelegation.lockedAmount = delegator.lockedAmount
  veDelegation.cancelTime = _cancelTime
  veDelegation.expireTime = _expireTime
  veDelegation.save()

  const veDelegationUpdate = new VeDelegationUpdate(
    event.transaction.hash.toHex() + '-' + event.logIndex.toString()
  )
  veDelegationUpdate.type = 0
  veDelegationUpdate.veDelegation = veDelegation.id
  veDelegationUpdate.block = event.block.number.toI32()
  veDelegationUpdate.timestamp = event.block.timestamp.toI32()
  veDelegationUpdate.tx = event.transaction.hash.toHex()
  veDelegationUpdate.amount = veDelegation.amount
  veDelegationUpdate.cancelTime = _cancelTime
  veDelegationUpdate.expireTime = _expireTime
  veDelegationUpdate.sender = event.transaction.from.toHex()
  veDelegationUpdate.save()
}

export function handleExtendBoost(event: ExtendBoost): void {
  const _delegator = event.params._delegator.toHex()
  const _receiver = event.params._receiver.toHex()
  const _tokenId = event.params._token_id
  const _amount = event.params._amount
  const _cancelTime = event.params._cancel_time
  const _expireTime = event.params._expire_time
  // create veOcean if does not exists
  getveOCEAN(_receiver)
  getveOCEAN(_delegator)
  // it's possible to not have veDelegation object, because we missed handleDelegation
  // that should not happend, but we create the object anyway
  const veDelegation = getveDelegation(event.address, _tokenId.toHex())
  veDelegation.delegator = _delegator
  veDelegation.receiver = _receiver
  veDelegation.tokenId = _tokenId
  veDelegation.amount = weiToDecimal(
    _amount.toBigDecimal(),
    BigInt.fromI32(18).toI32()
  )
  veDelegation.cancelTime = _cancelTime
  veDelegation.expireTime = _expireTime
  veDelegation.save()

  const veDelegationUpdate = new VeDelegationUpdate(
    event.transaction.hash.toHex() + '-' + event.logIndex.toString()
  )
  veDelegationUpdate.veDelegation = veDelegation.id
  veDelegationUpdate.type = 1
  veDelegationUpdate.block = event.block.number.toI32()
  veDelegationUpdate.timestamp = event.block.timestamp.toI32()
  veDelegationUpdate.tx = event.transaction.hash.toHex()
  veDelegationUpdate.amount = veDelegation.amount
  veDelegationUpdate.cancelTime = _cancelTime
  veDelegationUpdate.expireTime = _expireTime
  veDelegationUpdate.sender = event.transaction.from.toHex()
  veDelegationUpdate.save()
}

export function handleTransferBoost(event: TransferBoost): void {
  // TODO not sure if we need this
  // --------------------------------
  // const _from = event.params._from
  // const _to = event.params._to
  // const _tokenId = event.params._token_id
  // const _amount = event.params._amount
  // const _expireTime = event.params._expire_time
}
export function handleBurnBoost(event: BurnBoost): void {
  const _tokenId = event.params._token_id

  // delete
  const veDelegation = getveDelegation(event.address, _tokenId.toHex())
  veDelegation.amount = BigDecimal.zero()
  veDelegation.save()

  const veDelegationUpdate = new VeDelegationUpdate(
    event.transaction.hash.toHex() + '-' + event.logIndex.toString()
  )
  veDelegationUpdate.veDelegation = veDelegation.id
  veDelegationUpdate.type = 2
  veDelegationUpdate.block = event.block.number.toI32()
  veDelegationUpdate.timestamp = event.block.timestamp.toI32()
  veDelegationUpdate.tx = event.transaction.hash.toHex()
  veDelegationUpdate.amount = veDelegation.amount
  veDelegationUpdate.cancelTime = veDelegation.cancelTime
  veDelegationUpdate.expireTime = veDelegation.expireTime
  veDelegationUpdate.sender = event.transaction.from.toHex()
  veDelegationUpdate.save()
}
