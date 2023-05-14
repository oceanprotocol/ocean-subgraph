import {
  PredictSubscription,
  PredictPayout,
  PredictPrediction,
  PredictTrueVals,
  PredictSlot,
  PredictSettingUpdate,
  PredictionRevenue
} from '../@types/schema'
import { BigInt, BigDecimal, Address } from '@graphprotocol/graph-ts'

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
  const user = getUser(event.params.predictoor.toHex())
  const predictionId =
    event.address.toHexString() +
    '-' +
    event.params.slot.toString() +
    '-' +
    user.id
  const predictPrediction = PredictPrediction.load(predictionId)
  if (!predictPrediction) return
  const predictionPayout = new PredictPayout(predictionId)
  predictionPayout.prediction = predictPrediction.id
  let decimals = 18
  const predictContract = getPredictContract(event.address)
  if (predictContract.stakeToken) {
    const stakeToken = getToken(
      Address.fromString(predictContract.stakeToken!),
      false
    )
    decimals = stakeToken.decimals
  }
  predictionPayout.payout = weiToDecimal(
    event.params.payout.toBigDecimal(),
    BigInt.fromI32(decimals).toI32()
  )
  predictionPayout.predictedValue = event.params.predictedValue
  predictionPayout.trueValue = event.params.trueValue
  predictionPayout.aggregatedPredictedValue = weiToDecimal(
    event.params.aggregatedPredictedValue.toBigDecimal(),
    18
  )
  predictionPayout.block = event.block.number.toI32()
  predictionPayout.txId = event.transaction.hash.toHexString()
  predictionPayout.eventIndex = event.logIndex.toI32()
  predictionPayout.timestamp = event.block.timestamp.toI32()
  predictionPayout.save()
}

export function handleNewSubscription(event: NewSubscription): void {
  const id =
    event.address.toHexString() +
    '-' +
    event.transaction.hash.toString() +
    '-' +
    event.logIndex.toString()
  const newSubscription = new PredictSubscription(id)
  const predictContract = getPredictContract(event.address)
  newSubscription.predictContract = predictContract.id
  const user = getUser(event.params.user.toHex())
  newSubscription.user = user.id
  newSubscription.expireTime = event.params.expires
  newSubscription.block = event.block.number.toI32()
  newSubscription.txId = event.transaction.hash.toHexString()
  newSubscription.eventIndex = event.logIndex.toI32()
  newSubscription.timestamp = event.block.timestamp.toI32()
  newSubscription.save()
}

export function handleTruevalSubmitted(event: TruevalSubmitted): void {
  const predictSlot = getPredictSlot(
    event.address.toHexString(),
    event.params.slot
  )
  const newPredictTrueVals = new PredictTrueVals(predictSlot.id) // they share the same id
  newPredictTrueVals.slot = predictSlot.id
  newPredictTrueVals.trueValue = event.params.trueValue
  newPredictTrueVals.block = event.block.number.toI32()
  newPredictTrueVals.txId = event.transaction.hash.toHexString()
  newPredictTrueVals.eventIndex = event.logIndex.toI32()
  newPredictTrueVals.timestamp = event.block.timestamp.toI32()
  newPredictTrueVals.save()
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
  /*
   for (uint256 i = 0; i < num_epochs; i++) {
                // TODO FIND A WAY TO ACHIEVE THIS WITHOUT A LOOP
                subscriptionRevenueAtBlock[
                    slot + blocksPerEpoch * (i)
                ] += amt_per_epoch;
            }
    emit RevenueAdded(amount,slot,amt_per_epoch,num_epochs,blocksPerEpoch);
  */
  const numEpochs = event.params.numEpochs
  const blocksPerEpoch = event.params.blocksPerEpoch
  let decimals = 18
  const predictContract = getPredictContract(event.address)
  if (predictContract.stakeToken) {
    const stakeToken = getToken(
      Address.fromString(predictContract.stakeToken!),
      false
    )
    decimals = stakeToken.decimals
  }
  const amountPerEpoch = weiToDecimal(
    event.params.amountPerEpoch.toBigDecimal(),
    BigInt.fromI32(decimals).toI32()
  )
  const slot = event.params.slot
  for (let i = BigInt.zero(); i.lt(numEpochs); i = i.plus(BigInt.fromI32(1))) {
    const targetSlot = slot.plus(blocksPerEpoch.times(i))
    const predictSlot = getPredictSlot(event.address.toHexString(), targetSlot)
    predictSlot.revenue = predictSlot.revenue.plus(amountPerEpoch)
    predictSlot.save()
    const revenueId =
      event.address.toHexString() +
      '-' +
      targetSlot.toString() +
      '-' +
      event.transaction.hash.toHexString() +
      '-' +
      event.logIndex.toHexString()
    const predictRevenue = new PredictionRevenue(revenueId)
    predictRevenue.slot = predictSlot.id
    predictRevenue.amount = amountPerEpoch
    predictRevenue.block = event.block.number.toI32()
    predictRevenue.txId = event.transaction.hash.toHexString()
    predictRevenue.eventIndex = event.logIndex.toI32()
    predictRevenue.timestamp = event.block.timestamp.toI32()
    predictRevenue.save()
  }
}
