// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./CollegeAccessControl.sol";

/**
 * @title ResourceRegistry
 * @notice Maintains the authoritative on-chain institutional resource registry.
 * @dev Enforces:
 *  - Unique resource IDs
 *  - Departmental ownership and management authorization via CollegeAccessControl
 *  - Active/inactive status controlling booking permissions
 *  - Min and max slot duration limits per resource
 */
contract ResourceRegistry {
    CollegeAccessControl public immutable accessControl;

    struct Resource {
        uint256 id;
        string name;
        uint256 departmentId;
        string metadataHash; // IPFS URI or cryptographic hash of descriptions/specs
        uint256 minDurationSlots; // e.g. 1 slot = 15 mins
        uint256 maxDurationSlots; // e.g. 16 slots = 4 hours
        bool isActive;
        bool exists;
    }

    // Mapping from resourceId => Resource
    mapping(uint256 => Resource) private _resources;
    uint256[] private _resourceIds;

    event ResourceRegistered(
        uint256 indexed resourceId,
        string name,
        uint256 indexed departmentId,
        string metadataHash,
        uint256 minDurationSlots,
        uint256 maxDurationSlots,
        address indexed registeredBy
    );
    event ResourceUpdated(uint256 indexed resourceId, string name, string metadataHash, address indexed updatedBy);
    event ResourceDeactivated(uint256 indexed resourceId, string reason, address indexed deactivatedBy);
    event ResourceReactivated(uint256 indexed resourceId, address indexed reactivatedBy);
    event ResourceOwnershipTransferred(uint256 indexed resourceId, uint256 oldDeptId, uint256 newDeptId, address indexed updatedBy);

    modifier onlyAuthorizedDeptManager(uint256 departmentId) {
        require(
            accessControl.isDepartmentAuthority(msg.sender, departmentId) ||
            accessControl.hasActiveRole(accessControl.CENTRAL_ADMIN_ROLE(), msg.sender) ||
            accessControl.hasActiveRole(accessControl.DEFAULT_ADMIN_ROLE(), msg.sender),
            "Caller not authorized to manage department resources"
        );
        _;
    }

    constructor(address accessControlAddress) {
        require(accessControlAddress != address(0), "Invalid access control address");
        accessControl = CollegeAccessControl(accessControlAddress);
    }

    /**
     * @notice Registers a new resource assigned to a department.
     */
    function registerResource(
        uint256 resourceId,
        string calldata name,
        uint256 departmentId,
        string calldata metadataHash,
        uint256 minDurationSlots,
        uint256 maxDurationSlots
    ) external onlyAuthorizedDeptManager(departmentId) {
        require(resourceId > 0, "Resource ID must be positive");
        require(!_resources[resourceId].exists, "Resource already exists");
        require(bytes(name).length > 0, "Resource name required");
        require(minDurationSlots > 0, "Min duration must be at least 1 slot");
        require(maxDurationSlots >= minDurationSlots, "Max duration must be >= min duration");

        _resources[resourceId] = Resource({
            id: resourceId,
            name: name,
            departmentId: departmentId,
            metadataHash: metadataHash,
            minDurationSlots: minDurationSlots,
            maxDurationSlots: maxDurationSlots,
            isActive: true,
            exists: true
        });

        _resourceIds.push(resourceId);

        emit ResourceRegistered(
            resourceId,
            name,
            departmentId,
            metadataHash,
            minDurationSlots,
            maxDurationSlots,
            msg.sender
        );
    }

    /**
     * @notice Updates resource metadata.
     */
    function updateResourceMetadata(
        uint256 resourceId,
        string calldata newName,
        string calldata newMetadataHash
    ) external {
        Resource storage res = _resources[resourceId];
        require(res.exists, "Resource does not exist");
        require(
            accessControl.isDepartmentAuthority(msg.sender, res.departmentId) ||
            accessControl.hasActiveRole(accessControl.CENTRAL_ADMIN_ROLE(), msg.sender),
            "Caller not authorized to update resource"
        );

        if (bytes(newName).length > 0) {
            res.name = newName;
        }
        res.metadataHash = newMetadataHash;

        emit ResourceUpdated(resourceId, res.name, newMetadataHash, msg.sender);
    }

    /**
     * @notice Deactivates a resource, preventing future bookings while preserving historical records.
     */
    function deactivateResource(uint256 resourceId, string calldata reason) external {
        Resource storage res = _resources[resourceId];
        require(res.exists, "Resource does not exist");
        require(res.isActive, "Resource is already inactive");
        require(
            accessControl.isDepartmentAuthority(msg.sender, res.departmentId) ||
            accessControl.hasActiveRole(accessControl.CENTRAL_ADMIN_ROLE(), msg.sender),
            "Caller not authorized to deactivate resource"
        );

        res.isActive = false;
        emit ResourceDeactivated(resourceId, reason, msg.sender);
    }

    /**
     * @notice Reactivates a deactivated resource.
     */
    function reactivateResource(uint256 resourceId) external {
        Resource storage res = _resources[resourceId];
        require(res.exists, "Resource does not exist");
        require(!res.isActive, "Resource is already active");
        require(
            accessControl.isDepartmentAuthority(msg.sender, res.departmentId) ||
            accessControl.hasActiveRole(accessControl.CENTRAL_ADMIN_ROLE(), msg.sender),
            "Caller not authorized to reactivate resource"
        );

        res.isActive = true;
        emit ResourceReactivated(resourceId, msg.sender);
    }

    // --- View Functions ---

    function getResource(uint256 resourceId) external view returns (Resource memory) {
        require(_resources[resourceId].exists, "Resource does not exist");
        return _resources[resourceId];
    }

    function isResourceActive(uint256 resourceId) external view returns (bool) {
        return _resources[resourceId].exists && _resources[resourceId].isActive;
    }

    function getResourceDepartment(uint256 resourceId) external view returns (uint256) {
        require(_resources[resourceId].exists, "Resource does not exist");
        return _resources[resourceId].departmentId;
    }

    function totalResources() external view returns (uint256) {
        return _resourceIds.length;
    }

    function getResourceIdAtIndex(uint256 index) external view returns (uint256) {
        require(index < _resourceIds.length, "Index out of bounds");
        return _resourceIds[index];
    }
}
