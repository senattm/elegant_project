import { getImageUrl } from "./imageUrl";

export type WardrobeProduct = {
  id: number;
  name: string;
  image: string;
  category: string;
  price: number;
};

type OrderItem = {
  productId: number;
  productName: string;
  productImages?: string[];
  category?: string;
  unitPrice?: number;
  price?: number;
};

type Order = { items: OrderItem[] };

export function uniqueWardrobeItemsFromOrders(orders: Order[]): WardrobeProduct[] {
  const items = orders.flatMap((order) =>
    order.items.map((item) => ({
      id: item.productId,
      name: item.productName,
      image: getImageUrl(item.productImages?.[0]),
      category: item.category || "Zamansız Parça",
      price: item.unitPrice ?? item.price ?? 0,
    })),
  );
  return Array.from(new Map(items.map((p) => [p.id, p])).values());
}
