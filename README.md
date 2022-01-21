Iterate over Ring Doorbell video files in a directory and extract the timestamp from the lower right corner. Either copy or rename the files by that timestamp and write a CSV log file with timestamp information for the videos.

Timestamps are in lexicographic sort order.

Detective Robert Sirois/13025
robertsirois@elpasoco.com
El Paso County Sheriff's Office
27 East Vermijo Avenue, Colorado Springs, CO 80903

# Rename Ring Doorbell Video with Timestamp

## Requirements

- Tesseract OCR binary
- `ffmpeg` binary
- `ffprobe` finary

## Usage (JSY)

[JSY Lang Docs](https://github.com/jsy-lang/jsy-lang-docs)

```
npm install .
jsy-node ringExtractTs.jsy ringDoorbellVideos output
```

## Usage (Vanilla Boring JavaScript)

```
npm install .
node dist/ringExtractTs.js ringDoorbellVideos output
```

## Configuration

You may configure certain behavior my modifying the `config/config.json` JSON file. This is necessary to specify the **path for `ffprobe`** as well as additional **timezone abbevations** which need to be offset properly.

Defaults:

```
{
    "log": true
    , "mode": "copy"
    , "ext": ".mp4"
    , "probe": true
    , "ffprobe_path": "/usr/local/bin/ffprobe"
    , "tesseract": {
        "lang": "eng"
        , "oem": 1
        , "psm": 7
    }
    , "timezoneTranslations": [
        {
            "abbr": "MDT"
            , "offset": "-0600"
        }
        , {
            "abbr": "MST"
            , "offset": "-0700"
        }
    ]
}
```

`log` will output a CSV file with timestamp information.

`mode` may be either `rename` or `copy`. Rename will rename the files in the input directory and copy will make a renamed copy in the output directory.

`ext` is a simple filter for the input directory to look at only files which end in that extension.

`probe` may be turned off but then the duration and end time will not be calculated in the output CSV file.

`ffprobe_path` must be the location of the binary on your system.

`tesseract` is an object containing configuration settings as defined in the [node-tesseract-ocr](https://github.com/zapolnoch/node-tesseract-ocr) library.

`timezoneTranslations` is an array of objects containing an `abbr` and `offset` where `abbr` is the textual component of the Ring Doorbell date as it appears in the video to be converted to a four-digit UTC offset `offset` which is used in the [moment](https://github.com/moment/moment) format.