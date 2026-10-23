import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    // Several jsdom workers starting together miss Vitest's 60s startup
    // limit on Windows. One worker runs the files in sequence.
    fileParallelism: false,
    maxWorkers: 1,
  },
});
