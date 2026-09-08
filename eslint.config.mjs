import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
	eslint.configs.recommended,
	...tseslint.configs.recommended,
	{
		files: ['src/**/*.{ts,js}', 'tests/**/*.{ts,js}'],
		languageOptions: {
			ecmaVersion: 2022,
			sourceType: 'module',
			parserOptions: {
				ecmaFeatures: {
					impliedStrict: true,
				},
			},
			globals: {
				window: 'readonly',
				document: 'readonly',
				performance: 'readonly',
				requestAnimationFrame: 'readonly',
				HTMLCanvasElement: 'readonly',
				HTMLElement: 'readonly',
				Touch: 'readonly',
				MouseEvent: 'readonly',
				TouchEvent: 'readonly',
				KeyboardEvent: 'readonly',
				console: 'readonly',
				location: 'readonly',
				navigator: 'readonly',
				setTimeout: 'readonly',
				URLSearchParams: 'readonly',
			},
		},
		rules: {
			'padded-blocks': 'off',
			'no-use-before-define': 'off',
			'no-unused-expressions': 'off',
			'no-case-declarations': 'off',
			'@typescript-eslint/ban-ts-comment': 'off',
			'@typescript-eslint/consistent-type-imports': ['error'],
			'@typescript-eslint/explicit-function-return-type': 'off',
			'@typescript-eslint/no-explicit-any': 'off',
			'@typescript-eslint/no-use-before-define': ['error'],
			'@typescript-eslint/explicit-module-boundary-types': 'off',
			'@typescript-eslint/no-non-null-assertion': 'off',
			'@typescript-eslint/no-unused-vars': ['error', {
				argsIgnorePattern: '^_',
				varsIgnorePattern: '^_',
				caughtErrorsIgnorePattern: '^_',
			}],
		},
	},
	{
		ignores: ['dist/**', 'coverage/**', 'api-docs/**', 'node_modules/**', 'APH_examples/**', 'web-docs/**', 'tests/mocks/**'],
	},
);
