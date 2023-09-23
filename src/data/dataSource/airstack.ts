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


export const fetchAirstackData = async (
  addresses: string[],
): Promise<string[]> => {
  console.log({addresses})
   const { data, errors } = await client.query({
    query: QUERY,
    variables: {
      address: addresses[0],
    },
  });
  console.log({data,errors})
  // if (errors || data?.errors) {
  //   console.error("Detailed Errors:", data?.errors);
  //   throw new Error('Error fetching data');
  // }

  // const domainNames = data?.Domains?.Domain?.map((domain: any) => domain.name) || [];
  // return domainNames;
  return ['']
};





const PRIMARY_ENS =  gql`
  query PRIMARY_ENS($addresses: [String!]) {
    Domains(input: {filter: {owner: {_in: $addresses}, isPrimary: {_eq: true}}, blockchain: ethereum}) {
      Domain {
        name
        owner
        isPrimary
      }
    }
  }
`;

export const fetchPrimaryENS = async (
  addresses: string[],
): Promise<string[]> => {
  console.log({addresses})
   const { data, errors } = await client.query({
    query: QUERY,
  });
  console.log({data,errors})
  // const { data, errors } = await client.query({
  //   query: PRIMARY_ENS,
  //   variables: {
  //     addresses: addresses,
  //   },
  // });
  // console.log('fetchPrimaryENS',{data,errors})

  // if (errors || data?.errors) {
  //   console.error("Detailed Errors:", data?.errors);
  //   throw new Error('Error fetching data');
  // }

  // const domainNames = data?.Domains?.Domain?.map((domain: any) => domain.name) || [];
  // return domainNames;
  return ['']
};


const FARCASTER_ACCOUNT =  gql`
  query FARCASTER_ACCOUNT($addresses: [String!]) {
    Socials(
        input: {filter: {dappName: {_eq: farcaster}, identity: {_in: $addresses}}, blockchain: ethereum}
      ) {
        Social {
          profileName
          userId
          userAssociatedAddresses
        }
      }
  }
`;;

export const fetchFarcasterAccount = async (
  addresses: string[],
): Promise<string[]> => {
  const { data, errors } = await client.query({
    query: FARCASTER_ACCOUNT,
    variables: {
      addresses: addresses,
    },
  });

  if (errors) {
    console.error(errors);
    throw new Error('Error fetching data');
  }

  const domainNames = data?.Socials?.Social?.map((social: any) => social.profileName) || [];
  return domainNames;
};


const LENS_PROFILE =  gql`
    query LENS_PROFILE($addresses: [String!]) {
        Socials(
        input: {filter: {dappName: {_eq: lens}, identity: {_in: $addresses}}, blockchain: ethereum}
        ) {
        Social {
            profileName
            profileTokenId
            profileTokenIdHex
        }
        }
    }
`;;

export const fetchLensProfile = async (
  addresses: string[],
): Promise<string[]> => {
  const { data, errors } = await client.query({
    query: LENS_PROFILE,
    variables: {
      addresses: addresses,
    },
  });

  if (errors) {
    console.error(errors);
    throw new Error('Error fetching data');
  }

  const domainNames = data?.Domains?.Domain?.map((domain: any) => domain.name) || [];
  return domainNames;
};



export const getSocialProfiles = async (walletAddress: string): Promise<{
    lens: string;
    farcaster: string;
    ens: string;
}> => {
    // const lens = await fetchLensProfile([walletAddress]);
    // const farcaster = await fetchFarcasterAccount([walletAddress]);
    const ens = await fetchPrimaryENS([walletAddress]);

    return {
        lens: '',//lens[0],
        farcaster: '',//farcaster[0],
        ens: ens[0]
    }
}


export const getWalletAge = (walletAddress: string): number =>{
  return 0
  }
  
  export const getPurchases = () =>{
  
  }
  