export const globalCss = {
  extend: {
    "*": {
      "--global-color-border": "colors.border",
      "--global-color-placeholder": "colors.fg.subtle",
      "--global-color-selection": "colors.colorPalette.subtle.bg",
      "--global-color-focus-ring": "colors.colorPalette.solid.bg",
      "--global-font-body": "fonts.body",
    },
    html: {
      colorPalette: "accent",
    },
    "h1, h2, h3, h4, h5, h6": {
      fontFamily: "heading",
    },
    body: {
      background: "canvas",
      color: "fg.default",
      wordBreak: "keep-all",
    },
  },
};
