module.exports = {
    extends: ["universe/native"],
    plugins: ["react-native", "react-hooks", "import"],
    rules: {
        "no-undef": "error",
        "no-unused-vars": "error", // Transformamos em ERROR para impedir push de variaveis mortas
        "import/no-unresolved": "error",
        "no-redeclare": "error",
        "react-native/no-unused-styles": "error", // Previne sumiço de estilos como o caso do flex: 1
        "react-native/no-inline-styles": "warn",
        "react-hooks/rules-of-hooks": "error",
        "react-hooks/exhaustive-deps": "warn"
    }
};
