const Transaction = require("@ethereumjs/tx").Transaction;
const EIP1559Transaction = require("@ethereumjs/tx").FeeMarketEIP1559Transaction;
const Transport = require('@ledgerhq/hw-transport-node-hid').default
const AppEth = require('@ledgerhq/hw-app-eth').default
const Common = require("@ethereumjs/common").default;
const BN = require("bn.js");
const {bnToRlp, rlp} = require("ethereumjs-util");
const decode = require("rlp").decode;

async function testEIP1559Signing(self, chainId, hexTx) {
    const ethTx = Buffer.from(hexTx, 'hex');
    const chainParams = { common: Common.forCustomChain('mainnet', { networkId: 1, chainId }, 'istanbul')};
    const devices = await Transport.list()
    if (devices.length === 0) throw 'no device'
    const transport = await Transport.create()
    const eth = new AppEth(transport)
    const dat = await eth.signTransaction("44'/60'/0'/0/0", ethTx);
    var chain = Common.forCustomChain(1, { name: 'avalanche', networkId: 1, chainId }, 'london');
    // remove the first byte from the start of the ethtx, the transactionType that's indicating it's an eip1559 transaction
    var txnBufs = decode(ethTx.slice(1)).
        slice(0,9).
        concat([dat.v, dat.r, dat.s].
          map(a=>Buffer.from(((a.length%2==1)?'0'+a:a),'hex')));
    var ethTxObj = EIP1559Transaction.fromValuesArray(txnBufs, {common: chain});
    console.log("********************************************************************");
    console.log("dat looks like");
    console.log(dat);
    console.log("txnBufs looks like");
    console.log(txnBufs);
    console.log("ethTxObj looks like");
    console.log(ethTxObj);
    console.log("recovered Sender-address");
    console.log(ethTxObj.getSenderAddress().toString('hex'));
    console.log("********************************************************************");  
}

const rawUnsignedEIP1559Transaction = (chainId, unsignedTxParams) => {
    const common = Common.forCustomChain(1, { name: 'avalanche', networkId: 1, chainId }, 'london');
  
    const unsignedTx = EIP1559Transaction.fromTxData({...unsignedTxParams}, { common });
  
    // https://github.com/ethereumjs/ethereumjs-monorepo/issues/1188
    return unsignedTx.getMessageToSign(false);
};

async function main() {
    try {
        const chainId = 43113;
        const tx = rawUnsignedEIP1559Transaction(chainId, {
        // chainId: chainId is passed through,
        nonce: '0x18', // 24
        maxFeePerGas: '0x5D21DBA00', //25000000000
        maxPriorityFeePerGas: '0x' + '5D21DBA00', //25000000000
        gasLimit: '0x' + '5208', //21000
        to: '0x1008aAcD107CCd90C9b3991B281c4c722c4cd4B1',
        value: '0x' + 'DE0B6B3A7640000', //1000000000000000000
        // data: use the default
        // accessList: use the default
        // v: use the default
        // r: use the default
        // s: use the default
        });
        await testEIP1559Signing(this, chainId, tx);
    } catch (err) {
        console.log(err);
    }

}

main()