import React from 'react';
import styles from './DesktopComingSoon.module.css';

interface DesktopComingSoonProps {
  type?: "frontend" | "business";
}

export default function DesktopComingSoon({ type }: DesktopComingSoonProps) {
  return (
    <div className={styles.wrapper}>
      {/* Header / Logo */}
      <header className={styles.header}>
        <div className={styles.logo}>
          <img src="/coming-soon/logo.svg" alt="AGROZGO" className={styles.logoImage} />
          
        </div>
      </header>
      
      {/* Huge Background Text */}
      <div className={styles.bgTextContainer}>
        <div className={styles.bgText}>TEZ KUNDA</div>
      </div>
      
      {/* Cards Container */}
      <div className={styles.cardsWrapper}>
        
        {/* Left Card - ferma.max */}
        <div className={styles.card}>
          <div className={styles.cardTopBar}>
            <span className={styles.cardTopUsername}>ferma.max</span>
          </div>
          
          <div className={styles.profileRow}>
            <div className={styles.avatarRed}>
              <span>ferma</span>
              <span>max</span>
            </div>
            
            <div className={styles.profileInfoRight}>
              <div className={styles.profileName}>Ferma Max | Chorva, Parranda</div>
              <div className={styles.stats}>
                <div className={styles.statItem}>
                  <span className={styles.statVal}>37</span>
                  <span className={styles.statLbl}>публикаций</span>
                </div>
                <div className={styles.statItem}>
                  <span className={styles.statVal}>9500</span>
                  <span className={styles.statLbl}>подписчиков</span>
                </div>
                <div className={styles.statItem}>
                  <span className={styles.statVal}>4</span>
                  <span className={styles.statLbl}>подписок</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className={styles.bio}>
            <p className={styles.bioMuted}>Ферма • Профиль, сгенерированный ИИ</p>
            <p>🐄 Chorva va parranda sirlari</p>
            <p>🐂 Semirtirish ratsionlari (buqa, qo'y, ot)</p>
            <p>🐰 Quyon, bedana, g'oz parvanshi</p>
            <p>🤝 Hamkorlik uchun: <span className={styles.linkBlue}>@sovo.ss</span></p>
          </div>
          
          <a href="https://instagram.com/ferma.max" className={styles.profileLink}>🔗 instagram.com/ferma.max</a>
          <a href="https://instagram.com/ferma.max" target="_blank" rel="noopener noreferrer" className={styles.actionBtn} style={{display: "block", textAlign: "center", textDecoration: "none", boxSizing: "border-box"}}>Obuna bo'lish</a>
        </div>

        {/* Center Card - agrozgo */}
        <div className={`${styles.card} ${styles.cardCenter}`}>
          <div className={styles.cardTopBarCenter}>
            <span className={styles.cardTopUsername}>agrozgo</span>
          </div>
          
          <div className={styles.badgeGray}>O'zbekistondagi</div>
          
          <div className={styles.badgesRow}>
            <span className={styles.badgeGreen}>Dehqon</span>
            <span className={styles.badgeGreen}>Fermer</span>
            <span className={styles.badgeGreen}>Chorvadorlar</span>
          </div>
          
          <div className={styles.badgesRow}>
            <span className={styles.badgeOrange}>Agro-do'kon</span>
            <span className={styles.badgeOrange}>Mutaxassislar</span>
          </div>
          
          <p className={styles.centerText}>
            bilan bitta ilovada bog'laydigan platforma.<br/>
            Hozir veb va Telegram Mini App sifatida<br/>
            ishlaydi. iOS va Android ilovalar chiqarishga<br/>
            tayyorlanmoqda.
          </p>
        </div>

        {/* Right Card - agro.yordam */}
        <div className={styles.card}>
          <div className={styles.cardTopBar}>
            <span className={styles.cardTopUsername}>agro.yordam</span>
          </div>
          
          <div className={styles.profileRow}>
            <div className={styles.avatarOutline}>
              <span style={{fontSize: 9}}>agro</span>
              <span style={{fontSize: 9}}>yordam</span>
            </div>
            
            <div className={styles.profileInfoRight}>
              <div className={styles.profileName}>Agronom Maslahatlari | Agro Yordam</div>
              <div className={styles.stats}>
                <div className={styles.statItem}>
                  <span className={styles.statVal}>71</span>
                  <span className={styles.statLbl}>публикаций</span>
                </div>
                <div className={styles.statItem}>
                  <span className={styles.statVal}>7200</span>
                  <span className={styles.statLbl}>подписчиков</span>
                </div>
                <div className={styles.statItem}>
                  <span className={styles.statVal}>11</span>
                  <span className={styles.statLbl}>подписок</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className={styles.bio}>
            <p className={styles.bioMuted}>Ферма • Профиль, сгенерированный ИИ</p>
            <p>🌱 Issiqxona va dehqonchilik sirlari</p>
            <p>🌾 Ekinlarni to'g'ri parvarishlash</p>
            <p>🎯 Ortiqcha gaplarsiz aniq agro-maslahat</p>
            <p>🤝 Hamkorlik: <span className={styles.linkBlue}>@sovo.ss</span></p>
          </div>
          
          <a href="https://instagram.com/agro.yordam" className={styles.profileLink}>🔗 instagram.com/agro.yordam</a>
          <a href="https://instagram.com/agro.yordam" target="_blank" rel="noopener noreferrer" className={styles.actionBtn} style={{display: "block", textAlign: "center", textDecoration: "none", boxSizing: "border-box"}}>Obuna bo'lish</a>
        </div>

      </div>

      {/* Floating Support Button */}
      <a href="https://t.me/bydsgn" target="_blank" rel="noopener noreferrer" className={styles.supportBtn}>
        💬 Hamkorlik
      </a>
    </div>
  );
}
