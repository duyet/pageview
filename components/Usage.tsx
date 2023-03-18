import { useState } from 'react'
import { TabList, Tab, Text, Title } from '@tremor/react'

export type UsageType = 'js' | 'nextjs' | 'badge'

type Props = {
  currentHost: string
}

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
        <pre>
          {`
<script>
!(function(d,src){let s=d.createElement('script');
s.src=src;d.body.appendChild(s)})(document,'//${currentHost}/pageview.js')
</script>
          `}
        </pre>
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
  \{\`
    !(function(d,src){let s=d.createElement('script');
    s.src=src;d.body.appendChild(s)})(document,'//${currentHost}/pageview.js')
  \`\}
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
