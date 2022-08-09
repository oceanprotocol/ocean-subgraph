import { DelegateBoost } from '../@types/veDelegation/veDelegation'
import { getveDelegation } from './utils/veUtils'

export function handleDelegation(event: DelegateBoost): void {
  const _delegator = event.params._delegator.toHex()
  const _receiver = event.params._receiver.toHex()
  const _tokenId = event.params._token_id
  const _amount = event.params._amount
  const _cancelTime = event.params._cancel_time
  const _expireTime = event.params._expire_time

  const veDelegation = getveDelegation(_tokenId.toHex())
  veDelegation.delegator = _delegator
  veDelegation.receiver = _receiver
  veDelegation.tokenId = _tokenId
  veDelegation.amount = _amount
  veDelegation.cancelTime = _cancelTime
  veDelegation.expireTime = _expireTime
  veDelegation.save()
}

// TODO add handlers for
// ExtendBoost
// TransferBoost
// BurnBoost
