// SPDX-License-Identifier: AGPL-3.0-or-later

pragma solidity ^0.6.0;

import './Files.sol';

contract FilesPlus {
    Files files;

    constructor(Files _files) public {
        files = _files;
    }

    function createItem(string calldata _title,
                        string calldata _description,
                        uint256 _priceETH,
                        uint256 _priceAR,
                        string calldata _locale,
                        string calldata _license,
                        uint256[] calldata _votingInfo) external payable
    {
        uint _id = files.createItem(_title, _description, _priceETH, _priceAR, _locale, _license);
        vote(_id, _votingInfo);
    }

    function createLink(string calldata _link,
                        string calldata _title,
                        string calldata _description,
                        string calldata _locale,
                        uint256 _linkKind,
                        bool _owned,
                        uint256[] calldata _votingInfo) external payable
    {
        uint _id = files.createLink(_link, _title, _description, _locale, _linkKind, _owned);
        vote(_id, _votingInfo);
    }

    function createCategory(string calldata _title,
                            string calldata _locale,
                            bool _owned,
                            uint256[] calldata _votingInfo) external payable
    {
        uint _id = files.createCategory(_title, _locale, _owned);
        vote(_id, _votingInfo);
    }

    function vote(uint _id, uint256[] memory _votingInfo) internal {
        for(uint i = 0; i + 1 < _votingInfo.length; i += 2) {
            uint _parent = _votingInfo[i];
            uint256 _amount = _votingInfo[i+1];
            if(files.itemOwners(_parent) == msg.sender) {
                files.setMyChildParent(_id, _parent, int256(_amount), 0);
            } else {
                files.voteChildParent.value(_amount)(_id, _parent, true);
            }
        }
    }
}