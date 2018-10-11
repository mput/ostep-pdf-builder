// @flow

import fs from 'fs';
import path from 'path';
import url from 'url';
import cherio from 'cheerio';
import axios from 'axios';
import _ from 'lodash';

const fsPromises = fs.promises;

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

const downloadParts = async (dir, baseUrl, fileNames) => {
  const loadFile = async (fileName) => {
    const href = url.resolve(baseUrl, fileName);
    const { data } = await axios({ method: 'get', url: href });
    const filePath = path.resolve(dir, fileName);
    await fsPromises.writeFile(filePath, data);
    console.log('Downloaded file %s', fileName);
  };

  try {
    await Promise.all(fileNames.map(loadFile));
  } catch (e) {
    console.log(e);
  }
};

export default async () => {
  const ostepPageLink = 'http://pages.cs.wisc.edu/~remzi/OSTEP/';
  const partsFolderName = 'temp_book_parts';
  const partsFolderPath = path.resolve(partsFolderName);
  const { data } = await axios.get(ostepPageLink);
  const bookPartsObjects = getBookParts(data);
  const pdfLinks = bookPartsObjects
    .filter(({ fileName }) => !!fileName)
    .map(({ fileName }) => fileName);
  console.log('Books consists of %s parts, and %s pdf-files', bookPartsObjects.length, pdfLinks.length);
  console.log('Book parts will be sved to: \n%s ', partsFolderPath);

  await fsPromises.mkdir(partsFolderPath).catch((err) => {
    if (err.code === 'EEXIST') {
      console.log('Folder already exist.');
    } else {
      throw err;
    }
  });
  await downloadParts(partsFolderPath, ostepPageLink, pdfLinks);
};
