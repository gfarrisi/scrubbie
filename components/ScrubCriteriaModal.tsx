import React, { useState } from 'react';
import styles from '@/styles/Home.module.css'
import { ScrubScoreCriteria } from '@/data/score';
import { scrubScoreAtom } from '../atoms/criteriaAtom';
import { useAtom } from 'jotai';
import Slider from 'rc-slider';
import 'rc-slider/assets/index.css';
import Image from 'next/image';


interface CriteriaProps {
    name: string;
    weightName: 'walletActivity' | 'tieredSocialProfile' | 'frequencyPatternConsistency' | 'purchaseSpike' | 'pricePerPurchaseDistribution';
    thresholdName?: 'walletAge' | 'numPurchases' | 'maxEthSpent';
}

const getThresholdText = (thresholdName: string) => {
    switch (thresholdName) {
        case 'walletAge':
            return 'How old should the wallet be?';
        case 'numPurchases':
            return 'How many purchases should they have?';
        case 'maxEthSpent':
            return 'What is the max ETH spent?';
    }
}

const getTooltipText = (weightName: string) => {
    switch (weightName) {
        case 'walletActivity':
            return 'This weight assesses the activity duration of a wallet, considering how long it has been active. It helps in distinguishing between newly created wallets and those that have been in existence for a longer period, providing insights into the maturity and possible reliability of each wallet.';
        case 'tieredSocialProfile':
            return 'This weight underscores the significance of possessing ENS, Lens, or Farcaster profiles and being native to those networks.';
        case 'frequencyPatternConsistency':
            return 'This weight aids in distinguishing the frequency of transactions made by a wallet. It allows us to filter and identify wallets that are transacting at irregular intervals, enabling a more accurate differentiation between high signal users and potential bots or spam wallets.';
        case 'purchaseSpike':
            return 'This weight gauges the total number of NFTs purchased by a wallet. It aids in differentiating between wallets that have acquired a multitude of NFTs and those with fewer acquisitions, offering insights into the purchasing behavior and levels of engagement of the wallet holders.';
        case 'pricePerPurchaseDistribution':
            return 'This weight evaluates the average price spent on each NFT purchase by a wallet. It aids in distinguishing between wallets that tend to buy high-value NFTs and those that opt for lower-priced ones, offering insight into the purchasing power and preferences of the wallet holders.';
    }
}

const InfoWithTooltip = (props: {
    weightName: 'walletActivity' | 'tieredSocialProfile' | 'frequencyPatternConsistency' | 'purchaseSpike' | 'pricePerPurchaseDistribution';
}) => {
    const { weightName } = props;
    const [showTooltip, setShowTooltip] = useState(false);
  
    return (
      <div 
          className={styles.tooltipContainer} 
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
      >
        <Image
          src="/info-circle.svg"
          alt="info"
          width={20}
          height={20}
          priority
        />
       {showTooltip && <div className={styles.tooltip} style={{ maxWidth: '750px' }}>{getTooltipText(weightName)}</div>}
      </div>
    );
  }

const Criteria = (props: CriteriaProps) => {
    const { name, weightName, thresholdName } = props;
    const [scrubCritera, setScrubCriteria] = useAtom(scrubScoreAtom);
    const [weight, setWeight] = React.useState<number>(scrubCritera.weights[weightName])
    const [threshold, setThreshold] = React.useState<number | null>(thresholdName ? scrubCritera.threshold[thresholdName] : null)


    React.useEffect(() => {
        if(thresholdName) {
            setScrubCriteria({
                ...scrubCritera,
                weights: {
                    ...scrubCritera.weights,
                    [weightName]: weight
                },
                threshold: {
                    ...scrubCritera.threshold,
                    [thresholdName]: threshold
                }
            })
        }
        else{
            setScrubCriteria({
                ...scrubCritera,
                weights: {
                    ...scrubCritera.weights,
                    [weightName]: weight
                },
            
            })
        }
    }
    , [weight, threshold])

    return (
        <div className={styles.criteriaSection}>
            <div style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                gap: 10,
            }}>
            <h3>{name}</h3>
            <InfoWithTooltip weightName={weightName}/>
            </div>
            <div style={{ position: 'relative', marginTop: 10, width: 149 }}>
                <div style={{
                    height: 60
                }}>
                <Slider step={1} min={0} max={3} 
                   handleStyle={{
                    backgroundColor: '#868E96',
                    borderColor: '#868E96'
                    }}
                    trackStyle={{
                        backgroundColor: '#868E96'
                    }}
                    onChange= {(value) => {
                        console.log(value)
                        setWeight(value as number)
                    }}
                    value={weight}
            />
               
               <span>
                    <div style={{
                        position: 'absolute',
                        top: 25,
                        left: 0,
                    }}>
                        <p>0</p>
                    </div>
                    <div style={{
                        position: 'absolute',
                        top: 25,
                        left: '28.33%',
                    }}>
                        <p>1</p>
                    </div>
                    <div style={{
                        position: 'absolute',
                        top: 25,
                        left: '61.66%',
                    }}>
                        <p>2</p>
                    </div>
                    <div style={{
                        position: 'absolute',
                        top: 25,
                        left: '93%',
                    }}>
                        <p>3</p>
                    </div>
               </span>
               </div>
            </div>
            {
                thresholdName && (
                    <div style={{
                        
                    }}>
                    <div className={styles.thresholdText}>
                        {getThresholdText(thresholdName)}
                    </div>
                    <input className={styles.thresholdInput}
                        value={`${threshold}${thresholdName === 'walletAge' ? ' years' : ''}`}
                        style={{
                            width: thresholdName === 'walletAge' ? 80 : 30,
                        }}
                        onChange={(e) => {
                            const value = e.target.value;
                            if (value === '') {
                                setThreshold(null)
                            } else {
                                setThreshold(parseInt(value))
                            }
                        }}
                    />
                    </div>
                )
                }

       
        </div>
    );
};



const CriteriaContainer = () => {
    return (
        <div style={{
            display: 'flex',
            flexDirection: 'row',
            width: '90%',
            margin: 'auto',
            marginLeft: '8%',
            marginTop: 20,
            gap: 50,
        }}>
            <div style={{flex: 1}}>
                <Criteria name="Wallet Activity" weightName="walletActivity" thresholdName='walletAge'/>
                <Criteria name="Number of NFTs Purchased" weightName="purchaseSpike" thresholdName='numPurchases'/>
                <Criteria name="Social Profiles" weightName="tieredSocialProfile"/>
            </div>
            <div style={{flex: 1}}>
                <Criteria name="Price per Purchase" weightName="pricePerPurchaseDistribution" thresholdName='maxEthSpent'/>
                <Criteria name="Irregular Purchase Frequency" weightName="frequencyPatternConsistency" />
            </div>
        </div>
    );
};



interface ScrubModalProps {
    isOpen: boolean;
    onClose: () => void;
    scrubCritera: ScrubScoreCriteria;
    setScrubCriteria: (criteria: ScrubScoreCriteria) => void;
    fetchResults: () => void;
}

const ScrubModal = (props: ScrubModalProps) => {
    const { isOpen, onClose, scrubCritera, setScrubCriteria, fetchResults } = props;
    if (!isOpen) {
        return null;
    }

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <button className={styles.closeButton} onClick={onClose}>
        <svg width="18" height="17" viewBox="0 0 18 17" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M16.25 1L1.25 16M1.25 1L16.25 16" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        </button>
        <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
                <h2>Configure your Scrub</h2>
                <p>Assign weights for each category that is important to you.</p>
            </div>
            <CriteriaContainer />
            <div className={styles.search} style={{
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'flex-end',
            }}>
            <button 
                onClick={
                    () => {
                        fetchResults()
                        onClose()
                    } 
                }
                className={styles.searchButtonText}
                style={{
                    width: scrubCritera.walletAddress ? 120: 95,
                    marginTop: 0
                }}
                >
                    <div style={{
                        display: 'flex',
                        flexDirection: 'row',
                        alignItems: 'center',
                    }}>
                    <Image
                    src="/bubbles.svg"
                    alt="search"
                    width={45}
                    height={40}
                    priority
                    />
                    {scrubCritera.walletAddress ? "Scrub": "Set"}
                    </div>

                </button>
            </div>
        </div>
            
      </div>
    </div>
  );
};

export default ScrubModal;
