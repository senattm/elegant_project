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
import Footer from "./components/Footer";
import Navbar from "./components/Navbar";
import { useCart } from "./store/hooks/useCart";
import { useAuth } from "./store/hooks";
import "./App.css";

function App() {
  const { fetchCart } = useCart();
  const { isAuthenticated } = useAuth();

  // Uygulama yüklendiğinde veya sayfa yenilendiğinde sepeti yükle
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
        <Route
          path="/"
          element={
            <>
              <Navbar />
              <Home />
              <Footer />
            </>
          }
        />
        <Route
          path="/favorites"
          element={
            <>
              <Navbar alwaysWhite />
              <Favorites />
              <Footer />
            </>
          }
        />
        <Route
          path="/cart"
          element={
            <>
              <Navbar alwaysWhite />
              <Cart />
              <Footer />
            </>
          }
        />
        <Route
          path="/checkout"
          element={
            <>
              <Navbar alwaysWhite />
              <Checkout />
              <Footer />
            </>
          }
        />
        <Route
          path="/store"
          element={
            <>
              <Navbar alwaysWhite />
              <Store />
              <Footer />
            </>
          }
        />
        <Route
          path="/product/:id"
          element={
            <>
              <Navbar alwaysWhite />
              <ProductDetail />
              <Footer />
            </>
          }
        />
        <Route
          path="/orders"
          element={
            <>
              <Navbar alwaysWhite />
              <Orders />
              <Footer />
            </>
          }
        />
        <Route
          path="/orders/:orderId"
          element={
            <>
              <Navbar alwaysWhite />
              <OrderDetail />
              <Footer />
            </>
          }
        />
        <Route
          path="/profile"
          element={
            <>
              <Navbar alwaysWhite />
              <Profile />
              <Footer />
            </>
          }
        />
      </Routes>
    </MantineProvider>
  );
}

export default App;
