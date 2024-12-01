import { Button, Frog } from 'frog';
import { devtools } from 'frog/dev';
// import { neynar } from 'frog/hubs'
import { ethers } from 'ethers';
import { handle } from 'frog/next';
import { serveStatic } from 'frog/serve-static';
import { abi } from './abi.js';

// Uncomment to use Edge Runtime.
// export const config = {
//   runtime: 'edge',
// }

export const app = new Frog({
  assetsPath: '/',
  basePath: '/api',
  // Supply a Hub to enable frame verification.
  // hub: neynar({ apiKey: 'NEYNAR_FROG_FM' })
  title: 'Degen Claim Frame',
});

app.frame('/', (c) => {
  // const { fid } = c.frameData || { fid: '15983' };

  return c.res({
    action: '/finish',
    image: (
      <div
        style={{
          alignItems: 'center',
          background: '#0f172a',
          backgroundSize: '100% 100%',
          display: 'flex',
          flexDirection: 'column',
          flexWrap: 'nowrap',
          height: '100%',
          justifyContent: 'center',
          textAlign: 'center',
          width: '100%',
        }}
      >
        <div
          style={{
            color: '#38bdf8',
            fontSize: 60,
            fontStyle: 'normal',
            letterSpacing: '-0.025em',
            lineHeight: 1.4,
            marginTop: 30,
            padding: '0 120px',
            whiteSpace: 'pre-wrap',
          }}
        >
          Claim Raindrop Season 3!
        </div>
      </div>
    ),
    intents: [<Button.Transaction target="/claim">Claim</Button.Transaction>],
  });
});

const BASE_RPC_URL = 'https://mainnet.base.org';
const CONTRACT_ADDRESS = '0x16EB07225C95FBec33BcB40f1a69c61F5A9aa6D5';

async function getIsClaimed(merkleIndex: any) {
  try {
    // Connect to the Base network provider
    const provider = new ethers.JsonRpcProvider(BASE_RPC_URL, {
      name: 'Base Mainnet',
      chainId: 8453,
    });

    // Create an instance of the contract
    const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, provider);

    // Call the `isClaimed` function
    const isClaimed = await contract.isClaimed(merkleIndex.toString());

    return isClaimed;
  } catch (error) {
    console.error('Error fetching isClaimed status:', (error as Error).message);
    throw error;
  }
}

app.frame('/finish', (c) => {
  // const { transactionId } = c || { transactionId: 'None.' };

  return c.res({
    image: (
      <div
        style={{
          alignItems: 'center',
          background: '#0f172a',
          backgroundSize: '100% 100%',
          display: 'flex',
          flexDirection: 'column',
          flexWrap: 'nowrap',
          height: '100%',
          justifyContent: 'center',
          textAlign: 'center',
          width: '100%',
        }}
      >
        <div
          style={{
            color: '#38bdf8',
            fontSize: 60,
            fontStyle: 'normal',
            letterSpacing: '-0.025em',
            lineHeight: 1.4,
            marginTop: 30,
            padding: '0 120px',
            whiteSpace: 'pre-wrap',
          }}
        >
          The Hat Stays On!
        </div>
      </div>
    ),
  });
});

app.transaction('/claim', async (c) => {
  const { address } = c;

  if (!address) {
    return c.error({ message: 'Wallet not connected.' });
  }

  try {
    // Fetch Merkle proof data from the API
    const response = await fetch(
      `https://api.degen.tips/raindrop/season3/merkleproofs?wallet=${address}`
    );
    if (!response.ok) {
      throw new Error('Failed to fetch Merkle proof data.');
    }

    const data = await response.json();

    if (!data || !data.length) {
      throw new Error(
        'Oops! This wallet isn’t linked to an airdrop. Try another one?'
      );
    }

    // Extract Merkle proof data
    const {
      index: merkleIndex,
      wallet_address: merkleWallet,
      amount: merkleAmount,
      proof: merkleProof,
    } = data[0];

    const isClaimed = await getIsClaimed(merkleIndex);

    if (isClaimed) {
      throw new Error(
        'Oops! It looks like you’ve already claimed this airdrop!'
      );
    }

    // Send the transaction
    return c.contract({
      abi,
      chainId: 'eip155:8453', // Replace with the appropriate chain ID
      functionName: 'claim',
      args: [merkleIndex, merkleWallet, merkleAmount, merkleProof],
      to: CONTRACT_ADDRESS,
    });
  } catch (error) {
    return c.error({ message: (error as Error).message });
  }
});

// @ts-ignore
const isEdgeFunction = typeof EdgeFunction !== 'undefined';
const isProduction = isEdgeFunction || import.meta.env?.MODE !== 'development';
devtools(app, isProduction ? { assetsPath: '/.frog' } : { serveStatic });

export const GET = handle(app);
export const POST = handle(app);
