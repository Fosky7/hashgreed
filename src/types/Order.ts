export interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
}

export interface Order {
  id: string;
  restaurantName: string;
  orderDate: string;
  totalAmount: number;
  status: string;
  items: OrderItem[];
}
