import styles from '@/styles/Home.module.css'
import ScoreIndex from './ScoreIndex'
import { ScrubScoreResult } from '@/pages'
import Image from 'next/image';


interface ReportItemProps {
    itemName: string;
    itemValue: string;
}

function ReportItem(props: ReportItemProps) {
    const { itemName, itemValue } = props
        
    return (
        <div className={styles.reportItem}>
            <div className={styles.reportItemTitle}>{itemName}</div> 
            <div className={styles.reportItemResult}>{itemValue}</div> 
        </div>
    )
}


interface SocialIconProps {
    value: boolean;
}

function SocialIcon(props: SocialIconProps) {
    const { value } = props
    return (
       <>
        <Image
            src={value ? "/check-circle.svg": '/cancel-circle.svg'}
            alt="Scrubbie Logo"
            width={20}
            height={20}
            priority
          />
       </>
    )
}


interface SocialReportItem {
    itemName: string;
    itemValue: {
        ens: boolean;
        lens: boolean;
        farcaster: boolean;
    }
}

function SocialReportItem(props: SocialReportItem) {
    const { itemName, itemValue } = props

    console.log({
        itemValue

    })
        
    return (
        <div style={{
            marginTop: 20,
        }}>
            <div className={styles.reportItemTitle}>{itemName}</div> 
            <div
            style={{
                marginTop: 10,
            }}>
                <div className={styles.socialItem}>
                    <SocialIcon value={itemValue.ens} />
                    <div className={styles.reportItemResult}>ENS</div> 
                </div>
                <div className={styles.socialItem}>
                    <SocialIcon value={itemValue.lens} />
                    <div className={styles.reportItemResult}>Lens</div>
                </div>
                <div className={styles.socialItem}>
                    <SocialIcon value={itemValue.farcaster} />
                    <div className={styles.reportItemResult}>Farcaster</div>
                </div>
            </div>
        </div>
    )
}


function ScrubReportBreakdown(props: ScrubScoreProps) {
    const { results } = props
        
    return (
        <>
            <ReportItem itemName="Wallet Age (Days)" itemValue={results.walletAgeDays.toString()} />
            <ReportItem itemName="Purchase Patterns" itemValue={results.purchasePatterns} />
            <ReportItem itemName="Total number of NFTs Purchased" itemValue={results.totalPurchases.toString()} />
            <ReportItem itemName="Highest Purchase price" itemValue={results.highestPurchase.toString()+ ' ETH'} />
            <SocialReportItem itemName="Social Profiles" itemValue={results.socialProfiles} />
        </>
    )
}
    


interface ScrubScoreProps {
    results: ScrubScoreResult
}
  
  export default function ScrubScore(props: ScrubScoreProps) {
    const { results } = props
     
      return (
        <div className={styles.searchResults}>
            <ScoreIndex score={results.score} />
            <div className={styles.centerText}>
                <span className={styles.scrubReportTitle}>
                    SCRUB REPORT
                </span>
            </div>
            <div className={styles.scrubReport}>
                <span className={styles.walletCard}>
                <Image
                    src={'/user-search.svg'}
                    alt="Scrubbie Logo"
                    width={17}
                    height={17}
                    priority
                    style={{
                        paddingTop: 5,
                    }}
                />
                    {results.walletAddressOrENS}
                </span>
                <ScrubReportBreakdown results={results} />
            </div>
        </div>
      )
  }
    