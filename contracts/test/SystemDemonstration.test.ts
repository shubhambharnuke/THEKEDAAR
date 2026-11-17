import { expect } from "chai";
import { ethers } from "hardhat";
import {
  CollegeAccessControl,
  ResourceRegistry,
  BookingManager,
  ApprovalManager,
  DocumentRegistry
} from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("Phase I: End-to-End System Demonstration & Verification", function () {
  let accessControl: CollegeAccessControl;
  let resourceRegistry: ResourceRegistry;
  let bookingManager: BookingManager;
  let approvalManager: ApprovalManager;
  let docRegistry: DocumentRegistry;

  let centralAdmin: SignerWithAddress;
  let deptAuthorityCSE: SignerWithAddress;
  let deptAuthorityECE: SignerWithAddress;
  let clubPresident: SignerWithAddress;
  let studentCompetitor: SignerWithAddress;
  let suspendedUser: SignerWithAddress;

  const CENTRAL_ADMIN_ROLE = ethers.keccak256(ethers.toUtf8Bytes("CENTRAL_ADMIN_ROLE"));
  const DEPARTMENT_AUTHORITY_ROLE = ethers.keccak256(ethers.toUtf8Bytes("DEPARTMENT_AUTHORITY_ROLE"));
  const CLUB_MEMBER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("CLUB_MEMBER_ROLE"));
  const STUDENT_ROLE = ethers.keccak256(ethers.toUtf8Bytes("STUDENT_ROLE"));
  const SLOT_15M = 15 * 60;

  before(async function () {
    [
      centralAdmin,
      deptAuthorityCSE,
      deptAuthorityECE,
      clubPresident,
      studentCompetitor,
      suspendedUser
    ] = await ethers.getSigners();

    // 1. Deploy AccessControl
    const AccessFactory = await ethers.getContractFactory("CollegeAccessControl");
    accessControl = (await AccessFactory.deploy(centralAdmin.address)) as CollegeAccessControl;
    await accessControl.waitForDeployment();

    // 2. Deploy ResourceRegistry
    const ResourceFactory = await ethers.getContractFactory("ResourceRegistry");
    resourceRegistry = (await ResourceFactory.deploy(await accessControl.getAddress())) as ResourceRegistry;
    await resourceRegistry.waitForDeployment();

    // 3. Deploy BookingManager
    const BookingFactory = await ethers.getContractFactory("BookingManager");
    bookingManager = (await BookingFactory.deploy(
      await accessControl.getAddress(),
      await resourceRegistry.getAddress()
    )) as BookingManager;
    await bookingManager.waitForDeployment();

    // 4. Deploy ApprovalManager
    const ApprovalFactory = await ethers.getContractFactory("ApprovalManager");
    approvalManager = (await ApprovalFactory.deploy(
      await accessControl.getAddress(),
      await resourceRegistry.getAddress(),
      await bookingManager.getAddress()
    )) as ApprovalManager;
    await approvalManager.waitForDeployment();

    // Link ApprovalManager
    await bookingManager.connect(centralAdmin).setApprovalManager(await approvalManager.getAddress());

    // 5. Deploy DocumentRegistry
    const DocFactory = await ethers.getContractFactory("DocumentRegistry");
    docRegistry = (await DocFactory.deploy()) as DocumentRegistry;
    await docRegistry.waitForDeployment();

    // Setup Institutional Wallets
    await accessControl.connect(centralAdmin).registerUser(deptAuthorityCSE.address, "AUTH-CSE-01", 10, DEPARTMENT_AUTHORITY_ROLE);
    await accessControl.connect(centralAdmin).registerUser(deptAuthorityECE.address, "AUTH-ECE-01", 20, DEPARTMENT_AUTHORITY_ROLE);
    await accessControl.connect(centralAdmin).registerUser(clubPresident.address, "CLUB-ROBOTICS", 10, CLUB_MEMBER_ROLE);
    await accessControl.connect(centralAdmin).registerUser(studentCompetitor.address, "STU-COMP-01", 10, STUDENT_ROLE);
    await accessControl.connect(centralAdmin).registerUser(suspendedUser.address, "STU-SUSP-01", 10, STUDENT_ROLE);
    await accessControl.connect(centralAdmin).suspendWallet(suspendedUser.address, "Academic misconduct");

    // Authorize Document Issuer
    await docRegistry.connect(centralAdmin).authorizeIssuer(deptAuthorityCSE.address);

    // Register CSE Central Auditorium (Resource ID 10)
    await resourceRegistry.connect(deptAuthorityCSE).registerResource(
      10,
      "Central Auditorium",
      10, // CSE
      "ipfs://QmAuditoriumMetadata",
      2,  // min 30 mins
      16  // max 4 hours
    );
  });

  function getFutureSlot(offsetHours: number = 2): number {
    const now = Math.floor(Date.now() / 1000) + offsetHours * 3600;
    return Math.ceil(now / SLOT_15M) * SLOT_15M;
  }

  it("DEMO 1: Atomic Double-Booking Collision Rejection", async function () {
    const start = getFutureSlot(4);
    const end = start + 4 * SLOT_15M; // 1 hour
    const deadline = start - 3600;

    // Club President requests slot [start, end)
    await expect(
      bookingManager.connect(clubPresident).requestBooking(10, start, end, deadline, "ipfs://RoboticsWorkshop")
    ).to.emit(bookingManager, "BookingRequested").withArgs(1, 10, clubPresident.address, start, end, deadline, "ipfs://RoboticsWorkshop");

    // Competitor attempts to reserve overlapping interval [start + 15m, end + 15m)
    await expect(
      bookingManager.connect(studentCompetitor).requestBooking(10, start + SLOT_15M, end + SLOT_15M, deadline, "ipfs://CompetitorHackathon")
    ).to.be.revertedWith("Slot conflict: already reserved");

    // Adjacent non-overlapping booking [end, end + 30m) must succeed
    await expect(
      bookingManager.connect(studentCompetitor).requestBooking(10, end, end + 2 * SLOT_15M, deadline, "ipfs://AdjacentSession")
    ).to.emit(bookingManager, "BookingRequested").withArgs(2, 10, studentCompetitor.address, end, end + 2 * SLOT_15M, deadline, "ipfs://AdjacentSession");
  });

  it("DEMO 2: Multi-Authority Sequential Approval & Atomic Cross-Contract Confirmation", async function () {
    // Booking 1 is PENDING
    const b1Before = await bookingManager.getBooking(1);
    expect(b1Before.status).to.equal(1); // 1 = PENDING

    // Stage 1: Department Authority approves
    await expect(
      approvalManager.connect(deptAuthorityCSE).recordApproval(1, "Approved by CSE Department")
    ).to.emit(approvalManager, "ApprovalRecorded");

    // Stage 2: Central Administration approves
    await expect(
      approvalManager.connect(centralAdmin).recordApproval(1, "Approved by Central Administration")
    ).to.emit(approvalManager, "WorkflowCompleted").withArgs(1);

    // Cross-contract call verified: BookingManager status is now CONFIRMED
    const b1After = await bookingManager.getBooking(1);
    expect(b1After.status).to.equal(2); // 2 = CONFIRMED
  });

  it("DEMO 3: Security Constraints & Suspended Wallet Rejections", async function () {
    const start = getFutureSlot(10);
    const end = start + 2 * SLOT_15M;
    const deadline = start - 3600;

    // Suspended wallet cannot book
    await expect(
      bookingManager.connect(suspendedUser).requestBooking(10, start, end, deadline, "ipfs://Malicious")
    ).to.be.revertedWith("Caller wallet suspended");

    // Cross-department authority cannot approve Department 10's booking
    await expect(
      approvalManager.connect(deptAuthorityECE).recordApproval(2, "Unauthorized cross-dept approval")
    ).to.be.revertedWith("Caller not authorized for department approval");

    // Requester cannot approve their own booking
    await expect(
      approvalManager.connect(studentCompetitor).recordApproval(2, "Self approval attempt")
    ).to.be.revertedWith("Cannot approve your own booking");
  });

  it("DEMO 4: Permission Letter Hash Registration & Revocation Integrity", async function () {
    const docHash = ethers.keccak256(ethers.toUtf8Bytes("Permission Letter: Robotics Club Fest"));
    
    // Register document hash with (hash, documentId, version: 1)
    await expect(
      docRegistry.connect(deptAuthorityCSE).recordDocument(docHash, "DOC-ROBOTICS-2026", 1)
    ).to.emit(docRegistry, "DocumentRecorded");

    const record = await docRegistry.documents(docHash);
    expect(record.isRevoked).to.be.false;
    expect(record.version).to.equal(1);

    // Revoke document
    await expect(
      docRegistry.connect(deptAuthorityCSE).revokeDocument(docHash)
    ).to.emit(docRegistry, "DocumentRevoked");

    const revokedRecord = await docRegistry.documents(docHash);
    expect(revokedRecord.isRevoked).to.be.true;
  });
});
