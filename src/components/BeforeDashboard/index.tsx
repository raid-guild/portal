import { Banner } from '@payloadcms/ui/elements/Banner'
import React from 'react'

import { isAdminSeedActionAllowed } from '@/utilities/adminSeed'
import { SeedButton } from './SeedButton'
import './index.scss'

const baseClass = 'before-dashboard'

const BeforeDashboard: React.FC = () => {
  const showSeedAction = isAdminSeedActionAllowed()

  return (
    <div className={baseClass}>
      <Banner className={`${baseClass}__banner`} type="success">
        <h4>RaidGuild Portal dashboard</h4>
      </Banner>
      {showSeedAction ? (
        <>
          <p>
            Use the seed action to upsert portal starter content: posts, projects, threads,
            sessions, activity, skills, and RaidGuild roles.
          </p>
          <p>
            <SeedButton />
            {' then '}
            <a href="/" rel="noopener noreferrer" target="_blank">
              visit the portal
            </a>
            {' to review the results.'}
          </p>
        </>
      ) : (
        <p>
          Production seed actions are disabled. Use the CMS collections to manage live content, or{' '}
          <a href="/" rel="noopener noreferrer" target="_blank">
            visit the portal
          </a>
          .
        </p>
      )}
    </div>
  )
}

export default BeforeDashboard
