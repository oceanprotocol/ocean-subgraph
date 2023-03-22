import { BigInt } from '@graphprotocol/graph-ts'
import {
  BurnBoost,
  DelegateBoost,
  ExtendBoost,
  TransferBoost
} from '../@types/veDelegation/veDelegation'
import { getveDelegation, getveOCEAN } from './utils/veUtils'

export function handleDelegation(event: DelegateBoost): void {
  const _delegator = event.params._delegator.toHex()
  const _receiver = event.params._receiver.toHex()
  const _tokenId = event.params._token_id
  const _amount = event.params._amount
  const _cancelTime = event.params._cancel_time
  const _expireTime = event.params._expire_time

  const veDelegation = getveDelegation(_tokenId.toHex())
  veDelegation.delegator = _delegator
  getveOCEAN(_receiver)
  const delegatorVeOcean = getveOCEAN(_delegator)
  if (_amount && delegatorVeOcean.lockedAmount) {
    veDelegation.amountFraction = _amount.divDecimal(
      delegatorVeOcean.lockedAmount
    )
  }
  veDelegation.receiver = _receiver
  veDelegation.tokenId = _tokenId
  veDelegation.amount = _amount
  veDelegation.cancelTime = _cancelTime
  veDelegation.expireTime = _expireTime
  veDelegation.block = event.block.number.toI32()
  veDelegation.save()
}

export function handleExtendBoost(event: ExtendBoost): void {
  const _delegator = event.params._delegator.toHex()
  const _receiver = event.params._receiver.toHex()
  const _tokenId = event.params._token_id
  const _amount = event.params._amount
  const _cancelTime = event.params._cancel_time
  const _expireTime = event.params._expire_time

  const veDelegation = getveDelegation(_tokenId.toHex())
  const delegatorVeOcean = getveOCEAN(_delegator)
  if (_amount && delegatorVeOcean.lockedAmount) {
    veDelegation.amountFraction = _amount.divDecimal(
      delegatorVeOcean.lockedAmount
    )
  }
  veDelegation.delegator = _delegator
  veDelegation.receiver = _receiver
  veDelegation.tokenId = _tokenId
  veDelegation.amount = _amount
  veDelegation.cancelTime = _cancelTime
  veDelegation.expireTime = _expireTime
  veDelegation.save()
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
  const veDelegation = getveDelegation(_tokenId.toHex())
  veDelegation.amount = BigInt.zero()
}
