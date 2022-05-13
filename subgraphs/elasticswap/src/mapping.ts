import { BigDecimal, BigInt } from "@graphprotocol/graph-ts";
import {
  ExchangeFactory,
  NewExchange,
  OwnershipTransferred,
  SetFeeAddress,
} from "../generated/ExchangeFactory/ExchangeFactory";
import {
  Exchange as ExchangeContract,
  Swap as SwapParams,
  Transfer as TransferParams,
} from "../generated/ExchangeFactory/Exchange";
import { ERC20 } from "../generated/ExchangeFactory/ERC20";
import { Exchange, Token, Transfer, Swap } from "../generated/schema";

export function handleNewExchange(event: NewExchange): void {
  // Entities can be loaded from the store using a string ID; this ID
  // needs to be unique across all entities of the same type

  let exchange = Exchange.load(event.transaction.hash.toHex());
  // Entities only exist after they have been saved to the store;
  // `null` checks allow to create entities on demand
  if (!exchange) {
    exchange = new Exchange(event.transaction.hash.toHex());
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
  baseToken.totalSupply = ERC20.bind(
    exchangeContract.baseToken()
  ).totalSupply();
  baseToken.decimals = BigDecimal.fromString(
    ERC20.bind(exchangeContract.baseToken())
      .decimals()
      .toString()
  );
  baseToken.exchangeFactoryAddress = exchangeContract.exchangeFactoryAddress();
  baseToken.save();

  let quoteToken = Token.load(exchangeContract.quoteToken().toHex());
  if (!quoteToken) {
    quoteToken = new Token(exchangeContract.quoteToken().toHex());
  }
  quoteToken.symbol = ERC20.bind(exchangeContract.quoteToken()).symbol();
  quoteToken.name = ERC20.bind(exchangeContract.quoteToken()).name();
  quoteToken.totalSupply = ERC20.bind(
    exchangeContract.quoteToken()
  ).totalSupply();
  quoteToken.decimals = BigDecimal.fromString(
    ERC20.bind(exchangeContract.quoteToken())
      .decimals()
      .toString()
  );
  quoteToken.exchangeFactoryAddress = exchangeContract.exchangeFactoryAddress();
  quoteToken.save();

  exchange.baseToken = baseToken.id;
  exchange.quoteToken = quoteToken.id;

  exchange.save();
}

export function handleSwap(event: SwapParams): void {
  let swap = Swap.load(event.transaction.hash.toHex());

  if (!swap) {
    swap = new Swap(event.transaction.hash.toHex());
  }

  swap.baseTokenQtyIn = event.params.baseTokenQtyIn;
  swap.quoteTokenQtyIn = event.params.quoteTokenQtyIn;
  swap.baseTokenQtyOut = event.params.baseTokenQtyOut;
  swap.quoteTokenQtyOut = event.params.quoteTokenQtyOut;
  swap.sender = event.params.sender;
  swap.save();
}

export function handleTransfer(event: TransferParams): void {
  let tranfer = Transfer.load(event.transaction.hash.toHex());

  if (!tranfer) {
    tranfer = new Transfer(event.transaction.hash.toHex());
  }

  tranfer.from = event.params.from;
  tranfer.to = event.params.to;
  tranfer.value = event.params.value;

  tranfer.save();
}