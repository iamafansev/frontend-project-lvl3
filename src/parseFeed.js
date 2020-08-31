import _ from 'lodash';

import { errorTypes } from './constants';

const parseItem = (itemNode) => {
  const { textContent: title } = itemNode.querySelector('title') || {};
  const { textContent: link } = itemNode.querySelector('link') || {};

  return { title, link };
};

export default (data) => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(data, 'application/xml');
  const errorElement = doc.querySelector('parsererror');

  if (errorElement) {
    const { textContent: errorMessage } = errorElement;
    const error = new Error(errorMessage);
    error.name = errorTypes.PARSE;
    throw error;
  }

  const { textContent: title } = doc.querySelector('title') || {};
  const { textContent: description } = doc.querySelector('description') || {};
  const itemNodes = doc.getElementsByTagName('item');
  const items = _.map(itemNodes, parseItem);

  return { title, description, items };
};
