module.exports = {
	env: {
		'jest/globals': true,
	},
	root: true,
	extends: [
		'@react-native',
		'airbnb',
		'eslint:recommended',
		'airbnb/hooks',
		'airbnb-typescript',
		'plugin:@typescript-eslint/recommended',
		'plugin:@typescript-eslint/recommended-requiring-type-checking',
		'plugin:prettier/recommended',
		'plugin:import/recommended',
		'plugin:react/recommended',
		'plugin:react/jsx-runtime',
	],
	parser: '@typescript-eslint/parser',
	ignorePatterns: [
		'plugins/**/*',
		'metro.config.js',
		'scripts/**/*.js',
		'src/screens/Training/Build/**',
	],
	parserOptions: {
		ecmaFeatures: {
			jsx: true,
		},
		ecmaVersion: 'latest',
		sourceType: 'module',
		tsconfigRootDir: '.',
		project: ['./tsconfig.json'],
	},
	settings: {
		'import/resolver': {
			node: {
				extensions: ['.ts', '.tsx'],
			},
			typescript: {},
		},
		react: {
			version: '18.x',
		},
	},
	rules: {
		'@typescript-eslint/no-unused-vars': 'error',
		'@typescript-eslint/no-use-before-define': 'off',
		'global-require': 0,
		'react-hooks/exhaustive-deps': 'off',
		quotes: ['error', 'single', { avoidEscape: true }],
		'object-curly-spacing': ['error', 'always'],
		'array-bracket-spacing': ['error', 'never'],
		'react/require-default-props': ['off'],
		'react/default-props-match-prop-types': ['error'],
		'react/sort-prop-types': ['error'],
		'react/no-array-index-key': 'off',
		'no-tabs': 'off',
		'no-void': 'off',
		'react/jsx-props-no-spreading': 'off',
		// `role` is a member typography prop in the React Native design system,
		// not an HTML ARIA role.
		'jsx-a11y/aria-role': 'off',
		'import/prefer-default-export': 'off',
		'import/no-extraneous-dependencies': [
			'error',
			{ devDependencies: true },
		],
		'react/display-name': 'off',
		'import/extensions': [
			'error',
			'ignorePackages',
			{
				ts: 'never',
				tsx: 'never',
			},
		],
		'react/function-component-definition': [
			'error',
			{
				namedComponents: 'arrow-function',
				unnamedComponents: 'arrow-function',
			},
		],
		'no-plusplus': [
			'error',
			{
				allowForLoopAfterthoughts: true,
			},
		],
		'no-param-reassign': [
			'error',
			{
				props: true,
				ignorePropertyModificationsFor: ['draft'],
			},
		],
		'prettier/prettier': [
			'error',
			{
				printWidth: 80,
				endOfLine: 'auto',
				tabWidth: 4,
				indentStyle: 'space',
				useTabs: true,
				arrowParens: 'avoid',
				bracketSameLine: false,
				singleQuote: true,
				trailingComma: 'all',
			},
		],
	},
	overrides: [
		{
			files: ['**/*.test.ts', '**/*.test.tsx'],
			rules: {
				'import/first': 'off',
				'no-await-in-loop': 'off',
				'no-restricted-syntax': 'off',
				'@typescript-eslint/no-unsafe-assignment': 'off',
			},
		},
		{
			files: [
				'src/screens/Training/**/*',
				'src/services/workoutStudio/**/*',
			],
			rules: {
				'react-native/no-inline-styles': 'off',
			},
		},
	],
};
