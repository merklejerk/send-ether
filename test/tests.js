'use strict'
const _ = require('lodash');
const FlexEther = require('flex-ether');
const BigNumber = require('bignumber.js');
const STARTING_ETHER = new BigNumber('1e18').times(100).toString(10);
const lib = require('../');
const ethjs = require('ethereumjs-util');
const ethjshdwallet = require('ethereumjs-wallet/hdkey');
const ethwallet = require('ethereumjs-wallet');
const bip39 = require('bip39');
const crypto = require('crypto');
const ganache = require('ganache-cli');
const assert = require('assert');

describe('flex-contract', function() {
	let _ganache = null;
	let provider = null;
	let accounts = null;
	let eth = null;

	before(async function() {
		accounts = _.times(16, () => randomAccount());
		provider = ganache.provider({
			accounts: _.map(accounts, (acct, i) => ({
				secretKey: acct.key,
				balance: i == 0 ? STARTING_ETHER : 0
			}))
		});
		eth = new FlexEther({provider: provider});
		// Suppress max listener warnings.
		provider.setMaxListeners(4096);
		provider.engine.setMaxListeners(4096);
	});

	it('fails if insufficient balance', async function() {
		const amount = _.random(1, 1000);
		const to = randomAccount();
		await assert.rejects(lib.sendEther(to.address, amount,
				{from: accounts[1].address, provider: provider, quiet: true}));
	});

	it('can transfer ether via default account', async function() {
		const amount = _.random(1, 1000);
		const to = randomAccount();
		const receipt = await lib.sendEther(to.address, amount,
			{provider: provider, quiet: true});
		assert.ok(receipt.transactionHash);
		assert.equal(await eth.getBalance(to.address), _.toString(amount));
	});

	it('can transfer ether via private key', async function() {
		const amount = _.random(1, 1000);
		const to = randomAccount();
		const receipt = await lib.sendEther(to.address, amount,
			{key: accounts[0].key, provider: provider, quiet: true});
		assert.ok(receipt.transactionHash);
		assert.equal(await eth.getBalance(to.address), _.toString(amount));
	});

	it('can transfer ether via keystore', async function() {
		const amount = _.random(1, 1000);
		const to = randomAccount();
		const PW = crypto.randomBytes(8).toString('hex');
		const keystore = createKeystore(accounts[0], PW);
		const receipt = await lib.sendEther(to.address, amount,
			{keystore: keystore, password: PW, provider: provider, quiet: true});
		assert.ok(receipt.transactionHash);
		assert.equal(await eth.getBalance(to.address), _.toString(amount));
	});

	it('can transfer ether via mnemonic', async function() {
		const amount = _.random(1, 1000);
		const mnemonic = 'shantay you stay';
		const to = randomAccount();
		const from = fromMnemonic(mnemonic);
		await fundAccount(eth, from.address);
		const receipt = await lib.sendEther(to.address, amount,
			{mnemonic: mnemonic, provider: provider, quiet: true});
		assert.ok(receipt.transactionHash);
		assert.equal(await eth.getBalance(to.address), _.toString(amount));
	});

	it('can transfer ether via with different base', async function() {
		const to = randomAccount();
		const receipt = await lib.sendEther(to.address, 1,
			{provider: provider, base: 18, quiet: true});
		assert.ok(receipt.transactionHash);
		assert.equal(await eth.getBalance(to.address),
			_.toString(new BigNumber('1e18').toString(10)));
	});
});

function randomAccount() {
	const key = crypto.randomBytes(32);
	const address = ethjs.toChecksumAddress(
		ethjs.bufferToHex(ethjs.privateToAddress(key)));
	return {
		key: ethjs.bufferToHex(key),
		address: address
	};
}

function createKeystore(acct, pw) {
	const wallet = ethwallet.fromPrivateKey(ethjs.toBuffer(acct.key));
	return wallet.toV3(pw);
}

function fromMnemonic(mnemonic, idx=0) {
	const seed = bip39.mnemonicToSeed(mnemonic.trim());
	const path = `m/44'/60'/0'/0/${idx}`;
	const node = ethjshdwallet.fromMasterSeed(seed).derivePath(path);
	const wallet = node.getWallet();
	return {
		address: wallet.getChecksumAddressString(),
		key: ethjs.bufferToHex(wallet.getPrivateKey())
	};
}

async function fundAccount(eth, address) {
	await eth.transfer(address, new BigNumber('1e18').toString(10));
}
