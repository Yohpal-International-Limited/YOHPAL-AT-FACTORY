import { Kafka, Producer, Consumer, EachMessagePayload } from 'kafkajs';
import { env } from './env';

export const kafka = new Kafka({
  clientId: 'yohpal-live-ai-content-factory',
  brokers: env.kafkaBrokers,
});

let producer: Producer | null = null;

export async function getKafkaProducer(): Promise<Producer> {
  if (!producer) {
    producer = kafka.producer();
    await producer.connect();
  }
  return producer;
}

export async function publishEvent<TPayload>(
  topic: string,
  payload: TPayload,
  key?: string
): Promise<void> {
  const activeProducer = await getKafkaProducer();
  await activeProducer.send({
    topic,
    messages: [
      {
        key,
        value: JSON.stringify(payload),
      },
    ],
  });
}

export async function createConsumer(
  groupId: string,
  topics: string[],
  handler: (payload: EachMessagePayload) => Promise<void>
): Promise<Consumer> {
  const consumer = kafka.consumer({ groupId });
  await consumer.connect();
  for (const topic of topics) {
    await consumer.subscribe({ topic, fromBeginning: false });
  }
  await consumer.run({
    eachMessage: handler,
  });
  return consumer;
}
