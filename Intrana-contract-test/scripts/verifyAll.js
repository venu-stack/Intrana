const { ethers } = require('ethers');

// Function to verify all deployed contracts
async function main() {
    // Create a provider instance using the API URL from environment variables
    const provider = new ethers.providers.JsonRpcProvider(
        process.env.API_URL
    );
    // Create a wallet instance using the private key from environment variables and the provider
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    // Connect the wallet to the provider to get a signer
    const signer = wallet.connect(provider);

    // Define the address and constructor arguments for the NFT contract
    const nftContractAddress = "0x61E755B31F0f57c54a6a206604aC1781A55D7547";
    const nftContractConstructor = ["NFT", "NFT", "www.nft.com/", "0x703632A0b52244fAbca04aaE138fA8EcaF72dCBC"];

    // Define the address for the NFT factory contract
    const nftFactoryAddress = "0x3855E070De7D6D827A01732d452bbC6933fEFbC6";

    // Define the address and constructor arguments for the token contract
    const tokenContractAddress = "0xf8232006651a44f1a9A96FA76544338013d003E0";
    const tokenContractConstructor = ["WTN", "WTN"];

    // Define the address and constructor arguments for the NFT marketplace contract
    const nftMarketplaceAddress = "0x7Fe5f005376C2AA25EE093038A53738c9e6Bd6A6";
    const nftMarketplaceConstructor = [tokenContractAddress];

    // Verify the NFT contract deployment
    await run('verify:verify', {
        address: nftContractAddress,
        constructorArguments: nftContractConstructor
    });

    // Verify the NFT factory contract deployment
    await run('verify:verify', {
        address: nftFactoryAddress,

    });

    // Verify the token contract deployment
    await run('verify:verify', {
        address: tokenContractAddress,
        constructorArguments: tokenContractConstructor
    });

    // Verify the NFT marketplace contract deployment
    await run('verify:verify', {
        address: nftMarketplaceAddress,
        constructorArguments: nftMarketplaceConstructor
    });
}

// Call the main function and handle any errors or successful execution
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
