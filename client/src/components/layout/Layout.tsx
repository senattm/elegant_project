import { Outlet } from "react-router-dom";
import { Box } from "@mantine/core";
import Navbar from "./Navbar";
import Footer from "./Footer";

interface LayoutProps {
    alwaysWhite?: boolean;
}

export default function Layout({ alwaysWhite = false }: LayoutProps) {
    return (
        <Box style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
            <Navbar alwaysWhite={alwaysWhite} />
            <Box flex={1} w="100%">
                <Outlet />
            </Box>
            <Footer />
        </Box>
    );
}
