import React from "react";

export default function RoleAvatar({ roleId, className = "w-10 h-10" }) {
  const normalizedRole = String(roleId || "").trim().toUpperCase();

  // Custom high-quality vector illustrations for each role, inspired by the user's avatar style
  switch (normalizedRole) {
    case "1":
    case "ADMIN":
      return (
        <svg viewBox="0 0 100 100" className={`${className} shrink-0`}>
          <circle cx="50" cy="50" r="48" fill="#FEE2E2" />
          <ellipse cx="33" cy="45" rx="4.5" ry="6.5" fill="#FFD1B3" />
          <ellipse cx="67" cy="45" rx="4.5" ry="6.5" fill="#FFD1B3" />
          <path d="M43,48 L43,65 C43,65 50,68 57,65 L57,48 Z" fill="#FFD1B3" />
          <path d="M43,48 L43,54 C46,59 54,59 57,54 L57,48 Z" fill="#ECA17B" />
          <path d="M36,36 C36,54 42,58 50,58 C58,58 64,54 64,36 Z" fill="#FFD1B3" />
          <path d="M33,36 C33,21 41,19 50,19 C59,19 67,21 67,36 C68,39 66,41 66,41 C66,41 64,34 60,34 C57,34 55,37 50,37 C45,37 43,34 40,34 C36,34 34,41 34,41 C34,41 32,39 33,36 Z" fill="#64748B" />
          <path d="M22,85 C22,68 31,63 50,63 C69,63 78,68 78,85 Z" fill="#1E293B" />
          <polygon points="44,63 56,63 50,72" fill="#FFFFFF" />
          <polygon points="38,63 44,72 50,66" fill="#0F172A" />
          <polygon points="62,63 56,72 50,66" fill="#0F172A" />
          <polygon points="48,66 52,66 53,72 47,72" fill="#EF4444" />
          <polygon points="47,72 53,72 55,90 50,94 45,90" fill="#EF4444" />
        </svg>
      );

    case "8":
    case "POS":
      return (
        <svg viewBox="0 0 100 100" className={`${className} shrink-0`}>
          <circle cx="50" cy="50" r="48" fill="#D1FAE5" />
          <ellipse cx="33" cy="45" rx="4.5" ry="6.5" fill="#FFD1B3" />
          <ellipse cx="67" cy="45" rx="4.5" ry="6.5" fill="#FFD1B3" />
          <path d="M43,48 L43,65 C43,65 50,68 57,65 L57,48 Z" fill="#FFD1B3" />
          <path d="M43,48 L43,54 C46,59 54,59 57,54 L57,48 Z" fill="#ECA17B" />
          <path d="M36,36 C36,54 42,58 50,58 C58,58 64,54 64,36 Z" fill="#FFD1B3" />
          <path d="M33,36 C33,21 41,19 50,19 C59,19 67,21 67,36 C68,39 66,41 66,41 C66,41 64,34 60,34 C57,34 55,37 50,37 C45,37 43,34 40,34 C36,34 34,41 34,41 C34,41 32,39 33,36 Z" fill="#D97706" />
          <path d="M22,85 C22,68 31,63 50,63 C69,63 78,68 78,85 Z" fill="#047857" />
          <polygon points="38,63 43,72 50,66" fill="#064E3B" />
          <polygon points="62,63 57,72 50,66" fill="#064E3B" />
          <path d="M32,40 A 18,18 0 0,1 68,40" fill="none" stroke="#1E293B" strokeWidth="3" />
          <rect x="30" y="38" width="4" height="10" rx="1.5" fill="#1E293B" />
          <rect x="66" y="38" width="4" height="10" rx="1.5" fill="#1E293B" />
          <path d="M32,45 Q40,52 45,52" fill="none" stroke="#1E293B" strokeWidth="2" />
        </svg>
      );

    case "9":
    case "STOREKEEPER":
      return (
        <svg viewBox="0 0 100 100" className={`${className} shrink-0`}>
          <circle cx="50" cy="50" r="48" fill="#DBEAFE" />
          <ellipse cx="33" cy="45" rx="4.5" ry="6.5" fill="#FFD1B3" />
          <ellipse cx="67" cy="45" rx="4.5" ry="6.5" fill="#FFD1B3" />
          <path d="M43,48 L43,65 C43,65 50,68 57,65 L57,48 Z" fill="#FFD1B3" />
          <path d="M43,48 L43,54 C46,59 54,59 57,54 L57,48 Z" fill="#ECA17B" />
          <path d="M36,36 C36,54 42,58 50,58 C58,58 64,54 64,36 Z" fill="#FFD1B3" />
          <path d="M33,36 C33,21 41,19 50,19 C59,19 67,21 67,36 Z" fill="#27272A" />
          <path d="M32,28 C32,16 68,16 68,28 Z" fill="#EAB308" />
          <rect x="28" y="26" width="44" height="4" rx="2" fill="#CA8A04" />
          <path d="M47,15 L53,15 L52,26 L48,26 Z" fill="#CA8A04" />
          <path d="M22,85 C22,68 31,63 50,63 C69,63 78,68 78,85 Z" fill="#1E40AF" />
          <path d="M34,63 L42,78 L50,63 L58,78 L66,63 C72,70 76,77 76,85 L24,85 C24,77 28,70 34,63" fill="#F97316" />
          <rect x="29" y="74" width="8" height="11" fill="#FFFFFF" opacity="0.8" />
          <rect x="63" y="74" width="8" height="11" fill="#FFFFFF" opacity="0.8" />
        </svg>
      );

    case "10":
    case "MANAGER":
      return (
        <svg viewBox="0 0 100 100" className={`${className} shrink-0`}>
          <circle cx="50" cy="50" r="48" fill="#E0F2FE" />
          <ellipse cx="33" cy="45" rx="4.5" ry="6.5" fill="#FFD1B3" />
          <ellipse cx="67" cy="45" rx="4.5" ry="6.5" fill="#FFD1B3" />
          <path d="M43,48 L43,65 C43,65 50,68 57,65 L57,48 Z" fill="#FFD1B3" />
          <path d="M43,48 L43,54 C46,59 54,59 57,54 L57,48 Z" fill="#ECA17B" />
          <path d="M36,36 C36,54 42,58 50,58 C58,58 64,54 64,36 Z" fill="#FFD1B3" />
          <path d="M33,36 C33,21 41,19 50,19 C59,19 67,21 67,36 C68,39 66,41 66,41 C66,41 64,34 60,34 C57,34 55,37 50,37 C45,37 43,34 40,34 C36,34 34,41 34,41 C34,41 32,39 33,36 Z" fill="#8C5A3C" />
          <path d="M22,85 C22,68 31,63 50,63 C69,63 78,68 78,85 Z" fill="#3A4F66" />
          <polygon points="38,63 43,72 50,66" fill="#2C3E50" />
          <polygon points="62,63 57,72 50,66" fill="#2C3E50" />
          <polygon points="48,66 52,66 53,72 47,72" fill="#008CFF" />
          <polygon points="47,72 53,72 55,90 50,94 45,90" fill="#008CFF" />
        </svg>
      );

    case "11":
    case "WAITER":
      return (
        <svg viewBox="0 0 100 100" className={`${className} shrink-0`}>
          <circle cx="50" cy="50" r="48" fill="#FFE4E6" />
          <ellipse cx="33" cy="45" rx="4.5" ry="6.5" fill="#FFD1B3" />
          <ellipse cx="67" cy="45" rx="4.5" ry="6.5" fill="#FFD1B3" />
          <path d="M43,48 L43,65 C43,65 50,68 57,65 L57,48 Z" fill="#FFD1B3" />
          <path d="M43,48 L43,54 C46,59 54,59 57,54 L57,48 Z" fill="#ECA17B" />
          <path d="M36,36 C36,54 42,58 50,58 C58,58 64,54 64,36 Z" fill="#FFD1B3" />
          <path d="M33,36 C33,21 41,19 50,19 C59,19 67,21 67,36 C68,39 66,41 66,41 C66,41 64,34 60,34 C57,34 55,37 50,37 C45,37 43,34 40,34 C36,34 34,41 34,41 C34,41 32,39 33,36 Z" fill="#451A03" />
          <path d="M22,85 C22,68 31,63 50,63 C69,63 78,68 78,85 Z" fill="#1F2937" />
          <polygon points="43,63 57,63 50,75" fill="#FFFFFF" />
          <polygon points="38,63 44,70 50,66" fill="#111827" />
          <polygon points="62,63 56,70 50,66" fill="#111827" />
          <polygon points="44,66 44,72 50,69" fill="#111827" />
          <polygon points="56,66 56,72 50,69" fill="#111827" />
          <circle cx="50" cy="69" r="2" fill="#111827" />
        </svg>
      );

    case "12":
    case "BAKERY":
      return (
        <svg viewBox="0 0 100 100" className={`${className} shrink-0`}>
          <circle cx="50" cy="50" r="48" fill="#FEF3C7" />
          <ellipse cx="33" cy="45" rx="4.5" ry="6.5" fill="#FFD1B3" />
          <ellipse cx="67" cy="45" rx="4.5" ry="6.5" fill="#FFD1B3" />
          <path d="M43,48 L43,65 C43,65 50,68 57,65 L57,48 Z" fill="#FFD1B3" />
          <path d="M43,48 L43,54 C46,59 54,59 57,54 L57,48 Z" fill="#ECA17B" />
          <path d="M36,36 C36,54 42,58 50,58 C58,58 64,54 64,36 Z" fill="#FFD1B3" />
          <path d="M33,36 C33,21 41,19 50,19 C59,19 67,21 67,36 Z" fill="#3F2A1D" />
          <path d="M35,22 C32,22 30,14 38,10 C35,4 45,2 50,8 C55,2 65,4 62,10 C70,14 68,22 65,22 Z" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="0.5" />
          <rect x="36" y="19" width="28" height="6" fill="#F1F5F9" rx="1" stroke="#CBD5E1" strokeWidth="0.5" />
          <path d="M22,85 C22,68 31,63 50,63 C69,63 78,68 78,85 Z" fill="#F8FAFC" />
          <path d="M50,63 L50,85" stroke="#E2E8F0" strokeWidth="2" />
          <circle cx="54" cy="68" r="2" fill="#94A3B8" />
          <circle cx="54" cy="76" r="2" fill="#94A3B8" />
        </svg>
      );

    case "13":
    case "KITCHEN":
      return (
        <svg viewBox="0 0 100 100" className={`${className} shrink-0`}>
          <circle cx="50" cy="50" r="48" fill="#FFEDD5" />
          <ellipse cx="33" cy="45" rx="4.5" ry="6.5" fill="#FFD1B3" />
          <ellipse cx="67" cy="45" rx="4.5" ry="6.5" fill="#FFD1B3" />
          <path d="M43,48 L43,65 C43,65 50,68 57,65 L57,48 Z" fill="#FFD1B3" />
          <path d="M43,48 L43,54 C46,59 54,59 57,54 L57,48 Z" fill="#ECA17B" />
          <path d="M36,36 C36,54 42,58 50,58 C58,58 64,54 64,36 Z" fill="#FFD1B3" />
          <path d="M33,36 C33,21 41,19 50,19 C59,19 67,21 67,36 Z" fill="#1E293B" />
          <path d="M34,26 C34,16 66,16 66,26 Z" fill="#EF4444" />
          <path d="M64,26 C67,26 69,28 67,31 C65,33 63,31 63,28 Z" fill="#DC2626" />
          <path d="M22,85 C22,68 31,63 50,63 C69,63 78,68 78,85 Z" fill="#334155" />
          <polygon points="40,63 60,63 58,85 42,85" fill="#DC2626" />
          <path d="M40,63 Q50,68 60,63" fill="none" stroke="#B91C1C" strokeWidth="1.5" />
        </svg>
      );

    case "14":
    case "MPC":
      return (
        <svg viewBox="0 0 100 100" className={`${className} shrink-0`}>
          <circle cx="50" cy="50" r="48" fill="#F3E8FF" />
          <ellipse cx="33" cy="45" rx="4.5" ry="6.5" fill="#FFD1B3" />
          <ellipse cx="67" cy="45" rx="4.5" ry="6.5" fill="#FFD1B3" />
          <path d="M43,48 L43,65 C43,65 50,68 57,65 L57,48 Z" fill="#FFD1B3" />
          <path d="M43,48 L43,54 C46,59 54,59 57,54 L57,48 Z" fill="#ECA17B" />
          <path d="M36,36 C36,54 42,58 50,58 C58,58 64,54 64,36 Z" fill="#FFD1B3" />
          <path d="M33,36 C33,21 41,19 50,19 C59,19 67,21 67,36 Z" fill="#1E293B" />
          <path d="M32,28 C32,16 68,16 68,28 Z" fill="#3B82F6" />
          <ellipse cx="50" cy="28" rx="18" ry="2" fill="#1D4ED8" />
          <path d="M34,26 L66,26 L62,20 L38,20 Z" fill="#2563EB" />
          <path d="M22,85 C22,68 31,63 50,63 C69,63 78,68 78,85 Z" fill="#3B82F6" />
          <polygon points="38,63 43,72 50,66" fill="#1D4ED8" />
          <polygon points="62,63 57,72 50,66" fill="#1D4ED8" />
        </svg>
      );

    case "15":
    case "FINANCE":
      return (
        <svg viewBox="0 0 100 100" className={`${className} shrink-0`}>
          <circle cx="50" cy="50" r="48" fill="#CCFBF1" />
          <ellipse cx="33" cy="45" rx="4.5" ry="6.5" fill="#FFD1B3" />
          <ellipse cx="67" cy="45" rx="4.5" ry="6.5" fill="#FFD1B3" />
          <path d="M43,48 L43,65 C43,65 50,68 57,65 L57,48 Z" fill="#FFD1B3" />
          <path d="M43,48 L43,54 C46,59 54,59 57,54 L57,48 Z" fill="#ECA17B" />
          <path d="M36,36 C36,54 42,58 50,58 C58,58 64,54 64,36 Z" fill="#FFD1B3" />
          <path d="M33,36 C33,21 41,19 50,19 C59,19 67,21 67,36 C68,39 66,41 66,41 C66,41 64,34 60,34 C57,34 55,37 50,37 C45,37 43,34 40,34 C36,34 34,41 34,41 C34,41 32,39 33,36 Z" fill="#1E293B" />
          <path d="M22,85 C22,68 31,63 50,63 C69,63 78,68 78,85 Z" fill="#1E3A8A" />
          <polygon points="44,63 56,63 50,72" fill="#FFFFFF" />
          <polygon points="38,63 44,70 50,66" fill="#172554" />
          <polygon points="62,63 56,70 50,66" fill="#172554" />
          <polygon points="48,66 52,66 53,72 47,72" fill="#D97706" />
          <polygon points="47,72 53,72 55,90 50,94 45,90" fill="#D97706" />
        </svg>
      );

    case "20":
    case "MIS":
      return (
        <svg viewBox="0 0 100 100" className={`${className} shrink-0`}>
          <circle cx="50" cy="50" r="48" fill="#F5F3FF" />
          <ellipse cx="33" cy="45" rx="4.5" ry="6.5" fill="#FFD1B3" />
          <ellipse cx="67" cy="45" rx="4.5" ry="6.5" fill="#FFD1B3" />
          <path d="M43,48 L43,65 C43,65 50,68 57,65 L57,48 Z" fill="#FFD1B3" />
          <path d="M43,48 L43,54 C46,59 54,59 57,54 L57,48 Z" fill="#ECA17B" />
          <path d="M36,36 C36,54 42,58 50,58 C58,58 64,54 64,36 Z" fill="#FFD1B3" />
          <path d="M33,36 C33,21 41,19 50,19 C59,19 67,21 67,36 C68,39 66,41 66,41 C66,41 64,34 60,34 C57,34 55,37 50,37 C45,37 43,34 40,34 C36,34 34,41 34,41 C34,41 32,39 33,36 Z" fill="#451A03" />
          <rect x="36" y="40" width="11" height="7" rx="2" fill="none" stroke="#1E293B" strokeWidth="2.5" />
          <rect x="53" y="40" width="11" height="7" rx="2" fill="none" stroke="#1E293B" strokeWidth="2.5" />
          <line x1="47" y1="43" x2="53" y2="43" stroke="#1E293B" strokeWidth="2.5" />
          <path d="M22,85 C22,68 31,63 50,63 C69,63 78,68 78,85 Z" fill="#6D28D9" />
          <polygon points="38,63 43,72 50,66" fill="#4C1D95" />
          <polygon points="62,63 57,72 50,66" fill="#4C1D95" />
        </svg>
      );

    default:
      return (
        <svg viewBox="0 0 100 100" className={`${className} shrink-0`}>
          <circle cx="50" cy="50" r="48" fill="#E2E8F0" />
          <ellipse cx="33" cy="45" rx="4.5" ry="6.5" fill="#FFD1B3" />
          <ellipse cx="67" cy="45" rx="4.5" ry="6.5" fill="#FFD1B3" />
          <path d="M43,48 L43,65 C43,65 50,68 57,65 L57,48 Z" fill="#FFD1B3" />
          <path d="M43,48 L43,54 C46,59 54,59 57,54 L57,48 Z" fill="#ECA17B" />
          <path d="M36,36 C36,54 42,58 50,58 C58,58 64,54 64,36 Z" fill="#FFD1B3" />
          <path d="M33,36 C33,21 41,19 50,19 C59,19 67,21 67,36 Z" fill="#475569" />
          <path d="M22,85 C22,68 31,63 50,63 C69,63 78,68 78,85 Z" fill="#64748B" />
          <polygon points="38,63 43,72 50,66" fill="#475569" />
          <polygon points="62,63 57,72 50,66" fill="#475569" />
        </svg>
      );
  }
}
