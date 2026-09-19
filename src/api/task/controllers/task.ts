'use strict';

import { factories } from '@strapi/strapi';

module.exports = factories.createCoreController(
  'api::task.task',
  ({ strapi }) => ({
    async sync(ctx) {
      const { since } = ctx.query;

      const sinceValue = typeof since === 'string' ? since : undefined;

      const filters = sinceValue ? { updatedAt: { $gt: sinceValue } } : {};

      const tasks = await strapi.documents('api::task.task').findMany({
        filters,
        populate: ['images', 'tags'],
        sort: { updatedAt: 'asc' },
      });

      const sanitized = await this.sanitizeOutput(tasks, ctx);

      return this.transformResponse(sanitized, {
        syncedAt: new Date().toISOString(),
      });
    },
  })
);
