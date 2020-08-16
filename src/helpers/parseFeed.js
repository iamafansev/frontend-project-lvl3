import _ from 'lodash';

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

  const title = _.first(doc.getElementsByTagName('title'));
  const description = _.first(doc.getElementsByTagName('description'));
  const itemNodes = doc.getElementsByTagName('item');
  const items = _.map(itemNodes, parseItem);

  return { title: title.textContent, description: description.textContent, items };
};
