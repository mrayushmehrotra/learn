import {kafka} from "./client.js"

async function myConsumer() {
const groupId = process.argv[2];

    const consumer = kafka.consumer({groupId})
    await consumer.connect();

    await consumer.subscribe({topic: "rider-updates" , fromBeginning: true})
    await consumer.run({
        eachMessage: async ({topic, partition, message}) => {
            console.log({
                group: groupId,
                partition: partition,
                topic: topic,
                key: message.key?.toString(),
                value: JSON.parse(message.value.toString())
            })
        }
    })
}

myConsumer();
