'use strict';

import { factories } from '@strapi/strapi';

module.exports = factories.createCoreService('api::tag.tag', ({ strapi }) => ({
  async createForUser(userId, data) {
    await this.assertNameNotTaken(userId, data.name);

    return strapi.documents('api::tag.tag').create({
      data: { ...data, owner: userId },
    });
  },
  async assertNameNotTaken(userId, name, excludeId = null) {
    const existing = await strapi.db.query('api::tag.tag').findOne({
      where: {
        owner: userId,
        name,
        ...(excludeId ? { id: { $ne: excludeId } } : {}),
      },
    });

    if (existing) {
      throw new Error('Ya tienes una etiqueta con ese nombre');
    }
  },
}));
