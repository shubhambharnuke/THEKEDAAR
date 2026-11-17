import { expect } from "chai";
import { ethers } from "hardhat";
import { CollegeAccessControl, ResourceRegistry, BookingManager, ApprovalManager } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("ApprovalManager Contract", function () {
  let accessControl: CollegeAccessControl;
  let resourceRegistry: ResourceRegistry;
  let bookingManager: BookingManager;
  let approvalManager: ApprovalManager;
  let admin: SignerWithAddress;
  let deptAuthorityCSE: SignerWithAddress;
  let deptAuthorityECE: SignerWithAddress;
  let student: SignerWithAddress;

  const DEPARTMENT_AUTHORITY_ROLE = ethers.keccak256(ethers.toUtf8Bytes("DEPARTMENT_AUTHORITY_ROLE"));
  const STUDENT_ROLE = ethers.keccak256(ethers.toUtf8Bytes("STUDENT_ROLE"));
  const SLOT_15M = 15 * 60;

  beforeEach(async function () {
    [admin, deptAuthorityCSE, deptAuthorityECE, student] = await ethers.getSigners();

    const AccessFactory = await ethers.getContractFactory("CollegeAccessControl");
    accessControl = (await AccessFactory.deploy(admin.address)) as CollegeAccessControl;
    await accessControl.waitForDeployment();

    const ResourceFactory = await ethers.getContractFactory("ResourceRegistry");
    resourceRegistry = (await ResourceFactory.deploy(await accessControl.getAddress())) as ResourceRegistry;
    await resourceRegistry.waitForDeployment();

    const BookingFactory = await ethers.getContractFactory("BookingManager");
    bookingManager = (await BookingFactory.deploy(
      await accessControl.getAddress(),
      await resourceRegistry.getAddress()
    )) as BookingManager;
    await bookingManager.waitForDeployment();

    const ApprovalFactory = await ethers.getContractFactory("ApprovalManager");
    approvalManager = (await ApprovalFactory.deploy(
      await accessControl.getAddress(),
      await resourceRegistry.getAddress(),
      await bookingManager.getAddress()
    )) as ApprovalManager;
    await approvalManager.waitForDeployment();

    // Link ApprovalManager in BookingManager
    await bookingManager.connect(admin).setApprovalManager(await approvalManager.getAddress());

    // Register authorities & student
    await accessControl.connect(admin).registerUser(deptAuthorityCSE.address, "AUTH-CSE", 10, DEPARTMENT_AUTHORITY_ROLE);
    await accessControl.connect(admin).registerUser(deptAuthorityECE.address, "AUTH-ECE", 20, DEPARTMENT_AUTHORITY_ROLE);
    await accessControl.connect(admin).registerUser(student.address, "STU-1", 10, STUDENT_ROLE);

    // Register CSE Auditorium (Dept 10)
    await resourceRegistry.connect(deptAuthorityCSE).registerResource(
      1,
      "Auditorium",
      10,
      "ipfs://Auditorium",
      2,
      16
    );
  });

  function getFutureAlignedSlot(offsetMinutes: number = 60): number {
    const now = Math.floor(Date.now() / 1000) + offsetMinutes * 60;
    return Math.ceil(now / SLOT_15M) * SLOT_15M;
  }

  it("should process multi-stage approval (Dept -> Central) and atomically confirm booking", async function () {
    const start = getFutureAlignedSlot(120);
    const end = start + 2 * SLOT_15M;
    const deadline = start - 30 * 60;

    await bookingManager.connect(student).requestBooking(1, start, end, deadline, "ipfs://Booking1");

    // Stage 1: Department Authority approves
    await expect(
      approvalManager.connect(deptAuthorityCSE).recordApproval(1, "Dept approval granted")
    ).to.emit(approvalManager, "ApprovalRecorded");

    // Stage 2: Central Admin approves, completing workflow and confirming booking atomically
    await expect(
      approvalManager.connect(admin).recordApproval(1, "Central admin approved")
    ).to.emit(approvalManager, "WorkflowCompleted").withArgs(1);

    const booking = await bookingManager.getBooking(1);
    expect(booking.status).to.equal(2); // 2 = CONFIRMED
  });

  it("should reject self-approval if applicant is an authority", async function () {
    // Register deptAuthorityCSE as student role as well
    const start = getFutureAlignedSlot(120);
    const end = start + 2 * SLOT_15M;
    const deadline = start - 30 * 60;

    await bookingManager.connect(deptAuthorityCSE).requestBooking(1, start, end, deadline, "ipfs://SelfBooking");

    // deptAuthorityCSE cannot approve their own booking
    await expect(
      approvalManager.connect(deptAuthorityCSE).recordApproval(1, "Self approving")
    ).to.be.revertedWith("Cannot approve your own booking");
  });

  it("should prevent unauthorized cross-department authority from approving", async function () {
    const start = getFutureAlignedSlot(120);
    const end = start + 2 * SLOT_15M;
    const deadline = start - 30 * 60;

    await bookingManager.connect(student).requestBooking(1, start, end, deadline, "ipfs://Booking1");

    // ECE authority cannot approve CSE resource booking
    await expect(
      approvalManager.connect(deptAuthorityECE).recordApproval(1, "Wrong dept approval")
    ).to.be.revertedWith("Caller not authorized for department approval");
  });
});
