import axios from "axios";

// E-bill: the customer's bill sent as an SMS instead of printed (POST /api/pos/v1/ebill).

const amount = (n) => Number(n || 0).toLocaleString("en-LK", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** 0771234567, 771234567, 94771234567 or +94771234567 (spaces/dashes allowed): a Sri Lankan mobile number. */
export const isMobile = (phone) => /^(\+?94|0)?7\d{8}$/.test(String(phone || "").replace(/[\s-]/g, ""));

/**
 * The SMS text of a bill. bill = { outletName, title, id, lines: [{ name, qty, amount }], totals: [[label, value]],
 * info: [[label, text]] }; value lines are money, info lines are printed as they are.
 */
// the business name on every SMS bill (client review 11 Nov: "Garden Club Kandy")
const BRAND = "Garden Club Kandy";

export function eBillText({ outletName, title = "Bill", id, lines = [], totals = [], info = [] }) {
    const d = new Date();
    return [
        BRAND,
        `${title}${id ? ` ${id}` : ""}`,
        `${d.toLocaleDateString("en-GB")} ${d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}`,
        ...lines.map((l) => `${l.name} x${l.qty} ${amount(l.amount)}`),
        ...totals.filter(([, v]) => v != null).map(([label, v]) => `${label} Rs.${amount(v)}`),
        ...info.filter(([, v]) => v).map(([label, v]) => `${label}: ${v}`),
        "Thank you! Come again.",
    ].filter(Boolean).join("\n");
}

/** A POS bill (the printData of POS Sales, Table Billing and Waiter Billing) as an e-bill. */
export const posBill = (printData, outlet = {}) => ({
    outletName: outlet.name,
    title: "Bill",
    id: printData.transactionId,
    lines: (printData.items || []).map((i) => ({
        name: i.productName || i.name,
        qty: i.qty ?? i.quantity,
        amount: (i.unitPrice ?? i.price ?? 0) * (i.qty ?? i.quantity ?? 0),
    })),
    totals: [
        ["Subtotal", printData.subTotal],
        ["Discount", printData.discount > 0 ? -printData.discount : null],
        ["Total", printData.finalTotal],
        // cash bills: what the customer gave and the change handed back
        ["Cash", printData.cashGiven > 0 ? printData.cashGiven : null],
        ["Change", printData.cashGiven > 0 ? printData.change ?? 0 : null],
    ],
    info: [["Paid by", printData.paymentMethod]],
});

/** Sends the e-bill; resolves to the server's message, throws with a readable message when it was not sent. */
export async function sendEBill(phone, bill) {
    try {
        const res = await axios.post(`${process.env.REACT_APP_BASE_URL}/api/pos/v1/ebill`, { phone, message: eBillText(bill) });
        return res.data?.message || "E-bill sent.";
    } catch (error) {
        throw new Error(error.response?.data?.message || "The e-bill could not be sent. Try again or print the bill.");
    }
}
