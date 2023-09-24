import styles from "@/styles/Home.module.css";
import { useAtom } from "jotai";
import { Inter } from "next/font/google";
import Head from "next/head";
import Image from "next/image";
import { useState } from "react";
import { scrubScoreAtom } from "../../atoms/criteriaAtom";
import ScrubModal from "../../components/ScrubCriteriaModal";
import ScrubScore from "../../components/ScrubScore";

const inter = Inter({ subsets: ["latin"] });

export enum PurchasePattern {
  Unusual = "Unusual",
  Normal = "Normal",
  NotAvailable = "Not Available",
}

export type ScrubScoreResult = {
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
    xmtp: boolean;
  };
};

const LoadingIcon = () => {
  return (
    <div className={styles.loadingContainer}>
      <div className={`${styles.rectangle} ${styles.rectangleRed}`}></div>
      <div className={`${styles.rectangle} ${styles.rectangleOrange}`}></div>
      <div className={`${styles.rectangle} ${styles.rectangleYellow}`}></div>
      <div className={`${styles.rectangle} ${styles.rectangleGreen}`}></div>
    </div>
  );
};

export default function Home() {
  const [isScrubModalOpen, setScrubModalOpen] = useState(false);
  const [scrubCritera, setScrubCriteria] = useAtom(scrubScoreAtom);
  const [searchResult, setSearchResult] = useState<ScrubScoreResult>();
  const [searchTriggered, setSearchTriggered] = useState<boolean>(false);

  async function fetchResults() {
    setSearchTriggered(true);
    const scamScore = await fetch(`/api/score`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(scrubCritera),
    });
    const scamScoreJSON = await scamScore.json();
    console.log(scamScoreJSON);
    setSearchResult(scamScoreJSON);
    setSearchTriggered(false);
  }

  console.log({ searchTriggered });

  return (
    <>
      <Head>
        <title>Scrubbie</title>
        <meta name="description" content="Discern between high and low signal wallets effectively" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className={`${styles.main} ${inter.className}`}>
        <Image
          src="/Scrubbie.svg"
          alt="Scrubbie Logo"
          width={350}
          height={350}
          priority
        />
        <div
          className={styles.card}
          style={{
            ...(searchResult && {
              minWidth: 950,
            }),
          }}
        >
          <div className={styles.title}>Search to see Scrubbie Report</div>
          <div className={styles.search}>
            <input
              type="text"
              placeholder={scrubCritera?.walletAddress || "vitalik.eth"}
              value={scrubCritera?.walletAddress || ""}
              onChange={(e) => {
                console.log(e.target.value);
                setScrubCriteria({
                  ...scrubCritera,
                  walletAddress: e.target.value,
                });
              }}
              onFocus={(e) => {
                e.target.value = '';
              }}
            />
            <button onClick={() => fetchResults()}>
              <Image
                src="/bubbles.svg"
                alt="search"
                width={45}
                height={40}
                priority
              />
            </button>
          </div>
          {searchTriggered && <LoadingIcon />}
          {searchResult && <ScrubScore results={searchResult} />}
          <button
            className={styles.customizeButton}
            onClick={() => setScrubModalOpen(true)}
          >
            {`${`Customize Scrub`}`}
          </button>
        </div>

        <div
          style={{
            height: 100,
          }}
        ></div>
        <ScrubModal
          isOpen={isScrubModalOpen}
          onClose={() => setScrubModalOpen(false)}
          scrubCritera={scrubCritera}
          setScrubCriteria={setScrubCriteria}
          fetchResults={fetchResults}
        />
      </main>
    </>
  );
}
