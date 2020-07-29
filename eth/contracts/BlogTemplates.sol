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

    event TemplateCreated(uint id, address owner);
    event TemplateJSUpdated(uint id, string js);
    event PostCreated(uint id, address owner);
    event PostUpdated(uint id, uint templateId);

    function createTemplate(string calldata _js) external returns (uint) {
        templateOwners[++maxId] = msg.sender;
        templatesJavaScript[maxId] = _js;
        emit TemplateCreated(maxId, msg.sender);
        emit TemplateJSUpdated(maxId, _js);
        return maxId;
    }

    function updateTemplate(uint _id, string calldata _js) external {
        require(templateOwners[_id] == msg.sender, "Access denied.");
        templatesJavaScript[_id] = _js;
        emit TemplateJSUpdated(_id, _js);
    }

    function createPost(uint _templateId) external returns (uint) {
        postOwners[++maxId] = msg.sender;
        postTemplates[maxId] = _templateId;
        emit PostCreated(maxId, msg.sender);
        emit PostUpdated(maxId, _templateId);
    }

    function changePostTemplate(uint _postId, uint _templateId) external {
        require(postOwners[_postId] == msg.sender, "Access denied.");
        postTemplates[maxId] = _templateId;
        emit PostUpdated(_postId, _templateId);
    }
}
