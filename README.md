# Intrana Project

Welcome to the Intrana Project! This repository contains multiple components for the Intrana NFT Marketplace project.

Overview
The Intrana Project is a comprehensive NFT marketplace platform designed to facilitate the creation, management, and trading of NFTs. This project includes several sub-projects, each serving a specific function within the overall ecosystem:

DAMG-Intrana-Discovery-node: This is the backend server responsible for handling the core logic, APIs, and data management for the NFT marketplace.
Intrana-admin: This is the admin panel interface where administrators can manage the marketplace, including user management, content moderation, and configuration settings.
Intrana-artist: This is the artist interface where creators can mint, manage, and showcase their NFTs.
Intrana-contract-test: This contains the smart contracts and related scripts for deploying and testing the NFT and marketplace contracts on the blockchain.
## Project Structure

The project is divided into several sub-projects, each with its own specific purpose and directory. Below is an overview of the project structure:

```
├── DAMG-Intrana-Discovery-node
│   ├── app.js
│   ├── index.js
│   ├── node_modules
│   ├── package-lock.json
│   ├── package.json
│   ├── server.js
│   └── src
├── Intrana-admin
│   ├── README.md
│   ├── index.html
│   ├── node_modules
│   ├── package-lock.json
│   ├── package.json
│   ├── postcss.config.js
│   ├── public
│   ├── src
│   ├── tailwind.config.js
│   └── vite.config.js
├── Intrana-artist
│   ├── README.md
│   ├── index.html
│   ├── node_modules
│   ├── package-lock.json
│   ├── package.json
│   ├── postcss.config.js
│   ├── public
│   ├── src
│   ├── tailwind.config.js
│   └── vite.config.js
├── Intrana-contract-test
│   ├── README.md
│   ├── backend
│   ├── contracts
│   ├── hardhat.config.js
│   ├── package-lock.json
│   ├── package.json
│   ├── scripts
│   └── test
└── package-lock.json
```

## Sub-Projects

### 1. DAMG-Intrana-Discovery-node

This directory contains the backend server for the NFT marketplace.

- **app.js**: Main application entry point.
- **index.js**: Another entry point for the server.
- **server.js**: Server configuration and setup.
- **src**: Contains source code for the backend logic.
- **package.json**: Dependency and script management.
- **node_modules**: Directory containing installed npm packages.
- **package-lock.json**: Lock file for npm dependencies.

### 2. Intrana-admin

This directory contains the admin panel for managing the NFT marketplace.

- **README.md**: Documentation for the admin panel.
- **index.html**: Main HTML file for the admin interface.
- **src**: Source code for the admin interface.
- **public**: Public assets and static files.
- **postcss.config.js**: PostCSS configuration.
- **tailwind.config.js**: Tailwind CSS configuration.
- **vite.config.js**: Vite configuration for the build process.
- **package.json**: Dependency and script management.
- **node_modules**: Directory containing installed npm packages.
- **package-lock.json**: Lock file for npm dependencies.

### 3. Intrana-artist

This directory contains the artist interface for interacting with the NFT marketplace.

- **README.md**: Documentation for the artist interface.
- **index.html**: Main HTML file for the artist interface.
- **src**: Source code for the artist interface.
- **public**: Public assets and static files.
- **postcss.config.js**: PostCSS configuration.
- **tailwind.config.js**: Tailwind CSS configuration.
- **vite.config.js**: Vite configuration for the build process.
- **package.json**: Dependency and script management.
- **node_modules**: Directory containing installed npm packages.
- **package-lock.json**: Lock file for npm dependencies.

### 4. Intrana-contract-test

This directory contains the code for testing and deploying smart contracts.

- **README.md**: Documentation for contract testing.
- **backend**: Backend code related to smart contracts.
- **contracts**: Smart contract source files.
- **scripts**: Deployment and utility scripts.
- **test**: Test files for smart contracts.
- **hardhat.config.js**: Hardhat configuration for the development environment.
- **package.json**: Dependency and script management.
- **node_modules**: Directory containing installed npm packages.
- **package-lock.json**: Lock file for npm dependencies.

## Getting Started

To get started with the project, follow the instructions in the respective `README.md` files found in each sub-project directory.

### Prerequisites

- Node.js (LTS version recommended)
- npm (Node Package Manager)
- Hardhat (for smart contract testing)

### Installation

Navigate to each sub-project directory and install the required dependencies using npm:

```sh
cd DAMG-Intrana-Discovery-node
npm install

cd ../Intrana-admin
npm install

cd ../Intrana-artist
npm install

cd ../Intrana-contract-test
npm install
```

### Running the Projects

Refer to the individual `README.md` files in each sub-project directory for detailed instructions on how to run each part of the project.

## Contributing

Contributions are welcome! Please read the contribution guidelines in the respective `README.md` files before submitting a pull request.

## License

This project is licensed under the MIT License. See the LICENSE file for more details.

---

Thank you for using the Intrana NFT Marketplace project! If you have any questions or need further assistance, please refer to the documentation or open an issue in the repository.



