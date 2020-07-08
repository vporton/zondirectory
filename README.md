# Cryptozon (a file uploading service)

Warning: Currently it uses Rinkeby test network, not real money.
It is a preliminary version, not suitable for a real usage yet.

Try it at
https://arweave.net/p1QUfmu70eFeYs_bUOVhx7g_UNovppmw8u5Zi3rWS0I

This project Cryptozon allows you to sell e-books and other files for
crypto (ETH and/or AR).

You upload the file permanently and users can find it and download or
pay for it, they also can donate to you more than your set price.

The software subtracts owner's share (currently 10%) from your price
and distributes it using a Profit Sharing Token.

In fact, the project provides two profit sharing tokens: One Arweave PST
token and one Ethereum ERC-20 token (it is another smart contract that the
main contract). Arweave profits are distributed to
shareholders directly, ETH profits can be withdraw by shareholders using
the smart contract. The profits are proportional to the amounts of the
tokens holded by the shareholders.

The software supports uploading multiple files per item and versioning of
uploaded files, splitting them into a set of several file bundles versions.
(Usually the UI should show just the last version.)

## Future features

The main smart contract has the following features which are currently missing
in the user interface:

### Cover images

### Categorization

Anybody can create a category and child-parent relationship between two categories
or between an item and a category.

### `Pay` and `Donate` events

### Voting

You can send Ether to the main contract address. This way you obtain voting rights
proportional to the total amount of Ether you sent.

After this you can vote for or against any particular child-parent relationship to
be considered spam or non-spam.

The UIs may retrieve voting results and show or not show an item or a subcategory
dependently on its non-spam score being above a certain threshold.

This is a great system for crowdsourcing a category structure with voting rather than
using a centralized category structure.

Consider top-level categories like

* E-books

* Binaries

* Software sources

* Videos

Namely the categorization system makes this software useful. It would be useless without
categorization.

### Non-English language

### Full text search

# Implementation

It is implemented using Arweave, Ethereum, and TheGraph.

In the future TheGraph may be improved to make it better (e.g. for quick pagination
together with the spam filter), or TheGraph may be replaced with a home-made system
of storing the Ethereum state.

# Installation

Prerequisites: make, Node, XSLTproc, GNU cp (not FreeBSD cp!)

To install it into `out/ui/` directory type

    npm install
    make
