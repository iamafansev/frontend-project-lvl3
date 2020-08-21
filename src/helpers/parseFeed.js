import _ from 'lodash';

import { errorTypes } from '../constants';

const parseItem = (itemNode) => {
  const elements = itemNode.childNodes;
  const result = { title: '', link: '' };

  elements.forEach(({ tagName, textContent }) => {
    if (_.has(result, tagName)) {
      result[tagName] = textContent;
    }
  });

  return result;
};

export default (data) => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(data, 'application/xml');
  const errorElement = _.first(doc.getElementsByTagName('parsererror'));

  if (errorElement) {
    const { textContent: errorMessage } = errorElement;
    const error = new Error(errorMessage);
    error.name = errorTypes.PARSE;
    throw error;
  }

  const { textContent: title } = _.first(doc.getElementsByTagName('title')) || {};
  const { textContent: description } = _.first(doc.getElementsByTagName('description')) || {};
  const itemNodes = doc.getElementsByTagName('item');
  const items = _.map(itemNodes, parseItem);

  return { title, description, items };
};
