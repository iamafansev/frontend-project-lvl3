import * as yup from 'yup';

import { errorMessages } from '../constants';

const schema = yup.string().url(errorMessages.URL_INVALID);

export default (value, links) => {
  try {
    schema.validateSync(value);
    return links.includes(value)
      ? errorMessages.URL_ALREADY_EXISTST
      : null;
  } catch ({ message }) {
    return message;
  }
};
