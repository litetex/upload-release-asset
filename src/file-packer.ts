import { SearchResult } from './search';
import * as core from '@actions/core'
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import * as archiver from 'archiver';

export interface PackFileResult {
    path: string,
    size: number
}

export interface ReleaseAssetFilePackerOptions {
    baseTmpDir?: string
}

export class ReleaseAssetFilePacker {

    options: ReleaseAssetFilePackerOptions

    tmpDirToUse: string

    /**
     * Constructs a ReleaseAssetFilePacker
     */
    static create(
        options?: ReleaseAssetFilePackerOptions
    ): ReleaseAssetFilePacker 
    {
        return new ReleaseAssetFilePacker(options)
    }

    constructor(
        options?: ReleaseAssetFilePackerOptions
    ) 
    {
        this.options = options || {};

        // If tmpdir is set use the
        this.tmpDirToUse = fs.mkdtempSync(path.join(this.options.baseTmpDir || os.tmpdir(), 'releaseAssetFilePacker-'))
        
        core.debug(`Will use ${this.tmpDirToUse} as temporay directory`);
    }
  
    async packZipFile(
        searchResult: SearchResult,
        zipFileName: string,
    ) : Promise<PackFileResult>
    {
        const archive = archiver.create('zip')
        const stream = fs.createWriteStream(path.join(this.tmpDirToUse, zipFileName))

        return new Promise((resolve, reject) => {

        });
    }
}