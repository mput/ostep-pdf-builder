import fs from 'fs';
import path from 'path';
import url from 'url';
import cherio from 'cheerio';
import axios from 'axios';
import pdftk from 'node-pdftk';
import _ from 'lodash';

const fsPromises = fs.promises;

export default async (ostepLink) => {
  const ostepPageLink = ostepLink || 'http://pages.cs.wisc.edu/~remzi/OSTEP/';
  const currentDir = './';
  const outputFileName = 'Operating_Systems:_Three_Easy_Pieces.pdf';

  const getBookParts = (html) => {
    const $ = cherio.load(html);
    const rows = [];
    const table = $('td>b').first().parents('tbody').first();
    table.children().each((indRow, row) => {
      const resultsRow = [];
      $(row).children().each((indCell, c) => {
        const cell = $(c);
        const name = _.trim(cell.text());
        const fileName = cell.find('a').attr('href');
        if (name.length > 0) {
          resultsRow[indCell] = { name, fileName, chapterBegin: indRow === 0 };
        }
      });
      rows.push(resultsRow);
    });
    return (_.flatten(_.zip(...rows))).filter(elm => !!elm);
  };

  const addDataBuffers = (bookParts) => {
    const loadFile = async (part) => {
      if (!part.fileName) return { ...part, data: null };
      const href = url.resolve(ostepPageLink, part.fileName);
      const { data } = await axios({ method: 'get', url: href, responseType: 'arraybuffer' });
      // const filePath = path.resolve(partsFolderPath, part);
      // await fsPromises.writeFile(filePath, data);
      console.log('Downloaded file %s', part.fileName);
      return { ...part, data };
    };
    return Promise.all(bookParts.map(loadFile));
  };

  const addPageCount = (bookPartsObjects) => {
    const extractPageNumber = (dumpData) => {
      const regexp = /^NumberOfPages:\s+(\d+)$/m;
      const match = dumpData.match(regexp);
      return match ? Number(match[1]) : null;
    };
    const getPageCount = async (part) => {
      if (!part.fileName) return { ...part, pageCount: 0 };
      const pageCount = await pdftk
        .input(part.data)
        .dumpData()
        .output()
        .then((dataBuffer) => {
          const stringData = dataBuffer.toString('utf8');
          return extractPageNumber(stringData);
        });
      return { ...part, pageCount };
    };
    return Promise.all(bookPartsObjects.map(getPageCount));
  };

  const addPageNumber = bookPartsObjects => bookPartsObjects.reduce((acc, part) => {
    const partWithPageNumber = { ...part, pageNumber: acc.numberOfPages };
    const numberOfPages = acc.numberOfPages + part.pageCount;
    return {
      bookPartsWithPageNumber: [...acc.bookPartsWithPageNumber, partWithPageNumber],
      numberOfPages,
    };
  }, { bookPartsWithPageNumber: [], numberOfPages: 1 });

  const createBookMeta = (bookPartsObjects, numberOfPages) => {
    const bookmaks = bookPartsObjects.map(part => `BookmarkBegin\nBookmarkTitle: ${part.name}\nBookmarkLevel: ${part.chapterBegin ? 1 : 2}\nBookmarkPageNumber: ${part.pageNumber}`);
    return { Author: 'Remzi Arpaci', producer: `pdftk\nNumberOfPages: ${numberOfPages}\n${bookmaks.join('\n')}` }; // dirty hack to embed bookmark info to the end of metaInfo
    // TODO pull request to node-pdftk, add bookmark support.
  };


  const mergePdf = (bookParts, bookMeta) => {
    const partsDataBuffers = bookParts.filter(({ data }) => !!data).map(({ data }) => data);
    return pdftk
      .input(partsDataBuffers)
      .cat()
      .output()
      .then((buf) => {
        pdftk
          .input(buf)
          .updateInfo(bookMeta)
          .output(path.resolve(currentDir, outputFileName));
      });
  };


  const { data } = await axios.get(ostepPageLink);
  const bookParts = getBookParts(data);
  console.log('Books consists of %s bookmark, and %s pdf-files', bookParts.length, bookParts.filter(({ fileName }) => !!fileName).length);
  const bookPartsWithDataBuf = await addDataBuffers(bookParts);
  const bookPartsWithPageCount = await addPageCount(bookPartsWithDataBuf);
  const { bookPartsWithPageNumber, numberOfPages } = await addPageNumber(bookPartsWithPageCount);
  const bookMeta = createBookMeta(bookPartsWithPageNumber, numberOfPages);
  await mergePdf(bookPartsWithPageNumber, bookMeta);
};
