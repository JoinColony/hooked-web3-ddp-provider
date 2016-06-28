// Import Tinytest from the tinytest Meteor package.
import { Tinytest } from "meteor/tinytest";

// Import and rename a variable exported by hooked-web3-ddp-provider.js.
import { name as packageName } from "meteor/colony:hooked-web3-ddp-provider";

// Write your tests here!
// Here is an example.
Tinytest.add('hooked-web3-ddp-provider - example', function (test) {
  test.equal(packageName, "hooked-web3-ddp-provider");
});
