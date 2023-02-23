/**
 * Using .mjs file extension so all modules are ESM imports/exports (not require())
 * https://stackoverflow.com/a/62749284/14154848
 */

import {writeFileSync, readFileSync, createWriteStream} from 'fs';
import pdfjsLib from 'pdfjs-dist';


/**
 * Gets text from a PDF page by page.
 * 
 * Modified from source: https://stackoverflow.com/a/61278578/14154848
 * Needs full absolute path to PDF in order to work OR PDF must live in /web/
 * 
 * Solutions for app:
 * 1) Have user move/upload file to /web/ folder
 * 2) Possible non-path func workaround: https://stackoverflow.com/questions/57237875/how-to-extract-text-from-pdf
 */
async function getTextFromPDF(path) {
    let doc = await pdfjsLib.getDocument(path).promise;
    var pageTexts = [];
    
    // Loop through each page
    var numPages = doc.numPages;
    for(let i = 1; i <= numPages; i++) {
      let curr_page = await doc.getPage(i);
      let content = await curr_page.getTextContent();
      let strings = content.items.map(function(item) {
        return item.str;
      });
  
      pageTexts.push(strings.join());
    }
  
    console.log("Extracted text from", pageTexts.length, "pages.");
  
    return pageTexts;
}



/**
 * Reads learning questions from .txt file into array. Each page/paragraph is a subarray where each elem is a question.
 * @param {string} path - path to .txt file
 * @returns
 * array of learning questions, each elem is an array of questions for a page/paragraph
 */
function readQuestionsFromFile(path) {
  const text = readFileSync(path, {encoding:'utf-8', flag:'r'});
  const textArray = text.split('\n'); // might need to be \r\n if .txt file made manually on Windows

  let questionArr = [];
  let tempArr = [];
  textArray.forEach((elem) => {
    if(elem != ''){
      tempArr.push(elem);
    }
    else {
      questionArr.push(tempArr);
      tempArr = [];
    }
  });

  // push the last page's questions
  questionArr.push(tempArr);
  // filter out empty array elems
  questionArr = questionArr.filter(elem => elem.length != 0);

  return questionArr;
}


/**
 * Saves questionArray (array of arrays) to file, result.txt
 * @param {array} arr - array of page/paragraph arrays, where each elem is a question
 * @param {string} fname - name of file. Default is 'web/questions/result.txt'
 */
function saveQuestionsToFile(arr, fname = "web/questions/result.txt") {
  var file = createWriteStream(fname);
  file.on('error', function(err) { console.log("File write error:", err); });
  arr.forEach(pageArr => {
    pageArr.forEach(question => { file.write(question + '\n'); });
    file.write('\n');
  });
  file.end();
}



/**
 * Convert a text response from ChatGPT to an array of learning questions
 * @param {string} response - ChatGPT text response of learning questions for a page/paragraph
 * @returns {array}
 * an array of a page/paragraph's learning questions
 */
function structureResponse(response) {
  let tempArr = response.split('\n');
  
  // get rid of '' elements
  tempArr = tempArr.filter(question => question != '');

  // edge case where questions are not separated by \n
  if(tempArr.length == 1) {
    tempArr = tempArr[0].split('?');
    // get rid of '' elements
    tempArr = tempArr.filter(question => question != '');

    // remove "Questions: " from first elem
    if(tempArr[0].startsWith("Questions: ")) {
      tempArr[0] = tempArr[0].slice(11);
    }

    tempArr = tempArr.map(elem => elem.trim());
    tempArr = tempArr.map(elem => elem + '?');
  }
  
  return tempArr;
}


export {
  getTextFromPDF,
  readQuestionsFromFile,
  saveQuestionsToFile,
  structureResponse
};