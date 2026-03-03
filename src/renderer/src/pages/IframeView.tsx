import { Button } from 'antd'
import { useEffect, useState } from 'react'
import { useLocation } from 'react-router'

export default function IframeView() {
  const location = useLocation()
  const [url, setUrl] = useState<string | null>(null)

  useEffect(() => {
    // Parse query string from URL
    const searchParams = new URLSearchParams(location.search)
    const targetUrl = searchParams.get('url')
    
    if (targetUrl) {
      setUrl(targetUrl)
    }
  }, [location])

  if (!url) {
    return (
      <div className="flex items-center justify-center h-screen w-full bg-gray-100">
        <h2 className="text-xl text-gray-600">No URL provided</h2>
      </div>
    )
  }

  return (
    <div className="w-full h-screen overflow-hidden">
      <iframe
        src={url}
        className="w-full h-full border"
        title="Embedded View"
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
      />
    </div>
  )
}
