// app.json の設定に、環境ごとの値を足す。
// EXPO_PUBLIC_BASE_PATH：GitHub Pages のように「/リポジトリ名」の下で公開するときに使う。
module.exports = ({ config }) => ({
  ...config,
  experiments: {
    ...config.experiments,
    baseUrl: process.env.EXPO_PUBLIC_BASE_PATH || '',
  },
});
