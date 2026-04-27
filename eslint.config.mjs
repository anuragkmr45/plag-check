import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const eslintConfig = [
  {
    ignores: [".next/**", "node_modules/**", "out/**", "coverage/**"]
  },
  ...nextCoreWebVitals,
  ...nextTypescript
];

export default eslintConfig;
