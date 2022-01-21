/*
Iterate over Ring Doorbell video files in a directory and extract the timestamp from the lower right corner. Either copy or rename the files by that timestamp and write a CSV log file with timestamp information for the videos.

Timestamps are in lexicographic sort order.

Detective Robert Sirois/13025
robertsirois@elpasoco.com
El Paso County Sheriff's Office
27 East Vermijo Avenue, Colorado Springs, CO 80903
*/

const config = require('./config/config.json')

const fs = require('fs')
const fs_p = require( 'fs' ).promises
const p = require('upath')

const tesseract = require('node-tesseract-ocr')
const ffmpeg = require('ffmpeg')
const ffprobe = require('ffprobe')
const moment = require('moment')
const createCsvWriter = require('csv-writer').createObjectCsvWriter

const inDir = process.argv[2]
const outDir = process.argv[3]

async function processFile( file ) {
    const ext = p.extname(file)
    const name = p.basename(file, ext)
    const filePath = p.join(inDir, file)

    if (ext.toLowerCase() != config.ext) {
        const extErr = new Error(`Extension "${ ext }" does not match ${ config.ext }.`)
        throw extErr}

    let ffprobeInfo = false

    if (config.probe) {ffprobeInfo = await ffprobe(filePath,{path: config.ffprobe_path} )}

    const video = await new ffmpeg(filePath)

    video.addCommand('-r', 1 )// framerate
    video.addCommand('-frames', 1 )// number of frames to process
    video.addCommand('-filter:v', 'crop=300:50:in_w:in_h' )// apply a video filter: crop 300x50 area starting at extreme bottom right corner
    video.addCommand('-f', 'image2' )// output to image format
    video.addCommand('-y' )// overwrite output files

    const imgTempPath = p.join(__dirname, name)
    const ffmpegOutput = await video.save(imgTempPath)
    const text = await tesseract.recognize(ffmpegOutput, config.tesseract)
    let textTs = text.trim()

    // replace Ring timezone abbreviations with actual UTC offsets
    config.timezoneTranslations.forEach (( translation ) => {
        const regex = new RegExp(translation.abbr, 'g')

        textTs = textTs.replace(regex, translation.offset) })

    const ts = moment(textTs, 'MM/DD/YYYY HH:mm:ss ZZ' )// assumes local time

    let record ={
        file: filePath
      , startTime: ts.format('YYYY-MM-DD HH:mm:ss') }

    if (ffprobeInfo) {
        record.duration = ffprobeInfo.streams[0].duration
        record.endTime = ts.add( Math.round( ffprobeInfo.streams[0].duration ), 'seconds' ).format('YYYY-MM-DD HH:mm:ss') }

    // handle the actual renaming or copying of files
    let filename = `${ ts.format( 'YYYY-MM-DD HHmmss' ) }${ config.ext }`
    const sourceFile = p.join(inDir, file)

    if (filename == `Invalid date${ config.ext }`) {filename = `_INVALID DATE - ${ file }`}

    if (config.mode == 'copy') {fs_p.copyFile(sourceFile, p.join(outDir, filename) )}
    else if (config.mode == 'rename') {fs_p.rename(sourceFile, p.join(inDir, filename) )}

    fs_p.unlink(imgTempPath)

    return record}

{(async ()=>{
    // build output directory
    try {
        await fs_p.mkdir(outDir) }
    catch (err) {
        }// ignore

    try {
        const files = await fs_p.readdir(inDir)
        const results = await Promise.allSettled(files.map (async ( file ) => { return await processFile(file) }))

        // log on csv sheet if configured
        if (config.log) {
            const csvWriter = createCsvWriter({
                path: p.join(outDir, 'index.csv')
              , header:[
                    {
                        id: 'file'
                      , title: 'File'}
                  , {
                        id: 'startTime'
                      , title: 'Start Time'}
                  , {
                        id: 'duration'
                      , title: 'Duration (seconds)'}
                  , {
                        id: 'endTime'
                      , title: 'End Time'} ] })

            csvWriter.writeRecords(results.filter( res => res.status == 'fulfilled' ).map (( res ) => { return res.value})) } }
    catch (err) {
        throw err} })()}


//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInJpbmdFeHRyYWN0VHMuanN5Il0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBV0EsdUJBQXdCLEFBQUM7O0FBRXpCLG1CQUFvQixBQUFDO0FBQ3JCLHNCQUFzQixJQUFJO0FBQzFCLGtCQUFtQixBQUFDOztBQUVwQiwwQkFBMkIsQUFBQztBQUM1Qix1QkFBd0IsQUFBQztBQUN6Qix3QkFBeUIsQUFBQztBQUMxQix1QkFBd0IsQUFBQztBQUN6QixnQ0FBZ0MsWUFBWTs7QUFFNUM7QUFDQTs7QUFFQTtJQUNJLHNCQUF1QjtJQUN2Qix3QkFBeUI7SUFDekIsd0JBQXlCOztRQUV2QjtRQUNFLHlCQUEwQixBQUFDLGNBQWMsTUFBTSxtQkFBbUIsYUFBYTtRQUMvRTs7SUFFSjs7UUFFRSxlQUFnQiw0QkFBOEIsVUFBYzs7SUFFOUQsK0JBQWdDOztJQUVoQyxpQkFBa0IsQUFBQyxJQUFJO0lBQ3ZCLGlCQUFrQixBQUFDLFNBQVM7SUFDNUIsaUJBQWtCLEFBQUMsV0FBVyxFQUFFLHVCQUF1QjtJQUN2RCxpQkFBa0IsQUFBQyxJQUFJLEVBQUUsUUFBUTtJQUNqQyxpQkFBa0IsQUFBQyxJQUFJOztJQUV2QiwyQkFBNEI7SUFDNUIsc0NBQXVDO0lBQ3ZDLHVDQUF3QztJQUN4Qzs7O0lBR0E7UUFDSSx5QkFBMEIsa0JBQW1COztRQUU3Qyx3QkFBeUI7O0lBRTdCLGtCQUFtQixRQUFTLHdCQUF3Qjs7SUFFcEQ7UUFDSTtRQUNBLHFCQUFzQixBQUFDOztRQUV6QjtRQUNFO1FBQ0Esd0VBQXdFLFNBQVMsVUFBVyxBQUFDOzs7SUFHakcsZUFBZSxHQUFHLFlBQVksbUJBQW1CLElBQUksRUFBRSxhQUFhO0lBQ3BFLDBCQUEyQjs7UUFFekIsWUFBYSxlQUFlLGFBQWEsSUFBSSxXQUFZLG1CQUFtQixPQUFPOztRQUVuRixlQUFnQixTQUFTLGNBQWdCLG1CQUFxQjthQUN6RCxlQUFnQixXQUFXLFlBQWMsbUJBQXFCOztJQUVyRSxZQUFhOztJQUViOzs7O0lBSUE7UUFDSSxpQkFBa0I7V0FDakI7OztJQUdMO1FBQ0ksaUNBQWtDO1FBQ2xDLHlDQUEwQyw4QkFBc0IsMEJBQTJCOzs7WUFHekY7WUFDRTtnQkFDSSxhQUFjLFFBQVM7Z0JBQ3ZCOzt3QkFFUSxJQUFJO3dCQUNKLE9BQU87O3dCQUVQLElBQUk7d0JBQ0osT0FBTzs7d0JBRVAsSUFBSTt3QkFDSixPQUFPOzt3QkFFUCxJQUFJO3dCQUNKLE9BQU87O1lBRW5CLHVCQUF3QixxQ0FBc0MsV0FBVyxvQkFBZ0I7V0FDNUY7UUFDRCJ9