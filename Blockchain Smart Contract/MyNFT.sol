// SPDX-License-Identifier: MIT
pragma solidity ^0.8.11;

import "https://raw.githubusercontent.com/OpenZeppelin/openzeppelin-contracts/v4.9.3/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "https://raw.githubusercontent.com/OpenZeppelin/openzeppelin-contracts/v4.9.3/contracts/access/Ownable.sol";
import "https://raw.githubusercontent.com/OpenZeppelin/openzeppelin-contracts/v4.9.3/contracts/utils/Counters.sol";

contract MyNFT is ERC721URIStorage, Ownable {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIdCounter;
    bool public isMintEnabled = true;

    // mapping to store token ids of a user
    mapping(address => uint256[]) private TokenIds;

    event NFTBurned(address indexed owner, uint256 tokenId);

    constructor(address _owner) ERC721("Edubuk", "EDUBK") {
        require(_owner != address(0), "invalid owner");
        _transferOwnership(_owner);
    }

    // mint function that stores the tokenURI on-chain
    function mintMyNFT(address to, string[] memory tokenURIs) external {
        uint256 len = tokenURIs.length;
        require(isMintEnabled, "Minting is disabled");
        require(to != address(0), "Invalid address");
        require(len > 0, "No URIs provided");

        for (uint256 i = 0; i < len; ++i) {
            // increment first so token ids start at 1 (avoid tokenId 0)
            _tokenIdCounter.increment();
            uint256 tokenId = _tokenIdCounter.current();

            _safeMint(to, tokenId);
            _setTokenURI(tokenId, tokenURIs[i]); // store URI on-chain
            TokenIds[to].push(tokenId);
        }
    }

    function setMintEnabled(bool enabled) public onlyOwner {
        isMintEnabled = enabled;
    }

    function burnNFT(uint256 tokenId) external {
        address tokenOwner = ownerOf(tokenId);
        require(
            msg.sender == tokenOwner,
            "You are not the owner of this token."
        );

        // remove tokenId from owner's list before burning
        _removeTokenIdFromOwner(tokenOwner, tokenId);

        _burn(tokenId); // ERC721URIStorage._burn clears tokenURI
        emit NFTBurned(tokenOwner, tokenId);
    }

    function getTokenIds(
        address user
    ) external view returns (uint256[] memory) {
        require(user != address(0), "Invalid address");
        require(TokenIds[user].length > 0, "No tokenIds found for the user.");
        return TokenIds[user];
    }

    function _removeTokenIdFromOwner(
        address ownerAddr,
        uint256 tokenId
    ) internal {
        uint256[] storage arr = TokenIds[ownerAddr];
        for (uint256 i = 0; i < arr.length; ++i) {
            if (arr[i] == tokenId) {
                if (i != arr.length - 1) {
                    arr[i] = arr[arr.length - 1];
                }
                arr.pop();
                break;
            }
        }
    }
}
