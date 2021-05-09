import { Address, BigInt, ethereum, log } from '@graphprotocol/graph-ts'
import {
  Activated,
  Deactivated,
  AcceptedMinter,
  RemovedMinter,
  TokensDispensed,
  OwnerWithdrawed,
  Dispenser as DispenserEntity
} from '../@types/Dispenser/Dispenser'

import { Dispenser, DispenserTransactions } from '../@types/schema'

import { tokenToDecimal } from '../helpers'

function _processDispenserUpdate(
  event: ethereum.Event,
  datatoken: string,
  contractAddress: Address
): void {
  let dispenser = Dispenser.load(datatoken)
  if (!dispenser) dispenser = new Dispenser(datatoken)
  const dispenserEntity = DispenserEntity.bind(contractAddress)
  const dispenserStatus = dispenserEntity.try_status(
    Address.fromString(datatoken)
  )
  if (dispenserStatus.reverted) return
  dispenser.active = dispenserStatus.value.value0
  dispenser.owner = dispenserStatus.value.value1.toString()
  dispenser.minterApproved = dispenserStatus.value.value2
  dispenser.isTrueMinter = dispenserStatus.value.value3
  dispenser.maxTokens = tokenToDecimal(
    dispenserStatus.value.value4.toBigDecimal(),
    18
  )
  dispenser.maxBalance = tokenToDecimal(
    dispenserStatus.value.value5.toBigDecimal(),
    18
  )
  dispenser.balance = tokenToDecimal(
    dispenserStatus.value.value6.toBigDecimal(),
    18
  )
  dispenser.save()
}

export function handleDispenserActivated(event: Activated): void {
  _processDispenserUpdate(
    event,
    event.params.datatokenAddress.toHexString(),
    event.address
  )
}

export function handleDispenserDeactivated(event: Deactivated): void {
  _processDispenserUpdate(
    event,
    event.params.datatokenAddress.toHexString(),
    event.address
  )
}
export function handleDispenserAcceptedMinter(event: AcceptedMinter): void {
  _processDispenserUpdate(
    event,
    event.params.datatokenAddress.toHexString(),
    event.address
  )
}
export function handleDispenserRemovedMinter(event: RemovedMinter): void {
  _processDispenserUpdate(
    event,
    event.params.datatokenAddress.toHexString(),
    event.address
  )
}

export function handleDispenserTokensDispensed(event: TokensDispensed): void {
  _processDispenserUpdate(
    event,
    event.params.datatokenAddress.toHexString(),
    event.address
  )
  const tx = event.transaction.hash
  const id = tx
    .toHexString()
    .concat('-')
    .concat(event.params.datatokenAddress.toHexString())
  const dispensers = new DispenserTransactions(id)
  dispensers.dispenserId = event.params.datatokenAddress.toHexString()
  dispensers.datatoken = event.params.datatokenAddress.toHexString()
  dispensers.user = event.params.userAddress.toHexString()
  dispensers.amount = tokenToDecimal(
    event.params.amount.toBigDecimal(),
    BigInt.fromI32(18).toI32()
  )
  dispensers.block = event.block.number.toI32()
  dispensers.timestamp = event.block.timestamp.toI32()
  dispensers.tx = tx
  dispensers.type = 'dispense'
  dispensers.save()
}

export function handleDispenserOwnerWithdrawed(event: OwnerWithdrawed): void {
  _processDispenserUpdate(
    event,
    event.params.datatoken.toHexString(),
    event.address
  )
  const tx = event.transaction.hash
  const id = tx
    .toHexString()
    .concat('-')
    .concat(event.params.datatoken.toHexString())
  const dispensers = new DispenserTransactions(id)
  dispensers.dispenserId = event.params.datatoken.toHexString()
  dispensers.datatoken = event.params.datatoken.toHexString()
  dispensers.user = event.params.owner.toHexString()
  dispensers.amount = tokenToDecimal(
    event.params.amount.toBigDecimal(),
    BigInt.fromI32(18).toI32()
  )
  dispensers.block = event.block.number.toI32()
  dispensers.timestamp = event.block.timestamp.toI32()
  dispensers.tx = tx
  dispensers.type = 'withdraw'
  dispensers.save()
}
