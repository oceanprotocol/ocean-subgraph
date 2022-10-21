import { Dispenser } from '../../@types/schema'
import { getToken } from './tokenUtils'
import { Address, log } from '@graphprotocol/graph-ts'
import { weiToDecimal } from './generic'
import { Dispenser as DispenserContract } from '../../@types/templates/Dispenser/Dispenser'

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

export function updateDispenserDetails(
  contractAddress: Address,
  datatokenAddress: Address
): void {
  try {
    const dispenserID = getDispenserGraphID(contractAddress, datatokenAddress)
    const dispenser = getDispenser(dispenserID)
    const contract = DispenserContract.bind(contractAddress)
    const dispenserDetails = contract.try_status(datatokenAddress)
    if (dispenserDetails == null) return
    const token = getToken(datatokenAddress, true)
    dispenser.balance = weiToDecimal(
      dispenserDetails.value.value5.toBigDecimal(),
      token.decimals
    )
    dispenser.isMinter = dispenserDetails.value.value2
    dispenser.active = dispenserDetails.value.value0
    dispenser.save()
  } catch (error) {
    log.error(
      'Failed to update dispenser details , address: {}, dtAddress: {}',
      [contractAddress.toHexString(), datatokenAddress.toString()]
    )
  }
}
