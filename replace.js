const fs = require('fs');
const waiterFile = 'd:/spring/claude/original/BMS/backerymanagmentsystem-Frontend/src/POS/POSWaiterBilling.jsx';
let content = fs.readFileSync(waiterFile, 'utf-8');

content = content.replace(/POSTableBilling/g, 'POSWaiterBilling');
content = content.replace(/Table Management/g, 'Waiter Management');
content = content.replace(/table-billing/g, 'waiter-billing');
content = content.replace(/tables\`/g, 'waiters?outletId=${localStorage.getItem("outletId")}`');
content = content.replace(/tableDetails\.tableName/g, 'tableDetails.waiterName');
content = content.replace(/tableDetails\.tableId/g, 'tableDetails.waiterId');
content = content.replace(/tableId:/g, 'waiterId:');
content = content.replace(/tableId=/g, 'waiterId=');

fs.writeFileSync(waiterFile, content);
console.log('POSWaiterBilling.jsx updated');
