[![Build Status](https://travis-ci.org/mput/ostep-pdf-builder.svg?branch=master)](https://travis-ci.org/mput/ostep-pdf-builder)
# ostep-pdf-builder

Utility that download PDF parts of **Operating Systems: Three Easy Pieces** from [official site](http://pages.cs.wisc.edu/~remzi/OSTEP/), and build one massive PDF with bookmarks.

## Usage
```sh
docker run --rm -v "$(PWD):/data" -it mput/ostep-pdf-builder
```
As result, file "Operating_Systems-Three_Easy_Pieces.pdf" will be created at your current directory.
