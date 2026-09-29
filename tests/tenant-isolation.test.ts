import 'reflect-metadata';
import assert from 'node:assert/strict';
import test from 'node:test';
import { ForbiddenException } from '@nestjs/common';
import { GatewayController } from '../services/api-gateway/src/gateway.controller';
import { AuthenticatedRequest } from '../libs/security/auth';

function createController() {
  const calls: { feed?: unknown; event?: unknown } = {};
  const gatewayService = {
    getSeedFeed: async (input: unknown) => {
      calls.feed = input;
      return input;
    },
    createFeedEvent: async (input: unknown) => {
      calls.event = input;
      return input;
    },
  };
  return { calls, controller: new GatewayController(gatewayService as never, {} as never) };
}

const userRequest = { user: { id: 'user-a', tenantId: 'tenant-a', roles: ['viewer'] } } as AuthenticatedRequest;

test('feed lookup cannot use another user identity', async () => {
  const { controller, calls } = createController();
  await controller.getSeedFeed('user-a', userRequest, 'Nairobi', 'KE', 'en', 10);
  assert.deepEqual(calls.feed, {
    userId: 'user-a', tenantId: 'tenant-a', region: 'Nairobi', country: 'KE', language: 'en', take: 10,
  });
  await assert.rejects(
    controller.getSeedFeed('user-b', userRequest, undefined, undefined, undefined, undefined),
    ForbiddenException,
  );
});

test('feed events cannot be attributed to another user', async () => {
  const { controller, calls } = createController();
  const event = {
    userId: 'user-a', videoId: 'dd0b0f8f-62f8-48e7-9c3a-58dcb9ae3a56', action: 'view' as const,
  };
  await controller.createFeedEvent(event, userRequest);
  assert.deepEqual(calls.event, event);
  await assert.rejects(controller.createFeedEvent({ ...event, userId: 'user-b' }, userRequest), ForbiddenException);
});
