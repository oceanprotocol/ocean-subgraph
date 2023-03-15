import { Address, BigDecimal } from '@graphprotocol/graph-ts'
import { DFAvailableClaim, DFReward } from '../../@types/schema'
import { getUser } from './userUtils'

export function createDFReward(address: Address, txId: String): DFReward {
  const dfRewards = new DFReward(address.toHexString())
  const user = getUser(address.toHexString())
  dfRewards.txId = txId
  dfRewards.receiver = user.id
  dfRewards.save()
  return dfRewards
}

export function getDFReward(address: Address, txId: String): DFReward {
  let dfRewards = DFReward.load(address.toHexString())
  if (dfRewards === null) {
    dfRewards = createDFReward(address, txId)
  }
  return dfRewards
}

export function getDFAvailableClaim(
  user: Address,
  token: Address,
  txId: String
): DFAvailableClaim {
  const id = user.toHexString() + '-' + token.toHexString()
  let dfClaim = DFAvailableClaim.load(id)
  if (dfClaim == null) {
    dfClaim = new DFAvailableClaim(id)
    dfClaim.txId = txId
    dfClaim.receiver = user.toHexString()
    dfClaim.amount = BigDecimal.zero()
    dfClaim.token = token.toHexString()
  }
  return dfClaim
}
