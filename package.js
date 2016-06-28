Package.describe({
  name: 'colony:hooked-web3-ddp-provider',
  version: '1.0.0',
  // Brief, one-line summary of the package.
  summary: '',
  // URL to the Git repository containing the source code for this package.
  git: '',
  // By default, Meteor will default to using README.md for documentation.
  // To avoid submitting documentation, set this field to null.
  documentation: 'README.md'
});

Package.onUse(function(api) {
  api.versionsFrom('1.3');
  api.use('ecmascript');
  api.mainModule('hooked-web3-ddp-provider-server.js', 'server');
  api.mainModule('hooked-web3-ddp-provider-client.js', 'client');
});

Package.onTest(function(api) {
  api.use('ecmascript');
  api.use('tinytest');
  api.use('colony:hooked-web3-ddp-provider');
});

Npm.depends({
  'web3': '0.16.0'
});
