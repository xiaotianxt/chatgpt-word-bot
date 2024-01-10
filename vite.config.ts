import { defineConfig } from "vite";
import Userscript from "vite-userscript-plugin";
import svgr from "vite-plugin-svgr";
import { name, version, description, author } from "./package.json";

export default defineConfig((config) => {
  return {
    plugins: [
      svgr(),
      Userscript({
        entry: "src/index.ts",
        header: {
          name,
          version,
          description,
          author,
          homepage: "https://github.com/xiaotianxt/chatgpt-word-bot",
          match: [
            "*://chat.openai.com",
            "*://chat.openai.com/*",
            "*://chat.oaifree.com",
            "*://chat.oaifree.com/*",
          ],
          grant: [
            "GM_addStyle",
            "GM_addElement",
            "GM_setValue",
            "GM_getValue",
            "GM_xmlhttpRequest",
            "unsafeWindow",
          ],
          "run-at": "document-body",
        },
        server: {
          port: 3000,
        },
      }),
    ],
    define: {
      "process.env": process.env,
    },
    build: {
      // remove minification, sqeeze, and so on
      minify: "esbuild",
    },
  };
});
