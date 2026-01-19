import { useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import { MantineProvider } from "@mantine/core";
import { Notifications } from "@mantine/notifications";
import { notificationConfig } from "./store/hooks/useNotification";
import { theme } from "./theme";
import Home from "./pages/Home";
import Auth from "./pages/Auth";
import Favorites from "./pages/Favorites";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Store from "./pages/Store";
import OrderDetail from "./pages/OrderDetail";
import Orders from "./pages/Orders";
import ProductDetail from "./pages/ProductDetail";
import Profile from "./pages/Profile";
import Layout from "./components/layout/Layout";
import Chatbot from "./components/ui/Chatbot";
import { useCart } from "./store/hooks/useCart";
import { useAuth } from "./store/hooks";
import "./App.css";

function App() {
  const { fetchCart } = useCart();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      fetchCart();
    }
  }, [isAuthenticated]);

  return (
    <MantineProvider theme={theme}>
      <Notifications {...notificationConfig} />
      <Routes>
        <Route path="/auth" element={<Auth />} />

        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
        </Route>
        <Route element={<Layout alwaysWhite />}>
          <Route path="/favorites" element={<Favorites />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/store" element={<Store />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/orders/:orderId" element={<OrderDetail />} />
          <Route path="/profile" element={<Profile />} />
        </Route>
      </Routes>
      <Chatbot />
    </MantineProvider>
  );
}

export default App;
