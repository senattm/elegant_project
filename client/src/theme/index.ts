import type { MantineThemeOverride } from "@mantine/core";

export const theme: MantineThemeOverride = {
  defaultRadius: 0,
  fontFamily: '"Montserrat", sans-serif',
  headings: {
    fontFamily: '"Playfair Display", serif',
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

export const sectionTitleStyle = {
  fontFamily: '"Playfair Display", serif',
  fontWeight: 300,
  letterSpacing: "4px",
  textTransform: "uppercase" as const,
  lineHeight: 1.05,
};

export const smallLabelStyle = {
  fontSize: 10,
  letterSpacing: "4px",
  textTransform: "uppercase" as const,
};
