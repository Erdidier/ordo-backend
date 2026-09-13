'use strict';

import { factories } from '@strapi/strapi';

module.exports = factories.createCoreRouter('api::task.task', {
  config: {
    find: { middlewares: [] },
  },
});
