import { useState } from 'react'
import { TabList, Tab, Text, Title } from '@tremor/react'

export type UsageType = 'js' | 'nextjs' | 'badge'

type Props = {
  currentHost: string
}

const getJsSnippet = (currentHost: string) => `
!function(e,n,t){e.onload=function(){
let e=n.createElement("script");
e.src=t,n.body.appendChild(e)}}
(window,document,"//${currentHost}/pageview.js");
`

export const Usage = ({ currentHost }: Props) => {
  const [tab, setTab] = useState<UsageType>('js')

  return (
    <>
      <TabList
        defaultValue="1"
        onValueChange={(value) => setTab(value as UsageType)}
      >
        <Tab value="js" text="JS" />
        <Tab value="nextjs" text="Next.js" />
        <Tab value="badge" text="Badge" />
      </TabList>

      {tab === 'js' && (
        <div className="mt-6">
          <Text>
            In your <code>HTML</code>
          </Text>
          <pre>{`<script>${getJsSnippet(currentHost)}</script>`}</pre>
        </div>
      )}

      {tab === 'nextjs' && (
        <div className="mt-6">
          <Text>
            In your <code>_app.tsx</code>
          </Text>
          <pre>
            {`
import Script from 'next/script'

<Script id='pageview' strategy='afterInteractive'>
\{\`${getJsSnippet(currentHost)}\`\}
</Script>
          `}
          </pre>
        </div>
      )}

      {tab === 'badge' && (
        <>
          <div className="mt-6">
            <Title>URL</Title>
            <Text>{`https://${currentHost}/api/badge?url=<url>`}</Text>
          </div>
          <div className="mt-6">
            <Title>HTML</Title>
            <Text className="prose">{`<img src="https://${currentHost}/api/badge?url=<url>" />`}</Text>
          </div>
          <div className="mt-6">
            <Title>Markdown</Title>
            <Text>
              [PageView]({`https://${currentHost}/api/badge?url=<url>`})
            </Text>
          </div>
        </>
      )}
    </>
  )
}
