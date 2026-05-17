// ESLint flat config — keeps it minimal so we don't fight the
// next-config + FlatCompat circular-config bug on ESLint 9.x.
import next from "eslint-config-next";

const config = [
  ...next,
  {
    ignores: [".next/**", "node_modules/**", "next-env.d.ts"],
  },
];

export default config;
