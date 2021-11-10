import { Dispenser } from '../../@types/schema'
import { getToken } from './tokenUtils'

export function createDispenser(address: string): Dispenser {
  const dispenser = new Dispenser(address)
  dispenser.datatoken = getToken(address).id
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
