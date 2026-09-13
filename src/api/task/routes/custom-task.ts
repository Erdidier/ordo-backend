'use strict';

module.exports = {
  routes: [
    {
      method: 'GET',
      path: '/tasks/sync',
      handler: 'task.sync',
    },
  ],
};
