import { expect } from "chai";
import { ethers } from "hardhat";
import { CollegeAccessControl } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("CollegeAccessControl Contract", function () {
  let accessControl: CollegeAccessControl;
  let admin: SignerWithAddress;
  let regAuthority: SignerWithAddress;
  let deptAuthority: SignerWithAddress;
  let student: SignerWithAddress;
  let club: SignerWithAddress;
  let unauthorized: SignerWithAddress;

  const STUDENT_ROLE = ethers.keccak256(ethers.toUtf8Bytes("STUDENT_ROLE"));
  const CLUB_MEMBER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("CLUB_MEMBER_ROLE"));
  const DEPARTMENT_AUTHORITY_ROLE = ethers.keccak256(ethers.toUtf8Bytes("DEPARTMENT_AUTHORITY_ROLE"));
  const REGISTRATION_AUTHORITY_ROLE = ethers.keccak256(ethers.toUtf8Bytes("REGISTRATION_AUTHORITY_ROLE"));

  beforeEach(async function () {
    [admin, regAuthority, deptAuthority, student, club, unauthorized] = await ethers.getSigners();

    const Factory = await ethers.getContractFactory("CollegeAccessControl");
    accessControl = (await Factory.deploy(admin.address)) as CollegeAccessControl;
    await accessControl.waitForDeployment();

    // Register registration authority
    await accessControl.connect(admin).registerUser(
      regAuthority.address,
      "REG-001",
      0,
      REGISTRATION_AUTHORITY_ROLE
    );
  });

  it("should initialize with admin properly configured", async function () {
    expect(await accessControl.isUserRegistered(admin.address)).to.be.true;
    expect(await accessControl.isWalletSuspended(admin.address)).to.be.false;
    expect(await accessControl.hasActiveRole(await accessControl.DEFAULT_ADMIN_ROLE(), admin.address)).to.be.true;
  });

  it("should allow registration authority to register students and clubs", async function () {
    await expect(
      accessControl.connect(regAuthority).registerUser(student.address, "STU-100", 1, STUDENT_ROLE)
    ).to.emit(accessControl, "UserRegistered").withArgs(student.address, "STU-100", 1, STUDENT_ROLE);

    expect(await accessControl.isUserRegistered(student.address)).to.be.true;
    expect(await accessControl.getUserDepartment(student.address)).to.equal(1);
    expect(await accessControl.hasActiveRole(STUDENT_ROLE, student.address)).to.be.true;
  });

  it("should reject registration from unauthorized caller", async function () {
    await expect(
      accessControl.connect(unauthorized).registerUser(student.address, "STU-100", 1, STUDENT_ROLE)
    ).to.be.revertedWith("Caller not authorized to register users");
  });

  it("should prevent duplicate wallet registration", async function () {
    await accessControl.connect(regAuthority).registerUser(student.address, "STU-100", 1, STUDENT_ROLE);
    await expect(
      accessControl.connect(regAuthority).registerUser(student.address, "STU-101", 1, STUDENT_ROLE)
    ).to.be.revertedWith("Wallet already registered");
  });

  it("should enforce wallet suspension and block active role queries", async function () {
    await accessControl.connect(regAuthority).registerUser(student.address, "STU-100", 1, STUDENT_ROLE);
    expect(await accessControl.hasActiveRole(STUDENT_ROLE, student.address)).to.be.true;

    await expect(
      accessControl.connect(admin).suspendWallet(student.address, "Disciplinary violation")
    ).to.emit(accessControl, "WalletSuspended").withArgs(student.address, "Disciplinary violation", admin.address);

    expect(await accessControl.isWalletSuspended(student.address)).to.be.true;
    // Suspended wallet must fail hasActiveRole
    expect(await accessControl.hasActiveRole(STUDENT_ROLE, student.address)).to.be.false;

    // Reinstate wallet
    await expect(
      accessControl.connect(admin).reinstateWallet(student.address)
    ).to.emit(accessControl, "WalletReinstated").withArgs(student.address, admin.address);

    expect(await accessControl.isWalletSuspended(student.address)).to.be.false;
    expect(await accessControl.hasActiveRole(STUDENT_ROLE, student.address)).to.be.true;
  });

  it("should correctly verify department authority membership", async function () {
    await accessControl.connect(admin).registerUser(
      deptAuthority.address,
      "AUTH-CSE",
      10, // CSE Dept
      DEPARTMENT_AUTHORITY_ROLE
    );

    expect(await accessControl.isDepartmentAuthority(deptAuthority.address, 10)).to.be.true;
    // Cross-department check must fail
    expect(await accessControl.isDepartmentAuthority(deptAuthority.address, 20)).to.be.false;
  });
});
