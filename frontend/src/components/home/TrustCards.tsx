import type { CSSProperties } from 'react';
import type { PublicTrustCard } from '../../types';

export function TrustCards({ cards }: { cards: PublicTrustCard[] }) {
  if (cards.length === 0) return null;
  return (
    <ul className="trust">
      {cards.map((card, index) => (
        <li key={index} className="trust-card fu" style={{ '--si': index } as CSSProperties}>
          <span className="trust-icon" aria-hidden="true">{card.icon}</span>
          <span className="trust-text">{card.text}</span>
        </li>
      ))}
    </ul>
  );
}
