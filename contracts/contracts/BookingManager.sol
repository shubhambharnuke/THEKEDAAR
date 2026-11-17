// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./CollegeAccessControl.sol";
import "./ResourceRegistry.sol";

/**
 * @title BookingManager
 * @notice The authoritative on-chain resource-booking and collision-prevention engine.
 * @dev Enforces:
 *  - 15-minute fixed slot indexing (half-open intervals: [start, end))
 *  - Strict atomic collision rejection
 *  - Booking statuses: NONE, PENDING, CONFIRMED, REJECTED, CANCELLED, EXPIRED, COMPLETED
 *  - Permissionless or keeper-callable expiry
 *  - Atomic modification (release old and claim new in one atomic transaction)
 *  - Restricts confirmation solely to the authorized ApprovalManager contract
 */
contract BookingManager {
    uint256 public constant SLOT_DURATION = 15 minutes;

    enum BookingStatus {
        NONE,
        PENDING,
        CONFIRMED,
        REJECTED,
        CANCELLED,
        EXPIRED,
        COMPLETED
    }

    struct Booking {
        uint256 id;
        uint256 resourceId;
        address requester;
        uint256 departmentId; // Requester department / club affiliation
        uint256 startTime;    // Aligned to 15-minute boundary
        uint256 endTime;      // Aligned to 15-minute boundary
        BookingStatus status;
        uint256 approvalDeadline;
        string metadataHash;
        uint256 createdAt;
    }

    CollegeAccessControl public immutable accessControl;
    ResourceRegistry public immutable resourceRegistry;
    address public approvalManager;
    address public admin;

    // bookingId => Booking
    mapping(uint256 => Booking) private _bookings;
    // resourceId => (slotTimestamp => bookingId)
    mapping(uint256 => mapping(uint256 => uint256)) private _slotReservations;

    uint256 private _bookingIdCounter;

    event BookingRequested(
        uint256 indexed bookingId,
        uint256 indexed resourceId,
        address indexed requester,
        uint256 startTime,
        uint256 endTime,
        uint256 approvalDeadline,
        string metadataHash
    );
    event BookingConfirmed(uint256 indexed bookingId, address indexed confirmedBy);
    event BookingRejected(uint256 indexed bookingId, string reason, address indexed rejectedBy);
    event BookingCancelled(uint256 indexed bookingId, address indexed cancelledBy);
    event BookingExpired(uint256 indexed bookingId, address indexed triggeredBy);
    event BookingCompleted(uint256 indexed bookingId);
    event BookingModified(
        uint256 indexed bookingId,
        uint256 oldStartTime,
        uint256 oldEndTime,
        uint256 newStartTime,
        uint256 newEndTime
    );
    event ApprovalManagerSet(address indexed approvalManager);

    modifier onlyAdmin() {
        require(msg.sender == admin, "Caller is not admin");
        _;
    }

    modifier onlyApprovalManager() {
        require(msg.sender == approvalManager, "Caller is not authorized ApprovalManager");
        _;
    }

    constructor(address accessControlAddress, address resourceRegistryAddress) {
        require(accessControlAddress != address(0), "Invalid access control");
        require(resourceRegistryAddress != address(0), "Invalid resource registry");
        accessControl = CollegeAccessControl(accessControlAddress);
        resourceRegistry = ResourceRegistry(resourceRegistryAddress);
        admin = msg.sender;
    }

    function setApprovalManager(address _approvalManager) external onlyAdmin {
        require(_approvalManager != address(0), "Invalid approval manager");
        approvalManager = _approvalManager;
        emit ApprovalManagerSet(_approvalManager);
    }

    /**
     * @notice Requests a booking on a resource. Atomically locks slots in PENDING state.
     */
    function requestBooking(
        uint256 resourceId,
        uint256 startTime,
        uint256 endTime,
        uint256 approvalDeadline,
        string calldata metadataHash
    ) external returns (uint256) {
        require(accessControl.isUserRegistered(msg.sender), "Caller not registered");
        require(!accessControl.isWalletSuspended(msg.sender), "Caller wallet suspended");
        require(resourceRegistry.isResourceActive(resourceId), "Resource is inactive or does not exist");
        require(startTime % SLOT_DURATION == 0, "Start time not aligned to 15m slot");
        require(endTime % SLOT_DURATION == 0, "End time not aligned to 15m slot");
        require(startTime < endTime, "Invalid time interval");
        require(startTime >= block.timestamp, "Cannot book past slots");
        require(approvalDeadline > block.timestamp && approvalDeadline <= startTime, "Invalid approval deadline");

        ResourceRegistry.Resource memory res = resourceRegistry.getResource(resourceId);
        uint256 durationSlots = (endTime - startTime) / SLOT_DURATION;
        require(durationSlots >= res.minDurationSlots, "Duration less than resource min limit");
        require(durationSlots <= res.maxDurationSlots, "Duration exceeds resource max limit");

        _bookingIdCounter++;
        uint256 newBookingId = _bookingIdCounter;

        // Atomically verify and lock slots [startTime, endTime)
        for (uint256 slot = startTime; slot < endTime; slot += SLOT_DURATION) {
            uint256 existingBookingId = _slotReservations[resourceId][slot];
            require(existingBookingId == 0, "Slot conflict: already reserved");
            _slotReservations[resourceId][slot] = newBookingId;
        }

        uint256 deptId = accessControl.getUserDepartment(msg.sender);

        _bookings[newBookingId] = Booking({
            id: newBookingId,
            resourceId: resourceId,
            requester: msg.sender,
            departmentId: deptId,
            startTime: startTime,
            endTime: endTime,
            status: BookingStatus.PENDING,
            approvalDeadline: approvalDeadline,
            metadataHash: metadataHash,
            createdAt: block.timestamp
        });

        emit BookingRequested(
            newBookingId,
            resourceId,
            msg.sender,
            startTime,
            endTime,
            approvalDeadline,
            metadataHash
        );

        return newBookingId;
    }

    /**
     * @notice Confirms a booking. Callable ONLY by the authorized ApprovalManager contract.
     */
    function confirmBooking(uint256 bookingId) external onlyApprovalManager {
        Booking storage b = _bookings[bookingId];
        require(b.status == BookingStatus.PENDING, "Booking not in PENDING state");
        require(block.timestamp <= b.approvalDeadline, "Approval deadline passed");

        b.status = BookingStatus.CONFIRMED;
        emit BookingConfirmed(bookingId, msg.sender);
    }

    /**
     * @notice Rejects a booking, releasing the reserved slots.
     */
    function rejectBooking(uint256 bookingId, string calldata reason) external {
        require(
            msg.sender == approvalManager ||
            accessControl.hasActiveRole(accessControl.CENTRAL_ADMIN_ROLE(), msg.sender) ||
            accessControl.isDepartmentAuthority(msg.sender, resourceRegistry.getResourceDepartment(_bookings[bookingId].resourceId)),
            "Caller not authorized to reject booking"
        );

        Booking storage b = _bookings[bookingId];
        require(b.status == BookingStatus.PENDING, "Booking not in PENDING state");

        b.status = BookingStatus.REJECTED;
        _releaseSlots(b.resourceId, b.startTime, b.endTime);

        emit BookingRejected(bookingId, reason, msg.sender);
    }

    /**
     * @notice Cancels a booking by requester or authorized authority, releasing slots.
     */
    function cancelBooking(uint256 bookingId) external {
        Booking storage b = _bookings[bookingId];
        require(b.status == BookingStatus.PENDING || b.status == BookingStatus.CONFIRMED, "Cannot cancel booking in current state");
        require(
            b.requester == msg.sender ||
            accessControl.hasActiveRole(accessControl.CENTRAL_ADMIN_ROLE(), msg.sender) ||
            accessControl.isDepartmentAuthority(msg.sender, resourceRegistry.getResourceDepartment(b.resourceId)),
            "Caller not authorized to cancel booking"
        );

        b.status = BookingStatus.CANCELLED;
        _releaseSlots(b.resourceId, b.startTime, b.endTime);

        emit BookingCancelled(bookingId, msg.sender);
    }

    /**
     * @notice Permissionlessly expires a pending booking if its approval deadline has passed.
     */
    function expireBooking(uint256 bookingId) external {
        Booking storage b = _bookings[bookingId];
        require(b.status == BookingStatus.PENDING, "Booking not in PENDING state");
        require(block.timestamp > b.approvalDeadline, "Approval deadline not yet passed");

        b.status = BookingStatus.EXPIRED;
        _releaseSlots(b.resourceId, b.startTime, b.endTime);

        emit BookingExpired(bookingId, msg.sender);
    }

    /**
     * @notice Marks a confirmed booking as completed after its end time.
     */
    function completeBooking(uint256 bookingId) external {
        Booking storage b = _bookings[bookingId];
        require(b.status == BookingStatus.CONFIRMED, "Booking not confirmed");
        require(block.timestamp >= b.endTime, "Booking has not yet ended");

        b.status = BookingStatus.COMPLETED;
        _releaseSlots(b.resourceId, b.startTime, b.endTime);

        emit BookingCompleted(bookingId);
    }

    /**
     * @notice Atomically modifies booking time range.
     * @dev Releases old slots and reserves new slots atomically. If new slots conflict, reverts.
     */
    function modifyBooking(
        uint256 bookingId,
        uint256 newStartTime,
        uint256 newEndTime
    ) external {
        Booking storage b = _bookings[bookingId];
        require(b.requester == msg.sender, "Only original requester can modify");
        require(b.status == BookingStatus.PENDING, "Can only modify pending bookings");
        require(newStartTime % SLOT_DURATION == 0 && newEndTime % SLOT_DURATION == 0, "New times not aligned");
        require(newStartTime < newEndTime, "Invalid new interval");
        require(newStartTime >= block.timestamp, "Cannot modify to past time");

        ResourceRegistry.Resource memory res = resourceRegistry.getResource(b.resourceId);
        uint256 durationSlots = (newEndTime - newStartTime) / SLOT_DURATION;
        require(durationSlots >= res.minDurationSlots && durationSlots <= res.maxDurationSlots, "Invalid duration");

        uint256 oldStart = b.startTime;
        uint256 oldEnd = b.endTime;

        // Temporarily clear old slots
        _releaseSlots(b.resourceId, oldStart, oldEnd);

        // Reserve new slots (reverting if occupied)
        for (uint256 slot = newStartTime; slot < newEndTime; slot += SLOT_DURATION) {
            require(_slotReservations[b.resourceId][slot] == 0, "Slot conflict on modification");
            _slotReservations[b.resourceId][slot] = bookingId;
        }

        b.startTime = newStartTime;
        b.endTime = newEndTime;

        emit BookingModified(bookingId, oldStart, oldEnd, newStartTime, newEndTime);
    }

    // --- Internal Helpers ---

    function _releaseSlots(uint256 resourceId, uint256 startTime, uint256 endTime) internal {
        for (uint256 slot = startTime; slot < endTime; slot += SLOT_DURATION) {
            _slotReservations[resourceId][slot] = 0;
        }
    }

    // --- View Functions ---

    function getBooking(uint256 bookingId) external view returns (Booking memory) {
        require(_bookings[bookingId].id != 0, "Booking does not exist");
        return _bookings[bookingId];
    }

    function getBookingStatus(uint256 bookingId) external view returns (BookingStatus) {
        return _bookings[bookingId].status;
    }

    /**
     * @notice Returns true if all 15-minute slots in [startTime, endTime) are free.
     */
    function isResourceAvailable(uint256 resourceId, uint256 startTime, uint256 endTime) external view returns (bool) {
        if (!resourceRegistry.isResourceActive(resourceId)) return false;
        if (startTime % SLOT_DURATION != 0 || endTime % SLOT_DURATION != 0 || startTime >= endTime) return false;

        for (uint256 slot = startTime; slot < endTime; slot += SLOT_DURATION) {
            if (_slotReservations[resourceId][slot] != 0) {
                return false;
            }
        }
        return true;
    }

    function getSlotOwner(uint256 resourceId, uint256 slotTimestamp) external view returns (uint256) {
        return _slotReservations[resourceId][slotTimestamp];
    }
}
