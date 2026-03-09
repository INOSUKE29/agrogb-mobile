// eslint.config.js
const react = require("eslint-plugin-react");
const reactNative = require("eslint-plugin-react-native");

module.exports = [
    {
        ignores: [
            "node_modules/**",
            "android/**",
            "ios/**",
            ".expo/**",
            "assets/**",
            "dist/**",
            "web-build/**",
            "scripts/**",
            "*.config.js",
            "*extracted/**",
            "*.bak",
            "*.exe",
            "*.apk"
        ],
    },
    {
        files: ["**/*.js", "**/*.jsx"],
        plugins: {
            react,
            "react-native": reactNative,
        },
        languageOptions: {
            ecmaVersion: "latest",
            sourceType: "module",
            parserOptions: {
                ecmaFeatures: {
                    jsx: true,
                },
            },
            globals: {
                __dirname: "readonly",
                module: "readonly",
                require: "readonly",
                process: "readonly",
                console: "readonly",
                setTimeout: "readonly",
                setInterval: "readonly",
                clearTimeout: "readonly",
                clearInterval: "readonly",
                fetch: "readonly",
                alert: "readonly",
                window: "readonly",
                navigator: "readonly",
                document: "readonly",
                // Mobile/React Native Globals
                global: "readonly",
                FormData: "readonly",
                XMLHttpRequest: "readonly",
                __DEV__: "readonly",
            }
        },
        settings: {
            react: {
                version: "detect",
            },
        },
        rules: {
            "no-undef": "error",
            "no-unused-vars": "warn",
            "no-redeclare": "error",
            "react/jsx-uses-react": "error",
            "react/jsx-uses-vars": "error",
        }
    }
];
