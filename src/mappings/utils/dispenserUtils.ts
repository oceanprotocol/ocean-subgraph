import { Dispenser } from '../../@types/schema'
import { getToken } from './tokenUtils'
import { Address } from '@graphprotocol/graph-ts'

export function createDispenser(address: string): Dispenser {
  const dispenser = new Dispenser(address)
  dispenser.token = getToken(Address.fromString(address), true).id
  dispenser.save()
  return dispenser
}

export function getDispenser(address: string): Dispenser {
  let dispenser = Dispenser.load(address)
  if (dispenser === null) {
    dispenser = createDispenser(address)
  }
  return dispenser
}
