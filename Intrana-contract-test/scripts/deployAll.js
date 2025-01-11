const { ethers } = require('ethers');
const fs = require("fs");

// const nftJson = JSON.parse(fs.readFileSync("./artifacts/contracts/NFT.sol/ERC20.json", "utf8"));
// const nftABI = nftJson.abi;
// const nftBytecode = nftJson.bytecode;

const nftContractJson = JSON.parse(fs.readFileSync("./artifacts/contracts/NFTContract.sol/NFTContract.json", "utf8"));
const nftContractABI = nftContractJson.abi;
const nftContractBytecode = nftContractJson.bytecode;

const nftFactoryJson = JSON.parse(fs.readFileSync("./artifacts/contracts/NFTFactory.sol/NFTFactory.json", "utf8"));
const nftFactoryABI = nftFactoryJson.abi;
const nftFactoryBytecode = nftFactoryJson.bytecode;

const tokenContractJson = JSON.parse(fs.readFileSync("./artifacts/contracts/TokenContract.sol/TokenContract.json", "utf8"));
const tokenContractABI = tokenContractJson.abi;
const tokenContractBytecode = tokenContractJson.bytecode;

const nftMarketplaceJson = JSON.parse(fs.readFileSync("./artifacts/contracts/NFTMarketplace.sol/NFTMarketplace.json", "utf8"));
const nftMarketplaceABI = nftMarketplaceJson.abi;
const nftMarketplaceBytecode = nftMarketplaceJson.bytecode;

async function main() {
    const provider = new ethers.providers.JsonRpcProvider(
        process.env.API_URL
    );
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    const signer = wallet.connect(provider);
    console.log(`Deploying contracts with the account: ${signer.address}`);

    // // Deploy the nft contract using the provided abi and bytecode
    // const nftFactory = new ethers.ContractFactory(nftABI, nftBytecode, signer);
    // const nftContract = await nftFactory.deploy();

    // await nftContract.deployed();
    // console.log('NFTContract deployed to:', nftContract.address);

    // Deploy the nft contract using the provided abi and bytecode
    const nftContractFactory = new ethers.ContractFactory(nftContractABI, nftContractBytecode, signer);
    const nftContractContract = await nftContractFactory.deploy("NFT", "NFT", "www.nft.com/", "0xcC59A62Edb26Ad08E15C896a255dED7eA3Ebae1C");

    await nftContractContract.deployed();
    console.log('NFTContract deployed to:', nftContractContract.address);

    // Deploy the nft factory contract using the provided abi and bytecode
    const nftFactoryFactory = new ethers.ContractFactory(nftFactoryABI, nftFactoryBytecode, signer);
    const nftFactoryContract = await nftFactoryFactory.deploy();

    await nftFactoryContract.deployed();
    console.log('NFTFactory deployed to:', nftFactoryContract.address);

    // // Deploy the token contract using the provided abi and bytecode
    // const tokenContractFactory = new ethers.ContractFactory(tokenContractABI, tokenContractBytecode, signer);
    // const tokenContractContract = await tokenContractFactory.deploy("WTN", "WTN");

    // await tokenContractContract.deployed();
    // console.log('TokenContract deployed to:', tokenContractContract.address);

    // Deploy the nft marketplace contract using the provided abi and bytecode
    const nftMarketplaceFactory = new ethers.ContractFactory(nftMarketplaceABI, nftMarketplaceBytecode, signer);
    // const nftMarketplaceContract = await nftMarketplaceFactory.deploy(tokenContractContract.address);
    const nftMarketplaceContract = await nftMarketplaceFactory.deploy("0x65Bb7B496395250319Cfe34883eD00719C3F4e1b");

    await nftMarketplaceContract.deployed();
    console.log('NFTMarketplace deployed to:', nftMarketplaceContract.address);
}

// Run the deployment
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
