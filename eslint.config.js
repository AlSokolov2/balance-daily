import js from '@eslint/js';
import pluginVue from 'eslint-plugin-vue';
import globals from 'globals';

export default [
    js.configs.recommended,
    ...pluginVue.configs['flat/recommended'],
    {
        files: ['resources/js/**/*.{js,vue}'],
        languageOptions: {
            ecmaVersion: 'latest',
            sourceType: 'module',
            globals: {
                ...globals.browser,
                ...globals.es2021,
                ...globals.node,
                __APP_VERSION__: 'readonly',
                __VAPID_PUBLIC_KEY__: 'readonly'
            }
        },
        rules: {
            'vue/multi-word-component-names': 'off',
            'no-unused-vars': ['error', { 
                'argsIgnorePattern': '^[e_]$|^_.*',
                'varsIgnorePattern': '^[e_]$|^_.*'
            }],
            'no-console': 'off',
            'semi': ['error', 'always'],
            'quotes': ['error', 'single', { 'avoidEscape': true }],
            'indent': ['error', 4],
            'vue/html-indent': ['error', 4],
            'vue/max-attributes-per-line': ['error', {
                'singleline': 3,
                'multiline': 1
            }],
            'vue/require-default-prop': 'error',
            'vue/require-explicit-emits': 'error'
        }
    },
    {
        files: ['resources/js/sw.js'],
        languageOptions: {
            globals: {
                ...globals.serviceworker
            }
        }
    }
];
