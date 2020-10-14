export enum Inputs {
  UploadUrl = 'upload-url',
  Path = 'path',
  AssetName = 'asset-name',
  AssetContentType = 'asset-content-type',
  IfNoFilesFound = 'if-no-files-found',

  OldUploadUrl = 'upload_url',
  OldAssetPath = 'asset_path',
  OldAssetName = 'asset_name',
  OldAssetContentType = 'asset_content_type'
}

export enum NoFileOptions {
  /**
   * Default. Output a warning but do not fail the action
   */
  warn = 'warn',

  /**
   * Fail the action with an error message
   */
  error = 'error',

  /**
   * Do not output any warnings or errors, the action does not fail
   */
  ignore = 'ignore'
}
