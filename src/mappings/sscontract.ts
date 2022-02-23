import {
  VestingCreated,
  Vesting as VestingEvent
} from '../@types/templates/SSContract/SSContract'
import { Vested, Vesting } from '../@types/schema'
import { getUser } from './utils/userUtils'
import { getToken } from './utils/tokenUtils'
import { weiToDecimal } from './utils/generic'

export function handleVestingCreated(event: VestingCreated): void {
  const vesting = new Vesting(
    event.address
      .toHexString()
      .concat('-')
      .concat(event.params.datatokenAddress.toHexString())
  )
  const user = getUser(event.params.publisherAddress.toHexString())
  vesting.user = user.id
  const token = getToken(event.params.datatokenAddress, true)
  vesting.token = token.id
  vesting.endBlock = event.params.vestingEndBlock
  vesting.amount = weiToDecimal(
    event.params.totalVestingAmount.toBigDecimal(),
    token.decimals
  )
  vesting.save()
}

export function handleVesting(event: VestingEvent): void {
  const vesting = new Vesting(
    event.address
      .toHexString()
      .concat('-')
      .concat(event.params.datatokenAddress.toHexString())
  )
  const vestingHistory = new Vested(
    event.transaction.hash.toHex().concat('-').concat(event.logIndex.toString())
  )
  vestingHistory.block = event.block.number
  const token = getToken(event.params.datatokenAddress, true)
  vestingHistory.amount = weiToDecimal(
    event.params.amountVested.toBigDecimal(),
    token.decimals
  )
  vestingHistory.vesting = vesting.id
  vestingHistory.save()
}
