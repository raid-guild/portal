// storage-adapter-import-placeholder
import { postgresAdapter } from '@payloadcms/db-postgres'
import { nodemailerAdapter } from '@payloadcms/email-nodemailer'

import sharp from 'sharp' // sharp-import
import { readFile } from 'fs/promises'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'

import { ActivityItems } from './collections/ActivityItems'
import { Badges } from './collections/Badges'
import { Categories } from './collections/Categories'
import { Comments } from './collections/Comments'
import { DailyBriefs } from './collections/DailyBriefs'
import { DailyEngagements } from './collections/DailyEngagements'
import { Events } from './collections/Events'
import { Media } from './collections/Media'
import { Pages } from './collections/Pages'
import { PointEvents } from './collections/PointEvents'
import { Profiles } from './collections/Profiles'
import { ProfileBadges } from './collections/ProfileBadges'
import { ProfileRoles } from './collections/ProfileRoles'
import { ProfileSkills } from './collections/ProfileSkills'
import { Projects } from './collections/Projects'
import { Posts } from './collections/Posts'
import { SponsorInquiries } from './collections/SponsorInquiries'
import { Threads } from './collections/Threads'
import { Users } from './collections/Users'
import { Footer } from './Footer/config'
import { Header } from './Header/config'
import { plugins } from './plugins'
import { defaultLexical } from '@/fields/defaultLexical'
import { getServerSideURL } from './utilities/getURL'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)
const rootDir = path.resolve(dirname, '..')
const portalMemoryPublisherSkillDir = path.resolve(
  rootDir,
  '.agents/skills/portal-memory-publisher',
)

export default buildConfig({
  admin: {
    components: {
      // The `BeforeLogin` component renders a message that you see while logging into your admin panel.
      // Feel free to delete this at any time. Simply remove the line below and the import `BeforeLogin` statement on line 15.
      beforeLogin: ['@/components/BeforeLogin'],
      // The `BeforeDashboard` component renders the 'welcome' block that you see after logging into your admin panel.
      // Feel free to delete this at any time. Simply remove the line below and the import `BeforeDashboard` statement on line 15.
      beforeDashboard: ['@/components/BeforeDashboard'],
      graphics: {
        Icon: '@/components/AdminGraphics/AdminIcon',
        Logo: '@/components/AdminGraphics/AdminLogo',
      },
    },
    importMap: {
      baseDir: path.resolve(dirname),
    },
    user: Users.slug,
    livePreview: {
      breakpoints: [
        {
          label: 'Mobile',
          name: 'mobile',
          width: 375,
          height: 667,
        },
        {
          label: 'Tablet',
          name: 'tablet',
          width: 768,
          height: 1024,
        },
        {
          label: 'Desktop',
          name: 'desktop',
          width: 1440,
          height: 900,
        },
      ],
    },
  },
  // This config helps us configure global or default features that the other editors can inherit
  editor: defaultLexical,
  email: process.env.SENDGRID_API_KEY
    ? nodemailerAdapter({
        defaultFromAddress: process.env.EMAIL_FROM_ADDRESS || 'noreply@raidguild.org',
        defaultFromName: process.env.EMAIL_FROM_NAME || 'RaidGuild Portal',
        transportOptions: {
          auth: {
            pass: process.env.SENDGRID_API_KEY,
            user: 'apikey',
          },
          host: 'smtp.sendgrid.net',
          port: 587,
          secure: false,
        },
      })
    : undefined,
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URI || '',
    },
  }),
  collections: [
    Pages,
    Posts,
    ActivityItems,
    DailyBriefs,
    DailyEngagements,
    Events,
    PointEvents,
    Projects,
    Threads,
    Badges,
    ProfileBadges,
    Profiles,
    ProfileSkills,
    ProfileRoles,
    SponsorInquiries,
    Media,
    Categories,
    Users,
    Comments,
  ],
  cors: [getServerSideURL()].filter(Boolean),
  globals: [Header, Footer],
  plugins: [
    ...plugins,
    // storage-adapter-placeholder
  ],
  endpoints: [
    {
      path: '/health',
      method: 'get',
      handler: async (req) => {
        return new Response('OK', { status: 200 })
      },
    },
    {
      path: '/portal/skills/portal-memory-publisher',
      method: 'get',
      handler: async () => {
        const [skill, modelReference, exampleMapping] = await Promise.all([
          readFile(path.join(portalMemoryPublisherSkillDir, 'SKILL.md'), 'utf8'),
          readFile(
            path.join(portalMemoryPublisherSkillDir, 'references/portal-cms-model.md'),
            'utf8',
          ),
          readFile(
            path.join(portalMemoryPublisherSkillDir, 'references/example-digest-mapping.md'),
            'utf8',
          ),
        ])

        return Response.json({
          name: 'portal-memory-publisher',
          version: '1',
          files: {
            'SKILL.md': skill,
            'references/portal-cms-model.md': modelReference,
            'references/example-digest-mapping.md': exampleMapping,
          },
        })
      },
    },
  ],
  secret: process.env.PAYLOAD_SECRET,
  sharp,
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
})
