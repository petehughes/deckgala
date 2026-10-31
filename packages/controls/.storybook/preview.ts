import type { Preview } from "@storybook/react-vite";
import "../src/tokens.css";
import "../src/controls.css";

const preview: Preview = {
  parameters: {
    backgrounds: {
      default: "deckgala-dark",
      values: [
        { name: "deckgala-dark", value: "#0B1528" },
        { name: "poolside-slate", value: "#16233B" },
      ],
    },
  },
};

export default preview;

