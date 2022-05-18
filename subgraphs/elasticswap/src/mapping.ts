import { BigDecimal, BigInt, log } from "@graphprotocol/graph-ts";
import { NewExchange } from "../generated/ExchangeFactory/ExchangeFactory";
import { Exchange as ExchangeContract } from "../generated/ExchangeFactory/Exchange";
import { ERC20 } from "../generated/ExchangeFactory/ERC20";
import { Exchange, Token } from "../generated/schema";
import { Exchange as ExchangeTemplate } from "../generated/templates";

export function handleNewExchange(event: NewExchange): void {
  // Entities can be loaded from the store using a string ID; this ID
  // needs to be unique across all entities of the same type

  let exchange = Exchange.load(event.params.exchangeAddress.toHex());
  // Entities only exist after they have been saved to the store;
  // `null` checks allow to create entities on demand
  if (!exchange) {
    exchange = new Exchange(event.params.exchangeAddress.toHex());
  }

  exchange.creator = event.params.creator;
  exchange.exchangeAddress = event.params.exchangeAddress;

  let exchangeContract = ExchangeContract.bind(event.params.exchangeAddress);

  exchange.baseTokenReserveQty = exchangeContract.internalBalances().value0;
  exchange.quoteTokenReserveQty = exchangeContract.internalBalances().value1;
  exchange.kLast = exchangeContract.internalBalances().value2;

  exchange.minimumLiquidity = exchangeContract.MINIMUM_LIQUIDITY();

  exchange.totalSupply = exchangeContract.totalSupply();

  let baseToken = Token.load(exchangeContract.baseToken().toHex());
  if (!baseToken) {
    baseToken = new Token(exchangeContract.baseToken().toHex());
  }
  baseToken.symbol = ERC20.bind(exchangeContract.baseToken()).symbol();
  baseToken.name = ERC20.bind(exchangeContract.baseToken()).name();
  baseToken.totalSupply = ERC20.bind(exchangeContract.baseToken())
    .totalSupply()
    .toBigDecimal();
  baseToken.decimals = BigDecimal.fromString(
    ERC20.bind(exchangeContract.baseToken())
      .decimals()
      .toString()
  );
  baseToken.exchange = event.params.exchangeAddress.toHex();
  baseToken.save();

  let quoteToken = Token.load(exchangeContract.quoteToken().toHex());
  if (!quoteToken) {
    quoteToken = new Token(exchangeContract.quoteToken().toHex());
  }
  quoteToken.symbol = ERC20.bind(exchangeContract.quoteToken()).symbol();
  quoteToken.name = ERC20.bind(exchangeContract.quoteToken()).name();
  quoteToken.totalSupply = ERC20.bind(exchangeContract.quoteToken())
    .totalSupply()
    .toBigDecimal();
  quoteToken.decimals = BigDecimal.fromString(
    ERC20.bind(exchangeContract.quoteToken())
      .decimals()
      .toString()
  );
  quoteToken.exchange = event.params.exchangeAddress.toHex();
  quoteToken.save();

  log.info("Getting Balance For Address: {}", [
    exchangeContract.baseToken().toHexString(),
  ]);

  exchange.baseTokenQty = ERC20.bind(exchangeContract.baseToken())
    .balanceOf(event.params.exchangeAddress)
    .toBigDecimal();

  log.info("Base Token for Address: {} is {}", [
    exchangeContract.baseToken().toHexString(),
    exchange.baseTokenQty.toString(),
  ]);

  exchange.quoteTokenQty = ERC20.bind(exchangeContract.quoteToken())
    .balanceOf(event.params.exchangeAddress)
    .toBigDecimal();

  exchange.baseToken = baseToken.id;
  exchange.quoteToken = quoteToken.id;

  exchange.dailyTxns = BigInt.fromI32(0);
  exchange.hourlyTxns = BigInt.fromI32(0);

  exchange.name = exchangeContract.name();
  exchange.symbol = exchangeContract.symbol();
  exchange.decimals = BigDecimal.fromString(
    exchangeContract.decimals().toString()
  );

  ExchangeTemplate.create(event.params.exchangeAddress);

  exchange.createdAtTimestamp = event.block.timestamp;
  exchange.save();
}
