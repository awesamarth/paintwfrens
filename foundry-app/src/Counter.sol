// contracts/GameItems.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC1155} from "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";

contract PaintWithFrens is ERC1155 {

    error NotParticipant();
    event NftWithMetadataGenerated(uint indexed id, string cid);

    uint public idCounter;
    mapping (uint=>mapping(address=>bool)) public idToAddressToExists;
    mapping (uint=>string) public idToCid;

    function createNFT(address[] memory addresses) public returns(uint id) {
    idCounter++;
    id = idCounter;

    for (uint i = 0; i < addresses.length; i++) {
        idToAddressToExists[id][addresses[i]] = true;
    }

    return id;
}

    function createMetadata(uint _id, string memory _cid) public {
        idToCid[_id]=_cid;
        emit NftWithMetadataGenerated(_id, _cid);
    }


    function mintNFT(uint id)  public {
        if(idToAddressToExists[id][msg.sender]){
            _mint(msg.sender, id, 1, "");
            idToAddressToExists[id][msg.sender]=false;
        }
        else{
            revert();
        }

    }

    constructor() ERC1155("https://chocolate-random-ant-763.mypinata.cloud/ipfs/{id}") {
        
        
    }
}