/* eslint-disable no-param-reassign, no-console  */
import _ from 'lodash';
// import axios from 'axios';
import * as yup from 'yup';
import onChange from 'on-change';

const FILLING_PROCESS_STATUS = 'filling';
const SENDING_PROCESS_STATUS = 'sending';
const FAILED_PROCESS_STATUS = 'failed';
const FINISHED_PROCESS_STATUS = 'finished';

const NETWORK_ERROR_MESSAGE = 'Network Problems. Try again.';
const URL_INVALID_ERROR_MESSAGE = 'This must be a valid URL';
const URL_ALREADY_EXISTS_ERROR_MESSAGE = 'Rss already exists';

const schema = yup.string().url(URL_INVALID_ERROR_MESSAGE);

const isUrlAlreadyExistsError = (errorType) => errorType === 'url_exists';

const validate = (value, links) => {
  try {
    schema.validateSync(value);
    return links.includes(value)
      ? { type: 'url_exists', message: URL_ALREADY_EXISTS_ERROR_MESSAGE }
      : {};
  } catch ({ message }) {
    return { type: 'url_invalid', message };
  }
};

const updateStateAfterValidation = (error, fieldValue, watchedState) => {
  watchedState.form.valid = _.isEqual(error, {});
  watchedState.form.error = error.message;

  if (!isUrlAlreadyExistsError(error.type)) {
    watchedState.form.links.push(fieldValue);
  }
};

const renderErrors = (element, feedbackElement, error) => {
  if (feedbackElement.classList.contains('text-danger')) {
    element.classList.remove('is-invalid');
    feedbackElement.classList.remove('text-danger');
    feedbackElement.textContent = '';
  }

  if (!error) {
    return;
  }

  feedbackElement.classList.add('text-danger');
  feedbackElement.textContent = error;
  element.classList.add('is-invalid');
};

export default function App() {
  const state = {
    form: {
      processState: FILLING_PROCESS_STATUS,
      processError: null,
      valid: true,
      error: null,
      links: [],
    },
  };

  const form = document.querySelector('[data-form="rss-form"]');
  const urlField = form.elements.url;
  const submitButton = form.querySelector('button[type="submit"]');
  const feedbackElement = document.querySelector('.feedback');

  const processStateHandler = (processState) => {
    switch (processState) {
      case FAILED_PROCESS_STATUS:
        submitButton.disabled = false;
        break;
      case FILLING_PROCESS_STATUS:
        submitButton.disabled = false;
        break;
      case SENDING_PROCESS_STATUS:
        submitButton.disabled = true;
        break;
      case FINISHED_PROCESS_STATUS:
        submitButton.disabled = false;
        urlField.value = '';
        break;
      default:
        throw new Error(`Unknown state: ${processState}`);
    }
  };

  const watchedState = onChange(state, (path, value) => {
    switch (path) {
      case 'form.processState':
        processStateHandler(value);
        break;
      case 'form.valid':
        submitButton.disabled = !value;
        break;
      case 'form.error':
        submitButton.disabled = false;
        renderErrors(urlField, feedbackElement, value);
        break;
      default:
        break;
    }
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const { value: urlFieldValue } = urlField;

    const error = validate(urlFieldValue, watchedState.form.links);
    const isValidForm = _.isEqual(error, {});

    updateStateAfterValidation(error, urlFieldValue, watchedState);

    if (!isValidForm) {
      return;
    }

    watchedState.form.processState = SENDING_PROCESS_STATUS;

    try {
      watchedState.form.processState = FINISHED_PROCESS_STATUS;
    } catch (err) {
      watchedState.form.processError = NETWORK_ERROR_MESSAGE;
      watchedState.form.processState = FAILED_PROCESS_STATUS;
      throw err;
    }
  });
}
