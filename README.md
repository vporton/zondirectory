# Zon Directory (a directory of everything)

Video presentation: https://www.youtube.com/watch?v=JWNIaF3eAUg

Try it at:
* https://beta.zondirectory.com (without design)
* https://zondirectory.com (new design but partially done, we have already paid for design (sorry for the delay: the old design agency didn't accomplish the task))

More information: https://help.zondirectory.com

This is a directory of everything with integrated sales (both for ETH and AR)
of file downloads and messaging like Twitter (+blog in the future) and voting
for entries and subcategories by ETH cryptocurrency.

It is like SmashWords e-book sales, a shareware site, Dmoz Web directory,
and Twitter at once, but backed with crypto technology and community voting.

You upload the file permanently and users can find it and download or
pay for it, they also can donate to you more than your set price.

The software subtracts owner's share (currently 10%) from your price
and distributes it using a Profit Sharing Token. Also upvotes of author's content
are rewarded.

In fact, the project provides two profit sharing tokens: One Arweave PST
token and one Ethereum ERC-20 token (it is another smart contract that the
main contract). Arweave profits are distributed to
shareholders directly, ETH profits can be withdraw by shareholders using
the smart contract. The profits are proportional to the amounts of the
tokens holded by the shareholders.

The software supports uploading multiple files per item and versioning of
uploaded files, splitting them into a set of several file bundles versions.
(Usually the UI should show just the last version.)

### Voting

You vote with ETH cryptocurrency.

After this you can vote for or against any particular child-parent relationship to
be considered spam or non-spam.

The UI orders items reversely to their spam score.

This is a great system for crowdsourcing a category structure with voting rather than
using a centralized category structure.

Consider top-level categories like

* E-books

* Binaries

* Software

* Videos

Namely the categorization system makes this software useful. It would be useless without
categorization.

## Future features

The main smart contract has the following features which are currently missing
in the user interface:

### Author information

### Cover images

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
