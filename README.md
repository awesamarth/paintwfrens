I was hitting RAM limits for Render.com as I am on their free plan so I couldn't deploy it. To run it locally, just:

```git clone```

```cd paintwfrens```

```npm install```

You can then directly all three modes. Just run

```npm run dev```

If you play Tag-Team mode, you'll be able to create an attestaion using sign protocol and mint an NFT. However some additional config will be needed for that. So make a .env file in the root of the project and add these variables

```
PRIVATE_KEY= for dev account which has Morph Holesky and Eth Sepolia

PINATA_API_KEY=

PINATA_API_Secret=

PINATA_JWT= 
```

Sign Protocol contract: 0x998D9Fd569fd1f90796557510CCC87f75f2D5Ebd (on Ethereum Sepolia, called from the backend)

Morph Contract: 0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9 (on Morph Holesky called from both the frontend and the backend)
