import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // House style: Webflow-derived markup keeps verbatim <a> tags (converting
      // them to <Link> would churn classes/hydration). Since the CMS added the
      // root [slug] route, every internal href now "matches a page" and this
      // rule misfires across ~250 legacy section files.
      "@next/next/no-html-link-for-pages": "off",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Vendored Webflow/jQuery/Swiper bundles — not ours to lint.
    "public/js/**",
  ]),
]);

export default eslintConfig;
