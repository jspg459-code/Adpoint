"use client";

export default function FireTruckBeta(){
  return (
    <div className="fireTruckBeta" aria-label="FPT en bêta test">
      <div className="truckScene">
        <div className="roadGlow" />
        <svg viewBox="0 0 260 130" className="fptTruck" role="img" aria-hidden="true">
          <defs>
            <linearGradient id="truckRed" x1="0" x2="1">
              <stop offset="0" stopColor="#d71920"/>
              <stop offset="1" stopColor="#ff3b30"/>
            </linearGradient>
            <linearGradient id="cabRed" x1="0" x2="1">
              <stop offset="0" stopColor="#ef2d35"/>
              <stop offset="1" stopColor="#bd1019"/>
            </linearGradient>
          </defs>

          <ellipse cx="132" cy="111" rx="112" ry="10" fill="rgba(0,0,0,.35)"/>
          <path d="M18 58h142l28 20v25H18z" fill="url(#truckRed)" stroke="#ff8589" strokeWidth="2"/>
          <path d="M160 58h43l29 26v19h-72z" fill="url(#cabRed)" stroke="#ff8589" strokeWidth="2"/>
          <path d="M174 64h24l18 17h-42z" fill="#b9e5f4" stroke="#e8fbff" strokeWidth="2"/>
          <path d="M27 66h124v29H27z" fill="#b6171f" opacity=".5"/>
          <path d="M36 70h106v20" fill="none" stroke="#ffd8d8" strokeWidth="2" opacity=".7"/>
          <rect x="42" y="50" width="92" height="11" rx="4" fill="#f1f5f7"/>
          <rect x="49" y="52" width="20" height="7" rx="2" fill="#9ba9b7"/>
          <rect x="74" y="52" width="20" height="7" rx="2" fill="#9ba9b7"/>
          <rect x="99" y="52" width="20" height="7" rx="2" fill="#9ba9b7"/>
          <text x="74" y="88" textAnchor="middle" fontSize="17" fontWeight="900" fill="white">FPT</text>
          <rect x="20" y="97" width="214" height="7" rx="3.5" fill="#24313d"/>
          <circle cx="62" cy="104" r="17" fill="#101820" stroke="#778491" strokeWidth="4"/>
          <circle cx="62" cy="104" r="6" fill="#aeb8c2"/>
          <circle cx="184" cy="104" r="17" fill="#101820" stroke="#778491" strokeWidth="4"/>
          <circle cx="184" cy="104" r="6" fill="#aeb8c2"/>
          <rect x="75" y="39" width="26" height="9" rx="3" fill="#263849"/>
          <rect x="79" y="34" width="8" height="8" rx="3" className="beacon beaconBlue"/>
          <rect x="90" y="34" width="8" height="8" rx="3" className="beacon beaconRed"/>
          <rect x="223" y="88" width="8" height="8" rx="3" fill="#fff2a6"/>
          <rect x="24" y="88" width="8" height="8" rx="3" fill="#fff2a6"/>
        </svg>
        <span className="sirenGlow sirenBlue" />
        <span className="sirenGlow sirenRed" />
      </div>
      <div className="betaLabel">BÊTA TEST</div>
    </div>
  );
}
