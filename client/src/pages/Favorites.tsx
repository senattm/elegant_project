import { SimpleGrid } from "@mantine/core";
import { IconHeart } from "@tabler/icons-react";
import PageLayout from "../components/layout/PageLayout";
import PageHeader from "../components/layout/PageHeader";
import EmptyState from "../components/ui/EmptyState";
import { useFavorites } from "../store/hooks/useFavorites";
import { useProducts } from "../store/hooks/useProducts";
import { useEffect } from "react";
import ProductCard from "../components/features/ProductCard";
import { useNavigate } from "react-router-dom";
import { useAtom } from "jotai";
import { isAuthenticatedAtom } from "../store/atoms";

const Favorites = () => {
  const navigate = useNavigate();
  const [isAuthenticated] = useAtom(isAuthenticatedAtom);
  const { favorites } = useFavorites();
  const { products, fetchProducts } = useProducts();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/auth");
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    fetchProducts();
  }, []);

  const favoriteProducts = products.filter((product) =>
    favorites.includes(product.id)
  );

  return (
    <PageLayout pb={60}>
      <PageHeader
        title="FAVORİLERİM"
        subtitle={`${favoriteProducts.length} Ürün`}
        mb={50}
      />

        {favoriteProducts.length === 0 ? (
        <EmptyState
          message="Henüz favori ürününüz yok"
          description="Beğendiğiniz ürünleri favorilerinize ekleyebilirsiniz"
          icon={
            <IconHeart
              size={64}
              style={{ color: "#e9ecef", marginBottom: "20px" }}
            />
          }
        />
        ) : (
        <SimpleGrid cols={{ base: 1, xs: 2, sm: 2, md: 3, lg: 4 }} spacing="lg">
            {favoriteProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </SimpleGrid>
        )}
    </PageLayout>
  );
};

export default Favorites;
