import {NoFileOptions} from './constants'

export interface UploadInputs {
  /**
   * The URL for uploading assets to the release
   */
  uploadUrl: string

  /**
   * The search path used to describe what to upload as part of the asset
   */
  searchPath: string

  /**
   * The name of the asset you want to upload
   */
  assetName: string

  /**
   * The content-type of the asset you want to upload. 
   * See the supported Media Types here: 
   * https://www.iana.org/assignments/media-types/media-types.xhtml 
   * for more information
   */
  assetContentType: string

  /**
   * The desired behavior if no files are found with the provided search path
   */
  ifNoFilesFound: NoFileOptions
}
