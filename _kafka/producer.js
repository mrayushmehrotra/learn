import { kafka } from "./client.js";

import readline from "readline";

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
})


async function myProducer() {
    
    console.log('Producer connecting')
    const producer = kafka.producer();
    await producer.connect();
    console.log('Producer connected')
    
    rl.setPrompt(">")
    rl.prompt();
    rl.on("line", async (input) => {
        const [riderName, location] = input.split(' ')
        console.log(`Received: ${input}`)
        await producer.send({
            topic: 'rider-updates',
            messages: [
                {
                    partition: location.toLocaleLowerCase() === "north" ? 0 : 1,
                    key: "location_update", 
                    value: JSON.stringify({ name: riderName,  location })
                },
            ],
        })
    }).on("close",  async () => {
        console.log('Producer disconnected')
        producer.disconnect()
        
    })
    console.log('Message sent successfully')
  

 
    
}

myProducer();