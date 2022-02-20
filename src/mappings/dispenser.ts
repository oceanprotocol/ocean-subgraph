import {
  DispenserActivated,
  DispenserAllowedSwapperChanged,
  DispenserDeactivated,
  OwnerWithdrawed,
  TokensDispensed
} from '../@types/Dispenser/Dispenser'
import { DispenserCreated } from '../@types/ERC721Factory/ERC721Factory'
import { Dispenser, DispenserTransaction } from '../@types/schema'
import { decimal } from './utils/constants'
import {
  getDispenser,
  getDispenserGraphID,
  updateDispenserDetails
} from './utils/dispenserUtils'
import { weiToDecimal } from './utils/generic'
import { addDispenser } from './utils/globalUtils'
import { getToken } from './utils/tokenUtils'
import { getUser } from './utils/userUtils'

export function handleNewDispenser(event: DispenserCreated): void {
  const dispenserID = getDispenserGraphID(
    event.address,
    event.params.datatokenAddress
  )
  const dispenser = new Dispenser(dispenserID)
  const token = getToken(event.params.datatokenAddress, false)
  dispenser.token = token.id

  dispenser.owner = event.params.owner.toHexString()
  dispenser.maxBalance = weiToDecimal(
    event.params.maxBalance.toBigDecimal(),
    token.decimals
  )
  dispenser.maxTokens = weiToDecimal(
    event.params.maxTokens.toBigDecimal(),
    token.decimals
  )
  dispenser.active = true

  dispenser.allowedSwapper = event.params.allowedSwapper.toHex()
  dispenser.createdTimestamp = event.block.timestamp.toI32()
  dispenser.tx = event.transaction.hash.toHex()
  dispenser.block = event.block.number.toI32()
  dispenser.save()

  addDispenser()
  updateDispenserDetails(event.address, event.params.datatokenAddress)
}

export function handleActivate(event: DispenserActivated): void {
  const dispenserID = getDispenserGraphID(
    event.address,
    event.params.datatokenAddress
  )
  const dispenser = getDispenser(dispenserID)
  dispenser.active = true
  dispenser.save()
}

export function handleDeactivate(event: DispenserDeactivated): void {
  const dispenserID = getDispenserGraphID(
    event.address,
    event.params.datatokenAddress
  )
  const dispenser = getDispenser(dispenserID)
  dispenser.active = true
  dispenser.save()
}

export function handleAllowedSwapperChanged(
  event: DispenserAllowedSwapperChanged
): void {
  const dispenserID = getDispenserGraphID(event.address, event.params.datatoken)
  const dispenser = getDispenser(dispenserID)
  dispenser.allowedSwapper = event.params.newAllowedSwapper.toHex()
  dispenser.save()
}

export function handleTokensDispensed(event: TokensDispensed): void {
  const dispenserID = getDispenserGraphID(
    event.address,
    event.params.datatokenAddress
  )
  const id = event.transaction.hash
    .toHexString()
    .concat('-')
    .concat(dispenserID)

  const dispenserTransaction = new DispenserTransaction(id)
  const dispenser = getDispenser(dispenserID)
  updateDispenserDetails(event.address, event.params.datatokenAddress)
  dispenserTransaction.dispenser = dispenser.id
  const user = getUser(event.params.userAddress.toHex())
  dispenserTransaction.user = user.id

  dispenserTransaction.createdTimestamp = event.block.timestamp.toI32()
  dispenserTransaction.tx = event.transaction.hash.toHex()
  dispenserTransaction.block = event.block.number.toI32()
  const token = getToken(event.params.datatokenAddress, true)
  dispenserTransaction.amount = weiToDecimal(
    event.params.amount.toBigDecimal(),
    token.decimals
  )
  dispenserTransaction.save()
}

export function handleOwnerWinthdraw(event: OwnerWithdrawed): void {
  const dispenserID = getDispenserGraphID(event.address, event.params.datatoken)
  const dispenser = getDispenser(dispenserID)
  dispenser.balance = decimal.ZERO
  dispenser.save()
}
