import { BigInt } from "@graphprotocol/graph-ts";
import {
  Swap as SwapParams,
  Transfer as TransferParams,
  AddLiquidity as AddLiquidityParams,
  Approval as ApprovalParams,
  RemoveLiquidity as RemoveLiquidityParams,
} from "../generated/ExchangeFactory/Exchange";
import {
  Transfer,
  Swap,
  LiquidityEvent,
  Approval,
  Exchange,
  ExchangeDayData,
} from "../generated/schema";
import {
  TransactionType,
  updateExchangeTotalSupplyAndPrice,
  updateNumberOfTransactions,
} from "./helper";

export function handleSwap(event: SwapParams): void {
  updateExchangeTotalSupplyAndPrice(event.address);
  let swap = Swap.load(event.transaction.hash.toHex());

  if (!swap) {
    swap = new Swap(event.transaction.hash.toHex());
  }

  updateNumberOfTransactions(
    event.address,
    event.block.timestamp,
    TransactionType.SWAP
  );

  swap.baseTokenQtyIn = event.params.baseTokenQtyIn;
  swap.quoteTokenQtyIn = event.params.quoteTokenQtyIn;
  swap.baseTokenQtyOut = event.params.baseTokenQtyOut;
  swap.quoteTokenQtyOut = event.params.quoteTokenQtyOut;
  swap.sender = event.params.sender;
  swap.createdAtTimestamp = event.block.timestamp;
  swap.exchange = event.address.toHexString();
  swap.save();
}

export function handleTransfer(event: TransferParams): void {
  updateExchangeTotalSupplyAndPrice(event.address);
  let tranfer = Transfer.load(event.transaction.hash.toHex());

  if (!tranfer) {
    tranfer = new Transfer(event.transaction.hash.toHex());
  }

  updateNumberOfTransactions(
    event.address,
    event.block.timestamp,
    TransactionType.TRANSFER
  );

  tranfer.exchange = event.address.toHexString();
  tranfer.from = event.params.from;
  tranfer.to = event.params.to;
  tranfer.value = event.params.value;
  tranfer.createdAtTimestamp = event.block.timestamp;

  tranfer.save();
}

export function handleAddLiquidity(event: AddLiquidityParams): void {
  updateExchangeTotalSupplyAndPrice(event.address);
  let addLiquidity = LiquidityEvent.load(event.transaction.hash.toHex());

  if (!addLiquidity) {
    addLiquidity = new LiquidityEvent(event.transaction.hash.toHex());
  }

  updateNumberOfTransactions(
    event.address,
    event.block.timestamp,
    TransactionType.AddLIQUIDITY
  );

  addLiquidity.exchange = event.address.toHexString();

  addLiquidity.added = true;
  addLiquidity.baseTokenQty = event.params.baseTokenQtyAdded;
  addLiquidity.quoteTokenQty = event.params.quoteTokenQtyAdded;
  addLiquidity.liquidityProvider = event.params.liquidityProvider;
  addLiquidity.createdAtTimestamp = event.block.timestamp;
  addLiquidity.save();
}

export function handleApproval(event: ApprovalParams): void {
  updateExchangeTotalSupplyAndPrice(event.address);
  let approval = Approval.load(event.transaction.hash.toHex());

  if (!approval) {
    approval = new Approval(event.transaction.hash.toHex());
  }

  approval.exchange = event.address.toHexString();
  approval.owner = event.params.owner;
  approval.spender = event.params.spender;
  approval.value = event.params.value;
  approval.createdAtTimestamp = event.block.timestamp;

  approval.save();
}

export function handleRemoveLiquidity(event: RemoveLiquidityParams): void {
  updateExchangeTotalSupplyAndPrice(event.address);
  let removeLiquidity = LiquidityEvent.load(event.transaction.hash.toHex());

  if (!removeLiquidity) {
    removeLiquidity = new LiquidityEvent(event.transaction.hash.toHex());
  }

  updateNumberOfTransactions(
    event.address,
    event.block.timestamp,
    TransactionType.REMOVELIQUIDITY
  );

  removeLiquidity.exchange = event.address.toHexString();

  removeLiquidity.added = false;
  removeLiquidity.baseTokenQty = event.params.baseTokenQtyRemoved;
  removeLiquidity.quoteTokenQty = event.params.quoteTokenQtyRemoved;
  removeLiquidity.liquidityProvider = event.params.liquidityProvider;
  removeLiquidity.createdAtTimestamp = event.block.timestamp;
  removeLiquidity.save();
}
