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
    value: string | null;
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
        ens: string | null;
        lens: string | null;
        farcaster: string | null;
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
                    {itemValue.ens && <div className={styles.socialItemName}>   
                    <Image
                        src={'/currency-ethereum.svg'}
                        alt="Scrubbie Logo"
                        width={15}
                        height={15}
                        priority
                        />{
                            itemValue.ens
                        }</div>}
                </div>
                <div className={styles.socialItem}>
                    <SocialIcon value={itemValue.lens} />
                    <div className={styles.reportItemResult}>Lens</div>
                    {itemValue.lens && <div className={styles.socialItemName}>
                    <Image
                        src={'/at.svg'}
                        alt="Scrubbie Logo"
                        width={15}
                        height={15}
                        priority
                        />
                        {itemValue.lens}</div>}
                </div>
                <div className={styles.socialItem}>
                    <SocialIcon value={itemValue.farcaster} />
                    <div className={styles.reportItemResult}>Farcaster</div>
                    {itemValue.farcaster && <div className={styles.socialItemName}>
                    <Image
                        src={'/at.svg'}
                        alt="Scrubbie Logo"
                        width={15}
                        height={15}
                        priority
                        />{
                            itemValue.farcaster
                        }
                        </div>}
                </div>
            </div>
        </div>
    )
}


function ScrubReportBreakdown(props: ScrubScoreProps) {
    const { results } = props

    const walletAge = results.walletAgeDays && results.walletAgeDays > 365 ? `${Math.floor(results.walletAgeDays / 365)} ${Math.floor(results.walletAgeDays / 365) === 1 ? `year`: `years`}` : results.walletAgeDays ? `${results.walletAgeDays} days`: ``
        
    return (
        <>
            <ReportItem itemName="Wallet Age" itemValue={walletAge} />
            <ReportItem itemName="Purchase Patterns" itemValue={results.purchasePatterns} />
            <ReportItem itemName="Total number of NFTs Purchased" itemValue={results.totalPurchases.toString()} />
            <ReportItem itemName="Highest Purchase price" itemValue={results.highestPurchase.toString()+ ' ETH'} />
            <SocialReportItem itemName="Social Profiles" itemValue={results.socialProfiles} />
        </>
    )
}
    
export const addressFormat = (address: string, length?: number) => {
    const lengthToTrim = length || 4;
    if (address.length < lengthToTrim * 2) return address;
    return (
      address &&
      `${address?.substring(0, lengthToTrim)}...${address?.substring(
        address.length - lengthToTrim,
        address.length
      )}`
    );
  };

interface ScrubScoreProps {
    results: ScrubScoreResult
}
  
  export default function ScrubScore(props: ScrubScoreProps) {
    const { results } = props
     
    const wallet = results.walletAddressOrENS;
      return (
        <div className={styles.searchResults}>
            <ScoreIndex score={results.score} />
            <div className={styles.centerText}>
                <span className={styles.scrubReportTitle}>
                    SCRUBBIE REPORT
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
                            // verticalAlign: 'middle'
                            transform: 'translateY(3px)'  // adjust the value accordingly
                        }}
                    />
                    {wallet.includes('.eth') ? wallet : addressFormat(wallet)}
                </span>
                <ScrubReportBreakdown results={results} />
            </div>
        </div>
      )
  }
    