import { Deposit, Supply, Withdraw } from '../@types/veOCEAN/veOCEAN'
import { weiToDecimal } from './utils/generic'
import { getDeposit, getveOCEAN } from './utils/veUtils'

export function handleDeposit(event: Deposit): void {
  const provider = event.params.provider
  const value = event.params.value
  const locktime = event.params.locktime
  const type = event.params.type
  const ts = event.params.ts

  // Create new Deposit entity
  const deposit = getDeposit(provider.toHex() + '-' + locktime.toString())
  deposit.provider = provider.toHex()
  deposit.value = weiToDecimal(value.toBigDecimal(), 18)
  deposit.unlockTime = locktime
  deposit.type = type
  deposit.timestamp = ts
  deposit.save()
  // --------------------------------------------

  const veOCEAN = getveOCEAN(provider.toHex())
  const lockedAmount = weiToDecimal(value.toBigDecimal(), 18)
  veOCEAN.unlockTime = locktime
  veOCEAN.lockedAmount = veOCEAN.lockedAmount.plus(lockedAmount)
  veOCEAN.save()

  // // calculate veOCEAN balance
  // const now = ts.toI32()
  // const totalLockTime = BigInt.fromI32(locktime.toI32() - now).toBigDecimal()
  // const MAX_TIME = BigInt.fromI32(4 * 365 * 86400).toBigDecimal()

  // log.warning('veOCEAN balance: {}, Slope:{}', [
  //   MAX_TIME.toString(),
  //   totalLockTime.toString()
  // ])
  // const slope = totalLockTime.div(MAX_TIME)
  // const bal = veOCEAN.lockedAmount.times(slope)

  // veOCEAN.balance = bal
  // // ------------------------------
}
export function handleSupply(event: Supply): void {}
export function handleWithdraw(event: Withdraw): void {}
