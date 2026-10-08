// Tranh minh hoạ màu cho 9 trò chơi (viewBox 0 0 96 96), tự vẽ cho dự án — xem assets/ATTRIBUTION.md.
// Quy ước: viền mực #1B2A2F 2.5px, ánh sáng từ trên-trái (mặt phải tối hơn), bóng đổ elip dưới chân.
// Mỗi chuỗi là phần bên trong <svg>; tự mang màu, không phụ thuộc stroke/fill bên ngoài.

const O = 'stroke="#1B2A2F" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"';
const shadow = (rx = 32) => `<ellipse cx="48" cy="86" rx="${rx}" ry="5" fill="#1B2A2F" opacity="0.18"/>`;

const circus = `
${shadow(34)}
<g ${O}>
  <path d="M18 84 L21 54 H75 L78 84 Z" fill="#FFF6EA"/>
</g>
<path d="M27 84 L29 54 H37 L36 84 Z M45 84 V54 H53 V84 Z M62 84 L61 54 H69 L71 84 Z" fill="#E4572E"/>
<path d="M66 54 H75 L78 84 H68 Z" fill="#1B2A2F" opacity="0.12"/>
<g ${O}>
  <path d="M18 84 L21 54 H75 L78 84 Z" fill="none"/>
  <path d="M38 84 V68 Q48 58 58 68 V84 Z" fill="#3B2A2A"/>
</g>
<path d="M38 84 V68 Q41 64 44 63 L43 84 Z M58 84 V68 Q55 64 52 63 L53 84 Z" fill="#B7372A"/>
<g ${O}>
  <path d="M12 56 Q48 46 84 56 L48 16 Z" fill="#E4572E"/>
</g>
<path d="M48 16 L30 52 Q36 50 40 49.5 Z M48 16 L52 48.5 Q58 49 64 50.5 Z" fill="#FFF6EA"/>
<path d="M48 16 L74 53 Q79 54 84 56 Z" fill="#1B2A2F" opacity="0.14"/>
<g ${O}>
  <path d="M12 56 Q48 46 84 56 L48 16 Z" fill="none"/>
  <path d="M12 56 Q16 62 21 57 Q26 62 30 55.5 Q35 61 39 54.5 Q44 60 48 54 Q52 60 57 54.5 Q61 61 66 55.5 Q70 62 75 57 Q80 62 84 56" fill="#FFB400"/>
  <path d="M48 16 V5"/>
  <path d="M48 5 L60 8.5 L48 12 Z" fill="#FFB400"/>
</g>
<circle cx="48" cy="16" r="2.4" fill="#FFB400" stroke="#1B2A2F" stroke-width="2"/>`;

const ghost = `
${shadow(32)}
<circle cx="74" cy="18" r="9" fill="#FFE9A8"/>
<g ${O}>
  <path d="M62 30 V16 H69 V36" fill="#4A3C78"/>
  <path d="M22 84 V46 H74 V84 Z" fill="#9B8AD6"/>
</g>
<path d="M60 46 H74 V84 H60 Z" fill="#1B2A2F" opacity="0.15"/>
<g ${O}>
  <path d="M22 84 V46 H74 V84 Z" fill="none"/>
  <path d="M14 48 L48 18 L82 48 Z" fill="#4A3C78"/>
  <path d="M41 84 V66 Q48 58 55 66 V84 Z" fill="#2B2340"/>
  <rect x="28" y="54" width="10" height="11" rx="1.5" fill="#FFD25A"/>
  <rect x="58" y="54" width="10" height="11" rx="1.5" fill="#FFD25A"/>
  <path d="M33 54 V65 M28 59.5 H38 M63 54 V65 M58 59.5 H68"/>
  <circle cx="48" cy="36" r="5" fill="#FFD25A"/>
</g>
<path d="M14 48 L48 18 L31 48 Z" fill="#FFFFFF" opacity="0.12"/>
<g ${O}>
  <path d="M6 44 V30 a9 9 0 0 1 18 0 V44 l-3.6 -3 -3 3 -2.4 -3 -3 3 -2.4 -3 Z" fill="#FFFFFF"/>
</g>
<circle cx="12" cy="31" r="1.8" fill="#1B2A2F"/>
<circle cx="18" cy="31" r="1.8" fill="#1B2A2F"/>
<ellipse cx="15" cy="37" rx="2" ry="2.6" fill="#1B2A2F"/>`;

const rocket = `
${shadow(26)}
<g ${O}>
  <path d="M22 84 Q48 74 74 84 Z" fill="#9AA7B0"/>
  <path d="M38 64 Q30 76 33 84 L41 78 Z" fill="#E4572E"/>
  <path d="M58 64 Q66 76 63 84 L55 78 Z" fill="#E4572E"/>
  <path d="M48 8 Q64 26 60 70 H36 Q32 26 48 8 Z" fill="#FFFFFF"/>
</g>
<path d="M52 12 Q64 28 60 70 H52 Q56 34 48 9 Z" fill="#1B2A2F" opacity="0.1"/>
<g ${O}>
  <path d="M48 8 Q57 17 60 28 H36 Q39 17 48 8 Z" fill="#E4572E"/>
  <circle cx="48" cy="42" r="8" fill="#5BC0EB"/>
  <path d="M44 74 Q48 92 52 74 Z" fill="#FFB400"/>
  <path d="M41 70 H55 V75 H41 Z" fill="#3E4B54"/>
</g>
<path d="M44.5 39 A4 4 0 0 1 48 36.5" stroke="#FFFFFF" stroke-width="2" fill="none" stroke-linecap="round"/>
<path d="M47 76 Q48 84 49 76 Z" fill="#FFF3C4"/>
<g fill="#FFB400" stroke="#1B2A2F" stroke-width="1.6" stroke-linejoin="round">
  <path d="M16 22 l2 4 4 1 -4 1 -2 4 -2 -4 -4 -1 4 -1 Z"/>
  <path d="M78 40 l1.6 3.2 3.2 0.8 -3.2 0.8 -1.6 3.2 -1.6 -3.2 -3.2 -0.8 3.2 -0.8 Z"/>
</g>`;

const carousel = `
${shadow(36)}
<g ${O}>
  <path d="M12 76 H84 V82 Q48 90 12 82 Z" fill="#C27C00"/>
  <path d="M14 72 H82 V77 H14 Z" fill="#FFD25A"/>
  <path d="M24 40 V73 M48 40 V73 M72 40 V73" stroke-width="3"/>
</g>
<path d="M24 40 V73 M48 40 V73 M72 40 V73" stroke="#FFD25A" stroke-width="1.2"/>
<g transform="translate(24 58) scale(1 1)">
  <path d="M-5 3 L-7 10 M-1 4 V10 M3 4 L4 10 M6 2 L9 8" stroke="#1B2A2F" stroke-width="2.2" stroke-linecap="round"/>
  <path d="M-8 -1 Q-13 0 -12 7" stroke="#1B2A2F" stroke-width="2.4" fill="none" stroke-linecap="round"/>
  <path d="M-9 0 Q-9 -5 -3 -5 H4 L8 -12 Q11 -15 14 -12 L15 -9 Q13 -8 11 -8 L8 -1 Q7 5 0 5 H-5 Q-9 5 -9 0 Z" fill="#FFFFFF" stroke="#1B2A2F" stroke-width="2.2" stroke-linejoin="round"/>
  <path d="M7 -12 Q8 -16 11 -15" stroke="#1B2A2F" stroke-width="2" fill="none" stroke-linecap="round"/>
  <path d="M-3 -5 H3 V0 H-3 Z" fill="#2E6FDB" stroke="#1B2A2F" stroke-width="1.6"/>
  <circle cx="11.5" cy="-11" r="1" fill="#1B2A2F"/>
</g>
<g transform="translate(48 62) scale(-1 1)">
  <path d="M-5 3 L-7 10 M-1 4 V10 M3 4 L4 10 M6 2 L9 8" stroke="#1B2A2F" stroke-width="2.2" stroke-linecap="round"/>
  <path d="M-8 -1 Q-13 0 -12 7" stroke="#1B2A2F" stroke-width="2.4" fill="none" stroke-linecap="round"/>
  <path d="M-9 0 Q-9 -5 -3 -5 H4 L8 -12 Q11 -15 14 -12 L15 -9 Q13 -8 11 -8 L8 -1 Q7 5 0 5 H-5 Q-9 5 -9 0 Z" fill="#FFFFFF" stroke="#1B2A2F" stroke-width="2.2" stroke-linejoin="round"/>
  <path d="M7 -12 Q8 -16 11 -15" stroke="#1B2A2F" stroke-width="2" fill="none" stroke-linecap="round"/>
  <path d="M-3 -5 H3 V0 H-3 Z" fill="#E4572E" stroke="#1B2A2F" stroke-width="1.6"/>
  <circle cx="11.5" cy="-11" r="1" fill="#1B2A2F"/>
</g>
<g transform="translate(72 56) scale(1 1)">
  <path d="M-5 3 L-7 10 M-1 4 V10 M3 4 L4 10 M6 2 L9 8" stroke="#1B2A2F" stroke-width="2.2" stroke-linecap="round"/>
  <path d="M-8 -1 Q-13 0 -12 7" stroke="#1B2A2F" stroke-width="2.4" fill="none" stroke-linecap="round"/>
  <path d="M-9 0 Q-9 -5 -3 -5 H4 L8 -12 Q11 -15 14 -12 L15 -9 Q13 -8 11 -8 L8 -1 Q7 5 0 5 H-5 Q-9 5 -9 0 Z" fill="#FFFFFF" stroke="#1B2A2F" stroke-width="2.2" stroke-linejoin="round"/>
  <path d="M7 -12 Q8 -16 11 -15" stroke="#1B2A2F" stroke-width="2" fill="none" stroke-linecap="round"/>
  <path d="M-3 -5 H3 V0 H-3 Z" fill="#1F9D55" stroke="#1B2A2F" stroke-width="1.6"/>
  <circle cx="11.5" cy="-11" r="1" fill="#1B2A2F"/>
</g>
<g ${O}>
  <path d="M10 42 Q48 6 86 42 Z" fill="#FFF6EA"/>
</g>
<path d="M48 12 Q34 20 25 33 L33 41 Z M48 12 L48 42 L60 41 Z M48 12 Q66 22 74 36 L82 41 Z" fill="#E4572E"/>
<path d="M48 12 Q72 24 86 42 H70 Z" fill="#1B2A2F" opacity="0.12"/>
<g ${O}>
  <path d="M10 42 Q48 6 86 42 Z" fill="none"/>
  <path d="M10 42 Q14 48 19.5 43 Q24 49 29 43.5 Q34 49 38.5 44 Q43 49.5 48 44 Q53 49.5 57.5 44 Q62 49 67 43.5 Q72 49 76.5 43 Q82 48 86 42" fill="#FFB400"/>
  <path d="M48 12 V6"/>
</g>
<circle cx="48" cy="5" r="3" fill="#FFB400" stroke="#1B2A2F" stroke-width="2"/>`;

const train = `
${shadow(38)}
<g stroke="#7A5A3A" stroke-width="3" stroke-linecap="round">
  <path d="M14 82 V86 M26 82 V86 M38 82 V86 M50 82 V86 M62 82 V86 M74 82 V86 M86 82 V86"/>
</g>
<path d="M8 82 H90" stroke="#5B6B66" stroke-width="3" stroke-linecap="round"/>
<circle cx="30" cy="22" r="7" fill="#FFFFFF" stroke="#C9D3CF" stroke-width="2"/>
<circle cx="22" cy="12" r="5" fill="#FFFFFF" stroke="#C9D3CF" stroke-width="2"/>
<circle cx="40" cy="16" r="4" fill="#FFFFFF" stroke="#C9D3CF" stroke-width="2"/>
<g ${O}>
  <path d="M30 46 V30 H38 V46" fill="#3E4B54"/>
  <path d="M26 30 H42 V34 H26 Z" fill="#1B2A2F"/>
  <path d="M18 72 V48 Q18 44 22 44 H54 V72 Z" fill="#1F9D55"/>
  <path d="M54 30 H80 V72 H54 Z" fill="#E4572E"/>
  <path d="M50 26 H84 V32 H50 Z" fill="#1B2A2F"/>
  <rect x="59" y="38" width="16" height="12" rx="2" fill="#BFE8FF"/>
  <path d="M10 74 L18 64 V74 Z" fill="#FFB400"/>
</g>
<path d="M18 50 H54 V54 H18 Z" fill="#FFB400" stroke="#1B2A2F" stroke-width="2"/>
<path d="M68 30 H80 V72 H68 Z" fill="#1B2A2F" opacity="0.15"/>
<g ${O}>
  <circle cx="30" cy="74" r="8" fill="#E4572E"/>
  <circle cx="48" cy="74" r="8" fill="#E4572E"/>
  <circle cx="70" cy="74" r="8" fill="#FFB400"/>
</g>
<circle cx="30" cy="74" r="2.5" fill="#1B2A2F"/><circle cx="48" cy="74" r="2.5" fill="#1B2A2F"/><circle cx="70" cy="74" r="2.5" fill="#1B2A2F"/>`;

const boat = `
<g ${O}>
  <path d="M6 60 Q48 50 90 60 V82 Q48 92 6 82 Z" fill="#4FB3E3"/>
</g>
<path d="M10 70 q6 -4 12 0 t12 0 M44 76 q6 -4 12 0 t12 0 M64 66 q6 -4 12 0" stroke="#FFFFFF" stroke-width="2.5" fill="none" stroke-linecap="round"/>
<g ${O}>
  <circle cx="36" cy="38" r="6" fill="#FFD2B0"/>
  <circle cx="56" cy="36" r="6" fill="#C98B5E"/>
  <path d="M30 46 Q36 40 42 46 Z" fill="#2E6FDB"/>
  <path d="M50 44 Q56 38 62 44 Z" fill="#E4572E"/>
  <path d="M14 48 H82 L74 66 Q48 72 22 66 Z" fill="#B97A45"/>
</g>
<path d="M18 54 H78 M24 61 H72" stroke="#8A5530" stroke-width="2" stroke-linecap="round"/>
<path d="M60 48 H82 L74 66 Q66 68 58 69 Z" fill="#1B2A2F" opacity="0.15"/>
<g ${O}>
  <ellipse cx="14" cy="48" rx="5" ry="6" fill="#D9A06A"/>
</g>
<circle cx="14" cy="48" r="2" fill="#8A5530"/>
<g fill="#FFFFFF" stroke="#1B2A2F" stroke-width="1.8">
  <path d="M82 52 q4 -8 8 -2 q-2 6 -8 2 Z"/>
  <circle cx="88" cy="42" r="2.5"/>
  <circle cx="80" cy="40" r="2"/>
</g>`;

const coaster = `
${shadow(38)}
<g stroke="#C9D3CF" stroke-width="3" stroke-linecap="round">
  <path d="M24 84 V58 M40 84 V30 M56 84 V40 M74 84 V52 M86 84 V68"/>
  <path d="M24 70 L40 56 M40 70 L56 58 M56 72 L74 62"/>
</g>
<g fill="none" stroke-linecap="round" stroke-linejoin="round">
  <path d="M4 76 C18 76 22 50 34 30 C44 14 58 16 60 30 C62 44 46 50 40 40 C34 30 48 22 58 34 C68 46 76 66 92 66" stroke="#1B2A2F" stroke-width="8"/>
  <path d="M4 76 C18 76 22 50 34 30 C44 14 58 16 60 30 C62 44 46 50 40 40 C34 30 48 22 58 34 C68 46 76 66 92 66" stroke="#E4572E" stroke-width="4.5"/>
  <path d="M4 76 C18 76 22 50 34 30 C44 14 58 16 60 30 C62 44 46 50 40 40 C34 30 48 22 58 34 C68 46 76 66 92 66" stroke="#FFB4A0" stroke-width="1.2"/>
</g>
<g ${O}>
  <path d="M13 64 l9 -9 6 6 -9 9 Z" fill="#FFB400"/>
  <path d="M21 56 l8 -9 6 5 -8 9 Z" fill="#2E6FDB"/>
</g>
<circle cx="18" cy="60" r="2.4" fill="#FFD2B0" stroke="#1B2A2F" stroke-width="1.6"/>
<circle cx="27" cy="51" r="2.4" fill="#C98B5E" stroke="#1B2A2F" stroke-width="1.6"/>`;

const wheel = `
${shadow(30)}
<g ${O}>
  <path d="M30 86 L48 44 L66 86" fill="none" stroke-width="4"/>
  <path d="M24 86 H72" stroke-width="4"/>
</g>
<path d="M30 86 L48 44 L66 86" stroke="#C27C00" stroke-width="1.5" fill="none"/>
<g stroke="#1B2A2F" stroke-width="2" stroke-linecap="round">
  <path d="M48 12 V76 M16 44 H80 M25.4 21.4 L70.6 66.6 M70.6 21.4 L25.4 66.6"/>
</g>
<circle cx="48" cy="44" r="32" fill="none" stroke="#1B2A2F" stroke-width="6"/>
<circle cx="48" cy="44" r="32" fill="none" stroke="#FFB400" stroke-width="3"/>
<circle cx="48" cy="44" r="20" fill="none" stroke="#1B2A2F" stroke-width="2"/>
<circle cx="48" cy="44" r="6" fill="#E4572E" stroke="#1B2A2F" stroke-width="2.5"/>
<g ${O}>
  <rect x="42" y="4" width="12" height="11" rx="3" fill="#E4572E"/>
  <rect x="74" y="38" width="12" height="11" rx="3" fill="#2E6FDB"/>
  <rect x="42" y="72" width="12" height="11" rx="3" fill="#1F9D55"/>
  <rect x="10" y="38" width="12" height="11" rx="3" fill="#7B4FD6"/>
  <rect x="64" y="14" width="11" height="10" rx="3" fill="#FFB400"/>
  <rect x="64" y="61" width="11" height="10" rx="3" fill="#E4572E"/>
  <rect x="21" y="61" width="11" height="10" rx="3" fill="#2E6FDB"/>
  <rect x="21" y="14" width="11" height="10" rx="3" fill="#1F9D55"/>
</g>`;

const splash = `
<g ${O}>
  <path d="M40 72 Q66 64 92 72 V84 Q66 92 40 84 Z" fill="#4FB3E3"/>
</g>
<path d="M50 78 q6 -4 12 0 t12 0" stroke="#FFFFFF" stroke-width="2.5" fill="none" stroke-linecap="round"/>
<g ${O}>
  <path d="M8 86 V22 M22 86 V22" stroke-width="3"/>
  <path d="M8 34 H22 M8 48 H22 M8 62 H22 M8 76 H22" stroke-width="2"/>
  <path d="M4 22 H26 V16 H4 Z" fill="#F6E1C3"/>
  <path d="M6 16 L15 6 L24 16 Z" fill="#E4572E"/>
</g>
<g fill="none" stroke-linecap="round" stroke-linejoin="round">
  <path d="M24 20 C46 20 62 22 62 34 C62 46 28 42 28 54 C28 66 50 62 60 72" stroke="#1B2A2F" stroke-width="13"/>
  <path d="M24 20 C46 20 62 22 62 34 C62 46 28 42 28 54 C28 66 50 62 60 72" stroke="#2E6FDB" stroke-width="8.5"/>
  <path d="M24 18 C46 18 60 20 60 32 M30 52 C30 60 40 62 48 64" stroke="#8FD3F4" stroke-width="2.5"/>
</g>
<g fill="#FFFFFF" stroke="#1B2A2F" stroke-width="1.8" stroke-linejoin="round">
  <path d="M62 66 q-2 -8 4 -10 q2 6 -4 10 Z"/>
  <path d="M70 70 q2 -8 8 -6 q-2 6 -8 6 Z"/>
  <circle cx="74" cy="56" r="2.5"/>
</g>`;

export const ART: Record<string, string> = { circus, ghost, rocket, carousel, train, boat, coaster, wheel, splash };
