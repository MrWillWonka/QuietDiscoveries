// See https://svelte.dev/docs/kit/types#app.d.ts
declare global {
  namespace App {
    // interface Error {}
    // interface Locals {}
    // interface PageData {}
    // interface PageState {}
    // interface Platform {}
  }

  interface ImportMetaEnv {
    /** True only in the demo build (`bun run build:demo`, vite.config.ts). */
    readonly QD_DEMO?: boolean;
  }
}

export {};
