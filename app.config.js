const appJson = require('./app.json');

module.exports = {
  ...appJson.expo,
  experiments: {
    baseUrl: process.env.EXPO_PUBLIC_BASE_URL || '',
  },
};
