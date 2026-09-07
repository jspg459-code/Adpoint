"use client";

export default function FireTruckBeta(){
  return (
    <div className="fireTruckBeta" aria-label="Fourgon pompe-tonne FPT en bêta test">
      <div className="truckScene">
        <div className="roadGlow" />
        <svg viewBox="0 0 360 170" className="fptTruck" role="img" aria-hidden="true">
          <defs>
            <linearGradient id="fptBody" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor="#f52a2a"/>
              <stop offset=".48" stopColor="#d90f17"/>
              <stop offset="1" stopColor="#a90810"/>
            </linearGradient>
            <linearGradient id="fptCab" x1="0" x2="1">
              <stop offset="0" stopColor="#ef252b"/>
              <stop offset="1" stopColor="#b90a12"/>
            </linearGradient>
            <linearGradient id="fptGlass" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor="#bfe9f5"/>
              <stop offset="1" stopColor="#315667"/>
            </linearGradient>
          </defs>

          <ellipse cx="180" cy="146" rx="154" ry="12" fill="rgba(0,0,0,.38)"/>

          <path d="M22 72 Q24 60 38 60 H228 V132 H22Z" fill="url(#fptBody)" stroke="#ff9a9a" strokeWidth="2"/>
          <path d="M228 67 H282 Q290 67 298 78 L330 105 V132 H228Z" fill="url(#fptCab)" stroke="#ff9a9a" strokeWidth="2"/>

          <path d="M246 76 H279 L300 99 H238Z" fill="url(#fptGlass)" stroke="#dff9ff" strokeWidth="2"/>
          <path d="M284 76 L295 78 L319 105 H305Z" fill="url(#fptGlass)" stroke="#dff9ff" strokeWidth="2"/>
          <path d="M279 76 L278 99" stroke="#eefcff" strokeWidth="2" opacity=".7"/>

          <rect x="30" y="70" width="192" height="7" fill="#fff"/>
          <rect x="30" y="77" width="192" height="5" fill="#d8d8d8"/>
          <path d="M33 85 H220" stroke="#ffcf00" strokeWidth="5"/>
          <path d="M33 91 H220" stroke="#263b4c" strokeWidth="3"/>

          <g fill="#b8c3ca" stroke="#eff6f8" strokeWidth="1.5">
            <rect x="40" y="97" width="48" height="29" rx="3"/>
            <rect x="94" y="97" width="48" height="29" rx="3"/>
            <rect x="148" y="97" width="48" height="29" rx="3"/>
          </g>
          <g stroke="#687781" strokeWidth="2">
            <path d="M47 104 H81 M47 111 H81 M47 118 H81"/>
            <path d="M101 104 H135 M101 111 H135 M101 118 H135"/>
            <path d="M155 104 H189 M155 111 H189 M155 118 H189"/>
          </g>

          <circle cx="202" cy="109" r="14" fill="#24313b" stroke="#d6e1e5" strokeWidth="3"/>
          <circle cx="202" cy="109" r="7" fill="#8fa3ad"/>
          <circle cx="202" cy="109" r="2" fill="#28333a"/>

          <rect x="54" y="48" width="130" height="12" rx="3" fill="#eef2f4" stroke="#9daab2" strokeWidth="2"/>
          <g stroke="#778691" strokeWidth="3">
            <path d="M68 50 V58 M86 50 V58 M104 50 V58 M122 50 V58 M140 50 V58 M158 50 V58"/>
          </g>

          <rect x="110" y="38" width="50" height="10" rx="4" fill="#263744"/>
          <rect x="115" y="33" width="17" height="10" rx="4" className="beacon beaconBlue"/>
          <rect x="138" y="33" width="17" height="10" rx="4" className="beacon beaconRed"/>

          <rect x="38" y="124" width="291" height="10" rx="4" fill="#26323a"/>
          <path d="M230 125 H328" stroke="#f3c400" strokeWidth="4"/>
          <rect x="30" y="108" width="8" height="9" rx="2" fill="#fff3a5"/>
          <rect x="317" y="111" width="9" height="8" rx="2" fill="#fff3a5"/>

          <g>
            <circle cx="76" cy="136" r="24" fill="#111820" stroke="#72808a" strokeWidth="5"/>
            <circle cx="76" cy="136" r="11" fill="#c0c8cd"/>
            <circle cx="76" cy="136" r="4" fill="#53616b"/>
            <circle cx="258" cy="136" r="24" fill="#111820" stroke="#72808a" strokeWidth="5"/>
            <circle cx="258" cy="136" r="11" fill="#c0c8cd"/>
            <circle cx="258" cy="136" r="4" fill="#53616b"/>
          </g>

          <text x="128" y="94" textAnchor="middle" fontSize="17" fontWeight="900" fill="#fff" letterSpacing="2">SAPEURS-POMPIERS</text>
          <text x="284" y="121" textAnchor="middle" fontSize="13" fontWeight="900" fill="#fff">FPT</text>

          <path d="M25 64 H225" stroke="rgba(255,255,255,.45)" strokeWidth="2"/>
          <path d="M238 105 H329" stroke="rgba(0,0,0,.18)" strokeWidth="2"/>
        </svg>
        <span className="sirenGlow sirenBlue" />
        <span className="sirenGlow sirenRed" />
      </div>
      <div className="betaLabel">BÊTA TEST</div>
    </div>
  );
}
