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

const SOCIAL_PROFILE = gql`
  query getSocialProfiles($address: Identity!) {
    Wallet(input: { identity: $address, blockchain: ethereum }) {
      primaryDomain {
        name
      }
      domains {
        name
      }
      socials(input: { filter: { dappName: { _in: [farcaster, lens] } } }) {
        dappName
        profileName
        userAssociatedAddresses
      }
    }
  }
`;

type Domain = {
  name: string;
};

type Social = {
  dappName: string;
  profileName: string;
  userAssociatedAddresses: string[];
};

type SocialDataPayload = {
  primaryDomain?: Domain;
  domains: Domain[];
  socials: Social[];
};

export const computeVerificationLevel = (profiles: string[]): number => {
  // Default unverified level
  let verificationLevel = 0;
  for (const profile of profiles) {
    if (profile) {
      verificationLevel += 1;
    }
  }
  return verificationLevel;
};

export const extractSocialData = (payload: SocialDataPayload): any => {
  let primaryDomainName: string | null = null;
  if (payload.primaryDomain) {
    primaryDomainName = payload.primaryDomain.name;
  } else if (payload.domains && payload.domains.length > 0) {
    // Use the first domain name from the array if the primary domain is absent
    primaryDomainName = payload.domains[0].name;
  } else {
    primaryDomainName = null;
  }

  const getSpecificDappData = (dappName: string) => {
    const data = payload?.socials?.find(
      (social) => social.dappName === dappName
    );
    return data || { profileName: null, userAssociatedAddresses: [] };
  };

  const lensData = getSpecificDappData("lens");
  const farcasterData = getSpecificDappData("farcaster");
  const profiles: string[] = [];
  if (primaryDomainName) {
    profiles.push(primaryDomainName);
  }
  if (lensData.profileName) {
    profiles.push(lensData.profileName);
  }
  if (farcasterData.profileName) {
    profiles.push(farcasterData.profileName);
  }
  return {
    primaryDomain: primaryDomainName,
    lensProfileName: lensData.profileName,
    farcasterProfileName: farcasterData.profileName,
    profileScore: computeVerificationLevel(profiles),
  };
};

export interface SocialData {
  primaryDomain: string | null;
  lensProfileName: string | null;
  farcasterProfileName: string | null;
  profileScore: number;
}

export const getSocialProfiles = async (
  address: string
): Promise<SocialData> => {
  const { data, errors } = await client.query<{
    Wallet: SocialDataPayload;
  }>({
    query: SOCIAL_PROFILE,
    variables: {
      address: address,
    },
  });
  if (errors) {
    console.error(errors);
    throw new Error("Error fetching data");
  }
  return extractSocialData(data?.Wallet);
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

export interface EarliestTransaction {
  Ethereum: {
    TokenTransfer: [
      {
        blockTimestamp: "2016-05-19T11:09:40Z";
      }
    ];
  };
}

const EARLIEST_TRANSACTION = gql`
  query GetEarliestTokenTransferForAddress($address: Identity!) {
    Ethereum: TokenTransfers(
      input: {
        blockchain: ethereum
        limit: 1
        order: { blockTimestamp: ASC }
        filter: { _or: { from: { _eq: $address }, to: { _eq: $address } } }
      }
    ) {
      TokenTransfer {
        blockTimestamp
      }
    }
  }
`;

export const getEarliestTransaction = async (
  address: string
): Promise<string | null> => {
  const { data, errors } = await client.query<EarliestTransaction>({
    query: EARLIEST_TRANSACTION,
    variables: {
      address: address,
    },
  });
  if (errors) {
    console.error(errors);
    throw new Error("Error fetching data");
  }
  let walletAge = null;
  if (data?.Ethereum?.TokenTransfer?.length > 0) {
    walletAge = data.Ethereum.TokenTransfer[0].blockTimestamp;
  }
  return walletAge;
};
