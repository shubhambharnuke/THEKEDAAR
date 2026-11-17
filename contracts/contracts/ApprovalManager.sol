// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./CollegeAccessControl.sol";
import "./ResourceRegistry.sol";
import "./BookingManager.sol";

/**
 * @title ApprovalManager
 * @notice Coordinates multi-stage institutional approvals on-chain.
 * @dev Enforces:
 *  - Department Authority approval followed by Central Admin approval
 *  - Prevents self-approval (requester cannot approve their own booking)
 *  - Prevents duplicate decisions
 *  - Enforces cross-department authorization rules
 *  - Atomically calls BookingManager.confirmBooking(...) upon final required approval.
 *    If confirmation fails, the approval transaction reverts entirely.
 */
contract ApprovalManager {
    enum ApprovalStage {
        DEPARTMENT_STAGE,
        CENTRAL_STAGE,
        COMPLETED
    }

    struct Decision {
        address authority;
        uint256 timestamp;
        bool isApproved;
        string comments;
    }

    struct ApprovalWorkflow {
        uint256 bookingId;
        ApprovalStage currentStage;
        bool isRejected;
        Decision deptDecision;
        Decision centralDecision;
    }

    CollegeAccessControl public immutable accessControl;
    ResourceRegistry public immutable resourceRegistry;
    BookingManager public immutable bookingManager;
    address public admin;

    // bookingId => ApprovalWorkflow
    mapping(uint256 => ApprovalWorkflow) private _workflows;

    event ApprovalRecorded(
        uint256 indexed bookingId,
        ApprovalStage indexed stage,
        address indexed authority,
        string comments
    );
    event RejectionRecorded(
        uint256 indexed bookingId,
        ApprovalStage indexed stage,
        address indexed authority,
        string reason
    );
    event WorkflowCompleted(uint256 indexed bookingId);

    constructor(
        address accessControlAddress,
        address resourceRegistryAddress,
        address bookingManagerAddress
    ) {
        require(accessControlAddress != address(0), "Invalid access control");
        require(resourceRegistryAddress != address(0), "Invalid resource registry");
        require(bookingManagerAddress != address(0), "Invalid booking manager");

        accessControl = CollegeAccessControl(accessControlAddress);
        resourceRegistry = ResourceRegistry(resourceRegistryAddress);
        bookingManager = BookingManager(bookingManagerAddress);
        admin = msg.sender;
    }

    /**
     * @notice Records an approval for a booking at the current stage.
     * @dev If the final stage is reached, calls BookingManager.confirmBooking atomically.
     */
    function recordApproval(uint256 bookingId, string calldata comments) external {
        BookingManager.Booking memory b = bookingManager.getBooking(bookingId);
        require(b.status == BookingManager.BookingStatus.PENDING, "Booking is not in PENDING state");
        require(msg.sender != b.requester, "Cannot approve your own booking");
        require(!accessControl.isWalletSuspended(msg.sender), "Authority wallet is suspended");

        ApprovalWorkflow storage wf = _workflows[bookingId];
        require(!wf.isRejected, "Workflow is already rejected");
        require(wf.currentStage != ApprovalStage.COMPLETED, "Workflow is already completed");

        uint256 owningDept = resourceRegistry.getResourceDepartment(b.resourceId);

        if (wf.currentStage == ApprovalStage.DEPARTMENT_STAGE) {
            // Must be department authority of owning department
            require(
                accessControl.isDepartmentAuthority(msg.sender, owningDept) ||
                accessControl.hasActiveRole(accessControl.CENTRAL_ADMIN_ROLE(), msg.sender),
                "Caller not authorized for department approval"
            );

            wf.deptDecision = Decision({
                authority: msg.sender,
                timestamp: block.timestamp,
                isApproved: true,
                comments: comments
            });
            wf.currentStage = ApprovalStage.CENTRAL_STAGE;

            emit ApprovalRecorded(bookingId, ApprovalStage.DEPARTMENT_STAGE, msg.sender, comments);

        } else if (wf.currentStage == ApprovalStage.CENTRAL_STAGE) {
            // Must be central administrator
            require(
                accessControl.hasActiveRole(accessControl.CENTRAL_ADMIN_ROLE(), msg.sender) ||
                accessControl.hasActiveRole(accessControl.DEFAULT_ADMIN_ROLE(), msg.sender),
                "Caller not authorized for central administration approval"
            );

            wf.centralDecision = Decision({
                authority: msg.sender,
                timestamp: block.timestamp,
                isApproved: true,
                comments: comments
            });
            wf.currentStage = ApprovalStage.COMPLETED;

            emit ApprovalRecorded(bookingId, ApprovalStage.CENTRAL_STAGE, msg.sender, comments);
            emit WorkflowCompleted(bookingId);

            // Cross-contract call: atomically confirm in BookingManager
            bookingManager.confirmBooking(bookingId);
        }
    }

    /**
     * @notice Records a rejection for a booking, atomically releasing the slots.
     */
    function recordRejection(uint256 bookingId, string calldata reason) external {
        BookingManager.Booking memory b = bookingManager.getBooking(bookingId);
        require(b.status == BookingManager.BookingStatus.PENDING, "Booking is not in PENDING state");
        require(!accessControl.isWalletSuspended(msg.sender), "Authority wallet is suspended");

        ApprovalWorkflow storage wf = _workflows[bookingId];
        require(!wf.isRejected, "Workflow already rejected");
        require(wf.currentStage != ApprovalStage.COMPLETED, "Workflow already completed");

        uint256 owningDept = resourceRegistry.getResourceDepartment(b.resourceId);

        // Department authority or Central admin can reject
        require(
            accessControl.isDepartmentAuthority(msg.sender, owningDept) ||
            accessControl.hasActiveRole(accessControl.CENTRAL_ADMIN_ROLE(), msg.sender),
            "Caller not authorized to reject booking"
        );

        wf.isRejected = true;

        if (wf.currentStage == ApprovalStage.DEPARTMENT_STAGE) {
            wf.deptDecision = Decision({
                authority: msg.sender,
                timestamp: block.timestamp,
                isApproved: false,
                comments: reason
            });
        } else {
            wf.centralDecision = Decision({
                authority: msg.sender,
                timestamp: block.timestamp,
                isApproved: false,
                comments: reason
            });
        }

        emit RejectionRecorded(bookingId, wf.currentStage, msg.sender, reason);

        // Trigger rejection in BookingManager to release reserved slots
        bookingManager.rejectBooking(bookingId, reason);
    }

    // --- View Functions ---

    function getWorkflow(uint256 bookingId) external view returns (ApprovalWorkflow memory) {
        return _workflows[bookingId];
    }

    function getCurrentStage(uint256 bookingId) external view returns (ApprovalStage) {
        return _workflows[bookingId].currentStage;
    }
}
