import type { MantineThemeOverride } from "@mantine/core";

export const theme: MantineThemeOverride = {
  defaultRadius: 0,
  fontFamily: "Inter, system-ui, Avenir, Helvetica, Arial, sans-serif",
  headings: {
    fontFamily: "Playfair Display, serif",
    fontWeight: "300",
  },
  components: {
    Title: {
      styles: {
        root: {
          letterSpacing: "0.1em",
        },
      },
    },
    Button: {
      defaultProps: {
        size: "lg",
        color: "dark",
      },
      styles: {
        root: {
          letterSpacing: "0.02em",
          fontWeight: 500,
          border: "none",
          transition: "all 0.3s",
          radius: 0,
        },
      },
    },
    Paper: {
      defaultProps: {
        shadow: "none",
      },
    },
  },
};
