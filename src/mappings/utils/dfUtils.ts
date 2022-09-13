import { Address, BigDecimal } from '@graphprotocol/graph-ts'
import { DFAvailableClaim, DFReward } from '../../@types/schema'
import { getUser } from './userUtils'

export function createDFReward(address: Address): DFReward {
  const dfRewards = new DFReward(address.toHexString())
  const user = getUser(address.toHexString())
  dfRewards.receiver = user.id
  dfRewards.save()
  return dfRewards
}

export function getDFReward(address: Address): DFReward {
  let dfRewards = DFReward.load(address.toHexString())
  if (dfRewards === null) {
    dfRewards = createDFReward(address)
  }
  return dfRewards
}

export function getDFAvailableClaim(
  user: Address,
  token: Address
): DFAvailableClaim {
  const id = user.toHexString() + '-' + token.toHexString()
  let dfClaim = DFAvailableClaim.load(id)
  if (dfClaim == null) {
    dfClaim = new DFAvailableClaim(id)
    dfClaim.receiver = user.toHexString()
    dfClaim.amount = BigDecimal.zero()
    dfClaim.token = token.toHexString()
  }
  return dfClaim
}
