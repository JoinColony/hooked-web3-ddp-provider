/* eslint-env node */
/* globals describe, before, beforeEach, it*/
import { sinon } from 'meteor/practicalmeteor:sinon';
import { Meteor } from 'meteor/meteor';
import { HookedWeb3DdpProvider } from 'meteor/colony:hooked-web3-ddp-provider';

describe('hooked-web3-ddp-provider client', function () {

  let provider, transactionSigner, sandbox;
  beforeEach(function() {
    sandbox = sinon.sandbox.create();
  });

  before(function() {

    transactionSigner = {
      hasAddress: function (address, callback) {},
      signTransaction: function(tx_params, callback) {}
    };

    provider = new HookedWeb3DdpProvider({
      transaction_signer: transactionSigner
    });
  });

  afterEach(function(){
    sandbox.restore();
  });

  it('should be an instance of HookedWeb3DdpProvider', function () {
    expect(provider).to.be.an.instanceof(HookedWeb3DdpProvider);
    expect(provider).to.have.property('transaction_signer', transactionSigner);
    expect(provider).to.have.property('send');
    expect(provider).to.have.property('sendAsync');
    expect(provider).to.have.property('sendDdpRequest');
    expect(provider).to.have.property('isConnected');
    expect(provider).to.have.property('rewritePayloads');
  });

  it('should throw if send function is called', function() {
    expect(provider.send).to.throw(Error);
  });

  it('should allow users to call allowed JSON-RPC methods', function() {
    const callback = sandbox.spy();
    const payload = {
      method: 'eth_accounts'
    };

    provider.sendDdpRequest(payload, callback);
    expect(callback).to.not.have.been.calledWith(new Error('This provider doesn\'t support that method'));
  });

  it('should fail to use a JSON-RPC method that is not allowed', function(){
    const callback = sandbox.spy();
    callback.withArgs(new Error('This provider doesn\'t support that method'));
    const payload = {
      method: 'not-allowed-method'
    };

    sandbox.stub(Meteor, 'call', function(method, params, callback) {
      callback(null, {result: []});
    });

    provider.sendDdpRequest(payload, callback);
    expect(callback).to.have.been.called;
  });

  it('should have a method called isConnected that returns true when connected', function (done) {
    sandbox.stub(Meteor, 'call', function(method, params, callback) {
      callback(null, true);
    });

    return provider.isConnected()
    .then(function(connected){
      expect(connected).to.be.true;
      done();
    });
  });

  it('should have a method called isConnected that returns false when not connected', function(done) {
    sandbox.stub(Meteor, 'call', function(method, params, callback) {
      callback(null, false);
    });

    return provider.isConnected()
    .then(function(connected){
      expect(connected).to.be.false;
      done();
    });
  });

  it('should throw if an error occurs with the transaction signer hasAddress function', function() {
    const hasAddressSpy = sandbox.stub(provider.transaction_signer, 'hasAddress').throws();
    const callback = sandbox.spy();

    let _params = {
      from: "0x985095ef977ba75fb2bb79cd5c4b84c81392dff6",
      gas: "0x2fefd8",
      gasPrice: "0xba43b7400",
      nonce: "0x21"
    };

    expect(function() {
      provider.sendAsync({ method: 'eth_sendTransaction', params: [_params]}, callback);
    }).to.throw(Error);

    expect(hasAddressSpy).to.have.been.called;
  });

  it('should throw if an error occurs with the transaction signer signTransaction function', function() {
    const callback = sandbox.spy();
    sandbox.stub(Meteor, 'call', function(method, params, callback) {
      callback(null, {result: '0x0'});
    });

    const signTransactionSpy = sandbox.stub(provider.transaction_signer, 'signTransaction').throws();
    const hasAddressSpy = sandbox.stub(provider.transaction_signer, 'hasAddress', function(address, _callback) {
      _callback(null, true);
    });

    let _params = {
      from: "0x985095ef977ba75fb2bb79cd5c4b84c81392dff6",
      gas: "0x2fefd8",
      gasPrice: "0xba43b7400",
      nonce: "0x21"
    };

    expect(function() {
      provider.sendAsync({ method: 'eth_sendTransaction', params: [_params]}, callback);
    }).to.throw(Error);

    expect(hasAddressSpy).to.have.been.called;
    expect(signTransactionSpy).to.have.been.called;
  });
});
