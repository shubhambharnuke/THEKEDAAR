import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Seeding on-chain resources and registering roles with account:", deployer.address);

  const deployments = require("../../apps/web/lib/contracts/deployments.json");
  const accessControlAddress = deployments.contracts.CollegeAccessControl;
  const resourceRegistryAddress = deployments.contracts.ResourceRegistry;

  const AccessFactory = await ethers.getContractFactory("CollegeAccessControl");
  const accessControl = AccessFactory.attach(accessControlAddress);

  const ResourceFactory = await ethers.getContractFactory("ResourceRegistry");
  const resourceRegistry = ResourceFactory.attach(resourceRegistryAddress);

  const STUDENT_ROLE = ethers.keccak256(ethers.toUtf8Bytes("STUDENT_ROLE"));
  const CLUB_MEMBER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("CLUB_MEMBER_ROLE"));
  const DEPARTMENT_AUTHORITY_ROLE = ethers.keccak256(ethers.toUtf8Bytes("DEPARTMENT_AUTHORITY_ROLE"));

  // 1. Register Authority (Dept 1 & 2) and Club roles for deployer & test accounts
  const accountsToRegister = [
    { addr: "0xfe3b557e8fb62b89f4916b721be55ceb828dbd73", id: "AUTH-DEPT-A", dept: 1, role: DEPARTMENT_AUTHORITY_ROLE },
    { addr: "0x627306090abab3a6e1400e9345bc60c78a8bef57", id: "AUTH-DEPT-B", dept: 2, role: DEPARTMENT_AUTHORITY_ROLE },
  ];

  for (const acc of accountsToRegister) {
    const isReg = await (accessControl as any).isUserRegistered(acc.addr);
    if (!isReg) {
      const tx = await (accessControl as any).registerUser(acc.addr, acc.id, acc.dept, acc.role);
      await tx.wait();
      console.log(`Registered on-chain: ${acc.addr} (${acc.id})`);
    } else {
      console.log(`Already registered: ${acc.addr}`);
    }
  }

  // Also ensure deployer has CLUB_MEMBER_ROLE and DEPARTMENT_AUTHORITY_ROLE
  const isDeployerReg = await (accessControl as any).isUserRegistered(deployer.address);
  if (isDeployerReg) {
    await (accessControl as any).grantInstitutionalRole(CLUB_MEMBER_ROLE, deployer.address);
    await (accessControl as any).grantInstitutionalRole(DEPARTMENT_AUTHORITY_ROLE, deployer.address);
    console.log(`Granted CLUB_MEMBER_ROLE & DEPARTMENT_AUTHORITY_ROLE to deployer ${deployer.address}`);
  }

  // 2. Register resources 1, 2, 3 on-chain in ResourceRegistry
  const resourcesToSeed = [
    { id: 1, name: "Dr. APJ Abdul Kalam Main Auditorium", dept: 2, meta: "ipfs://AUDI_MAIN", minSlots: 2, maxSlots: 16 },
    { id: 2, name: "Mini Auditorium", dept: 2, meta: "ipfs://AUDI_MINI", minSlots: 1, maxSlots: 8 },
    { id: 3, name: "Sir Visvesvaraya Seminar Hall A", dept: 1, meta: "ipfs://SEM_HALL_A", minSlots: 1, maxSlots: 8 },
    { id: 4, name: "Sir Visvesvaraya Seminar Hall B", dept: 1, meta: "ipfs://SEM_HALL_B", minSlots: 1, maxSlots: 8 },
    { id: 5, name: "Computer Center Lab 1", dept: 1, meta: "ipfs://LAB_1", minSlots: 2, maxSlots: 12 },
  ];

  for (const r of resourcesToSeed) {
    const isActive = await (resourceRegistry as any).isResourceActive(r.id);
    if (!isActive) {
      const tx = await (resourceRegistry as any).registerResource(
        r.id,
        r.name,
        r.dept,
        r.meta,
        r.minSlots,
        r.maxSlots
      );
      await tx.wait();
      console.log(`Registered resource #${r.id} (${r.name}) on-chain.`);
    } else {
      console.log(`Resource #${r.id} already active.`);
    }
  }

  console.log("On-chain seeding complete!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
