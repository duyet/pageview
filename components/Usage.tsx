import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

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
  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">Integration Examples</h3>

      <Tabs defaultValue="js" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="js">JavaScript</TabsTrigger>
          <TabsTrigger value="nextjs">Next.js</TabsTrigger>
          <TabsTrigger value="badge">Badge</TabsTrigger>
        </TabsList>

        <TabsContent value="js" className="mt-6">
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-2">
                Add this script to your{' '}
                <code className="bg-muted px-1 py-0.5 rounded text-sm">
                  HTML
                </code>
              </p>
              <div className="rounded-md bg-muted p-4 font-mono text-sm overflow-x-auto">
                <pre>{`<script>${getJsSnippet(currentHost)}</script>`}</pre>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="nextjs" className="mt-6">
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-2">
                Add this to your{' '}
                <code className="bg-muted px-1 py-0.5 rounded text-sm">
                  _app.tsx
                </code>
              </p>
              <div className="rounded-md bg-muted p-4 font-mono text-sm overflow-x-auto">
                <pre>{`import Script from 'next/script'

<Script id='pageview' strategy='afterInteractive'>
  {\`${getJsSnippet(currentHost)}\`}
</Script>`}</pre>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="badge" className="mt-6">
          <div className="space-y-6">
            <div>
              <h4 className="font-medium mb-2">URL</h4>
              <div className="rounded-md bg-muted p-4 font-mono text-sm">
                {`https://${currentHost}/api/badge?url=<url>`}
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-2">HTML</h4>
              <div className="rounded-md bg-muted p-4 font-mono text-sm">
                {`<img src="https://${currentHost}/api/badge?url=<url>" />`}
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-2">Markdown</h4>
              <div className="rounded-md bg-muted p-4 font-mono text-sm">
                {`![PageView](https://${currentHost}/api/badge?url=<url>)`}
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
