<!-- run zookeeper in the docker  -->

docker run -p 2181:2181 zookeeper #2181 is the default zookeeper port

<!-- to run kafak in the docker -->
<!-- 10.19..... is the my ip addr -->

docker run -p 9093:9092 \
-e KAFKA_ZOOKEEPER_CONNET=10.19.30.255:2181 \
-e KAFKA_ADVERTISED_LISTENER=PLAINTEXT://10.19.30.255:9092 \
-e KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR=1 \
confluentinc/cp-kafka

as you can see in the image,

one is producer can only 2 partition and 2 consumer attached to each other, so self balancing makes the kafka throw single message to single partition
