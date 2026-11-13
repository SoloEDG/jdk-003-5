import { reactive, readonly } from "vue";
import type { JourneyContext, Purchase } from "@/shared/domain";
import { makeStock, type StockItem } from "../lib/stock";
import { priceFor } from "../lib/pricing";
import { makeSupply, isActiveCompanion } from "@/features/party";
const state = reactive({
  context: null as JourneyContext | null,
  stock: [] as StockItem[],
  purchases: [] as Purchase[],
  open: false,
});
export const shopState = readonly(state);
export interface PurchaseOrder {
  item: StockItem;
  price: number;
}
export interface PurchaseResult {
  card: string | null;
  ownerId?: string;
  supply: ReturnType<typeof makeSupply> | null;
}
export function openShop(c: JourneyContext) {
  if (state.context?.nodeId !== c.nodeId) {
    state.context = c;
    state.stock = makeStock(c);
  }
  state.open = true;
}
export function itemPrice(id: string) {
  const item = state.stock.find((s) => s.id === id);
  return item && state.context
    ? priceFor(item.basePrice, state.context.influence)
    : Infinity;
}
export function preparePurchase(id: string): PurchaseOrder | null {
  const item = state.stock.find((s) => s.id === id);
  if (!state.open || !item || item.sold) return null;
  // 已离队同伴的补给/专属牌不再出售
  if (item.companionId && !isActiveCompanion(item.companionId)) return null;
  return { item, price: itemPrice(id) };
}
export function completePurchase(order: PurchaseOrder): PurchaseResult | null {
  const item = state.stock.find((s) => s.id === order.item.id);
  if (!item || item.sold) return null;
  item.sold = true;
  if (item.kind === "supply" && item.supply && item.companionId) {
    // 补给已付费但先放入待领取，离队时按原价退款
    return {
      supply: makeSupply(item.supply, item.companionId, order.price),
      card: null,
    };
  }
  const purchase: Purchase = {
    id: item.id,
    card: item.card!,
    price: order.price,
  };
  state.purchases.push(purchase);
  return { supply: null, card: item.card!, ownerId: item.companionId };
}
export function closeShop() {
  state.open = false;
}
export function exportShop() {
  return JSON.parse(JSON.stringify(state));
}
export function restoreShop(d: ReturnType<typeof exportShop>) {
  Object.assign(state, d);
}
export function resetShop() {
  state.context = null;
  state.stock = [];
  state.purchases = [];
  state.open = false;
}
