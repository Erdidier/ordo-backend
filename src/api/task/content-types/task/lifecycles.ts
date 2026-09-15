'use strict';

import { errors } from '@strapi/utils';
import { Core } from '@strapi/strapi';

const { ForbiddenError, ValidationError } = errors;

function getAuthenticatedUser(strapi: Core.Strapi) {
  const requestContext = strapi.requestContext.get();

  return requestContext?.state?.user ?? null;
}

function extractTagIds(tagsInput) {
  if (!tagsInput) return [];

  if (Array.isArray(tagsInput))
    return tagsInput.map((t) => (typeof t === 'object' ? t.id : t));

  if (tagsInput.set) return tagsInput.set.map((t) => t?.id ?? t);

  if (tagsInput.connect) return tagsInput.connect.map((t) => t?.id ?? t);

  return [];
}

module.exports = {
  async beforeFindMany(event) {
    const user = getAuthenticatedUser(strapi);

    if (!user) return;

    event.params.filters = {
      $and: [event.params.filters ?? {}, { owner: user.id }],
    };
  },
  async beforeFindOne(event) {
    const user = getAuthenticatedUser(strapi);

    if (!user) return;

    event.params.filters = {
      $and: [event.params.filters ?? {}, { owned: user.id }],
    };
  },
  async beforeCreate(event) {
    const user = getAuthenticatedUser(strapi);

    if (!user) {
      throw new ForbiddenError(
        'Se requiere un usuario autenticado para crear tareas'
      );
    }

    event.params.data.owner = user.id;

    const tagIds = extractTagIds(event.params.data.tags);

    if (tagIds.length) {
      const count = await strapi.db.query('api::tag.tag').count({
        where: { id: { $in: tagIds }, owner: user.id },
      });

      if (count !== tagIds.length) {
        throw new ForbiddenError('Una o más etiquetas no te pertenecen');
      }
    }

    validateReminderRules(event.params.data);
    applyCompletionRules(event.params.data, {});
  },
  async beforeUpdate(event) {
    const user = getAuthenticatedUser(strapi);

    if (!user) return;

    delete event.params.data.owner;

    const tagIds = extractTagIds(event.params.data.tags);

    if (tagIds.length) {
      const count = await strapi.db.query('api::tag.tag').count({
        where: { id: { $in: tagIds }, owner: user.id },
      });

      if (count !== tagIds.length) {
        throw new ForbiddenError('Una o más etiquetas no te pertenecen');
      }
    }

    event.params.where = {
      $and: [event.params.where ?? {}, { owner: user.id }],
    };

    const existing = await strapi.db.query('api::task.task').findOne({
      where: event.params.where,
    });

    if (!existing) {
      throw new ForbiddenError('No tienes permiso para modificar esta tarea');
    }

    validateReminderRules({ ...existing, ...event.params.data });
    applyCompletionRules(event.params.data, existing);
  },
  async beforeDelete(event) {
    const user = getAuthenticatedUser(strapi);

    if (!user) return;

    event.params.where = {
      $and: [event.params.where ?? {}, { owner: user.id }],
    };
  },
};

function validateReminderRules(data) {
  if (data.reminderEnabled) {
    if (!data.dueAt) {
      throw new ValidationError(
        'No se puede activar un recordatorio sin fecha límite'
      );
    }

    if (!data.reminderOffsetMinutes || data.reminderOffsetMinutes <= 0) {
      throw new ValidationError(
        'Debes indicar un tiempo de recordatorio válido'
      );
    }
  }

  if (data.reminderEnabled === false) {
    data.reminderOffsetMinutes = null;
    data.reminderSentAt = null;
  }
}

function applyCompletionRules(data, existing) {
  if (data.status === 'completed' && existing.status !== 'completed') {
    data.completedAt = new Date().toISOString();
  }

  if (data.status && data.status !== 'completed') {
    data.completedAt = null;
  }
}
