import { Routes, Route } from "react-router-dom";
import { MantineProvider } from "@mantine/core";
import { Notifications } from "@mantine/notifications";
import { notificationConfig } from "./store/hooks/useNotification";
import Home from "./pages/Home";
import Auth from "./pages/Auth";
import Favorites from "./pages/Favorites";
import Footer from "./components/Footer";
import Navbar from "./components/Navbar";
import "./App.css";

function App() {
  return (
    <MantineProvider>
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
              <Favorites />
              <Footer />
            </>
          }
        />
      </Routes>
    </MantineProvider>
  );
}

export default App;
