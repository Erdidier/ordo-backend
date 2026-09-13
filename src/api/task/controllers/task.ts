'use strict';

import { factories } from '@strapi/strapi';

module.exports = factories.createCoreController(
  'api::task.task',
  ({ strapi }) => ({
    async find(ctx) {
      const userId = ctx.state.user.id;

      ctx.query.filters = {
        ...(ctx.query.filters ?? {}),
        owner: userId,
      };

      const { results, pagination } = await strapi
        .service('api::task.task')
        .find(ctx.query);

      const sanitized = await this.sanitizeOutput(results, ctx);

      return this.transformResponse(sanitized, { pagination });
    },
    async findOne(ctx) {
      const userId = ctx.state.user.id;
      const { id: documentId } = ctx.params;

      const task = await strapi
        .service('api::task.task')
        .findOwnedOrThrow(documentId, userId);

      const sanitized = await this.sanitizeOutput(task, ctx);

      return this.transformResponse(sanitized);
    },
    async create(ctx) {
      const userId = ctx.state.user.id;
      const data = ctx.request.body?.data;

      const created = await strapi
        .service('api::task.task')
        .createForUser(userId, data);

      const sanitized = await this.sanitizeOutput(created, ctx);

      ctx.status = 201;

      return this.transformResponse(sanitized);
    },
    async update(ctx) {
      const userId = ctx.state.user.id;
      const { id: documentId } = ctx.params;
      const { data } = ctx.request.body;

      const updated = await strapi
        .service('api::task.task')
        .updateForUser(documentId, userId, data);

      const sanitized = await this.sanitizeOutput(updated, ctx);

      return this.transformResponse(sanitized);
    },
    async delete(ctx) {
      const userId = ctx.state.user.id;
      const { id: documentId } = ctx.params;

      await strapi.service('api::task.task').deleteForUser(documentId, userId);

      ctx.status = 204;

      return null;
    },
    async sync(ctx) {
      const userId = ctx.state.user.id;
      const { since } = ctx.query;

      const filters = { owner: userId };

      if (since) {
        filters.updatedAt = { $gt: since };
      }

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
