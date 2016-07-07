/* eslint-env node */
/* globals describe, before, beforeEach, it*/
import { sinon } from 'meteor/practicalmeteor:sinon';
import { gethAddress, gethPort } from 'meteor/colony:hooked-web3-ddp-provider';

describe('hooked-web3-ddp-provider server', function () {

  let sandbox;
  const error = new Error('This provider doesn\'t support that method');
  const randomAddress = '0x54450450e24286143a35686ad77a7c851ada01a0';

  beforeEach(function() {
    sandbox = sinon.sandbox.create();
  });

  afterEach(function(){
    sandbox.restore();
  })

  it('should fail to call sendAsync using JSON-RPC disallowed methods', function(){
    const payload = {
      method: 'not-allowed-method'
    };

    const callback = sandbox.spy();
    callback.withArgs(error);

    Meteor.call('web3DdpProviderExec', payload, callback);
    expect(callback).to.have.been.calledWith(error);
  });

  it('should allow users to call sendAsync with allowed JSON-RPC methods', function(done){
    const callback = sandbox.spy();
    const payload = {
      method: 'eth_accounts'
    };

    const httpStub = sandbox.stub(Meteor.http, 'call', function() {
      return {content: JSON.stringify({ result: 1 })};
    });

    Meteor.call('web3DdpProviderExec', payload, function(error, value) {
      expect(httpStub).to.have.been.called;
      if(value && value.result === 1) {
        done();
      }
    });
  });
});
