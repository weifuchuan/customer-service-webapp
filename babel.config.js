module.exports = {
  "presets": [
    ["@babel/preset-env", {
      "useBuiltIns": false
    }],
    "@babel/preset-react",
    "@babel/preset-typescript"
  ],
  "plugins": [
    "@babel/plugin-transform-runtime",
    ["@babel/plugin-proposal-decorators", {
      "legacy": true
    }],
    ["@babel/plugin-proposal-class-properties", {
      "loose": true
    }],
    "@babel/plugin-syntax-dynamic-import",
    ["module-resolver", {
      "root": ["."],
      "alias": {
        "@": "./src"
      }
    }],
    ["@babel/plugin-proposal-pipeline-operator", {
      "proposal": "minimal"
    }],
    [
      "import",
      {
        "libraryName": "antd",
        "libraryDirectory": "es",
        "style": "css"
      }
    ],
    ["import", {
      "libraryName": "@material-ui/core",
      "libraryDirectory": "es",
      "style": false,
      "camel2DashComponentName": false
    }, "import-material"], 
    "babel-plugin-styled-components"
  ]
}