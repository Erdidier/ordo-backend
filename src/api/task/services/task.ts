'use strict';

import { errors } from '@strapi/utils';
import { factories, Data } from '@strapi/strapi';

const { NotFoundError, ForbiddenError, ValidationError } = errors;

type Task = Data.ContentType<'api::task.task'>;

module.exports = factories.createCoreService(
  'api::task.task',
  ({ strapi }) => ({
    async createForUser(userId: string, data: Task) {
      this.assertOwnershipOfTags(data.tags, userId);

      const payload = this.applyBusinessRules(data);
      payload.owner = userId;

      return strapi.documents('api::task.task').create({
        data: payload,
        populate: ['images', 'tags', 'owner'],
      });
    },
    async updateForUser(
      documentId: Data.DocumentID,
      userId: string,
      data: Task
    ) {
      const existing = await this.findOwnedOrThrow(documentId, userId);

      if (data?.tags) {
        this.assertOwnershipOfTags(data.tags, userId);
      }

      delete data.owner;

      const payload = this.applyBusinessRules(data, existing);

      return strapi.documents('api::task.task').update({
        documentId: existing.id,
        data: payload,
        populate: ['images', 'tags', 'owner'],
      });
    },
    async deleteForUser(documentId: Data.DocumentID, userId: string) {
      const existing = await this.findOwnedOrThrow(documentId, userId);

      return strapi.documents('api::task.task').delete({
        documentId: existing.id,
      });
    },
    async findOwnedOrThrow(documentId: Data.DocumentID, userId: string) {
      const task = await strapi.db.query('api::task.task').findOne({
        where: { documentId, owner: userId },
      });

      if (!task) {
        throw new NotFoundError('Tarea no encontrada');
      }

      return task;
    },
    async assertOwnershipOfTags(tagIds: Array<string> = [], userId: string) {
      if (!tagIds || tagIds.length === 0) return;

      const count = await strapi.db.query('api::tag.tag').count({
        where: { id: { $in: tagIds }, owner: userId },
      });

      if (count !== tagIds.length) {
        throw new ForbiddenError('Una o más etiquetas no te pertenecen');
      }
    },
    applyBusinessRules(data: Task, existing = {}) {
      const merged = { ...existing, ...data };

      if (data.status === 'completed' && existing.status !== 'completed') {
        data.completedAt = new Date().toISOString();
      }

      if (data.status && data.status !== 'completed') {
        data.completedAt = null;
      }

      if (merged.reminderEnabled) {
        if (!merged.dueAt) {
          throw new ValidationError(
            'No se puede activar un recordatorio sin fecha límite'
          );
        }

        if (
          !merged.reminderOffsetMinutes ||
          merged.reminderOffsetMinutes <= 0
        ) {
          throw new ValidationError(
            'Debes indicar un tiempo de recordatorio válido'
          );
        }
      } else if (data.reminderEnabled === false) {
        data.reminderOffsetMinutes = null;
        data.reminderSentAt = null;
      }

      return data;
    },
  })
);
