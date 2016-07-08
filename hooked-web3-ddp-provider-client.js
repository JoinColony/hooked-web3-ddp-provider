import { Meteor } from 'meteor/meteor';
import Web3 from 'web3';

export class HookedWeb3DdpProvider {
  constructor({transaction_signer}) {
    // Cache of the most up to date transaction counts (nonces) for each address
    // encountered by the web3 provider that's managed by the transaction signer.
    this.global_nonces = {};
    this._web3 = new Web3;
    this.transaction_signer = transaction_signer;
  }

  // Synchronous send is not feasable in this context
  send() {
    throw new Error('HookedWeb3DdpProvider does not support synchronous transactions.');
  }

  // Catch the requests at the sendAsync level, rewriting all sendTransaction
  // methods to sendRawTransaction, calling out to the transaction_signer to
  // get the data for sendRawTransaction.
  sendAsync(payload, callback) {
    var self = this;
    const finishedWithRewrite = (error) => {
      //this function may be called with an error as an argument, we should
      //catch it and bubble it up
      if(error && error instanceof Error) {
        callback(error);
      } else {
        self.sendDdpRequest(payload, callback);
      }
    };

    const requests = [].concat(payload);
    this.rewritePayloads(0, requests, {}, finishedWithRewrite);
  }

  sendDdpRequest(payload, callback) {
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
      return callback(new Error('This provider doesn\'t support that method'));
    }

    Meteor.call('web3DdpProviderExec', payload, callback);
  }

  isConnected() {
    return new Promise((resolve, reject) => {
      this.sendAsync({
        id: 9999999999,
        jsonrpc: '2.0',
        method: 'net_listening',
        params: []
      }, function (err, result) {
        if (err) {
          return reject(err);
        }
        resolve(!!result);
      });
    });
  }

  // Rewrite all eth_sendTransaction payloads in the requests array.
  // This takes care of batch requests, and updates the nonces accordingly.
  rewritePayloads(index, requests, session_nonces, finished) {

    var self = this;
    if (index >= requests.length) {
      return finished();
    }

    var payload = requests[index];

    // Function to remove code duplication for going to the next payload
    var next = (err) => {
      if (err != null) {
        return finished(err);
      }
      return self.rewritePayloads(index + 1, requests, session_nonces, finished);
    };

    // If this isn't a transaction we can modify, ignore it.
    if (payload.method != 'eth_sendTransaction') {
      return next();
    }

    var tx_params = payload.params[0];
    var sender = tx_params.from;

    self.transaction_signer.hasAddress(sender, (err, has_address) => {
      if (err != null || has_address == false) {
        return next(err);
      }

      // Get the nonce, requesting from web3 if we haven't already requested it in this session.
      // Remember: "session_nonces" is the nonces we know about for this batch of rewriting (this "session").
      //           Having this cache makes it so we only need to call getTransactionCount once per batch.
      //           "global_nonces" is nonces across the life of this provider.
      var getNonce = (done) => {
        // If a nonce is specified in our nonce list, use that nonce.
        var nonce = session_nonces[sender];
        if (nonce != null) {
          done(null, nonce);
        } else {
          // Include pending transactions, so the nonce is set accordingly.
          // Note: "pending" doesn't seem to take effect for some Ethereum clients (geth),
          // hence the need for global_nonces.
          // We call directly to our own sendAsync method, because the web3 provider
          // is not guaranteed to be set.
          self.sendAsync({
            jsonrpc: '2.0',
            method: 'eth_getTransactionCount',
            params: [sender, 'pending'],
            id: (new Date()).getTime()
          }, function(err, result) {
            if (err != null) {
              done(err);
            } else {
              var new_nonce = result.result;
              done(null, self._web3.toDecimal(new_nonce));
            }
          });
        }
      };

      // Get the nonce, requesting from web3 if we need to.
      // We then store the nonce and update it so we don't have to
      // to request from web3 again.
      getNonce((err, nonce) => {
        if (err != null) {
          return finished(err);
        }

        // Set the expected nonce, and update our caches of nonces.
        // Note that if our session nonce is lower than what we have cached
        // across all transactions (and not just this batch) use our cached
        // version instead, even if
        var final_nonce = Math.max(nonce, self.global_nonces[sender] || 0);

        // Update the transaction parameters.
        tx_params.nonce = self._web3.toHex(final_nonce);

        // Update caches.
        session_nonces[sender] = final_nonce + 1;
        self.global_nonces[sender] = final_nonce + 1;

        // If our transaction signer does represent the address,
        // sign the transaction ourself and rewrite the payload.
        self.transaction_signer.signTransaction(tx_params, function(err, raw_tx) {
          if (err != null) {
            return next(err);
          }

          payload.method = 'eth_sendRawTransaction';
          payload.params = [raw_tx];
          return next();
        });
      });
    });
  }
}
