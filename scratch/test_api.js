const fetch = require('node-fetch');

async function test() {
  try {
    const res = await fetch("http://localhost:3000/api/production/logs/batch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        logs: [{
          productionOrderId: "62e92e21-085e-49b9-9abf-7988def93685", // just a fake UUID
          employeeId: "f017eef9-ac7c-4739-9d58-b118b6fcbd1a",
          quantityProduced: 1,
          technicalErrorCount: 0,
          materialErrorCount: 0
        }],
        batchesUsed: []
      })
    });
    
    const text = await res.text();
    console.log("Status:", res.status);
    console.log("Headers:", res.headers.raw());
    console.log("Body:", text);
  } catch(e) {
    console.error("Fetch threw:", e);
  }
}

test();
