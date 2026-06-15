import { createGateway } from './gateway/wsGateway.js';
import { logger } from './utils/logger.js';

const port = Number(process.env.MESSAGING_WS_PORT ?? 8787);
const redisUrl = process.env.REDIS_URL;

const gateway = createGateway(port, redisUrl);

logger.info('maylet_messaging_started', {
  port,
  scaling: redisUrl ? 'redis-pubsub' : 'single-node',
});

process.on('SIGINT', () => {
  void gateway.close().then(() => process.exit(0));
});
