
import fs from 'fs';
import path from 'path';
import url from 'url';
import cherio from 'cheerio';
import axios from 'axios';
import pdftk from 'node-pdftk';
import _ from 'lodash';

const fsPromises = fs.promises;

export default async (ostepLink, tempFolder) => {
  const ostepPageLink = ostepLink || 'http://pages.cs.wisc.edu/~remzi/OSTEP/';
  const partsFolderName = tempFolder || 'temp_book_parts';
  const currentDir = './';
  const partsFolderPath = path.resolve(currentDir, partsFolderName);
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

  const downloadParts = (fileNames) => {
    const loadFile = async (fileName) => {
      const href = url.resolve(ostepPageLink, fileName);
      const { data } = await axios({ method: 'get', url: href, responseType: 'arraybuffer' });
      const filePath = path.resolve(partsFolderPath, fileName);
      await fsPromises.writeFile(filePath, data);
      console.log('Downloaded file %s', fileName);
    };
    return Promise.all(fileNames.map(fileName => loadFile(fileName)));
  };

  const addPageCount = (bookPartsObjects) => {
    const extractPageNumber = (dumpData) => {
      const regexp = /^NumberOfPages:\s+(\d+)$/m;
      const match = dumpData.match(regexp);
      return match ? Number(match[1]) : null;
    };
    const getPageCount = async (part) => {
      if (!part.fileName) return { ...part, pageCount: 0 };
      const partPath = path.resolve(partsFolderPath, part.fileName);
      const pageCount = await pdftk
        .input(partPath)
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


  const mergePdf = (fileNames, bookMeta) => {
    const pathsToPdfParts = fileNames.map(fileName => path.resolve(partsFolderPath, fileName));
    return pdftk
      .input(pathsToPdfParts)
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
  const bookPartsObjects = getBookParts(data);
  const fileNames = bookPartsObjects
    .filter(({ fileName }) => !!fileName)
    .map(({ fileName }) => fileName);
  console.log('Books consists of %s parts, and %s pdf-files', bookPartsObjects.length, bookPartsObjects.filter(({ fileName }) => !!fileName).length);
  console.log('Book parts will be sved to: \n%s ', partsFolderPath);
  await fsPromises.mkdir(partsFolderPath).catch((err) => {
    if (err.code === 'EEXIST') {
      console.log('Folder already exist.');
    } else {
      throw err;
    }
  });
  await downloadParts(fileNames);
  const bookPartsWithPageCount = await addPageCount(bookPartsObjects);
  const { bookPartsWithPageNumber, numberOfPages } = await addPageNumber(bookPartsWithPageCount);
  const bookMeta = createBookMeta(bookPartsWithPageNumber, numberOfPages);
  await mergePdf(fileNames, bookMeta);
};