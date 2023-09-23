import {
  ApolloClient,
  InMemoryCache,
  createHttpLink,
  gql,
} from "@apollo/client";
import { setContext } from "@apollo/client/link/context";

const AIRSTACK_URL = "https://api.airstack.xyz/gql";

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
    },
  };
});

const client = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache(),
});

const QUERY = gql`
  query GetWalletData($address: Identity!) {
    Wallet(input: { identity: $address, blockchain: ethereum }) {
      primaryDomain {
        name
      }
      socials(input: { filter: { dappName: { _in: [farcaster, lens] } } }) {
        dappName
        profileName
        userAssociatedAddresses
      }
      tokenBalances(input: { blockchain: ethereum, limit: 50 }) {
        tokenAddress
        amount
        tokenId
        tokenType
        token {
          name
          symbol
        }
      }
      nftSaleTransactions(input: { blockchain: ethereum, limit: 50 }) {
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
      tokenTransfers(input: { blockchain: ethereum, limit: 50 }) {
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
    name: string;
  };
  socials: {
    dappName: "lens" | "farcaster";
    profileName: string;
    userAssociatedAddresses: string[];
  }[];
  tokenBalances: {
    tokenAddress: string;
    amount: string;
    tokenId: string;
    tokenType: string;
    token: {
      name: string;
      symbol: string;
    };
  }[];
  nftSaleTransactions: {
    paymentAmount: string;
    paymentToken: {
      name: string;
      symbol: string;
    };
    nfts: {
      token: {
        decimals: string;
        symbol: string;
        name: string;
      };
    }[];
    blockTimestamp: string;
  }[];
  tokenTransfers: {
    from: {
      identity: string;
    };
    to: {
      identity: string;
    };
    tokenAddress: string;
    amount: string;
    tokenId: string;
  };
}

export const fetchAirstackData = async (
  addresses: string[]
): Promise<AirstackWalletData> => {
  console.log({ addresses });
  const { data, errors } = await client.query({
    query: QUERY,
    variables: {
      address: addresses[0],
    },
  });
  if (errors || data?.errors) {
    console.error("Detailed Errors:", data?.errors);
    throw new Error("Error fetching data");
  }

  const walletData = data?.Wallet;
  return walletData;
};

export interface PurchaseData {
  paymentAmount: string;
  paymentToken: {
    name: string;
    symbol: string;
    id: string;
    decimals: number;
  };
  nfts: {
    token: {
      symbol: string;
      name: string;
      address: string;
    };
  }[];
  blockTimestamp: string;
  saleType: string;
}

const PURCHASE_HISTORY = gql`
  query GetPurchaseHistoryOfWallet($address: Identity!, $cursor: String) {
    EthereumNFTSaleTransactions: NFTSaleTransactions(
      input: {
        blockchain: ethereum
        limit: 200
        order: { blockTimestamp: ASC }
        filter: { _or: { to: { _eq: $address } } }
        cursor: $cursor
      }
    ) {
      pageInfo {
        nextCursor
        prevCursor
      }
      NFTSaleTransaction {
        paymentAmount
        paymentToken {
          name
          symbol
          id
          decimals
        }
        nfts {
          token {
            symbol
            name
            address
          }
        }
        blockTimestamp
        paymentAmountInUSDC
        paymentAmountInNativeToken
        saleType
      }
    }
  }
`;

export const getPurchases = async (
  address: string
): Promise<PurchaseData[]> => {
  let hasNextPage: boolean = true;
  let cursor: string = "";
  const purchases: any[] = [];
  while (hasNextPage) {
    const { data, errors } = await client.query<{
      EthereumNFTSaleTransactions: {
        pageInfo: {
          nextCursor: string;
          prevCursor: string;
        };
        NFTSaleTransaction: PurchaseData[];
      };
    }>({
      query: PURCHASE_HISTORY,
      variables: {
        address: address,
        cursor: cursor,
      },
    });
    if (errors) {
      console.error(errors);
      throw new Error("Error fetching data");
    }
    if (!!data?.EthereumNFTSaleTransactions?.pageInfo?.nextCursor) {
      cursor = data.EthereumNFTSaleTransactions.pageInfo.nextCursor;
    } else {
      hasNextPage = false;
    }
    for (const purchase of data?.EthereumNFTSaleTransactions
      ?.NFTSaleTransaction || []) {
      purchases.push(purchase);
    }
    if (!hasNextPage) {
      break;
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  return purchases;
};
