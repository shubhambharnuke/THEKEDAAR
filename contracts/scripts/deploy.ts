import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying DocumentRegistry contract with account:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "ETH");

  const DocumentRegistry = await ethers.getContractFactory("DocumentRegistry");
  const registry = await DocumentRegistry.deploy();
  await registry.waitForDeployment();

  const contractAddress = await registry.getAddress();
  console.log("DocumentRegistry deployed successfully to:", contractAddress);

  // Read compiled artifact
  const artifactPath = path.join(
    __dirname,
    "../artifacts/contracts/DocumentRegistry.sol/DocumentRegistry.json"
  );
  const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));

  const deploymentData = {
    address: contractAddress,
    network: (await ethers.provider.getNetwork()).name,
    chainId: Number((await ethers.provider.getNetwork()).chainId),
    abi: artifact.abi,
    deployedAt: new Date().toISOString(),
  };

  // Export to backend blockchain artifacts directory
  const backendArtifactDir = path.join(__dirname, "../../backend/app/blockchain/artifacts");
  fs.mkdirSync(backendArtifactDir, { recursive: true });
  fs.writeFileSync(
    path.join(backendArtifactDir, "DocumentRegistry.json"),
    JSON.stringify(deploymentData, null, 2)
  );
  console.log("Exported contract ABI & address to backend/app/blockchain/artifacts/DocumentRegistry.json");

  // Export to apps/web contracts directory
  const webArtifactDir = path.join(__dirname, "../../apps/web/lib/contracts");
  fs.mkdirSync(webArtifactDir, { recursive: true });
  fs.writeFileSync(
    path.join(webArtifactDir, "DocumentRegistry.json"),
    JSON.stringify(deploymentData, null, 2)
  );
  console.log("Exported contract ABI & address to apps/web/lib/contracts/DocumentRegistry.json");
}

main().catch((error) => {
  console.error("Deployment failed:", error);
  process.exitCode = 1;
});
