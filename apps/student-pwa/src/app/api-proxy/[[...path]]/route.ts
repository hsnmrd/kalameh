import { type NextRequest, NextResponse } from "next/server"

const getBackendUrl = () =>
  (process.env.INTERNAL_API_URL || "http://127.0.0.1:8000").replace(/\/+$/, "")

async function handleProxy(
  request: NextRequest,
  context: { params: Promise<{ path?: string[] }> }
) {
  const { path = [] } = await context.params
  const targetPath = path.join("/")
  const backendBase = getBackendUrl()
  const targetUrl = targetPath
    ? `${backendBase}/${targetPath}${request.nextUrl.search}`
    : `${backendBase}${request.nextUrl.search}`

  const headers = new Headers(request.headers)
  headers.delete("host")
  headers.delete("connection")
  headers.delete("content-length")

  const reqInit: RequestInit = {
    method: request.method,
    headers,
    redirect: "manual",
  }

  if (request.method !== "GET" && request.method !== "HEAD") {
    const blob = await request.blob()
    if (blob.size > 0) {
      reqInit.body = blob
    }
  }

  const response = await fetch(targetUrl, reqInit)

  const resHeaders = new Headers(response.headers)
  resHeaders.delete("content-encoding")
  resHeaders.delete("content-length")
  resHeaders.delete("set-cookie")

  const setCookies =
    typeof response.headers.getSetCookie === "function"
      ? response.headers.getSetCookie()
      : response.headers.get("set-cookie")
        ? [response.headers.get("set-cookie")!]
        : []

  const responseBody =
    response.status === 204 || response.status === 304 ? null : response.body

  const nextResponse = new NextResponse(responseBody, {
    status: response.status,
    statusText: response.statusText,
    headers: resHeaders,
  })

  for (const cookie of setCookies) {
    // Strip upstream Domain attribute so cookie binds directly to frontend origin
    const cleanCookie = cookie.replace(/;\s*Domain=[^;]+/gi, "")
    nextResponse.headers.append("set-cookie", cleanCookie)
  }

  return nextResponse
}

export const GET = handleProxy
export const POST = handleProxy
export const PUT = handleProxy
export const PATCH = handleProxy
export const DELETE = handleProxy
export const HEAD = handleProxy
