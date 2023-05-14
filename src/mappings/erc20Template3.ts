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

import { integer } from './utils/constants'
import { weiToDecimal } from './utils/generic'
import { getPredictContract, getToken } from './utils/tokenUtils'
import { getUser } from './utils/userUtils'

export function handlePredictionSubmitted(event: PredictionSubmitted): void {
  // TODO
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
