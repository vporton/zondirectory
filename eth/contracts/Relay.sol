// SPDX-License-Identifier: AGPL-3.0-or-later

pragma solidity ^0.7.0;

contract Relay {
    address public currentVersion;
    address public owner;

    modifier onlyOwner() {
        require(msg.sender == owner);
        _;
    }

    constructor(address initAddr) {
        currentVersion = initAddr;
        owner = msg.sender; // this owner may be another contract with multisig, not a single contract owner
    }

    function changeContract(address newVersion) external
        onlyOwner()
    {
        currentVersion = newVersion;
    }

    function changeRelayer(address _owner) external
        onlyOwner()
    {
        owner = _owner;
    }

    fallback() external {
        address addr = currentVersion;
        uint size;
        assembly { size := extcodesize(addr) }
        require(size > 0);

        (bool success, /*bytes memory result*/) = addr.delegatecall(msg.data);
        require(success);
    }
}