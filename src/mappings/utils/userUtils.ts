import { User } from '../../@types/schema'

export function getUser(address: string): User {
  let user = User.load(address)
  if (user === null) {
    user = new User(address)
    user.save()
  }

  return user
}
