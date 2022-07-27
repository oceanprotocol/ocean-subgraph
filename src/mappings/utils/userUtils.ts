import { BigInt } from '@graphprotocol/graph-ts'
import { User } from '../../@types/schema'

export function getUser(address: string): User {
  let user = User.load(address)
  if (user === null) {
    user = new User(address)
    user.totalOrders = BigInt.zero()
    user.totalSales = BigInt.zero()
    user.save()
  }

  return user
}
