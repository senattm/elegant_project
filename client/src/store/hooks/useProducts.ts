import { useAtom } from "jotai";
import { productsAtom, loadingProductsAtom } from "../atoms";
import { productsApi } from "../../api/client";

export const useProducts = () => {
  const [products, setProducts] = useAtom(productsAtom);
  const [loading, setLoading] = useAtom(loadingProductsAtom);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await productsApi.getAll();
      setProducts(response.data);
    } catch (error) {
      console.error("Ürünler yüklenirken hata:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const getProductById = async (id: number) => {
    try {
      const response = await productsApi.getById(id);
      return response.data;
    } catch (error) {
      console.error("Ürün yüklenirken hata:", error);
      throw error;
    }
  };

  return {
    products,
    loading,
    fetchProducts,
    getProductById,
  };
};

