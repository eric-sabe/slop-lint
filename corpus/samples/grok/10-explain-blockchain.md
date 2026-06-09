---
model: grok-4.3
prompt_id: explain-blockchain
genre: explainer
prompt_set: 1.0.0
---

Blockchain is often described as a revolutionary technology, but at its core it is simply a new way of keeping records. Imagine a shared notebook that everyone in a community can see and write in, but no one can erase or secretly change once something has been written down. That notebook is the blockchain.

The notebook is divided into pages, and each page is called a block. On every page, people record transactions—anything from sending money to transferring ownership of a digital item. When a page fills up, it is sealed and linked to the next blank page. The link is created by a unique digital fingerprint, called a hash, that is generated from everything written on the page. If even one letter on a sealed page is altered later, the fingerprint no longer matches, and everyone immediately knows something is wrong.

Because the notebook is not kept in one person’s house, it is copied on thousands of computers around the world. Each computer holds an identical version of the entire notebook. When someone wants to add a new transaction, they broadcast it to the network. Special computers, often called miners or validators, collect recent transactions, check that they follow the rules (for example, that someone is not trying to spend the same money twice), and bundle them into a new page. They then compete or cooperate to solve a small mathematical puzzle that proves they have done the work. The first one to solve it shares the completed page with everyone else. Once most of the computers agree the page is valid, they all add it to their copies of the notebook. This agreement process is called consensus.

The linking of pages makes the record extremely difficult to rewrite. Suppose a dishonest person wants to change an old transaction—say, to pretend they never sent money. They would have to alter the page where the transaction appears, recalculate its fingerprint, and then redo the fingerprint for every following page. Because thousands of other computers already have the original chain, they would reject the altered version. The only way to succeed would be to control more than half of all the computers at once, an enormous undertaking for any large network.

This structure removes the need for a central authority such as a bank or government office to keep the master copy. Instead, trust is placed in the mathematics, the software rules, and the sheer number of independent participants. The same system can record many kinds of information beyond money: contracts, supply-chain documents, digital art certificates, or votes. In each case the goal is the same: create a shared history that anyone can inspect and no single party can secretly rewrite.

Of course, blockchain is not magic. It is slower and uses more energy than traditional databases when it relies on energy-intensive puzzles. It also shifts rather than removes the need for trust—users must still trust that the software code is written correctly and that the majority of participants will act honestly. Yet for situations where multiple organizations or strangers need a tamper-resistant common record without handing control to one middleman, the notebook-in-the-cloud model offers a practical alternative that has already proven useful in digital currencies and is being tested in many other fields.
