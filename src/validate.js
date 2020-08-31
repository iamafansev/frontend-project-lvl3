import * as yup from 'yup';
import i18n from 'i18next';

export default (value, links) => {
  const schema = yup
    .string()
    .url(i18n.t('errors.urlInvalid'))
    .notOneOf(links, i18n.t('errors.urlAlreadyExists'));

  try {
    schema.validateSync(value);
    return null;
  } catch ({ message }) {
    return message;
  }
};
