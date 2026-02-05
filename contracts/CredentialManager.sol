// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

contract CredentialManager {
    struct Credential {
        bytes32 dataHash;
        string cipherText;
    }

    mapping(address => Credential[]) credentials;
    mapping(address => mapping(bytes32 => bool)) hashExists;

    event CredentialAdded(
        bytes32 indexed dataHash,
        string cipherText,
        address indexed owner
    );
    event CredentialUpdated(
        bytes32 indexed oldDataHash,
        bytes32 indexed newDataHash,
        string cipherText,
        address indexed owner
    );
    event CredentialDeleted(bytes32 indexed dataHash, address indexed owner);

    function addCredential(
        string calldata _cipherText,
        bytes32 _dataHash
    ) external {
        bool hashExistsForUser = hashExists[msg.sender][_dataHash];
        require(!hashExistsForUser, "CredM: Data hash already exists!");

        credentials[msg.sender].push(Credential(_dataHash, _cipherText));
        hashExistsForUser = true;

        emit CredentialAdded(_dataHash, _cipherText, msg.sender);
    }

    function updateCredential(
        uint256 _index,
        string calldata _cipherText,
        bytes32 _newDataHash
    ) external {
        bool hashExistsForUser = hashExists[msg.sender][_newDataHash];
        require(
            _index < credentials[msg.sender].length,
            "CredM: Credential does not exist!"
        );
        require(!hashExistsForUser, "CredM: New data hash already exists!");

        Credential storage cred = credentials[msg.sender][_index];
        bytes32 oldDataHash = cred.dataHash;
        hashExists[msg.sender][oldDataHash] = false;

        cred.dataHash = _newDataHash;
        cred.cipherText = _cipherText;
        hashExistsForUser = true;

        emit CredentialUpdated(
            oldDataHash,
            _newDataHash,
            _cipherText,
            msg.sender
        );
    }

    function deleteCredential(uint256 _index) external {
        uint256 credsLength = credentials[msg.sender].length;
        require(_index < credsLength, "CredM: Credential does not exist!");

        Credential storage cred = credentials[msg.sender][_index];
        hashExists[msg.sender][cred.dataHash] = false;

        // Remove credential by swapping with the last and popping
        // if index is last one, just pop last one
        if (_index == credsLength - 1) {
            credentials[msg.sender].pop();
        } else {
            credentials[msg.sender][_index] = credentials[msg.sender][
                credsLength - 1
            ];
            credentials[msg.sender].pop();
        }

        emit CredentialDeleted(cred.dataHash, msg.sender);
    }

    function getCredentialsOf(
        address _user
    ) external view returns (Credential[] memory) {
        return credentials[_user];
    }
}
