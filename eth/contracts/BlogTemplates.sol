// SPDX-License-Identifier: AGPL-3.0-or-later

pragma solidity ^0.6.0;

import './Files.sol';

contract BlogTemplates {

    uint maxId = 0;

    // Mapping from a template ID to JavaScript URL
    mapping (uint => string) templatesJavaScript;

    mapping (uint => address) templateOwners;

    // itemId => post ID
    mapping (uint => uint) postIDs;

    mapping (uint => address) postOwners;

    // post ID => template ID
    mapping (uint => uint) postTemplates;

    event TemplateCreated(uint templateId);
    event TemplateChangeOwner(uint templateId, address owner);
    event TemplateUpdated(uint templateId, string name, string js, string settings);
    event TemplateSetArchived(uint templateId, bool archived);
    event PostCreated(uint postId);
    event PostChangeOwner(uint postId, address owner);
    event PostUpdated(uint postId, uint templateId);

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

    function createPost(uint _templateId) external returns (uint) {
        postOwners[++maxId] = msg.sender;
        postTemplates[maxId] = _templateId;
        emit PostCreated(maxId);
        emit PostChangeOwner(maxId, msg.sender);
        emit PostUpdated(maxId, _templateId);
    }

    function changePostOwner(uint _postId, address _owner) external {
        require(postOwners[_postId] == msg.sender, "Access denied.");
        postOwners[_postId] = _owner;
        emit PostChangeOwner(_postId, _owner);
    }

    function changePostTemplate(uint _postId, uint _templateId) external {
        require(postOwners[_postId] == msg.sender, "Access denied.");
        postTemplates[maxId] = _templateId;
        emit PostUpdated(_postId, _templateId);
    }
}
