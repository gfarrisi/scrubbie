import { ApolloClient, InMemoryCache, gql, createHttpLink } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';

const AIRSTACK_URL = 'https://api.airstack.xyz/gql';

// Create an http link:
const httpLink = createHttpLink({
  uri: AIRSTACK_URL,
});

const authLink = setContext((_, { headers }) => {
  const apiKey = process.env.AIRSTACK_API_KEY;  
  
  return {
    headers: {
      ...headers,
      authorization: apiKey,
    }
  }
});

const client = new ApolloClient({
  link: authLink.concat(httpLink), 
  cache: new InMemoryCache(),
});




const QUERY = gql`
query MyQuery ($address: Identity!) {
  Wallet(input: {identity: $address, blockchain: ethereum}) {
    primaryDomain {
      name
    }
    socials(input: {filter: {dappName: {_in: [farcaster, lens] }}}) {
      dappName
      profileName
      userAssociatedAddresses
    }
    tokenBalances(input: {blockchain: ethereum, limit: 50}) {
      tokenAddress
      amount
      tokenId
      tokenType
      token {
        name
        symbol
      }
    }
    nftSaleTransactions(input: {blockchain: ethereum, limit: 50}) {
      paymentAmount
      paymentToken {
        name
        symbol
      }
      nfts {
        token {
          decimals
          symbol
          name
        }
      }
      blockTimestamp
    }
    tokenTransfers(input: {blockchain: ethereum, limit: 50}) {
      from {
        identity
      }
      to {
        identity
      }
      tokenAddress
      amount
      tokenId
      tokenType
    }
  }
}
`;


export interface AirstackWalletData {
  primaryDomain: {
    name: string
  }
  socials: {
    dappName: 'lens' | 'farcaster'
    profileName: string
    userAssociatedAddresses: string[]
  }[]
  tokenBalances: {
    tokenAddress: string
    amount: string
    tokenId: string
    tokenType: string
    token: {
      name: string
      symbol: string
    }
  }[]
  nftSaleTransactions: {
    paymentAmount: string
    paymentToken: {
      name: string
      symbol: string
    }
    nfts: {
      token: {
        decimals: string
        symbol: string
        name: string
      }
    }[]
    blockTimestamp: string
  }[]
  tokenTransfers: {
    from: {
      identity: string
    }
    to: {
      identity: string
    }
    tokenAddress: string
    amount: string
    tokenId: string
  }



}


export const fetchAirstackData = async (
  addresses: string[],
): Promise<AirstackWalletData> => {
  console.log({addresses})
   const { data, errors } = await client.query({
    query: QUERY,
    variables: {
      address: addresses[0],
    },
  });
  if (errors || data?.errors) {
    console.error("Detailed Errors:", data?.errors);
    throw new Error('Error fetching data');
  }

  const walletData = data?.Wallet;
  return walletData
};