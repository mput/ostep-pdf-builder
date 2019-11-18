[![Build Status](https://travis-ci.org/mput/ostep-pdf-builder.svg?branch=master)](https://travis-ci.org/mput/ostep-pdf-builder)
# Operating Systems: Three Easy Pieces to one massive PDF with bookmarks.
## ostep-pdf-builder

Utility that download PDF parts of **Operating Systems: Three Easy Pieces** from [official site](http://pages.cs.wisc.edu/~remzi/OSTEP/), and build one massive PDF with bookmarks.

## Usage
```sh
docker run --rm -v "$(pwd):/data" -it mput/ostep-pdf-builder
```
As result, file "Operating_Systems-Three_Easy_Pieces.pdf" will be created at your current directory.
[docker-hub](https://hub.docker.com/r/mput/ostep-pdf-builder)
