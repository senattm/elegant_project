import { Routes, Route } from "react-router-dom";
import { MantineProvider } from "@mantine/core";
import { AuthProvider } from "./contexts/AuthContext";
import { NotificationProvider } from "./contexts/NotificationContext";
import Home from "./pages/Home";
import Auth from "./pages/Auth";
import Footer from "./components/Footer";
import Navbar from "./components/Navbar";
import "./App.css";

function App() {
  return (
    <MantineProvider>
      <AuthProvider>
        <NotificationProvider>
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
          </Routes>
        </NotificationProvider>
      </AuthProvider>
    </MantineProvider>
  );
}

export default App;
