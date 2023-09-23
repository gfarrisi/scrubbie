import React from 'react';
import styles from '@/styles/Home.module.css'
import { ScrubScoreCriteria } from '@/data/score';



interface CriteriaProps {
    name: string;
    defaultWieght: number;
    weight: number;
    
}

const Criteria = (props: CriteriaProps) => {
   

  return (
    <div className={styles.modalOverlay}>
     
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
          X
        </button>
        <div className={styles.modalContent}>
            <h2>Configure your Scrub</h2>
            <p>Assign weights for each category that is important to you.</p>

        </div>
            
      </div>
    </div>
  );
};

export default ScrubModal;
