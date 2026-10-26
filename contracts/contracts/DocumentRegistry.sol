// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title DocumentRegistry
 * @dev Institutional on-chain registry for permission document hashes and revocation states.
 * Guarantees tamper-evident auditability without storing private personal data on-chain.
 */
contract DocumentRegistry {
    address public owner;

    struct DocumentRecord {
        bytes32 documentHash;
        string documentId;
        uint256 version;
        address issuer;
        uint256 timestamp;
        bool isRevoked;
    }

    // Mapping: documentHash (bytes32) => DocumentRecord
    mapping(bytes32 => DocumentRecord) public documents;

    // Mapping: documentId string => documentHash
    mapping(string => bytes32) public letterIdToHash;

    // Authorized departmental issuers
    mapping(address => bool) public authorizedIssuers;

    // Events
    event DocumentRecorded(
        bytes32 indexed documentHash,
        string indexed documentId,
        uint256 version,
        address indexed issuer,
        uint256 timestamp
    );

    event DocumentRevoked(
        bytes32 indexed documentHash,
        string indexed documentId,
        address indexed revoker,
        uint256 timestamp
    );

    event IssuerAuthorized(address indexed issuer);
    event IssuerRevoked(address indexed issuer);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    modifier onlyOwner() {
        require(msg.sender == owner, "DocumentRegistry: caller is not the owner");
        _;
    }

    modifier onlyAuthorized() {
        require(
            msg.sender == owner || authorizedIssuers[msg.sender],
            "DocumentRegistry: caller is not an authorized issuer"
        );
        _;
    }

    constructor() {
        owner = msg.sender;
        authorizedIssuers[msg.sender] = true;
    }

    /**
     * @notice Authorize an authority address to record document hashes.
     */
    function authorizeIssuer(address _issuer) external onlyOwner {
        require(_issuer != address(0), "DocumentRegistry: invalid address");
        authorizedIssuers[_issuer] = true;
        emit IssuerAuthorized(_issuer);
    }

    /**
     * @notice Revoke authority rights for an address.
     */
    function revokeIssuer(address _issuer) external onlyOwner {
        require(_issuer != owner, "DocumentRegistry: cannot revoke contract owner");
        authorizedIssuers[_issuer] = false;
        emit IssuerRevoked(_issuer);
    }

    /**
     * @notice Record a finalized permission document hash on-chain.
     * @param _documentHash SHA-256 hash of the digitally signed document (as bytes32)
     * @param _documentId Canonical document reference identifier
     * @param _version Document revision version number
     */
    function recordDocument(
        bytes32 _documentHash,
        string calldata _documentId,
        uint256 _version
    ) external onlyAuthorized {
        require(_documentHash != bytes32(0), "DocumentRegistry: document hash cannot be zero");
        require(bytes(_documentId).length > 0, "DocumentRegistry: document ID cannot be empty");
        require(documents[_documentHash].timestamp == 0, "DocumentRegistry: document hash already registered");

        documents[_documentHash] = DocumentRecord({
            documentHash: _documentHash,
            documentId: _documentId,
            version: _version,
            issuer: msg.sender,
            timestamp: block.timestamp,
            isRevoked: false
        });

        letterIdToHash[_documentId] = _documentHash;

        emit DocumentRecorded(
            _documentHash,
            _documentId,
            _version,
            msg.sender,
            block.timestamp
        );
    }

    /**
     * @notice Mark a previously registered permission document as revoked.
     */
    function revokeDocument(bytes32 _documentHash) external onlyAuthorized {
        DocumentRecord storage record = documents[_documentHash];
        require(record.timestamp != 0, "DocumentRegistry: document does not exist");
        require(!record.isRevoked, "DocumentRegistry: document is already revoked");
        require(
            msg.sender == owner || msg.sender == record.issuer,
            "DocumentRegistry: only original issuer or owner can revoke"
        );

        record.isRevoked = true;

        emit DocumentRevoked(
            _documentHash,
            record.documentId,
            msg.sender,
            block.timestamp
        );
    }

    /**
     * @notice Query a document record by its SHA-256 hash.
     */
    function getDocument(bytes32 _documentHash) external view returns (DocumentRecord memory) {
        require(documents[_documentHash].timestamp != 0, "DocumentRegistry: document not found");
        return documents[_documentHash];
    }

    /**
     * @notice Query a document record by its letter ID string.
     */
    function getDocumentByLetterId(string calldata _documentId) external view returns (DocumentRecord memory) {
        bytes32 docHash = letterIdToHash[_documentId];
        require(docHash != bytes32(0), "DocumentRegistry: document ID not found");
        return documents[docHash];
    }

    /**
     * @notice Check if a given document hash exists and is valid (not revoked).
     */
    function isDocumentValid(bytes32 _documentHash) external view returns (bool) {
        DocumentRecord memory record = documents[_documentHash];
        return (record.timestamp != 0 && !record.isRevoked);
    }
}
