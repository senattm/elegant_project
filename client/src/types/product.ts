export interface Product {
  id: number;
  name: string;
  description?: string;
  price: number | string;
  stock?: number;
  category?: string;
  images: string[];
}


