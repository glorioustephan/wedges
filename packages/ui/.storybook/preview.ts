import type { Preview } from "@storybook/react";
import React from "react";

import "../src/storybook.css";
import { PreviewFrame } from "../src/storybook/PreviewFrame";

const preview: Preview = {
  globalTypes: {
    theme: {
      name: "Theme",
      description: "Preview theme",
      toolbar: {
        icon: "mirror",
        dynamicTitle: true,
        items: [
          { value: "light", title: "Light" },
          { value: "dark", title: "Dark" },
        ],
      },
    },
  },
  initialGlobals: {
    theme: "light",
  },
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    layout: "centered",
  },
  decorators: [
    (Story, context) => {
      const align = context.parameters.previewAlign ?? "center";
      const theme = context.globals.theme === "dark" ? "dark" : undefined;

      return React.createElement(
        "div",
        { className: theme },
        React.createElement(
          PreviewFrame,
          { align },
          React.createElement(Story)
        )
      );
    },
  ],
};

export default preview;
