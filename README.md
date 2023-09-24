## Scrubbie

Visit http://scrubbie.xyz/ to start scrubbing! 🧽

Description
Scrubbie is an advanced analytical tool geared towards providing intricate insights into the crypto wallet domain. Whether by searching using an address or uploading a list of wallets, users obtain vital data including wallet age, purchasing tendencies, and the count of NFTs bought. Additionally, Scrubbie delves into the specifics of NFTs obtained and identifies associated social profiles such as ENS, Lens, and Farcaster.

Scrubbie's capabilities go beyond as it lets users set their own criteria weights. This defines individual interpretations of high and low signal wallets. Consequently, the tool generates a score ranging from 0 to 100. This score signifies the likelihood that a wallet or a set of wallets are high or low signal, presenting a tailored, comprehensive perspective of the intricate crypto realm. Scrubbie stands out as an indispensable tool for those aiming to decode the intricacies of crypto wallet activities with precision.

## How It Works - Behind the Scenes

Scrubbie operates by fetching on-chain data. Subsequently, it crafts normalized weighted averages for each segment, rooted in the criteria provided by the post body payload.

## API Access

You can access our API endpoint at:

```bash
https://scrubbie.xyz/api/score
Method: POST
```

Request Payload:

```typescript
interface ScrubScoreCriteria {
  walletAddress: string;
  weights: {
    walletActivity: number;
    frequencyPatternConsistency: number; // Automated interval
    purchaseSpike: number; // Number of purchases
    pricePerPurchaseDistribution: number; // Highest price spent
    tieredSocialProfile: number;
  };
  threshold: {
    walletAge: number;
    maxEthSpent: number;
    numPurchases: number;
  };
}
```

Response Type:

```typescript
type ScrubScoreResult = {
  score: number;
  walletAddressOrENS: string;
  walletAgeDays: number | null;
  highestPurchase: number;
  totalPurchases: number;
  purchasePatterns: PurchasePattern;
  socialProfiles: {
    ens: string | null;
    lens: string | null;
    farcaster: string | null;
  };
};
```
