const { ChainSyncer, InMemoryAdapter } = require('chain-syncer');
const fs = require("fs");

const nftContractJson = JSON.parse(fs.readFileSync("../artifacts/contracts/NFTContract.sol/NFTContract.json", "utf8"));
const nftContractABI = nftContractJson.abi;

const default_adapter = new InMemoryAdapter(); // change it to any other adapter

const contracts = {
    'NFTContract': {
        nftContractABI,
        address: '0x3ABb9A6303a0A17514f40dDFa526f2493a7a75A9',
        start_block: 27118825 // scanner will start from this block
    }
}

const syncer = new ChainSyncer(default_adapter, {

    block_time: 3500,

    network_id: 80001,

    rpc_url: [
        'https://polygon-mumbai.g.alchemy.com/v2/6AHnfnUbxy7QfRdCh2e6CuxRy_egXPMP',
        'https://polygon-mumbai.g.alchemy.com/v2/Jj2_ZPvDzs3qxYOyUx-Uoq8JERV4Atm-' // will be used as a fallback
    ],

    contractsResolver: contract_name => contracts[contract_name],
});

syncer.on('NFTContract.Transfer', async (
    { block_timestamp },
    from,
    to,
    token_id,
) => {
    const nft = await Nft.findOne({ id: token_id });

    if (!nft) { // postpone until nft created in our DB
        return false;
    }
    console.log("nft details", nft);
    nft.owner = to;
    nft.updated_at = new Date(block_timestamp * 1000);
    console.log("nft owner", nft.owner);
    // await nft.save();
});

const run = async () => {
    await syncer.start();
    console.log("sync running");
}
run();