import React from 'react';
import styles from '@/styles/Home.module.css'

interface ScrubModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const ScrubModal = (props: ScrubModalProps) => {
    const { isOpen, onClose } = props;
    if (!isOpen) {
        return null;
    }

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <button className={styles.closeButton} onClick={onClose}>
          x
        </button>
        <div className={styles.modalContent}>
            <h2>Configure your Scrub</h2>

        </div>
            
      </div>
    </div>
  );
};

export default ScrubModal;
