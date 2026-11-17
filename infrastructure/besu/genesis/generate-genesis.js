const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");

// Deterministic validator wallets for local consortium nodes
const validators = [
  { name: "node1", operator: "Department A", wallet: new ethers.Wallet("0x8f2a55949038a9610f50fb23b5883af3b4ecb3c3bb792cbcefbd1542c692be63") },
  { name: "node2", operator: "Department B", wallet: new ethers.Wallet("0xc87509a1c067bbde78beb793e6fa76530b6382a4c0241e5e4a9ec0a0f44dc0d3") },
  { name: "node3", operator: "Department C", wallet: new ethers.Wallet("0xae6cb872f5866671f5f14f5492838cbdd0d5071870bc405022f131f160e8bb75") },
  { name: "node4", operator: "Central Administration", wallet: new ethers.Wallet("0x2a871d0798f97d79848a013d4936a73bf4cc922c825d33c1cf7073dff6d409c6") }
];

console.log("=== Hyperledger Besu QBFT Validators ===");
const validatorAddresses = [];

validators.forEach(v => {
  const cleanAddr = v.wallet.address.toLowerCase().replace("0x", "");
  validatorAddresses.push(cleanAddr);
  console.log(`${v.name} (${v.operator}): 0x${cleanAddr}`);
  
  // Write node key
  const keyDir = path.resolve(__dirname, `../validators/${v.name}/data`);
  fs.mkdirSync(keyDir, { recursive: true });
  fs.writeFileSync(path.join(keyDir, "key"), v.wallet.privateKey.replace("0x", "") + "\n");
});

// QBFT ExtraData Encoding:
// 32 bytes 0x00 + RLP([validators array, [] votes, [] round, [] seals])
// For genesis, Besu QBFT expects extraData with 32 bytes prefix + RLP of validators
const encodedValidators = "0x" + "00".repeat(32) + "f856" + "ea94" + validatorAddresses.join("94") + "c080c0";

const genesis = {
  "config": {
    "chainId": 1337,
    "homesteadBlock": 0,
    "eip150Block": 0,
    "eip155Block": 0,
    "eip158Block": 0,
    "byzantiumBlock": 0,
    "constantinopleBlock": 0,
    "petersburgBlock": 0,
    "istanbulBlock": 0,
    "qbft": {
      "blockperiodseconds": 1,
      "epochlength": 30000,
      "requesttimeoutseconds": 4,
      "validators": validators.map(v => v.wallet.address)
    }
  },
  "nonce": "0x0",
  "timestamp": "0x58ee40ba",
  "extraData": encodedValidators,
  "gasLimit": "0x1fffffffffffff",
  "difficulty": "0x1",
  "mixHash": "0x63746963616c2062797a616e74696e65206661756c7420746f6c6572616e6365",
  "alloc": {
    "0xfe3b557e8fb62b89f4916b721be55ceb828dbd73": {
      "balance": "0x10000000000000000000000000000000"
    },
    "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266": {
      "balance": "0x10000000000000000000000000000000"
    }
  }
};

validators.forEach(v => {
  genesis.alloc[v.wallet.address.toLowerCase()] = {
    "balance": "0x10000000000000000000000000000000"
  };
});

const genesisPath = path.resolve(__dirname, "genesis.json");
fs.writeFileSync(genesisPath, JSON.stringify(genesis, null, 2));
console.log(`\nGenesis written to ${genesisPath}`);
