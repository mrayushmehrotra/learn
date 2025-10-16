const { Kafka } = require("kafkajs");

const kafka = new Kafka({
  clientId: "my-app",
  brokers: ["10.19.30.20:9092"],
});

async function init() {
  const admin = kafka.admin();
  admin.connect();
  console.log("Admin connected successfully");

  admin.createTopics({
    topics: [
      {
        topic: "rider-updates",
        numPartitions: 2,
      },
    ],
  });
  await admin.disconnect();
  console.log("admin disconnecting");
}

init();
