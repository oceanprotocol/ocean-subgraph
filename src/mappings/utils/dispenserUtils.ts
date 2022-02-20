import { Dispenser } from '../../@types/schema'
import { getToken } from './tokenUtils'
import { Address, BigDecimal } from '@graphprotocol/graph-ts'
import { weiToDecimal } from './generic'
import { Dispenser as DispenserContract } from '../../@types/Dispenser/Dispenser'

export function getDispenserGraphID(
  contractAddress: Address,
  datatokenAddress: Address
): string {
  return contractAddress.toHexString() + '-' + datatokenAddress.toHexString()
}

export function createDispenser(dispenserID: string): Dispenser {
  const dispenser = new Dispenser(dispenserID)
  dispenser.save()
  return dispenser
}

export function getDispenser(dispenserID: string): Dispenser {
  let dispenser = Dispenser.load(dispenserID)
  if (dispenser === null) {
    dispenser = createDispenser(dispenserID)
  }
  return dispenser
}

export function updateDispenserBalance(
  contractAddress: Address,
  datatokenAddress: Address
): BigDecimal {
  const contract = DispenserContract.bind(contractAddress)
  const dispenserDetails = contract.try_status(datatokenAddress)
  if (dispenserDetails == null) return BigDecimal.fromString('0')
  const token = getToken(datatokenAddress, true)
  return weiToDecimal(
    dispenserDetails.value.value5.toBigDecimal(),
    token.decimals
  )
}
