import { Routes, Route } from "react-router-dom";
import { MantineProvider } from "@mantine/core";
import Home from "./pages/Home";
import Auth from "./pages/Auth";
import Footer from "./components/Footer";
import Navbar from "./components/Navbar";
import { NotificationContainer } from "./components/NotificationContainer";
import "./App.css";

function App() {
  return (
    <MantineProvider>
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
      <NotificationContainer />
    </MantineProvider>
  );
}

export default App;
