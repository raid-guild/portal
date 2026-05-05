import { Banner } from '@payloadcms/ui/elements/Banner'
import React from 'react'

import { SeedButton } from './SeedButton'
import './index.scss'

const baseClass = 'before-dashboard'

const BeforeDashboard: React.FC = () => {
  return (
    <div className={baseClass}>
      <Banner className={`${baseClass}__banner`} type="success">
        <h4>RaidGuild Portal dashboard</h4>
      </Banner>
      <p>
        Use the seed action to load the portal demo content: landing page, posts, projects, profile
        skills, and RaidGuild roles.
      </p>
      <p>
        <SeedButton />
        {' then '}
        <a href="/" rel="noopener noreferrer" target="_blank">
          visit the portal
        </a>
        {' to review the results.'}
      </p>
    </div>
  )
}

export default BeforeDashboard
