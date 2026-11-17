import { expect } from "chai";
import { ethers } from "hardhat";
import { CollegeAccessControl, ResourceRegistry } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("ResourceRegistry Contract", function () {
  let accessControl: CollegeAccessControl;
  let resourceRegistry: ResourceRegistry;
  let admin: SignerWithAddress;
  let deptAuthorityCSE: SignerWithAddress;
  let deptAuthorityECE: SignerWithAddress;
  let student: SignerWithAddress;

  const DEPARTMENT_AUTHORITY_ROLE = ethers.keccak256(ethers.toUtf8Bytes("DEPARTMENT_AUTHORITY_ROLE"));
  const STUDENT_ROLE = ethers.keccak256(ethers.toUtf8Bytes("STUDENT_ROLE"));

  beforeEach(async function () {
    [admin, deptAuthorityCSE, deptAuthorityECE, student] = await ethers.getSigners();

    const AccessFactory = await ethers.getContractFactory("CollegeAccessControl");
    accessControl = (await AccessFactory.deploy(admin.address)) as CollegeAccessControl;
    await accessControl.waitForDeployment();

    const ResourceFactory = await ethers.getContractFactory("ResourceRegistry");
    resourceRegistry = (await ResourceFactory.deploy(await accessControl.getAddress())) as ResourceRegistry;
    await resourceRegistry.waitForDeployment();

    // Register authorities
    await accessControl.connect(admin).registerUser(
      deptAuthorityCSE.address,
      "AUTH-CSE",
      10, // Department 10 = CSE
      DEPARTMENT_AUTHORITY_ROLE
    );
    await accessControl.connect(admin).registerUser(
      deptAuthorityECE.address,
      "AUTH-ECE",
      20, // Department 20 = ECE
      DEPARTMENT_AUTHORITY_ROLE
    );
    await accessControl.connect(admin).registerUser(
      student.address,
      "STU-001",
      10,
      STUDENT_ROLE
    );
  });

  it("should allow department authority to register their department resource", async function () {
    await expect(
      resourceRegistry.connect(deptAuthorityCSE).registerResource(
        101,
        "CSE Seminar Hall",
        10,
        "ipfs://QmMetadata101",
        2, // min 2 slots (30 min)
        16 // max 16 slots (4 hours)
      )
    ).to.emit(resourceRegistry, "ResourceRegistered").withArgs(
      101,
      "CSE Seminar Hall",
      10,
      "ipfs://QmMetadata101",
      2,
      16,
      deptAuthorityCSE.address
    );

    const res = await resourceRegistry.getResource(101);
    expect(res.name).to.equal("CSE Seminar Hall");
    expect(res.departmentId).to.equal(10);
    expect(res.isActive).to.be.true;
    expect(await resourceRegistry.isResourceActive(101)).to.be.true;
  });

  it("should prevent cross-department authority from registering another department's resource", async function () {
    await expect(
      resourceRegistry.connect(deptAuthorityECE).registerResource(
        102,
        "Unauthorized Lab",
        10, // Targeted CSE
        "ipfs://QmTest",
        1,
        4
      )
    ).to.be.revertedWith("Caller not authorized to manage department resources");
  });

  it("should prevent duplicate resource ID registration", async function () {
    await resourceRegistry.connect(deptAuthorityCSE).registerResource(
      101,
      "CSE Lab A",
      10,
      "ipfs://Qm1",
      1,
      8
    );

    await expect(
      resourceRegistry.connect(deptAuthorityCSE).registerResource(
        101,
        "Duplicate Lab",
        10,
        "ipfs://Qm2",
        1,
        8
      )
    ).to.be.revertedWith("Resource already exists");
  });

  it("should allow deactivation and reactivate resource cleanly", async function () {
    await resourceRegistry.connect(deptAuthorityCSE).registerResource(
      101,
      "CSE Lab A",
      10,
      "ipfs://Qm1",
      1,
      8
    );

    await resourceRegistry.connect(deptAuthorityCSE).deactivateResource(101, "Maintenance");
    expect(await resourceRegistry.isResourceActive(101)).to.be.false;

    await resourceRegistry.connect(deptAuthorityCSE).reactivateResource(101);
    expect(await resourceRegistry.isResourceActive(101)).to.be.true;
  });
});
