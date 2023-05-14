import {
  PredictSubscription,
  PredictPayout,
  PredictPrediction,
  PredictTrueVals,
  PredictSlot,
  PredictSettingUpdate,
  PredictContract
} from '../@types/schema'
import { BigInt, BigDecimal, Address, log } from '@graphprotocol/graph-ts'

import {
  PredictionSubmitted,
  PredictionPayout,
  NewSubscription,
  TruevalSubmitted,
  SettingChanged,
  RevenueAdded
} from '../@types/templates/ERC20Template3/ERC20Template3'

import { weiToDecimal } from './utils/generic'
import { getPredictContract, getToken } from './utils/tokenUtils'
import { getUser } from './utils/userUtils'

function getPredictSlot(
  predictContractAddress: string,
  slot: BigInt
): PredictSlot {
  const id = predictContractAddress + '-' + slot.toString()
  let newPredictSlot = PredictSlot.load(id)
  if (newPredictSlot === null) {
    newPredictSlot = new PredictSlot(id)
    newPredictSlot.predictContract = predictContractAddress
    newPredictSlot.slot = slot
    newPredictSlot.revenue = BigDecimal.zero()
    newPredictSlot.status = 'Pending'
    newPredictSlot.save()
  }
  return newPredictSlot
}

export function handlePredictionSubmitted(event: PredictionSubmitted): void {
  const predictSlot = getPredictSlot(
    event.address.toHexString(),
    event.params.slot
  )
  const user = getUser(event.params.predictoor.toHex())
  const id =
    event.address.toHexString() +
    '-' +
    event.params.slot.toString() +
    '-' +
    user.id
  const predictPrediction = new PredictPrediction(id)
  predictPrediction.slot = predictSlot.id
  predictPrediction.user = user.id
  const predictContract = getPredictContract(event.address)
  let decimals = 18
  if (predictContract.stakeToken) {
    const stakeToken = getToken(
      Address.fromString(predictContract.stakeToken!),
      false
    )
    decimals = stakeToken.decimals
  }
  predictPrediction.stake = weiToDecimal(
    event.params.stake.toBigDecimal(),
    BigInt.fromI32(decimals).toI32()
  )
  predictPrediction.payout = null
  predictPrediction.block = event.block.number.toI32()
  predictPrediction.txId = event.transaction.hash.toHexString()
  predictPrediction.eventIndex = event.logIndex.toI32()
  predictPrediction.timestamp = event.block.timestamp.toI32()
  predictPrediction.save()
}

export function handlePredictionPayout(event: PredictionPayout): void {
  // TODO
}

export function handleNewSubscription(event: NewSubscription): void {
  // TODO
}

export function handleTruevalSubmitted(event: TruevalSubmitted): void {
  // TODO
}

export function handleSettingChanged(event: SettingChanged): void {
  const predictContract = getPredictContract(event.address)
  predictContract.blocksPerEpoch = event.params.blocksPerEpoch
  predictContract.blocksPerSubscription = event.params.blocksPerSubscription
  predictContract.truevalSubmitTimeoutBlock =
    event.params.trueValueSubmitTimeoutBlock
  const stakeToken = getToken(event.params.stakeToken, false)
  predictContract.stakeToken = stakeToken.id
  predictContract.save()
  const predictSettingsUpdate = new PredictSettingUpdate(
    event.address.toHexString() +
      '- ' +
      event.transaction.hash.toHexString() +
      '-' +
      event.logIndex.toHexString()
  )
  predictSettingsUpdate.block = event.block.number.toI32()
  predictSettingsUpdate.txId = event.transaction.hash.toHexString()
  predictSettingsUpdate.eventIndex = event.logIndex.toI32()
  predictSettingsUpdate.timestamp = event.block.timestamp.toI32()
  predictSettingsUpdate.predictContract = predictContract.id
  predictSettingsUpdate.blocksPerEpoch = event.params.blocksPerEpoch
  predictSettingsUpdate.blocksPerSubscription =
    event.params.blocksPerSubscription
  predictSettingsUpdate.truevalSubmitTimeoutBlock =
    event.params.trueValueSubmitTimeoutBlock
  predictSettingsUpdate.stakeToken = stakeToken.id
  predictSettingsUpdate.save()
}

export function handleRevenueAdded(event: RevenueAdded): void {
  // TODO
}
