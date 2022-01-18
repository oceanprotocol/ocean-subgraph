// export function getGlobalStats(): Global {
//   let gStats: Global | null = Global.load('1')
//   if (gStats == null) {
//     gStats = new Global('1')
//     gStats.totalOceanLiquidity = ZERO_BD
//     gStats.totalSwapVolume = ZERO_BD
//     gStats.totalValueLocked = ZERO_BD
//     gStats.totalOrderVolume = ZERO_BD
//     gStats.orderCount = BigInt.fromI32(0)
//     gStats.poolCount = 0
//   }

//   return gStats
// }

// export function hexToDecimal(hexString: string, decimals: i32): BigDecimal {
//   const bytes = Bytes.fromHexString(hexString.toString()).reverse() as Bytes
//   const bi = BigInt.fromUnsignedBytes(bytes)
//   const scale = BigInt.fromI32(10)
//     .pow(decimals as u8)
//     .toBigDecimal()
//   return bi.divDecimal(scale)
// }

// export function bigIntToDecimal(amount: BigInt, decimals: i32): BigDecimal {
//   const scale = BigInt.fromI32(10)
//     .pow(decimals as u8)
//     .toBigDecimal()
//   return amount.toBigDecimal().div(scale)
// }

// export function decimalToBigInt(value: BigDecimal): BigInt {
//   value.truncate(18)
//   const scale = BigInt.fromI32(10).pow((value.exp.toI32() + 18) as u8)
//   return value.digits.times(scale)
// }

// export function isNullEthValue(value: string): boolean {
//   return (
//     value ==
//     '0x0000000000000000000000000000000000000000000000000000000000000001'
//   )
// }

// export function getTokenSymbol(tokenAddress: Address): string {
//   const contract = ERC20.bind(tokenAddress)
//   const contractSymbolBytes = ERC20SymbolBytes.bind(tokenAddress)

//   // try types string and bytes32 for symbol
//   let symbolValue = 'unknown'
//   const symbolResult = contract.try_symbol()
//   if (symbolResult.reverted) {
//     const symbolResultBytes = contractSymbolBytes.try_symbol()
//     if (!symbolResultBytes.reverted) {
//       // for broken pairs that have no symbol function exposed
//       if (!isNullEthValue(symbolResultBytes.value.toHexString())) {
//         symbolValue = symbolResultBytes.value.toString()
//       }
//     }
//   } else {
//     symbolValue = symbolResult.value
//   }

//   return symbolValue
// }

// export function getTokenName(tokenAddress: Address): string {
//   const contract = ERC20.bind(tokenAddress)
//   const contractNameBytes = ERC20NameBytes.bind(tokenAddress)

//   // try types string and bytes32 for name
//   let nameValue = 'unknown'
//   const nameResult = contract.try_name()
//   if (nameResult.reverted) {
//     const nameResultBytes = contractNameBytes.try_name()
//     if (!nameResultBytes.reverted) {
//       // for broken exchanges that have no name function exposed
//       if (!isNullEthValue(nameResultBytes.value.toHexString())) {
//         nameValue = nameResultBytes.value.toString()
//       }
//     }
//   } else {
//     nameValue = nameResult.value
//   }

//   return nameValue
// }

// export function getTokenDecimals(tokenAddress: Address): i32 {
//   const contract = ERC20.bind(tokenAddress)
//   let decimals = 18
//   const decimalCall = contract.try_decimals()
//   if (!decimalCall.reverted) {
//     decimals = decimalCall.value
//   }
//   return decimals
// }

// export function updatePoolTokenBalance(
//   poolToken: PoolToken,
//   balance: BigDecimal,
//   source: string
// ): void {
//   if (!poolToken) return
//   if (balance < ZERO_BD || poolToken.balance < ZERO_BD) {
//     poolToken.balance = balance
//   }
// }

// export function createUserEntity(address: string): void {
//   if (User.load(address) == null) {
//     const user = new User(address)
//     user.nrSales = 0
//     user.save()
//   }
// }

// export function createPoolShareEntity(
//   id: string,
//   pool: string,
//   user: string
// ): void {
//   const poolShare = new PoolShare(id)

//   createUserEntity(user)

//   poolShare.userAddress = user
//   poolShare.poolId = pool
//   poolShare.balance = ZERO_BD
//   poolShare.save()
// }

// export function createPoolTokenEntity(
//   id: string,
//   pool: string,
//   address: Address
// ): void {
//   const datatoken = Datatoken.load(address.toHexString())

//   const poolToken = new PoolToken(id)
//   poolToken.poolId = pool
//   poolToken.isDatatoken = !!datatoken
//   poolToken.tokenId = datatoken ? datatoken.id : ''
//   poolToken.address = address.toHexString()
//   poolToken.balance = ZERO_BD
//   poolToken.denormWeight = ZERO_BD
//   poolToken.symbol = getTokenSymbol(address)
//   poolToken.name = getTokenName(address)
//   poolToken.decimals = getTokenDecimals(address)
//   poolToken.save()
// }

// export function updatePoolTransactionToken(
//   poolTx: string,
//   poolTokenId: string,
//   amount: BigDecimal,
//   balance: BigDecimal,
//   feeValue: BigDecimal
// ): void {
//   const ptx = PoolTransaction.load(poolTx)
//   const poolToken = PoolToken.load(poolTokenId)

//   if (!ptx) {
//     log.error('Cannot load PoolTransaction {}', [poolTx])
//     return
//   }

//   if (!poolToken) {
//     log.error('Cannot load PoolToken {}', [poolTokenId])
//     return
//   }
//   const pool = PoolEntity.load(poolToken.poolId)
//   if (!pool) {
//     log.error('Cannot load PoolEntity {}', [poolToken.poolId])
//     return
//   }
//   const ptxTokenValuesId = poolTx.concat('-').concat(poolTokenId)
//   let ptxTokenValues = PoolTransactionTokenValues.load(ptxTokenValuesId)
//   if (ptxTokenValues == null) {
//     ptxTokenValues = new PoolTransactionTokenValues(ptxTokenValuesId)
//     log.warning('created PoolTransactionTokenValues for {}', [ptxTokenValuesId])
//   }

//   if (!ptxTokenValues) return

//   ptxTokenValues.txId = poolTx
//   ptxTokenValues.poolToken = poolTokenId
//   ptxTokenValues.poolAddress = poolToken.poolId
//   const ptxUserAddress = ptx.userAddress
//   ptxTokenValues.userAddress = ptxUserAddress ? ptxUserAddress : ''
//   const poolTokenAddress = poolToken.address
//   ptxTokenValues.tokenAddress = poolTokenAddress ? poolTokenAddress : ''

//   ptxTokenValues.value = amount
//   ptxTokenValues.tokenReserve = balance
//   ptxTokenValues.feeValue = feeValue
//   if (amount.lt(ZERO_BD)) {
//     ptxTokenValues.type = 'out'
//   } else {
//     ptxTokenValues.type = 'in'
//   }

//   ptxTokenValues.save()

//   if (ptxTokenValues.tokenAddress == OCEAN) {
//     const factory = PoolFactory.load('1')
//     if (factory !== null) {
//       factory.totalOceanLiquidity = factory.totalOceanLiquidity
//         .plus(ptxTokenValues.tokenReserve)
//         .minus(pool.oceanReserve)

//       const gStats: Global = getGlobalStats()
//       if (gStats !== null) {
//         gStats.totalOceanLiquidity = factory.totalOceanLiquidity

//         gStats.save()
//       }

//       ptx.oceanReserve = ptxTokenValues.tokenReserve
//       pool.oceanReserve = ptxTokenValues.tokenReserve
//       factory.save()
//     }
//   } else {
//     ptx.datatokenReserve = ptxTokenValues.tokenReserve
//     pool.datatokenReserve = ptxTokenValues.tokenReserve
//   }
//   ptx.save()
//   pool.save()
// }

// export function calcSpotPrice(
//   balanceIn: BigDecimal,
//   wIn: BigDecimal,
//   balanceOut: BigDecimal,
//   wOut: BigDecimal,
//   swapFee: BigDecimal
// ): BigDecimal {
//   if (balanceIn <= ZERO_BD || balanceOut <= ZERO_BD) return MINUS_1_BD

//   const numer = balanceIn.div(wIn)
//   const denom = balanceOut.div(wOut)
//   if (denom <= ZERO_BD) return MINUS_1_BD

//   const ratio = numer.div(denom)
//   const scale = ONE_BD.div(ONE_BD.minus(swapFee))
//   const price = ratio.times(scale)
//   price.truncate(18)
//   return price
// }

// export function createPoolTransaction(
//   event: ethereum.Event,
//   // eslint-disable-next-line camelcase
//   event_type: string,
//   userAddress: string
// ): void {
//   const poolId = event.address.toHex()
//   const pool = PoolEntity.load(poolId)
//   if (!pool) return
//   const ptx = event.transaction.hash.toHexString()

//   const ocnToken = PoolToken.load(poolId.concat('-').concat(OCEAN))
//   const dtToken = PoolToken.load(
//     poolId.concat('-').concat(pool.datatokenAddress)
//   )
//   if (ocnToken == null || dtToken == null) {
//     return
//   }

//   let poolTx = PoolTransaction.load(ptx)
//   if (poolTx != null) {
//     return
//   }
//   poolTx = new PoolTransaction(ptx)

//   poolTx.poolAddress = poolId
//   poolTx.userAddress = userAddress
//   poolTx.poolAddressStr = poolId
//   poolTx.userAddressStr = userAddress

//   poolTx.sharesTransferAmount = ZERO_BD
//   poolTx.sharesBalance = ZERO_BD

//   // pool.datatokenReserve = dtToken.balance
//   // pool.oceanReserve = ocnToken.balance
//   // Initial reserve values, will be updated in `updatePoolTransactionToken`
//   poolTx.datatokenReserve = dtToken.balance
//   poolTx.oceanReserve = ocnToken.balance

//   const p = Pool.bind(Address.fromString(poolId))

//   const priceResult = p.try_calcInGivenOut(
//     decimalToBigInt(ocnToken.balance),
//     decimalToBigInt(ocnToken.denormWeight),
//     decimalToBigInt(dtToken.balance),
//     decimalToBigInt(dtToken.denormWeight),
//     ONE_BASE_18,
//     decimalToBigInt(pool.swapFee)
//   )

//   poolTx.consumePrice = priceResult.reverted
//     ? MINUS_1_BD
//     : bigIntToDecimal(priceResult.value, 18)

//   const priceSpot = p.try_calcSpotPrice(
//     decimalToBigInt(ocnToken.balance),
//     decimalToBigInt(ocnToken.denormWeight),
//     decimalToBigInt(dtToken.balance),
//     decimalToBigInt(dtToken.denormWeight),
//     decimalToBigInt(pool.swapFee)
//   )
//   poolTx.spotPrice = priceSpot.reverted
//     ? ZERO_BD
//     : bigIntToDecimal(priceSpot.value, 18)

//   pool.consumePrice = poolTx.consumePrice
//   pool.spotPrice = poolTx.spotPrice
//   const oldValueLocked = pool.valueLocked
//   const spotPrice = pool.spotPrice >= ZERO_BD ? pool.spotPrice : ZERO_BD
//   pool.valueLocked = poolTx.oceanReserve.plus(
//     poolTx.datatokenReserve.times(spotPrice)
//   )
//   const factory = PoolFactory.load('1')
//   if (!factory) return
//   if (factory.totalValueLocked !== null) {
//     const tvl = factory.totalValueLocked

//     factory.totalValueLocked = tvl
//       ? tvl.minus(oldValueLocked).plus(pool.valueLocked)
//       : BigDecimal.fromString('0')
//   }

//   const gStats: Global = getGlobalStats()
//   if (gStats !== null) {
//     gStats.totalValueLocked = factory.totalValueLocked
//     gStats.save()
//   }

//   pool.transactionCount = pool.transactionCount.plus(BigInt.fromI32(1))

//   pool.save()
//   factory.save()

//   poolTx.tx = event.transaction.hash
//   // eslint-disable-next-line camelcase
//   poolTx.event = event_type
//   poolTx.block = event.block.number.toI32()
//   poolTx.timestamp = event.block.timestamp.toI32()
//   //  Property 'gasUsed' does not exist on type '~lib/@graphprotocol/graph-ts/chain/ethereum/ethereum.Transaction'
//   // poolTx.gasUsed = event.transaction.gasUsed.toBigDecimal()
//   poolTx.gasPrice = event.transaction.gasPrice.toBigDecimal()

//   poolTx.save()
// }

// export function decrPoolCount(finalized: boolean): void {
//   const factory = PoolFactory.load('1')
//   if (!factory) return
//   factory.poolCount -= 1
//   if (finalized) factory.finalizedPoolCount -= 1
//   factory.save()
// }

// export function saveTokenTransaction(
//   event: ethereum.Event,
//   eventName: string
// ): void {
//   const tx = event.transaction.hash
//     .toHexString()
//     .concat('-')
//     .concat(event.logIndex.toString())
//   const userAddress = event.transaction.from.toHex()
//   let transaction = TokenTransaction.load(tx)
//   if (transaction == null) {
//     transaction = new TokenTransaction(tx)
//   }
//   transaction.event = eventName
//   transaction.datatokenAddress = event.address.toHex()
//   transaction.userAddress = userAddress
//   // transaction.gasUsed = event.transaction.gasUsed.toBigDecimal()
//   transaction.gasPrice = event.transaction.gasPrice.toBigDecimal()
//   transaction.tx = event.transaction.hash
//   transaction.timestamp = event.block.timestamp.toI32()
//   transaction.block = event.block.number.toI32()
//   transaction.save()

//   createUserEntity(userAddress)
// }

// export function updateTokenBalance(
//   id: string,
//   token: string,
//   user: string,
//   amount: BigDecimal
// ): void {
//   let tokenBalance = TokenBalance.load(id)
//   if (tokenBalance == null) {
//     tokenBalance = new TokenBalance(id)
//     createUserEntity(user)
//     tokenBalance.userAddress = user
//     tokenBalance.datatokenId = token
//     tokenBalance.balance = ZERO_BD
//   }

//   tokenBalance.balance = tokenBalance.balance.plus(amount)
//   tokenBalance.save()
// }
