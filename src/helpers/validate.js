import * as yup from 'yup';
import i18n from 'i18next';

const schema = yup.string().url(i18n.t('errors.urlInvalid'));

export default (value, links) => {
  try {
    schema.validateSync(value);
    return links.includes(value)
      ? i18n.t('errors.urlAlreadyExists')
      : null;
  } catch ({ message }) {
    return message;
  }
};
