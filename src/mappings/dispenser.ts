import { TokensDispensed } from '../@types/templates/Dispenser/Dispenser'
import { Datatoken } from '../@types/schema'

export function handleTokensDispensed(event: TokensDispensed): void {
  const tokenId = event.address.toHex()
  const dispensedToken = Datatoken.load(tokenId)
  dispensedToken.save()
  }