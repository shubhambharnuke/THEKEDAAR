// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title CollegeAccessControl
 * @notice Manages institutional identities, roles, department memberships, and wallet suspensions.
 * @dev Enforces role-admin hierarchy:
 *  - DEFAULT_ADMIN_ROLE (Central Admin / Governance) administers all departmental and authority roles.
 *  - DEPARTMENT_ADMIN_ROLE administers department-specific members.
 *  - Suspended wallets fail all privileged authorization checks immediately.
 */
contract CollegeAccessControl is AccessControl {
    bytes32 public constant STUDENT_ROLE = keccak256("STUDENT_ROLE");
    bytes32 public constant CLUB_MEMBER_ROLE = keccak256("CLUB_MEMBER_ROLE");
    bytes32 public constant FACULTY_ROLE = keccak256("FACULTY_ROLE");
    bytes32 public constant DEPARTMENT_AUTHORITY_ROLE = keccak256("DEPARTMENT_AUTHORITY_ROLE");
    bytes32 public constant DEPARTMENT_ADMIN_ROLE = keccak256("DEPARTMENT_ADMIN_ROLE");
    bytes32 public constant CENTRAL_ADMIN_ROLE = keccak256("CENTRAL_ADMIN_ROLE");
    bytes32 public constant NETWORK_GOVERNOR_ROLE = keccak256("NETWORK_GOVERNOR_ROLE");
    bytes32 public constant REGISTRATION_AUTHORITY_ROLE = keccak256("REGISTRATION_AUTHORITY_ROLE");

    struct UserProfile {
        string institutionalId;
        uint256 departmentId;
        bool isRegistered;
        bool isSuspended;
    }

    mapping(address => UserProfile) private _users;

    event UserRegistered(address indexed wallet, string institutionalId, uint256 departmentId, bytes32 initialRole);
    event RoleGrantedToUser(address indexed wallet, bytes32 indexed role, address indexed sender);
    event RoleRevokedFromUser(address indexed wallet, bytes32 indexed role, address indexed sender);
    event WalletSuspended(address indexed wallet, string reason, address indexed sender);
    event WalletReinstated(address indexed wallet, address indexed sender);
    event DepartmentUpdated(address indexed wallet, uint256 oldDepartmentId, uint256 newDepartmentId, address indexed sender);

    modifier onlyActiveUser(address wallet) {
        require(_users[wallet].isRegistered, "User is not registered");
        require(!_users[wallet].isSuspended, "Wallet is suspended");
        _;
    }

    modifier onlyActiveRole(bytes32 role) {
        require(!_users[msg.sender].isSuspended, "Caller wallet is suspended");
        require(hasRole(role, msg.sender), "Caller lacks required role");
        _;
    }

    constructor(address initialAdmin) {
        require(initialAdmin != address(0), "Invalid initial admin");

        _grantRole(DEFAULT_ADMIN_ROLE, initialAdmin);
        _grantRole(CENTRAL_ADMIN_ROLE, initialAdmin);
        _grantRole(NETWORK_GOVERNOR_ROLE, initialAdmin);
        _grantRole(REGISTRATION_AUTHORITY_ROLE, initialAdmin);

        // Role Admin Hierarchy
        _setRoleAdmin(STUDENT_ROLE, REGISTRATION_AUTHORITY_ROLE);
        _setRoleAdmin(CLUB_MEMBER_ROLE, REGISTRATION_AUTHORITY_ROLE);
        _setRoleAdmin(FACULTY_ROLE, REGISTRATION_AUTHORITY_ROLE);
        _setRoleAdmin(DEPARTMENT_AUTHORITY_ROLE, CENTRAL_ADMIN_ROLE);
        _setRoleAdmin(DEPARTMENT_ADMIN_ROLE, CENTRAL_ADMIN_ROLE);
        _setRoleAdmin(REGISTRATION_AUTHORITY_ROLE, CENTRAL_ADMIN_ROLE);
        _setRoleAdmin(CENTRAL_ADMIN_ROLE, DEFAULT_ADMIN_ROLE);
        _setRoleAdmin(NETWORK_GOVERNOR_ROLE, DEFAULT_ADMIN_ROLE);

        _users[initialAdmin] = UserProfile({
            institutionalId: "ADMIN-ROOT",
            departmentId: 0,
            isRegistered: true,
            isSuspended: false
        });
    }

    /**
     * @notice Registers a new institutional wallet with an initial role and department.
     */
    function registerUser(
        address wallet,
        string calldata institutionalId,
        uint256 departmentId,
        bytes32 initialRole
    ) external {
        require(
            hasRole(REGISTRATION_AUTHORITY_ROLE, msg.sender) || hasRole(CENTRAL_ADMIN_ROLE, msg.sender),
            "Caller not authorized to register users"
        );
        require(!_users[msg.sender].isSuspended, "Caller is suspended");
        require(wallet != address(0), "Invalid wallet address");
        require(!_users[wallet].isRegistered, "Wallet already registered");
        require(bytes(institutionalId).length > 0, "Empty institutional ID");

        // Users cannot grant administrative roles through regular registration
        if (initialRole == CENTRAL_ADMIN_ROLE || initialRole == NETWORK_GOVERNOR_ROLE || initialRole == DEFAULT_ADMIN_ROLE) {
            require(hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "Only default admin can grant admin roles");
        }

        _users[wallet] = UserProfile({
            institutionalId: institutionalId,
            departmentId: departmentId,
            isRegistered: true,
            isSuspended: false
        });

        if (initialRole != bytes32(0)) {
            _grantRole(initialRole, wallet);
        }

        emit UserRegistered(wallet, institutionalId, departmentId, initialRole);
    }

    /**
     * @notice Grants an institutional role to an active user.
     */
    function grantInstitutionalRole(bytes32 role, address wallet) external onlyActiveRole(getRoleAdmin(role)) {
        require(_users[wallet].isRegistered, "User is not registered");
        require(!_users[wallet].isSuspended, "Cannot grant role to suspended wallet");
        grantRole(role, wallet);
        emit RoleGrantedToUser(wallet, role, msg.sender);
    }

    /**
     * @notice Revokes an institutional role.
     */
    function revokeInstitutionalRole(bytes32 role, address wallet) external onlyActiveRole(getRoleAdmin(role)) {
        revokeRole(role, wallet);
        emit RoleRevokedFromUser(wallet, role, msg.sender);
    }

    /**
     * @notice Suspends a wallet address, blocking all privileged actions immediately.
     */
    function suspendWallet(address wallet, string calldata reason) external {
        require(
            hasRole(CENTRAL_ADMIN_ROLE, msg.sender) || hasRole(DEFAULT_ADMIN_ROLE, msg.sender),
            "Caller cannot suspend wallets"
        );
        require(!_users[msg.sender].isSuspended, "Caller is suspended");
        require(_users[wallet].isRegistered, "Wallet not registered");
        require(!_users[wallet].isSuspended, "Wallet already suspended");

        _users[wallet].isSuspended = true;
        emit WalletSuspended(wallet, reason, msg.sender);
    }

    /**
     * @notice Reinstates a previously suspended wallet.
     */
    function reinstateWallet(address wallet) external {
        require(
            hasRole(CENTRAL_ADMIN_ROLE, msg.sender) || hasRole(DEFAULT_ADMIN_ROLE, msg.sender),
            "Caller cannot reinstate wallets"
        );
        require(!_users[msg.sender].isSuspended, "Caller is suspended");
        require(_users[wallet].isRegistered, "Wallet not registered");
        require(_users[wallet].isSuspended, "Wallet is not suspended");

        _users[wallet].isSuspended = false;
        emit WalletReinstated(wallet, msg.sender);
    }

    /**
     * @notice Updates a user's department assignment.
     */
    function updateDepartment(address wallet, uint256 newDepartmentId) external {
        require(
            hasRole(CENTRAL_ADMIN_ROLE, msg.sender) || hasRole(DEPARTMENT_ADMIN_ROLE, msg.sender),
            "Caller cannot update department"
        );
        require(!_users[msg.sender].isSuspended, "Caller is suspended");
        require(_users[wallet].isRegistered, "Wallet not registered");

        uint256 oldDepartmentId = _users[wallet].departmentId;
        _users[wallet].departmentId = newDepartmentId;
        emit DepartmentUpdated(wallet, oldDepartmentId, newDepartmentId, msg.sender);
    }

    // --- View Functions ---

    function isUserRegistered(address wallet) external view returns (bool) {
        return _users[wallet].isRegistered;
    }

    function isWalletSuspended(address wallet) external view returns (bool) {
        return _users[wallet].isSuspended;
    }

    function getUserDepartment(address wallet) external view returns (uint256) {
        require(_users[wallet].isRegistered, "User is not registered");
        return _users[wallet].departmentId;
    }

    function getUserProfile(address wallet) external view returns (
        string memory institutionalId,
        uint256 departmentId,
        bool isRegistered,
        bool isSuspended
    ) {
        require(_users[wallet].isRegistered, "User is not registered");
        UserProfile memory u = _users[wallet];
        return (u.institutionalId, u.departmentId, u.isRegistered, u.isSuspended);
    }

    /**
     * @notice Verifies if a wallet has a role and is active (registered & not suspended).
     */
    function hasActiveRole(bytes32 role, address wallet) external view returns (bool) {
        if (!_users[wallet].isRegistered || _users[wallet].isSuspended) {
            return false;
        }
        return hasRole(role, wallet);
    }

    /**
     * @notice Verifies if an authority belongs to a given department and is active.
     */
    function isDepartmentAuthority(address wallet, uint256 departmentId) external view returns (bool) {
        if (!_users[wallet].isRegistered || _users[wallet].isSuspended) {
            return false;
        }
        return _users[wallet].departmentId == departmentId &&
            (hasRole(DEPARTMENT_AUTHORITY_ROLE, wallet) || hasRole(DEPARTMENT_ADMIN_ROLE, wallet));
    }
}
