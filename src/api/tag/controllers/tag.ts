'use strict';

import { factories } from '@strapi/strapi';

module.exports = factories.createCoreController(
  'api::tag.tag',
  ({ strapi }) => ({
    async find(ctx) {
      const userId = ctx.state.user.id;

      ctx.query.filters = {
        ...(ctx.query.filters ?? {}),
        owner: userId,
      };

      return super.find(ctx);
    },
    async create(ctx) {
      const userId = ctx.state.user.id;
      const data = ctx.request.body?.data;

      const created = await strapi
        .service('api::tag.tag')
        .createForUser(userId, data);

      ctx.status = 201;

      return this.transformResponse(created);
    },
  })
);
