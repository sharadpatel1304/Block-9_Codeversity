// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

contract CertificateContract is Ownable {
    
    // --- UPDATED STRUCT ---
    struct Certificate {
        bytes32 id;
        address issuer;
        string ipfsHash;
        uint256 issuedAt;
        bool isRevoked;
        string revocationReason;
        // New Fields
        string category;       // e.g., "academic", "government"
        uint256 expirationDate; // Timestamp (0 means no expiration)
    }

    // State variables
    mapping(bytes32 => Certificate) public certificates;
    mapping(address => bool) public authorizedIssuers;
    
    // --- UPDATED EVENTS ---
    // Added 'category' to the event so indexers can filter by it easily
    event CertificateIssued(
        bytes32 indexed id, 
        address indexed issuer, 
        string ipfsHash, 
        string category
    );
    
    event CertificateRevoked(bytes32 indexed id, string reason);
    event IssuerAuthorized(address indexed issuer);
    event IssuerRevoked(address indexed issuer);

    // Constructor
    constructor() Ownable(msg.sender) {
        // Authorize the deployer by default
        authorizedIssuers[msg.sender] = true;
        emit IssuerAuthorized(msg.sender);
    }

    // Modifiers
    modifier onlyAuthorizedIssuer() {
        require(authorizedIssuers[msg.sender], "Not authorized to issue certificates");
        _;
    }

    // --- ISSUER MANAGEMENT ---
    
    function authorizeIssuer(address issuer) external onlyOwner {
        require(!authorizedIssuers[issuer], "Issuer already authorized");
        authorizedIssuers[issuer] = true;
        emit IssuerAuthorized(issuer);
    }

    function revokeIssuer(address issuer) external onlyOwner {
        require(authorizedIssuers[issuer], "Issuer not authorized");
        authorizedIssuers[issuer] = false;
        emit IssuerRevoked(issuer);
    }

    // --- CORE FUNCTIONS ---

    // Updated to accept 'category' and 'expirationDate'
    function issueCertificate(
        bytes32 id, 
        string calldata ipfsHash,
        string calldata category,
        uint256 expirationDate
    ) external onlyAuthorizedIssuer {
        require(certificates[id].issuedAt == 0, "Certificate ID already exists");
        require(bytes(ipfsHash).length > 0, "IPFS hash cannot be empty");
        require(bytes(category).length > 0, "Category cannot be empty");

        certificates[id] = Certificate({
            id: id,
            issuer: msg.sender,
            ipfsHash: ipfsHash,
            issuedAt: block.timestamp,
            isRevoked: false,
            revocationReason: "",
            category: category,
            expirationDate: expirationDate
        });

        emit CertificateIssued(id, msg.sender, ipfsHash, category);
    }

    function revokeCertificate(bytes32 id, string calldata reason) external {
        Certificate storage cert = certificates[id];
        require(cert.issuedAt != 0, "Certificate does not exist");
        require(!cert.isRevoked, "Certificate already revoked");
        
        // Allow the original issuer OR the contract owner to revoke
        require(cert.issuer == msg.sender || owner() == msg.sender, "Not authorized to revoke");
        
        cert.isRevoked = true;
        cert.revocationReason = reason;
        
        emit CertificateRevoked(id, reason);
    }

    // Updated view function to return new fields
    function verifyCertificate(bytes32 id) external view returns (
        bool exists,
        address issuer,
        string memory ipfsHash,
        uint256 issuedAt,
        bool isRevoked,
        string memory revocationReason,
        string memory category,
        uint256 expirationDate
    ) {
        Certificate memory cert = certificates[id];
        exists = cert.issuedAt != 0;
        
        return (
            exists,
            cert.issuer,
            cert.ipfsHash,
            cert.issuedAt,
            cert.isRevoked,
            cert.revocationReason,
            cert.category,
            cert.expirationDate
        );
    }

    function isIssuerAuthorized(address issuer) external view returns (bool) {
        return authorizedIssuers[issuer];
    }
}