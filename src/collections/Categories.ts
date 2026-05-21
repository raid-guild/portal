import type { CollectionConfig } from 'payload'

import { anyone } from '../access/anyone'
import { contentEditors, hideFromNonEditors } from '@/access/roles'

export const Categories: CollectionConfig = {
  slug: 'categories',
  access: {
    create: contentEditors,
    delete: contentEditors,
    read: anyone,
    update: contentEditors,
  },
  admin: {
    hidden: hideFromNonEditors,
    useAsTitle: 'title',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
  ],
}
