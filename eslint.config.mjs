// eslint.config.js
import antfu from "@antfu/eslint-config"
import nextPlugin from "@next/eslint-plugin-next"
import jsxA11y from "eslint-plugin-jsx-a11y"
import tailwind from "eslint-plugin-tailwindcss"

export default antfu(
	{
		nextjs: true,
		react: {
			overrides: {
				"react/no-comment-textnodes": "off",
				"react-hooks-extra/no-unnecessary-use-prefix": "off",
				"react-hooks-extra/prefer-use-state-lazy-initialization": "off",
				"react-hooks-extra/no-direct-set-state-in-use-effect": "off",
				"react-hooks/set-state-in-effect": "off",
				"react-hooks/purity": "off",
			},
		},
		typescript: true,
		jsonc: true,
		formatters: {
			css: true,
			html: true,
			markdown: true,
		},
		stylistic: {
			indent: "tab",
			quotes: "double",
			semi: false,
		},
		ignores: [
			"generated/**/*",
			"migrations/**/*",
			"next-env.d.ts",
			"**/*.md",
			"docs/**/*",
			"POSTMAN_TESTING_GUIDE.md",
		],
	},
	...tailwind.configs["flat/recommended"],
	jsxA11y.flatConfigs.recommended,
	{
		plugins: {
			"@next/next": nextPlugin,
		},
		settings: {
			tailwindcss: {
				config: false,
			},
		},
		rules: {
			...nextPlugin.configs.recommended.rules,
			...nextPlugin.configs["core-web-vitals"].rules,
			"eqeqeq": "off",
			"no-console": "off",
			"array-callback-return": "off",
			"unused-imports/no-unused-vars": "off",
			"node/prefer-global/process": "off",
			"node/prefer-global/buffer": "off",
			"tailwindcss/no-custom-classname": "off",
			"react/no-unstable-context-value": "off",
			"react-refresh/only-export-components": "off",
			"ts/no-use-before-define": "off",
			"ts/consistent-type-imports": "off",
			"jsx-a11y/no-static-element-interactions": "off",
			"jsx-a11y/click-events-have-key-events": "off",
			"react/no-nested-component-definitions": "off",
		},
	},
)
