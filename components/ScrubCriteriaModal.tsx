import React from 'react';
import styles from '@/styles/Home.module.css'
import { ScrubScoreCriteria } from '@/data/score';
import { scrubScoreAtom } from '../atoms/criteriaAtom';
import { useAtom } from 'jotai';
import Slider from 'rc-slider';
import 'rc-slider/assets/index.css';
import Image from 'next/image';


interface CriteriaProps {
    name: string;
    weightName: 'walletActivity' | 'tieredSocialProfile' | 'diversePurchaseFrequency' | 'purchaseSpike' | 'pricePerPurchaseDistribution';
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

const Criteria = (props: CriteriaProps) => {
    const { name, weightName, thresholdName } = props;
    const [scrubCritera, setScrubCriteria] = useAtom(scrubScoreAtom);
    const [weight, setWeight] = React.useState<number>(scrubCritera.weights[weightName])
    const [threshold, setThreshold] = React.useState<number | null>(thresholdName ? scrubCritera.threshold[thresholdName] : null)


    console.log({
        weight,
        threshold
    })
    const weightScaleCalculation = (weight: number) => {
        switch (weight) {
            case 0:
                return -5;
            case 1:
                return '24.33%';
            case 2:
                return '58.66%';
            case 3:
                return '89%';
            }
    }

    const weightScale = weightScaleCalculation(scrubCritera.weights[weightName])
    console.log(scrubCritera.weights[weightName], weightScale)

    const width = 149
    return (
        <div className={styles.criteriaSection}>
            <h3>{name}</h3>
            <div style={{ position: 'relative', marginTop: 10, width: width }}>
                <div style={{
                    height: 60
                }}>
                <Slider step={1} min={0} max={3} 
                   handleStyle={{
                    backgroundColor: 'darkgrey',
                    borderColor: 'darkgrey'
                    }}
                    trackStyle={{
                        backgroundColor: 'darkgrey'
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
            // textAlign: 'center',
            width: '90%',
            margin: 'auto',
            marginLeft: '8%',
            marginTop: 20,
            gap: 50,
        }}>
            <div style={{flex: 1}}>
                <Criteria name="Wallet Age" weightName="walletActivity" thresholdName='walletAge'/>
                <Criteria name="Number of NFTs Purchased" weightName="purchaseSpike" thresholdName='numPurchases'/>
                <Criteria name="Social Profiles" weightName="tieredSocialProfile"/>
            </div>
            <div style={{flex: 1}}>
                <Criteria name="Price per Purchase" weightName="pricePerPurchaseDistribution" thresholdName='maxEthSpent'/>
                <Criteria name="Irregular Purchase Frequency" weightName="diversePurchaseFrequency" />
            </div>
        </div>
    );
};



interface ScrubModalProps {
    isOpen: boolean;
    onClose: () => void;
    scrubCritera: ScrubScoreCriteria;
    setScrubCriteria: (criteria: ScrubScoreCriteria) => void;
}

const ScrubModal = (props: ScrubModalProps) => {
    const { isOpen, onClose, scrubCritera, setScrubCriteria } = props;
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
            <div className={styles.search}>
            <button 
                // onClick={
                //     // () => fetchScore()
                // }>
                className={styles.searchButtonText}
                >
                    <Image
                    src="/bubbles.svg"
                    alt="search"
                    width={45}
                    height={40}
                    priority
                    />
                    Scrub
                </button>
            </div>
        </div>
            
      </div>
    </div>
  );
};

export default ScrubModal;
