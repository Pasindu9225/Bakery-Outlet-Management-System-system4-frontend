import { companyDetailLines, escapeHtml, receiptHeaderHtml } from "./companyInfo";

test("only filled-in company details are printed, labelled", () => {
  expect(companyDetailLines({ address: "12 Main St, Kandy", phone: "081 222 3333", vatNo: "", tin: "TIN-99" }))
    .toEqual(["12 Main St, Kandy", "Tel: 081 222 3333", "TIN: TIN-99"]);
  expect(companyDetailLines({ address: "", phone: "", vatNo: "", tin: "" })).toEqual([]);
});

test("text put into printed HTML is escaped", () => {
  expect(escapeHtml(`Tom & Jerry's <Bakery>`)).toBe("Tom &amp; Jerry&#39;s &lt;Bakery&gt;");
  expect(escapeHtml(undefined)).toBe("");
});

test("HTML receipt header shows company, outlet and details, and skips what is missing", () => {
  const html = receiptHeaderHtml({ name: "Kandy Outlet", address: "5 Lake Rd" },
    { name: "Sweet <Crumbs>", address: "", phone: "077 1234567", vatNo: "V-1", tin: "" });
  expect(html).toContain("SWEET &lt;CRUMBS&gt;");
  expect(html).toContain("KANDY OUTLET");
  expect(html).toContain("5 Lake Rd");
  expect(html).toContain("Tel: 077 1234567");
  expect(html).toContain("VAT No: V-1");
  expect(html).not.toContain("TIN:");
  expect(receiptHeaderHtml({}, { name: "X", address: "", phone: "", vatNo: "", tin: "" })).not.toContain("undefined");
});
