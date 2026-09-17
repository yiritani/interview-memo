import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: ["drizzle/**"],
  },
  ...tseslint.configs.recommended,
);
