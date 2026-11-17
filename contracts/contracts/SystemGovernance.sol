// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./CollegeAccessControl.sol";

/**
 * @title SystemGovernance
 * @notice Multi-party institutional governance for institutional policies and system parameters.
 * @dev Replaces single-admin vulnerability with multi-authority consensus on institutional rules.
 */
contract SystemGovernance {
    CollegeAccessControl public immutable accessControl;

    struct Proposal {
        uint256 id;
        string description;
        bytes callData;
        address targetContract;
        uint256 approvalsCount;
        bool executed;
        bool exists;
    }

    uint256 public constant REQUIRED_APPROVALS = 2; // Consortium requirement

    mapping(uint256 => Proposal) private _proposals;
    mapping(uint256 => mapping(address => bool)) private _hasVoted;
    uint256 private _proposalCounter;

    event ProposalCreated(uint256 indexed proposalId, string description, address indexed proposer);
    event ProposalVoted(uint256 indexed proposalId, address indexed voter, uint256 totalApprovals);
    event ProposalExecuted(uint256 indexed proposalId, address indexed executor);

    modifier onlyGovernor() {
        require(
            accessControl.hasActiveRole(accessControl.NETWORK_GOVERNOR_ROLE(), msg.sender) ||
            accessControl.hasActiveRole(accessControl.CENTRAL_ADMIN_ROLE(), msg.sender),
            "Caller not authorized governor"
        );
        _;
    }

    constructor(address accessControlAddress) {
        require(accessControlAddress != address(0), "Invalid access control");
        accessControl = CollegeAccessControl(accessControlAddress);
    }

    function createProposal(
        string calldata description,
        address targetContract,
        bytes calldata callData
    ) external onlyGovernor returns (uint256) {
        _proposalCounter++;
        uint256 newId = _proposalCounter;

        _proposals[newId] = Proposal({
            id: newId,
            description: description,
            callData: callData,
            targetContract: targetContract,
            approvalsCount: 1,
            executed: false,
            exists: true
        });

        _hasVoted[newId][msg.sender] = true;

        emit ProposalCreated(newId, description, msg.sender);
        emit ProposalVoted(newId, msg.sender, 1);

        return newId;
    }

    function voteProposal(uint256 proposalId) external onlyGovernor {
        Proposal storage p = _proposals[proposalId];
        require(p.exists, "Proposal does not exist");
        require(!p.executed, "Proposal already executed");
        require(!_hasVoted[proposalId][msg.sender], "Already voted on this proposal");

        _hasVoted[proposalId][msg.sender] = true;
        p.approvalsCount++;

        emit ProposalVoted(proposalId, msg.sender, p.approvalsCount);

        if (p.approvalsCount >= REQUIRED_APPROVALS) {
            p.executed = true;
            (bool success, ) = p.targetContract.call(p.callData);
            require(success, "Proposal execution failed");
            emit ProposalExecuted(proposalId, msg.sender);
        }
    }

    function getProposal(uint256 proposalId) external view returns (Proposal memory) {
        require(_proposals[proposalId].exists, "Proposal does not exist");
        return _proposals[proposalId];
    }
}
