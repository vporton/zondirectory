// SPDX-License-Identifier: AGPL-3.0-or-later

pragma solidity ^0.7.0;
pragma experimental ABIEncoderV2;

import './BaseFiles.sol';

contract Files is BaseFiles {
    function voteMultiple(uint _child, uint[] calldata _parents, uint256[] calldata _voteAmounts) external {
        _voteMultiple(_child, _parents, _voteAmounts);
    }

    function _voteMultiple(uint _child, uint[] calldata _parents, uint256[] calldata _voteAmounts) public {
        require(_parents.length == _voteAmounts.length, "Lengths don't match.");
        for(uint i = 0; i < _parents.length; ++i) {
            uint _parent = _parents[i];
            uint256 _amount = _voteAmounts[i];
            if(itemOwners[_parent] == msg.sender) {
                _setMyChildParent(_child, _parent, int256(_amount), 0);
            } else {
                _voteChildParent(_child, _parent, true, address(1), _amount);
            }
        }
    }

    function createItemAndVote(ItemInfo calldata _info,
                               address payable _affiliate,
                               uint[] calldata _parents,
                               uint256[] calldata _voteAmounts) external payable returns (uint itemId)
    {
        itemId = _createItem(_info, _affiliate);
        _voteMultiple(itemId, _parents, _voteAmounts);
    }

    function createLinkAndVote(LinkInfo calldata _info,
                               bool _owned,
                               address payable _affiliate,
                               uint[] calldata _parents,
                               uint256[] calldata _voteAmounts) external payable returns (uint itemId)
    {
        itemId = _createLink(_info, _owned, _affiliate);
        _voteMultiple(itemId, _parents, _voteAmounts);
    }

    function createCategoryAndVote(string calldata _title,
                                   string calldata _locale,
                                   address payable _affiliate,
                                   uint[] calldata _parents,
                                   uint256[] calldata _voteAmounts) external payable returns (uint itemId)
    {
        itemId = _createCategory(_title, _locale, _affiliate);
        _voteMultiple(itemId, _parents, _voteAmounts);
    }

    function createOwnedCategoryAndVote(OwnedCategoryInfo calldata _info,
                                        address payable _affiliate,
                                        uint[] calldata _parents,
                                        uint256[] calldata _voteAmounts) external payable returns (uint itemId)
    {
        itemId = _createOwnedCategory(_info, _affiliate);
        _voteMultiple(itemId, _parents, _voteAmounts);
    }
}
