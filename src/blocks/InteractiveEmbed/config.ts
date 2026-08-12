import type { Block } from 'payload'

import { validateInteractiveArtifactURL } from '@/utilities/interactiveArtifactURL'

export const InteractiveEmbed: Block = {
  slug: 'interactiveEmbed',
  interfaceName: 'InteractiveEmbedBlock',
  labels: {
    plural: 'Interactive embeds',
    singular: 'Interactive embed',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      admin: {
        description: 'Accessible title describing the interactive artifact.',
      },
      required: true,
    },
    {
      name: 'url',
      type: 'text',
      admin: {
        description: 'HTTPS URL from the approved RaidGuild artifact host.',
      },
      required: true,
      validate: validateInteractiveArtifactURL,
    },
    {
      name: 'caption',
      type: 'textarea',
    },
    {
      name: 'height',
      type: 'number',
      admin: {
        description: 'Iframe height in pixels (320–1200).',
      },
      defaultValue: 640,
      max: 1200,
      min: 320,
      required: true,
    },
    {
      name: 'previewImage',
      type: 'upload',
      admin: {
        description: 'Optional static fallback for email and other non-interactive surfaces.',
      },
      relationTo: 'media',
    },
    {
      name: 'showOpenLink',
      type: 'checkbox',
      defaultValue: true,
      label: 'Show “Open interactive” link',
    },
  ],
}
