'use strict';

import { factories } from '@strapi/strapi';

module.exports = factories.createCoreRouter('api::task.task', {
  config: {
    find: { policies: ['global::is-authenticated'], middlewares: [] },
    findOne: { policies: ['global::is-authenticated'] },
    create: { policies: ['global::is-authenticated'] },
    update: { policies: ['global::is-authenticated'] },
    delete: { policies: ['global::is-authenticated'] },
  },
});
