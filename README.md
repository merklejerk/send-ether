[![build status](https://travis-ci.org/merklejerk/send-ether.svg?branch=master)](https://travis-ci.org/merklejerk/send-ether)
[![npm package](https://badge.fury.io/js/send-ether.svg)](https://www.npmjs.com/package/send-ether)

# send-ether
A simple CLI tool for sending Ethereum ether using any of the following:

- A wallet's private key
- A keystore file
- An HD wallet mnemonic phrase
- A provider (node) wallet address

For the ERC20 token version of this package, check out
[send-tokens](https://github.com/merklejerk/send-tokens).

### Contents

- [Installation](#installation)
- [Examples](#examples)
- [All Options](#all-options)
- [JSON Logs](#json-logs)
- [ENS Names](#ens-names)
- [Library Usage](#library-usage)

## Installation
```bash
npm install -g send-ether
# or
yarn global add send-ether
```

## Examples
```bash
# Recipient of ether. May also be an ENS name.
DST='0x0420DC92A955e3e139b52142f32Bd54C6D46c023'
# Sending wallet's private key.
PRIVATE_KEY='0x52c251b9e04740157471a724e9a3210b83fac5834b29c89d5bd57661bd2a7057'
# Sending wallet's HD mnemonic.
MNEMONIC='butter crepes sugar flour eggs milk ...'

# Send 100.2 ether to and address,
# on the mainnet, using a wallet's private key
$ send-ether --key $PRIVATE_KEY $DST 100.2

# Send 5.2 gwei (5.2e-9 ether) to an address, on ropsten,
# using an HD wallet mnemonic
$ send-ether --network ropsten --mnemonic "$MNEMONIC" $DST 5.2 -d 9

# Send 10 wei (100e-18 ether) to an address, on the mainnet,
# using a keystore file.
$ send-ether --keystore './path/to/keystore.json' --password 'secret' $DST 10 -d 0

# Send 1.5 ether to an address, on the provider's network,
# using the provider's default wallet, and wait for 3 confirmations.
$ send-ether --provider 'http://localhost:8545' --confirmations 3 $DST 1.5
```

## All Options
```
$ send-ether --help
Usage: send-ether [options] <to> <amount>

Options:

  -v, --version               output the version number
  -d, --decimals <n>          decimal places amount is expressed in (default: 18)
  -k, --key <hex>             sending wallet's private key
  -f, --key-file <file>       sending wallet's private key file
  -s, --keystore-file <file>  sending wallet's keystore file
  --password <password>       keystore file password
  -m, --mnemonic <phrase>     sending wallet's HD wallet phrase
  --mnemonic-index <n>        sending wallet's HD wallet account index (default: 0)
  -a, --account <hex>         sending wallet's account address (provider wallet)
  -c, --confirmations <n>     number of confirmations to wait for before returning (default: 0)
  -p, --provider <uri>        provider URI
  -n, --network <name>        network name
  -G, --gas-price <gwei>      explicit gas price, in gwei (e.g., 20)
  -l, --log <file>            append a JSON log to a file
  --no-confirm                bypass input confirmation
  -h, --help                  output usage information
```

## JSON Logs
If you pass the `--log` option, a JSON object describing the transfer
will be appended to a file when the transaction is mined, one object per line.

##### Log Entries
Log entries follow this structure:
```js
{
   // Unique transfer ID to identify related logs.
   id: '88fdd8a4b8084c36',
   // UNIX time.
   time: 1532471209842,
   // Address of sender.
   from: '0x0420DC92A955e3e139b52142f32Bd54C6D46c023',
   // Address of recipient.
   to: '0x2621Ea417659Ad69BAE66AF05eBE5788e533E5e8',
   // Amount of ether sent (in weis).
   amount: '20',
   // Transaction ID of transfer.
   txId: '0xd9255f8365305ebffd77cb30d09f82745eaa232e42739f5fc2788fa46f1347e3',
   // Block number where the transfer was mined.
   block: 4912040,
   // Gas used.
   gas: 40120
}
```

## ENS Names
Anywhere you can pass an address, you can also pass an ENS name, like
`'ethereum.eth'`, and the it will automatically be resolved to a real
address.

ENS resolution only works on the mainnet, rinkeby, and ropsten, and the name
must be fully registered with the ENS contract and a resolver.


## Library Usage
The `send-ether` package can be used as a library through the `sendEther()`
function.

`sendEther()` asynchronously resolves to a
[transaction receipt](https://web3js.readthedocs.io/en/1.0/web3-eth.html#eth-gettransactionreceipt-return)
once the transaction has been mined (or confirmed, if the
`confirmations` option is > 0).

#### sendEther() Examples

```js
const {sendEther} = require('send-ether');
// Recipient of ether.
const RECIPIENT = '0x0420DC92A955e3e139b52142f32Bd54C6D46c023';

// Sending wallet's private key.
const PRIVATE_KEY = '0x52c251b9e04740157471a724e9a3210b83fac5834b29c89d5bd57661bd2a7057';
// Send 100.5 ether to someone using a private key and wait for
// it to be mined.
let receipt = await sendEther(RECIPIENT, '100.5',
  {key: PRIVATE_KEY});

// Sending wallet's mnemonic.
const MNEMONIC = 'butter crepes sugar flour eggs milk ...';
// Send 32 wei (32e-18) to someone using a (BIP39) mnemonic phrase
// and wait for it to be mined and confirmed 3 times.
receipt = await sendEther(RECIPIENT, '32',
  {mnemonic: MNEMONIC, confirmations: 3, decimals: 0});

// Sending wallet's keystore file contents as a string.
const KEYSTORE = '{...}';
// Keystore password.
const PASSWORD = 'secret';
// Send 20.1 gwei (1e-9) to someone using a keystore file,
// print the transaction ID when it's available, and wait for it to be mined.
receipt = await sendEther(RECIPIENT, '20.1', {
    keystore: KEYSTORE,
    password: PASSWORD,
    decimals: 9,
    onTxId: console.log
  });
```

#### Full sendEther() Options

```js
const {sendEther} = require('send-ether');
// Send AMOUNT ether to RECIPIENT.
{tx: Object} = async sendEther(
  // Address of recipient.
  // Should be a hex string ('0x...')
  RECIPIENT: String,
  // Amount of ether to send. Units depend on `decimals` option.
  // Should be a base-10 decimal string (e.g., '1234.567').
  AMOUNT: String,
  // Options object
  {
    // Suppress output.
    quiet: Boolean,
    // If specified, append to a JSON log file at this path.
    log: String,
    // Call this function, passing the transaction hash/ID of the transaction
    // once it becomes available (transaction is posted to the blockchain but
    // not yet mined).
    onTxId: Function,
    // Decimal places of amount.
    // E.g., 18 for whole ether, 0 for wei or smallest decimals.
    // Defaults to 18.
    decimals: Number,
    // If connecting to a custom provider (e.g., a private node), this
    // can be the set to the address of an unlocked wallet on the provider
    // from which to send the ether.
    account: String,
    // Hex-encoded 32-byte private key of sender (e.g., '0x1234...').
    key: String,
    // BIP39 mnemonic phrase of sender.
    mnemonic: String,
    // Sender's Mnemonic account index. Defaults to 0.
    mnemonicIndex: Number,
    // Sender's JSON-encoded keystore file contents.
    keystore: String,
    // Sender's keystore file path.
    keystoreFile: String,
    // Keystore password.
    password: String,
    // Ethereum network to use. May be 'main', 'ropsten', 'rinkeby', or 'kovan'.
    // Defaults to 'main',
    network: String,
    // Gas price for the transaction.
    // Should be a number in gweis.
    // Defaults to current network gas price.
    gasPrice: Number,
    // Number of confirmations to wait for after the transaction is mined.
    // Maximum of 12. Defaults to 0 (no confirmations).
    confirmations: Number,
    // Infura API key to use.
    infuraKey: String,
    // Custom provider. May either be a URI (e.g., http://localhost:8545) or
    // a Provider object from Web3.
    provider: String | Object,
    // Custom web3 object.
    web3: Object
  });
```

#### toWallet()
Another exposed library function is `toWallet()`, which returns an address
& private key pair from a private key, mnemonic, or keystore. Below are the
full options.

```js
const {toWallet} = require('send-ether');
// Convert a private key, mnemonic, or keystore to an address and private-key
// pair object. Both fields will be a hex-encoded string.
{address: String, key: String} = toWallet({
    // Hex-encoded 32-byte private key of sender (e.g., '0x1234...').
    key: String,
    // BIP39 mnemonic phrase.
    mnemonic: String,
    // Mnemonic account index. Defaults to 0.
    mnemonicIndex: Number,
    // JSON-encoded keystore file contents.
    keystore: String,
    // Keystore password (if `keystore` is passed).
    password: String
  });
```
