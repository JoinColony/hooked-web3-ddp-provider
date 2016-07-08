Package.describe({
  name: 'colony:hooked-web3-ddp-provider',
  version: '1.0.3',
  // Brief, one-line summary of the package.
  summary: '',
  // URL to the Git repository containing the source code for this package.
  git: 'https://github.com/JoinColony/hooked-web3-ddp-provider.git',
  // By default, Meteor will default to using README.md for documentation.
  // To avoid submitting documentation, set this field to null.
  documentation: 'README.md'
});

Package.onUse(function(api) {
  api.versionsFrom('1.3');
  api.use(['meteor', 'ecmascript']);
  api.mainModule('hooked-web3-ddp-provider-server.js', 'server');
  api.mainModule('hooked-web3-ddp-provider-client.js', 'client');
});

Package.onTest(function(api) {
  api.use([
    'colony:hooked-web3-ddp-provider',
    'ecmascript',
    'meteor',
    'http',
    'practicalmeteor:chai',
    'practicalmeteor:mocha',
    'practicalmeteor:sinon',
    'dispatch:mocha-phantomjs'
  ]);

  api.add_files(['hooked-web3-ddp-provider.client.test.js'], ['client']);
  api.add_files(['hooked-web3-ddp-provider.server.test.js'], ['server']);
});

Npm.depends({
  'web3': '0.16.0'
});
