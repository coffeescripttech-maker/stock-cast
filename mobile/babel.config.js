module.exports = function(api) {
  api.cache(true);
  return {
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'react' }],
      '@babel/preset-typescript'
    ],
    plugins: [
      // Removed all loose configurations to fix NONE property error
    ]
  };
};