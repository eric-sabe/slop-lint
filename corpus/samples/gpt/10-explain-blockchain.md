---
model: gpt-5.5
prompt_id: explain-blockchain
genre: explainer
prompt_set: 1.0.0
---

Blockchain is a way of keeping records that many people can trust, even when no single person or company is in charge. It is best known as the technology behind Bitcoin and other cryptocurrencies, but the basic idea can be used for many kinds of shared records: payments, contracts, supply chains, digital identity, voting systems, and more.

At its simplest, a blockchain is a digital ledger. A ledger is just a record of transactions, like a bank statement or an accounting book. The difference is that a blockchain ledger is not usually stored in one central place. Instead, copies of it are held by many computers, often called “nodes,” connected through a network. Each node can check the records for itself.

The word “blockchain” comes from the way information is organized. Transactions are grouped together into “blocks.” Each block contains a list of recent transactions, a timestamp, and a special digital fingerprint of the previous block. This fingerprint is called a “hash.” A hash is produced by a mathematical function that turns data into a short string of letters and numbers. If even one tiny part of the original data changes, the hash changes completely.

Because every block includes the hash of the block before it, the blocks become linked together in order, like a chain. This makes the history difficult to tamper with. If someone tried to change an old transaction, the hash of that block would change. Then the next block would no longer point correctly to it, and the chain would visibly break. To successfully fake the history, the attacker would need to change that block and every block after it on most copies of the ledger, which is extremely difficult in a large, well-secured blockchain network.

But how does the network agree on which transactions are valid? This is where “consensus” comes in. Consensus is the method nodes use to agree on the current state of the ledger. Different blockchains use different consensus mechanisms.

Bitcoin, for example, uses a system called “proof of work.” In proof of work, specialized participants called miners compete to solve a difficult mathematical puzzle. The puzzle takes computing power to solve, but the answer is easy for others to verify. The first miner to solve it gets to add the next block of transactions to the chain and is rewarded with new cryptocurrency and transaction fees. This process helps secure the network because adding fraudulent blocks would require enormous computing power.

Another common system is “proof of stake.” Instead of using large amounts of computing power, proof-of-stake systems rely on participants who lock up some of their cryptocurrency as a kind of security deposit. These participants, often called validators, are chosen to propose or confirm new blocks. If they behave honestly, they can earn rewards. If they try to cheat, they may lose some of their stake. Proof of stake is generally much more energy-efficient than proof of work.

One important feature of blockchains is transparency. On many public blockchains, anyone can view the transaction history. For example, you can see that a certain digital address sent a certain amount of cryptocurrency to another address. However, this does not always mean you know the real-world identity of the people behind those addresses. So blockchains can be transparent while still offering a degree of pseudonymity.

Another key feature is immutability, meaning that once information is recorded and confirmed, it is very hard to change. This can be useful when people need a reliable record that cannot easily be edited after the fact. For instance, a company might use blockchain to track goods as they move through a supply chain. Each step—factory, shipper, warehouse, store—could be recorded, making it easier to verify where a product came from and whether it was handled properly.

Blockchains can also run “smart contracts.” A smart contract is a small program stored on the blockchain that automatically carries out actions when certain conditions are met. For example, a smart contract could release payment once a digital proof of delivery is recorded. Because the contract runs on the blockchain, users do not necessarily need a middleman to enforce the agreement. Ethereum is one of the best-known blockchains for smart contracts.

Still, blockchain is not magic, and it is not the best solution for every problem. Public blockchains can be slower and more expensive than traditional databases because many computers must process and agree on the same information. Some blockchains, especially proof-of-work systems, use significant energy. There are also challenges around privacy, regulation, security of user wallets, and the fact that mistakes can be hard to reverse. If you send cryptocurrency to the wrong address, there may be no customer support department that can undo it.

It is also important to distinguish between the blockchain itself and the applications built on top of it. A blockchain may be secure in its basic design, but an app, exchange, or smart contract using it can still have bugs or be hacked. In the same way, the internet can work correctly even if a website built on it has problems.

A helpful analogy is to imagine a shared notebook in a public library. Anyone can inspect the notebook, and many people keep photocopies. New pages can be added only after the group agrees they follow the rules. Each page includes a unique code based on the page before it, so if someone changes an old page, everyone can tell. Blockchain is the digital version of that idea, using cryptography and networks instead of paper and photocopies.

In short, blockchain is a shared, tamper-resistant record system. It allows people who may not know or trust one another to agree on a common history of transactions or data. Its most famous use is cryptocurrency, but its broader promise is creating trusted digital records without always relying on a central authority.
