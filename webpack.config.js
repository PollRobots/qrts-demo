const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");

module.exports = (env, argv) => {
  // Selects a different template file for the start page based on whether
  // this is a "production" build or not
  const isProduction = argv.mode === "production";

  return {
    entry: "./src/index.tsx", // The entry point into the bundle
    output: {
      path: path.join(__dirname, "/dist"),
      filename: "[name].[contenthash].js", // The name of the output bundle,
      // this is referenced from the start
      // page.
    },
    devServer: {
      port: 8080,
      host: "0.0.0.0",
      static: {
        publicPath: path.join(__dirname, "/dist"),
      },
    },
    devtool: "source-map",
    resolve: {
      extensions: [".ts", ".tsx", ".js"],
    },

    module: {
      rules: [
        {
          test: /\.ts(x?)$/,
          exclude: /node_modules/,
          use: "ts-loader",
        },
        {
          enforce: "pre",
          test: /\.js$/,
          loader: "source-map-loader",
        },
      ],
    },

    plugins: [
      new HtmlWebpackPlugin({
        title: "qrts demo", // Title is injected into the page template
        filename: "qrts.html", // The output name when built
        template: "template.html",
      }),
    ],
  };
};
