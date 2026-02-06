// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

contract TrustRegistry is Ownable {
    // Enums
    enum IssuerType {
        UNIVERSITY,
        SKILL_INSTITUTE,
        EMPLOYER,
        GIG_PLATFORM,
        GOVERNMENT,
        CERTIFICATION_BODY
    }

    enum CredentialCategory {
        ACADEMIC,
        SKILL,
        EMPLOYMENT,
        PROFESSIONAL,
        GIG_WORK
    }

    // Structs
    struct IssuerProfile {
        string did;
        string name;
        IssuerType issuerType;
        string description;
        string website;
        uint256 trustScore;
        uint256 registrationDate;
        bool isActive;
        string[] accreditations;
        mapping(CredentialCategory => bool) authorizedCategories;
    }

    struct CredentialRecord {
        bytes32 hash;
        string issuerDID;
        string subjectDID;
        CredentialCategory category;
        uint256 issuanceDate;
        uint256 expirationDate;
        bool isRevoked;
        string revocationReason;
        uint256 version;
        bytes32 previousVersionHash;
    }

    struct RevocationEntry {
        bytes32 credentialHash;
        uint256 revocationDate;
        string reason;
        CredentialCategory category;
        string issuer;
    }

    // State variables
    mapping(string => IssuerProfile) public issuers;
    mapping(bytes32 => CredentialRecord) public credentials;
    mapping(bytes32 => RevocationEntry) public revocations;
    mapping(string => bytes32[]) public issuerCredentials;
    mapping(string => bytes32[]) public subjectCredentials;
    
    string[] public registeredIssuers;
    bytes32[] public allCredentials;

    // Events
    event IssuerRegistered(string indexed did, string name, IssuerType issuerType);
    event IssuerUpdated(string indexed did, uint256 trustScore, bool isActive);
    event IssuerAuthorized(string indexed did, CredentialCategory category);
    event IssuerDeauthorized(string indexed did, CredentialCategory category);
    event CredentialAnchored(bytes32 indexed hash, string indexed issuerDID, string indexed subjectDID);
    event CredentialRevoked(bytes32 indexed hash, string reason);
    event CredentialVersioned(bytes32 indexed newHash, bytes32 indexed previousHash, uint256 version);

    // Constructor
    constructor() Ownable(msg.sender) {}

    // Issuer Management
    function registerIssuer(
        string calldata did,
        string calldata name,
        IssuerType issuerType,
        string calldata description,
        string calldata website,
        string[] calldata accreditations
    ) external onlyOwner {
        require(bytes(issuers[did].did).length == 0, "Issuer already registered");
        
        IssuerProfile storage issuer = issuers[did];
        issuer.did = did;
        issuer.name = name;
        issuer.issuerType = issuerType;
        issuer.description = description;
        issuer.website = website;
        issuer.trustScore = 100; // Initial trust score
        issuer.registrationDate = block.timestamp;
        issuer.isActive = true;
        issuer.accreditations = accreditations;

        registeredIssuers.push(did);
        emit IssuerRegistered(did, name, issuerType);
    }

    function updateIssuer(
        string calldata did,
        uint256 trustScore,
        bool isActive
    ) external onlyOwner {
        require(bytes(issuers[did].did).length > 0, "Issuer not registered");
        
        issuers[did].trustScore = trustScore;
        issuers[did].isActive = isActive;
        
        emit IssuerUpdated(did, trustScore, isActive);
    }

    function authorizeIssuerForCategory(
        string calldata did,
        CredentialCategory category
    ) external onlyOwner {
        require(bytes(issuers[did].did).length > 0, "Issuer not registered");
        require(issuers[did].isActive, "Issuer not active");
        
        issuers[did].authorizedCategories[category] = true;
        emit IssuerAuthorized(did, category);
    }

    function deauthorizeIssuerForCategory(
        string calldata did,
        CredentialCategory category
    ) external onlyOwner {
        require(bytes(issuers[did].did).length > 0, "Issuer not registered");
        
        issuers[did].authorizedCategories[category] = false;
        emit IssuerDeauthorized(did, category);
    }

    // Credential Management
    function anchorCredential(
        bytes32 hash,
        string calldata issuerDID,
        string calldata subjectDID,
        CredentialCategory category,
        uint256 expirationDate
    ) external {
        require(bytes(issuers[issuerDID].did).length > 0, "Issuer not registered");
        require(issuers[issuerDID].isActive, "Issuer not active");
        require(issuers[issuerDID].authorizedCategories[category], "Issuer not authorized for category");
        require(credentials[hash].issuanceDate == 0, "Credential already anchored");

        // Verify the caller is authorized to anchor for this issuer
        // In a real implementation, this would verify DID ownership
        
        credentials[hash] = CredentialRecord({
            hash: hash,
            issuerDID: issuerDID,
            subjectDID: subjectDID,
            category: category,
            issuanceDate: block.timestamp,
            expirationDate: expirationDate,
            isRevoked: false,
            revocationReason: "",
            version: 1,
            previousVersionHash: bytes32(0)
        });

        issuerCredentials[issuerDID].push(hash);
        subjectCredentials[subjectDID].push(hash);
        allCredentials.push(hash);

        emit CredentialAnchored(hash, issuerDID, subjectDID);
    }

    function revokeCredential(
        bytes32 hash,
        string calldata reason
    ) external {
        require(credentials[hash].issuanceDate != 0, "Credential not found");
        require(!credentials[hash].isRevoked, "Credential already revoked");
        
        // Verify caller is authorized (issuer or subject)
        // In a real implementation, this would verify DID ownership
        
        credentials[hash].isRevoked = true;
        credentials[hash].revocationReason = reason;

        revocations[hash] = RevocationEntry({
            credentialHash: hash,
            revocationDate: block.timestamp,
            reason: reason,
            category: credentials[hash].category,
            issuer: credentials[hash].issuerDID
        });

        emit CredentialRevoked(hash, reason);
    }

    function versionCredential(
        bytes32 newHash,
        bytes32 previousHash,
        string calldata issuerDID,
        string calldata subjectDID,
        CredentialCategory category,
        uint256 expirationDate
    ) external {
        require(credentials[previousHash].issuanceDate != 0, "Previous credential not found");
        require(credentials[newHash].issuanceDate == 0, "New credential already exists");
        require(bytes(issuers[issuerDID].did).length > 0, "Issuer not registered");
        require(issuers[issuerDID].isActive, "Issuer not active");

        uint256 newVersion = credentials[previousHash].version + 1;

        credentials[newHash] = CredentialRecord({
            hash: newHash,
            issuerDID: issuerDID,
            subjectDID: subjectDID,
            category: category,
            issuanceDate: block.timestamp,
            expirationDate: expirationDate,
            isRevoked: false,
            revocationReason: "",
            version: newVersion,
            previousVersionHash: previousHash
        });

        issuerCredentials[issuerDID].push(newHash);
        subjectCredentials[subjectDID].push(newHash);
        allCredentials.push(newHash);

        emit CredentialVersioned(newHash, previousHash, newVersion);
    }

    // View Functions
    function verifyCredential(bytes32 hash) external view returns (
        bool exists,
        string memory issuerDID,
        string memory subjectDID,
        CredentialCategory category,
        uint256 issuanceDate,
        uint256 expirationDate,
        bool isRevoked,
        string memory revocationReason,
        uint256 version,
        bool issuerTrusted
    ) {
        CredentialRecord memory cred = credentials[hash];
        exists = cred.issuanceDate != 0;
        
        if (exists) {
            issuerTrusted = issuers[cred.issuerDID].isActive && 
                           issuers[cred.issuerDID].trustScore >= 50;
        }

        return (
            exists,
            cred.issuerDID,
            cred.subjectDID,
            cred.category,
            cred.issuanceDate,
            cred.expirationDate,
            cred.isRevoked,
            cred.revocationReason,
            cred.version,
            issuerTrusted
        );
    }

    function getIssuerInfo(string calldata did) external view returns (
        string memory name,
        IssuerType issuerType,
        string memory description,
        uint256 trustScore,
        bool isActive,
        string[] memory accreditations
    ) {
        IssuerProfile storage issuer = issuers[did];
        return (
            issuer.name,
            issuer.issuerType,
            issuer.description,
            issuer.trustScore,
            issuer.isActive,
            issuer.accreditations
        );
    }

    function isIssuerAuthorizedForCategory(
        string calldata did,
        CredentialCategory category
    ) external view returns (bool) {
        return issuers[did].isActive && issuers[did].authorizedCategories[category];
    }

    function getIssuerCredentials(string calldata did) external view returns (bytes32[] memory) {
        return issuerCredentials[did];
    }

    function getSubjectCredentials(string calldata did) external view returns (bytes32[] memory) {
        return subjectCredentials[did];
    }

    function getAllIssuers() external view returns (string[] memory) {
        return registeredIssuers;
    }

    function getTotalCredentials() external view returns (uint256) {
        return allCredentials.length;
    }
}