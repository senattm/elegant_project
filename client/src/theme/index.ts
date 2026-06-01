import type { MantineThemeOverride } from "@mantine/core";
import type { CSSProperties } from "react";

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

export const sectionTitleStyle: CSSProperties = {
  fontFamily: '"Playfair Display", serif',
  fontWeight: 300,
  letterSpacing: "4px",
  textTransform: "uppercase",
  lineHeight: 1.05,
};

export const smallLabelStyle: CSSProperties = {
  fontSize: 10,
  letterSpacing: "4px",
  textTransform: "uppercase",
};

export const eyebrowLabelStyle: CSSProperties = {
  fontSize: 11,
  letterSpacing: "5px",
  textTransform: "uppercase",
};

export const roleLabelStyle: CSSProperties = {
  fontSize: 10,
  fontWeight: 600,
  letterSpacing: "2px",
  textTransform: "uppercase",
};

export const productActionButtonStyles = {
  root: {
    height: 42,
    fontSize: 12,
    letterSpacing: 1,
    fontWeight: 600,
  },
};

export const ctaOutlineStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 12,
  padding: "14px 32px",
  background: "transparent",
  border: "1px solid rgba(0,0,0,0.2)",
  color: "#111",
  cursor: "pointer",
  fontSize: 11,
  letterSpacing: 2,
  textTransform: "uppercase",
  fontFamily: "inherit",
};
