pragma solidity ^0.5.0;

contract Books {
    struct File {
        string format;
        string[] chunks;
    }

    struct Book {
        uint id;
        string shortDescription;
        string longDescription;
        File[] files;
    }
}