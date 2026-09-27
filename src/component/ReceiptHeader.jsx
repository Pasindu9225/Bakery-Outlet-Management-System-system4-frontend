import React from "react";
import { companyInfo, companyDetailLines } from "../utils/companyInfo";

/** Top of every thermal bill: company name, the outlet that made the sale, then address / phone / VAT / TIN. */
export default function ReceiptHeader({ outlet = {} }) {
  return (
    <div className="mb-2">
      <div className="text-center font-bold text-sm mb-1">{companyInfo.name.toUpperCase()}</div>
      {outlet.name && <div className="text-center text-[10px]">{outlet.name.toUpperCase()}</div>}
      {outlet.address && <div className="text-center text-[10px]">{outlet.address}</div>}
      {companyDetailLines().map((line) => (
        <div key={line} className="text-center text-[10px]">{line}</div>
      ))}
    </div>
  );
}
