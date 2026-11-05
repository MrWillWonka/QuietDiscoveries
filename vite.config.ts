import tailwindcss from "@tailwindcss/vite";
import adapter from "@sveltejs/adapter-static";
import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig } from "vite";

/**
 * The demo build (`bun run build:demo`): a simulated quiet room instead of
 * the microphone, for frames that refuse one, such as a claude.ai artifact.
 * Fixed at build time, so the real build carries none of it.
 */
const demo = process.env.PUBLIC_DEMO === "1";

export default defineConfig({
  define: {
    "import.meta.env.QD_DEMO": JSON.stringify(demo),
  },
  plugins: [
    tailwindcss(),
    sveltekit({
      compilerOptions: {
        // Force runes mode for the project, except for libraries. Can be removed in svelte 6.
        runes: ({ filename }) =>
          filename.split(/[/\\]/).includes("node_modules") ? undefined : true,
      },

      // Everything happens in the browser: the microphone never leaves the
      // device and there is no server to talk to.
      adapter: adapter({
        pages: demo ? "build-demo" : "build",
        assets: demo ? "build-demo" : "build",
        fallback: "404.html",
      }),

      // claude.ai artifacts reserve paths that start with "_", so the demo
      // build keeps its scripts in app/ rather than the default _app/.
      ...(demo ? { appDir: "app" } : {}),

      prerender: {
        // #how-it-works opens the info drawer rather than naming an element,
        // so nothing on the page carries that id on purpose.
        handleMissingId: ({ id, message }) => {
          if (id !== "how-it-works") throw new Error(message);
        },
      },
    }),
  ],
});
