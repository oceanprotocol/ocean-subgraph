import { Deposit, Supply, Withdraw } from '../@types/veOCEAN/veOCEAN'
import { weiToDecimal } from './utils/generic'
import { getDeposit, getveOCEAN } from './utils/veUtils'

export function handleDeposit(event: Deposit): void {
  const provider = event.params.provider
  const value = event.params.value
  const locktime = event.params.locktime
  const type = event.params.type
  const ts = event.params.ts

  const veOCEAN = getveOCEAN(provider.toHex())
  // Create new Deposit entity
  const deposit = getDeposit(provider.toHex() + '-' + locktime.toString())
  deposit.provider = provider.toHex()
  deposit.value = weiToDecimal(value.toBigDecimal(), 18)
  deposit.unlockTime = locktime
  deposit.type = type
  deposit.timestamp = ts
  deposit.block = event.block.number.toI32()
  deposit.tx = event.transaction.hash.toHex()
  deposit.sender = event.transaction.from.toHex()
  deposit.veOcean = veOCEAN.id
  deposit.save()
  // --------------------------------------------

  const lockedAmount = weiToDecimal(value.toBigDecimal(), 18)
  veOCEAN.unlockTime = locktime
  veOCEAN.lockedAmount = veOCEAN.lockedAmount.plus(lockedAmount)
  veOCEAN.block = event.block.number.toI32()
  veOCEAN.save()
}
export function handleSupply(event: Supply): void {}
export function handleWithdraw(event: Withdraw): void {}
