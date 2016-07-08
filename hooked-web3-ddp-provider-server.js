import {Meteor} from 'meteor/meteor';

export const gethAddress = process.env.GETH_ADDRESS || '127.0.0.1';
export const gethPort = process.env.GETH_PORT || '8545';

Meteor.methods({
  'web3DdpProviderExec': function (payload) {
    if (Array.isArray(payload)) {
      payload.map(checkIfMethodIsAllowed);
    } else {
      checkIfMethodIsAllowed(payload);
    }

    const response =  Meteor.http.call('POST', 'http://' + gethAddress + ':' + gethPort, {
      content: JSON.stringify(payload)
    });

    try {
      return JSON.parse(response.content);
    } catch (e) {
      console.log(e);
      throw new Error('Could not parse JSONRPC response');
    }
  }
});

function checkIfMethodIsAllowed(payload) {
   const supportedMethods = [
    'eth_call',
    'eth_accounts',
    'eth_sendRawTransaction',
    'eth_newPendingTransactionFilter',
    'eth_newBlockFilter',
    'eth_newFilter',
    'eth_uninstallFilter',
    'eth_getFilterChanges',
    'eth_getFilterLogs',
    'eth_getTransactionReceipt',
    'eth_getLogs',
    'eth_getTransactionCount',
    'eth_gasPrice',
    'eth_getTransactionByHash',
    'eth_estimateGas',
    'eth_getBalance',
    'net_listening'
  ];
  if (supportedMethods.indexOf(payload.method) < 0) {
    throw new Error('This provider doesn\'t support that method');
  }
}
