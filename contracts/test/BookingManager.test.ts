import { expect } from "chai";
import { ethers } from "hardhat";
import { CollegeAccessControl, ResourceRegistry, BookingManager } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { time } from "@nomicfoundation/hardhat-network-helpers";

describe("BookingManager Contract", function () {
  let accessControl: CollegeAccessControl;
  let resourceRegistry: ResourceRegistry;
  let bookingManager: BookingManager;
  let admin: SignerWithAddress;
  let deptAuthority: SignerWithAddress;
  let student1: SignerWithAddress;
  let student2: SignerWithAddress;
  let mockApprovalManager: SignerWithAddress;

  const DEPARTMENT_AUTHORITY_ROLE = ethers.keccak256(ethers.toUtf8Bytes("DEPARTMENT_AUTHORITY_ROLE"));
  const STUDENT_ROLE = ethers.keccak256(ethers.toUtf8Bytes("STUDENT_ROLE"));
  const SLOT_15M = 15 * 60;

  beforeEach(async function () {
    [admin, deptAuthority, student1, student2, mockApprovalManager] = await ethers.getSigners();

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

    await bookingManager.connect(admin).setApprovalManager(mockApprovalManager.address);

    // Register users
    await accessControl.connect(admin).registerUser(deptAuthority.address, "AUTH-1", 10, DEPARTMENT_AUTHORITY_ROLE);
    await accessControl.connect(admin).registerUser(student1.address, "STU-1", 10, STUDENT_ROLE);
    await accessControl.connect(admin).registerUser(student2.address, "STU-2", 10, STUDENT_ROLE);

    // Register resource: Auditorium (Dept 10, min 2 slots, max 16 slots)
    await resourceRegistry.connect(deptAuthority).registerResource(
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

  it("should successfully request a booking and atomically lock slots in PENDING status", async function () {
    const start = getFutureAlignedSlot(120);
    const end = start + 4 * SLOT_15M; // 1 hour
    const deadline = start - 30 * 60;

    await expect(
      bookingManager.connect(student1).requestBooking(1, start, end, deadline, "ipfs://Booking1")
    ).to.emit(bookingManager, "BookingRequested");

    const booking = await bookingManager.getBooking(1);
    expect(booking.requester).to.equal(student1.address);
    expect(booking.status).to.equal(1); // 1 = PENDING

    // Resource should now be marked unavailable for that window
    expect(await bookingManager.isResourceAvailable(1, start, end)).to.be.false;
  });

  it("should atomically reject overlapping conflicting reservations", async function () {
    const start = getFutureAlignedSlot(120);
    const end = start + 4 * SLOT_15M;
    const deadline = start - 30 * 60;

    // Student 1 reserves [start, end)
    await bookingManager.connect(student1).requestBooking(1, start, end, deadline, "ipfs://Booking1");

    // Student 2 attempts to reserve overlapping slot [start + 15m, end + 15m)
    await expect(
      bookingManager.connect(student2).requestBooking(1, start + SLOT_15M, end + SLOT_15M, deadline, "ipfs://Booking2")
    ).to.be.revertedWith("Slot conflict: already reserved");
  });

  it("should accept adjacent reservations using half-open intervals [start, end)", async function () {
    const start1 = getFutureAlignedSlot(120);
    const end1 = start1 + 2 * SLOT_15M;
    const start2 = end1; // Exactly adjacent
    const end2 = start2 + 2 * SLOT_15M;
    const deadline = start1 - 30 * 60;

    await bookingManager.connect(student1).requestBooking(1, start1, end1, deadline, "ipfs://Booking1");

    // Adjacent reservation by student 2 must succeed
    await expect(
      bookingManager.connect(student2).requestBooking(1, start2, end2, deadline, "ipfs://Booking2")
    ).to.emit(bookingManager, "BookingRequested");
  });

  it("should confirm booking only when called by authorized ApprovalManager", async function () {
    const start = getFutureAlignedSlot(120);
    const end = start + 2 * SLOT_15M;
    const deadline = start - 30 * 60;

    await bookingManager.connect(student1).requestBooking(1, start, end, deadline, "ipfs://Booking1");

    // Unauthorized call must revert
    await expect(
      bookingManager.connect(student1).confirmBooking(1)
    ).to.be.revertedWith("Caller is not authorized ApprovalManager");

    // Authorized ApprovalManager call succeeds
    await expect(
      bookingManager.connect(mockApprovalManager).confirmBooking(1)
    ).to.emit(bookingManager, "BookingConfirmed").withArgs(1, mockApprovalManager.address);

    const booking = await bookingManager.getBooking(1);
    expect(booking.status).to.equal(2); // 2 = CONFIRMED
  });

  it("should release reserved slots upon cancellation or rejection", async function () {
    const start = getFutureAlignedSlot(120);
    const end = start + 2 * SLOT_15M;
    const deadline = start - 30 * 60;

    await bookingManager.connect(student1).requestBooking(1, start, end, deadline, "ipfs://Booking1");
    expect(await bookingManager.isResourceAvailable(1, start, end)).to.be.false;

    // Student cancels booking
    await bookingManager.connect(student1).cancelBooking(1);
    const booking = await bookingManager.getBooking(1);
    expect(booking.status).to.equal(4); // 4 = CANCELLED

    // Slots must now be released and available again
    expect(await bookingManager.isResourceAvailable(1, start, end)).to.be.true;
  });
});
