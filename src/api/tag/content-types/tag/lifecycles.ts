'use strict';

import { errors } from '@strapi/utils';
import { Core } from '@strapi/strapi';

const { ForbiddenError, ValidationError } = errors;

function getAuthenticatedUser(strapi: Core.Strapi) {
  const requestContext = strapi.requestContext.get();

  return requestContext?.state?.user || null;
}

module.exports = {
  async beforeFindMany(event) {
    const user = getAuthenticatedUser(strapi);

    if (!user) return;

    event.params.filters = {
      $and: [event.params.filters ?? {}, { owner: user.id }],
    };
  },
  async beforeCreate(event) {
    const user = getAuthenticatedUser(strapi);

    if (!user) {
      throw new ForbiddenError('Se requiere un usuario autenticado');
    }

    event.params.data.owner = user.id;

    await assertNameNotTaken(user.id, event.params.data.name);
  },
  async beforeUpdate(event) {
    const user = getAuthenticatedUser(strapi);

    if (!user) return;

    delete event.params.data.owner;

    event.params.where = {
      $and: [event.params.where ?? {}, { owner: user.id }],
    };

    if (event.params.data.name) {
      const existing = await strapi.db.query('api::tag.tag').findOne({
        where: event.params.where,
      });

      await assertNameNotTaken(user.id, event.params.data.name, existing?.id);
    }
  },
};

async function assertNameNotTaken(userId, name, excludeId = null) {
  const duplicate = await strapi.db.query('api::tag.tag').findOne({
    where: {
      owner: userId,
      name,
      ...(excludeId ? { id: { $ne: excludeId } } : {}),
    },
  });

  if (duplicate) {
    throw new ValidationError('Ya tienes una etiqueta con ese nombre');
  }
}
