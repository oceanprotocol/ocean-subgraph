import { Address } from '@graphprotocol/graph-ts'
import { Token } from '../../@types/schema'
import { ERC20 } from '../../@types/templates/ERC20Template/ERC20'
import { integer } from './constants'
import { getGlobalStats } from './globalUtils'

export function createToken(address: string): Token {
  const token = new Token(address)
  const contract = ERC20.bind(Address.fromString(address))
  token.name = contract.name()
  token.symbol = contract.symbol()
  token.address = address
  token.isDatatoken = false
  token.decimals = contract.decimals()
  const globalStats = getGlobalStats()
  globalStats.datatokenCount = globalStats.datatokenCount.plus(integer.ONE)

  globalStats.save()
  token.save()
  return token
}

export function getToken(address: string): Token {
  let newToken = Token.load(address)
  if (newToken === null) {
    newToken = createToken(address)
  }
  return newToken
}
