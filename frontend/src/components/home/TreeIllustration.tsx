export function TreeIllustration() {
  return (
    <svg viewBox="0 0 280 280" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
      {/* Ground */}
      <ellipse cx="140" cy="268" rx="120" ry="12" fill="#a5d6a7" opacity=".4"/>
      {/* Trunk */}
      <path d="M132 270 C132 220 128 180 134 160 Q138 148 140 140 Q142 148 146 160 C152 180 148 220 148 270Z" fill="#8d6e63"/>
      <path d="M136 270 C136 230 134 190 138 165 Q140 155 140 150 Q140 155 142 165 C146 190 144 230 144 270Z" fill="#6d4c41" opacity=".3"/>
      {/* Branches */}
      <path d="M140 170 Q120 150 95 145" fill="none" stroke="#8d6e63" strokeWidth="4" strokeLinecap="round"/>
      <path d="M140 155 Q165 130 185 125" fill="none" stroke="#8d6e63" strokeWidth="3.5" strokeLinecap="round"/>
      <path d="M140 140 Q110 115 85 110" fill="none" stroke="#8d6e63" strokeWidth="3" strokeLinecap="round"/>
      <path d="M140 130 Q170 105 195 98" fill="none" stroke="#8d6e63" strokeWidth="3" strokeLinecap="round"/>
      <path d="M140 115 Q125 90 110 80" fill="none" stroke="#8d6e63" strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M140 108 Q160 82 178 72" fill="none" stroke="#8d6e63" strokeWidth="2.5" strokeLinecap="round"/>
      {/* Leaf clusters */}
      <circle cx="90" cy="142" r="22" fill="#66bb6a" opacity=".7"/>
      <circle cx="78" cy="130" r="18" fill="#81c784" opacity=".6"/>
      <circle cx="105" cy="135" r="16" fill="#4caf50" opacity=".5"/>
      <circle cx="190" cy="120" r="22" fill="#66bb6a" opacity=".7"/>
      <circle cx="200" cy="108" r="18" fill="#81c784" opacity=".6"/>
      <circle cx="175" cy="115" r="16" fill="#4caf50" opacity=".5"/>
      <circle cx="80" cy="106" r="20" fill="#66bb6a" opacity=".7"/>
      <circle cx="68" cy="95" r="16" fill="#81c784" opacity=".6"/>
      <circle cx="95" cy="98" r="14" fill="#4caf50" opacity=".5"/>
      <circle cx="200" cy="92" r="20" fill="#66bb6a" opacity=".7"/>
      <circle cx="210" cy="80" r="16" fill="#81c784" opacity=".6"/>
      <circle cx="185" cy="85" r="14" fill="#4caf50" opacity=".5"/>
      <circle cx="108" cy="76" r="18" fill="#66bb6a" opacity=".7"/>
      <circle cx="95" cy="65" r="15" fill="#81c784" opacity=".6"/>
      <circle cx="180" cy="68" r="18" fill="#66bb6a" opacity=".7"/>
      <circle cx="192" cy="56" r="15" fill="#81c784" opacity=".6"/>
      {/* Top crown */}
      <circle cx="140" cy="75" r="24" fill="#66bb6a" opacity=".7"/>
      <circle cx="128" cy="62" r="20" fill="#81c784" opacity=".6"/>
      <circle cx="155" cy="58" r="20" fill="#81c784" opacity=".6"/>
      <circle cx="140" cy="50" r="18" fill="#4caf50" opacity=".5"/>
      {/* Flowers */}
      <circle cx="82" cy="125" r="6" fill="#f48fb1"/><circle cx="82" cy="125" r="2.5" fill="#fff176"/>
      <circle cx="195" cy="105" r="6" fill="#ce93d8"/><circle cx="195" cy="105" r="2.5" fill="#fff176"/>
      <circle cx="100" cy="90" r="5.5" fill="#ef9a9a"/><circle cx="100" cy="90" r="2.2" fill="#fff176"/>
      <circle cx="185" cy="78" r="5.5" fill="#f48fb1"/><circle cx="185" cy="78" r="2.2" fill="#fff176"/>
      <circle cx="130" cy="58" r="5" fill="#ce93d8"/><circle cx="130" cy="58" r="2" fill="#fff176"/>
      <circle cx="158" cy="52" r="5" fill="#ef9a9a"/><circle cx="158" cy="52" r="2" fill="#fff176"/>
      <circle cx="140" cy="42" r="5.5" fill="#f48fb1"/><circle cx="140" cy="42" r="2.2" fill="#fff9c4"/>
      <circle cx="72" cy="100" r="5" fill="#f48fb1"/><circle cx="72" cy="100" r="2" fill="#fff176"/>
      <circle cx="205" cy="85" r="5" fill="#ce93d8"/><circle cx="205" cy="85" r="2" fill="#fff176"/>
      <circle cx="115" cy="72" r="4.5" fill="#ef9a9a"/><circle cx="115" cy="72" r="1.8" fill="#fff176"/>
      <circle cx="168" cy="62" r="4.5" fill="#f48fb1"/><circle cx="168" cy="62" r="1.8" fill="#fff176"/>
      {/* Small leaf accents */}
      <circle cx="88" cy="148" r="8" fill="#a5d6a7" opacity=".5"/>
      <circle cx="195" cy="130" r="8" fill="#a5d6a7" opacity=".5"/>
      <circle cx="140" cy="92" r="10" fill="#a5d6a7" opacity=".4"/>
    </svg>
  );
}
