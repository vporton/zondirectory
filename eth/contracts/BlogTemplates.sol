// SPDX-License-Identifier: AGPL-3.0-or-later

pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import './Files.sol';

contract BlogTemplates {

    Files public filesContract;

    uint maxId = 0;

    // Mapping from a template ID to JavaScript URL
    mapping (uint => string) public templatesJavaScript;

    mapping (uint => address) public templateOwners;

    // itemId => post ID
    mapping (uint => uint) public postIDs;

    // post ID => item ID
    mapping (uint => uint) public itemIDs;

    mapping (uint => address) public postOwners;

    // post ID => template ID
    mapping (uint => uint) public postTemplates;

    event TemplateCreated(uint templateId);
    event TemplateChangeOwner(uint templateId, address owner);
    event TemplateUpdated(uint templateId, string name, string js, string settings);
    event TemplateSetArchived(uint templateId, bool archived);
    event PostCreated(uint postId, uint itemId);
    event PostChangeOwner(uint postId, address owner);
    event PostUpdated(uint postId, uint templateId);

    constructor(Files _filesContract) public {
        filesContract = _filesContract;
    }

    function createTemplate(string calldata _name, string calldata _js, string calldata _settings) external returns (uint) {
        templateOwners[++maxId] = msg.sender;
        templatesJavaScript[maxId] = _js;
        emit TemplateCreated(maxId);
        emit TemplateChangeOwner(maxId, msg.sender);
        emit TemplateUpdated(maxId, _name, _js, _settings);
        return maxId;
    }

    function changeTemplateOwner(uint _templateId, address _owner) external {
        require(templateOwners[_templateId] == msg.sender, "Access denied.");
        templateOwners[_templateId] = _owner;
        emit TemplateChangeOwner(_templateId, _owner);
    }

    function updateTemplate(uint _templateId, string calldata _name, string calldata _js, string calldata _settings) external {
        require(templateOwners[_templateId] == msg.sender, "Access denied.");
        templatesJavaScript[_templateId] = _js;
        emit TemplateUpdated(_templateId, _name, _js, _settings);
    }

    function setArchivedTemplate(uint _templateId, bool _archived) external {
        require(templateOwners[_templateId] == msg.sender, "Access denied.");
        emit TemplateSetArchived(_templateId, _archived);
    }

    // _postId should be random.
    function createPost(uint _templateId, uint _postId, uint _itemId) external {
        _createPost(_templateId, _postId, _itemId);
    }

    function _createPost(uint _templateId, uint _postId, uint _itemId) public {
        require(_itemId != 0, "Item ID zero.");
        require(postIDs[_itemId] == 0, "ID is already taken.");
        postOwners[_postId] = msg.sender;
        postTemplates[_postId] = _templateId;
        postIDs[_itemId] = _postId;
        itemIDs[_postId] = _itemId;
        emit PostCreated(_postId, _itemId);
        emit PostChangeOwner(_postId, msg.sender);
        emit PostUpdated(_postId, _templateId);
    }

    function changePostOwner(uint _postId, address _owner) external {
        require(postOwners[_postId] == msg.sender, "Access denied.");
        postOwners[_postId] = _owner;
        emit PostChangeOwner(_postId, _owner);
    }

    function changePostTemplate(uint _postId, uint _templateId) external {
        _changePostTemplate(_postId, _templateId);
    }

    function _changePostTemplate(uint _postId, uint _templateId) public {
        require(postOwners[_postId] == msg.sender, "Access denied.");
        postTemplates[maxId] = _templateId;
        emit PostUpdated(_postId, _templateId);
    }

    function updatePostFull(uint _linkId, Files.LinkInfo calldata _info, uint _templateId) external
    {
        filesContract.updateLink(_linkId, _info);
        _changePostTemplate(postIDs[_linkId], _templateId);
    }
}
