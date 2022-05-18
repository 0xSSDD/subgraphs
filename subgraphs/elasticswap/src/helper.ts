import { Address, BigDecimal, BigInt } from "@graphprotocol/graph-ts";
import {
  Exchange,
  ExchangeDayData,
  ExchangeHourData,
} from "../generated/schema";
import { Exchange as ExchangeContract } from "../generated/ExchangeFactory/Exchange";
import { ERC20 } from "../generated/ExchangeFactory/ERC20";

export enum TransactionType {
  SWAP,
  AddLIQUIDITY,
  REMOVELIQUIDITY,
  TRANSFER,
}

export function updateExchangeTotalSupplyAndPrice(
  exchangeAddress: Address
): void {
  let exchangeContract = ExchangeContract.bind(exchangeAddress);
  let exchange = Exchange.load(exchangeAddress.toHexString());
  exchange!.totalSupply = exchangeContract.totalSupply();
  exchange!.baseTokenQty = ERC20.bind(exchangeContract.baseToken())
    .balanceOf(exchangeContract._address)
    .toBigDecimal();
  exchange!.quoteTokenQty = ERC20.bind(exchangeContract.quoteToken())
    .balanceOf(exchangeContract._address)
    .toBigDecimal();

  let x = exchange!.baseTokenQty;
  let y = exchange!.quoteTokenQty;
  let k = x.times(y);

  exchange!.baseTokenPrice = x.div(y);
  exchange!.quoteTokenPrice = y.div(x);

  exchange!.save();
}

export function updateNumberOfTransactions(
  exchangeAddress: Address,
  eventTimestamp: BigInt,
  transactionType: TransactionType
): void {
  let timestamp = eventTimestamp.toI32();

  let dayID = timestamp / 86400;
  let dayStartTimestamp = dayID * 86400;
  let dayExchangeID = exchangeAddress
    .toHexString()
    .concat("-")
    .concat(BigInt.fromI32(dayID).toString());

  let hourId = timestamp / 3600;
  let hourStartTimestamp = hourId * 3600;
  let hourExchangeID = exchangeAddress
    .toHexString()
    .concat("-")
    .concat(BigInt.fromI32(hourId).toString());

  let exchange = Exchange.load(exchangeAddress.toHexString());

  let exchangeDayData = ExchangeDayData.load(dayExchangeID);
  let exchangeHourData = ExchangeHourData.load(hourExchangeID);

  if (!exchangeDayData) {
    exchangeDayData = new ExchangeDayData(dayExchangeID);
    exchangeDayData.exchange = exchangeAddress.toHexString();
    exchangeDayData.date = BigInt.fromI32(dayStartTimestamp);
    exchangeDayData.baseToken = exchange!.baseToken;
    exchangeDayData.quoteToken = exchange!.quoteToken;
    exchangeDayData.createdAtTimestamp = eventTimestamp;
    exchangeDayData.dailyTxns = BigInt.fromI32(0);
    exchangeDayData.swapTxns = BigInt.fromI32(0);
    exchangeDayData.addLiquidityTxns = BigInt.fromI32(0);
    exchangeDayData.removeLiquidityTxns = BigInt.fromI32(0);
    exchangeDayData.transferTxns = BigInt.fromI32(0);
  }

  if (!exchangeHourData) {
    exchangeHourData = new ExchangeHourData(hourExchangeID);
    exchangeHourData.exchange = exchangeAddress.toHexString();
    exchangeHourData.date = BigInt.fromI32(hourStartTimestamp);
    exchangeHourData.baseToken = exchange!.baseToken;
    exchangeHourData.quoteToken = exchange!.quoteToken;
    exchangeHourData.createdAtTimestamp = eventTimestamp;
    exchangeHourData.hourlyTxns = BigInt.fromI32(0);
    exchangeHourData.swapTxns = BigInt.fromI32(0);
    exchangeHourData.addLiquidityTxns = BigInt.fromI32(0);
    exchangeHourData.removeLiquidityTxns = BigInt.fromI32(0);
    exchangeHourData.transferTxns = BigInt.fromI32(0);
  }

  exchangeDayData.dailyTxns = exchangeDayData.dailyTxns.plus(BigInt.fromI32(1));

  exchangeHourData.hourlyTxns = exchangeHourData.hourlyTxns.plus(
    BigInt.fromI32(1)
  );

  if (transactionType === TransactionType.SWAP) {
    exchangeDayData.swapTxns = exchangeDayData.swapTxns.plus(BigInt.fromI32(1));
    exchangeHourData.swapTxns = exchangeHourData.swapTxns.plus(
      BigInt.fromI32(1)
    );
  }

  if (transactionType === TransactionType.AddLIQUIDITY) {
    exchangeDayData.addLiquidityTxns = exchangeDayData.addLiquidityTxns.plus(
      BigInt.fromI32(1)
    );
    exchangeHourData.addLiquidityTxns = exchangeHourData.addLiquidityTxns.plus(
      BigInt.fromI32(1)
    );
  }

  if (transactionType === TransactionType.REMOVELIQUIDITY) {
    exchangeDayData.removeLiquidityTxns = exchangeDayData.removeLiquidityTxns.plus(
      BigInt.fromI32(1)
    );
    exchangeHourData.removeLiquidityTxns = exchangeHourData.removeLiquidityTxns.plus(
      BigInt.fromI32(1)
    );
  }

  if (transactionType === TransactionType.TRANSFER) {
    exchangeDayData.transferTxns = exchangeDayData.transferTxns.plus(
      BigInt.fromI32(1)
    );
    exchangeHourData.transferTxns = exchangeHourData.transferTxns.plus(
      BigInt.fromI32(1)
    );
  }

  let exchangeContract = ExchangeContract.bind(exchangeAddress);

  let baseTokenBalance = ERC20.bind(exchangeContract.baseToken()).balanceOf(
    exchangeContract._address
  );
  let quoteTokenBalance = ERC20.bind(exchangeContract.quoteToken()).balanceOf(
    exchangeContract._address
  );

  exchangeDayData.baseTokenLiquidity = baseTokenBalance;
  exchangeDayData.quoteTokenLiquidity = quoteTokenBalance;
  exchangeHourData.baseTokenLiquidity = baseTokenBalance;
  exchangeHourData.quoteTokenLiquidity = quoteTokenBalance;

  exchangeDayData.save();
  exchangeHourData.save();

  exchange!.dailyTxns = exchangeDayData.dailyTxns;
  exchange!.hourlyTxns = exchangeHourData.hourlyTxns;
  exchange!.currentDayData = exchangeDayData.id;
  exchange!.currentHourData = exchangeHourData.id;

  exchange!.save();
}
