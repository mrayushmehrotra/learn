import { Kafka } from "kafkajs";

export const kafka = new Kafka({
  clientId: "my-app",
  brokers: ["10.19.30.20:9092"],
});
