import { BigInt } from '@graphprotocol/graph-ts'
import { Allocated, Claimed } from '../@types/DFRewards/DFRewards'
import { DFHistory } from '../@types/schema'
import { weiToDecimal } from './utils/generic'
import { getToken } from './utils/tokenUtils'
import { getDFReward, getDFAvailableClaim } from './utils/dfUtils'

export function handleAllocated(event: Allocated): void {
  // loop all allocations
  const token = getToken(event.params.tokenAddress, false)
  for (let i = 0; i < event.params.tos.length; i++) {
    const reward = getDFReward(event.params.tos[i])

    const history = new DFHistory(
      event.params.tos[i].toHexString() +
        '-' +
        event.transaction.hash.toHex() +
        '-' +
        event.logIndex.toString()
    )
    history.amount = weiToDecimal(
      event.params.values[i].toBigDecimal(),
      BigInt.fromI32(token.decimals).toI32()
    )
    history.receiver = reward.id
    history.token = token.id
    history.type = 'Allocated'
    history.timestamp = event.block.timestamp
    history.tx = event.transaction.hash.toHex()
    history.block = event.block.number.toI32()
    history.eventId = event.logIndex
    history.save()

    // update available claims
    const claim = getDFAvailableClaim(
      event.params.tos[i],
      event.params.tokenAddress
    )
    claim.amount = claim.amount.plus(history.amount)
    claim.save()
  }
}

export function handleClaimed(event: Claimed): void {
  // loop all allocations
  const token = getToken(event.params.tokenAddress, false)
  const reward = getDFReward(event.params.to)
  const history = new DFHistory(
    event.transaction.hash.toHex() + '-' + event.logIndex.toString()
  )
  history.amount = weiToDecimal(
    event.params.value.toBigDecimal(),
    BigInt.fromI32(token.decimals).toI32()
  )
  history.receiver = reward.id
  history.token = token.id
  history.type = 'Claimed'
  history.timestamp = event.block.timestamp
  history.tx = event.transaction.hash.toHex()
  history.block = event.block.number.toI32()
  history.eventId = event.logIndex
  history.save()

  // update available claims
  const claim = getDFAvailableClaim(event.params.to, event.params.tokenAddress)
  claim.amount = claim.amount.minus(history.amount)
  claim.save()
}
