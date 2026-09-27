import { companyDetailLines, escapeHtml } from "./companyInfo";

test("only filled-in company details are printed, labelled", () => {
  expect(companyDetailLines({ address: "12 Main St, Kandy", phone: "081 222 3333", vatNo: "", tin: "TIN-99" }))
    .toEqual(["12 Main St, Kandy", "Tel: 081 222 3333", "TIN: TIN-99"]);
  expect(companyDetailLines({ address: "", phone: "", vatNo: "", tin: "" })).toEqual([]);
});

test("text put into printed HTML is escaped", () => {
  expect(escapeHtml(`Tom & Jerry's <Bakery>`)).toBe("Tom &amp; Jerry&#39;s &lt;Bakery&gt;");
  expect(escapeHtml(undefined)).toBe("");
});

