import { kafka } from "./client.js";
async function init() {
  const admin = kafka.admin();
  await admin.connect();
  console.log("Admin connected successfully");

  await admin.createTopics({
    topics: [
      {
        topic: "rider-updates",
        numPartitions: 2,
      },
    ],
  });
  console.log("Topic created successfully");

  await admin.disconnect();
  console.log("Admin disconnected");
}

init();
