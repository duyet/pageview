import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'

export type UsageType = 'js' | 'nextjs' | 'api' | 'curl' | 'python' | 'badge'

type Props = {
  currentHost: string
}

const getJsSnippet = (currentHost: string) => `
!function(e,n,t){e.onload=function(){
let e=n.createElement("script");
e.src=t,n.body.appendChild(e)}}
(window,document,"//${currentHost}/pageview.js");
`

const getCurlSimple = (currentHost: string) => `curl -X POST https://${currentHost}/api/pageview \\
  -H "Content-Type: application/json" \\
  -d '{"url": "https://example.com/page"}'`

const getCurlFull = (currentHost: string) => `curl -X POST https://${currentHost}/api/pageview \\
  -H "Content-Type: application/json" \\
  -d '{
    "url": "https://example.com/page",
    "ua": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)...",
    "browser": "Chrome",
    "browserVersion": "120.0.0",
    "os": "Windows",
    "osVersion": "10",
    "country": "US",
    "city": "San Francisco",
    "ip": "1.2.3.4"
  }'`

const getPythonSimple = (currentHost: string) => `import requests

url = "https://${currentHost}/api/pageview"
data = {"url": "https://example.com/page"}

response = requests.post(url, json=data)
print(response.json())`

const getPythonFull = (currentHost: string) => `import requests

url = "https://${currentHost}/api/pageview"
data = {
    "url": "https://example.com/page",
    "ua": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)...",
    "browser": "Chrome",
    "browserVersion": "120.0.0",
    "os": "Windows",
    "osVersion": "10",
    "country": "US",
    "city": "San Francisco",
    "ip": "1.2.3.4"
}

response = requests.post(url, json=data)
print(response.json())  # {'msg': 'Pageview recorded successfully', 'id': 123}`

const getJavaScriptAPI = (currentHost: string) => `// Simple version (auto-detect from browser)
fetch('https://${currentHost}/api/pageview', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    url: window.location.href
  })
})

// Full version (custom data)
fetch('https://${currentHost}/api/pageview', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    url: 'https://example.com/page',
    ua: navigator.userAgent,
    browser: 'Chrome',
    browserVersion: '120.0.0',
    os: 'Windows',
    osVersion: '10',
    country: 'US',
    city: 'San Francisco'
  })
})`

export const Usage = ({ currentHost }: Props) => {
  return (
    <div>
      <Tabs defaultValue="js" className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="js">Script</TabsTrigger>
          <TabsTrigger value="nextjs">Next.js</TabsTrigger>
          <TabsTrigger value="api">API</TabsTrigger>
          <TabsTrigger value="curl">cURL</TabsTrigger>
          <TabsTrigger value="python">Python</TabsTrigger>
          <TabsTrigger value="badge">Badge</TabsTrigger>
        </TabsList>

        <TabsContent value="js" className="mt-6">
          <div className="space-y-4">
            <div>
              <p className="mb-2 text-sm text-muted-foreground">
                Add this script to your{' '}
                <code className="rounded bg-muted px-1 py-0.5 text-sm">
                  HTML
                </code>
              </p>
              <div className="overflow-x-auto rounded-md bg-muted p-4 font-mono text-sm">
                <pre>{`<script>${getJsSnippet(currentHost)}</script>`}</pre>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="nextjs" className="mt-6">
          <div className="space-y-4">
            <div>
              <p className="mb-2 text-sm text-muted-foreground">
                Add this to your{' '}
                <code className="rounded bg-muted px-1 py-0.5 text-sm">
                  _app.tsx
                </code>
              </p>
              <div className="overflow-x-auto rounded-md bg-muted p-4 font-mono text-sm">
                <pre>{`import Script from 'next/script'

<Script id='pageview' strategy='afterInteractive'>
  {\`${getJsSnippet(currentHost)}\`}
</Script>`}</pre>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="api" className="mt-6">
          <div className="space-y-4">
            <div>
              <p className="mb-2 text-sm text-muted-foreground">
                Use JavaScript Fetch API for custom tracking
              </p>
              <div className="overflow-x-auto rounded-md bg-muted p-4 font-mono text-sm">
                <pre className="whitespace-pre-wrap">
                  {getJavaScriptAPI(currentHost)}
                </pre>
              </div>
            </div>
            <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-700 dark:bg-neutral-800/50">
              <h4 className="mb-2 text-sm font-medium">API Response</h4>
              <div className="font-mono text-xs">
                {`{"msg": "Pageview recorded successfully", "id": 123}`}
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="curl" className="mt-6">
          <div className="space-y-6">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <h4 className="font-medium">Simple (Auto-detect)</h4>
                <Badge variant="secondary" className="text-xs">
                  Recommended
                </Badge>
              </div>
              <p className="mb-2 text-sm text-muted-foreground">
                Send just the URL - server auto-detects UA and geo data
              </p>
              <div className="overflow-x-auto rounded-md bg-muted p-4 font-mono text-sm">
                <pre className="whitespace-pre-wrap">
                  {getCurlSimple(currentHost)}
                </pre>
              </div>
            </div>

            <div>
              <h4 className="mb-2 font-medium">Full Control</h4>
              <p className="mb-2 text-sm text-muted-foreground">
                Override all fields with custom data
              </p>
              <div className="overflow-x-auto rounded-md bg-muted p-4 font-mono text-sm">
                <pre className="whitespace-pre-wrap">
                  {getCurlFull(currentHost)}
                </pre>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="python" className="mt-6">
          <div className="space-y-6">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <h4 className="font-medium">Simple Version</h4>
                <Badge variant="secondary" className="text-xs">
                  Recommended
                </Badge>
              </div>
              <p className="mb-2 text-sm text-muted-foreground">
                Basic pageview tracking
              </p>
              <div className="overflow-x-auto rounded-md bg-muted p-4 font-mono text-sm">
                <pre className="whitespace-pre-wrap">
                  {getPythonSimple(currentHost)}
                </pre>
              </div>
            </div>

            <div>
              <h4 className="mb-2 font-medium">Full Control</h4>
              <p className="mb-2 text-sm text-muted-foreground">
                Send custom user agent and geo data
              </p>
              <div className="overflow-x-auto rounded-md bg-muted p-4 font-mono text-sm">
                <pre className="whitespace-pre-wrap">
                  {getPythonFull(currentHost)}
                </pre>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="badge" className="mt-6">
          <div className="space-y-6">
            <div>
              <h4 className="mb-2 font-medium">URL</h4>
              <div className="rounded-md bg-muted p-4 font-mono text-sm">
                {`https://${currentHost}/api/badge?url=<url>`}
              </div>
            </div>

            <div>
              <h4 className="mb-2 font-medium">HTML</h4>
              <div className="rounded-md bg-muted p-4 font-mono text-sm">
                {`<img src="https://${currentHost}/api/badge?url=<url>" />`}
              </div>
            </div>

            <div>
              <h4 className="mb-2 font-medium">Markdown</h4>
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
