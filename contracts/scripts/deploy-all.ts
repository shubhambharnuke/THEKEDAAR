import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);

  // 1. Deploy CollegeAccessControl
  const AccessFactory = await ethers.getContractFactory("CollegeAccessControl");
  const accessControl = await AccessFactory.deploy(deployer.address);
  await accessControl.waitForDeployment();
  const accessControlAddress = await accessControl.getAddress();
  console.log("CollegeAccessControl deployed to:", accessControlAddress);

  // 2. Deploy ResourceRegistry
  const ResourceFactory = await ethers.getContractFactory("ResourceRegistry");
  const resourceRegistry = await ResourceFactory.deploy(accessControlAddress);
  await resourceRegistry.waitForDeployment();
  const resourceRegistryAddress = await resourceRegistry.getAddress();
  console.log("ResourceRegistry deployed to:", resourceRegistryAddress);

  // 3. Deploy BookingManager
  const BookingFactory = await ethers.getContractFactory("BookingManager");
  const bookingManager = await BookingFactory.deploy(accessControlAddress, resourceRegistryAddress);
  await bookingManager.waitForDeployment();
  const bookingManagerAddress = await bookingManager.getAddress();
  console.log("BookingManager deployed to:", bookingManagerAddress);

  // 4. Deploy ApprovalManager
  const ApprovalFactory = await ethers.getContractFactory("ApprovalManager");
  const approvalManager = await ApprovalFactory.deploy(
    accessControlAddress,
    resourceRegistryAddress,
    bookingManagerAddress
  );
  await approvalManager.waitForDeployment();
  const approvalManagerAddress = await approvalManager.getAddress();
  console.log("ApprovalManager deployed to:", approvalManagerAddress);

  // Set ApprovalManager inside BookingManager
  await bookingManager.setApprovalManager(approvalManagerAddress);
  console.log("BookingManager: ApprovalManager configured.");

  // 5. Deploy DocumentRegistry
  const DocFactory = await ethers.getContractFactory("DocumentRegistry");
  const docRegistry = await DocFactory.deploy();
  await docRegistry.waitForDeployment();
  const docRegistryAddress = await docRegistry.getAddress();
  console.log("DocumentRegistry deployed to:", docRegistryAddress);

  // 6. Deploy SystemGovernance
  const GovFactory = await ethers.getContractFactory("SystemGovernance");
  const governance = await GovFactory.deploy(accessControlAddress);
  await governance.waitForDeployment();
  const governanceAddress = await governance.getAddress();
  console.log("SystemGovernance deployed to:", governanceAddress);

  const deploymentData = {
    network: "besu_qbft_local",
    chainId: 1337,
    deployer: deployer.address,
    contracts: {
      CollegeAccessControl: accessControlAddress,
      ResourceRegistry: resourceRegistryAddress,
      BookingManager: bookingManagerAddress,
      ApprovalManager: approvalManagerAddress,
      DocumentRegistry: docRegistryAddress,
      SystemGovernance: governanceAddress,
    },
    deployedAt: new Date().toISOString(),
  };

  // Export to frontend apps/web/lib/contracts/
  const frontendContractsDir = path.resolve(__dirname, "../../apps/web/lib/contracts");
  if (!fs.existsSync(frontendContractsDir)) {
    fs.mkdirSync(frontendContractsDir, { recursive: true });
  }
  fs.writeFileSync(
    path.join(frontendContractsDir, "deployments.json"),
    JSON.stringify(deploymentData, null, 2)
  );

  // Export to backend app/blockchain/abi/
  const backendAbiDir = path.resolve(__dirname, "../../backend/app/blockchain/abi");
  if (!fs.existsSync(backendAbiDir)) {
    fs.mkdirSync(backendAbiDir, { recursive: true });
  }
  fs.writeFileSync(
    path.join(backendAbiDir, "deployments.json"),
    JSON.stringify(deploymentData, null, 2)
  );

  // Export ABIs
  const contractNames = [
    "CollegeAccessControl",
    "ResourceRegistry",
    "BookingManager",
    "ApprovalManager",
    "DocumentRegistry",
    "SystemGovernance",
  ];

  for (const name of contractNames) {
    const artifactPath = path.resolve(__dirname, `../artifacts/contracts/${name}.sol/${name}.json`);
    if (fs.existsSync(artifactPath)) {
      const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
      fs.writeFileSync(path.join(frontendContractsDir, `${name}.json`), JSON.stringify(artifact, null, 2));
      fs.writeFileSync(path.join(backendAbiDir, `${name}.json`), JSON.stringify(artifact, null, 2));
    }
  }

  console.log("Contract ABIs and deployment addresses exported successfully to frontend and backend.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
