import {debug, info, warning} from '@actions/core'
import {promises as fs} from 'fs'
import {HttpCodes, HttpClient} from '@actions/http-client'
import {BearerCredentialHandler} from '@actions/http-client/auth'
import {IHeaders, IHttpClientResponse} from '@actions/http-client/interfaces'
import {IncomingHttpHeaders} from 'http'
import {
  getRuntimeToken,
  getRuntimeUrl,
  getWorkFlowRunId,
  getRetryMultiplier,
  getInitialRetryIntervalInMilliseconds
} from './config-variables'

/**
 * Returns a retry time in milliseconds that exponentially gets larger
 * depending on the amount of retries that have been attempted
 */
export function getExponentialRetryTimeInMilliseconds(
  retryCount: number
): number {
  if (retryCount < 0) {
    throw new Error('RetryCount should not be negative')
  } else if (retryCount === 0) {
    return getInitialRetryIntervalInMilliseconds()
  }

  const minTime =
    getInitialRetryIntervalInMilliseconds() * getRetryMultiplier() * retryCount
  const maxTime = minTime * getRetryMultiplier()

  // returns a random number between the minTime (inclusive) and the maxTime (exclusive)
  return Math.random() * (maxTime - minTime) + minTime
}

/**
 * Parses a env variable that is a number
 */
export function parseEnvNumber(key: string): number | undefined {
  const value = Number(process.env[key])
  if (Number.isNaN(value) || value < 0) {
    return undefined
  }
  return value
}

/**
 * Various utility functions to help with the necessary API calls
 */
export function getApiVersion(): string {
  return '6.0-preview'
}

export function isSuccessStatusCode(statusCode?: number): boolean {
  if (!statusCode) {
    return false
  }
  return statusCode >= 200 && statusCode < 300
}

export function isForbiddenStatusCode(statusCode?: number): boolean {
  if (!statusCode) {
    return false
  }
  return statusCode === HttpCodes.Forbidden
}

export function isRetryableStatusCode(statusCode?: number): boolean {
  if (!statusCode) {
    return false
  }

  const retryableStatusCodes = [
    HttpCodes.BadGateway,
    HttpCodes.ServiceUnavailable,
    HttpCodes.GatewayTimeout,
    HttpCodes.TooManyRequests,
    413 // Payload Too Large
  ]
  return retryableStatusCodes.includes(statusCode)
}

export function isThrottledStatusCode(statusCode?: number): boolean {
  if (!statusCode) {
    return false
  }
  return statusCode === HttpCodes.TooManyRequests
}

/**
 * Attempts to get the retry-after value from a set of http headers. The retry time
 * is originally denoted in seconds, so if present, it is converted to milliseconds
 * @param headers all the headers received when making an http call
 */
export function tryGetRetryAfterValueTimeInMilliseconds(
  headers: IncomingHttpHeaders
): number | undefined {
  if (headers['retry-after']) {
    const retryTime = Number(headers['retry-after'])
    if (!isNaN(retryTime)) {
      info(`Retry-After header is present with a value of ${retryTime}`)
      return retryTime * 1000
    }
    info(
      `Returned retry-after header value: ${retryTime} is non-numeric and cannot be used`
    )
    return undefined
  }
  info(
    `No retry-after header was found. Dumping all headers for diagnostic purposes`
  )
  // eslint-disable-next-line no-console
  console.log(headers)
  return undefined
}

export function getContentRange(
  start: number,
  end: number,
  total: number
): string {
  // Format: `bytes start-end/fileSize
  // start and end are inclusive
  // For a 200 byte chunk starting at byte 0:
  // Content-Range: bytes 0-199/200
  return `bytes ${start}-${end}/${total}`
}

/**
 * Sets all the necessary headers when uploading an artifact
 * @param {string} contentType the type of content being uploaded
 * @param {boolean} isKeepAlive is the same connection being used to make multiple calls
 * @param {boolean} isGzip is the connection being used to upload GZip compressed content
 * @param {number} uncompressedLength the original size of the content if something is being uploaded that has been compressed
 * @param {number} contentLength the length of the content that is being uploaded
 * @param {string} contentRange the range of the content that is being uploaded
 * @returns appropriate headers to make a specific http call during artifact upload
 */
export function getUploadHeaders(
  contentType: string,
  isKeepAlive?: boolean,
  isGzip?: boolean,
  uncompressedLength?: number,
  contentLength?: number,
  contentRange?: string
): IHeaders {
  const requestOptions: IHeaders = {}
  requestOptions['Accept'] = `application/json;api-version=${getApiVersion()}`
  if (contentType) {
    requestOptions['Content-Type'] = contentType
  }
  if (isKeepAlive) {
    requestOptions['Connection'] = 'Keep-Alive'
    // keep alive for at least 10 seconds before closing the connection
    requestOptions['Keep-Alive'] = '10'
  }
  if (isGzip) {
    requestOptions['Content-Encoding'] = 'gzip'
    requestOptions['x-tfs-filelength'] = uncompressedLength
  }
  if (contentLength) {
    requestOptions['Content-Length'] = contentLength
  }
  if (contentRange) {
    requestOptions['Content-Range'] = contentRange
  }

  return requestOptions
}

export function createHttpClient(userAgent: string): HttpClient {
  return new HttpClient(userAgent, [
    new BearerCredentialHandler(getRuntimeToken())
  ])
}


/**
 * Uh oh! Something might have gone wrong during either upload or download. The IHtttpClientResponse object contains information
 * about the http call that was made by the actions http client. This information might be useful to display for diagnostic purposes, but
 * this entire object is really big and most of the information is not really useful. This function takes the response object and displays only
 * the information that we want.
 *
 * Certain information such as the TLSSocket and the Readable state are not really useful for diagnostic purposes so they can be avoided.
 * Other information such as the headers, the response code and message might be useful, so this is displayed.
 */
export function displayHttpDiagnostics(response: IHttpClientResponse): void {
  info(
    `##### Begin Diagnostic HTTP information #####
Status Code: ${response.message.statusCode}
Status Message: ${response.message.statusMessage}
Header Information: ${JSON.stringify(response.message.headers, undefined, 2)}
###### End Diagnostic HTTP information ######`
  )
}

/**
 * Invalid characters that cannot be in the release-asset name or an uploaded file. Will be rejected
 * from the server if attempted to be sent over. These characters are not allowed due to limitations with certain
 * file systems such as NTFS. To maintain platform-agnostic behavior, all characters that are not supported by an
 * individual filesystem/platform will not be supported on all fileSystems/platforms
 *
 * FilePaths can include characters such as \ and / which are not permitted in the release-asset name alone
 */
const invalidReleaseAssetFilePathCharacters = ['"', ':', '<', '>', '|', '*', '?']
const invalidReleaseAssetNameCharacters = [
  ...invalidReleaseAssetFilePathCharacters,
  '\\',
  '/'
]

/**
 * Scans the name of the release-asset to make sure there are no illegal characters
 */
export function checkReleaseAssetName(name: string): void {
  if (!name) {
    throw new Error(`Release-Asset name: ${name}, is incorrectly provided`)
  }

  for (const invalidChar of invalidReleaseAssetNameCharacters) {
    if (name.includes(invalidChar)) {
      throw new Error(
        `Release-Asset name is not valid: ${name}. Contains character: "${invalidChar}". Invalid artifact name characters include: ${invalidReleaseAssetNameCharacters.toString()}.`
      )
    }
  }
}

/**
 * Scans the name of the filePath used to make sure there are no illegal characters
 */
export function checkReleaseAssetFilePath(path: string): void {
  if (!path) {
    throw new Error(`Release-Asset path: ${path}, is incorrectly provided`)
  }

  for (const invalidChar of invalidReleaseAssetFilePathCharacters) {
    if (path.includes(invalidChar)) {
      throw new Error(
        `Release-Asset path is not valid: ${path}. Contains character: "${invalidChar}". Invalid characters include: ${invalidReleaseAssetFilePathCharacters.toString()}.`
      )
    }
  }
}
